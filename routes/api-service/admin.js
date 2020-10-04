var express = require('express');
var router = express.Router();

const accountC = require('../../controllers/api-service/admin/account');
const userC = require('../../controllers/api-service/admin/user');
const reportC = require('../../controllers/api-service/admin/report');
/* Get Account Last Numb Months. */
router.get('/account/get-account-last-number-months', accountC.checkQueryGetAccountLastNumbMonth, accountC.getAccountLastNumbMonth);

/* Get User Register Last Numb Months. */
router.get('/user/get-user-register-last-number-months', userC.checkQueryGetUserRegisterLastNumbMonths, userC.getUserRegisterLastNumbMonths);

/* Get Report Last Numb Months. */
router.get('/report/get-report-last-number-months', reportC.checkQueryGetReportLastNumbMonth, reportC.getReportLastNumbMonth);

/* Get Top Phai Sell Last Numb Months. */
router.get('/account/get-account-sell-last-number-months', accountC.checkQueryGetAccountPastNumbMonths, accountC.getAccountPostedPastThreeMonths);

/* Get Top User Last Numb Months. */
router.get('/user/get-top-user-at-time', userC.checkQueryGetTopUserAtTime, userC.getTopUserAtTime);

/* Get Total accounts. */
router.get('/account/get-total-accounts', accountC.getTotalAccounts);

/* Get Total pending accounts. */
router.get('/account/get-total-pending-accounts', accountC.getTotalPendingAccount);

/* Get Total done accounts. */
router.get('/account/get-total-done-accounts', accountC.getTotalDoneAccount);

/* Get Total lock accounts. */
router.get('/account/get-total-lock-accounts', accountC.getTotalLockAccount);


module.exports = router;