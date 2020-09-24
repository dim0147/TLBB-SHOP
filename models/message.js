const mongoose = require('mongoose');

const status = [
    'read',
    'unread',
]

const type = [
    'message',
    'offer',
]

const messageSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true, required: true},
    conversation: {type: mongoose.Schema.Types.ObjectId, ref: 'conversations', index: true, required: true},
    message: String,
    price_offer: Number,
    type: {type: String, enum: type, required: true},
    status: {type: String, enum: status, default: 'unread', required: true},

})

module.exports = mongoose.model('messages', messageSchema)