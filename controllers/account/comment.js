const {query, body, validationResult} = require('express-validator');
const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
const mongoose = require('mongoose');

const commentModel = require('../../models/comment');
const accountModel = require('../../models/account');
const rateModel = require('../../models/rate');
const comment = require('../../models/comment');

dateFormat.i18n = {
    dayNames: [
        'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7',
        'Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'
    ],
    monthNames: [
        'Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12',
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ],
    timeNames: [
        'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
    ]
};

exports.validateBody = [
    body('comment', 'Thiếu trường').notEmpty(),
    body('accountId', 'Thiếu trường').notEmpty(),
    body('parent', 'Thiếu trường').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg)
        next();
    }
]

exports.validateBodyGetComments = [
    query('accountId', "Lỗi trường 1").notEmpty().isMongoId(),
    query('first_load', 'Lỗi boolean 2').isBoolean(),
    query('continueId', 'Lỗi không tìm thấy').exists(),
    query('parentId', 'Lỗi không tìm thấy').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg)
        next();
    }
]

exports.createComment = function (req, res){
    if(!req.isAuthenticated())  return res.status(401).send("Xin hãy đăng nhập")
    waterfall([
        //  Check if account is exist
        cb => {
            accountModel.findById(req.body.accountId).exec((err, account) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau" + err)
                if(account === null) return cb('Không tìm thấy account')
                cb(null)
            });
        },
        //  Check if parent comment is existing
        cb => {
            if(req.body.parent.length === 0) return cb(null)
            commentModel.findById(req.body.parent, (err, comment) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(comment === null) return cb('Không tìm thấy id bình luận!')
                cb(null);
            });
        },
        // Create comment, check if have parent comment and add author's comment name with user session 
        cb => {
            let commentObject = {
                    account: req.body.accountId, 
                    user: req.user._id, 
                    comment: req.body.comment
                }
            if(req.body.parent.length > 0)
                commentObject.parent = req.body.parent
            commentModel.create(commentObject, (err, comment) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau" + err)
                comment = comment.toObject();
                comment.name = req.user.name;
                comment.avatar = req.user.urlImage;
                let date = new Date(comment.createdAt);
                comment.createdAt = dateFormat(date, "d mmmm, yyyy");
                
                cb(null, comment)
            });
        },
        // Check if user is rate
        (comment, cb) => {
            rateModel.findOne({user: req.user._id, account: req.body.accountId}, (err, rate) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                if(rate !== null) rate = rate.rate
                cb(null, {comment: comment, rate: rate});
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err)
        res.send(result);       
    })
}

