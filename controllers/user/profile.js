
const { body, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
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

const config = require('../../config/config');

const userModel = require('../../models/user');
const accountModel = require('../../models/account');
const collectionModel = require('../../models/collection');

// -------------------------------- Profile User ------------------------------------------------

exports.renderPage = function(req, res){
    return res.render('user/profile', {title: 'Trang cá nhân', user: req.user, csrfToken: req.csrfToken()});
}

exports.checkBodyUpdateProfile = [
    body('name', 'Tên phải daì ít nhất 3 kí tự và ít hơn 20 kí tự').isString().isLength({min: 3, max: 20}),
    body('email', 'Email không hợp lệ').isString().isLength({min: 3, max: 20})
]

exports.updateProfile = function(req, res){

    // Check if login
    if(!req.isAuthenticated())
        return res.status(401).send("Unauthorized");

    waterfall([
        (cb) => { // Check if email is exist
            userModel.findOne({email: req.body.email}, (err, user) => {
                if(err){
                    console.log('Err in CLS/user/profile->updateProfile 01' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                if(!user) return cb(null);
                if(user._id.toString() !== req.user._id.toString() && user.email == req.body.email)
                    return cb("Email đã tồn tại");
                cb(null);
            });
        },
        (cb) => {   // Update user
            const payload = {
                name: req.body.name,
                email: req.body.email
            }

            userModel.updateOne({_id: req.user._id}, payload, {runValidators: true}, err => {
                if(err) {
                    console.log('Err in CLS/user/profile->updateProfile 02' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                return cb(null, "Cập nhật thành công!");
            });
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    });

    
}

exports.checkBodyUpdatePassWord = [
    body('password', 'Password không hợp lệ').isString().isLength({min: 3}),
    body('new_password', 'Password new không hợp lệ').isString().isLength({min: 3}),
    body('confirm_password', 'Password confirm không hợp lệ').isString().isLength({min: 3}),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.updatePassword = function(req, res){

    // Check if login
    if(!req.isAuthenticated())
        return res.status(401).send('Authentication required');

    // Check if confirm password not match
    if(req.body.new_password !== req.body.confirm_password)
        return res.status(400).send("Password confirm không hợp lệ");

    // Check if old password equal new password
    if(req.body.password == req.body.new_password)
        return res.status(400).send("Password mới không thể trùng với password cũ");

    waterfall([
        (cb) => {   // Find user 
            
            userModel.findById(req.user._id, (err, user) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                if(user === null) return cb("Xin hãy logout và đăng nhập lại");
                cb(null, {user: user});
            });
        },
        (result, cb) => {   // validate password and update if correct
            if(!userModel.validatePassword(req.body.password, result.user.password))
                return cb("Mật khẩu hiện tại không đúng")
            
            const newHashPassword = userModel.hashPassword(req.body.new_password);
            userModel.updateOne({_id: req.user._id}, {password: newHashPassword}, err => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                cb(null, "Cập nhật mật khẩu thành công");
            })
        }
    ], function(err, result) {
        if(err) return res.status(400).send(err);
        res.send(result);
    });
}

// -------------------------------- Profile Account ------------------------------------------------

exports.renderProfileAccount = function(req, res){
    if(!req.isAuthenticated())
        return res.render('user/profile-account', {title: "Những tài khoản đã đăng", error: "Bạn chưa đăng nhập"});
    waterfall([
        (cb) => {
            accountModel.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(req.user._id)
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
                    $lookup: {
                        from: 'rates',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'rates'
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
                        totalViews: {$size: '$views'},
                        image: {
                            $cond: [
                                {$anyElementTrue: '$images'},
                                {$arrayElemAt: ['$images', 0]},
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
                        _id: "$_id",
                        status: {$first: '$status'},
                        title: {$first: '$title'},
                        c_name: {$first: '$c_name'},
                        level: {$first: '$level'},
                        phai: {$first: '$phai'},
                        vohon: {$first: '$vohon'},
                        amkhi: {$first: '$amkhi'},
                        thankhi: {$first: '$thankhi'},
                        tuluyen: {$first: '$tuluyen'},
                        ngoc: {$first: '$ngoc'},
                        doche: {$first: '$doche'},
                        dieuvan: {$first: '$dieuvan'},
                        longvan: {$first: '$longvan'},
                        server: {$first: '$server'},
                        sub_server: {$first: '$sub_server'},
                        price: {$first: '$price'},
                        phaigiaoluu: {$first: '$phaigiaoluu'},
                        transaction_type: {$first: '$transaction_type'},
                        createdAt: {$first: '$createdAt'},
                        updatedAt: {$first: '$updatedAt'},
                        totalViews: {$first: '$totalViews'},
                        totalRates: {$avg: '$rates.rate'},
                        image: {$first: '$image'}
                    }
                },
                {
                    $facet: {
                        accounts: [
                            {
                                $sort: {
                                    createdAt: -1
                                }
                            },
                            {
                                $limit: 2
                            }
                        ],
                        totalAccount: [
                            {
                                $count: 'total'
                            }
                        ]
                    }
                },
            ], function(err, result){
                if(err) return cb(err);
                // Initialize payload
                let payload = {};
                // Check if empty
                if(result.length == 0 || result[0].accounts.length == 0 || result[0].totalAccount.length == 0){
                    payload.accounts = [];
                    payload.totalAccount = 0;
                } 
                else{
                    payload.accounts = result[0].accounts,
                    payload.totalAccount = result[0].totalAccount[0].total;
                }
                cb(null, payload);
            });
        },
        (result, cb) => {
            if(result.accounts.length === 0) return cb(null, result);
            accountModel.populate(result.accounts, config.account.popAcFields, (err, accounts) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                result.accounts = accounts;
                cb(null, result);
            });
        }
    ], (err, result) => {
        if(err) return cb(err);

        res.render('user/profile-account', {
            title: 'Những tài khoản đã đăng', 
            user: req.user, 
            accounts: result.accounts,
            totalAccount: result.totalAccount,
            csrfToken: req.csrfToken()});
    });
}

exports.getAccount = function(req, res){
    const textSearch = req.query.search.value;
    const sortColum = req.query.order[0];
    let sortCondition = {};
    switch (Number(sortColum.column)){
        case 2:
            sortCondition.title = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 3:
            sortCondition.c_name = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 4:
            sortCondition.status = sortColum.dir == 'asc' ? 1 : -1;
        case 5:
            sortCondition.phai = sortColum.dir == 'asc' ? 1 : -1;
        case 6:
            sortCondition.server = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 7:
            sortCondition.transaction_type = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 8:
            sortCondition.price = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 9:
            sortCondition.phaigiaoluu = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 10:
            sortCondition.ngoc = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 11:
            sortCondition.createdAt = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 12:
            sortCondition.rates = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 13:
            sortCondition.views = sortColum.dir == 'asc' ? 1 : -1;
            break;
        default:
            sortCondition.createdAt = -1;
    }
    console.log(sortCondition);
    let condition = [];
    if(textSearch !==  ''){
        condition.push({title: {$regex: textSearch, $options: 'i'}});
        condition.push({c_name: {$regex: textSearch, $options: 'i'}});
        condition.push({server: {$regex: textSearch, $options: 'i'}});
        condition.push({sub_server: {$regex: textSearch, $options: 'i'}});
        condition.push({transaction_type: {$regex: textSearch, $options: 'i'}});
        condition.push({price: isNaN(textSearch) ? {$regex: textSearch, $options: 'i'} : Number(textSearch)});
        condition.push({phaigiaoluu: {$regex: textSearch, $options: 'i'}});
        condition.push({ngoc: {$regex: textSearch, $options: 'i'}});
        condition.push({status: {$regex: textSearch, $options: 'i'}});
    }
    if(mongoose.Types.ObjectId.isValid(textSearch))
        condition.push({_id: mongoose.Types.ObjectId(textSearch)});

    const lookupAggregate = [
        {
            $lookup: {
                from: 'item-properties',
                localField: 'server',
                foreignField: '_id',
                as: 'serverDoc'
            }
        },
        {
            $lookup: {
                from: 'item-properties',
                localField: 'sub_server',
                foreignField: '_id',
                as: 'subServerDoc'
            }
        },
        {
            $lookup: {
                from: 'phais',
                localField: 'phai',
                foreignField: '_id',
                as: 'phaiDoc'
            }
        },
        {
            $lookup: {
                from: 'phais',
                localField: 'phaigiaoluu',
                foreignField: '_id',
                as: 'phaigiaoluuDoc'
            }
        },
        {
            $lookup: {
                from: 'item-properties',
                localField: 'ngoc',
                foreignField: '_id',
                as: 'ngocDoc'
            }
        },
        {
            $lookup: {
                from: 'images',
                localField: '_id',
                foreignField: 'account',
                as: 'image'
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
            $lookup: {
                from: 'rates',
                localField: '_id',
                foreignField: 'account',
                as: 'rates'
            }
        },
        {
            $addFields: {
                views: {$size: '$views'}
            }
        }
    ];

    const addFieldsAggregate = [
        {
            $addFields: {
                totalRates : { $size: '$rates'}
            }
        }
    ];

    const unwindAggregate = [
        {
            $unwind: {
                path: '$rates',
                preserveNullAndEmptyArrays: true
            }
        }
    ];

    const groupAggregate = [
        {
            $group: {
                _id: '$_id',
                image: {$first: '$image'},
                title: {$first: '$title'},
                c_name: {$first: '$c_name'},
                level: {$first: '$level'},
                server: {$first: '$server'},
                sub_server: {$first: '$sub_server'},
                phai: {$first: '$phai'},
                transaction_type: {$first: '$transaction_type'},
                price: {$first: '$price'},
                phaigiaoluu: {$first: '$phaigiaoluu'},
                ngoc: {$first: '$ngoc'},
                views: {$first: '$views'},
                rates: {$avg: '$rates.rate'},
                createdAt: {$first: '$createdAt'},
                updatedAt: {$first: '$updatedAt'},
                phaiDoc: {$first: '$phaiDoc'},
                ngocDoc: {$first: '$ngocDoc'},
                phaigiaoluuDoc: {$first: '$phaigiaoluuDoc'},
                subServerDoc: {$first: '$subServerDoc'},
                serverDoc: {$first: '$serverDoc'},
                userId: {$first: '$userId'},
                status: {$first: '$status'},
                totalRates: {$first: '$totalRates'}
            }
        },
        {
            $sort: {_id: -1}
        }
    ]

    const projectAggregate = [
        {
            $project: {
                _id: 1,
                image: {$cond: [
                    {$anyElementTrue: "$image"},
                    {$arrayElemAt: ["$image.url", 0]},
                    'no-image.png'
                ]},
                title: 1,
                c_name: 1,
                level: 1,
                server: { $arrayElemAt: [ "$serverDoc.name", 0 ] },
                sub_server: { $arrayElemAt: [ "$subServerDoc.name", 0 ] },
                phai: { $arrayElemAt: [ "$phaiDoc.name", 0 ] },
                transaction_type: {
                    $switch: {
                        branches: [
                            {case: {$eq: ['$transaction_type', 'sell']}, then: "Bán"},
                            {case: {$eq: ['$transaction_type', 'trade']}, then: "Giao lưu"},
                            {case: {$eq: ['$transaction_type', 'all']}, then: "Bán và giao lưu"}
                        ],
                        default: "Không hợp lệ"
                    }
                },
                status: {
                    $switch: {
                        branches: [
                            {case: {$eq: ['$status', 'pending']}, then: 'Đang đăng'},
                            {case: {$eq: ['$status', 'done']}, then: 'Xong'},
                            {case: {$eq: ['$status', 'lock']}, then: 'Khoá'}
                        ],
                        default: 'Không hợp lệ'
                    }
                },
                price: 1,
                phaigiaoluu: {
                    $cond: [
                        {$anyElementTrue: "$phaigiaoluuDoc"},
                        {$arrayElemAt: [ "$phaigiaoluuDoc.name", 0 ] },
                        'Không có'
                    ]
                },
                ngoc: { $arrayElemAt: [ "$ngocDoc.name", 0 ] },
                views: 1,
                rates: 1,
                createdAt: 1,
                updatedAt: 1,
                userId: 1,
                totalRates: 1
            }
        }
    ]

    let matchAggregate = null;
    if(condition.length === 0) {
        matchAggregate = [
            {
                $match: {
                    userId: mongoose.Types.ObjectId(req.user._id)
                }
            }
        ];
    }
    else{
        matchAggregate = [
            {
                $match: {
                    $and: [
                        {userId: mongoose.Types.ObjectId(req.user._id)},
                        {$or: condition}
                    ]
                }
            }
        ];
    }

    const facetAggregate = [
        {
            $facet:{
                accounts: [
                    {
                        $sort: sortCondition
                    },
                    {
                        $skip: Number(req.query.start)
                    },
                    {
                        $limit: Number(req.query.length)
                    }
                ],
                totalAccount: [
                    {
                        $count: 'total'
                    }
                ]
            }
        }
    ]
    
    const pipelineAggregate = lookupAggregate.concat(addFieldsAggregate, unwindAggregate, groupAggregate, projectAggregate, matchAggregate, facetAggregate);

    accountModel.aggregate(pipelineAggregate, async function(err, result) {
        if(err){
            return res.status(400).send('có lỗi vui lòng thủ lại sau');
        }

        let payload = {};
        const data = [];
        let returnData = {};

        // Check if empty
        if(result.length == 0 || result[0].accounts.length == 0 || result[0].totalAccount.length == 0){
            returnData = {
                draw: Number(req.query.draw),
                recordsTotal: 0,
                recordsFiltered: 0,
                data: data
            }
        } 
        else{
                const totalAccounts = await accountModel.estimatedDocumentCount();
                payload.accounts = result[0].accounts;
                payload.totalAccount = result[0].totalAccount[0].total;
                payload.accounts.forEach(function(account){
                const payload = [
                    account._id,
                    account.image,
                    account.title,
                    account.c_name,
                    account.status,
                    account.phai,
                    account.server + ' - ' + account.sub_server,
                    account.transaction_type,
                    account.price,
                    account.phaigiaoluu,
                    account.ngoc,
                    dateFormat(new Date(account.createdAt), "d mmmm, yyyy"),
                    [account.rates, account.totalRates],
                    account.views

                ];
                data.push(payload);
            })
            returnData = {
                draw: Number(req.query.draw),
                recordsTotal: totalAccounts,
                recordsFiltered: payload.totalAccount,
                data: data
            }
        }
        res.send(returnData);
    })
}


// -------------------------------- Profile collection ------------------------------------------------

exports.renderCollection = (req, res) => {
    waterfall([
        (cb) => { // Get collection
            collectionModel.aggregate([
                {
                    $match: { // Match user id
                        user: mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $lookup: { // Query account
                        from: 'accounts',
                        let: { accountId: '$account'},
                        pipeline: [
                            {
                                $match: { 
                                    $expr: {
                                        $eq: ['$_id', '$$accountId']
                                    }
                                }
                            },
                            {
                                $lookup: { // Query view
                                    from: 'views',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'views'
                                }
                            },
                            {
                                $addFields: { // Calculate total view
                                    totalView: {$size: '$views'}
                                }
                            },
                            {
                                $lookup: { // Query image
                                    from: 'images',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'images'
                                }
                            },
                            {
                                $addFields: { // Check image exist if have get first element otherwise return df image
                                    image: {
                                        $cond: [
                                            { $anyElementTrue: ['$images'] },
                                            { $arrayElemAt: ['$images.url', 0]},
                                            'no-image.png'
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: { // Query rate
                                    from: 'rates',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'rates'
                                }
                            },
                            {
                                $unwind: { // Extract rate to calculate rate
                                    path: '$rates',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $group: { // Group account after extract
                                    _id: '$_id',
                                    userId: {$first: '$userId'},
                                    title: {$first: '$title'},
                                    c_name: {$first: '$c_name'},
                                    phai: {$first: '$phai'},
                                    server: {$first: '$server'},
                                    sub_server: {$first: '$sub_server'},
                                    ngoc: {$first: '$ngoc'},
                                    dieuvan: {$first: '$dieuvan'},
                                    vohon: {$first: '$vohon'},
                                    transaction_type: {$first: '$transaction_type'},
                                    price: {$first: '$price'},
                                    phaigiaoluu: {$first: '$phaigiaoluu'},
                                    status: {$first: '$status'},
                                    image: {$first: '$image'},
                                    totalView: {$first: '$totalView'},
                                    totalRate: {$avg: '$rates.rate'},
                                    createdAt: {$first: '$createdAt'}
                                }
                            }
                        ],
                        as: 'account'
                    }
                },
                {
                    $addFields: {
                        account: {
                            $cond: [
                                { $anyElementTrue: ['$account'] },
                                { $arrayElemAt: ['$account', 0]},
                                null
                            ]
                        }
                    }
                }
            ], function(err, collections){
                if(err){
                    console.log('Error in ctl/user/profile.js -> renderCollection 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                // Check if collections equal zero
                if(collections.length === 0) return cb(null, {collections: []});
                cb(null, {collections: collections})
            })
        },
        (result, cb) => { // Populate account field in collections
            if(result.collections.length === 0) return cb(null, result);

             // Add account to populate field
             let popAcFields = config.account.popAcFields.map(field => {
                let payload = Object.assign({}, field);
                payload.path = 'account.' + payload.path;
                return payload;
            });

            // Add userId field
            popAcFields.push({
                path: 'account.userId',
                model: 'users'
            });
           
            // Populate account
            collectionModel.populate(result.collections, popAcFields, (err, collections) => {
                if(err){
                    console.log('Error in ctl/user/profile.js -> renderCollection 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                collections.forEach(collection => {
                    if(collection.account)
                        collection.account.createdAt = dateFormat(new Date(collection.account.createdAt), "d mmmm, yyyy")
                });
                cb(null, {collections: collections})
            })
        },
    ], function(err, result){
        if(err) return res.render('user/profile-collection', {title: 'Trang cá nhân', user: req.user, error: err, csrfToken: req.csrfToken()});
        res.render('user/profile-collection', {title: 'Trang cá nhân', user: req.user, collections: result.collections, csrfToken: req.csrfToken()});
    });
    
}