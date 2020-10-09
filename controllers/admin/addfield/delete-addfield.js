const { body, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
const mongoose = require('mongoose');

const helper = require('../../../help/helper');

const addFieldModel = require('../../../models/add_field');
const accountLinkAddFieldModel = require('../../../models/account-link-addfield');

exports.checkBody = [
    body('addField_id', 'id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.deleteAddField = async (req, res) => {
    const { addField_id } = req.body;
    const session = await mongoose.startSession().catch(helper.handleStartSessionError);
    if(session === false)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    waterfall([
        (cb) => { // Check if exist
            addFieldModel
            .countDocuments({_id: addField_id}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/addfield/delete-addfield.js -> deleteAddField 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không tìm thấy bổ sung')
                cb(null);
            })
        },
        (cb) => { // Delete account link add field
            accountLinkAddFieldModel
            .deleteMany(
                {
                    fieldId: addField_id
                },
                { session },
                err => {
                    if(err){
                        console.log('Error in ctl/admin/addfield/delete-addfield.js -> deleteAddField 02  ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    cb(null);
                }
            )
        },
        (cb) => { // Delete bosung
            addFieldModel
            .findByIdAndDelete(addField_id, {session}, err => {
                if(err){
                    console.log('Error in ctl/admin/addfield/delete-addfield.js -> deleteAddField 03  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null);
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