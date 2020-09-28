var express = require('express');
var router = express.Router();

const offerC = require('../../controllers/api-service/offer');

function isLogin(req, res, next){ // if not login save current url to session then redirect to login page
    if(!req.isAuthenticated()){
        req.session.oldUrl = '/user' + req.url;
        return res.redirect('/user/login');
    }
    next();
}

function isNormalUserAjax(req, res, next){
    if(req.isAuthenticated() && req.user.status == 'normal' ){
      return next();
    }
  
    return res.status(401).send("Tài khoản không hợp lệ, xin vui lòng logout")
}

/* Accept offer . */
router.patch('/accept-offer', isLogin, isNormalUserAjax, offerC.checkBodyAcceptOffer, offerC.acceptOffer);

/* Denied offer . */
router.patch('/denied-offer', isLogin, isNormalUserAjax, offerC.checkBodyDeniedOffer, offerC.deniedOffer);

/* Cancel offer . */
router.patch('/cancel-offer', isLogin, isNormalUserAjax, offerC.checkBodyCancelOffer, offerC.cancelOffer);

module.exports = router;