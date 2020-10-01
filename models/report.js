const mongoose = require('mongoose');

const type = [
    'conversation',
    'account'
]

const reportSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref:'accounts'}, 
    conversation: {type: mongoose.Schema.Types.ObjectId, ref:'conversations'},
    reason: {type: String, required: true},
    user: {type:  mongoose.Schema.Types.ObjectId, ref:'users', required: true},
    type: {type: String, enum: type, required: true},
}, {timestamps: { createdAt: true , updatedAt: false }});

module.exports = mongoose.model('reports', reportSchema);