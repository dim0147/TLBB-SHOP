const passport = require('passport');
const config = require('../../config/config')

const { body, validationResult } = require('express-validator');

exports.renderPage = (req, res) => {
    const oldUrl = req.session.oldUrl ? config.urlWebsite + req.session.oldUrl : null;
    res.render('user/login', {title: 'Đăng Nhập', oldUrl: oldUrl, csrfToken: req.csrfToken()});
}

exports.validateUser = [
    body('username', 'Username phải có ít nhất 3 kí tự').isLength({min: 3}),
    body('password', 'Mật khẩu phải có ít nhất 3 kí tự').isLength({min: 3}),
    body('remember_me', 'Thiếu trường remember').notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
          return res.status(400).send(errors.array()[0].msg);
        next();
    },
]

exports.addNewAccount = function(req, res, next) {
    passport.authenticate('local.login', function(err, user, message) {
      if (err) { return next(err) }
      if (!user) {
        return res.status(400).send(message)
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        next()
      });
    })(req, res, next);
}

exports.rememberMeTokenCheck = (req, res, next) => {
    // issue a remember me cookie if the option was checked
    if (req.body.remember_me == 'false') 
        req.session.cookie.expires = false;
    return next();
}

exports.callbackAuthenticateFB = function(req, res, next){
  passport.authenticate('facebook', function(err, user, message) {
    if(err){
      console.log('Error in controller/user/login.js -> callbackAuthenticateFB 01 ' + err);
      return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
    }
    if (!user) {
      return res.status(400).send(message)
    }
    req.logIn(user, function(err) {
      if (err) {
        console.log('Error in controller/user/login.js -> callbackAuthenticateFB 02 ' + err);
        return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau') 
      }
      res.render('user/login-success');
    });
  })(req, res, next);
}

exports.callbackAuthenticateGG = function(req, res, next){
  passport.authenticate('google', function(err, user, message) {
    if(err){
      console.log('Error in controller/user/login.js -> callbackAuthenticateGG 01 ' + err);
      return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
    }
    if (!user) {
      return res.status(400).send(message)
    }
    req.logIn(user, function(err) {
      if (err) {
        console.log('Error in controller/user/login.js -> callbackAuthenticateGG 02 ' + err);
        return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau') 
      }
      res.render('user/login-success');
    });
  })(req, res, next);
}