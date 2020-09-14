var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

var router = express.Router();

const config = require('../config/config');

const viewAC = require('../controllers/account/view-account');
const editAC = require('../controllers/account/edit-account');
const addAC = require('../controllers/account/add-account');
const removeAC = require('../controllers/account/remove-account');
const setStatusAC = require('../controllers/account/set-status-account');
const getLockReasonAC = require('../controllers/account/get-lock-reason');

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


function isLogin(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  
  req.session.oldUrl = '/account' + req.url;
  return res.redirect('/user/login');
}


//---------------------------ACCOUNT------------------------------------

/* Create account post listing. */
router.get('/add-account', isLogin, addAC.renderAddAccount);
router.post('/add-account', isLogin, upload.array('images'), addAC.checkBody, addAC.addNewAccount);

/* Edit account post listing. */
router.get('/edit-account/:id', isLogin, editAC.checkParamRenderPage ,editAC.renderPage);
router.patch('/edit-account/:id', isLogin, upload.array('images'), editAC.updateAccount);

/* Mark account as done by user. */
router.patch('/mark-done', isLogin, setStatusAC.checkBody, setStatusAC.markDoneAccount);

/* GET detail account. */
router.get('/view-account/:id', viewAC.checkBody ,viewAC.renderPage);

/* GET lock reason account. */
router.get('/get-lock-reason', isLogin, getLockReasonAC.checkQuery, getLockReasonAC.getLockReasonAccount);

/* Search account. */
router.get('/search', searchC.checkFields, searchC.renderPage);

/* Remove account. */
router.delete('/remove-account', isLogin, removeAC.checkBody, removeAC.removeAccount);


//---------------------------USER--------------------------------------
/* CREATE user rating. */
router.post('/create-rating', isLogin, rateC.validateBody, rateC.createRating);

/* CREATE user comment. */
router.post('/create-comment', isLogin, commentC.validateBody, commentC.createComment);

/* GET user comment. */
router.get('/get-comments', isLogin, commentC.validateBodyGetComments, commentC.getComments);

/* HANDLE user likes. */
router.post('/liked', isLogin, likedC.validationBody, likedC.likeHandler);


module.exports = router;
