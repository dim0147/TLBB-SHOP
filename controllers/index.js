const waterfall = require('async-waterfall');
const dateFormat = require('dateformat');
const mongoose = require('mongoose');

const phaiModel = require('../models/phai');
const accountModel = require('../models/account');
const itemModel = require('../models/item');
const searchResultModel = require('../models/search-result');

const cache = require('../cache/cache');
const item = require('../models/item');

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

exports.indexPage = (req, res) =>{
    waterfall([
        (cb) => { // Get phai
            // Get from cache
            let phais = cache.getKey('phais');
            if( typeof phais !== 'undefined') return cb(null, phais)

            // Set to Cache
            phaiModel.find({}).exec((err, phais) => {
                if(err) return cb("Có lỗi xảy ra vui lòng thử lại sau");
                cache.setKey('phais', phais);
                return cb(null, phais);
            });
        },
        (phais, cb) => {    // Get Server
            // Get from cache
            let servers = cache.getKey('servers');
            if(typeof servers !== 'undefined') return cb(null,{phais: phais, servers: servers});

             // Set to Cache
            item.aggregate([
                {
                    $match: {
                        slug: 'server'
                    }
                },
                {
                    $lookup: {
                        from: 'item-properties',
                        localField: '_id',
                        foreignField: 'itemId',
                        as: 'properties'
                    }
                }
            ], function(err, servers){
                if(err) return cb(err);
                cache.setKey('servers', servers)
                cb(null, {phais: phais, servers: servers});
            });
        },
        (result, cb) => {   // Get account most view from cache
            let mostViewAccount = cache.getKey('mostViewAccount');
            if(typeof mostViewAccount !== 'undefined'){
                result.mostViewAccount = mostViewAccount;
                return cb(null, result);
            }

            // If don't have go query
            accountModel.aggregate([
                {
                    $lookup:{
                        from: 'views',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'view'

                    }
                },
                {
                    $lookup:{
                        from: 'rates',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'rate'
                    }
                },
                {
                    $unwind:{
                        path: '$rate',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group:{
                        _id: "$_id",
                        title: {$first: '$title'},
                        c_name: {$first: '$c_name'},
                        server: {$first: '$server'},
                        phai: {$first: '$phai'},
                        ngoc: {$first: '$ngoc'},
                        dieuvan: {$first: '$dieuvan'},
                        vohon: {$first: '$vohon'},
                        view: {$first: '$view'},
                        rate: {$avg: '$rate.rate'},
                        transaction_type: {$first: '$transaction_type'},
                        price: {$first: '$price'},
                        phaigiaoluu: {$first: '$phaigiaoluu'},
                        createdAt: {$first: '$createdAt'},
                    }
                },
                {
                    $lookup:{
                        from: 'images',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'image'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        c_name: 1,
                        server: 1,
                        phai: 1,
                        ngoc: 1,
                        dieuvan: 1,
                        vohon: 1,
                        transaction_type: 1,
                        price: 1,
                        phaigiaoluu: 1,
                        rate: 1,
                        totalView: { $size: "$view" },
                        image: {
                            $cond: [
                                {$anyElementTrue: ['$image']},
                                {$arrayElemAt: ['$image', 0]},
                                'no-image.png'
                            ]
                        },
                        createdAt: 1,
                    }
                },
                {
                    $match: {
                        totalView: {$gt: 0}
                    }
                },
                {
                    $sort: {
                        totalView: -1
                    }
                },
                {
                    $limit: 6
                }
            ], function(err, accounts){ // Accounts done
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
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
                if(accounts.length === 0){ // If don't have
                    result.mostViewAccount = accounts;
                    return cb(null, result);
                } 
                accountModel.populate(accounts, popAcFields, (err, accounts) => { // Populate fields
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    accounts.forEach(account =>{
                        account.createdAt = dateFormat(new Date(account.createdAt), "d mmmm, yyyy")
                    });
                    result.mostViewAccount = accounts;
                    cache.setKey('mostViewAccount', accounts, 60);
                    return cb(null, result);
                });
            });
        },
        (result, cb) => {   // Get recent account
            let recentAccount = cache.getKey('recentAccount');
            if(typeof recentAccount !== 'undefined'){
                result.recentAccount = recentAccount;
                return cb(null, result);
            }

            // If don't have go query
            accountModel.aggregate([
                {
                    $lookup:{
                        from: 'views',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'view'

                    }
                },
                {
                    $lookup:{
                        from: 'rates',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'rate'
                    }
                },
                {
                    $unwind:{
                        path: '$rate',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group:{
                        _id: "$_id",
                        title: {$first: '$title'},
                        c_name: {$first: '$c_name'},
                        server: {$first: '$server'},
                        phai: {$first: '$phai'},
                        ngoc: {$first: '$ngoc'},
                        dieuvan: {$first: '$dieuvan'},
                        vohon: {$first: '$vohon'},
                        view: {$first: '$view'},
                        rate: {$avg: '$rate.rate'},
                        transaction_type: {$first: '$transaction_type'},
                        price: {$first: '$price'},
                        phaigiaoluu: {$first: '$phaigiaoluu'},
                        createdAt: {$first: '$createdAt'},
                    }
                },
                {
                    $lookup:{
                        from: 'images',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'image'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        c_name: 1,
                        server: 1,
                        phai: 1,
                        ngoc: 1,
                        dieuvan: 1,
                        vohon: 1,
                        transaction_type: 1,
                        price: 1,
                        phaigiaoluu: 1,
                        rate: 1,
                        totalView: { $size: "$view" },
                        image: {
                            $cond: [
                                {$anyElementTrue: ['$image']},
                                {$arrayElemAt: ['$image', 0]},
                                'no-image.png'
                            ]
                        },
                        createdAt: 1,
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $limit: 6
                }
            ], function(err, accounts){
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
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
                if(accounts.length === 0){ // If don't have
                    result.recentAccount = accounts;
                    return cb(null, result);
                } 
                accountModel.populate(accounts, popAcFields, (err, accounts) => { // Populate fields
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    accounts.forEach(account =>{
                        account.createdAt = dateFormat(new Date(account.createdAt), "d mmmm, yyyy")
                    });
                    result.recentAccount = accounts;
                    cache.setKey('recentAccount', accounts, 60);
                    return cb(null, result);
                });
            });
        },
        (result, cb) => { // Get Item properties
            // Check cache if have
            let items = cache.getKey('items');
            if(typeof items !== 'undefined'){
                result.items = items;
                return cb(null, result);
            }

            itemModel.aggregate([
                {
                    $lookup:{
                        from: 'item-properties',
                        let: {idItem: '$_id'},
                        pipeline: [
                            {
                                $match:{
                                    $expr:{
                                        $eq: ['$itemId', '$$idItem']
                                    }
                                }
                            },
                            {
                                $lookup:{
                                    from: 'accounts',
                                    let: {idProperty: '$_id'},
                                    pipeline:[
                                        {
                                            $match:{
                                                $or: [
                                                    {
                                                        $expr:{ $eq: ['$vohon', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$amkhi', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$thankhi', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$tuluyen', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$ngoc', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$doche', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$dieuvan', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$longvan', '$$idProperty']}
                                                    },
                                                    {
                                                        $expr:{ $eq: ['$server', '$$idProperty']}
                                                    }
                                                ]
                                            }
                                        }
                                    ],
                                    as: 'account'
                                }
                            },
                            {
                                $project: {
                                    itemId: 1,
                                    name: 1,
                                    totalAccount: {$size: "$account"}                                    
                                }
                            }
                        ],
                        as: 'properties'
                    }
                },
                {
                    $project:{
                        _id: 1,
                        name: 1,
                        slug: 1,
                        properties:{
                            _id: 1,
                            itemId: 1,
                            name: 1,
                            totalAccount: 1
                        }
                    }
                }
            ], (err, items) =>{
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                result.items = items;
                cache.setKey('items', items);
                return cb(null, result);
            });

        },
        (result, cb) => {   // Get account for each server

            let accountEachServer = cache.getKey('accountEachServer');
            if(typeof accountEachServer !== 'undefined'){
                result.accountEachServer = accountEachServer;
                return cb(null, result);
            }

            if(result.items.length > 0){

                // Server slug 
                const slugServer = 'server';

                // List property of server
                let listServerId = [];

                // Get list Id property of server slug
                result.items.forEach(item => {
                    if(item.slug == slugServer){
                        item.properties.forEach(property => {
                            listServerId.push({_id: mongoose.Types.ObjectId(property._id), name: property.name});
                        })
                    }     
                });

                // Get account for each server, check if list server is null
                if(listServerId.length === 0) {
                    result.accountEachServer = [];
                    return cb(null, result);
                }

                // Create list promise query 6 account for each server
                let listPromise = listServerId.map(server => {
                    return new Promise((resolve, reject) => {
                        // Query account for specific server
                        accountModel.aggregate([
                            {
                                $match: {server: server._id}
                            },
                            {
                                $lookup:{
                                    from: 'views',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'view'
            
                                }
                            },
                            {
                                $lookup:{
                                    from: 'rates',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'rate'
                                }
                            },
                            {
                                $unwind:{
                                    path: '$rate',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $group:{
                                    _id: "$_id",
                                    title: {$first: '$title'},
                                    c_name: {$first: '$c_name'},
                                    server: {$first: '$server'},
                                    phai: {$first: '$phai'},
                                    ngoc: {$first: '$ngoc'},
                                    dieuvan: {$first: '$dieuvan'},
                                    vohon: {$first: '$vohon'},
                                    view: {$first: '$view'},
                                    rate: {$avg: '$rate.rate'},
                                    transaction_type: {$first: '$transaction_type'},
                                    price: {$first: '$price'},
                                    phaigiaoluu: {$first: '$phaigiaoluu'},
                                    createdAt: {$first: '$createdAt'},
                                }
                            },
                            {
                                $lookup:{
                                    from: 'images',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'image'
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    title: 1,
                                    c_name: 1,
                                    server: 1,
                                    phai: 1,
                                    ngoc: 1,
                                    dieuvan: 1,
                                    vohon: 1,
                                    transaction_type: 1,
                                    price: 1,
                                    phaigiaoluu: 1,
                                    rate: 1,
                                    totalView: { $size: "$view" },
                                    image: {
                                        $cond: [
                                            {$anyElementTrue: ['$image']},
                                            {$arrayElemAt: ['$image', 0]},
                                            'no-image.png'
                                        ]
                                    },
                                    createdAt: 1,
                                }
                            },
                            {
                                $sort: {
                                    createdAt: -1
                                }
                            },
                            
                            { $sample: { size: 6 } }
                        ], function(err, accounts){
                            if(err) return reject(err);
                            // Check if have account, populate fields and format date
                            if(accounts.length > 0){
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
                                accountModel.populate(accounts, popAcFields, (err, accounts) => {
                                    if(err) return reject(err);
                                    accounts.forEach(account =>{
                                        account.createdAt = dateFormat(new Date(account.createdAt), "d mmmm, yyyy")
                                    });
                                    return resolve({serverId: server._id, serverName: server.name, accounts: accounts});
                                });
                            }
                            else{
                                resolve({serverId: server._id, serverName: server.name, accounts: []});
                            }
                        });
                    });
                })

                // Trigger query for account of each server
                Promise.all(listPromise)
                .then(accountEachServer => {
                    cache.setKey('accountEachServer', accountEachServer);
                    result.accountEachServer = accountEachServer;
                    cb(null, result);
                })
                .catch(err => {
                    cb(err);
                })
            }
            else{
                result.accountEachServer = [];
                cb(null, result);
            }
            
        },
        (result, cb) => { // Get most search
            // Get from cached
            let mostSearch = cache.getKey('mostSearch');
            if(typeof mostSearch !== 'undefined'){
                result.mostSearch = mostSearch;
                return cb(null, result);
            }

            // If don't have query then save to cached
            searchResultModel.aggregate([
                {
                    $lookup: {
                        from: 'items',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'item'
                    }
                },
                {
                    $lookup: {
                        from: 'item-properties',
                        localField: 'property',
                        foreignField: '_id',
                        as: 'property'
                    }
                },
                {
                    $unwind: "$item"
                },
                {
                    $unwind: "$property"
                },
                {
                    $group:{
                        _id: {idItem: "$item._id", idProperty: "$property._id"},
                        slug: {$first: "$item.slug"},
                        idProperty: {$first: "$property._id"},
                        nameItem: {$first: "$item.name"},
                        nameProperty: {$first: "$property.name"},
                        totalSearch: {$sum: 1}
                    }
                },  
                {
                    $sort: {
                        totalSearch: -1,
                        nameItem: -1,
                    }
                },
                {
                    $group:{
                        _id: "$_id.idItem",
                        slug: {$first: "$slug"},
                        idProperty: {$first: "$idProperty"},
                        nameItem: {$first: "$nameItem"},
                        nameProperty: {$first: "$nameProperty"},
                        maxSearch: {$first: '$totalSearch'}
                    }
                },
                {
                    $limit: 5
                }
            ], function(err, mostSearch){
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                if(mostSearch.length !== 0)
                    cache.setKey('mostSearch', mostSearch, 5000);             
                result.mostSearch = mostSearch;
                cb(null, result);
            });
        }
    ], function(err, result){   // Success
        if(err){
            return res.render('index', { title: 'Thiên Long Bát Bộ Shop', error: err });
        }
        res.render('index', { title: 'Thiên Long Bát Bộ Shop', 
                              phais: result.phais, 
                              servers: result.servers, 
                              mostViewAccount: result.mostViewAccount, 
                              recentAccount: result.recentAccount, 
                              items: result.items, 
                              mostSearch: result.mostSearch, 
                              accountEachServer: result.accountEachServer 
                            });
    });
}