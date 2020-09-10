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


/* Create user . */
router.get('/register', registerAC.renderPage);

router.post('/register', registerAC.validateUser, registerAC.registerAccount);


/* Login user . */
router.get('/login', loginAC.renderPage);

router.post('/login', loginAC.validateUser, loginAC.addNewAccount, loginAC.rememberMeTokenCheck);

/* Login With Facebook . */
router.get('/login/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile']}));

router.get('/login/facebook/callback', passport.authenticate('facebook'), loginAC.callbackAuthenticate);

/* Login With Google . */
router.get('/login/google', passport.authenticate('google', {scope: ['profile', 'email']}));

router.get('/login/google/callback', passport.authenticate('google'), loginAC.callbackAuthenticate);

/* Profile . */
router.get('/profile', profileAC.renderPage);

router.patch('/profile/update-profile', profileAC.checkBodyUpdateProfile ,profileAC.updateProfile);



/* Logout . */
router.get('/logout', logoutAC.logout);



module.exports = router;
