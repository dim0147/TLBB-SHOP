const waterfall = require('async-waterfall');
const { query, body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const helper = require('../../help/helper');

const conversationModel = require('../../models/conversation');
const messageModel = require('../../models/message');
const imageModel = require('../../models/image');
const conversationTrackerModel = require('../../models/conversation-tracker');
const reportModel = require('../../models/report');


exports.renderChatPage = (req, res) => {
    res.render('user/chat', {title: 'Tin nhắn', csrfToken: req.csrfToken()})
} 

exports.getConversations = (req, res) => {
    waterfall([
        cb => { // Get conversation

            // Setup query for conversation
            const setUpQuery = {
                    peoples: mongoose.Types.ObjectId(req.user._id)
            };

            // If have continue timestamp
            if(req.query.continueTimeStamp)
                setUpQuery.updatedAt = {$lt: new Date(req.query.continueTimeStamp)}

            // If have specific conversation
            if(req.query.conversation_id)
                setUpQuery._id = mongoose.Types.ObjectId(req.query.conversation_id);

            // If have specific account
            if(req.query.account_id)
                setUpQuery.account = mongoose.Types.ObjectId(req.query.account_id);

            const query = [
                {
                    $match: setUpQuery
                }
            ];
            const lookup = [
                {
                    $lookup: { // Get latest message
                        from: 'messages',
                        let: {idConversation: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {$eq: ['$conversation', '$$idConversation']}
                                }
                            },
                            {
                                $lookup: { // Get offer denied or cancelled 
                                    from: 'messages',
                                    localField: 'offer',
                                    foreignField: '_id',
                                    as: 'offer'
                                }
                            },
                            {
                                $addFields: {
                                    offer: {$cond: [
                                        { $anyElementTrue: ['$offer'] },
                                        { $arrayElemAt: ['$offer', 0] },
                                        null
                                    ]}
                                }
                            },
                            {
                                $sort: { createdAt: -1 }
                            },
                            {
                                $limit: 1
                            }
                        ],
                        as: 'message'   
                    },
                },
                {
                    $lookup: { // Get offer
                        from: 'messages',
                        localField: 'offer',
                        foreignField: '_id',
                        as: 'offer'
                    },
                },
                {
                    $lookup: { // Get User
                        from: 'users',
                        localField: 'peoples',
                        foreignField: '_id',
                        as: 'peoples'
                    },
                },
                {
                    $lookup: { // Get account
                        from: 'accounts',
                        let: {idAccount: '$account'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {$eq: ['$_id', '$$idAccount']}
                                }
                            },
                            {
                                $lookup: { // Get first image
                                    from: 'images',
                                    localField: '_id',
                                    foreignField: 'account',
                                    as: 'image'
                                }
                            },
                            {
                                $lookup: { // Get phaigiaoluu if have
                                    from: 'phais',
                                    localField: 'phaigiaoluu',
                                    foreignField: '_id',
                                    as: 'phaigiaoluu'
                                }
                            },
                            {
                                $addFields:{
                                    image: { $cond: [
                                        { $anyElementTrue: ['$image'] },
                                        { $arrayElemAt: ['$image.url', 0] },
                                        'no-image.png'
                                    ]},
                                    phaigiaoluu: { $cond: [
                                        { $anyElementTrue: ['$phaigiaoluu'] },
                                        { $arrayElemAt: ['$phaigiaoluu.name', 0] },
                                        null
                                    ]}
                                } 
                            }
                        ],
                        as: 'account'
                    }
                },
                {
                    $lookup: { // Get tracker
                        from: 'conversation-tracks',
                        let: {idConversation: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {$eq: ['$conversation', '$$idConversation']},
                                    user: mongoose.Types.ObjectId(req.user._id)
                                }
                            }
                        ],
                        as: 'tracker'
                    }
                }
            ];

            const addFields = [
                {
                    $addFields: {
                        message: { $cond: [
                            { $anyElementTrue: ['$message'] },
                            { $arrayElemAt: ['$message', 0] },
                            null
                        ]},
                        offer: { $cond: [
                            { $anyElementTrue: ['$offer'] },
                            { $arrayElemAt: ['$offer', 0] },
                            null
                        ]},
                        account: { $cond: [
                            { $anyElementTrue: ['$account'] },
                            { $arrayElemAt: ['$account', 0] },
                            null
                        ]},
                        target: { $filter: {
                            input: '$peoples',
                            as: 'user', 
                            cond: { $ne: ['$$user._id', mongoose.Types.ObjectId(req.user._id) ] }
                        }},
                        tracker: { $cond: [
                            { $anyElementTrue: ['$tracker'] },
                            { $arrayElemAt: ['$tracker', 0] },
                            null
                        ]},
                    }
                },
                {
                    $addFields: {
                        target: { $cond: [
                            { $anyElementTrue: ['$target'] },
                            { $arrayElemAt: ['$target', 0] },
                            null
                        ]},
                    }
                }
            ]

            const project = [
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        updatedAt: 1,
                        account: {
                            _id: 1,
                            title: 1,
                            image: 1,
                            transaction_type: 1,
                            status: 1,
                            price: 1,
                            phaigiaoluu: 1
                        },
                        message: {
                            user: 1,
                            message: 1,
                            price_offer: 1,
                            offer: 1,
                            type: 1,
                        },
                        offer: {
                            createdAt: 1,
                            price_offer: 1,
                            type: 1,
                        },
                        target: {
                            name: 1,
                            role: 1,
                            status: 1,
                            urlImage: 1,
                            _id: 1
                        },
                        tracker: {
                            _id: 1,
                            message: 1,
                            user: 1,
                        }
                    }
                },
            ];

            const option = [
                {
                    $sort: { updatedAt: -1 }
                },
                {
                    $limit: 5
                }
            ];

            const pipeline = [...query, ...lookup, ...addFields,...project, ...option];
            conversationModel.aggregate(pipeline, function(err, conversations){
                if(err){
                    console.log('Error in CTL/user/chat.js -> getConversations 01  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, conversations);
            })
        },
        (conversations, cb) => { // Get tracker and analyze
            if(conversations.length === 0) return cb(null, conversations);
            const listPromises = conversations.map((conversation) => {
                return new Promise((resolve, reject) => {

                    let query = {};
                    // If don't have tracker mean just start conversation
                    if(!conversation.tracker){
                        query.user = {$ne: req.user._id};
                        query.conversation = conversation._id;
                    }
                    // If have tracker
                    else{
                        query.user = {$ne: conversation.tracker.user},
                        query.conversation = conversation._id,
                        query._id = {$gt: conversation.tracker.message}
                    }
                    messageModel.countDocuments(query, (err, count) => {
                        if(err){
                            console.log('Error in ctl/user/chat.js -> getConversations Tracker 01 ' + err);
                            return reject('Có lỗi xảy ra vui lòng thử lại sau')
                        }
                        conversation.totalUnreadMessage = count;
                        resolve(conversation);
                    })
                })
            });
            Promise.all(listPromises)
            .then(conversations => {
                cb(null, conversations)
            })
            .catch(err => {
                cb('Có lỗi xảy ra vui lòng thử lại sau');
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })

}

exports.checkQueryGetMessages = [
    query('id_conversation', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getMessages = (req, res) => {

    waterfall([
        cb => { // Check if is in conversation 
            conversationModel
            .findOne({_id: req.query.id_conversation, peoples: req.user._id})
            .select('peoples')
            .populate({
                path: 'peoples',
                select: 'status'
            })
            .lean()
            .exec((err, conversation) => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> getMessages ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
               if(!conversation) return cb("Cuộc trò chuyện không hợp lệ");

               // Get target conversation (exclude owner)
                conversation.peoples = conversation.peoples.filter(user => {
                    return user._id.toString() !== req.user._id.toString();
                });
                // Check if don't have user or user is not valid 
                if(conversation.peoples.length === 0) return cb('Cuộc trò chuyện không hợp lệ')
                if(conversation.peoples[0].status !== 'normal') return cb('Người dùng không còn hợp lệ')
               cb(null);
            })
        },
        cb => { // Query messages
            const query = {};
            query.conversation = mongoose.Types.ObjectId(req.query.id_conversation);
            if(req.query.continueTimeStamp)
                query.createdAt = {$lt: new Date(req.query.continueTimeStamp)}
            
            messageModel
            .find(query)
            .select('user message price_offer offer type createdAt')
            .populate({
                path: 'offer',
                select: 'price_offer'
            })
            .sort({createdAt: -1})
            .limit(10)
            .lean()
            .exec((err, messages) => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> getMessages 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, messages)
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    });
}

exports.checkQueryGetSpecificConversation = [
    query('conversation_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getSpecificConversation = (req, res) => {
    waterfall([
        cb => { // Get conversation and check if is in that conversation
            conversationModel
            .findOne({_id: req.query.conversation_id, peoples: req.user._id}) 
            .select('status') 
            .populate([
                {
                    path: 'account',
                    select: 'title price phaigiaoluu transaction_type userId status',
                    populate: {
                        path: 'phaigiaoluu',
                        select: 'name'
                    }
                },
                {
                    path: 'offer',
                    select: 'price_offer'
                },
                {
                    path: 'peoples',
                    select: 'name urlImage status'
                }
            ])
            .lean()
            .exec((err, conversation) => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> getSpecificConversation 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!conversation) return cb('Cuộc trò chuyện không tìm thấy');
                // Check if nobody in conversation
                if(!conversation.peoples) return cb('Có lỗi xảy ra vui lòng thử lại sau');
                // Check if account is exist then check if is owner of this account
                if(conversation.account){
                    if(conversation.account.userId.toString() === req.user._id.toString())
                        conversation.account.isOwner = true;
                    else
                        conversation.account.isOwner = false;
                }
                // Get target conversation (exclude owner)
                conversation.peoples = conversation.peoples.filter(user => {
                    return user._id.toString() !== req.user._id.toString();
                });

                // Check if don't have user or user is not valid 
                if(conversation.peoples.length === 0) return cb('Cuộc trò chuyện không hợp lệ')
                if(conversation.peoples[0].status !== 'normal') return cb('Người dùng không còn hợp lệ')

                cb(null, conversation)
            })  
        },
        (conversation, cb) => { // Get image of account in conversation if have
            if(!conversation.account) return cb(null, conversation)
            imageModel
            .findOne({account: conversation.account._id})
            .lean()
            .exec((err, image) => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> getSpecificConversation 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!image)
                   conversation.account.image = null;
                else
                    conversation.account.image = image.url;
                cb(null, conversation);
            });
        },
        (conversation, cb) => { // Get message from conversation
            messageModel
            .find({conversation: conversation._id})
            .select('user message price_offer offer type createdAt')
            .populate({
                path: 'offer',
                select: 'price_offer'
            })
            .sort({createdAt: -1})
            .limit(10)
            .lean()
            .exec((err, messages) => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> getMessages 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                conversation.messages = messages;
                cb(null, conversation)
            })
        },
        (conversation, cb) => { // Get tracker of target user in conversation
            conversationTrackerModel
            .findOne({user: conversation.peoples[0]._id, conversation: conversation._id})
            .select('message conversation updatedAt')
            .lean()
            .exec((err, tracker) => {
                if(err){
                    console.log('Error in CTL/user/chat.js -> getMessages 02  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                conversation.peoples[0].tracker = tracker;
                cb(null, conversation);
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}

exports.markAllRead = (req, res) => {
    waterfall([
        cb => { // Get all conversations and id of last message for each conversation
            conversationModel.aggregate([
                {
                    $match: {peoples: mongoose.Types.ObjectId(req.user._id)}
                },
                {
                    $lookup: {
                        from: 'messages',
                        let: {idConversation: '$_id'},
                        pipeline: [
                            {
                                $match: {$expr: {$eq: ['$conversation', '$$idConversation']} }
                            },
                            { $sort: {createdAt: -1} },
                            { $limit: 1 }
                        ],
                        as: 'messages'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        message: {$cond: [
                            { $anyElementTrue: ['$messages'] },
                            { $arrayElemAt: ['$messages._id',0] },
                            null
                        ]}
                    }
                }
            ], function(err, conversations){
                if(err){
                    console.log('Error in ctl/user/chat.js -> markAsAllRead ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(conversations.length === 0) return cb('Không có cuộc trò chuyện nào')
                cb(null, conversations)
            })
        },
        (conversations, cb) => {
            const listPromises = conversations.map(conversation => { // Loop each conversation

                return new Promise((resolve, reject) => {
                    waterfall([
                        (cb) => { // Get tracker
                            conversationTrackerModel
                            .findOne({user: req.user._id, conversation: conversation._id})
                            .select('message')
                            .lean()
                            .exec((err, tracker) => {
                                if(err){
                                    console.log('Error in ctl/user/chat.js -> markAllRead 02  ' + err);
                                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                                }
                                cb(null, tracker);
                            })
                        },
                        (tracker, cb) => { // Check if tracker is exist, update it if message in tracker not newest
                            if(!tracker) return cb(null, conversation, tracker);
                            // Check if message in tracker is newest than no need update
                            if(tracker.message.toString() === conversation.message.toString()) return cb(null, conversation, tracker);
                            // Update tracker message to newest
                            conversationTrackerModel.findByIdAndUpdate(tracker._id, {message: conversation.message}, err => {
                                if(err){
                                    console.log('Error in ctl/user/chat.js -> markAllRead 03 ' + err);
                                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                                }
                                cb(null, conversation, tracker);
                            })
                        },
                        (conversation, tracker, cb) => { // Go to create if not have tracker
                            if(tracker) return cb(null, tracker) // Mean update already
                            // Go to create if not have tracker
                            new conversationTrackerModel({
                                user: req.user._id,
                                conversation: conversation._id,
                                message: conversation.message
                            }).save((err, newTracker) => {
                                if(err){
                                    console.log('Error in ctl/user/chat.js -> markAllRead 04 ' + err);
                                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                                }
                                cb(null, newTracker);
                            })
                        }
                    ], function(err, result){
                        if(err) return reject(err);
                        resolve(result);
                    })
                })

            });
            Promise.all(listPromises)
            .then(result => cb(null, result))
            .catch(err => cb(err));
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send('Đánh dấu thành công')
    })
}

exports.checkBodyCreateReportConversation = [
    body('reason', 'Lí do phải hơn 5 kí tự và không quá 50 kí tự').isString().isLength({min: 5, max: 50}),
    body('conversation_id', 'Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createReportConversation = (req, res) => {
    waterfall([
        (cb) => {
            reportModel
            .findOne({ // Check if exist already
                conversation: req.body.conversation_id,
                reason: req.body.reason, 
                owner: req.user._id, 
                type: 'conversation'
            })
            .select('_id')
            .lean()
            .exec((err, report) => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> createReportConversation 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(report) return cb(`Bạn đã báo cáo với lí do "${req.body.reason}" rồi`);
                cb(null);
            })
        },
        (cb) => { // Create new report
            new reportModel({
                conversation: req.body.conversation_id,
                reason: req.body.reason,
                owner: req.user._id,
                type: 'conversation'
            }).save(err => {
                if(err){
                    console.log('Error in ctl/user/chat.js -> createReportConversation 02 ' + err);
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