const mongoose = require('mongoose');

const propertySchema = mongoose.Schema({
    name: {type: String, required: true},
    itemId: {type: mongoose.Schema.Types.ObjectId, ref: 'items', required: true},
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties'},
    order: {type: Number, required: true},
    slug: String
});

module.exports = mongoose.model('item-properties', propertySchema);