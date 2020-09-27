const config = require('./config/config');
const mongoose = require('mongoose');
mongoose.connect(config.mongodb.uri, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
const conversationModel = require('./models/conversation');
const express = require('express');
const app = express();

console.log('alo');

conversationModel.findByIdAndUpdate('5f6d82a73390e80d9494f9be' , {createdAt: new Date()}, function(err){
    if(err) console.log(err);
    console.log('success');
})

app.listen(4000, function(err){
    if (err) console.log(err);
    console.log('running');
})