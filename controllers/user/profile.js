const {query, body, validationResult} = require('express-validator');
const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const dateFormat = require('dateformat');
dateFormat.i18n = {
    dayNames: [
        'CN',
        'T2',
        'T3',
        'T4',
        'T5',
        'T6',
        'T7',
        'Chủ Nhật',
        'Thứ 2',
        'Thứ 3',
        'Thứ 4',
        'Thứ 5',
        'Thứ 6',
        'Thứ 7'
    ],
    monthNames: [
        'Th.1',
        'Th.2',
        'Th.3',
        'Th.4',
        'Th.5',
        'Th.6',
        'Th.7',
        'Th.8',
        'Th.9',
        'Th.10',
        'Th.11',
        'Th.12',
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12'
    ],
    timeNames: [
        'a',
        'p',
        'am',
        'pm',
        'A',
        'P',
        'AM',
        'PM'
    ]
};

const config = require('../../config/config');
const helper = require('../../help/helper');

const userModel = require('../../models/user');
const accountModel = require('../../models/account');
const collectionModel = require('../../models/collection');
const activityModel = require('../../models/activity');
const notificationModel = require('../../models/notification');
const reportModel = require('../../models/report');

// -------------------------------- Profile User ------------------------------------------------

exports.renderPage = function (req, res) {
    return res.render('user/profile', {
        title: 'Trang cá nhân',
        user: req.user,
        csrfToken: req.csrfToken()
    });
}

exports.checkBodyUpdateProfile = [
    body('name', 'Tên phải daì ít nhất 3 kí tự và ít hơn 20 kí tự').isString().isLength(
        {min: 3, max: 20}
    ),
    body('email', 'Email không hợp lệ').isEmail(),
    body('phone', 'Phone không hợp lệ').optional().isMobilePhone(),
    body('linkFB', 'Link Facebook không hợp lệ').optional().isURL(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (! errors.isEmpty()) 
            return res.status(400).send(errors.array()[0].msg);
        


        next();
    }
]

