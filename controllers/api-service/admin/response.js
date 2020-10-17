const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const helper = require('../../../help/helper');

const reportModel = require('../../../models/report');
const reportResponseModel = require('../../../models/report_response');

exports.checkBodyCreateResponse = [
    body('report_id', 'Id không hợp lệ').isMongoId(),
    body('response_text', 'Text phải ít nhất 5 kí tự').isString().isLength({min: 5}),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createResponse = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const { 'report_id': reportId, 'response_text': responseText } = req.body;

    waterfall([
        (cb) => { // Check if report is exist
            reportModel
            .countDocuments({_id: reportId}, (err, count) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/response.js -> createResponse 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không tìm thấy báo cáo');
                cb(null);
            })
        },
        (cb) => { // Create response
            reportResponseModel
            .create([
                {
                    report: reportId,
                    text: responseText,
                    by: req.user._id
                }
            ], 
            {session}, 
            (err, response) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/response.js -> createResponse 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(response.length === 0) return cb('Không thể tạo response');
                cb(null);
            });
        },
        (cb) => { // Update report status to done
            reportModel
            .updateOne(
                {
                    _id: reportId
                },
                {
                    status: 'done'
                },
                {session},
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/api-service/admin/response.js -> createResponse 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.ok !== 1) return cb('Không thể update report')
                    cb(null, 'Phản hồi thành công');
                }
            )
        }
    ], async (err, result) => {
        if(err){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        }
        await session.commitTransaction();
        session.endSession();
        res.send(result);
    })
}

