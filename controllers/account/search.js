const mongoose = require('mongoose');
const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');

const helper = require('../../help/helper');
const cache = require('../../cache/cache');

const accountModel = require('../../models/account');
const searchResultModel = require('../../models/search-result');
const itemModel = require('../../models/item');
const item = require('../../models/item');

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

// Validate query before sort
exports.checkFields = async function(req, res, next){
    if(helper.isEmpty(req.query))
        return res.render('account/search', {title: 'Có lỗI xảy ra', error: 'Thiếu query'});

    const allowField = ['c_name', 'min', 'max', 'phai', 'sort', 'transaction_type', 'phaigiaoluu', 'bosung', 'page', 'dataOnly'];

    // Get item in menuView Cache, if not query then add to allowField
    let menuView = cache.getKey('menuView');
    if(typeof menuView === 'undefined'){
        menuView = await helper.getMenuData().catch(err => res.render('account/search', {title: 'Có lỗI xảy ra', error: 'Có lỗi xảy ra vui lòng thử lại sau'}))
        if(typeof menuView === 'undefined') return;
        cache.setKey('menuView', menuView);
    }

    // Push slug of item to allowField
    if(typeof menuView.items !== 'undefined' && menuView.items.length > 0){
        menuView.items.forEach(function(item){
            allowField.push(item.slug);
        });
    }

    // Elevate field is one of allowField if not remove that field
    for(var field in req.query){
        if(!allowField.includes(field))
            delete req.query[field];
    }
    next();
}

