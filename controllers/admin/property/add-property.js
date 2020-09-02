const config = require('../../../config/config');
const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');
const waterfall = require('async-waterfall');

exports.renderPage = (req, res) => {
    itemModel.find({}, (err, items) => {
        if(err){
            console.error("Có lỗi khi query db");
            res.status(500).send("Có lỗi xảy ra, xin vui lòng thử lại sau");
            return
        }
        res.render('admin/property/add-property', {title: 'Thêm Property', items: items, csrfToken: req.csrfToken()});
    })
}

exports.addNewProperty = (req, res) => {
    if(typeof req.body.name === 'undefined' || typeof req.body.idItem === 'undefined'){
        res.status(400).send("Thiếu dữ liệu!");
        return
    }
    if(req.body.name.length === 0 || req.body.idItem.length === 0){
        res.status(400).send("Thiếu dữ liệu !");
        return
    }
    let idItem = req.body.idItem;
    let nameProperty = req.body.name;
    waterfall([
        //  Find item by id, check if item exist
        function(cb){
            itemModel.findById(idItem, (err, item) => {
                if(err){
                    console.error(err);
                    cb("Có lỗi xảy ra xin vui lòng thử lại sau", null);
                    return
                }
                if(item === null){
                    cb("Không tìm thấy item!", null);
                    return
                }
                cb(null, item);
            });
        },
        //  Find property if exist 
        function(item, cb){
            itemPropertyModel.findOne({itemId: item._id, name: nameProperty}, (err, property) => {
                if(err){
                    console.error(err);
                    cb("Có lỗi xảy ra xin vui lòng thử lại sau", null);
                    return
                }
                if(property !== null){
                    cb("Item " + item.name + " đã tồn tại property '" + nameProperty + "'!!", null);
                    return
                }
                cb(null, item);
            });
        },
        // Create new Property
        function(item, cb){
            itemPropertyModel.create({
                name: nameProperty,
                itemId: item._id
            }, err => {
                if(err){
                    console.error(err);
                    cb("Có lỗi xảy ra, vui lòng thử lại sau", null);
                    return
                }
                cb(null, "Tạo property '"+ nameProperty +"' cho item '" + item.name + "' thành công!");
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