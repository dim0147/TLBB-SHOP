const mongoose = require('mongoose');

const ticketPostSchema = mongoose.Schema({
    ticket: {type: mongoose.Schema.Types.ObjectId, ref:'tickets', required: true},
    owner: {type: mongoose.Schema.Types.ObjectId, ref:'users', required: true},
    text: {type: String, required: true},
}, {timestamps: { updatedAt: false }});

module.exports = mongoose.model('ticket_posts', ticketPostSchema);