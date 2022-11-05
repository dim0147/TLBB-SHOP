const config = require('./config/config');
const mongoose = require('mongoose');
const fs = require('fs');
const axios = require('axios');

const imageModel = require('./models/image');

mongoose.connect('mongodb://localhost:27017/TLBB-SHOP', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
.catch(err => console.log(err))

mongoose.connection.on('connected', result => {
    console.log('connect success');
})