function filterSpecialSort(req){
        const originQuery = req.query;

        // Initialize default 
        let condition = {};
        let option =
        {
            sort: {createdAt: 1}, 
            itemPerPage: 9,
            skip: 0
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
                condition.transaction_type = {$in: ['sell', 'all']};
            }

            // Elevate phaigiaoluu
            if(field === 'transaction_type' && req.query[field] == 'trade'){
                if(!helper.checkProperty(req.query, ['phaigiaoluu'])) return {OK: false, message: "Thiếu trường phái giao lưu"}
                if(originQuery.phaigiaoluu != 'all'){
                    if(!mongoose.Types.ObjectId.isValid(originQuery.phaigiaoluu)) return {OK: false, message: "Lỗi object Id"}
                    condition.phaigiaoluu = mongoose.Types.ObjectId(originQuery.phaigiaoluu);
                }
                condition.transaction_type = {$in: ['trade', 'all']};
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

            // Elevate string
            if(field === 'c_name'){
                condition.c_name = {$regex: originQuery.c_name, $options: 'i'}
            }

            // Elevate sort
            if(field === 'sort'){
                if(req.query[field] == 'date-new')
                    option.sort = {createdAt: -1}
                else if(req.query[field] == 'date-old')
                    option.sort = {createdAt: 1}
                else if(req.query[field] == 'price-high')
                    option.sort = {price: -1}
                else if(req.query[field] == 'price-low')
                    option.sort = {price: 1}
                else if (req.query[field] == 'most-view')
                    option.sort = {totalView: -1}
            }
        }

        // Calculate page
        if(typeof req.query.page != 'undefined' && !isNaN(req.query.page)){
            option.skip = (Number(req.query.page) - 1) * option.itemPerPage;
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
    delete req.query.sort;
    delete req.query.bosung;
    delete req.query.phai;
    delete req.query.transaction_type;
    delete req.query.page;
    delete req.query.c_name;
    delete req.query.dataOnly;
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

// Save search result to db
function saveSearchRs(req){

    //  List search save to db
    let listSearchRs = [];

    // List Promise of filter slug
    let listPromises = [];

    // Filter normal field with mongoose.Types.ObjectId
    for(let field in req.query){

        // Create new Promise
        let promise = new Promise((resolve, reject) => {
            // Find item by slug
            itemModel.findOne({slug: field}, (err, item) => {
                if(err) return reject(err);
                if(item === null) return reject('Không tìm thấy item: ' + field);
                
                // Create search result to db, check if value field  is string
                if(typeof req.query[field] === 'string'){
                    if(!mongoose.Types.ObjectId.isValid(req.query[field])) return false;
                    // Adding search result
                    let searchRs = {
                        item: item._id,
                        property: mongoose.Types.ObjectId(req.query[field])
                    }
                    if(req.isAuthenticated()) // check if have user 
                        searchRs.user = req.user._id;
                    listSearchRs.push(searchRs);
                }   
                else{   //  If one field have more than one value, e.g: vo hon = ['tracviet', 'toanmy']
                    let arr = req.query[field];
                    for(let i = 0; i < arr.length; i++){
                        let val = arr[i];
                        if(!mongoose.Types.ObjectId.isValid(val)) return false;
                        let searchRs = {
                            item: item._id,
                            property: mongoose.Types.ObjectId(val),
                        }
                        if(req.isAuthenticated()) // check if have user 
                            searchRs.user = req.user._id;
                        listSearchRs.push(searchRs);
                    }
                }
                resolve();
            });
        });
        // Add to list promise
        listPromises.push(promise);

    }
    Promise.all(listPromises)
    .then(() => {   // Save list of search result to db
        if(listSearchRs.length > 0)
            searchResultModel.insertMany(listSearchRs, err => {
                if(err) return console.log('Có lổi xảy ra khi thêm search result vào db: ' + err);
            })
    })
    .catch(err => {
        console.log('Có lỗi xảy ra khi save result, vui lòng thử lại sau');
        console.log(err);
    })
}

function formatDate(accounts){

    accounts.forEach(function(account){
        account.originCreatedAt = account.createdAt;
        account.createdAt = dateFormat(new Date(account.createdAt), "d mmmm, yyyy")
        account.user.createdAt = dateFormat(new Date(account.user.createdAt), "d mmmm, yyyy")
    });

    return accounts;
}

exports.renderPage = async function(req, res){
        // Check if get data only or not
        let dataOnly = false;
        if(typeof req.query.dataOnly !== "undefined" && req.query.dataOnly == 'true')
            dataOnly = true;

        // Check if empty query
        if(helper.isEmpty(req.query))
            return res.status(400).send("Thiếu trường");

        // Filter special sort
        let filter = filterSpecialSort(req);
        if(!filter.OK){
            if(dataOnly)
                return res.status(400).send(filter.message)
            else
                return res.render('account/search', {title: 'Search', error: filter.message});
        }
        let condition = filter.data.condition;
        let option = filter.data.option;
        let listBosung = filter.data.listBosung;

        // Remove field from special sort
        req = rmvSpecialField(req)

        //  Filter normal field with mongoose.Types.ObjectId
        let filterMgsObj = filterMongooseObjectId(req, condition);
        if(!filterMgsObj.OK){
            if(dataOnly)
                return res.status(400).send(filterMgsObj.message)
            else
                return res.render('account/search', {title: 'Search', error: filterMgsObj.message});
        } 
        condition = filterMgsObj.data.condition;

        // Add search query to db
        saveSearchRs(req);

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
            },
            {
                $lookup: {
                    from: 'views',
                    let: {accountId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$account', '$$accountId'] }
                            }
                        },
                    ],
                    as: 'view'
                }
            },
            {
                $addFields: {
                    totalView: {$size: '$view'}
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

        // Unwind rate calculate total rate to using group
        let unwindPart = [
            {
                $unwind: {
                    path: '$rate',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        //  Group by id
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
                    totalView: {$first: "$totalView"},
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

        // Apply sort and limit and skip and get total documents
        let endPart = [
            {
            $facet: {
                data: [
                    {
                        $sort: option.sort
                    },
                    {
                        $skip: option.skip
                    },
                    {
                        $limit: option.itemPerPage
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
        waterfall([
            cb => {
                accountModel.aggregate(pipelineAg, function(err, accounts){
                  if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
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
            // If error
            if (err){
                if(dataOnly)
                    return res.status(400).send(filterMgsObj.message)
                else
                    return res.render('account/search', {title: 'Search', error: err});
            } 

            // Check if no result
            if(result.length === 0){
                result.account = [];
                result.count = [];
            }

            // Get bosung field, search in cache
            let bosungFields = cache.getKey('bosung');
            if(typeof bosungFields === 'undefined'){
                bosungFields = await helper.getBosungFields();
                cache.setKey('bosung', bosungFields);
            }

            if(dataOnly)
                return res.send({accounts: result.account, totalCount: result.count})
            else
                res.render('account/search', {title: 'Search', bosungFields: bosungFields, accounts: result.account, totalCount: result.count, itemPerPage: option.itemPerPage});

        });
}