/* comments = [
    {
        _id: text
        comment: text
        parent: null,
        time: text
        user: object
        likes: like
        replyComments: [
            {
                _id
                comment: text
                parent: id
                time: text
                user: object
                likes: number
            }
        ]
    }
]
*/
exports.getComments = async function (req, res){
    if(!req.isAuthenticated())
        return res.status(400).send("Xin hãy đăng nhập!")
    
    //  Check if account is exist
    let accountIsExist = await new Promise((resolve, reject) => {
        accountModel.findById(req.query.accountId).exec(function (err, account){
            if(err) return reject("Có lỗi xảy ra, vui lòng thử lại sau")
            if(account === null) return reject("Không tìm thấy account")
            resolve(true);
        });
    }).catch(err => res.status(400).send(err))
    if(!accountIsExist) return

    let payload = {}
    // Get comments(First time loading)
    if(req.query.first_load === 'true'){
        console.log('first load');
        payload.condition = {
            account: mongoose.Types.ObjectId(req.query.accountId),
            parent: null
        }
        payload.sort = {
            createdAt: -1
        }
        payload.limit = 6
    }   // Get more comments
    else if(req.query.continueId !== 'false' && req.query.parentId === 'false'){
        console.log('continueId without parent');
        payload.condition = {
            account: mongoose.Types.ObjectId(req.query.accountId),
            parent: null,
            _id: {$lt: mongoose.Types.ObjectId(req.query.continueId)}
        };
        payload.sort = {
            createdAt: -1
        };
        payload.limit = 6
    }
    else if(req.query.continueId !== 'false' && req.query.parentId !== 'false'){
        console.log('continueId without parent');
        payload.condition = {
            account: mongoose.Types.ObjectId(req.query.accountId),
            parent: mongoose.Types.ObjectId(req.query.parentId),
            _id: {$gt: mongoose.Types.ObjectId(req.query.continueId)}
        }
        payload.sort = {
            createdAt: 1
        };
        payload.limit = 3
    }
    else
        return res.status(400).send("Lỗi xác thực")

    waterfall([
        cb => {
            commentModel.aggregate([
                {
                    //  Get first 5 comment
                    $match: payload.condition,  
                },
                {$sort: payload.sort},
                {$limit: payload.limit},

                    //  Get user detail of 5 comment
                {
                    $lookup:
                    {
                        'from': 'users',
                        'let': {userId: '$user' , accountId: '$account'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
                                    }
                                }
                            },
                            {   // Get Rate of 5 user if they have rated
                                $lookup:
                                {
                                    'from': 'rates',
                                    'let': {userId: "$_id"},
                                    'pipeline': [
                                        { 
                                            $match: {
                                                $expr: {$and:
                                                    [
                                                        {$eq: ['$user', '$$userId']},
                                                        {$eq: ['$account', '$$accountId']}
                                                    ]}
                                            }
                                        },
                                        {$limit: 1}
                                    ],
                                    'as': 'rate'
                                }
                            },
                        ],
                        'as': 'userDetail'
                    }
                },
                {   // Get  comment's likes
                    $lookup:{
                        from: 'likes',
                        let: {commentId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                            $eq: ['$comment', '$$commentId']
                                    }
                                }
                            }
                        ],
                        as: 'likes'
                    }
                },
                {   // Get req user like
                        $lookup: {
                            from: 'likes',
                            let: {commentId: '$_id'},
                            pipeline:[
                                {
                                    $match:{
                                        $expr: {
                                            $and: [
                                                {$eq: ['$user', mongoose.Types.ObjectId(req.user._id)]},
                                                {$eq: ['$comment', '$$commentId']}
                                            ]}
                                    }
                                }
                            ],
                            as: 'likeFromUser'
                        }
                },
                // Get comment replies of 5 comments, each comment query 3 replies and sort latest, sort by date
                {
                    $lookup:
                    {
                        'from': 'comments',
                        'let': {commentParent: "$_id", accountId: "$account"},
                        'pipeline': [
                            {
                                $match: {
                                    $expr: { $eq: ['$parent', '$$commentParent']}
                                }
                            },
                            {$sort: {createdAt: 1}},
                            {$limit: 3},
                            {   // Get user detail and rate of comment replies
                                $lookup: {
                                    from: 'users',
                                    let: {userReplyId: '$user'},
                                    pipeline: [
                                        {
                                            $match:{
                                                $expr: {$eq: ['$_id', '$$userReplyId']}
                                            }
                                        },
                                        {   // Get rate of user if have
                                            $lookup: {
                                                from: 'rates',
                                                let: {userRateId: '$_id'},
                                                pipeline: [
                                                    {
                                                      $match:{
                                                          $expr: {$and:
                                                            [
                                                              {$eq: ['$user', '$$userRateId']},
                                                              {$eq: ['$account', '$$accountId']}

                                                            ]
                                                          }
                                                      }  
                                                    },
                                                    {  $limit: 1 }
                                                ],
                                                as: 'rate'
                                            }
                                        },
                                    ],
                                    as: 'userReply'
                                }
                            },
                            {   // Get total likes comment
                                $lookup: {
                                    from: 'likes',
                                    let: {commentId: '$_id'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$comment', '$$commentId']
                                                }
                                            }
                                        }
                                    ],
                                    as: 'likes'
                                }
                            },
                            {   // Get comment like from user
                                $lookup: {
                                    from: 'likes',
                                    let: {commentId: '$_id'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and:[
                                                        {$eq: ['$comment', '$$commentId']},
                                                        {$eq: ['$user', mongoose.Types.ObjectId(req.user._id)]}
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    as: 'likeFromUser'
                                }
                            }
                        ],
                        'as': 'replies'
                    },
                    
                },

                {
                    $project:
                    {   
                        _id: 1,
                        account: 1,
                        comment: 1,
                        parent: 1,
                        likes: 1,
                        likeFromUser: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        replies: {
                            _id: 1,
                            account: 1,
                            comment: 1,
                            likes: 1,
                            likeFromUser: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            parent: 1,
                            userReply: {
                                _id: 1,
                                name: 1,
                                urlImage: 1,
                                role: 1,
                                createdAt: 1,
                                rate: {
                                    rate: 1,
                                    createdAt: 1
                                }
                            }
                        },
                        userDetail: {
                            _id: 1,
                            name: 1,
                            urlImage: 1,
                            role: 1,
                            createdAt: 1,
                            rate: {
                                rate: 1,
                                createdAt: 1
                            }
                        }
                    }
                }
            ]).exec(function (err, comments){
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau" + err);
                // console.log(comments);
                cb(null, comments);
            });
        },
             //  Get replies of first 5 comment and merge
        (comments, cb) => {
            if(comments.length === 0) return cb(null, comments, null);
            
            // Query comment include reply
            let condition = {
                _id: {$lt: mongoose.Types.ObjectId(comments[(Number(comments.length) - 1)]._id)}, 
                account: req.query.accountId,
                parent: null
            }
            // Query reply comment only
            if(req.query.parentId !== 'false'){
                condition = {
                    _id: {$gt: mongoose.Types.ObjectId(comments[(Number(comments.length) - 1)]._id)}, 
                    account: req.query.accountId,
                    parent: mongoose.Types.ObjectId(req.query.parentId)
                }
            }
            let countMainComments = new Promise((resolve, reject) =>{
                commentModel.countDocuments(
                    condition, (err, count) => {
                    if(err) return reject(err);
                    resolve({_id: comments[(Number(comments.length) - 1)]._id, countLeft: count});
                });
            })

            let countRepliesComment = comments.map(comment => {
                return new Promise((resolve, reject) => {
                    if(comment.replies.length === 0) return resolve(0);
                    let lastIndex = Number(comment.replies.length) - 1;
                    commentModel.countDocuments({
                        _id: {$gt: mongoose.Types.ObjectId(comment.replies[lastIndex]._id)},
                        account: req.query.accountId,
                        parent: mongoose.Types.ObjectId(comment.replies[lastIndex].parent)
                    }, (err, count) => {
                        if(err) return reject(err);
                        resolve({_id: comment.replies[lastIndex]._id, countLeft: count})
                    });
                    
                });
            });

            countRepliesComment.unshift(countMainComments);
            Promise.all(countRepliesComment).then((result => cb(null, comments, result))).catch((err) => cb(err));
        },
        (comments, counts, cb) => {
            if(comments.length === 0)
                return cb(null, {totalLeft: 0, data: []}, null);
            
            comments = mergeCountCommentLeft(comments, counts);
            cb(null, comments);
        }
    ], function(err, result){
        if(err) return console.log(err);
        // console.log(result);
        return res.send(result)
    });
}
/* replyComments[0] = [{ parent: 11, _id:1, comment: 1},{parent: 11, _id:2, comment: 2}] // Same Parent ID
 replyComments[1] = [{parent: 12, _id:3, comment: 3 },{parent: 12, _id:4, comment: 4}]

 comments = [ {_id: 11, comment: cc, parent: null}, {_id: 12, comment: da, parent: null} ]
*/
function mergeCountCommentLeft(comments, countArr) {

    comments = {
        totalLeft: countArr[0].countLeft, // First index is total mainComment
        data: comments
    };

    for (let i = 0; i < comments.data.length; i++){
        let comment = comments.data[i];
        if(comment.replies.length === 0){
            comments.data[i].replies = {
                totalLeft: 0, // First index is total mainComment
                data: []
            };
            continue;
        }

        comment.replies.some(reply => {

            let isDone = countArr.some(count => {
                if(count._id == reply._id){
                    console.log('equal!!!!!');
                    comments.data[i].replies = {
                        totalLeft: count.countLeft,
                        data: comments.data[i].replies
                    }
                    return true;
                }
                    
            })
            if (isDone) return true;
        });
    }

    return comments;
}