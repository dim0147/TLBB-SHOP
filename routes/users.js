var express = require('express');
var router = express.Router();

const passport = require('passport');

const registerAC = require('../controllers/user/register');
const loginAC = require('../controllers/user/login');
const profileAC = require('../controllers/user/profile');
const logoutAC = require('../controllers/user/logout');
const viewUserAC = require('../controllers/user/view-user');
const collectionC = require('../controllers/user/collection');
const chatC = require('../controllers/user/chat');


function redirectOldUrl(req, res, next){ // redirect when user login or register finish
    if(req.session.oldUrl){
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
            const url = req.session.oldUrl;
            res.redirect(url)
            req.session.oldUrl = null;
        }
        else
            res.redirect('/');
    }
        
}

function isNormalUser(req, res, next){
    if(req.isAuthenticated() && req.user.status == 'normal' ){
      return next();
    }

    return res.redirect('/user/logout')
}

function isNormalUserAjax(req, res, next){
    if(req.isAuthenticated() && req.user.status == 'normal' ){
      return next();
    }
  
    return res.status(401).send("Tài khoản không hợp lệ, xin vui lòng logout")
}

/* Create user . */
router.get('/register', checkNoLogin, registerAC.renderPage);

router.post('/register', checkNoLogin, registerAC.validateUser, registerAC.registerAccount, redirectOldUrl);


/* Login user . */
router.get('/login', checkNoLogin, loginAC.renderPage);

router.post('/login', checkNoLogin, loginAC.validateUser, loginAC.addNewAccount, loginAC.rememberMeTokenCheck, redirectOldUrl);

/* Login With Facebook . */
router.get('/login/facebook', checkNoLogin, passport.authenticate('facebook', {scope: ['email', 'public_profile']}));

router.get('/login/facebook/callback', loginAC.callbackAuthenticateFB);

/* Login With Google . */
router.get('/login/google', checkNoLogin, passport.authenticate('google', {scope: ['profile', 'email']}));

router.get('/login/google/callback', loginAC.callbackAuthenticateGG);

// ---------------------------------------- PROFILE -----------------------------------------
/* User Profile . */
router.get('/profile', isLogin, isNormalUser, profileAC.renderPage);
router.patch('/profile/update-profile', isLogin, isNormalUserAjax, profileAC.checkBodyUpdateProfile, profileAC.updateProfile);
router.patch('/profile/update-password', isLogin, isNormalUserAjax, profileAC.checkBodyUpdatePassWord, profileAC.updatePassword);


/* Account User Profile  . */
router.get('/profile/accounts', isLogin, isNormalUser, profileAC.renderProfileAccount);
router.get('/profile/get-accounts', isLogin, isNormalUserAjax, profileAC.getAccount);

/* Collection User Profile . */
router.get('/profile/collections', isLogin, isNormalUser, profileAC.renderCollection);
/* Create collection from user . */
router.post('/create-collection', isLogin, isNormalUserAjax, collectionC.checkBody, collectionC.createCollection);
/* Remove collection from user . */
router.delete('/delete-collection', isLogin, isNormalUserAjax, collectionC.checkBody, collectionC.deleteCollection);


/* Activity User Profile . */
router.get('/profile/activities', isLogin, isNormalUser, profileAC.renderActivity);
router.get('/profile/get-activities', isLogin, isNormalUserAjax, profileAC.getActivities);

/* Notification User Profile . */
router.get('/profile/notifications', isLogin, isNormalUser, profileAC.renderNotification);
router.get('/profile/get-notifications', isLogin, isNormalUserAjax, profileAC.getNotifications);
router.patch('/profile/update-notification', isLogin, isNormalUserAjax, profileAC.checkBodyUpdateNotification, profileAC.updateStatusNotifications);

/* Report profile. */
router.get('/profile/reports', isLogin, isNormalUser, profileAC.renderProfileReport);
router.get('/profile/reports/get-reports', isLogin, isNormalUser, profileAC.checkQueryGetUserReport, profileAC.getUserReport);

// ---------------------------------------- END PROFILE -----------------------------------------


// ---------------------------------------- Other User's PROFILE -----------------------------------------

/* Account From User Profile  . */
router.get('/:id/accounts', viewUserAC.checkParams, viewUserAC.renderPage);
router.post('/create-report', viewUserAC.checkBodyCreateReportUser, viewUserAC.createUserReport);

/* API Get Account From User Profile . */
router.get('/:id/get-accounts', viewUserAC.checkParamGetUserAccounts, viewUserAC.getUserAccounts);

// ---------------------------------------- END Other User's PROFILE -----------------------------------------

// ---------------------------------------- CHAT -----------------------------------------

router.get('/chat', isLogin, isNormalUser, chatC.renderChatPage);

router.get('/chat/get-conversations', isLogin, isNormalUserAjax, chatC.getConversations);

router.get('/chat/get-messages', isLogin, isNormalUserAjax, chatC.checkQueryGetMessages, chatC.getMessages);

router.get('/chat/get-specific-conversation', isLogin, isNormalUserAjax, chatC.checkQueryGetSpecificConversation, chatC.getSpecificConversation);

router.patch('/chat/mark-all-read', isLogin, isNormalUserAjax, chatC.markAllRead);

router.post('/chat/report', isLogin, isNormalUserAjax, chatC.checkBodyCreateReportConversation, chatC.createReportConversation);

// ----------------------------------------  END CHAT -----------------------------------------


/* Logout . */
router.get('/logout', logoutAC.logout);



module.exports = router;
