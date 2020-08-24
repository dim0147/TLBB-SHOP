const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    token: {type: String, required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
}, {timestamps: { createdAt: true }});

module.exports = mongoose.model('tokens', tokenSchema);