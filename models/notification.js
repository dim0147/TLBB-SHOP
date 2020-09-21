const mongoose = require('mongoose');

const typeNotify = [
    'comment-on-my-account',
    'reply-my-comment',
    'like-my-comment',
    'admin-lock-account'
]

const status = [
    'unseen',
    'seen',
    'read' // When user click into notification
]

const notifySchema = new mongoose.Schema({
    comment: {type: mongoose.Schema.Types.ObjectId, ref: 'comments'},
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
    values: {type: String},
    type: {type: String, enum: typeNotify, required: true},
    status: {type: String, enum: status, default: 'unseen', required: true},
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
}, {timestamps: { createdAt: true , updatedAt: true }})

module.exports = mongoose.model('notifications', notifySchema);