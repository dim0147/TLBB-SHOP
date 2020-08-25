var express = require('express');
var router = express.Router();

const multer = require('multer');
const path = require('path');

const viewAC = require('../controllers/account/view-account')
const createRateC = require('../controllers/account/rate/create-rating')


const upload = multer({fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        req.errorImage = true;
        return callback(null, true)
    }
    callback(null, true)
},})

const addAC = require('../controllers/account/add-account');

/* Create account post listing. */
router.get('/add-account', addAC.renderAddAccount);

router.post('/add-account', upload.array('images'), addAC.addNewAccount)

/* GET detail account. */
router.get('/view-account/:id', viewAC.renderPage);

/* CREATE user rating. */
router.post('/rate/create-rating', createRateC.validationBody, createRateC.createRating);

module.exports = router;
