const mongoose = require('mongoose');

const imageSchema = mongoose.Schema({
    url: {type: String, required: true},
    albumId: {type: String, required: true},
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true}
}, {timestamps: { createdAt: true }});

module.exports = mongoose.model('images', imageSchema);