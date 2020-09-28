const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

const config = require('../../config/config');
const helper = require('../../help/helper');

const accountModel = require('../../models/account');

exports.checkBody = [
    body('id', 'Id không hợp lệ').isMongoId(),
    body('status', 'Status không hợp lệ').isIn(config.account.status),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg)
        next();
    }
]

exports.markDoneAccount = function (req, res){
    waterfall([
        (cb) => { // Find account by id
            accountModel.findById(req.body.id, function (err, account){
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                // If account not found
                if(account === null) return cb("Không tìm thấy tài khoản")
                // If not correct user
                if(account.userId.toString() != req.user._id.toString()) return cb("Bạn không có quyền đánh dấu tài khoản này");
                // If account is not pending
                if(account.status != 'pending') return cb("Tài khoản này không thể đánh dấu")
                cb(null, {account: account});
            });
        },
        (result, cb) => {
            accountModel.updateOne({ _id: result.account._id }, { status: 'done' }, (err) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                
                // Notify for user chat about current status of account
                helper.pushStatusAccount(result.account._id, null, 'done', req.user._id);

                cb(null, 'Đánh dấu tài khoản ' + result.account.c_name + ' hoàn thành thành công!');
            });
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    });
}