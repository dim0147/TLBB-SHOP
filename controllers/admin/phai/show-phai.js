const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
const { body, validationResult } = require('express-validator');

const phaiModel = require('../../../models/phai');

exports.renderShowPhai = (req, res) => {
    phaiModel
    .find()
    .select('name createdAt updatedAt')
    .lean()
    .exec((err, phais) => {
        if(err){
            console.log('Error in ctm/admin/phai/show-phai.js -> renderShowPhai 01 ' + err);
            return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        res.render('admin/phai/show-phai', {title: 'Hiển thị tất cả phái', phais, dateFormat, csrfToken: req.csrfToken()})
    })
}

exports.checkBodyEditPhai = [
    body('phai_id', 'Id không hợp lệ').isMongoId(),
    body('phai_name', 'Name không hợp lệ').isString().notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.editPhai = (req, res) => {
    const {'phai_id': phaiId, 'phai_name': phaiName} = req.body;
    waterfall([
        (cb) => { // Check if phai exist
            phaiModel
            .countDocuments({_id: phaiId}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/phai/show-phai.js -> editPhai 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không tìm thấy phái')
                cb(null);
            })
        },
        (cb) => { // Check if name to replace is exist
            phaiModel
            .countDocuments({name: phaiName}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/phai/show-phai.js -> editPhai 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count !== 0) return cb(`Phái ${phaiName} đã tồn tại`)
                cb(null);
            })
        },
        (cb) => { // Update new name
            phaiModel
            .updateOne(
                {
                    _id: phaiId
                },
                {
                    name: phaiName
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/admin/phai/show-phai.js -> editPhai 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.nModified !== 1) return cb('Update không thành công')
                    cb(null, 'Update thành công');
                }
            )
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}

exports.checkBodyDeletePhai = [
    body('phai_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.deletePhai = (req, res) => {
    const { 'phai_id': phaiId } = req.body;
    waterfall([
        (cb) => { // Check if phai exist
            phaiModel
            .countDocuments({_id: phaiId}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/phai/show-phai.js -> deletePhai 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không tìm thấy phái')
                cb(null);
            })
        },
        (cb) => { // Delete phai
            phaiModel
            .deleteOne({_id: phaiId}, (err, delResult) => {
                if(err){
                    console.log('Error in ctl/admin/phai/show-phai.js -> deletePhai 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(delResult.deletedCount !== 1) return cb('Không thể xoá vui lòng thử lại sau');
                cb(null, 'Xoá thành công');
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
} 