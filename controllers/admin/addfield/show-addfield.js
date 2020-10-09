const dateFormat = require('dateformat');

const addFieldModel = require('../../../models/add_field');

exports.renderPage = (req, res) => {
    addFieldModel.aggregate([
        {
            $lookup: {
                from: 'account-link-addfields',
                localField: '_id',
                foreignField: 'fieldId', 
                as: 'accounts'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                createdAt: 1,
                updatedAt: 1,
                totalAccount: { $size: '$accounts'}
            }
        }
    ], function(err, result){
        if(err) return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        console.log(result);
        res.render('admin/addfield/show-addfield', {title: 'Hiển thị bổ sung', dateFormat, addFields: result, csrfToken: req.csrfToken()})
    })
}