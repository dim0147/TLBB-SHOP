var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/'})
const passport = require('passport');

const addAC = require('../controllers/user/add-account');
const registerAC = require('../controllers/user/register');
const loginAC = require('../controllers/user/login');

/* Create account post listing. */
router.get('/add-account', addAC.renderAddAccount);

router.post('/add-account', upload.array('images'), addAC.addNewAccount)

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



module.exports = router;
