const { body, param, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');

const addFieldModel = require('../../../models/add_field');

exports.checkParams = [
    param('id', 'id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.renderPage = (req, res) => {
    const addFieldId = req.params['id'];
    addFieldModel
    .findById(addFieldId)
    .select('_id name')
    .lean()
    .exec((err, addField) => {
        if(err){
            console.log('Error in ctl/admin/addfield/edit-addfield.js -> renderPage 01 ' + err);
            return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        if(!addField) return res.status(400).send('Không tìm thấy bổ sung')
        res.render('admin/addfield/edit-addfield', {title: 'Chỉnh sửa bổ sung', addField, csrfToken: req.csrfToken()})
    })
}

exports.checkBody = [
    body('name', 'name không hợp lệ').isString().notEmpty(),
    body('addField_id', 'id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.editAddField = (req, res) => {
    const { name, addField_id } = req.body;
    
    waterfall([
        (cb) => { // Check if bosung is exist
            addFieldModel
            .countDocuments({_id: addField_id}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/addfield/edit-addfield.js -> editAddField 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không tìm thấy bổ sung')
                cb(null);
            })
        },
        (cb) => { // Check if name to change is exist already
            addFieldModel.countDocuments({name, _id: {$ne: addField_id }}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/addfield/edit-addfield.js -> editAddField 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count !== 0) return cb(`Bổ sung "${name}" đã tồn tại`)
                cb(null);
            })
        },
        (cb) => { // Update bosung
            addFieldModel
            .updateOne(
                {
                    _id: addField_id,
                },
                {
                    name
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/admin/addfield/edit-addfield.js -> editAddField 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.ok !== 1) return cb('Không thể update, vui lòng thử lại sau')
                    cb(null);
                }
            )
        }
    ], function(err, result){
        if(err) return res.status(400).send(err)
        res.send(`Cập nhật bổ sung thành công`);
    })
}
