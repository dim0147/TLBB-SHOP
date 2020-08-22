const config = require('../../../config/config');
const phaiModel = require('../../../models/phai');
const waterfall = require('async-waterfall');

exports.renderPage = (req, res) => {
    res.render('admin/phai/add-phai', {title: 'Thêm Phái'});
}

exports.addNewPhai = (req, res) => {
    if(typeof req.body.name === 'undefined'){
        res.status(400).send('Thiếu dữ liệu!');
        return
    }
    if(req.body.name.length === 0){
        res.status(400).send('Thiếu dữ liệu!');
        return
    }
    let namePhai = req.body.name;

    waterfall([
        // Check if phái exist
        function(cb){
            phaiModel.findOne({name: namePhai}, (err, phai) => {
                if(err){
                    console.log(err);
                    cb("Có lỗi vui lòng thử lại sau", null);
                    return
                }
                if(phai !== null){
                    cb("Phái " + namePhai + " đã tồn tại!");
                    return
                }
                cb(null, null);
            });
        },
        // Create new phái
        function(arg1, cb){
            phaiModel.create({name: namePhai}, err => {
                if(err){ 
                    console.log(err);
                    cb("Có lỗi vui lòng thử lại sau", null);
                    return
                }
                cb(null, "Tạo phái '" + namePhai + "' thành công!");
            });
        }
    ], function(err, result){
        if(err){
            res.status(400).send(err);
            return
        }
        res.send(result);
    });
}