exports.updateProfile = function (req, res) {
    waterfall([
        (cb) => { // Check if email is exist
            userModel.findOne({
                email: req.body.email
            }, (err, user) => {
                if (err) {
                    console.log('Err in CLS/user/profile->updateProfile 01' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                if (!user) 
                    return cb(null);
                


                if (user._id.toString() !== req.user._id.toString() && user.email == req.body.email) 
                    return cb("Email đã tồn tại");
                


                cb(null);
            });
        },
        (cb) => { // Update user
            const payload = {
                name: req.body.name,
                email: req.body.email,
                phone: isNaN(req.body.phone) ? null : req.body.phone,
                linkFB: req.body.linkFB ? req.body.linkFB : null
            }

            userModel.updateOne({
                _id: req.user._id
            }, payload, {
                runValidators: true
            }, err => {
                if (err) {
                    console.log('Err in CLS/user/profile->updateProfile 02' + err);
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                return cb(null, "Cập nhật thành công!");
            });
        }
    ], function (err, result) {
        if (err) 
            return res.status(400).send(err);
        


        res.send(result);
    });


}

exports.checkBodyUpdatePassWord = [
    body('password', 'Password không hợp lệ').isString().isLength(
        {min: 3}
    ),
    body('new_password', 'Password new không hợp lệ').isString().isLength(
        {min: 3}
    ),
    body('confirm_password', 'Password confirm không hợp lệ').isString().isLength(
        {min: 3}
    ),
    (req, res, next) => {
        const errors = validationResult(req);
        if (! errors.isEmpty()) 
            return res.status(400).send(errors.array()[0].msg);
        


        next();
    }
]

exports.updatePassword = function (req, res) { // Check if login
    if (! req.isAuthenticated()) 
        return res.status(401).send('Authentication required');
    


    // Check if confirm password not match
    if (req.body.new_password !== req.body.confirm_password) 
        return res.status(400).send("Password confirm không hợp lệ");
    


    // Check if old password equal new password
    if (req.body.password == req.body.new_password) 
        return res.status(400).send("Password mới không thể trùng với password cũ");
    


    waterfall([
        (cb) => { // Find user

            userModel.findById(req.user._id, (err, user) => {
                if (err) 
                    return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                


                if (user === null) 
                    return cb("Xin hãy logout và đăng nhập lại");
                


                cb(null, {user: user});
            });
        },
        (result, cb) => { // validate password and update if correct
            if (! userModel.validatePassword(req.body.password, result.user.password)) 
                return cb("Mật khẩu hiện tại không đúng")


            


            const newHashPassword = userModel.hashPassword(req.body.new_password);
            userModel.updateOne({
                _id: req.user._id
            }, {
                password: newHashPassword
            }, err => {
                if (err) 
                    return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                


                cb(null, "Cập nhật mật khẩu thành công");
            })
        }
    ], function (err, result) {
        if (err) 
            return res.status(400).send(err);
        


        res.send(result);
    });
}

// -------------------------------- Profile Account ------------------------------------------------

exports.renderProfileAccount = function (req, res) {
    if (! req.isAuthenticated()) 
        return res.render('user/profile-account', {
            title: "Những tài khoản đã đăng",
            error: "Bạn chưa đăng nhập"
        });
    


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
                }, {
                    $addFields: {
                        totalViews: {
                            $size: '$views'
                        },
                        image: {
                            $cond: [
                                {
                                    $anyElementTrue: '$images'
                                }, {
                                    $arrayElemAt: ['$images', 0]
                                },
                                'no-image.png'
                            ]
                        }
                    }
                }, {
                    $unwind: {
                        path: '$rates',
                        preserveNullAndEmptyArrays: true
                    }
                }, {
                    $group: {
                        _id: "$_id",
                        status: {
                            $first: '$status'
                        },
                        title: {
                            $first: '$title'
                        },
                        c_name: {
                            $first: '$c_name'
                        },
                        level: {
                            $first: '$level'
                        },
                        phai: {
                            $first: '$phai'
                        },
                        vohon: {
                            $first: '$vohon'
                        },
                        amkhi: {
                            $first: '$amkhi'
                        },
                        thankhi: {
                            $first: '$thankhi'
                        },
                        tuluyen: {
                            $first: '$tuluyen'
                        },
                        ngoc: {
                            $first: '$ngoc'
                        },
                        doche: {
                            $first: '$doche'
                        },
                        dieuvan: {
                            $first: '$dieuvan'
                        },
                        longvan: {
                            $first: '$longvan'
                        },
                        server: {
                            $first: '$server'
                        },
                        sub_server: {
                            $first: '$sub_server'
                        },
                        price: {
                            $first: '$price'
                        },
                        phaigiaoluu: {
                            $first: '$phaigiaoluu'
                        },
                        transaction_type: {
                            $first: '$transaction_type'
                        },
                        createdAt: {
                            $first: '$createdAt'
                        },
                        updatedAt: {
                            $first: '$updatedAt'
                        },
                        totalViews: {
                            $first: '$totalViews'
                        },
                        totalRates: {
                            $avg: '$rates.rate'
                        },
                        image: {
                            $first: '$image'
                        }
                    }
                }, {
                    $facet: {
                        accounts: [
                            {
                                $sort: {
                                    createdAt: -1
                                }
                            }, {
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
            ], function (err, result) {
                if (err) 
                    return cb(err);
                


                // Initialize payload
                let payload = {};
                // Check if empty
                if (result.length == 0 || result[0].accounts.length == 0 || result[0].totalAccount.length == 0) {
                    payload.accounts = [];
                    payload.totalAccount = 0;
                } else {
                    payload.accounts = result[0].accounts,
                    payload.totalAccount = result[0].totalAccount[0].total;
                }
                cb(null, payload);
            });
        },
        (result, cb) => {
            if (result.accounts.length === 0) 
                return cb(null, result);
            


            accountModel.populate(result.accounts, config.account.popAcFields.concat(helper.getItemPopACField()), (err, accounts) => {
                if (err) 
                    return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                


                result.accounts = accounts;
                cb(null, result);
            });
        }
    ], (err, result) => {
        if (err) 
            return cb(err);
        


        res.render('user/profile-account', {
            title: 'Những tài khoản đã đăng',
            user: req.user,
            accounts: result.accounts,
            totalAccount: result.totalAccount,
            csrfToken: req.csrfToken()
        });
    });
}

exports.getAccount = function (req, res) {
    const textSearch = req.query.search.value;
    const sortColum = req.query.order[0];
    let sortCondition = {};
    switch (Number(sortColum.column)) {
        case 2: sortCondition.title = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 3: sortCondition.c_name = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 4: sortCondition.status = sortColum.dir == 'asc' ? 1 : -1;
        case 5: sortCondition.phai = sortColum.dir == 'asc' ? 1 : -1;
        case 6: sortCondition.server = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 7: sortCondition.transaction_type = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 8: sortCondition.price = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 9: sortCondition.phaigiaoluu = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 10: sortCondition.ngoc = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 11: sortCondition.createdAt = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 12: sortCondition.rates = sortColum.dir == 'asc' ? 1 : -1;
            break;
        case 13: sortCondition.views = sortColum.dir == 'asc' ? 1 : -1;
            break;
        default: sortCondition.createdAt = -1;
    }
    let condition = [];
    if (textSearch !== '') {
        condition.push({
            title: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            c_name: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            server: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            sub_server: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            transaction_type: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            price: isNaN(textSearch) ? {
                $regex: textSearch,
                $options: 'i'
            } : Number(textSearch)
        });
        condition.push({
            phaigiaoluu: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            ngoc: {
                $regex: textSearch,
                $options: 'i'
            }
        });
        condition.push({
            status: {
                $regex: textSearch,
                $options: 'i'
            }
        });
    }
    if (mongoose.Types.ObjectId.isValid(textSearch)) 
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
        }, {
            $lookup: {
                from: 'item-properties',
                localField: 'ngoc',
                foreignField: '_id',
                as: 'ngocDoc'
            }
        }, {
            $lookup: {
                from: 'images',
                localField: '_id',
                foreignField: 'account',
                as: 'image'
            }
        }, {
            $lookup: {
                from: 'views',
                localField: '_id',
                foreignField: 'account',
                as: 'views'
            }
        }, {
            $lookup: {
                from: 'rates',
                localField: '_id',
                foreignField: 'account',
                as: 'rates'
            }
        }, {
            $addFields: {
                views: {
                    $size: '$views'
                }
            }
        }
    ];

    const addFieldsAggregate = [{
            $addFields: {
                totalRates: {
                    $size: '$rates'
                }
            }
        }];

    const unwindAggregate = [{
            $unwind: {
                path: '$rates',
                preserveNullAndEmptyArrays: true
            }
        }];

    const groupAggregate = [
        {
            $group: {
                _id: '$_id',
                image: {
                    $first: '$image'
                },
                title: {
                    $first: '$title'
                },
                c_name: {
                    $first: '$c_name'
                },
                level: {
                    $first: '$level'
                },
                server: {
                    $first: '$server'
                },
                sub_server: {
                    $first: '$sub_server'
                },
                phai: {
                    $first: '$phai'
                },
                transaction_type: {
                    $first: '$transaction_type'
                },
                price: {
                    $first: '$price'
                },
                phaigiaoluu: {
                    $first: '$phaigiaoluu'
                },
                ngoc: {
                    $first: '$ngoc'
                },
                views: {
                    $first: '$views'
                },
                rates: {
                    $avg: '$rates.rate'
                },
                createdAt: {
                    $first: '$createdAt'
                },
                updatedAt: {
                    $first: '$updatedAt'
                },
                phaiDoc: {
                    $first: '$phaiDoc'
                },
                ngocDoc: {
                    $first: '$ngocDoc'
                },
                phaigiaoluuDoc: {
                    $first: '$phaigiaoluuDoc'
                },
                subServerDoc: {
                    $first: '$subServerDoc'
                },
                serverDoc: {
                    $first: '$serverDoc'
                },
                userId: {
                    $first: '$userId'
                },
                status: {
                    $first: '$status'
                },
                totalRates: {
                    $first: '$totalRates'
                }
            }
        }, {
            $sort: {
                _id: -1
            }
        }
    ]

    const projectAggregate = [{
            $project: {
                _id: 1,
                image: {
                    $cond: [
                        {
                            $anyElementTrue: "$image"
                        }, {
                            $arrayElemAt: ["$image.url", 0]
                        },
                        'no-image.png'
                    ]
                },
                title: 1,
                c_name: 1,
                level: 1,
                server: {
                    $arrayElemAt: ["$serverDoc.name", 0]
                },
                sub_server: {
                    $arrayElemAt: ["$subServerDoc.name", 0]
                },
                phai: {
                    $arrayElemAt: ["$phaiDoc.name", 0]
                },
                transaction_type: {
                    $switch: {
                        branches: [
                            {
                                case: {
                                    $eq: ['$transaction_type', 'sell']
                                },
                                then: "Bán"
                            }, {
                                case: {
                                    $eq: ['$transaction_type', 'trade']
                                },
                                then: "Giao lưu"
                            }, {
                                case: {
                                    $eq: ['$transaction_type', 'all']
                                },
                                then: "Bán và giao lưu"
                            }
                        ],
                        default: "Không hợp lệ"
                    }
                },
                status: {
                    $switch: {
                        branches: [
                            {
                                case: {
                                    $eq: ['$status', 'pending']
                                },
                                then: 'Đang đăng'
                            }, {
                                case: {
                                    $eq: ['$status', 'done']
                                },
                                then: 'Xong'
                            }, {
                                case: {
                                    $eq: ['$status', 'lock']
                                },
                                then: 'Khoá'
                            }
                        ],
                        default: 'Không hợp lệ'
                    }
                },
                price: 1,
                phaigiaoluu: {
                    $cond: [
                        {
                            $anyElementTrue: "$phaigiaoluuDoc"
                        }, {
                            $arrayElemAt: ["$phaigiaoluuDoc.name", 0]
                        },
                        'Không có'
                    ]
                },
                ngoc: {
                    $arrayElemAt: ["$ngocDoc.name", 0]
                },
                views: 1,
                rates: 1,
                createdAt: 1,
                updatedAt: 1,
                userId: 1,
                totalRates: 1
            }
        }]

    let matchAggregate = null;
    if (condition.length === 0) {
        matchAggregate = [{
                $match: {
                    userId: mongoose.Types.ObjectId(req.user._id)
                }
            }];
    } else {
        matchAggregate = [{
                $match: {
                    $and: [
                        {
                            userId: mongoose.Types.ObjectId(req.user._id)
                        }, {
                            $or: condition
                        }
                    ]
                }
            }];
    }

    const facetAggregate = [{
            $facet: {
                accounts: [
                    {
                        $sort: sortCondition
                    }, {
                        $skip: Number(req.query.start)
                    }, {
                        $limit: Number(req.query.length)
                    }
                ],
                totalAccount: [
                    {
                        $count: 'total'
                    }
                ]
            }
        }]

    const pipelineAggregate = lookupAggregate.concat(addFieldsAggregate, unwindAggregate, groupAggregate, projectAggregate, matchAggregate, facetAggregate);

    accountModel.aggregate(pipelineAggregate, async function (err, result) {
        if (err) {
            return res.status(400).send('có lỗi vui lòng thủ lại sau');
        }

        let payload = {};
        const data = [];
        let returnData = {};

        // Check if empty
        if (result.length == 0 || result[0].accounts.length == 0 || result[0].totalAccount.length == 0) {
            returnData = {
                draw: Number(req.query.draw),
                recordsTotal: 0,
                recordsFiltered: 0,
                data: data
            }
        } else {
            const totalAccounts = await accountModel.countDocuments({userId: req.user._id}).catch(err => false);
            if (totalAccounts === false) 
                return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');
            


            payload.accounts = result[0].accounts;
            payload.totalAccount = result[0].totalAccount[0].total;
            payload.accounts.forEach(function (account) {
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
                    [
                        account.rates, account.totalRates
                    ],
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
        } res.send(returnData);
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
                }, {
                    $lookup: { // Query account
                        from: 'accounts',
                        let: {
                            accountId: '$account'
                        },
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
                                    totalView: {
                                        $size: '$views'
                                    }
                                }
                            },
                            {
                                $lookup: { // Query image
                                    from: 'images',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'images'
                                }
                            }, {
                                $addFields: { // Check image exist if have get first element otherwise return df image
                                    image: {
                                        $cond: [
                                            {
                                                $anyElementTrue: ['$images']
                                            }, {
                                                $arrayElemAt: ['$images.url', 0]
                                            },
                                            'no-image.png'
                                        ]
                                    }
                                }
                            }, {
                                $lookup: { // Query rate
                                    from: 'rates',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'rates'
                                }
                            }, {
                                $unwind: { // Extract rate to calculate rate
                                    path: '$rates',
                                    preserveNullAndEmptyArrays: true
                                }
                            }, {
                                $group: {
                                    // Group account after extract
                                    _id: '$_id',
                                    userId: {
                                        $first: '$userId'
                                    },
                                    title: {
                                        $first: '$title'
                                    },
                                    c_name: {
                                        $first: '$c_name'
                                    },
                                    phai: {
                                        $first: '$phai'
                                    },
                                    server: {
                                        $first: '$server'
                                    },
                                    sub_server: {
                                        $first: '$sub_server'
                                    },
                                    ngoc: {
                                        $first: '$ngoc'
                                    },
                                    dieuvan: {
                                        $first: '$dieuvan'
                                    },
                                    vohon: {
                                        $first: '$vohon'
                                    },
                                    transaction_type: {
                                        $first: '$transaction_type'
                                    },
                                    price: {
                                        $first: '$price'
                                    },
                                    phaigiaoluu: {
                                        $first: '$phaigiaoluu'
                                    },
                                    status: {
                                        $first: '$status'
                                    },
                                    image: {
                                        $first: '$image'
                                    },
                                    totalView: {
                                        $first: '$totalView'
                                    },
                                    totalRate: {
                                        $avg: '$rates.rate'
                                    },
                                    createdAt: {
                                        $first: '$createdAt'
                                    }
                                }
                            }
                        ],
                        as: 'account'
                    }
                }, {
                    $addFields: {
                        account: {
                            $cond: [
                                {
                                    $anyElementTrue: ['$account']
                                }, {
                                    $arrayElemAt: ['$account', 0]
                                },
                                null
                            ]
                        }
                    }
                }
            ], function (err, collections) {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> renderCollection 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                // Check if collections equal zero
                if (collections.length === 0) 
                    return cb(null, {collections: []});
                


                cb(null, {collections: collections})
            })
        },
        (result, cb) => { // Populate account field in collections
            if (result.collections.length === 0) 
                return cb(null, result);
            


            // Add account to populate field
            let popAcFields = config.account.popAcFields.concat(helper.getItemPopACField()).map(field => {
                let payload = Object.assign({}, field);
                payload.path = 'account.' + payload.path;
                return payload;
            });

            // Add userId field
            popAcFields.push({path: 'account.userId', model: 'users'});

            // Populate account
            collectionModel.populate(result.collections, popAcFields, (err, collections) => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> renderCollection 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                collections.forEach(collection => {
                    if (collection.account) 
                        collection.account.createdAt = dateFormat(new Date(collection.account.createdAt), "d mmmm, yyyy")


                    


                });
                cb(null, {collections: collections})
            })
        },
    ], function (err, result) {
        if (err) 
            return res.render('user/profile-collection', {
                title: 'Trang cá nhân',
                user: req.user,
                error: err,
                csrfToken: req.csrfToken()
            });
        


        res.render('user/profile-collection', {
            title: 'Trang cá nhân',
            user: req.user,
            collections: result.collections,
            csrfToken: req.csrfToken()
        });
    });

}

