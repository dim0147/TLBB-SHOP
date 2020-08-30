const mongoose = require('mongoose');
const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');

const helper = require('../../help/helper');
const cache = require('../../cache/cache');

const accountModel = require('../../models/account');

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

function filterSpecialSort(req){
        const originQuery = req.query;

        // Initialize default 
        let condition = {};
        let option =
        {
            sort: {createdAt: 1}
        };
        let listBosung = [];

        //  Filer special sort
        for(let field in req.query){

            // Elevate price
            if(field === 'transaction_type' && req.query[field] == 'sell'){
                if(!helper.checkProperty(req.query, ['min', 'max'])) return {OK: false, message: "Thiếu trường min max"}
                condition.price = {
                        $gte: Number(originQuery.min),
                        $lte: Number(originQuery.max)
                }
            }

            // Elevate phaigiaoluu
            if(field === 'transaction_type' && req.query[field] == 'trade'){
                if(!helper.checkProperty(req.query, ['phaigiaoluu'])) return {OK: false, message: "Thiếu trường phái giao lưu"}
                if(originQuery.phaigiaoluu != 'all'){
                    if(!mongoose.Types.ObjectId.isValid(originQuery.phaigiaoluu)) return {OK: false, message: "Lỗi object Id"}
                    condition.phaigiaoluu = mongoose.Types.ObjectId(originQuery.phaigiaoluu);
                }
            }     
            
            // Elevate transaction type
            if(field === 'transaction_type' && req.query[field] != 'all'){
                    condition.transaction_type = req.query[field];
            }

            // Elevate phai
            if(field === 'phai' && req.query[field] != 'all'){
                if(!mongoose.Types.ObjectId.isValid(originQuery.phai)) return {OK: false, message: "Lỗi object Id"}
                condition.phai = mongoose.Types.ObjectId(originQuery.phai);
            }

            // Elevate bosung
            if(field === 'bosung'){
                if(typeof req.query[field] === 'string'){
                    if(!mongoose.Types.ObjectId.isValid(req.query[field])) return {OK: false, message: "Lỗi object id"}
                    listBosung.push(mongoose.Types.ObjectId(req.query[field]));
                }
                else{
                    let arr = req.query[field];
                    for(let i = 0; i < arr.length; i++){
                        let id = arr[i];
                        if(!mongoose.Types.ObjectId.isValid(id)) return {OK: false, message: "Lỗi object id"};
                        listBosung.push(mongoose.Types.ObjectId(id));
                    }
                
                }
            }

            // Elevate sort
            if(field === 'createdAt'){
                option.sort = {createdAt: Number(req.query.createdAt)}
            }
        }

        // Successfully
        return {
            OK: true,
            data: {
                condition: condition,
                option: option,
                listBosung: listBosung
            }
        }
}

function rmvSpecialField(req){
    delete req.query.min;
    delete req.query.max;
    delete req.query.phaigiaoluu;
    delete req.query.createdAt;
    delete req.query.bosung;
    delete req.query.phai;
    delete req.query.transaction_type;
    return req;
}

function filterMongooseObjectId(req, condition){

    // Filter normal field with mongoose.Types.ObjectId
    for(let field in req.query){
        if(typeof req.query[field] === 'string'){
            if(!mongoose.Types.ObjectId.isValid(req.query[field])) return {OK: false, message: "Lỗi object id"};
            condition[field] = mongoose.Types.ObjectId(req.query[field]);
        }   
        else{   //  Convert to object id 
            let listId = [];
            let arr = req.query[field];
            arr.forEach(function(val){
                if(!mongoose.Types.ObjectId.isValid(val)) return {OK: false, message: "Lỗi object id"};
                listId.push(mongoose.Types.ObjectId(val))
            })
            condition[field] = {$in: listId}
        }
    }
    return {
        OK: true,
        data: {
            condition: condition
        }
    }
}

function formatDate(accounts){

    accounts.forEach(function(account){
        account.createdAt = dateFormat(new Date(account.createdAt), "d mmmm, yyyy")
        account.user.createdAt = dateFormat(new Date(account.user.createdAt), "d mmmm, yyyy")
    });

    return accounts;
}

