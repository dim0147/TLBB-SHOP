const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
const {param, validationResult} = require('express-validator');
const mongoose = require('mongoose');

const accountModel = require('../../models/account');
const imageModel = require('../../models/image');
const acLinkAddFieldModel = require('../../models/account-link-addfield');
const rateModel = require('../../models/rate')
const viewModel = require('../../models/view');
const collectionModel = require('../../models/collection');

const config = require('../../config/config');
const helper = require('../../help/helper');
const cache = require('../../cache/cache');


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

exports.checkBody = [
    param('id', 'Trường id không hợp lệ').notEmpty().isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.render('account/view-account', {title:'Có lỗi xảy ra!',  error: errors.array()[0].msg });
        }
        next();
    }
]

exports.renderPage = (req, res) => {
    
    const popAcFields = config.account.popAcFields.concat(helper.getItemPopACField());
    popAcFields.push({
        path: 'userId',
        model: 'users'
    });

    const popBosungField = {path: 'fieldId', model: 'add-fields'};
    waterfall([
        //  Find account with id
        cb => {
            accountModel.findById(req.params.id).populate(popAcFields).exec((err, account) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(account === null) return cb('Không tìm thấy tài khoản này!')
                if(account.status != 'pending' && account.status != 'done') return cb('Tài khoản không thể xem')
                if(account.userId && account.userId.status != 'normal') return cb('Tài khoản thuộc người đăng không hợp lệ')
                account = account.toObject();
                account.userId.created_at = dateFormat(new Date(account.userId.created_at), 'd mmmm, yyyy')
                if(req.isAuthenticated() && account.userId._id.toString() == req.user._id){
                    account.isOwner = true;
                }

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
        // Check if current user is logged in and have save this account already
        (account, addFields, rate, cb) => {
            if(!req.isAuthenticated()) return cb(null, account, addFields, rate, null);
            collectionModel.findOne({account: req.params.id, user: req.user._id}, (err, collection) => {
                if(err){
                    console.log('Error in clt/account/view-account.js -> renderPage 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(collection) return cb(null, account, addFields, rate, collection);
                else return cb(null, account, addFields, rate, null);
            })
        },
        // Get images
        (account, addFields, rate, collection, cb) => {
            imageModel.find({account: account._id}).exec((err, images) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                const result = {
                    account: account,
                    addFields: addFields,
                    images: images,
                    rate: rate,
                    collection: collection
                };
                cb(null, result);
            })
        },
        (result, cb) => { // Adding new view
            if(typeof req.ip === 'undefined') return cb(null, result);
            viewModel.findOne({ip:req.ip, account: result.account._id}).exec((err, ip) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(ip !== null) return cb(null, result);
                const newView = {
                    account: result.account._id,
                    ip: req.ip
                };
                if(req.isAuthenticated())
                    newView.user = req.user._id;
                viewModel.create(newView, (err) =>{
                    if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                    return cb(null, result);
                })
            });
        },
        (result, cb) => { // Get total rate of account
            rateModel.aggregate([
                {
                    $match: {
                        account: mongoose.Types.ObjectId(result.account._id)
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRate: {$avg: "$rate"}
                    }
                }
            ], function(err, rates){
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(rates.length === 0){
                    result.account.totalRate = 5;
                    return cb(null, result)
                }
                else{
                    result.account.totalRate = rates[0].totalRate;
                    return cb(null, result)
                }
            });
        },
        (result, cb) => { // Get total view
            viewModel.countDocuments({account: result.account._id}, (err, totalView) => {
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                result.account.totalView = totalView
                cb(null, result);
            })
        },
        (result, cb) => { // Get item exclude server
            const menuView = cache.getKey('menuView');
            const listItems = menuView.items.filter(item => item.slug != 'server');
            result.listItems = listItems;
            cb(null, result); 
        },
        (result, cb) => { // Get relevant account
            accountModel.aggregate([
                {
                    $match: { // Query relevant account
                        phai: mongoose.Types.ObjectId(result.account.phai._id),
                        status: 'pending',
                        $or: [
                            {server: mongoose.Types.ObjectId(result.account.server._id)},
                            {sub_server: mongoose.Types.ObjectId(result.account.sub_server._id)}
                        ]
                    },
                },
                {
                    $lookup: { // query user to checking user is normal
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $addFields: {
                        user: { $cond: [
                            { $anyElementTrue: ['$user'] },
                            { $arrayElemAt: ['$user', 0] },
                            null
                        ]}
                    }
                },
                {
                    $match: {
                        'user.status': 'normal'
                    }
                },  
                { // Query image
                    $lookup: {
                        from: 'images',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'images'
                    }
                },
                {
                    $addFields: {
                        image: { $cond: [
                            { $anyElementTrue: ['$images'] },
                            { $arrayElemAt: ['$images.url', 0] },
                            'no-image.png'
                        ]}
                    }
                },
                { // Query view
                    $lookup: {
                        from: 'views',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'views'
                    }
                },
                {
                    $addFields: {
                        totalView: {$size: '$views'}
                    }
                },
                { // Query rate
                    $lookup: {
                        from: 'rates',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'rates'
                    }
                },
                {
                    $unwind: {
                        path: '$rates',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        title: {$first: '$title'},
                        c_name: {$first: '$c_name'},
                        phai: {$first: '$phai'},
                        server: {$first: '$server'},
                        sub_server: {$first: '$sub_server'},
                        ngoc: {$first: '$ngoc'},
                        dieuvan: {$first: '$dieuvan'},
                        vohon: {$first: '$vohon'},
                        user: {$first: '$user'},
                        transaction_type: {$first: '$transaction_type'},
                        price: {$first: '$price'},
                        phaigiaoluu: {$first: '$phaigiaoluu'},
                        image: {$first: '$image'},
                        totalView: {$first: '$totalView'},
                        totalRate: {$avg: '$rates.rate'},
                        createdAt: {$first: '$createdAt'}
                    }
                },
                { $sample: { size: 6 } }
            ], function(err, accounts){
                if(err){
                    console.log('Error in ctl/account/view-account.js -> render 07 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(accounts.length === 0){
                    result.relevantAccount = [];
                    return cb(null, result);
                }
                accountModel.populate(accounts, popAcFields, (err, accounts) => { // Populate
                    if(err){
                        console.log('Error in ctl/account/view-account.js -> rnder 08 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    accounts.forEach(account => {   
                        account.createdAt = dateFormat(new Date(account.createdAt), 'd mmmm, yyyy');
                    });
                    result.relevantAccount = accounts;
                    cb(null, result);
                });
            })
        }
    ], function(err, result){
        if(err) return res.render('account/view-account', {title: 'Có lỗi xảy ra!',  error: err });
        // Save activity
        if(req.isAuthenticated() && req.user.role === 'user'){
                helper.createActivity({
                    type: 'view-account-detail',
                    account: req.params.id,
                    owner: req.user._id
                });
        }
        res.render('account/view-account', {
                                            title: result.account.title, 
                                            account: result.account, 
                                            relevantAccount: result.relevantAccount,
                                            addFields: result.addFields, 
                                            images: result.images, 
                                            rate: result.rate,
                                            collection: result.collection,
                                            listItems: result.listItems,
                                            csrfToken: req.csrfToken()
                                        });
    });
}

