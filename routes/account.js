const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const config = require('../config/config');

const viewAC = require('../controllers/account/view-account');
const editAC = require('../controllers/account/edit-account');
const addAC = require('../controllers/account/add-account');
const viewCommentAC = require('../controllers/account/view-comment');
const removeAC = require('../controllers/account/remove-account');
const setStatusAC = require('../controllers/account/set-status-account');
const getLockReasonAC = require('../controllers/account/get-lock-reason');
const placeOfferAC = require('../controllers/account/place-offer');

const rateC = require('../controllers/account/rate');
const commentC = require('../controllers/account/comment');
const likedC = require('../controllers/account/liked');
const searchC = require('../controllers/account/search');
const helper = require('../help/helper');

const storage = multer.diskStorage({
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
    var ext = path.extname(file.originalname).toLowerCase();
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

function isNormalUser(req, res, next){
  if(req.isAuthenticated() && req.user.status == 'normal' ){
    return next();
  }

  res.status(401);
  return res.redirect('/user/logout')
}

function isNormalUserAjax(req, res, next){
  if(req.isAuthenticated() && req.user.status == 'normal' ){
    return next();
  }

  return res.status(401).send("Tài khoản không hợp lệ, xin vui lòng logout")
}

//---------------------------ACCOUNT------------------------------------

/* Create account post listing. */
router.get('/add-account', isLogin, isNormalUser, addAC.renderAddAccount);
router.post('/add-account', isLogin, isNormalUserAjax, upload.array('images'), addAC.checkBody, addAC.addNewAccount);

/* Edit account post listing. */
router.get('/edit-account/:id', isLogin, isNormalUser, editAC.checkParamRenderPage ,editAC.renderPage);
router.patch('/edit-account/:id', isLogin, isNormalUserAjax, upload.array('images'), editAC.updateAccount);

/* Mark account as done by user. */
router.patch('/mark-done', isLogin, isNormalUserAjax, setStatusAC.checkBody, setStatusAC.markDoneAccount);

/* VIEW detail account. */
router.get('/view-account/:id', viewAC.checkBody ,viewAC.renderPage);
router.post('/view-account/create-report', isLogin, isNormalUserAjax, viewAC.checkBodyCreateReportAccount ,viewAC.createAccountReport);

/* VIEW comment of account. */
router.get('/view-comment/:id', viewCommentAC.checkParam, viewCommentAC.render);
/* GET comment of account. */
router.get('/fetch-comment/:id', isLogin, isNormalUserAjax, viewCommentAC.checkParam, viewCommentAC.getComments);


/* GET lock reason account. */
router.get('/get-lock-reason', isLogin, isNormalUserAjax, getLockReasonAC.checkQuery, getLockReasonAC.getLockReasonAccount);

/* VIEW Search account. */
router.get('/search', searchC.checkFields, searchC.renderPage);

/* Remove account. */
router.delete('/remove-account', isLogin, isNormalUserAjax, removeAC.checkBody, removeAC.removeAccount);

/* Place offer account. */
router.post('/place-offer', isLogin, isNormalUserAjax, placeOfferAC.checkBodyPlaceOffer, placeOfferAC.placeOffer);


//---------------------------USER--------------------------------------
/* CREATE user rating. */
router.post('/create-rating', isLogin, isNormalUserAjax, rateC.validateBody, rateC.createRating);

/* CREATE user comment. */
router.post('/create-comment', isLogin, isNormalUserAjax, commentC.validateBody, commentC.createComment);

/* GET user comment. */
router.get('/get-comments', isLogin, isNormalUserAjax, commentC.validateBodyGetComments, commentC.getComments);

/* HANDLE user likes. */
router.post('/liked', isLogin, isNormalUserAjax, likedC.validationBody, likedC.likeHandler);


module.exports = router;
