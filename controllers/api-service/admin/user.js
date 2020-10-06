const { query, body, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
const mongoose = require('mongoose');

const helper = require('../../../help/helper');

const userModel = require('../../../models/user');
const accountModel = require('../../../models/account');
const lockReasonModel = require('../../../models/lock-reason');

// --------------------------------USER dashboard----------------------------------------
exports.checkQueryGetUserRegisterLastNumbMonths = [
    query('total_months', 'Tháng không hợp lệ').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getUserRegisterLastNumbMonths = (req, res) => {
    const monthAgo = helper.getMonthAgo(Number(req.query.total_months));
    userModel.countDocuments({ created_at: {$gte: monthAgo} }, (err, count) => {
        if(err){
            console.log('Error in ctl/api-service/admin/user.js -> getUserRegisterLastNumbMonths 01  ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        }
        res.send({count});
    })
}

exports.checkQueryGetTopUserAtTime= [
    query('time', 'Thời gian không hợp lệ').isISO8601(),
    query('total_users', 'User không hợp lệ').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getTopUserAtTime= (req, res) => {
    const timeAgo = new Date(req.query.time);
    const totalUser = Number(req.query.total_users);
    accountModel.aggregate([
        {
            $match: {createdAt: {$gte: timeAgo} }
        },
        {
            $group: {
                _id: '$userId',
                totalCount: {$sum: 1}
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $addFields: {
                user: {$cond: [
                    {$anyElementTrue: ['$user']},
                    {$arrayElemAt: ['$user', 0]},
                    null
                ]}
            }
        },
        {
            $project: {
                user: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                    status: 1,
                    urlImage: 1
                },
                totalCount: 1
            }
        },
        {
            $sort: {totalCount: -1}
        },
        {
            $limit: totalUser
        }
    ], function(err, result){
        if(err){
            console.log('Error in ctl/api-service/admin/user.js -> GetTopUserLastNumbMonths 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        res.send(result);
    })
}

// --------------------------------USER LOCK ACCOUNT----------------------------------------
exports.checkBodyLockUser = [
    body('user_id', 'Id không hợp lệ').isMongoId(),
    body('reason', 'Lí do không hợp lệ').isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.lockUser = async (req, res) => {
    const userId = req.body['user_id'];
    const reason = req.body['reason'];
    const session = await mongoose.startSession().catch(helper.handleStartSessionError);
    if(session === false)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');

    session.startTransaction();

    waterfall([
        (cb) => { // Find user
            userModel
            .findById(userId)
            .select('status role')
            .lean()
            .session(session)
            .exec((err, user) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> lockUser 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!user) return cb('Không tìm thấy người dùng');
                cb(null, user);
            })
        },
        (user, cb) => { // Check role
            // If target user is moderator, make sure only admin can lock only
            if(user.role === 'moderator' && req.user.role !== 'admin')
                return cb('Bạn không có quyền khoá tài khoản này')
            // If target user is admin, nobody can lock admin
            else if(user.role === 'admin')
                return cb('Bạn không có quyền khoá tài khoản này')
            cb(null, user);
        },
        (user, cb) => { // Check if reason is exist or not
            lockReasonModel
            .findOne({user: userId, reason})
            .select('_id')
            .lean()
            .session(session)
            .exec((err, reasonExist) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> lockUser 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(reasonExist) return cb(`Lí do "${reason}" đã tồn tại`)
                cb(null, user);
            })
        },
        (user, cb) => { // Lock account
            // Check if user is lock already
            if(user.status === 'lock') return cb(null, user);
            userModel
            .updateOne({_id: userId}, 
            {
                status: 'lock'
            }, 
            {session},
            (err, upResult) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> lockUser 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(upResult.nModified === 0) return cb('Không khoá tài khoản được, vui lòng thử lại sau')
                cb(null, user);
            })
        },
        (user, cb) => { // Create lock reason
            lockReasonModel.create([
                {
                    user: userId,
                    reason,
                    lock_by: req.user._id
                }
            ],
            {session},
            (err, newReason) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> lockUser 04 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, newReason);
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
        res.send('Khoá thành công');
    })
}

exports.checkBodyUnLockUser = [
    body('user_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.unlockUser = async (req, res) => {
    const userId = req.body['user_id'];
    const session = await mongoose.startSession().catch(helper.handleStartSessionError);
    if(session === false)
        return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();
    
    waterfall([
        (cb) => { // Get user
            userModel
            .findById(userId)
            .select('status role')
            .lean()
            .session(session)
            .exec((err, user) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> unlockUser 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!user) return cb('Không tìm thấy người dùng');
                cb(null, user)
            })
        },
        (user, cb) => { // Check role
            // Only admin can unlock moderator
            if(user.role === 'moderator' && req.user.role !== 'admin')
                return cb('Bạn không có quyền mở khoá tài khoản này');
            // Cannot unlock Admin  
            else if(user.role === 'admin')
                return cb('Bạn không có quyền mở khoá tài khoản này');
            if(user.status !== 'lock') return cb('Tài khoản không bị khoá');
            cb(null, user);
        },
        (user, cb) => { // Unlock user
            userModel
            .updateOne(
                {
                    _id: userId
                }, 
                {
                    status: 'normal'
                },
                {session},
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/api-service/admin/user.js -> unlockUser 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.nModified === 0) return cb('Không mở khoá tài khoản được, vui lòng thử lại sau')
                    cb(null, user);
                }
            )
        },
        (user, cb) => { // Remove lock reason 
            lockReasonModel
            .deleteMany(
                {
                    user: userId
                },
                {session},
                (err, delResult) => {
                    if(err){
                        console.log('Error in ctl/api-service/admin/user.js -> unlockUser 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    cb(null, user);
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
        res.send('Mở khoá thành công');
    })
}

exports.checkQueryGetLockUserReason = [
    query('user_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getLockUserReason = (req, res) => {
    console.log('Chạy');
    const userId = req.query['user_id'];
    waterfall([
        (cb) => { // Get user
            userModel
            .findById(userId)
            .select('status role')
            .lean()
            .exec((err, user) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> getLockUserReason 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!user) return cb('Không tìm thấy người dùng')
                cb(null, user)
            })
        },
        (user, cb) => { // Check role
            if(user.role === 'admin') return cb('Không thể xem tài khoản này')
            if(user.role === 'moderator' && req.user.role !== 'admin') return cb('Bạn không có quyền xem tài khoản này')
            if(user.status !== 'lock') return cb('Tài khoản không bị khoá')
            cb(null, user);
        },
        (user, cb) => {
            lockReasonModel
            .find({user: userId})
            .select('reason createdAt')
            .lean()
            .exec((err, reasons) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> getLockUserReason 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, reasons);
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}

// --------------------------------ADMIN EDIT MODERATOR ----------------------------------------
exports.checkBodyMakeModerator = [
    body('user_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.makeModerator = (req, res) => {
    const userId = req.body['user_id'];
    waterfall([
        (cb) => { // Get user
            userModel
            .findById(userId)
            .select('role status')
            .lean()
            .exec((err, user) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js -> makeModerator 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!user) return cb(null, 'Không tìm thấy user');
                cb(null, user);
            })
        },
        (user, cb) => { // Check role
            if(user.status !== 'normal') return cb('User không hợp lệ')
            if(user.role === 'moderator') return cb('User đã là moderator')
            if(user.role !== 'user') return cb('Không thể duyệt moderator')
            cb(null, user);
        },
        (user, cb) => { // Make moderator
            userModel
            .updateOne(
                {
                    _id: userId
                },
                {
                    role: 'moderator'
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/api-service/admin/user.js -> makeModerator 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.nModified === 0) return cb('Không thể duyệt moderator vui lòng thử lại sau')
                    cb(null, user);
                })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send('Duyệt moderator thành công');
    })
}

exports.checkBodyDemoteModerator = [
    body('user_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.demoteModerator = (req, res) => {
    const userId = req.body['user_id'];
    waterfall([
        (cb) => { // Find user
            userModel
            .findById(userId)
            .select('status role')
            .lean()
            .exec((err, user) => {
                if(err){
                    console.log('Error in ctl/api-service/admin/user.js ->  demoteModerator 01' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!user) return cb('Không tìm thấy người dùng');
                cb(null, user)
            })
        },
        (user, cb) => {
            if(user.role !== 'moderator') return cb('Người dùng không phải moderator')
            cb(null, user);
        },
        (user, cb) => {
            userModel
            .updateOne(
                {
                    _id: userId
                },
                {
                    role: 'user'
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/api-service/admin/user.js -> demoteModerator 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.nModified === 0) return cb('Không thể demote moderator, vui lòng thử lại sau');
                    cb(null, user);
                }
            )
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send('Demote thành công!');
    })
}
