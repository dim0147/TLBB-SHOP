const config = require('./config/config');
const mongoose = require('mongoose');
const fs = require('fs');
const axios = require('axios');

const imageModel = require('./models/image');

mongoose.connect('mongodb://localhost:27017/TLBB-SHOP', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
.catch(err => console.log(err))

mongoose.connection.on('connected', result => {
    console.log('connect success');
    const contents = fs.readFileSync('./public/images/data/00cxQ3PwJ.jpg', {encoding: 'base64'});
    axios.post('https://api.imgbb.com/1/upload', {
        key: 'b2a71892722508409f68f4c3688401f9',
        image: contents
    })
    .then(function (response) {
        console.log('response');
        console.log(response.data);
      })
      .catch(function (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
        }
      });
})
