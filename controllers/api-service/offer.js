const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const helper = require('../../help/helper');

const conversationModel = require('../../models/conversation');
const accountModel = require('../../models/account');
const messageModel = require('../../models/message');

function checkValidConversationAndAccount(conversation, req){
      // Check account status and check is owner of account or not
      if(!conversation.account) return {error:'Không tìm thấy tài khoản'}
      if(conversation.account.status !== 'pending') return {error:'Tài khoản không thể thực hiện thao tác này'}
      if(conversation.account.userId.toString() !== req.user._id.toString()) return {error:"Bạn không có quyền thao tác tài khoản này"}

      //  Check conversation is normal and offer equal to conversation offer
      if(conversation.status !== 'normal') return {error:'Cuộc trò chuyện này đã hoàn tất'}
      if(!conversation.offer) return {error:'Cuộc trò chuyện không có đề nghị hợp lệ'}
      if(conversation.offer._id.toString() !== req.body.offer_id) return {error:'Offer không hợp lệ'}
      if(conversation.offer.conversation.toString() !== conversation._id.toString()) return {error:"Offer không trong cuộc trò chuyện này"}

      // Check if target to accept offer is valid
      conversation.peoples = conversation.peoples.filter(user => {
          return user._id.toString() !== req.user._id.toString();
      });
      // Check if don't have user or user is not valid 
      if(conversation.peoples.length === 0) return {error:'Cuộc trò chuyện không hợp lệ'}
      if(conversation.peoples[0].status !== 'normal') return {error:'Người dùng không còn hợp lệ'}
      return true;
}

exports.checkBodyAcceptOffer = [
    body('conversation_id', 'Id conversation không hợp lệ').isMongoId(),
    body('offer_id', 'Offer Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.acceptOffer = async (req, res) => {
    const session = await mongoose.startSession()
    .catch(err => {
        console.log('Có lỗi khi start session ' + err);
        return false;
    });
    if(!session) return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    waterfall([
        cb => { // Find conversation
            conversationModel
            .findOne({_id: req.body.conversation_id, peoples: req.user._id})
            .session(session)
            .select('status')
            .populate([
                {
                    path: 'peoples',
                    select: 'status'
                },
                {
                    path: 'account',
                    select: 'status userId transaction_type'
                },
                {
                    path: 'offer',
                    select: 'type price_offer createdAt conversation'
                },
            ])
            .lean()
            .exec((err, conversation) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> acceptOffer 01' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!conversation) return cb('Không tìm thấy cuộc trò chuyện');
                cb(null, conversation);
            })
        },
        (conversation, cb) => { // Checking before update accept offer
            const result = checkValidConversationAndAccount(conversation, req);
            if(result.error)
                return cb(result.error);
            cb(null, conversation);
        },
        (conversation, cb) => { // Update status account to done
            accountModel.findByIdAndUpdate(conversation.account._id, {status: 'done'}, {session: session}, err => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> acceptOffer 02' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, conversation);
            });
        },
        (conversation, cb) => { // Update conversation
            conversationModel.findByIdAndUpdate(conversation._id, {status: 'archived'}, {session: session}, err => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> acceptOffer 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, conversation);
            })
        },
        (conversation, cb) => { // Create accept offer message
            messageModel.create([{
                type: 'accept_offer',
                user: req.user._id,
                conversation: conversation._id,
                offer: conversation.offer
            }], {session: session}, (err, messages) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> acceptOffer 04 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }   
                if(messages.length === 0) return cb('Không thể tạo tin nhắn');
                const newMessage = messages[0].toObject();
                newMessage.offer = conversation.offer; 
                cb(null, {newMessage: newMessage, conversation: conversation});
            })
        }
    ],async function(err, result){
        if(err){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(err);
        }
        const isSuccessCommit = await session.commitTransaction().catch(err => {
                console.log('Error in ctl/api-service/offer.js -> Commit Transaction 01  ' + err);
                return false;
        });
        if(!isSuccessCommit)
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        else{
            // Push notification for client, not owner
            helper.pushNotification(result.conversation.peoples[0]._id, {
                event: 'user-send-message',
                value: {
                    message: result.newMessage
                }
            })
             // Notify for all user chat about current status of account
             helper.pushStatusAccount(result.conversation.account._id, result.conversation.peoples[0]._id, 'done', req.user._id);

            return res.send(result.newMessage);
        }
    })
}

