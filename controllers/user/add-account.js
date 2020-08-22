const config = require('../../config/config');
const userModel = require('../../models/user');
const phaiModel = require('../../models/phai');
const itemModel = require('../../models/item');
const itemPropertyModel = require('../../models/item_property');
const addFieldModel = require('../../models/add_field');
const waterfall = require('async-waterfall');

exports.renderAddAccount = (req, res) => {
    waterfall([
        function(cb){
            phaiModel.find({}, (err, phais) => {
                if(err){
                    console.log(err);
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                cb(null, phais);
            });
        },
        function(phais, cb){
            addFieldModel.find({}, (err, addFields) => {
                if(err){
                    console.log(err);
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                cb(null, phais, addFields);
            });
        },
        function(phais, addFields, cb){
            itemModel.find().lean().exec((err, items) => {
                if(err){
                    console.log(err);
                    cb("Có lỗi xảy ra vui lòng thử lại sau!!!");
                    return
                }
                if(items.length <= 0){
                    cb("Không tìm thấy thông tin!!!");
                    return
                }    
                cb(null, items, phais, addFields);
            });
        },
        function(items, phais, addFields, cb){
            let listIdItems = [];
            items.forEach(item => listIdItems.push(item._id));
            itemPropertyModel.find({itemId: {$in: listIdItems}}).lean().sort({'_id': 1}).exec((err, itemsProperty) => {
                items = sortItemProperty(items, itemsProperty);
                let obj = {
                    items: items,
                    phais: phais,
                    addFields: addFields
                };
                cb(null, obj);
            });
        }
    ], function(err, result){
        if(err){
            res.status(400).send(err);
            return
        }
        res.render('user/add-account', {title:"Add new account", account: config.account, items: result.items, phais: result.phais, addFields: result.addFields});
    });
}

function sortItemProperty(items, itemProperty){
    // Init detail property is array
    items.forEach(item => {
        if(!item.hasOwnProperty('detail')){
            item.detail = [];
        }
    });

    // Implement sort
    for(let i = 0; i < itemProperty.length; i++){
        let itemP = itemProperty[i];
        for(let j = 0; j < items.length; j++){
            item = items[j];
            if(itemP.itemId.toString() === item._id.toString()){
                items[j].detail.push(itemP);
                break;
            }
        }
    }
    

    // let account = {
    //     server: ['Tình Kiếm', 'Tình Kiếm 2'],
    //     phai: ['Thiếu Lâm', 'Minh Giáo', 'Cái Bang', 'Võ Đang', 'Nga My', 'Tỉnh Túc', 'Thiên Long', 'Thiên Sơn', 'Tiêu Dao', 'Mộ Dung'],
    //     vohon: ['Chưa có', 'Sơ Cấp', 'Xuất Sắc', 'Kiệt Xuất', 'Trác Việt', 'Toàn Mỹ'],
    //     amkhi: ['Chưa có', 'Sơ Cấp', 'Xuất Sắc', 'Kiệt Xuất', 'Trác Việt', 'Toàn Mỹ'],
    //     thankhi: ['Chưa Có', '105', '119', '119 Giảm Tốc', '119 (1 Thuộc Tính)', '119 (2 Thuộc Tính)', '119 (3 Thuộc Tính)', '119 (4 Thuộc Tính)'],
    //     tuluyen: ['Chưa có', 'Thấp', 'Bình Thường', 'Cao'],
    //     ngoc: ['Full 5', 'Full 5 + 6', 'Full 6', 'Full 6 + 7', 'Full 7'],
    //     doche: ['Chưa có', 'Bình thường', 'Chuẩn', 'Boss'],
    //     dieuvan: ['Chưa có', 'Full 5', 'Full 5 + 6', 'Full 6', 'Full 6 + 7', 'Full 7'],
    //     longvan: ['Chưa có', 'Bình thường', 'Cấp 80'],
    //     bosung: ['Dư nhiều ngọc', 'Có pet boss', 'Có 2 set đồ', 'Có nhiều thần khí', 'Còn điểm tặng'],
    //     type: ['Bán', 'Giao lưu']
    // }

    // let itemss = {
    //     server: ['Tình Kiếm', 'Tình Kiếm 2'],
    //     phai: [],
    //     vohon: [],
    //     amkhi: [],
    //     thankhi: [],
    //     tuluyen: [],
    //     ngoc: [],
    //     doche: [],
    //     dieuvan: [],
    //     longvan: [],
    //     bosung: [],
    //     type: ['Bán', 'Giao lưu']
    // }

    return items;
}

exports.addNewAccount = (req, res) => {
    console.log(req.body);
    console.log(req.files);
    res.send("OK");
}