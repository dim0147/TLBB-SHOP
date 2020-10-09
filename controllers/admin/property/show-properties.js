const propertyModel = require('../../../models/item_property');


exports.renderPage = (req, res) => {
    propertyModel
    .find()
    .select('name order slug')
    .populate([
        {
            path: 'itemId',
            select: 'name _id',
        },
        {
            path: 'parent',
            select: '_id name'
        }
    ])
    .sort({
        'itemId.name': 1
    })
    .lean()
    .exec((err, properties) => {
        if(err){
            console.log('Error in ctl/admin/property/show-properties.js -> renderPage 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        res.render('admin/property/show-properties', {title: 'Hiển thị property', properties, csrfToken: req.csrfToken()})
    })
}