exports.renderPage = async function(req, res, next){
        const removedField = ['min', 'max', 'phaigiaoluu', 'bosung', 'phaigiaoluu', 'transaction_type', 'createdAt', 'phai'];
        const originQuery = req.query;

        // Check if empty query
        if(helper.isEmpty(req.query))
            return res.status(400).send("Thiếu trường");

        // Filter special sort
        let filter = filterSpecialSort(req);
        if(!filter.OK) throw new Error(filter.message)
        let condition = filter.data.condition;
        let option = filter.data.option;
        let listBosung = filter.data.listBosung;

        // Remove field from special sort
        req = rmvSpecialField(req)

        //  Filter normal field with mongoose.Types.ObjectId
        let filterMgsObj = filterMongooseObjectId(req, condition);
        if(!filterMgsObj.OK) throw new Error(filterMgsObj.message)
        condition = filterMgsObj.data.condition;

        // Query part
        let queryPart = [
            {
                $match: condition,   
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'rates',
                    localField: '_id',
                    foreignField: 'account',
                    as: 'rate'
                    
                }
            },
            {
                $lookup: {
                    from: 'images',
                    localField: '_id',
                    foreignField: 'account',
                    as: 'image'
                    
                }
            }
        ];

        //  Apply checking bosung field
        let bosungPart = [];
        if(listBosung.length > 0){
            bosungPart = [
                {
                    $lookup: {
                        from: 'account-link-addfields',
                        localField: '_id',
                        foreignField: 'accountId',
                        as: 'bosung'
                    }
                },
                {
                    $unwind: {
                        path: '$bosung',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $match: {
                        "bosung.fieldId": {$in: listBosung}
                    },   
                }
            ];
        }

        let unwindPart = [
            {
                $unwind: {
                    path: '$rate',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        let groupPart = [
            
            {
                $group:{
                    _id: "$_id",
                    status: {$first: '$status'},
                    title: {$first: '$title'},
                    c_name: {$first: '$c_name'},
                    phai: {$first: '$phai'},
                    level: {$first: '$level'},
                    server: {$first: '$server'},
                    vohon: {$first: '$vohon'},
                    amkhi: {$first: '$amkhi'},
                    thankhi: {$first: '$thankhi'},
                    tuluyen: {$first: '$tuluyen'},
                    ngoc: {$first: '$ngoc'},
                    doche: {$first: '$doche'},
                    dieuvan: {$first: '$dieuvan'},
                    longvan: {$first: '$longvan'},
                    transaction_type: {$first: '$transaction_type'},
                    price: {$first: '$price'},
                    phaigiaoluu: {$first: '$phaigiaoluu'},
                    image: {$first: '$image'},
                    createdAt: {$first: '$createdAt'},    
                    bosung: {$push: '$bosung'},    
                    totalRate: { $avg: "$rate.rate" },
                    user: {
                        $first: 
                        {
                            _id: {$first: '$user._id'}, 
                            role: {$first:'$user.role'}, 
                            name: {$first:'$user.name'}, 
                            urlImage: {$first:'$user.urlImage'}, 
                            createdAt: {$first:'$user.created_at'}
                        }
                    },
                }
            }
        ];

        let endPart = [
            {
            $facet: {
                data: [
                    {
                        $sort: option.sort
                    },
                    {
                        $limit: 9
                    }
                ],
                totalCount: [
                  {
                    $count: 'count'
                  }
                ]
              }
            }
        ];

        //  Merge all part to a pipeline
        const pipelineAg = queryPart.concat(bosungPart, unwindPart, groupPart, endPart);

        console.log(option.sort);
        waterfall([
            cb => {
                accountModel.aggregate(pipelineAg, function(err, accounts){
                  if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                  console.log('account');
                  console.log(accounts);
                  console.log('result');
                  console.log(accounts[0].data);
                  console.log('total count');
                  console.log(accounts[0].totalCount);
                //   cb(null, accounts[0].data);
                  cb(null, accounts);
                });
            },
            (accounts, cb) => {
                if(accounts[0].data.length === 0) return cb(null, accounts[0].data);
                const popAcFields = [
                    {
                        path: 'phai',
                        model: 'phais',
                        select: '_id name'
                    },
                    {
                        path: 'server',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'vohon',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'amkhi',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'thankhi',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'tuluyen',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'ngoc',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'doche',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'dieuvan',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'longvan',
                        model: 'item-properties',
                        select: '_id name'
                    },
                    {
                        path: 'phaigiaoluu',
                        model: 'phais',
                        select: '_id name'
                    }
                ];
                accountModel.populate(accounts[0].data, popAcFields, (err, acs) => {
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    // Format date 
                    acs = formatDate(acs);
                    cb(null, {account: acs, count: accounts[0].totalCount})
                });
            }
        ], async function(err, result){
            if (err) return res.status(400).send(err);
            console.log('rs');
            console.log(result);
            const bosungFields = await helper.getBosungFields();
            res.render('account/search', {title: 'Search', bosungFields: bosungFields, accounts: result.account, totalCount: result.count});

        });
        
        // accountModel.find({vohon: 213}, null, {sort: -1, limit: 3, populate}, function(err, result))
}