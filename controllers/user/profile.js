

const userModel = require('../../models/user');

exports.renderPage = function(req, res){
    if(!req.isAuthenticated())
        return res.render('user/profile', {title: "Trang cá nhân", error: "Bạn chưa đăng nhập"})
    return res.render('user/profile', {title: 'Trang cá nhân', user: req.user, csrfToken: req.csrfToken()});
}