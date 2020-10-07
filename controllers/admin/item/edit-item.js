const waterfall = require('async-waterfall');
const { body, param, validationResult} = require('express-validator');
const mongoose = require('mongoose');

const config = require('../../../config/config');

const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');

exports.checkParam = [
    param('itemId', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.renderPage = (req, res) => {
    const itemId = req.params['itemId']
    itemModel
    .findById(itemId)
    .select('name slug')
    .lean()
    .exec((err, item) => {
        if(err){
            console.log('Error in ctl/admin/item/edit-item.js -> renderPage ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        if(!item) return res.status(400).send('Không tìm thấy item')
        res.render('admin/item/edit-item', {title: 'Chỉnh sửa Item', item: item, csrfToken: req.csrfToken()});
    })
   
}

exports.checkBody = [
    body('itemId', 'Id không hợp lệ').isMongoId(),
    body('name', 'name không hợp lệ').isString(),
    body('slug', 'slug không hợp lệ').isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.updateItem = (req, res) => {
    const { itemId, name, slug } = req.body;
    waterfall([
        (cb) => { // Find item is exist
            itemModel
            .findById(itemId)
            .select('_id')
            .lean()
            .exec((err, item) => {
                if(err){
                    console.log('Error in ctl/admin/item/edit-item.js -> updateItem 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!item) return cb('Không tìm thấy item');
                cb(null);
            })
        },
        (cb) => { // Check name is exist
            itemModel
            .findOne({name: {$regex: name, $options: 'i'}, _id: {$ne: itemId}})
            .select('_id')
            .lean()
            .exec((err, item) => {
                if(err){
                    console.log('Error in ctl/admin/item/edit-item.js -> updateItem 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(item) return cb(`Item "${name}" đã tồn tại`);
                cb(null);
            })
        },
        (cb) => { // Check slug is exist
            itemModel
            .findOne({slug, _id: {$ne: itemId}})
            .select('_id')
            .lean()
            .exec((err, item) => {
                if(err){
                    console.log('Error in ctl/admin/item/edit-item.js -> updateItem 04 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(item) return cb(`Slug "${slug}" đã tồn tại`);
                cb(null);
            })
        },
        (cb) => {
            itemModel
            .updateOne(
                {
                    _id: itemId
                },
                {
                    name,
                    slug
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/admin/item/edit-item.js -> updateItem 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.nModified === 0) return cb('Có lỗi khi update')
                    cb(null);
                }
            )
        }
    ], function(err, result){
        if(err) return res.status(400).send(err)
        res.send('Update thành công');
    })
}