const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose')

const helper = require('../../help/helper');

const accountModel = require('../../models/account');
const conversationModel = require('../../models/conversation');
const messageModel = require('../../models/message');
const conversationTrackerModel = require('../../models/conversation-tracker');

function createAccountConversation(accountId, message, currentUserId){
    return new Promise((resolve, reject) => {
        waterfall([
            (cb) => { // Get account if exist or not
                accountModel
                .findById(accountId)
                .select('_id status')
                .populate({
                    path: 'userId',
                    select: 'status'
                })
                .lean()
                .exec((err, account) => {
                    if(err){
                        console.log('Error in ctl/api-service/chat.js -> createAccountConversation 01 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(!account) return cb('Tài khoản không tìm thấy')
                    if(account.status !== 'pending' && account.status !== 'done') return cb('Tài khoản không thể liên hệ')
                    if(!account.userId) return cb('Chủ tài khoản không hợp lệ')
                    if(account.userId.status !== 'normal') return cb('Chủ tài khoản không còn hợp lệ')
                    cb(null, account);
                })
            },
            (account, cb) => { // Check if have conversation or not
                conversationModel
                .findOne({account: account._id, peoples: currentUserId})
                .select('_id')
                .lean()
                .exec((err, conversation) => {
                    if(err){
                        console.log('Error in ctl/api-service/chat.js -> createAccountConversation 02 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(conversation) return cb('Đã có cuộc trò chuyện')
                    cb(null, account);
                })
            },
            (account, cb) => { // Create conversation
                new conversationModel({
                    starter: currentUserId,
                    account: account._id,
                    peoples: [
                        currentUserId,
                        account.userId._id
                    ]
                }).save((err, conversation) => {
                    if(err){
                        console.log('Error in ctl/api-service/chat.js -> createAccountConversation 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    cb(null, account, conversation);
                })
            },
            (account, conversation, cb) => { // Create message to that conversation
                new messageModel({
                    user: currentUserId,
                    conversation: conversation._id,
                    message,
                    type: 'message'
                }).save((err, newMessage) => {
                    if(err){
                        console.log('Error in ctl/api-service/chat.js -> createAccountConversation 04 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    cb(null, {conversation, message: newMessage})
                })
            }
        ], (err, result) => {
            if(err) return reject(err);
            resolve(result);
        });
    });
}

exports.checkBodyFirstTimeConversation = [
    body('account_id', 'Account Id không hợp lệ').optional().isMongoId(),
    body('user_id', 'User Id không hợp lệ').optional().isMongoId(),
    body('message', 'Message không hợp lệ').notEmpty().isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createFirstTimeConversation = (req, res) => {
    if(req.body.account_id){
        createAccountConversation(req.body.account_id, req.body.message, req.user._id)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            res.status(400).send(err);
        })
    }
}

exports.checkBodyCreateTextMessage = [
    body('id_conversation', 'Id không hợp lệ').isMongoId(),
    body('message', 'Message không hợp lệ').notEmpty().isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createTextMessage = async (req, res) => {
    const session = await mongoose.startSession()
    .catch(err => {
        console.log('Có lỗi khi start session ' + err);
        return false;
    });
    if(!session) return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    waterfall([
        cb => { // Check if have conversation
            conversationModel
            .findOne({
                _id: req.body.id_conversation,
                peoples: req.user._id
            }, 'peoples', {populate: {path: 'peoples', select: '_id'}, session: session, lean: true}, (err, conversation) => {
                if(err){
                    console.log('Error in ctl/api-service/chat.js -> createTextMessage 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(conversation === null) return cb('Không thể tạo tin nhắn')
                cb(null, conversation)
            });
        },
        (conversation, cb) => { // Update time conversation
            conversationModel.findByIdAndUpdate(conversation._id, {updatedAt: new Date()}, {session: session}, err => {
                if(err){
                    console.log('Error in ctl/api-service/chat.js -> createTextMessage 02  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, conversation);
            })
        },
        (conversation, cb) => { // Create message
            messageModel.create([{
                user: req.user._id,
                conversation: req.body.id_conversation,
                message: req.body.message,
                type: 'message'
            }], {session: session}, (err, messages) => {
                if(err){
                    console.log('Error in ctl/api-service/chat.js -> createTextMessage 03  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(messages.length === 0) return cb('Không thể tạo tin nhắn')
                cb(null, {message: messages[0], conversation: conversation});
            })
        }
    ], async function(err, result){
        if(err){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(err);
        }
        const isSuccessCommit = await session.commitTransaction().catch(err => {
                console.log('Error in ctl/api-service/chat.js -> Commit Transaction 01  ' + err);
                return false;
        });
        if(!isSuccessCommit)
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        else{
            // Push message to other peoples in conversation exclude owner
            result.conversation.peoples.forEach(user => {
                if(user._id.toString() !== req.user._id.toString())
                    helper.pushNotification(user._id, {
                        event: 'user-send-message',
                        value: {
                            message: result.message
                        }
                    })
            })
            res.send(result.message);
        }
    })
}

exports.checkBodyTrackingConversation = [
    body('conversation_id', 'Id conversation không hợp lệ').isMongoId(),
    body('message_id', 'Id message không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.trackingConversation = (req, res) => {
  waterfall([
      cb => {   // Get conversation from id and make sure current user in that conversation
        conversationModel
        .findOne({_id: req.body.conversation_id, peoples: req.user._id})
        .select('_id peoples')
        .lean()
        .exec((err, conversation) => {
            if(err){
                console.log('Error in ctl/api-service/chat.js -> trackingConversation 01 ' + err);
                return cb('Có lỗi xảy ra vui lòng thử lại sau')
            }
            if(!conversation) return cb('Không tìm thấy cuộc trò chuyện');
            cb(null, conversation);
        });
      },
      (conversation, cb) => { // Get message from id and check if message is from conversation
        messageModel
        .findById(req.body.message_id)
        .select('conversation')
        .lean()
        .exec((err, message) => {
            if(err){
                console.log('Error in ctl/api-service/chat.js -> trackingConversation 02 ' + err);
                return cb('Có lỗi xảy ra vui lòng thử lại sau')
            }
            if(!message) return cb('Không tìm thấy tin nhắn')
            if(message.conversation._id.toString() !==  conversation._id.toString())
                return cb('Tin nhắn không hợp lệ')
            cb(null, conversation, message);
        })
      },
      (conversation, message, cb) => { // Query tracker to check if tracking is exist or not
        conversationTrackerModel
        .findOne({
            conversation: conversation._id, 
            user: req.user._id
        })
        .select('message')
        .lean()
        .exec((err, tracker) => {
            if(err){
                console.log('Error in ctl/api-service/chat.js -> trackingConversation 03  ' + err);
                return cb('Có lỗi xảy ra vui lòng thử lại sau')
            }
            cb(null, conversation, message, tracker);
        })
      },
      (conversation, message, tracker, cb) => { // Update if exist
        if(!tracker) return cb(null, conversation, message, tracker); // Go to create if not exist
        conversationTrackerModel.findByIdAndUpdate(tracker._id, {message: message._id}, err => {
                if(err){
                    console.log('Error in ctl/api-service/chat.js -> trackingConversation 04 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                    // Push 'Đã xem' to another people in conversation
                const idUserLeft = conversation.peoples.find(userId => userId.toString() !== req.user._id.toString());
                if(idUserLeft){
                    helper.pushNotification(idUserLeft, {
                        event: 'send-tracker-message',
                        value: {
                            conversation: conversation._id,
                            message: message._id,
                            updatedAt: new Date()    
                        }
                    })
                }
                cb(null, conversation, message, tracker);
            })
      },
      (conversation, message, tracker, cb) => {
          if(tracker) return cb(null, tracker._id); // Go to end if exist
          new conversationTrackerModel({
              conversation: conversation._id,
              message: message._id,
              user: req.user._id
          }).save((err, newTracker) => {
              if(err){
                  console.log('Error in ctl/api-service/chat.js -> trackingConversation 05 ' + err);
                  return cb('Có lỗi xảy ra vui lòng thử lại sau')
              }
              if(!newTracker) return cb('Có lỗi xảy ra vui lòng thử lại sau');

              // Push 'Đã xem' to another people in conversation
              const idUserLeft = conversation.peoples.find(userId => userId.toString() !== req.user._id.toString());
              if(idUserLeft){
                  console.log('found');
                helper.pushNotification(idUserLeft, {
                    event: 'send-tracker-message',
                    value: {
                        messageId: message._id 
                    }
                })
              }

              cb(null, newTracker._id);
          })
      }
  ], function(err, result){
      if(err) return res.status(400).send(err);
      res.send(result);
  })
}

exports.getUnreadConversation = (req, res) => {
    if(!req.isAuthenticated() || req.user.status !== 'normal')
        return res.status(400).send('Unauthorized');
   waterfall([
       cb => {
           conversationModel
           .find({peoples: req.user._id})
           .select('_id')
           .lean()
           .exec((err, conversations) => {
               if(err){
                   console.log('Error in ctl/api-service/chat.js -> getUnreadConversation 01 ' + err);
                   return cb('Có lỗi xảy ra vui lòng thử lại sau')
               }
               cb(null, conversations);
           })
       },
       (conversations, cb) => {
           if(conversations.length === 0) return cb(null, 0);
           const listPromise = conversations.map(conversation => {
               return new Promise((resolve, reject) => {
                   conversationTrackerModel
                   .findOne({conversation: conversation._id, user: req.user._id})
                   .select('conversation message')
                   .exec((err, tracker) => {
                       if(err){
                           console.log('Error in ctl/api-service/chat.js -> getUnreadConversation 02 ' + err);
                           return reject('Có lỗi xảy ra vui lòng thử lại sau')
                       }
                       if(!tracker) return resolve(true);
                       messageModel
                       .countDocuments({
                           user: {$ne: req.user._id},
                           conversation: conversation._id,
                           _id: {$gt: tracker.message}
                        }, (err, count) => {
                            if(err){
                                console.log('Error in ctl/api-service/chat.js -> getUnreadConversation 03 ' + err);
                                return reject('Có lỗi xảy ra vui lòng thử lại sau')
                            }
                            if(count === 0) return resolve(false);
                            resolve(true);
                        })
                   })
               })
           });
           Promise.all(listPromise)
           .then(result => {
               // Result return array, eg: [true, false, true, true], true with means not read, false is read
               // filter result array with value true and get length of that array just filter 
               const totalUnreadConversation = result.filter(conversation => conversation);
               cb(null, totalUnreadConversation.length);
           })
           .catch(err => {
                cb(err)
           })
       }
   ], function(err, result){
       if(err) return res.status(400).send(err);
       res.send({OK: true, total: result});
   })
}