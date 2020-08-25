const mongoose = require('mongoose');

const rateSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref:'accounts', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
    rate: {type: Number, required: true}
}, {timestamps: { createdAt: true, updatedAt: true}});

module.exports = mongoose.model('rates', rateSchema);