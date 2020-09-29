var express = require('express');
var router = express.Router();

const chatC = require('../../controllers/api-service/chat');

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

/* Create normal message . */
router.post('/create-message', isLogin, isNormalUserAjax, chatC.checkBodyCreateTextMessage, chatC.createTextMessage);

/* Tracking conversation. */
router.put('/tracking-conversation', isLogin, isNormalUserAjax, chatC.checkBodyTrackingConversation, chatC.trackingConversation);

/* Get unread conversation. */
router.get('/get-unread-conversations', chatC.getUnreadConversation);

module.exports = router;