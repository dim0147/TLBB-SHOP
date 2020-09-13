const mongoose = require('mongoose');

const lockReasonSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
    reason: {type: String, required: true},
}, {timestamps: { createdAt: true }})
module.exports = mongoose.model('lock-reasons', lockReasonSchema);