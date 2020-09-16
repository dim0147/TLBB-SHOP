const mongoose = require('mongoose');

const collectionSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
}, {timestamps: { createdAt: true }});

module.exports = mongoose.model('collections', collectionSchema);