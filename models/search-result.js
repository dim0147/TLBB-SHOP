const mongoose = require('mongoose');

const searchResultSchema = mongoose.Schema({
    item: {type: mongoose.Schema.Types.ObjectId, ref:'items', required: true},
    property: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
}, {timestamps: { createdAt: true }});

module.exports = mongoose.model('search-results', searchResultSchema);