exports.checkBodyDeniedOffer = [
    body('conversation_id', 'Id conversation không hợp lệ').isMongoId(),
    body('offer_id', 'Offer Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.deniedOffer = async (req, res) => {
    const session = await mongoose.startSession()
    .catch(err => {
        console.log('Có lỗi khi start session ' + err);
        return false;
    });
    if(!session) return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    waterfall([
        cb => { // Find conversation
            conversationModel
            .findOne({_id: req.body.conversation_id, peoples: req.user._id})
            .session(session)
            .select('status')
            .populate([
                {
                    path: 'peoples',
                    select: 'status'
                },
                {
                    path: 'account',
                    select: 'status userId transaction_type'
                },
                {
                    path: 'offer',
                    select: 'type price_offer createdAt conversation'
                },
            ])
            .lean()
            .exec((err, conversation) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> deniedOffer 01' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!conversation) return cb('Không tìm thấy cuộc trò chuyện');
                cb(null, conversation);
            })
        },
        (conversation, cb) => { // Checking before update accept offer
            const result = checkValidConversationAndAccount(conversation, req);
            if(result.error)
                return cb(result.error);
            cb(null, conversation);
        },
        (conversation, cb) => { // Update offer of conversation to null
            conversationModel.findByIdAndUpdate(conversation._id, {offer: null}, {session: session}, (err) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> deniedOffer 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, conversation);
            })

        },
        (conversation, cb) => { // Create message denied offer
            messageModel.create([{
                type: 'denied_offer',
                user: req.user._id,
                conversation: conversation._id,
                offer: conversation.offer,
            }], {session: session}, (err, messages) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> deniedOffer 02  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(messages.length === 0) return cb("Không thể tạo message");
                const newMessage = messages[0].toObject();
                newMessage.offer = conversation.offer;
                cb(null, {newMessage: newMessage, conversation: conversation})
            })
        }
    ],async function(err, result){
        if(err){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(err);
        }
        const isSuccessCommit = await session.commitTransaction().catch(err => {
                console.log('Error in ctl/api-service/offer.js -> Commit Transaction 02  ' + err);
                return false;
        });
        if(!isSuccessCommit)
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        else{
            helper.pushNotification(result.conversation.peoples[0]._id, {
                event: 'user-send-message',
                value: {
                    message: result.newMessage
                }
            })
            return res.send(result.newMessage);
        }
    })
}

exports.checkBodyCancelOffer = [
    body('conversation_id', 'Id conversation không hợp lệ').isMongoId(),
    body('offer_id', 'Offer Id không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.cancelOffer = async (req, res) => {
    const session = await mongoose.startSession()
    .catch(err => {
        console.log('Có lỗi khi start session ' + err);
        return false;
    });
    if(!session) return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
    session.startTransaction();

    waterfall([
        cb => { // Find conversation
            conversationModel
            .findOne({_id: req.body.conversation_id, peoples: req.user._id})
            .session(session)
            .select('status')
            .populate([
                {
                    path: 'peoples',
                    select: 'status'
                },
                {
                    path: 'account',
                    select: 'status userId transaction_type'
                },
                {
                    path: 'offer',
                    select: 'type price_offer createdAt conversation user'
                },
            ])
            .lean()
            .exec((err, conversation) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> cancelOffer 01' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!conversation) return cb('Không tìm thấy cuộc trò chuyện');
                cb(null, conversation);
            })
        },
        (conversation, cb) => { // Checking before cancel offer
            // Check account status 
            if(!conversation.account) return cb('Không tìm thấy tài khoản')
            if(conversation.account.status !== 'pending') return cb('Tài khoản không thể từ chối đề nghị')
           
            //  Check conversation and offer
                // Check conversation is normal
            if(conversation.status !== 'normal') return cb('Cuộc trò chuyện này đã hoàn tất')
                // Check offer conversation is null 
            if(!conversation.offer) return cb('Cuộc trò chuyện không có đề nghị hợp lệ')
                // Check if offer in conversation not equal to offer need to cancel submit by user
            if(conversation.offer._id.toString() !== req.body.offer_id) return cb('Offer không hợp lệ')
                // Check if offer in conversation not equal to current conversation (won't happen)
            if(conversation.offer.conversation.toString() !== conversation._id.toString()) return cb("Offer không trong cuộc trò chuyện này")
                // Check if current user is not owner of this offer
            if(conversation.offer.user.toString() !== req.user._id.toString()) return cb('Bạn không có quyền huỷ bỏ đề nghị này')

            // Check if target to cancel offer is valid
            conversation.peoples = conversation.peoples.filter(user => {
                return user._id.toString() !== req.user._id.toString();
            });
            // Check if don't have user or user is not valid 
            if(conversation.peoples.length === 0) return cb('Cuộc trò chuyện không hợp lệ')
            if(conversation.peoples[0].status !== 'normal') return cb('Người dùng không còn hợp lệ')

            cb(null, conversation);
        },
        (conversation, cb) => { // Update offer of conversation to null
            conversationModel.findByIdAndUpdate(conversation._id, {offer: null}, {session: session}, (err) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> cancelOffer 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, conversation);
            })

        },
        (conversation, cb) => { // Create message denied offer
            messageModel.create([{
                type: 'cancel_offer',
                user: req.user._id,
                conversation: conversation._id,
                offer: conversation.offer,
            }], {session: session}, (err, messages) => {
                if(err){
                    console.log('Error in ctl/api-service/offer.js -> cancelOffer 02  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(messages.length === 0) return cb("Không thể tạo message");
                const newMessage = messages[0].toObject();
                newMessage.offer = conversation.offer;
                cb(null, {newMessage: newMessage, conversation: conversation})
            })
        }
    ],async function(err, result){
        if(err){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(err);
        }
        const isSuccessCommit = await session.commitTransaction().catch(err => {
                console.log('Error in ctl/api-service/offer.js -> Commit Transaction 03  ' + err);
                return false;
        });
        if(!isSuccessCommit)
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        else
        {
            helper.pushNotification(result.conversation.peoples[0]._id, {
                event: 'user-send-message',
                value: {
                    message: result.newMessage
                }
            })
            return res.send(result.newMessage);
        }
    })
}


