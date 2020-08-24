const mongoose = require('mongoose');

const phaiSchema = mongoose.Schema({
    name: {type: String, required: true}
}, {timestamps: { createdAt: true, updatedAt: true }});

module.exports = mongoose.model('phais', phaiSchema);