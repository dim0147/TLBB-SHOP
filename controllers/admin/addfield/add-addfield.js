const config = require('../../../config/config');
const addFieldModel = require('../../../models/add_field');
const waterfall = require('async-waterfall');

exports.renderPage = (req, res) => {
    res.render('admin/addfield/add-addfield', {title: 'Thêm Item', csrfToken: req.csrfToken()});
}

exports.addNewAdditionField = (req, res) => {
    if(typeof req.body.name === 'undefined'){
        res.status(400);
        res.send('Không tìm thấy tên!');
        return;
    }
    if(req.body.name === ''){
        res.status(400);
        res.send('Tên để trống!');
        return;
    }
    waterfall([
        //  Check if exist 
        function(cb){
            addFieldModel.findOne({ name: req.body.name}, (err, addField) => {
                if (err){
                    console.error('Lỗi query database: ' + err.message);
                    cb(err.message, null)
                    return
                }
                if(addField !== null){
                    cb("Bổ sung này đã tồn tại", null);
                    return
                }
                cb(null, null);
            });
        },
        //  Create Additional
        function(arr1, cb){
            addFieldModel.create({name: req.body.name}, err => {
                if(err){ 
                    console.error('Lỗi create Additional database: ' + err.message);
                    cb(err.message, null)
                    return
                }
                cb(null, "Tạo bổ sung " + req.body.name + " thành công!");
            })
        }
    ], function(err, result){
        if(err){
            res.status(400);
            res.send(err);
            return
        }
        res.send(result);
    });
}
