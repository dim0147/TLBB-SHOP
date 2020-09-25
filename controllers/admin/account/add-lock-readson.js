const { param, body, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
const mongoose = require('mongoose');

const helper = require('../../../help/helper');
const socketApi = require('../../../io/io');

const accountModel = require('../../../models/account');
const lockReasonModel = require('../../../models/lock-reason');

exports.checkParam = [
    param('id', 'id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.render('admin/account/add-lock-reason', {title: 'Khoá tài khoản', error: errors.array()[0].msg})
        next();
    }
]

exports.renderPage = function(req, res){

    waterfall([
        (cb) => {
            accountModel.findById(req.params.id, (err, account) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(account === null) return cb('Không tìm thấy tài khoản');
                cb(null, {account: account})
            });
        },
        (result, cb) => {
            lockReasonModel.find({account: result.account._id}, (err, reasons) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                result.reasons = reasons;
                cb(null, result);
            })
        }
    ], (err, result) => {
        if(err) return res.render('admin/account/add-lock-reason', {title: 'Khoá tài khoản', error: err})
        res.render('admin/account/add-lock-reason', {title: 'Khoá tài khoản', account: result.account, reasons: result.reasons, csrfToken: req.csrfToken()})
    });
    
}

exports.checkBody = [
    body('id', 'Id không hợp lệ').isMongoId(),
    body('reason', 'Lí do không hợp lệ').notEmpty().isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg)
        next();
    }
]

exports.addLockReason = async function (req, res){
    const session = await mongoose.startSession().catch(err => console.log(err));
    if(typeof session === 'undefined')
        return res.status(400).send("Có lỗi xảy ra, vui lòng thử lại sau");

    session.startTransaction(); 
    waterfall([
        (cb) => { // Find account
            accountModel.findById(req.body.id, null, {session: session}, (err, account) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau')
                if(account === null) return cb('Không tìm thấy tài khoản')
                cb(null, {account: account});
            });
        },
        (result, cb) => { // Check if account is lock already or not, if not lock that account
            if(result.account.status === 'lock') return cb(null, result)
            accountModel.findByIdAndUpdate(result.account._id, {status: 'lock'}, {session: session}, err => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau')
                // Perform locking, use for create notification
                result.performLocked = true;
                cb(null, result);
            });
        },
        (result, cb) => { // Check if reason is exist
            lockReasonModel.findOne({reason: req.body.reason, account: result.account._id}, null, {session: session}, (err, reason) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau')
                if(reason !== null) return cb("Lí do '" + req.body.reason + "' đã tồn tại trên tài khoản " + result.account.c_name)
                cb(null, result);
            });
        },
        (result, cb) => { // Create reason
            const payload = new lockReasonModel({
                account: result.account._id,
                user: req.user._id,
                reason: req.body.reason
            });
            payload.save({session: session}, function(err) {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau')
                // If perform lock then create notification
                if(result.performLocked){
                    // Create notification for account owner
                    helper.createNotification({
                        type: 'admin-lock-account',
                        account: result.account._id,
                        owner: result.account.userId
                    });
                    // Emit socket event about lock account to owner
                    helper.pushNotification(result.account.userId, {
                        event: 'push_notification',
                        value: {
                            type: 'admin-lock-account',
                            link: '/user/profile/accounts?id='+result.account._id,
                            text:  'Tài khoản "' + (result.account.title.length > 20 ? result.account.title.substring(0, 20) + '...' : result.account.title) + '" đã bị khoá'
                        }
                    });
                }
                return cb(null, 'Khoá tài khoản ' + result.account.c_name + ' thành công!');
            });
        }
    ], async function(err, result){
        if(err){
            const rs = await session.abortTransaction().catch(err => console.log(err));
            if(!rs) return res.status(400).send(err);
            session.endSession();
            return res.status(400).send(err);
        }
        const rs = await session.commitTransaction().catch(err => console.log(err));
        if(!rs) return res.status(400).send('Có lỗi xảy ra, vui lòng thử lại sau');
        session.endSession();
        res.send(result);
    });
}