var express = require('express');
var router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const viewAC = require('../controllers/account/view-account');
const rateC = require('../controllers/account/rate');
const commentC = require('../controllers/account/comment');
const likedC = require('../controllers/account/liked');
const searchC = require('../controllers/account/search');
const helper = require('../help/helper');

var storage = multer.diskStorage({
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            req.errorImage = true;
            return callback(null, true)
        }
        callback(null, true)
    },
    destination: function (req, file, cb) {
      cb(null, 'public/images/data/')
    },
    filename: function (req, file, cb) {
        let nameImage = helper.generateRandomString(9) + path.extname(file.originalname);
        do{
            nameImage = helper.generateRandomString(9) + path.extname(file.originalname);
        }while(fs.existsSync('public/images/data/' + nameImage))
      cb(null, nameImage)
    }
  })


const upload = multer({ storage: storage });

const addAC = require('../controllers/account/add-account');

/* Create account post listing. */
router.get('/add-account', addAC.renderAddAccount);

router.post('/add-account', upload.array('images'), addAC.checkBody, addAC.addNewAccount)

/* GET detail account. */
router.get('/view-account/:id', viewAC.checkBody ,viewAC.renderPage);

/* Search account. */
router.get('/search',searchC.checkFields, searchC.renderPage);


/* CREATE user rating. */
router.post('/create-rating', rateC.validateBody, rateC.createRating);

/* CREATE user comment. */
router.post('/create-comment', commentC.validateBody, commentC.createComment);

/* GET user comment. */
router.get('/get-comments', commentC.validateBodyGetComments, commentC.getComments);

/* HANDLE user likes. */
router.post('/liked', likedC.validationBody, likedC.likeHandler);


module.exports = router;
