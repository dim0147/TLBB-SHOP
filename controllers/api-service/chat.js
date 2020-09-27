const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

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

exports.createTextMessage = (req, res) => {
    waterfall([
        cb => { // Check if is in conversation
            conversationModel
            .countDocuments({
                _id: req.body.id_conversation,
                peoples: req.user._id
            }, (err, count) => {
                if(err){
                    console.log('Error in ctl/api-service/chat.js -> createTextMessage 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(count === 0) return cb('Không thể tạo tin nhắn')
                cb(null)
            });
        },
        cb => { // Create message
            new messageModel({
                user: req.user._id,
                conversation: req.body.id_conversation,
                message: req.body.message,
                type: 'message'
            }).save((err, message) => {
                if(err){
                    console.log('Error in ctl/api-service/chat.js -> createTextMessage 02  ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!message) return cb('Không thể tạo tin nhắn')
                cb(null, message);
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    })
}