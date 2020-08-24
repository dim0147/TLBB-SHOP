const mongoose = require('mongoose');

const additionFieldSchema = mongoose.Schema({
    name: {type: String, required: true}
}, {timestamps: { createdAt: true, updatedAt: true }});

module.exports = mongoose.model('add-fields', additionFieldSchema);