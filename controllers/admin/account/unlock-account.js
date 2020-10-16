const mongoose = require('mongoose');
const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

const helper = require('../../../help/helper');

const accountModel = require('../../../models/account');
const lockReasonModel = require('../../../models/lock-reason');

exports.checkBodyUnLock = [
    body('id', 'Id account Không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.unlockAccount = async (req, res) => {
    const session = await mongoose.startSession().catch(err => helper.handleStartSessionError);
    if(session === false)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    const { id: accountId } = req.body;
    waterfall([
        (cb) => { // Check if account is exist and is locked
            accountModel
            .findById(accountId)
            .select('status')
            .lean()
            .session(session)
            .exec((err, account) => {
                if(err){
                    console.log('Error in ctl/admin/account/unlock-account.js -> unlockAccount 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!account) return cb("Không tìm thấy tài khoản")
                if(account.status !== 'lock') return cb('Tài khoản không bị khoá')
                cb(null);
            })
        },
        (cb) => { // Delete all lock reason of account
            lockReasonModel
            .deleteMany(
                {
                    account: accountId
                },
                {
                    session
                },
                (err, delResult) => {
                    if(err){
                        console.log('Error in ctl/admin/account/unlock-account.js -> unlockAccount 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(delResult.ok !== 1) return cb('Xoá reason không thành công')
                    cb(null);
            })
        },
        (cb) => { // Mark account as pending
            accountModel
            .updateOne(
                {
                    _id: accountId
                },
                {
                    status: 'pending'
                },
                {
                    session
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/admin/account/unlock-account.js -> unlockAccount 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.nModified !== 1) return cb('Update không thành công')
                    cb(null);
                }
            )
        }
    ], async (err, result) => {
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
        res.send('Mở khoá thành công');
    })
}