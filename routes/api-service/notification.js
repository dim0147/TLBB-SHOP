var express = require('express');
var router = express.Router();

const notificationC = require('../../controllers/api-service/notification');

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

/* User Profile . */
router.get('/get-unread-notifications', isLogin, isNormalUserAjax, notificationC.getUnreadNotifications);

module.exports = router;