const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    idFacebook: String,
    name: String,
    urlImage: String
});

module.exports = mongoose.model('users', userSchema);