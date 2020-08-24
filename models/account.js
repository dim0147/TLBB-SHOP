const mongoose = require('mongoose');
const config = require('../config/config');

const accountSchema = mongoose.Schema({
    title: {type: String, required: true},
    c_name: {type: String, required: true},
    phai: {type: mongoose.Schema.Types.ObjectId, ref: 'phais',required: true},
    level: {type: Number, required: true},
    vohon: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    amkhi: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    thankhi: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    tuluyen: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    ngoc: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    doche: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    dieuvan: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    longvan: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    transaction_type: {type: String, required: true, enum: config.account.type},
    status: {type: String, required: true, enum: config.account.status},
    userId: {type: mongoose.Schema.Types.ObjectId, ref:'users'}
},{ timestamps: { createdAt: 'createdAt' } } );

module.exports = mongoose.model('accounts', accountSchema);