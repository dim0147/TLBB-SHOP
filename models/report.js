const mongoose = require('mongoose');

const type = [
    'conversation',
    'account',
    'user'
];

const status = [
    'pending',
    'done'
];

const reportSchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref:'accounts'}, 
    conversation: {type: mongoose.Schema.Types.ObjectId, ref:'conversations'},
    user: {type:  mongoose.Schema.Types.ObjectId, ref:'users'},
    reason: {type: String, required: true},
    owner: {type:  mongoose.Schema.Types.ObjectId, ref:'users', required: true},
    type: {type: String, enum: type, required: true},
    status: {type: String, enum: status, required: true, default: 'pending'}
}, {timestamps: { createdAt: true , updatedAt: false }});

module.exports = mongoose.model('reports', reportSchema);