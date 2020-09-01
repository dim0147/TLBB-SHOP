const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');

const config = require('../../config/config');

const accountModel = require('../../models/account');
const imageModel = require('../../models/image');
const acLinkAddFieldModel = require('../../models/account-link-addfield');
const rateModel = require('../../models/rate')
const commentModel = require('../../models/comment');
const viewModel = require('../../models/view');

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
                account.userId.created_at = dateFormat(new Date(account.userId.created_at), 'd mmmm, yyyy')
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
        (result, cb) => {// Adding view
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
        }
    ], function(err, result){
        if(err) throw new Error(err);
       
        res.render('account/view-account', {title: result.account.title, account: result.account, addFields: result.addFields, images: result.images, rate: result.rate});
    });
}



exports.loadComment = function (req, res){
    
}