// -------------------------------- Profile activity ------------------------------------------------

exports.renderActivity = (req, res) => {
    res.render('user/profile-activity', {
        title: 'Hoạt động của bạn',
        user: req.user,
        csrfToken: req.csrfToken()
    });
}

exports.getActivities = (req, res) => {
    let condition = {
        owner: mongoose.Types.ObjectId(req.user._id)
    };

    if (typeof req.query.filter === 'string') 
        condition.type = req.query.filter;
    


    if (typeof req.query.continueId === 'string' && mongoose.Types.ObjectId.isValid(req.query.continueId)) 
        condition._id = {
            $lt: mongoose.Types.ObjectId(req.query.continueId)
        }


    


    waterfall([
        (cb) => { // Get activities
            activityModel.aggregate([
                {
                    $match: condition
                },
                {
                    $lookup: {
                        from: 'accounts',
                        let: {
                            idAccount: '$account'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$idAccount']
                                    }
                                }
                            }, {
                                $lookup: {
                                    from: 'users',
                                    localField: 'userId',
                                    foreignField: '_id',
                                    as: 'user'
                                }
                            }, {
                                $addFields: {
                                    user: {
                                        $cond: [
                                            {
                                                $anyElementTrue: ['$user']
                                            }, {
                                                $arrayElemAt: ['$user.status', 0]
                                            },
                                            null
                                        ]
                                    }
                                }
                            },
                        ],
                        as: 'accounts'
                    }
                },
                {
                    $addFields: { // Check account if delete
                        account: {
                            $cond: [
                                {
                                    $anyElementTrue: ['$accounts']
                                }, {
                                    $arrayElemAt: ['$accounts', 0]
                                }, {
                                    _id: '$account',
                                    status: 'deleted'
                                }
                            ]
                        }
                    }
                },
                {
                    $addFields: { // Check if account not delete but user is not normal
                        'account.status': {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $ne: ['$account.user', 'normal']
                                        }, {
                                            $ne: ['$account.status', 'deleted']
                                        }
                                    ]
                                },
                                'lock',
                                '$account.status'
                            ]
                        }
                    }
                }, {
                    $lookup: {
                        from: 'images',
                        localField: 'account._id',
                        foreignField: 'account',
                        as: 'images'
                    }
                }, {
                    $addFields: {
                        image: {
                            $cond: [
                                {
                                    $anyElementTrue: ['$images']
                                }, {
                                    $arrayElemAt: ['$images.url', 0]
                                },
                                'no-image.png'
                            ]
                        }
                    }
                }, {
                    $project: {
                        _id: 1,
                        type: 1,
                        account: {
                            $cond: [
                                {
                                    $or: [
                                        { // Check if account status is lock or account is delete(not found)
                                            $eq: ['$account.status', 'lock']
                                        }, {
                                            $eq: ['$account.status', 'deleted']
                                        }
                                    ]
                                }, {
                                    _id: "$account._id",
                                    status: "$account.status"
                                }, {
                                    _id: "$account._id",
                                    title: "$account.title",
                                    c_name: "$account.c_name",
                                    server: "$account.server",
                                    sub_server: "$account.sub_server",
                                    status: "$account.status",
                                    image: "$image"
                                }
                            ]
                        },
                        comment: 1,
                        user: 1,
                        rate: 1,
                        createdAt: 1
                    }
                }, {
                    $sort: {
                        createdAt: -1
                    }
                }, {
                    $limit: 5
                }
            ], function (err, result) {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> getActivities 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result);
            });
        },
        (activities, cb) => { // Populate field
            if (activities.length === 0) 
                return cb(null, []);
            


            const popFields = [
                {
                    path: 'account.server',
                    model: 'item-properties',
                    select: 'name'
                }, {
                    path: 'account.sub_server',
                    model: 'item-properties',
                    select: 'name'
                }, {
                    path: 'comment',
                    model: 'comments',
                    select: 'comment parent',
                    populate: {
                        path: 'parent',
                        model: 'comments',
                        select: 'comment'
                    }
                }, {
                    path: 'user',
                    model: 'users',
                    select: '_id name'
                }
            ];
            activityModel.populate(activities, popFields, (err, activities) => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> getActivities 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, activities)
            });
        },
        (activities, cb) => {
            if (activities.length === 0) 
                return cb(null, {
                    activities: [],
                    totalLeft: 0
                });
            


            const lastId = activities[activities.length - 1]._id;
            condition._id = {
                $lt: mongoose.Types.ObjectId(lastId)
            }
            activityModel.countDocuments(condition, (err, count) => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> getActivities 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                return cb(null, {
                    activities: activities,
                    totalLeft: count
                });
            });
        }
    ], function (err, result) {
        if (err) 
            return res.status(400).send(err);
        


        res.send(result);
    })
}

