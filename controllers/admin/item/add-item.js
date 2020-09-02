const config = require('../../../config/config');
const itemModel = require('../../../models/item');
const waterfall = require('async-waterfall');

exports.renderPage = (req, res) => {
    res.render('admin/item/add-item', {title: 'Thêm Item', account: config.account, csrfToken: req.csrfToken()});
}

exports.addNewItem = (req, res) => {
    if(typeof req.body.name === 'undefined' || req.body.slug === 'undefined'){
        res.status(400);
        res.send('Không tìm thấy tên!');
        return;
    }
    if(req.body.name === '' || req.body.slug === ''){
        res.status(400);
        res.send('Trống dữ liệu!');
        return;
    }
    waterfall([
        //  Check if name is exist 
        function(cb){
            itemModel.findOne({ name: req.body.name}, (err, item) => {
                if (err){
                    console.error('Lỗi query database: ' + err.message);
                    cb(err.message, null)
                    return
                }
                if(item !== null){
                    cb("Item đã tồn tại", null);
                    return
                }
                cb(null, null);
            });
        },
        // Check if slug is exist
        function(arg1, cb){
            itemModel.findOne({ slug: req.body.slug}, (err, item) => {
                if (err){
                    console.error('Lỗi query database: ' + err.message);
                    cb(err.message, null)
                    return
                }
                if(item !== null){
                    cb("Slug đã tồn tại", null);
                    return
                }
                cb(null, null);
            });
        },
        //  Create item
        function(arr1, cb){
            itemModel.create({name: req.body.name, slug: req.body.slug}, err => {
                if(err){ 
                    console.error('Lỗi create item database: ' + err.message);
                    cb(err.message, null)
                    return
                }
                cb(null, "Tạo item " + req.body.name + " thành công!");
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