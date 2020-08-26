const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');

const config = require('../../config/config');

const accountModel = require('../../models/account');
const imageModel = require('../../models/image');
const acLinkAddFieldModel = require('../../models/account-link-addfield');
const rateModel = require('../../models/rate')
const commentModel = require('../../models/comment');

exports.renderPage = (req, res) => {
    const popAcFields = [
        {
            path: 'phai',
            model: 'phais'
        },
        {
            path: 'server',
            model: 'item-properties'
        },
        {
            path: 'vohon',
            model: 'item-properties'
        },
        {
            path: 'amkhi',
            model: 'item-properties'
        },
        {
            path: 'thankhi',
            model: 'item-properties'
        },
        {
            path: 'tuluyen',
            model: 'item-properties'
        },
        {
            path: 'ngoc',
            model: 'item-properties'
        },
        {
            path: 'doche',
            model: 'item-properties'
        },
        {
            path: 'dieuvan',
            model: 'item-properties'
        },
        {
            path: 'longvan',
            model: 'item-properties'
        },
        {
            path: 'phaigiaoluu',
            model: 'phais'
        },
        {
            path: 'userId',
            model: 'users'
        }
    ];

    const popBosungField = {path: 'fieldId', model: 'add-fields'};
    waterfall([
        //  Find account with id
        cb => {
            accountModel.findById(req.params.id).populate(popAcFields).exec((err, account) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(account === null) return cb('Không tìm thấy tài khoản này!')
                account = account.toObject();
                account.userId.created_at = dateFormat(new Date(account.userId.created_at), 'mmmm d, yyyy')
                cb(null, account);
            });
        },
        // Get bosung field
        (account, cb) => {
            acLinkAddFieldModel.find({accountId: account._id}).populate(popBosungField).exec((err, addFields) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                cb(null, account, addFields);
            });
        },
        // Check if current user is logged in and have rate this account already
        (account, addFields, cb) => {
            if(!req.isAuthenticated()) return cb(null, account, addFields, null);
            rateModel.findOne({account: req.params.id, user: req.user._id}, (err, rate) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(rate !== null)
                    rate = rate.rate;   
                cb(null, account, addFields, rate)
            });
        },
        // Get images
        (account, addFields, rate, cb) => {
            imageModel.find({account: account._id}).exec((err, images) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                const result = {
                    account: account,
                    addFields: addFields,
                    images: images,
                    rate: rate
                };
                cb(null, result);
            })
        },
        // Query for five comment
        // (result, cb) => {
        //     commentModel.find({account: result.account._id, parent: null}).sort([['createdAt', -1]]).limit(5).lean().exec((err, comments) =>{
        //         if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau')
        //         cb(null, result, comments);
        //     });
        // },
        // // Query for reply comments
        // (result, comments, cb) => {
        //     if(comments.length === 0){
        //         result.comments = comments;
        //         return cb(null, result, null)
        //     } 
        //     const listIdComment = comments.map(comment => comment._id);
        //     commentModel.aggregate([
        //         {
        //             $match: {
        //                 parent: {$in: listIdComment}
        //             }
        //         },
        //         {
        //             $sort: {createdAt: -1}
        //         },
        //         {
        //             $group: {
        //                 _id: "$parent",
        //                 comments: { $push: "$$ROOT" }
        //             }
        //         }
                // {
                //      $addFields:{
                //         "comments.test": "unleaded"
                //      }
                // }
        //     ]).exec((err, result) => {
        //         if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau' + err);
        //         cb(null, result);
        //     });
        // }
    ], function(err, result){
        if(err) return res.render('404', {title: 'Xin lỗi, không tìm thấy trang'})
        res.render('account/view-account', {title: result.account.title, account: result.account, addFields: result.addFields, images: result.images, rate: result.rate});
    });
}



exports.loadComment = function (req, res){
    
}