// -------------------------------- Profile notification ------------------------------------------------

exports.renderNotification = (req, res) => {
    res.render('user/profile-notification', {
        title: 'Thông báo của bạn',
        user: req.user,
        csrfToken: req.csrfToken()
    })
}

function setTextCmtOnMyAcNotify(notification) { // Check if value is parse success
    if (notification.values && notification.values.userAndOther) { // Get title account
        const titleAccount = notification.account ? notification.account.title : 'không tìm thấy';
        // Get text user and other
        const userAndOther = notification.values.userAndOther;
        // Get format
        const textFormat = config.notifyText[notification.type];
        // Apply filter
        notification.text = textFormat.replace('${userAndOther}', userAndOther).replace('${titleAccount}', titleAccount);
    } else 
        notification.text = null;
    


    return notification;
}
function setTextPlaceOfferOnMyAcNotify(notification) { // Check if value is parse success
    if (notification.values && notification.values.userAndOther) { // Get title account
        const titleAccount = notification.account ? notification.account.title : 'không tìm thấy';
        // Get text user and other
        const userAndOther = notification.values.userAndOther;
        // Get format
        const textFormat = config.notifyText[notification.type];
        // Apply filter
        notification.text = textFormat.replace('${userAndOther}', userAndOther).replace('${titleAccount}', titleAccount);
    } else 
        notification.text = null;
    


    return notification;
}

