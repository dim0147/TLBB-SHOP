const passport = require('passport');
const { body, validationResult } = require('express-validator');

const config = require('../../config/config');

exports.renderPage = (req, res) => {
    const oldUrl = req.session.oldUrl ? config.urlWebsite + req.session.oldUrl : null;
    res.render('user/register', {title: 'Đăng Kí Tài Khoản', oldUrl: oldUrl, csrfToken: req.csrfToken()});
}

exports.validateUser = [
    body('username', 'Username phải có ít nhất 3 kí tự').isLength({min: 3}),
    body('password', 'Mật khẩu phải có ít nhất 3 kí tự').isLength({min: 3}),
    body('cfPassword').custom((value,{req, loc, path}) => {
        if (value !== req.body.password) {
            throw new Error("Xác nhận mật khẩu không chính xác");
        } else {
            return value;
        }
    }),
    body('name', 'Tên phải có ít nhất 3 kí tự').isLength({min: 3}),
    body('email', 'Email không chính xác').isEmail(),
    body('phone', 'Số điện thoại không hợp lệ').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty())
          return res.status(400).send(errors.array()[0].msg);
        next();
    },
]

exports.registerAccount = function(req, res, next) {
    passport.authenticate('local.register', function(err, user, message) {
      if (err) { return next(err) }
      if (!user) {
        return res.status(400).send(message)
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return next();
      });
    })(req, res, next);
}
