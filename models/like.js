const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'comments', required: true},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
    status: {type: String, enum: ['like'], required: true}
}, {timestamps: { createdAt: true }})

module.exports = mongoose.model('likes', likeSchema);