function setTextRateMyAcNotify(notification) { // Check if value is parse success
    if (notification.values && notification.values.userAndOther) { // Get title account
        const titleAccount = notification.account ? notification.account.title : 'không tìm thấy';
        // Get text user and other
        const userAndOther = notification.values.userAndOther;
        // Get format
        const textFormat = config.notifyText[notification.type];
        // Apply filter
        notification.text = textFormat.replace('${userAndOther}', userAndOther).replace('${titleAccount}', titleAccount);
    } else 
        notification.text = null;
    


    return notification;
}

function setTextRepMyCmtNotify(notification) { // Check if value is parse success
    if (notification.values && notification.values.userAndOther) { // Get text owner comment
        const ownerComment = notification.comment ? notification.comment.comment : 'không tìm thấy';
        // Get text user and other
        const userAndOther = notification.values.userAndOther;
        // Get format
        const textFormat = config.notifyText[notification.type];
        // Apply filter
        notification.text = textFormat.replace('${userAndOther}', userAndOther).replace('${comment}', ownerComment);
    } else 
        notification.text = null;
    


    return notification;
}

function setTextLikeMyCmtNotify(notification) { // Check if value is parse success
    if (notification.values && notification.values.userAndOther) { // Get text owner comment
        const ownerComment = notification.comment ? notification.comment.comment : 'không tìm thấy';
        // Get text user and other
        const userAndOther = notification.values.userAndOther;
        // Get format
        const textFormat = config.notifyText[notification.type];
        // Apply filter
        notification.text = textFormat.replace('${userAndOther}', userAndOther).replace('${comment}', ownerComment);
    } else 
        notification.text = null;
    


    return notification;
}

