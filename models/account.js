const mongoose = require('mongoose');
const config = require('../config/config');

const accountSchema = mongoose.Schema({
    title: {type: String, required: true},
    c_name: {type: String, required: true},
    phai: {type: String, required: true, enum: config.account.phai},
    level: {type: Number, required: true},
    vohon: {type: String, required: true, enum: config.account.vohon},
    amkhi: {type: String, required: true, enum: config.account.amkhi},
    thankhi: {type: String, required: true, enum: config.account.thankhi},
    tuluyen: {type: String, required: true, enum: config.account.tuluyen},
    ngoc: {type: String, required: true, enum: config.account.ngoc},
    doche: {type: String, required: true, enum: config.account.doche},
    dieuvan: {type: String, required: true, enum: config.account.dieuvan},
    longvan: {type: String, required: true, enum: config.account.longvan},
    type: {type: String, required: true, enum: config.account.type},
    userId: {type: mongoose.Schema.Types.ObjectId, ref:'users'}
});

module.exports = mongoose.model('accounts', accountSchema);