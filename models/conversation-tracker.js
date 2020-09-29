const mongoose = require('mongoose');

const conversationTrackSchema = mongoose.Schema({
    conversation: {type: mongoose.Schema.Types.ObjectId, ref:'conversations', required: true},
    message: {type: mongoose.Schema.Types.ObjectId, ref: 'messages', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
}, {timestamps: true});

module.exports = mongoose.model('conversation-tracks', conversationTrackSchema);