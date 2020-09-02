const passport = require('passport');
const { body, validationResult } = require('express-validator');

exports.renderPage = (req, res) => {
    if(req.isAuthenticated())
      return res.send("You login already");
    res.render('user/register', {title: 'Đăng Kí Tài Khoản', csrfToken: req.csrfToken()});
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
        return res.send("Đăng kí thành công!!!")
      });
    })(req, res, next);
}
