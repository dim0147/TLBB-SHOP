const { body, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
const mongoose = require('mongoose');

const config = require('../../config/config');
const helper = require('../../help/helper');

const accountModel = require('../../models/account');
const imageModel = require('../../models/image');
const rateModel = require('../../models/rate');
const viewModel = require('../../models/view');
const accountLinkAddfieldsModel = require('../../models/account-link-addfield');
const commentModel = require('../../models/comment');
const likeModel = require('../../models/like');
const lockReasonModel = require('../../models/lock-reason');
const collectionModel = require('../../models/collection');

exports.checkBody = [
    body('id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.removeAccount = async (req, res) => {
    let session = null;
    try{
        // Check if account is exist
        const account = await new Promise((resolve, reject) => {
            accountModel.findById(req.body.id, (err, account) => {
                if(err) return reject(new Error("Có lỗi xảy ra, vui lòng thử lại sau"))
                if(account === null) reject(new Error("Không tìm thấy account"))
                if(account != 'pending' && account != 'done') reject(new Error("Tài khoản không thể xoá"))
                resolve(account);
            });
        });

        // Check if account is equal user session
        if(account.userId.toString() != req.user._id.toString())
            throw new Error("Bạn không có quyền chỉnh sửa tài khoản này");
        
        // Create session 
        session = await mongoose.startSession();
        session.startTransaction();

        waterfall([
            (cb) => { // del view
                viewModel.deleteMany({account: account._id}, {session: session}, err => {
                    if(err) return cb(err);
                    cb(null);
                });
            },
            (cb) => { // dell rate
                rateModel.deleteMany({account: account._id}, {session: session}, err => {
                    if(err) return cb(err);
                    cb(null);
                });
            },
            (cb) => { // dell bosung
                accountLinkAddfieldsModel.deleteMany({accountId: account._id}, {session: session}, err => {
                    if(err) return cb(err);
                    cb(null);
                });
            },
            (cb) => { // dell reason
                lockReasonModel.deleteMany({account: account._id}, {session: session}, err => {
                    if(err) return cb(err);
                    cb(null);
                });
            },
            (cb) => { // dell collection
                collectionModel.deleteMany({account: account._id}, {session: session}, err => {
                    if(err) return cb(err);
                    cb(null);
                });
            },
            // (cb) => { // query comment
            //     commentModel.find({account: account._id}, '_id', {session: session}, (err, comments) => {
            //         if(err) return cb(err);
            //         cb(null, {comments: comments})
            //     });
            // },
            // (result, cb) => { // delete like comment
            //     if(result.comments.length === 0) return cb(null, {listIdComment: []});
            //     const listIdComment = result.comments.map(comment => comment._id);
            //     likeModel.deleteMany({comment: {$in: listIdComment}}, {session: session}, (err) => {
            //         if(err) return cb(err);
            //         cb(null, {listIdComment: listIdComment})
            //     });
            // },
            // (result, cb) => { // Delete comment
            //     if(result.listIdComment.length === 0) return cb(null);
            //     commentModel.deleteMany({_id: {$in: result.listIdComment}}, {session: session}, (err) => {
            //         if(err) return cb(err);
            //         cb(null);
            //     })
            // },
            (cb) => { // get images
                imageModel.find({account: account._id}, {}, {session: session}, (err, images) => {
                    if(err) return cb(err);
                    cb(null, {images: images})
                });
            },
            (result, cb) => { // dell images
                if(result.images.length === 0) return cb(null, [])
                const listUrlImage = result.images.map(image => config.pathStoreImageUpload + '/' + image.url);
                imageModel.deleteMany({account: account._id}, {session: session}, (err) => {
                    if(err) return cb(err);
                    cb(null, {listUrlImage: listUrlImage});
                });
            },
            (result, cb) => {
                accountModel.findByIdAndDelete(account._id, {session: session}, (err) => {
                    if(err) return cb(err);
                    cb(null, result);
                })
            }
        ], function(err, result){
            if(err){
                console.log('có lỗi xảy ra khi remove account ' + err);
                session.abortTransaction();
                session.endSession();
                return res.status(400).send("Có lỗi xảy ra, vui lòng thử lại sau")
                
            }
            session.commitTransaction();
            if(result.listUrlImage.length > 0)
                helper.deleteManyFiles(result.listUrlImage);

            // Save activity
            helper.createActivity({
                type: 'remove-account',
                account: account._id,
                owner: req.user._id
            });
            res.send('Xoá tài khoản '+account.c_name+' thành công!');
        })
    

    }
    catch(err){
        if(session !== null){
            session.abortTransaction();
            session.endSession();
        }
        res.status(400).send(err.message);
    }
}