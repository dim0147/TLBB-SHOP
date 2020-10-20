const mongoose = require('mongoose');

const type = [
    'unlock_account',
    'unlock_user'
];

const status = [
    'pending',
    'response',
    'done'
];

exports.type = type; 

const ticketSchema = mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, ref:'users', required: true},
    title: {type: String, required: true},
    account: {type: mongoose.Schema.Types.ObjectId, ref:'accounts'},
    email: {type: String},
    type: {type: String, enum: type, required: true},
    status: {type: String, enum: status, required: true, default: 'pending'}
}, {timestamps: true});

module.exports = mongoose.model('tickets', ticketSchema);