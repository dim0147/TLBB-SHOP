
const { body, validationResult } = require('express-validator');

const userModel = require('../../models/user');

exports.renderPage = function(req, res){
    if(!req.isAuthenticated())
        return res.render('user/profile', {title: "Trang cá nhân", error: "Bạn chưa đăng nhập"})
    return res.render('user/profile', {title: 'Trang cá nhân', user: req.user, csrfToken: req.csrfToken()});
}

exports.checkBodyUpdateProfile = [
    body('name', 'Tên phải daì ít nhất 3 kí tự và ít hơn 20 kí tự').isString().isLength({min: 3, max: 20}),
    body('email', 'Email không hợp lệ').isString().isLength({min: 3, max: 20})
]

exports.updateProfile = function(req, res){
    console.log(req.body);
}