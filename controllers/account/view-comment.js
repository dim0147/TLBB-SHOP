const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const { param, validationResult } = require('express-validator');

const commentModel = require('../../models/comment');
const accountModel = require('../../models/account');
exports.checkParam = [
    param('id', 'ID không hợp lệ').isMongoId(),
    function(req, res, next) {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.render('account/view-comment', {title: 'Xem bình luận', error: errors.array()[0].msg});
        next();
    }
]

exports.render = function (req, res){
    waterfall([
        (cb) => {
            commentModel.findById(req.params.id, '_id account', (err, comment) => {
                if(err){
                    console.log('Error in ctl/account/view-comment.js -> render 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!comment) return cb("Không tìm thấy bình luận");
                cb(null, comment);
            })
        },
        (comment, cb) => {
            accountModel.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(comment.account)
                    }
                },
                {
                    $lookup: {
                        from: 'images',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'images'
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
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        c_name: 1,
                        status: 1,
                        image: {$cond: [
                            { $anyElementTrue: ['$images'] },
                            { $arrayElemAt: ['$images.url', 0] },
                            'no-image.png'
                        ]},
                        server: {$cond: [
                            { $anyElementTrue: ['$server'] },
                            { $arrayElemAt: ['$server.name', 0] },
                            'Không thấy'
                        ]},
                        sub_server: {$cond: [
                            { $anyElementTrue: ['$sub_server'] },
                            { $arrayElemAt: ['$sub_server.name', 0] },
                            'Không thấy'
                        ]},
                        user: {$cond: [
                            { $anyElementTrue: ['$user'] },
                            { $arrayElemAt: ['$user', 0] },
                            null
                        ]},
                    }
                }
            ], function(err, result) {
                if(err){
                    console.log('Error in ctl/account/view-comment.js -> render 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(result.length == 0) return cb(null, {comment: comment, account: null})
                cb(null, {comment: comment, account: result[0]})
            });
        }
    ], function(err, result){
        if(err) return res.render('account/view-comment', {title: 'Xem bình luận', error: err});
        res.render('account/view-comment', {title: 'Xem bình luận', idComment: result.comment._id, account: result.account, csrfToken: req.csrfToken()})
    });
}

