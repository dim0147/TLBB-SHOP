const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
    comment: {type: String, required: true},
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'comments'}
}, {timestamps: { createdAt: true, updatedAt: true}})
module.exports = mongoose.model('comments', commentSchema);