const mongoose = require('mongoose');

const reportResponseSchema = mongoose.Schema({
    report: {type: mongoose.Schema.Types.ObjectId, ref:'reports', required: true}, 
    text: {type: String, required: true},
    by: {type:  mongoose.Schema.Types.ObjectId, ref:'users', required: true},
}, {timestamps: { createdAt: true , updatedAt: false }});

module.exports = mongoose.model('report_responses', reportResponseSchema);