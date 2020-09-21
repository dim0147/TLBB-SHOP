const waterfall = require('async-waterfall');
const likeModel = require('../../models/like');
const commentModel = require('../../models/comment');
const {body, validationResult} = require('express-validator');

const helper = require('../../help/helper');

exports.validationBody = [
    body('commentId', 'Thiếu trường').notEmpty().isMongoId(),
    body('liked', 'Thiếu trường').isBoolean(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())  return res.status(400).send(errors.array()[0].msg)
        next();
    }
]

exports.likeHandler = function (req, res){
    if(!req.isAuthenticated()) return res.status(400).send("Xin hãy đăng nhập!")

    waterfall([
        //  Check comment exists
        cb => {
            commentModel.findById(req.body.commentId).exec(function (err, comment) {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                if(comment === null) return cb('Không tìm thấy bình luận!')
                cb(null, comment)
            })  
        },
        // Check if have like or not
        (comment, cb) => {
            likeModel.findOne({comment: req.body.commentId, user: req.user._id}, (err, like) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                cb(null, like, comment);
            });
        },
        // 
        (like, comment, cb) => { 
            // Unlike
            if(like !== null){
                likeModel.deleteOne({user: req.user._id, comment: req.body.commentId}, err => {
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                    // Save activity
                    helper.createActivity({
                        type: 'unlike-comment',
                        comment: req.body.commentId,
                        owner: req.user._id
                    });
                    cb(null, "Unlike thành công")
                })         
            }else{  //  Like
                likeModel.create({comment: req.body.commentId, user: req.user._id, status: 'like'}, (err, newLike) => {
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                    // Save activity
                    helper.createActivity({
                        type: 'like-comment',
                        comment: req.body.commentId,
                        owner: req.user._id
                    });
                    // Create notification
                    helper.createNotification({
                        type: 'like-my-comment',
                        comment: comment._id,
                        likeOwner: newLike.user,
                        owner: comment.user
                    });
                    cb(null, 'Like thành công');
                });
            }
        }
    ], function(err, result){
        if(err) return res.status(400).send(err)
        res.send(result);
    })
}