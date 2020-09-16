var express = require('express');
var router = express.Router();
const helper = require('../help/helper');

const path = require('path');
const fs = require('fs');
//  Config multer to upload image
const multer = require('multer');

const upload = multer()

const passport = require('passport');

const registerAC = require('../controllers/user/register');
const loginAC = require('../controllers/user/login');
const profileAC = require('../controllers/user/profile');
const logoutAC = require('../controllers/user/logout');
const viewUserAC = require('../controllers/user/view-user');
const collectionC = require('../controllers/user/collection');


function redirectOldUrl(req, res, next){ // redirect when user login or register finish
    if(req.session.oldUrl){
        console.log('rediirect old url ' + req.session.oldUrl);
        const url = req.session.oldUrl;
        res.redirect(url)
        req.session.oldUrl = null;
    }
    else
        res.send('/user/profile');
}

function isLogin(req, res, next){ // if not login save current url to session then redirect to login page
    if(!req.isAuthenticated()){
        req.session.oldUrl = '/user' + req.url;
        return res.redirect('/user/login');
    }
    next();
}

function checkNoLogin(req, res, next){ // check if no login, if login already redirect to oldUrl if exist
    if(!req.isAuthenticated())
        return next();
    else{
        if(req.session.oldUrl){
            console.log('CheckNoLogin rediirect old url ' + req.session.oldUrl);
            const url = req.session.oldUrl;
            res.redirect(url)
            req.session.oldUrl = null;
        }
        else
            res.redirect('/');
    }
        
}



/* Create user . */
router.get('/register', checkNoLogin, registerAC.renderPage);

router.post('/register', checkNoLogin, registerAC.validateUser, registerAC.registerAccount, redirectOldUrl);


/* Login user . */
router.get('/login', checkNoLogin, loginAC.renderPage);

router.post('/login', checkNoLogin, loginAC.validateUser, loginAC.addNewAccount, loginAC.rememberMeTokenCheck, redirectOldUrl);

/* Login With Facebook . */
router.get('/login/facebook', checkNoLogin, passport.authenticate('facebook', {scope: ['email', 'public_profile']}));

router.get('/login/facebook/callback', passport.authenticate('facebook'), loginAC.callbackAuthenticate);

/* Login With Google . */
router.get('/login/google', checkNoLogin, passport.authenticate('google', {scope: ['profile', 'email']}));

router.get('/login/google/callback', passport.authenticate('google'), loginAC.callbackAuthenticate);

// ---------------------------------------- PROFILE -----------------------------------------
/* User Profile . */
router.get('/profile', isLogin, profileAC.renderPage);

router.patch('/profile/update-profile', isLogin, profileAC.checkBodyUpdateProfile, profileAC.updateProfile);

router.patch('/profile/update-password', isLogin, profileAC.checkBodyUpdatePassWord, profileAC.updatePassword);


/* Account User Profile  . */
router.get('/profile/accounts', isLogin, profileAC.renderProfileAccount);

router.get('/profile/get-accounts', isLogin, profileAC.getAccount);

/* Collection User Profile . */
router.get('/profile/collections', isLogin, profileAC.renderCollection);

// ---------------------------------------- END PROFILE -----------------------------------------


// ---------------------------------------- Other User's PROFILE -----------------------------------------

/* Account From User Profile  . */
router.get('/:id/accounts', viewUserAC.checkParams, viewUserAC.renderPage);

/* API Get Account From User Profile . */
router.get('/:id/get-accounts', viewUserAC.checkParamGetUserAccounts, viewUserAC.getUserAccounts);

// ---------------------------------------- END Other User's PROFILE -----------------------------------------

/* Create collection from user . */
router.post('/create-collection', isLogin, collectionC.checkBody, collectionC.createCollection);

/* Remove collection from user . */
router.delete('/delete-collection', isLogin, collectionC.checkBody, collectionC.deleteCollection);



/* Logout . */
router.get('/logout', logoutAC.logout);



module.exports = router;
