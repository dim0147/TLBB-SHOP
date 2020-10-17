const mongoose = require('mongoose');
const dateFormat = require('dateformat');
const waterfall = require('async-waterfall');
const {param, validationResult} = require('express-validator');

const reportModel = require('../../../models/report');
const reportResponseModel = require('../../../models/report_response');

exports.renderPage = (req, res) => {
    res.render('admin/report/show', {title: 'Hiển thị báo cáo', csrfToken: req.csrfToken()})
}

exports.getReport = (req, res) => {
    const textSearch = req.query.search['value'];
    const columnToOrder = Number(req.query.order[0].column);
    const orderType = req.query.order[0].dir === 'asc' ? 1 : -1;
    const skip = Number(req.query.start);
    const limit = Number(req.query.length);
    const draw = Number(req.query.draw);

    let orderQuery = {};
    if(columnToOrder === 1) // Loại
        orderQuery.type = orderType;
    else if(columnToOrder === 2) // Account
        orderQuery = {'account.title': orderType};
    else if (columnToOrder === 4) // User
        orderQuery = {'user.name': orderType};
    else if(columnToOrder === 5) // Reason
        orderQuery.reason = orderType;
    else if(columnToOrder === 6) // Status
        orderQuery.status = orderType;
    else if(columnToOrder === 7) // Status
        orderQuery = {'owner.name': orderType};
    else{
        orderQuery.createdAt = 1;
    }

    let textSearchCondition = [];
    if(textSearch){
        textSearchCondition.push({'account.title': {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({'conversation.peoples.name': {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({'user.name': {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({'owner.name': {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({reason: {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({type: {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({status: {$regex: textSearch, $options: 'i'}})

        if(mongoose.Types.ObjectId.isValid(textSearch)){
            textSearchCondition.push({'account._id': mongoose.Types.ObjectId(textSearch)})
            textSearchCondition.push({'user._id': mongoose.Types.ObjectId(textSearch)})
            textSearchCondition.push({'owner._id': mongoose.Types.ObjectId(textSearch)})
            textSearchCondition.push({'conversation._id': mongoose.Types.ObjectId(textSearch)})
            textSearchCondition.push({'conversation.peoples._id': mongoose.Types.ObjectId(textSearch)})
        }
    }

    const matchAggregate = [];
    if(textSearchCondition.length > 0){
        matchAggregate.push(
            {
                $match: {
                    $or: textSearchCondition
                }
            }
        )
    }

    const lookupAggregate = [
        {
            $lookup: {
                from: 'accounts',
                localField: 'account',
                foreignField: '_id',
                as: 'account'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $lookup: {
                from: 'conversations',
                let: {conversationId: '$conversation'},
                pipeline: [
                    {
                        $match: {$expr: {$eq: ['$_id', '$$conversationId']}}
                    },
                    {
                        $unwind: '$peoples'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            let: {userId: '$peoples'},
                            pipeline: [
                                {
                                    $match: {$expr: {$eq: ['$_id', '$$userId']}}
                                },
                                {
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
                    },
                    {
                        $addFields: {
                            user: {$cond: [
                                {$anyElementTrue: ['$user']},
                                {$arrayElemAt: ['$user', 0]},
                                null
                            ]}
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            peoples: {$push: '$user'}
                        }
                    }
                ],
                as: 'conversation'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        }
    ];

    const addFields = [
        {
            $addFields: {
                conversation: {$cond: [
                    { $anyElementTrue: ['$conversation'] },
                    { $arrayElemAt: ['$conversation', 0] },
                    null
                ]},
                account: {$cond: [
                    { $anyElementTrue: ['$account'] },
                    { $arrayElemAt: ['$account', 0] },
                    null
                ]},
                user: {$cond: [
                    { $anyElementTrue: ['$user'] },
                    { $arrayElemAt: ['$user', 0] },
                    null
                ]},
                owner: {$cond: [
                    { $anyElementTrue: ['$owner'] },
                    { $arrayElemAt: ['$owner', 0] },
                    null
                ]},
            }
        }
    ];

    const convertSwitchCase = [
        {
            $addFields: {
                status: {
                    $switch: {
                        branches: [
                            {case: {$eq: ['$status', 'pending']}, then: 'Đang chờ'},
                            {case: {$eq: ['$status', 'done']}, then: 'Đã xử lí'}
                        ],
                        default: 'Không hợp lệ'
                    }
                },
                type: {
                    $switch: {
                        branches: [
                            {case: {$eq: ['$type', 'user']}, then: 'Người dùng'},
                            {case: {$eq: ['$type', 'account']}, then: 'Tài khoản'},
                            {case: {$eq: ['$type', 'conversation']}, then: 'Cuộc trò chuyện'}
                        ],
                        default: 'Không hợp lệ'
                    }
                }
            }
        }
    ];

    const project = [
        {
            $project: {
                _id: 1,
                account: {
                    _id: 1,
                    title: 1
                },
                user: {
                    _id: 1,
                    name: 1,
                    role: 1,
                    status: 1
                },
                conversation: 1,
                owner: {
                    _id: 1,
                    name: 1,
                    role: 1,
                    status: 1
                },
                reason: 1,
                status: 1,
                type: 1,
                createdAt: 1,
            }
        }
    ];

    const facet = [
        {
            $facet: {
                reports: [
                    {
                        $sort: orderQuery
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ],
                totalReports: [
                    {
                        $count: 'total'
                    }
                ]
            }
        }
    ];

    waterfall([
        (cb) => {
            const pipeline = [...lookupAggregate, ...addFields, ...convertSwitchCase, ...project, ...matchAggregate, ...facet];
            reportModel.aggregate(pipeline, function(err, result){
                if(err){
                    console.log('Error in ctl/admin/report/show.js -> getReport 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result);
            })
        },
        (result, cb) => { // Get total reports
            reportModel.estimatedDocumentCount((err, totalReports) => {
                if(err){
                    console.log('Error in ctl/admin/report/show.js -> getReport 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result, totalReports);
            })
        },
        (result, totalReports, cb) => {
            // Check if not have
            if(result.length === 0 || result[0].reports.length === 0 || result[0].totalReports.length === 0){
                return cb(null, {
                    draw: draw,
                    recordsTotal: totalReports,
                    recordsFiltered: 0,
                    data: []
                })
            }

            // Analyze result
            const totalFiltered = result[0].totalReports[0].total;
            const data = result[0].reports.map(report => {
                return [
                    report['_id'],
                    report['type'],
                    report['account'],
                    report['conversation'],
                    report['user'],
                    report['reason'],
                    report['status'],
                    report['owner'],
                ];
            });
            cb(null, {
                draw: draw,
                recordsTotal: totalReports,
                recordsFiltered: totalFiltered,
                data
            });
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
} 

exports.checkParamsAddResponse = [
    param('reportId', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.renderAddResponse = (req, res) => {
    const { reportId } = req.params;
    waterfall([
        (cb) => { // Check report is exist
            reportModel
            .countDocuments({_id: reportId}, (err, count) => {
                if(err){
                    console.log('Error in ctl/admin/report/show.js -> renderAddResponse 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Report không tồn tại')
                cb(null);
            })
        },
        (cb) => {
            reportResponseModel
            .find({report: reportId})
            .select('text createdAt')
            .lean()
            .exec((err, responses) => {
                if(err){
                    console.log('Error in ctl/admin/report/show.js -> renderAddResponse 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, responses)
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.render('admin/report/add-response', {title: 'Thêm phản hồi cho báo cáo', responses: result, reportId, dateFormat, csrfToken: req.csrfToken()})
    })
}