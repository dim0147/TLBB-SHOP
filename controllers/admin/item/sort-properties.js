const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const { body, param, validationResult} = require('express-validator');

const config = require('../../../config/config');
const helper = require('../../../help/helper');

const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');


exports.checkParam = [
    param('itemId', 'ID không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.renderPage = async (req, res) => {
    const { itemId } = req.params;
    // Find item
    const item = await itemModel.findById(itemId).select('name').catch(err => false);
    if(!item) return res.status(400).send('Không tìm thấy item')
    // Find property
    itemPropertyModel
    .find({itemId})
    .sort({order: 1})
    .populate({path: 'parent', select: 'name'})
    .lean()
    .exec((err, properties) => {
        if(err){
            console.log('Error in ctl/admin/item/sort-properties.js -> renderPage 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        res.render('admin/item/sort-properties', {title: 'Chỉnh sửa thứ tự Property', item, properties: properties, csrfToken: req.csrfToken()});
    })
}

exports.checkBody = [
    body('itemId', 'ID không hợp lệ').isMongoId(),
    body('data', 'data không hợp lệ').isArray().custom(value => {
        value.forEach(property => {
            if(!property._id || !mongoose.Types.ObjectId.isValid(property._id) || isNaN(property.order) || property.order < 0)
                throw new Error("Data không hợp lệ")
        })
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

function isDuplicateValueArray(array){
    return array.some(item => array.indexOf(item) !== array.lastIndexOf(item));
}

exports.updateOrderProperties = async (req, res) => {
    const { data, itemId } = req.body;
    const orderNumberArr = data.map(property => property.order);
    // Check duplicate order number
    if(isDuplicateValueArray(orderNumberArr))
        return res.status(400).send('Order không được trùng nhau')
    
    const listPropertyId = data.map(property => property._id);
    const session = await mongoose.startSession().catch(err => helper.handleStartSessionError)
    if(!session)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();
    waterfall([
        (cb) => { // Check if property is exist  and is in item
            itemPropertyModel.countDocuments(
                {
                    itemId,
                    _id: {$in: listPropertyId}
                },
                (err, count) => {
                    if(err){
                        console.log('Error in ctl/admin/item/sort-properties.js -> updateOrderProperties 01 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(count !== listPropertyId.length) return cb('Property không thuộc item id')
                    cb(null)
                })
        },
        (cb) => { // Update order property
            const listPromise = data.map(property => {
                return new Promise((resolve, reject) => {
                    itemPropertyModel
                    .updateOne(
                        {
                            _id: property._id
                        },
                        {
                            order: property.order
                        },
                        {
                            session
                        },
                        (err, upResult) => {
                            if(err){
                                console.log('Error in ctl/admin/item/sort-properties.js -> updateOrderProperties 02 ' + err);
                                return reject('Có lỗi xảy ra vui lòng thử lại sau')
                            }
                            if(upResult.ok !== 1) return reject('Không thể update order, vui lòng thử lại sau')
                            resolve();
                        })
                })
            });
            Promise.all(listPromise)
            .then(value => cb(null))
            .catch(err => cb(err))
        }
    ], async function(err, result){
        if(err){
            const isSuccess = await session.abortTransaction().catch(helper.handleAbortTransactionError);
            if(isSuccess === false)
                return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
            session.endSession();
            return res.status(400).send(err);
        }
        const isSuccess = await session.commitTransaction().catch(helper.handleCommitTransactionError);
        if(isSuccess === false) 
            return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
        res.send('Update thành công');
    })
}
