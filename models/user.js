const mongoose = require('mongoose');
const passwordHash = require('password-hash');


const userSchema = mongoose.Schema({
    username: String,
    password: String,
    name: {type: String, maxlength: 40, required: true},
    email: String,
    phone: String,
    linkFB: String,
    idFacebook: String,
    idGoogle: String,
    urlImage: String,
    type: {type: String, enum: ['web', 'facebook', 'google'], default: 'web',required: true},
    role: {type: String, required: true, enum: ['admin', 'user'], default: 'user'},
    status: {type: String, required: true, enum: ['normal', 'lock'], default: 'normal'},
    last_online: {type: Date},
}, { timestamps: { createdAt: 'created_at' } });

userSchema.statics.hashPassword = function(password){
    const passwordCrypt = passwordHash.generate(password);
    return passwordCrypt;
}

userSchema.statics.validatePassword = function(passwordToValidate, hash){
    return passwordHash.verify(passwordToValidate, hash)
}

module.exports = mongoose.model('users', userSchema);