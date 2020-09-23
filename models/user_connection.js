const mongoose = require('mongoose');

const userConnectionSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true, required: true},
    socketId: {type: String, unique: true, required: true} 
}, {timestamps: { updatedAt: false }})

const model = mongoose.model('user_connections', userConnectionSchema);

module.exports = model;