function setTextAdminLockAccount(notification) { // Check if account exist
    if (notification.account) { // Get account c_name
        const accountCname = notification.account.c_name;
        const textFormat = config.notifyText[notification.type];
        notification.text = textFormat.replace('${account_c_name}', accountCname);
    } else 
        notification.text = null;
    


    return notification;
}

exports.getNotifications = (req, res) => { // Analyze query
    let query = {
        owner: mongoose.Types.ObjectId(req.user._id)
    };
    if (typeof req.query.filter === 'string') 
        query.type = req.query.filter;
    


    if (typeof req.query.status === 'string') 
        query.status = req.query.status;
    


    if (typeof req.query.continueId === 'string' && mongoose.Types.ObjectId.isValid(req.query.continueId)) 
        query._id = {
            $lt: mongoose.Types.ObjectId(req.query.continueId)
        }


    


    waterfall([
        cb => { // Query notification
            const populateField = [
                {
                    path: 'comment',
                    select: '_id comment'
                }, {
                    path: 'account',
                    select: '_id title c_name'
                }
            ];
            notificationModel.find(query).sort({createdAt: -1}).limit(6).lean().populate(populateField).exec((err, notifications) => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> getNotifications 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, {notifications: notifications});
            })
        },
        (result, cb) => { // Apply notification.values to config text format
            if (result.notifications.length === 0) 
                return cb(null, result);
            


            result.notifications = result.notifications.map(notification => { // Parse values to object
                try {
                    notification.values = JSON.parse(notification.values);
                } catch (err) {
                    notification.values = null
                }
                // Check type of notification
                switch (notification.type) {
                    case 'comment-on-my-account':
                        return setTextCmtOnMyAcNotify(notification)
                    case 'place-offer-on-my-account':
                        return setTextPlaceOfferOnMyAcNotify(notification)
                    case 'rate-my-account':
                        return setTextRateMyAcNotify(notification)
                    case 'reply-my-comment':
                        return setTextRepMyCmtNotify(notification)
                    case 'like-my-comment':
                        return setTextLikeMyCmtNotify(notification)
                    case 'admin-lock-account':
                        return setTextAdminLockAccount(notification)
                    default:
                        notification.text = null;
                        return notification;
                }

            });
            cb(null, result);
        },
        (result, cb) => {
            // Get total left notification and continue updated Time
            // If result is lower than 6 mean no more
            if (result.notifications.length < 6) {
                result.continueTime = null;
                result.totalLeft = 0;
                return cb(null, result)
            }
            const lastId = result.notifications[(result.notifications.length - 1)]._id;
            let newQuery = query;
            newQuery._id = {
                $lt: mongoose.Types.ObjectId(lastId)
            }
            notificationModel.countDocuments(newQuery, (err, count) => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> getNotifications 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if (count === 0) {
                    result.totalLeft = 0;
                    result.continueId = null;
                } else {
                    result.totalLeft = count;
                    result.continueId = lastId;
                }
                cb(null, result);
            })
        }
    ], function (err, result) {
        if (err) 
            return res.status(400).send(err)


        


        res.send(result);
    })
}

