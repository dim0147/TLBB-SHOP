const mongoose = require('mongoose');

const status = [
    'normal',
    'archived',
]

const conversationSchema = mongoose.Schema({
    starter: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
    status: {type: String, enum: status, default: 'normal', required: true},
    peoples: [ {type: mongoose.Schema.Types.ObjectId, ref: 'users'} ]
})

conversationSchema.index({peoples: 1});

module.exports = mongoose.model('conversations', conversationSchema)