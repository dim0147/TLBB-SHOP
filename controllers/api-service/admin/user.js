const { query, validationResult } = require('express-validator');

const helper = require('../../../help/helper');

const userModel = require('../../../models/user');
const accountModel = require('../../../models/account');

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
