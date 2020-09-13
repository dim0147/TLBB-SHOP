const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
const {param, validationResult} = require('express-validator');
const mongoose = require('mongoose');

const accountModel = require('../../models/account');
const imageModel = require('../../models/image');
const acLinkAddFieldModel = require('../../models/account-link-addfield');
const rateModel = require('../../models/rate')
const viewModel = require('../../models/view');

const config = require('../../config/config');


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
    let popAcFields = config.account.popAcFields;
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
                if(account.status.toString() == 'lock') return cb('Tài khoản bị khoá')
                account = account.toObject();
                account.userId.created_at = dateFormat(new Date(account.userId.created_at), 'd mmmm, yyyy')
                if(req.isAuthenticated() && account.userId._id.toString() == req.user._id){
                    account.isOwner = true;
                    console.log('ok');
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
        }
    ], function(err, result){
        if(err) return res.render('account/view-account', {title: 'Có lỗi xảy ra!',  error: err });
        res.render('account/view-account', {title: result.account.title, account: result.account, addFields: result.addFields, images: result.images, rate: result.rate, csrfToken: req.csrfToken()});
    });
}

