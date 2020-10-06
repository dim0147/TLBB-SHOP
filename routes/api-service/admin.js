var express = require('express');
var router = express.Router();

const accountC = require('../../controllers/api-service/admin/account');
const userC = require('../../controllers/api-service/admin/user');
const reportC = require('../../controllers/api-service/admin/report');

function isLogin(req, res, next){ // if not login save current url to session then redirect to login page
    if(!req.isAuthenticated()){
        req.session.oldUrl = '/admin' + req.url;
        return res.redirect('/user/login');
    }
    next();
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

function isAdmin(req, res, next){
    if(req.user.role !== 'admin')
        return res.status(403).send('Admin Unauthorized')
    next();
}

function isAdminOrModerator(req, res, next){
    if(req.user.role !== 'admin' && req.user.role !== 'moderator')
        return res.status(403).send('Bạn không có quyền truy cập vào đây')
    next();
}


// --------------------------------ACCOUNT----------------------------------------
/* Get Account Last Numb Months. */
router.get('/account/get-account-last-number-months', isLogin, isNormalUserAjax, isAdminOrModerator, accountC.checkQueryGetAccountLastNumbMonth, accountC.getAccountLastNumbMonth);

/* Get Top Phai Sell Last Numb Months. */
router.get('/account/get-account-sell-last-number-months', isLogin, isNormalUserAjax, isAdminOrModerator, accountC.checkQueryGetAccountPastNumbMonths, accountC.getAccountPostedPastThreeMonths);

/* Get Total accounts. */
router.get('/account/get-total-accounts', isLogin, isNormalUserAjax, isAdminOrModerator, accountC.getTotalAccounts);

/* Get Total pending accounts. */
router.get('/account/get-total-pending-accounts', isLogin, isNormalUserAjax, isAdminOrModerator, accountC.getTotalPendingAccount);

/* Get Total done accounts. */
router.get('/account/get-total-done-accounts', isLogin, isNormalUserAjax, isAdminOrModerator, accountC.getTotalDoneAccount);

/* Get Total lock accounts. */
router.get('/account/get-total-lock-accounts', isLogin, isNormalUserAjax, isAdminOrModerator, accountC.getTotalLockAccount);


// --------------------------------USER----------------------------------------

/* Get User Register Last Numb Months. */
router.get('/user/get-user-register-last-number-months', isLogin, isNormalUserAjax, isAdminOrModerator, userC.checkQueryGetUserRegisterLastNumbMonths, userC.getUserRegisterLastNumbMonths);

/* Lock user */
router.post('/user/add-lock-reason', isLogin, isNormalUserAjax, isAdminOrModerator, userC.checkBodyLockUser, userC.lockUser);

/* UnLock user */
router.patch('/user/unlock', isLogin, isNormalUserAjax, isAdminOrModerator, userC.checkBodyUnLockUser, userC.unlockUser);

/* Get lock user reason */
router.get('/user/get-lock-reason', isLogin, isNormalUserAjax, isAdminOrModerator, userC.checkQueryGetLockUserReason, userC.getLockUserReason);

/* Make user moderator */
router.patch('/user/make-moderator', isLogin, isNormalUserAjax, isAdmin, userC.checkBodyMakeModerator, userC.makeModerator);

/* Demote user moderator */
router.patch('/user/demote-moderator', isLogin, isNormalUserAjax, isAdmin, userC.checkBodyDemoteModerator, userC.demoteModerator);

/* Get Top User Last Numb Months. */
router.get('/user/get-top-user-at-time', isLogin, isNormalUserAjax, isAdminOrModerator, userC.checkQueryGetTopUserAtTime, userC.getTopUserAtTime);


// --------------------------------REPORT----------------------------------------
/* Get Report Last Numb Months. */
router.get('/report/get-report-last-number-months', isLogin, isNormalUserAjax, isAdminOrModerator, reportC.checkQueryGetReportLastNumbMonth, reportC.getReportLastNumbMonth);




module.exports = router;