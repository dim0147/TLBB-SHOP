const {query, body, validationResult} = require('express-validator');
const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
const mongoose = require('mongoose');

const commentModel = require('../../models/comment');
const accountModel = require('../../models/account');
const rateModel = require('../../models/rate');

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
                comment.createdAt = dateFormat(date, "mmmm d, yyyy");
                
                cb(null, comment)
            });
        },
        // Check if user is rate
        (comment, cb) => {
            rateModel.findOne({user: req.user._id}, (err, rate) => {
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
    console.log(req.query);
    //  Check if account is exist
    let accountIsExist = await new Promise((resolve, reject) => {
        accountModel.findById(req.query.accountId).exec(function (err, account){
            if(err) return reject("Có lỗi xảy ra, vui lòng thử lại sau")
            if(account === null) return reject("Không tìm thấy account")
            resolve(true);
        });
    }).catch(err => res.status(400).send(err))
    if(!accountIsExist) return

    // Get comments(First time loading)
    if(req.query.first_load === 'true'){
        waterfall([
            cb => {
                //  Get first 5 comment 
                // commentModel.find({account: req.query.accountId, parent: null}).populate('user', 'name urlImage').limit(5).lean().exec(function (err, comments){
                //     if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                //     cb(null, comments);
                // });

                commentModel.aggregate([
                    {
                        $match:{
                            account: mongoose.Types.ObjectId(req.query.accountId),
                            parent: null
                        },
                    },
                    {
                        $lookup:
                        {
                            'from': 'users',
                            'localField': 'user',
                            'foreignField': '_id',
                            'as': 'user'
                        }
                    },
                    {
                        $lookup:
                        {
                            'from': 'rates',
                            'pipeline': [
                                { $match: {account: mongoose.Types.ObjectId(req.query.accountId), user: 'user._id'}}
                            ],
                            'as': 'rd'
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
                let listPromise = comments.map(comment => {
                    return new Promise((resolve, reject) => {
                        commentModel.aggregate([
                            {
                                $match:{
                                    parent: comment._id
                                }
                            },
                            {
                                $limit: 3
                            }
                        ]).exec(function(err, replyComments){
                            resolve(replyComments);
                        });
                    });
                });
                Promise.all(listPromise).then((result => cb(null, comments, result))).catch((err) => cb(err));
            },
            (comments, replyComments, cb) => {
                if(comments.length === 0) return cb(null, comments, null);
            
                cb(null, mergeComments(comments, replyComments))
            }
        ], function(err, result){
            if(err) return console.log(err);
            console.log(result);
            return res.send(result)
        });

    }
}
/* replyComments[0] = [{ parent: 11, _id:1, comment: 1},{parent: 11, _id:2, comment: 2}] // Same Parent ID
 replyComments[1] = [{parent: 12, _id:3, comment: 3 },{parent: 12, _id:4, comment: 4}]

 comments = [ {_id: 11, comment: cc, parent: null}, {_id: 12, comment: da, parent: null} ]
*/
function mergeComments(comments = [], replyComments = []){
    // console.log('comment');
    // // console.log(comments);
    // console.log('reply');
    // console.log(replyComments);
    comments.forEach((comment) => {
        comment.listReplies = [];
        for (let i = 0; i < replyComments.length; i++){
            let arrComments = replyComments[i];
            if(arrComments.length === 0 || (arrComments[0].parent.toString() != comment._id.toString())){
                continue;
            } else{
                arrComments.forEach(replyComment => {
                    comment.listReplies.push(replyComment)
                })
            }
        }
    })
    return comments;
}