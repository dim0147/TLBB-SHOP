const mongoose = require('mongoose');
const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

const itemPropertyModel = require('../../../models/item_property');

exports.renderPage = (req, res) => {
    if(typeof req.params.id === 'undefined' || !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.render('admin/property/edit-property', {title: 'Chỉnh sửa proprty item', error: 'Id không hợp lệ'});
    
    itemPropertyModel.findById(req.params.id).populate('itemId').exec((err, property) => {
        if(err){
            console.log('Có lỗi khi get property, source: CTL/admin/property/edit-property -> renderPage1' + err);
            return res.render('admin/property/edit-property', {title: 'Chỉnh sửa property item', error: 'Có lỗi xảy ra, vui lòng thử lại sau'});
        }
        if(property === null)
           return res.render('admin/property/edit-property', {title: 'Chỉnh sửa property item', error: 'Không tìm thấy property'});
        res.render('admin/property/edit-property', {title: 'Chỉnh sửa property item', property: property, csrfToken: req.csrfToken()});
    });
}

exports.checkBodyEditProperty = [
    body('_id', 'Id không hợp lệ').isMongoId(),
    body('name', 'Tên không được trống').notEmpty(),
    body('slug', 'Không thấy trường yêu cầu').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.editProperty = (req, res) => {
    waterfall([
        (cb) => {   // Check if exist
            itemPropertyModel.findById(req.body._id).exec(function (err, property){
                if(err){
                    console.log('Có lỗi khi get property, source: CTL/admin/property/edit-property -> editProperty1' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(property === null)
                    return cb("Không tìm thấy property");
                cb(null, {property: property})
            });
        },
        (result, cb) => { // Check name if exist
            itemPropertyModel.countDocuments({name: {$regex: req.body.name, $options: 'i'}, itemId: result.property.itemId, _id: {$ne: req.body._id}}, (err, count) => {
                if(err){
                    console.log('Có lỗi khi update property, source: CTL/admin/property/edit-property -> editProperty3' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(count !== 0) return cb(`Property "${req.body.name}" đã tồn tại`)
                cb(null, result);
            })
        },
        (result, cb) => { // Check slug if exists
            if(req.body.slug === '') return cb(null, result);
            itemPropertyModel.countDocuments({slug: req.body.slug, itemId: result.property.itemId, _id: {$ne: req.body._id}}, (err, count) => {
                if(err){
                    console.log('Có lỗi khi update property, source: CTL/admin/property/edit-property -> editProperty4' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(count !== 0) return cb(`Slug "${req.body.slug}" đã tồn tại`)
                cb(null, result);
            })
        },
        (result, cb) => {   // Update property
            let payload = {
                name: req.body.name
            }
                payload.slug = req.body.slug;
            itemPropertyModel.updateOne({_id: result.property._id}, payload, err => {
                if(err){
                    console.log('Có lỗi khi update property, source: CTL/admin/property/edit-property -> editProperty2' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                cb(null, "Chỉnh sửa thành công!");
            });
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })   
}