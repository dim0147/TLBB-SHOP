const waterfall = require('async-waterfall');
const { param, body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const dateFormat = require('dateformat');
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

const cache = require('../../cache/cache');
const config = require('../../config/config');
const helper = require('../../help/helper');

const userModel = require('../../models/user');
const accountModel = require('../../models/account');
const reportModel = require('../../models/report');

exports.checkParams = [
    param('id', 'id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.render('user/view-profile-account', { title: 'Xem tài khoản', error: errors.array()[0].msg });
        next();
    }
]

exports.renderPage = function(req, res){    
    waterfall([
        (cb) => { // Get user Id
            userModel.findById(req.params.id, {}, {lean: true}, function(err, user){
                if(err){
                    console.error('Error in CTL/user/view-user -> renderPage 01' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                if(!user) return cb('Không tìm thấy người dùng');
                if(user.status != 'normal') return cb('Người dùng không còn hợp lệ');
                user.created_at = dateFormat(new Date(user.created_at), "d mmmm, yyyy");
                cb(null, {user: user});
            });
        },
        (result, cb) => { // Get server property
            let serverItems = [];
            const menuView = cache.getKey('menuView');

            if(typeof menuView.items !== 'undefined' &&  Array.isArray(menuView.items)){
                serverItems = menuView.items.filter((item) => item.slug.toString() == 'server');
                if(serverItems.length > 0 && typeof serverItems[0].properties !== 'undefined')
                    result.servers = serverItems[0].properties;
                else
                    result.servers = [];
            }
            else{
                result.servers = [];
            }
            cb(null, result);
        }
    ], function(err, result){
        if (err) return res.render('user/view-profile-account', { title: 'Xem tài khoản', error: err});
        
        // Save activity
        if(req.isAuthenticated() && req.user.role === 'user' && req.user._id.toString() != req.params.id){
            helper.createActivity({
                type: 'view-user-profile',
                user: req.params.id,
                owner: req.user._id
            });
        }
        res.render('user/view-profile-account', { title: 'Xem tài khoản được đăng bởi ' + result.user.name, accounts: [], user: result.user, servers: result.servers, csrfToken: req.csrfToken()});
    })
    
    
}

exports.checkParamGetUserAccounts = [
    param('id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getUserAccounts = async function(req, res){

    // Check if user is normal
    const callback = await new Promise((resolve, reject) => {
        userModel.findById(req.params.id, (err, user) => {
            if(err){
                console.log('Error in controller/user/view-user.js -> getUserAccounts 01 ' + err);
                return reject('Có lỗi xảy ra vui lòng thử lại sau')
            }   
            if(!user) return reject('Không tìm thấy người dùng');
            if(user.status != 'normal') return reject('Người dùng không còn hợp lệ')
            resolve(true);
        });
    }).catch(err => {
        return {error: err};
    })

    if(callback.error)
        return res.status(400).send(callback.error);

    const itemPerPage = 7;
    let option = {
        limit: itemPerPage,
        skip: 0,
        sort: { createdAt: -1 }
    }

    let condition = {
        userId: mongoose.Types.ObjectId(req.params.id),
        status: { $in: ['pending', 'done'] }
    }
    
    // Elevate page (sort)
    if(typeof req.query.page !== 'undefined' && !isNaN(req.query.page) && Number(req.query.page) > 0){
        option.skip = Number(req.query.page - 1) * itemPerPage;
    }

    // Elevate sort (sort)
    if(typeof req.query.sort !== 'undefined' && typeof req.query.sort === 'string'){
        switch(req.query.sort){
            case 'date-new':
                option.sort = {createdAt: -1}
                break;
            case 'date-old':
                option.sort = {createdAt: 1}
                break;
            case 'price-high':
                option.sort = {price: -1}
                break;
            case 'price-low':
                option.sort = {price: 1}
                break;
            case 'most-view':
                option.sort = {totalView: -1}
                break;
            case 'most-rate':
                option.sort = {totalRate: -1}
                break;
        }
    }

    // Elevate server (condition)
    if(typeof req.query.server !== 'undefined' && typeof req.query.server === 'string' && mongoose.Types.ObjectId.isValid(req.query.server))
        condition.server = mongoose.Types.ObjectId(req.query.server);

    //  Elevate c_name (condition)
    if(typeof req.query.c_name !== 'undefined' && typeof req.query.c_name === 'string')
        condition.c_name = { $regex: req.query.c_name, $options: 'i'}

    if(typeof req.query.status !== 'undefined' && typeof req.query.status === 'string' && (req.query.status == 'pending' || req.query.status == 'done'))
        condition.status = req.query.status;

    accountModel.aggregate([
        {
            $match: condition
        },
        {
            $lookup: {
                from: 'rates',
                localField: '_id',
                foreignField: 'account',
                as: 'rates'
            }
        },
        {
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
        {
            $lookup: {
                from: 'images',
                localField: '_id',
                foreignField: 'account',
                as: 'images'
            }
        },
        {
            $addFields: {
                image: {
                    $cond: [
                        { $anyElementTrue: ['$images'] },
                        { $arrayElemAt: ['$images.url', 0] },
                        'no-image.png'
                    ]
                }
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
                title: { $first: '$title'},
                c_name: { $first: '$c_name'},
                phai: { $first: '$phai'},
                ngoc: { $first: '$ngoc'},
                dieuvan: { $first: '$dieuvan'},
                vohon: { $first: '$vohon'},
                server: { $first: '$server'},
                sub_server: { $first: '$sub_server'},
                transaction_type: { $first: '$transaction_type'},
                price: { $first: '$price'},
                phaigiaoluu: { $first: '$phaigiaoluu'},
                status: { $first: '$status'},
                image: { $first: '$image'},
                totalView: { $first: '$totalView'},
                totalRate: { $avg: '$rates.rate' },
                createdAt: { $first: '$createdAt' },
            }
        },
        {
            $facet: {
                accounts: [
                    {
                        $sort: option.sort
                    },
                    {
                        $skip: option.skip
                    },
                    {
                        $limit: option.limit
                    }
                ],
                total: [
                    {
                        $count: 'totalAccount'
                    }
                ]
            }
        }
    ], async function(err, result){
        if(err){
            console.log('Err in  CTL/user/view-user->getUserAccounts - 01');
            console.log(err);
            return res.status(400).send("Có lỗi xảy ra, vui lòng thử lại sau");
        }

        let returnData = {
            accounts: [],
            totalAccount: 0
        }
        // Check if have account or not
        if(result.length > 0 && typeof result[0].accounts !== 'undefined' && typeof result[0].total !== 'undefined'){
            const accounts = result[0].accounts;
            const total = result[0].total;
            if(Array.isArray(accounts) && accounts.length > 0)
                returnData.accounts = accounts;
                
            if(Array.isArray(total) && total.length > 0)
                returnData.totalAccount = total[0].totalAccount;
        }

        // Populate fields
        if(returnData.accounts.length > 0){
            returnData.accounts = await accountModel.populate(returnData.accounts, config.account.popAcFields.concat(helper.getItemPopACField()))
                                        .catch(err => {
                                            console.log('Err in  CTL/user/view-user->getUserAccounts - 02');
                                        });
            if(typeof returnData.accounts === 'undefined')
                return res.status(400).send("Có lỗi xảy ra, vui lòng thử lại sau");
        }
        res.send(returnData);
        
    });
}

exports.checkBodyCreateReportUser = [
    body('reason', 'Lí do phải hơn 5 kí tự và không quá 50 kí tự').isString().isLength({min: 5, max: 50}),
    body('user_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createUserReport = (req, res) => {
    const { reason, 'user_id': userId } = req.body;
    waterfall([
        (cb) => { // Check if report is exist already
            reportModel
            .countDocuments(
                {
                    user: userId,
                    reason,
                    owner: req.user._id,
                    type: 'user'
                },
                (err, count) => {
                    if(err){
                        console.log('Error in ctl/account/view-account.js -> createUserReport 01 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(count !== 0) return cb(`Bạn đã báo cáo với lí do "${reason}" rồi`)
                    cb(null);
                }
            )
        },
        (cb) => { // Create report
            new reportModel({
                user: userId,
                reason,
                owner: req.user._id,
                type: 'user'
            }).save(err => {
                if(err){
                    console.log('Error in ctl/account/view-account.js -> createUserReport 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, 'Báo cáo thành công');
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}