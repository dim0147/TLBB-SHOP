const waterfall = require('async-waterfall');
const {body, validationResult} = require('express-validator');
const mongoose = require('mongoose');

const config = require('../../../config/config');
const helper = require('../../../help/helper');

const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');

exports.checkBodyDeleteItem = [
    body('item_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.deleteItem = async (req, res) => {
    const session = await mongoose.startSession().catch(err => helper.handleStartSessionError);
    if(session === false)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    const itemId = req.body['item_id'];

    waterfall([
        (cb) => {
            itemModel
            .findById(itemId)
            .select('_id')
            .lean()
            .session(session)
            .exec((err, item) => {
                if(err){
                    console.log('Error in ctl/admin/item/delete-item.js -> deleteItem 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!item) return cb('Không tìm thấy item');
                cb(null, item);
            })
        },
        (item, cb) => {
            itemPropertyModel.deleteMany({itemId: itemId}, {session}, err => { 
                if(err){
                    console.log('Error in ctl/admin/item/delete-item.js -> delete item02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, item);
            })
        },
        (item, cb) => {
            itemModel.findByIdAndDelete(itemId, {session}, err => {
                if(err){
                    console.log('Error in ctl/admin/item/delete-item.js -> deleteItem 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null)
            })
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
        res.send('Xoá thành công');
    })
}