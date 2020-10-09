const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');
const dateFormat = require('dateformat');
const mongoose = require('mongoose');

const helper = require('../../../help/helper');

const propertyModel = require('../../../models/item_property');

exports.checkBody = [
    body('property_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.deleteProperty = async (req, res) => {
    const propertyId = req.body['property_id'];
    const session = await mongoose.startSession().catch(helper.handleStartSessionError);
    if(session === false)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    waterfall([
        (cb) => { // Find if have property
            propertyModel
            .findById(propertyId)
            .select('_id')
            .lean()
            .session(session)
            .exec((err, property) => {
                if(err){
                    console.log('Error in ctl/admin/property/delete-property.js -> deleteProperty 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!property) return cb('Không tìm thấy property')
                cb(null);
            })
        },
        (cb) => { // Delete sub-properties
            propertyModel.deleteMany(
                {
                    parent: propertyId
                },
                {
                    session
                },
                err => {
                    if(err){
                        console.log('Error in ctl/admin/property/delete-property.js -> deleteProperty 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    cb(null);
                }
            )
        },
        (cb) => { // Delete property
            propertyModel
            .findByIdAndDelete(propertyId, {session}, err => {
                if(err){
                    console.log('Error in ctl/admin/property/delete-property.js -> deleteProperty 03 ' + err);
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