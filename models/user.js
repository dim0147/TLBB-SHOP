const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    idFacebook: String,
    name: String,
    urlImage: String
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('users', userSchema);