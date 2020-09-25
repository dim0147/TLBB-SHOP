
const helper = require('../../help/helper');

exports.getUnreadNotifications = (req, res) => {
    helper.getUnreadNotifications(req.user._id)
    .then(count => {
        res.send({OK: true, count: count})
    })
    .catch(err => {
        res.status(400).send({OK: false, error: 'Có lỗi xảy ra vui lòng thử lại sau'})
    })
}