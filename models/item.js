const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
    name: {type: String, required: true},
    slug: {type: String, required: true}
}, {timestamps: { createdAt: true, updatedAt: true }});

module.exports = mongoose.model('items', itemSchema);