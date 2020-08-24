const mongoose = require('mongoose');

const additionFieldSchema = mongoose.Schema({
    accountId: {type: mongoose.Schema.Types.ObjectId, ref:'accounts', required: true}, 
    fieldId: {type: mongoose.Schema.Types.ObjectId, ref:'add-fields', required: true}, 
});

module.exports = mongoose.model('account-link-addfields', additionFieldSchema);