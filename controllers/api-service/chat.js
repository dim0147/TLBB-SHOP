const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose')

const helper = require('../../help/helper');

const conversationModel = require('../../models/conversation');
const messageModel = require('../../models/message');

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
        cb => { // Check if is in conversation
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
        (conversation, cb) => {
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