exports.getComments = function(req, res){
    waterfall([
        (cb) => { // Get comment by id
            commentModel.findById(req.params.id, (err, comment) => {
                if(err){
                    console.log('Error in ctl/account/view-comment.js -> render 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!comment) return cb('Không tìm thấy bình luận');
                cb(null, comment);
            });
        },
        (comment, cb) => { // Check if is parent or reply, if reply query parent comment and return cb with id parent comment
            if(!comment.parent) return cb(null, comment._id);
            commentModel.findById(comment.parent, (err, commentParent) => {
                if(err){
                    console.log('Error in ctl/account/view-comment.js -> render 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!commentParent) return cb("Không tìm thấy bình luận chính");
                cb(null, commentParent._id);
            })
        },
        (idParentComment, cb) => { // Query parent and replyComments
            commentModel.aggregate([
                { // Query parent comment
                    $match: {
                        _id: mongoose.Types.ObjectId(idParentComment)
                    }
                },
                { // Check like of req.user from parent comment
                    $lookup: {
                        from : 'likes',
                        let: { idParentComment : '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$comment', '$$idParentComment'] },
                                    user: mongoose.Types.ObjectId(req.user._id)
                                }
                            }
                        ],
                        as: 'likeFromUser'
                    }
                },
                { // Convert to boolean true or false if have element like
                    $addFields: {
                        likeFromUser: { $cond: [
                            { $anyElementTrue: ['$likeFromUser'] },
                            true,
                            false
                        ]}
                    }
                },
                { // Query totalLikes of parent comment
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'comment',
                        as: 'likes'
                    }
                },
                { // Convert to size (number)
                    $addFields: {
                        likes: {$size: '$likes'}
                    }
                },
                { // Query owner of parent comment include rate of account if have
                    $lookup: {
                        from: 'users',
                        let: {idUser: '$user', idAccount: '$account'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$idUser']
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'rates',
                                    pipeline: [
                                        {
                                            $match: {
                                               $and: [
                                                    {$expr: { $eq: ['$user', '$$idUser'] }},
                                                    {$expr: { $eq: ['$account', '$$idAccount'] }},
                                               ],
                                            }
                                        }
                                    ],
                                    as: 'rate'
                                }
                            },
                            {
                                $addFields: {
                                    rate: {$cond: [
                                        { $anyElementTrue: ['$rate'] },
                                        { $arrayElemAt: ['$rate.rate', 0] },
                                        null
                                    ]}
                                }
                            }
                        ],
                        as: 'userDetail'
                    }
                },
                { // Convert user array to first element user
                    $addFields: {
                        userDetail: { $cond: [
                            { $anyElementTrue: ['$userDetail'] },
                            { $arrayElemAt: ['$userDetail', 0] },
                            null
                        ]}
                    }
                },
                { // Query reply comment
                    $lookup: {
                        from: 'comments',
                        let: { idParentComment: '$_id', idAccount: '$account'},
                        pipeline: [
                            {
                                $match:{
                                    $expr: { $eq: ['$parent', '$$idParentComment']}
                                }
                            },
                            { // Check if user session req.user is liked
                                $lookup: {
                                    from: 'likes',
                                    let: { idReplyComment: '$_id'},
                                    pipeline: [
                                        {
                                            $match:{
                                                $expr: { $eq: ['$comment', '$$idReplyComment']},
                                                user: mongoose.Types.ObjectId(req.user._id)
                                            }
                                        }
                                    ],
                                    as: 'likeFromUser'
                                }
                            },
                            { // Convert to boolean true or false if have element like
                                $addFields: {
                                    likeFromUser: { $cond: [
                                        { $anyElementTrue: ['$likeFromUser'] },
                                        true,
                                        false
                                    ]}
                                }
                            },
                            { // Query totalLikes of reply comment
                                $lookup: {
                                    from: 'likes',
                                    localField: '_id',
                                    foreignField: 'comment',
                                    as: 'likes'
                                }
                            },
                            { // Convert to size (number)
                                $addFields: {
                                    likes: {$size: '$likes'}
                                }
                            },
                            { // Query owner of reply comment
                                $lookup: {
                                    from: 'users',
                                    let: {idUser: '$user'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$_id', '$$idUser']
                                                }
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'rates',
                                                pipeline: [
                                                    {
                                                        $match: {
                                                           $and: [
                                                                {$expr: { $eq: ['$user', '$$idUser'] }},
                                                                {$expr: { $eq: ['$account', '$$idAccount'] }},
                                                           ],
                                                        }
                                                    }
                                                ],
                                                as: 'rate'
                                            }
                                        },
                                        {
                                            $addFields: {
                                                rate: {$cond: [
                                                    { $anyElementTrue: ['$rate'] },
                                                    { $arrayElemAt: ['$rate.rate', 0] },
                                                    null
                                                ]}
                                            }
                                        }
                                    ],
                                    as: 'userDetail'
                                }
                            },
                            { // Convert user array to first element user
                                $addFields: {
                                    userDetail: { $cond: [
                                        { $anyElementTrue: ['$userDetail'] },
                                        { $arrayElemAt: ['$userDetail', 0] },
                                        null
                                    ]}
                                }
                            },
                            {
                                $sort: {createdAt: 1}
                            },
                            {
                                $limit: 3
                            }
                        ],
                        as: 'replies'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        account: 1,
                        comment: 1,
                        createdAt: 1,
                        likeFromUser: 1,
                        likes: 1,
                        userDetail: {
                            _id: 1,
                            role: 1,
                            name: 1,
                            createdAt: 1,
                            urlImage: 1,
                            rate: 1
                        },
                        replies: {
                            _id: 1,
                            account: 1,
                            userDetail: 1,
                            comment: 1,
                            likeFromUser: 1,
                            likes: 1,
                            parent: 1,
                            userDetail: {
                                _id: 1,
                                role: 1,
                                name: 1,
                                createdAt: 1,
                                urlImage: 1,
                                rate: 1
                            },
                        }
                    }
                }
            ], function(err, result){
                if(err){
                    console.log('Error in ctl/account/view-comment.js -> render 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result[0])
            })
        },
        (comment, cb) => { // Query total replies left
            if(comment.replies.length === 0){
                comment.totalReplyLeft = 0;
                comment.continueId = null;
                return cb(null, comment);
            }
            else if(comment.replies.length >= 3){ // Query replies left
                const lastId = comment.replies[comment.replies.length - 1]._id;
                commentModel.countDocuments({
                    _id: {$gt: lastId},
                    parent: comment._id
                }, (err, count) => {
                    if(err){
                        console.log('Error in ctl/account/view-comment.js -> render 04 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    comment.totalReplyLeft = count;
                    comment.continueId = lastId;
                    cb(null, comment)
                })
            }
            else{
                comment.totalReplyLeft = 0;
                comment.continueId = null;
                cb(null, comment);
            }
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    });
    
}