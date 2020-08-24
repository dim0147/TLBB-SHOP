const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    username: String,
    password: String,
    name: {type: String, required: true},
    email: String,
    idFacebook: String,
    idGoogle: String,
    urlImage: String,
    type: {type: String, enum: ['web', 'facebook', 'google'], default: 'web',required: true},
    role: {type: String, required: true, enum: ['admin', 'user'], default: 'user'}
}, { timestamps: { createdAt: 'created_at' } });






module.exports = mongoose.model('users', userSchema);