exports.checkBodyUpdateNotification = [
    body('listIdNotifications', 'List Id không hợp lệ').optional().isArray(),
    body('isAll', 'Mã không hợp lệ').optional().isBoolean(),
    body('type', 'Type không hợp lệ').optional().isIn(
        ['comment-on-my-account', 'reply-my-comment', 'like-my-comment', 'admin-lock-account']
    ),
    body('status', 'Status không hợp lệ').isIn(
        ['seen', 'read']
    ),
    (req, res, next) => {
        const errors = validationResult(req);
        if (! errors.isEmpty()) 
            return res.status(400).send(errors.array()[0].msg);
        


        next();
    }
]

exports.updateStatusNotifications = (req, res) => {
    let query = {
        field: {},
        update: {}
    };
    if (req.body.listIdNotifications && (req.body.isAll || req.body.type)) 
        return res.status(400).send('Không hợp lệ')


    


    let listIdUpdate = [];
    let method = null;
    if (Array.isArray(req.body.listIdNotifications)) {
        method = 'listId';
        const notMongoId = req.body.listIdNotifications.some(id => {
            if (! mongoose.Types.ObjectId.isValid(id)) 
                return true;
             else 
                return false;
            


        })
        if (notMongoId) 
            return res.status(400).send('List Id không hợp lệ');
        


        listIdUpdate = req.body.listIdNotifications.map(id => {
            return mongoose.Types.ObjectId(id)
        })
        query.field._id = {
            $in: listIdUpdate
        };
        // Update 'unseen' status to 'seen' status only
        if (req.body.status === 'seen') {
            query.field.status = 'unseen'
            query.update.status = 'seen';
        } else if (req.body.status === 'read') 
            query.update.status = 'read';
         else 
            return res.status(400).send('Status không hợp lệ');
        


    }

    waterfall([
        (cb) => {
            if (method !== 'listId') 
                return cb(null);
            


            notificationModel.countDocuments({
                owner: req.user._id,
                _id: {
                    $in: listIdUpdate
                }
            }, (err, count) => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> updateStatusNotifications 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if (count != listIdUpdate.length) 
                    return cb("Bạn không có quyền chỉnh sửa thông báo này")


                


                cb(null);
            });
        },
        (cb) => {
            notificationModel.updateMany(query.field, query.update, err => {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> updateStatusNotification 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, 'Cập nhật thành công status ' + query.update.status);
            });
        }
    ], function (err, result) {
        if (err) 
            return res.status(400).send(err);
        


        res.send(result);
    })
}

