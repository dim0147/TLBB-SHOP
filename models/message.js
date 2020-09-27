const mongoose = require('mongoose');

const status = [
    'read',
    'unread',
]

const type = [
    'message',
    'offer',
    'cancel_offer',
    'denied_offer',
    'accept_offer'
]

const messageSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true, required: true},
    conversation: {type: mongoose.Schema.Types.ObjectId, ref: 'conversations', index: true, required: true},
    message: String,
    price_offer: Number,
    offer: {type: mongoose.Schema.Types.ObjectId, ref: 'messages'},
    type: {type: String, enum: type, required: true},
}, {timestamps: true} )

module.exports = mongoose.model('messages', messageSchema)