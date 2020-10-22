const mongoose = require('mongoose');
const dateFormat = require('dateformat');

const accountModel = require('../../../models/account');

exports.renderPage = (req, res) => {
    res.render('admin/account/show-account', {title: 'Hiển thị toàn bộ tài khoản', csrfToken: req.csrfToken()})
}

exports.getAccount = (req, res) => {
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
        case 14:
            sortCondition['user.name'] = sortColum.dir == 'asc' ? 1 : -1;
            break;
        default:
            sortCondition.createdAt = -1;
    }
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
        condition.push({'user.name': {$regex: textSearch, $options: 'i'}});
    }
    if(mongoose.Types.ObjectId.isValid(textSearch)){
        condition.push({_id: mongoose.Types.ObjectId(textSearch)});
        condition.push({'user._id': mongoose.Types.ObjectId(textSearch)});
    }

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
            $lookup: {
                from: 'users',
                let: {userId: '$userId'},
                pipeline: [
                    {
                        $match: {
                            $expr: {$eq: ['$_id', '$$userId']}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            role: 1,
                            status: 1,
                            name: 1
                        }
                    }
                ],
                as: 'user'
            }
        }
    ];

    const addFieldsAggregate = [
        {
            $addFields: {
                totalRates : { $size: '$rates'},
                views: {$size: '$views'}
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
                totalRates: {$first: '$totalRates'},
                user: {$first: '$user'},
                post_id: {$first: '$post_id'}
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
                totalRates: 1,
                user: {$cond: [
                    { $anyElementTrue: ['$user'] },
                    { $arrayElemAt: ['$user', 0] },
                    null
                ]},
                post_id: 1
            }
        }
    ]

    let matchAggregate = [];
    if(condition.length !== 0) {
        matchAggregate = [
            {
                $match: {
                    $and: [
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
                const totalAccounts = await accountModel.estimatedDocumentCount().catch(err => false);
                if(totalAccounts === false)
                    return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');

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
                    account.views,
                    account.user,
                    null,
                    account.post_id
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