exports.renderProfileReport = (req, res) => {
    res.render('user/profile-report', {
        title: 'Báo cáo của bạn',
        user: req.user
    })
}

exports.checkQueryGetUserReport = [
    query('continue_timestamp', 'Continue timestamp không hợp lệ').optional().isISO8601(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (! errors.isEmpty()) 
            return res.status(400).send(errors.array()[0].msg);
        


        next();
    }
]

exports.getUserReport = (req, res) => {
    waterfall([
        (cb) => { // Get report
            let query = {
                owner: mongoose.Types.ObjectId(req.user._id)
            };

            // Check if have continue time stamps
            const {'continue_timestamp': continueTime} = req.query;
            if (continueTime) 
                query['createdAt'] = {
                    $lt: new Date(continueTime)
                };


            


            reportModel.aggregate([
                {
                    $match: query
                },
                { // Get account
                    $lookup: {
                        from: 'accounts',
                        localField: 'account',
                        foreignField: '_id',
                        as: 'account'
                    }
                },
                {   // Get response
                    $lookup: {
                        from: 'report_responses',
                        localField: '_id',
                        foreignField: 'report',
                        as: 'responses'
                    }
                },
                { // Get conversation
                    $lookup: {
                        from: 'conversations',
                        let: {
                            conversationId: '$conversation'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$conversationId']
                                    }
                                }
                            }, {
                                $addFields: { // Get id of target user
                                    targetUser: {
                                        $arrayElemAt: [
                                            {
                                                $filter: { // $Filter return array, get first element of that array
                                                    input: "$peoples",
                                                    as: "userId",
                                                    cond: {
                                                        $ne: [
                                                            "$$userId", mongoose.Types.ObjectId(req.user._id)
                                                        ]
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            }, {
                                $lookup: { // Get information about target user
                                    from: 'users',
                                    let: {
                                        userId: '$targetUser'
                                    },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$_id', '$$userId']
                                                }
                                            }
                                        }, { // Get specific field of target user only
                                            $project: {
                                                _id: 1,
                                                name: 1,
                                                role: 1,
                                                status: 1
                                            }
                                        }
                                    ],
                                    as: 'user'
                                }
                            }, { // Project conversation
                                $project: {
                                    _id: 1,
                                    'target_user': {
                                        $cond: [
                                            {
                                                $anyElementTrue: ['$user']
                                            }, {
                                                $arrayElemAt: ['$user', 0]
                                            },
                                            null
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'conversation'
                    }
                },
                { // Get user
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'user'
                    }
                }, { // Get first element of each array
                    $addFields: {
                        account: {
                            $cond: [
                                {
                                    $anyElementTrue: ['$account']
                                }, {
                                    $arrayElemAt: ['$account', 0]
                                },
                                null
                            ]
                        },
                        user: {
                            $cond: [
                                {
                                    $anyElementTrue: ['$user']
                                }, {
                                    $arrayElemAt: ['$user', 0]
                                },
                                null
                            ]
                        },
                        conversation: {
                            $cond: [
                                {
                                    $anyElementTrue: ['$conversation']
                                }, {
                                    $arrayElemAt: ['$conversation', 0]
                                },
                                null
                            ]
                        }
                    }
                }, { // Project reason
                    $project: {
                        _id: 1,
                        account: {
                            _id: 1,
                            title: 1,
                            c_name: 1,
                            status: 1
                        },
                        user: {
                            _id: 1,
                            name: 1,
                            status: 1,
                            role: 1
                        },
                        responses: {
                            _id: 1,
                            text: 1,
                            createdAt: 1
                        },
                        conversation: 1,
                        createdAt: 1,
                        reason: 1,
                        status: 1,
                        type: 1
                    }
                }, {
                    $sort: {
                        createdAt: -1
                    }
                }, {
                    $limit: 5
                }
            ], function (err, reports) {
                if (err) {
                    console.log('Error in ctl/user/profile.js -> getUserReport 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, reports);
            })
        },
        (reports, cb) => { // Get total left of report
            if(reports.length === 0) return cb(null, {
                reports: [],
                totalLeft: 0,
                continueTimestamp: null
            });

            const continueTimestamp = reports.slice(-1)[0].createdAt;
            reportModel.countDocuments(
                {
                    owner: req.user._id,
                    createdAt: {$lt: continueTimestamp}
                }, 
                (err, count) => {
                    if(err){
                        console.log('Error in ctl/user/profile.js -> getUserReport 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    return cb(null, {
                        reports,
                        totalLeft: count,
                        continueTimestamp
                    })
                })
        }
    ], function(err, result){
        if(err) return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        res.send(result)
    })

}
