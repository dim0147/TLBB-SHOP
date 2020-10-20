const mongoose = require('mongoose');
const dateFormat = require('dateformat');
const waterfall = require('async-waterfall');
const {param, validationResult} = require('express-validator');

const ticketModel = require('../../../models/ticket');
const ticketPostModel = require('../../../models/ticket_post');

exports.renderPage = (req, res) => {
    res.render('admin/ticket/show', {title: 'Hiển thị ticket', csrfToken: req.csrfToken()})
}

exports.getTickets = (req, res) => {
    const textSearch = req.query.search['value'];
    const columnToOrder = Number(req.query.order[0].column);
    const orderType = req.query.order[0].dir === 'asc' ? 1 : -1;
    const skip = Number(req.query.start);
    const limit = Number(req.query.length);
    const draw = Number(req.query.draw);

    let orderQuery = {};
    if(columnToOrder === 1) // Title
        orderQuery.title = orderType;
    else if(columnToOrder === 2) // Type
        orderQuery.type = orderType;
    else if(columnToOrder === 3) // title ACCOUNT
        orderQuery = {"account.title": orderType};
    else if (columnToOrder === 4) // Email
        orderQuery.email = orderType;
    else if(columnToOrder === 5) // User name
        orderQuery = {"user.name": orderType};
    else if(columnToOrder === 6) // Status
        orderQuery.status = orderType;
    else if(columnToOrder === 7) // CreatedAt
        orderQuery.createdAt = orderType;
    else if(columnToOrder === 8) // updatedAt
        orderQuery.updatedAt = orderType;
    else{
        orderQuery.createdAt = 1;
    }

    let textSearchCondition = [];
    if(textSearch){
        textSearchCondition.push({title: {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({type: {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({'account.title': {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({'user.name': {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({email: {$regex: textSearch, $options: 'i'}})
        textSearchCondition.push({status: {$regex: textSearch, $options: 'i'}})

        if(mongoose.Types.ObjectId.isValid(textSearch)){
            textSearchCondition.push({'account._id': mongoose.Types.ObjectId(textSearch)})
            textSearchCondition.push({'user._id': mongoose.Types.ObjectId(textSearch)})
            textSearchCondition.push({_id: mongoose.Types.ObjectId(textSearch)})
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
                localField: 'owner',
                foreignField: '_id',
                as: 'user'
            }
        },
    ];

    const addFields = [
        {
            $addFields: {
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
                            {case: {$eq: ['$status', 'response']}, then: 'Đã trả lời'},
                            {case: {$eq: ['$status', 'done']}, then: 'Đã xử lí'}
                        ],
                        default: 'Không hợp lệ'
                    }
                },
                type: {
                    $switch: {
                        branches: [
                            {case: {$eq: ['$type', 'unlock_account']}, then: 'Mở khoá bài đăng'},
                            {case: {$eq: ['$type', 'unlock_user']}, then: 'Mở khoá tài khoản'}
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
                title: 1,
                email: 1,

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
                status: 1,
                type: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ];

    const facet = [
        {
            $facet: {
                tickets: [
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
                totalTickets: [
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
            ticketModel.aggregate(pipeline, function(err, result){
                if(err){
                    console.log('Error in ctl/admin/ticket/show.js -> getticket 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result);
            })
        },
        (result, cb) => { // Get total tickets
            ticketModel.estimatedDocumentCount((err, totalTickets) => {
                if(err){
                    console.log('Error in ctl/admin/ticket/show.js -> getticket 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result, totalTickets);
            })
        },
        (result, totalTickets, cb) => {
            // Check if not have
            if(result.length === 0 || result[0].tickets.length === 0 || result[0].totalTickets.length === 0){
                return cb(null, {
                    draw: draw,
                    recordsTotal: totalTickets,
                    recordsFiltered: 0,
                    data: []
                })
            }

            // Analyze result
            const totalFiltered = result[0].totalTickets[0].total;
            const data = result[0].tickets.map(ticket => {
                return [
                    ticket['_id'],
                    ticket['title'],
                    ticket['type'],
                    ticket['account'],
                    ticket['email'],
                    ticket['user'],
                    ticket['status'],
                    ticket['createdAt'],
                    ticket['updatedAt'],
                ];
            });
            cb(null, {
                draw: draw,
                recordsTotal: totalTickets,
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