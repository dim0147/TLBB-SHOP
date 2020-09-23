const rateModel = require('../../models/rate');
const accountModel = require('../../models/account')
const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

const helper = require('../../help/helper');
const socketApi = require('../../io/io');

exports.validateBody = [
    body('rate', 'Thiếu trường').isInt({min:1, max: 5}),
    body('accountId', 'Thiếu trường').notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
          return res.status(400).send(errors.array()[0].msg);
        next();
    },
]

exports.createRating = function(req, res){
    waterfall([
        //  Check if account is exist
        cb => {
            accountModel.findOne({_id: req.body.accountId}, {}, {populate: 'userId'}, (err, account) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(account === null) return cb("Không tìm thấy tài khoản")
                if(account.status.toString() != 'pending') return cb("Không thể đánh giá tài khoản này")
                if(account.userId && account.userId.status != 'normal') return cb("Tài khoản thuộc người đăng không hợp lệ")
                cb(null, account);
            });
        },
        //  Check if rate is exist
        (account, cb) => {
            rateModel.findOne({account: req.body.accountId, user: req.user._id}, (err, rate) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(rate !== null) return cb(null, rate, account)
                return cb(null, false, account)
            });
        },
        //  Update if exist
        (rate, account, cb) => {
            if(rate === false) return cb(null, false, account)
            rateModel.findOneAndUpdate({_id: rate._id}, {rate: req.body.rate}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                // Save activity
                helper.createActivity({
                    type: 'update-rate-account',
                    rate: req.body.rate,
                    account: req.body.accountId,
                    owner: req.user._id
                });
                cb(null, true, account);
            });
        },
        // Create new rate
        (isExist, account, cb) => {
            if(isExist) return cb(null, "Cập nhật đánh giá thành công!!!")
            rateModel.create({account: req.body.accountId, user: req.user._id, rate: req.body.rate}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                // Save activity
                helper.createActivity({
                    type: 'rate-account',
                    account: req.body.accountId,
                    rate: req.body.rate,
                    owner: req.user._id
                });
                // Create notification
                helper.createNotification({
                    type: 'rate-my-account',
                    account: req.body.accountId,
                    owner: account.userId._id,
                    rateOwner: req.user._id
                })
                cb(null, "Đánh giá tài khoản thành công!!!");

                // Check if owner rate his own account
                if(account.userId._id.toString() != req.user._id.toString()){
                    // Emit event to user socket about have person rate their account
                    helper.getUserConnections(account.userId._id)
                    .then(sockets => {
                        if(sockets){
                            socketApi.emitSockets(sockets, {
                                event: 'push_notification',
                                value: {
                                    type: 'rate-my-account',
                                    link: '/account/view-account/'+account._id,
                                    text: req.user.name + ' vừa đánh giá tài khoản của bạn: "'+(account.title.length > 20 ? account.title.substring(0, 20) + '...' : account.title)+'"'
                                }
                            });
                        }
                    });
                }
            })
        }
    ], function (err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}