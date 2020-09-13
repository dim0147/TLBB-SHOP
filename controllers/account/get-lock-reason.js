const { query, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
dateFormat.i18n = {
    dayNames: [
        'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7',
        'Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'
    ],
    monthNames: [
        'Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12',
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ],
    timeNames: [
        'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
    ]
};

const accountModel = require('../../models/account');
const lockReasonModel = require('../../models/lock-reason');

exports.checkQuery = [
    query('id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getLockReasonAccount = (req, res) => {
    waterfall([
        (cb) => {
            accountModel.findById(req.query.id, (err, account) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(account === null) return cb('Không tìm thấy tài khoản');
                cb(null, {account: account})
            });
        },
        (result, cb) => {
            if(result.account.userId.toString() != req.user._id) return cb("Bạn không có quyền thực hiện truy cập này!");
            lockReasonModel.find({account: result.account._id}, null, {sort: {createdAt: 1}}, (err, reasons) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                result.reasons = reasons;
                return cb(null, result);
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result.reasons);
    });
}