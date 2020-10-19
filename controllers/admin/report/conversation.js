const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const {query, param, validationResult} = require('express-validator');

const conversationModel = require('../../../models/conversation');
const messageModel = require('../../../models/message');

exports.checkParamRenderPage = [
    param('conversationId', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.renderPage = (req, res) => {
    const {conversationId} = req.params;
    conversationModel.aggregate([
        {
            $match: {_id: mongoose.Types.ObjectId(conversationId)}
        },
        {
            $lookup: {
                from: 'messages',
                localField: 'offer',
                foreignField: '_id',
                as: 'offer'
            }
        },
        {
            $lookup: {
                from: 'accounts',
                let: {accountId: '$account'},
                pipeline: [
                    {
                        $match: {$expr: {$eq: ['$_id', '$$accountId']}}
                    },
                    {
                        $lookup: {
                            from: 'images',
                            localField: '_id',
                            foreignField: 'account',
                            as: 'image'
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    {
                        $lookup: {
                            from: 'item-properties',
                            localField: 'server',
                            foreignField: '_id',
                            as: 'server'
                        }
                    },
                    {
                        $lookup: {
                            from: 'item-properties',
                            localField: 'sub_server',
                            foreignField: '_id',
                            as: 'sub_server'
                        }
                    },
                    {
                        $addFields: {
                            image: {$cond: [
                                {$anyElementTrue: ['$image']},
                                {$arrayElemAt: ['$image.url', 0]},
                                null
                            ]},
                            user: {$cond: [
                                {$anyElementTrue: ['$user']},
                                {$arrayElemAt: ['$user', 0]},
                                null
                            ]},
                            server: {$cond: [
                                {$anyElementTrue: ['$server']},
                                {$arrayElemAt: ['$server.name', 0]},
                                null
                            ]},
                            sub_server: {$cond: [
                                {$anyElementTrue: ['$sub_server']},
                                {$arrayElemAt: ['$sub_server.name', 0]},
                                null
                            ]},
                        }
                    }
                ],
                as: 'account'
            }
        },
        {
            $addFields: {
                account: {$cond: [
                    {$anyElementTrue: ['$account']},
                    {$arrayElemAt: ['$account', 0]},
                    null
                ]},
                offer: {$cond: [
                    {$anyElementTrue: ['$offer']},
                    {$arrayElemAt: ['$offer', 0]},
                    null
                ]},
            }
        },
        {
            $project: {
                status: 1,
                starter: 1,
                createdAt: 1,
                updatedAt: 1,
                account: {
                    _id: 1,
                    title: 1,
                    user: {
                        _id: 1,
                        name: 1
                    },
                    image: 1,
                    c_name: 1,
                    server: 1,
                    sub_server: 1,
                    status: 1
                },
                offer: {
                    price_offer: 1
                }
            }
        }
    ], function(err, conversations){
        if(err){
            console.log('Error in ctl/admin/report/conversation.js -> renderPage 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        if(conversations.length !== 1) return res.status(400).send('Không tìm thấy cuộc trò chuyện');
        const conversation = conversations[0];
        res.render('admin/report/conversation', {title: 'Hiển thị cuộc trò chuyện', conversation, csrfToken: req.csrfToken()});
    });
}

exports.checkQueryGetMessages = [
    query('continue_timestamp', 'timestamp không hợp lệ').optional().isISO8601(),
    query('conversation_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getMessage = (req, res) => {
    const {'continue_timestamp': continueTimestamp, 'conversation_id': conversationId  } = req.query;
    waterfall([
        (cb) => { // Check conversation if have
            conversationModel
            .countDocuments(conversationId, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/report/conversation.js -> getMessage 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không tìm thấy cuộc trò chuyện')
                cb(null);
            })
        },
        (cb) => {
            let query = {
                conversation: conversationId,
            };
            if(continueTimestamp)
                query['createdAt'] = {$lt: new Date(continueTimestamp)}

            messageModel
            .find(query)
            .select('message price_offer type offer createdAt')
            .populate([
                {
                    path: 'user',
                    select: '_id name status urlImage role'
                },
                {
                    path: 'offer',
                    select: 'price_offer'
                }
            ])
            .sort({createdAt: -1})
            .limit(5)
            .lean()
            .exec((err, messages) => {
                if(err){
                    console.log('Error in ctl/admin/report/conversation.js ->  getMessage 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, messages)
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}