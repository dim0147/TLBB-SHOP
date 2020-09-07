var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

var router = express.Router();

const config = require('../config/config');

const viewAC = require('../controllers/account/view-account');
const editAC = require('../controllers/account/edit-account');
const rateC = require('../controllers/account/rate');
const commentC = require('../controllers/account/comment');
const likedC = require('../controllers/account/liked');
const searchC = require('../controllers/account/search');
const helper = require('../help/helper');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, config.pathStoreImageUpload + '/')
    },
    filename: function (req, file, cb) {
        let nameImage = helper.generateRandomString(9) + path.extname(file.originalname);
        do{
            nameImage = helper.generateRandomString(9) + path.extname(file.originalname);
        }while(fs.existsSync(config.pathStoreImageUpload + '/' + nameImage))
      cb(null, nameImage)
    }
  })


const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        req.errorImage = true;
        return callback(new Error('Ảnh không hợp lệ'))
    }
    callback(null, true)
  }, 
});

const addAC = require('../controllers/account/add-account');

//---------------------------ACCOUNT-------
/* Create account post listing. */
router.get('/add-account', addAC.renderAddAccount);

router.post('/add-account', upload.array('images'), addAC.checkBody, addAC.addNewAccount);

/* Edit account post listing. */
router.get('/edit-account/:id', editAC.checkParamRenderPage ,editAC.renderPage);

router.patch('/edit-account/:id', upload.array('images'), editAC.updateAccount);

/* GET detail account. */
router.get('/view-account/:id', viewAC.checkBody ,viewAC.renderPage);

/* Search account. */
router.get('/search',searchC.checkFields, searchC.renderPage);


//---------------------------USER-------
/* CREATE user rating. */
router.post('/create-rating', rateC.validateBody, rateC.createRating);

/* CREATE user comment. */
router.post('/create-comment', commentC.validateBody, commentC.createComment);

/* GET user comment. */
router.get('/get-comments', commentC.validateBodyGetComments, commentC.getComments);

/* HANDLE user likes. */
router.post('/liked', likedC.validationBody, likedC.likeHandler);


module.exports = router;
