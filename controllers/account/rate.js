const rateModel = require('../../models/rate');
const accountModel = require('../../models/account')
const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator')

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
    //  Check if no login
    if(!req.isAuthenticated())  return res.status(403).send("Đăng nhập để tiếp tục");
    waterfall([
        //  Check if account is exist
        cb => {
            accountModel.findOne({_id: req.body.accountId}, (err, account) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                cb(null);
            });
        },
        //  Check if rate is exist, update
        cb => {
            rateModel.findOne({account: req.body.accountId, user: req.user._id}, (err, rate) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(rate !== null) return cb(null, rate)
                return cb(null, false)
            });
        },
        //  Update if exist
        (rate, cb) => {
            if(rate === false) return cb(null, false)
            rateModel.findOneAndUpdate({_id: rate._id}, {rate: req.body.rate}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                cb(null, true);
            });
        },
        // Create new rate
        (isExist, cb) => {
            if(isExist) return cb(null, "Cập nhật đánh giá thành công!!!")
            rateModel.create({account: req.body.accountId, user: req.user._id, rate: req.body.rate}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                cb(null, "Đánh giá tài khoản thành công!!!")
            })
        }
    ], function (err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}