const mongoose = require('mongoose');

const propertySchema = mongoose.Schema({
    name: {type: String, required: true},
    itemId: {type: mongoose.Schema.Types.ObjectId, ref:'items', required: true}
});

module.exports = mongoose.model('item-properties', propertySchema);