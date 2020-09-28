const waterfall = require('async-waterfall');
const { body,validationResult } = require('express-validator');
const mongoose = require('mongoose');

const helper = require('../../help/helper');

const conversationModel = require('../../models/conversation');
const messageModel = require('../../models/message');
const accountModel = require('../../models/account');

exports.checkBodyPlaceOffer = [
    body('idAccount', 'Account không hợp lệ').isMongoId(),
    body('price', 'Price không hợp lệ').isNumeric(),
    body('message', 'Message không hợp lệ').optional().isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.placeOffer = async function (req, res){
    const session = await mongoose.startSession()
                    .catch(err => {
                        if(err){
                            console.log('Error in ctl/account/place-offer.js -> startSession()  ' + err);
                            return false
                        }
                    });
    session.startTransaction();
    waterfall([
        cb => { // Check if account is valid to place offer
            accountModel.findById(req.body.idAccount)
            .session(session)
            .select('transaction_type status price title')
            .populate({
                path: 'userId',
                select: 'role status'
            })
            .lean()
            .exec((err, account) => {
               if(err){
                   console.log('Error in ctl/account/place-offer.js -> placeOffer 01  ' + err);
                   return cb('Có lỗi xảy ra vui lòng thử lại sau')
               }
               if(!account) return cb("Không tìm thấy tài khoản")
               if(account.status != 'pending') return cb("Tài khoản không thể đưa ra giá đề nghị")
               if(!account.userId) return cb("Chủ tài khoản không còn hợp lệ")
               if(account.userId.status != 'normal') return cb('Chủ tài khoản không còn hợp lệ')
               if(account.userId._id.toString() == req.user._id.toString()) return cb('Bạn không thể đưa ra đề nghị cho tài khoản của mình')
               if(account.transaction_type != 'sell' && account.transaction_type != 'all') return cb("Phương thức tài khoản này không cho phép")
               cb(null, {account: account})
            })
        },
        (result, cb) => { // Check if price offer is lower than 20% of account price
            const priceOrigin = result.account.price;
            const priceOffer = Number(req.body.price);
            const limit = Math.floor((priceOrigin * 20) / 100);
            if(priceOffer < limit){
                return cb('Xin hãy đề nghị giá cao hơn')
            }    
            cb(null, result)
        },
        (result, cb) => { // Check if have conversation or not
            // Get id of 2 user and put into array
            const TwoUserCvs = [req.user._id, result.account.userId._id];
            conversationModel.findOne({
                peoples: {
                    $size: 2,
                    $all: TwoUserCvs
                },
                account: result.account._id
            })
            .session(session)
            .select('status')
            .populate({
                path: 'offer',
                select: 'price_offer'
            })
            .exec((err, conversation) => {
                if(err){
                    console.log('Error in ctl/account/place-offer.js -> placeOffer 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.conversation = conversation;
                cb(null, result);
            })
        },
        (result, cb) => {  // Check if have conversation and offer with same price
            if(result.conversation && result.conversation.offer && (result.conversation.offer.price_offer === Number(req.body.price))){
                return cb("Bạn đang đề nghị với giá " + result.conversation.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'}) + ' rồi');
            }   
            cb(null, result);         
        },
        (result, cb) => { // Create conversation if not have
            if(result.conversation) return cb(null, result);
            conversationModel.create([{
                starter: req.user._id,
                account: result.account._id,
                peoples: [req.user._id, result.account.userId._id]
            }], {session: session}, (err, conversations) => {
                if(err){
                    console.log('Error in ctl/account/place-offer.js -> place-offer 03  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(conversations.length === 0) return cb("Không thể tạo cuộc trò chuyện vui lòng thử lại sau")
                result.conversation = conversations[0];
                cb(null, result);
            })
        },
        (result, cb) => { // Place offer
            messageModel.create([{
                user: req.user._id,
                conversation: result.conversation._id,
                price_offer: Number(req.body.price),
                type: 'offer'
            }], {session: session}, (err, messages) => {
                if(err){
                    console.log('Error in ctl/account/place-offer.js -> placeOffer 04  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(messages.length === 0) return cb('Không thể tạo offer vui lòng thử lại sau')
                result.messageOffer = messages[0];
                cb(null, result);
            });
        },
        (result, cb) => { // Set offer just created to conversation
            result.conversation.offer = result.messageOffer._id;
            result.conversation.save(err => {
                if(err){
                    console.log('Error in ctl/account/place-offer.js -> Set offer to conversation  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, result);
            });
        },
        (result, cb) => { // Check if have message to send 
            if(!req.body.message) return cb(null, result);
            messageModel.create([{
                user: req.user._id,
                conversation: result.conversation._id,
                message: req.body.message,
                type: 'message'
            }], {session: session}, (err, message) => {
                if(err){
                    console.log('Error in ctl/account/place-offer.js -> placeOffer 05  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.newMessage = message;
                cb(null, result);
            })
        }
    ], async function(err, result){
        // Error abortTransaction
        if(err){
            await session.abortTransaction()
                  .catch(err => {
                    if(err)
                        console.log('Error in ctl/account/place-offer.js -> abortTransaction ' + err);
                  });
            session.endSession();
            return res.status(400).send(err);
        }
        // Commit the transaction if success
        await session.commitTransaction()
              .catch(err => {
                    if(err)
                    console.log('Error in ctl/account/place-offer.js -> commitTransaction ' + err);
              });
        session.endSession();

        // Create notification place offer
        helper.createNotification({
            account: result.account._id,
            owner: result.account.userId._id,
            type: 'place-offer-on-my-account'
        })

        // Push message 
        helper.pushNotification(result.account.userId._id, {
            event: 'user-send-message',
            value: {
                message: result.messageOffer
            }
        })
        res.send({offer: result.messageOffer, OK: true, message: 'Đề nghị thành công'});
    })
}