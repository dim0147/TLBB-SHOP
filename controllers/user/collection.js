const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

const helper = require('../../help/helper');

const collectionModel = require('../../models/collection');
const accountModel = require('../../models/account');

exports.checkBody = [
    body('account', 'Account không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createCollection = function(req, res) {
    waterfall([
        (cb) => { // Check if account is exist
            accountModel.findById(req.body.account, function(err, account){
                if(err){
                    console.log('Error in ctl/user/collection.js -> createCollection ' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau')
                }
                if(!account) return cb("Không tìm thấy tài khoản")
                cb(null, {account: account})
            });
        },
        (result, cb) => { // Check if collection is exist already
            collectionModel.findOne({account: result.account._id, user: req.user._id}, (err, collection) => {
                if(err){
                    console.log('Error in ctl/user/collection.js -> createCollection 01 ' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                if(collection) return cb("Bạn đã thêm vào bộ sưu tập rồi");
                cb(null, result)
            });
        },
        (result, cb) => { // Create collection
            const newCollection = new collectionModel({
                account: result.account._id,
                user: req.user._id
            });
            newCollection.save(err => {
                if(err){
                    console.log('Error in ctl/user/collection.js -> createCollection 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                // Save activity
                helper.createActivity({
                    type: 'add-collection',
                    account: result.account._id,
                    owner: req.user._id
                });
                cb(null, "Thêm tài khoản " + result.account.c_name + ' vào bộ sưu tập thành công');
            })
        }
    ], (err, result) => {
        if(err) return res.status(400).send(err);
        res.send(result);
    });
}

exports.deleteCollection = function(req, res){
    waterfall([
        (cb) => { // Check if account is exist
            accountModel.findById(req.body.account, (err, account) => {
                if(err){
                    console.log('Error in ctl/user/collection.js -> deleteCollection 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!account) return cb('Không tìm thấy tài khoản');
                cb(null, {account: account});
            });
        },
        (result, cb) => { // Check if collection is exists
            collectionModel.findOne({account: result.account._id, user: req.user._id}, (err, collection) => {
                if(err){
                    console.log('Error in user/collection.js -> deleteCollection 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!collection) return cb('Bạn chưa lưu tài khoản này');
                result.collection = collection;
                cb(null, result)
            });
        },
        (result, cb) => { // Delete collection
            collectionModel.findByIdAndDelete(result.collection._id, err => {
                if(err){
                    console.log('Error in ctl/user/collection.js -> deleteCollection 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                // Save activity
                helper.createActivity({
                    type: 'remove-collection',
                    account: result.account._id,
                    owner: req.user._id
                });
                cb(null, 'Huỷ lưu thành công')
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}