const mongoose = require('mongoose');

const viewSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    ip: {type: String, required: true}
}, {timestamps: { createdAt: true }});

module.exports = mongoose.model('views', viewSchema);