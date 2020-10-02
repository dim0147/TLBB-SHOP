const mongoose = require('mongoose');

const typeActivity = [
    'add-new-account',
    'update-account',
    'remove-account',

    'add-collection',
    'remove-collection',

    'add-comment',
    'add-reply-comment',

    'like-comment',
    'unlike-comment',

    'rate-account',
    'update-rate-account',

    'view-account-detail',

    'view-user-profile'
]

const activitySchema = mongoose.Schema({
    account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
    comment: {type: mongoose.Schema.Types.ObjectId, ref: 'comments'},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    rate: Number,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
    type: {type: String, enum: typeActivity, required: true}
}, {timestamps: { createdAt: true, updatedAt: false }});

activitySchema.index({user: 1});

module.exports = mongoose.model('activities', activitySchema);