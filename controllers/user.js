const config = require('../config/config');

exports.renderAddAccount = (req, res) => {
    res.render('user/add-account', {title: 'Bán Tài Khoản', account: config.account});
}

exports.addNewAccount = (req, res) => {
    console.log(req.body);
    console.log(req.files);
    res.send("OK");
}