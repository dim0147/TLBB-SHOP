const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const {body, validationResult} = require('express-validator');

const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');

exports.renderPage = (req, res) => {
    if(typeof req.params.idItem === 'undefined' || !mongoose.Types.ObjectId.isValid(req.params.idItem))
        return res.render('admin/property/add-sub-property', {title: 'Thêm sub property', error: 'Id không hợp lệ'});

    waterfall([
        (cb) => { // Find item by id
            itemModel.findById(req.params.idItem, (err, item) => {
                if(err){
                    console.log('Có lỗi khi get item, source: CTL/admin/property/add-sub-property -> renderPage1' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(item === null)
                    return cb("Không tìm thấy item");
                cb(null, {item: item});
            });
        },
        (result, cb) => { // Find property of item
            itemPropertyModel.find({itemId: result.item._id, parent: null}, (err, properties) => {
                if(err){
                    console.log('Có lỗi khi get item property, source: CTL/admin/property/add-sub-property -> renderPage2' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(properties.length === 0)
                    return cb('Item ' + result.item.name + ' chưa có property nào');
                result.properties = properties;
                return cb(null, result);
            });
        }
    ], function(err, result){
        console.log(err);
        if(err) return res.render('admin/property/add-sub-property', {title: 'Thêm sub property', error: err})
        res.render('admin/property/add-sub-property', {title: 'Thêm sub property', item: result.item, properties: result.properties, csrfToken: req.csrfToken()});
    });
}

exports.checkBodyAddNewSubP = [
    body('name', 'Tên phải dài ít nhất 3 kí tự').isLength({min: 3}),
    body('idProperty', 'Id Property không hợp lệ').isMongoId(),
    body('idItem', 'Id item không hợp lệ').isMongoId(),
    function(req, res, next) {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.addNewSubProperty = (req, res) => {
    if(!req.isAuthenticated())
        return res.status(401).send('Unauthorized');
    
    waterfall([
        (cb) => { // Find item by id
            itemPropertyModel.findOne({
                _id: req.body.idProperty, 
                itemId: req.body.idItem
            }, (err, property) => {
                if(err){
                    console.log('Có lỗi khi get property, source: CTL/admin/property/add-sub-property -> addNewSubProperty1' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(property === null)
                    return cb("Không tìm thấy property");
                if(typeof property.slug === 'undefined' || property.slug === null || property.slug.length === 0)
                    return cb("Hãy thêm slug cho property " + property.name + ' eg:sub_server');
                cb(null, {property: property});
            });
        },
        (result, cb) => { // Check if sub property is exist
            itemPropertyModel.findOne({
                name: req.body.name,
                itemId: result.property.itemId,
                parent: result.property._id
            }).exec((err, property) => {
                if(err){
                    console.log('Có lỗi khi tìm sub property, source: CTL/admin/property/add-sub-property -> addNewSubProperty2' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                if(property !== null)
                    return cb("Sub property đã tồn tại");
                cb(null, result);
            });
        },
        function(result, cb){
            itemPropertyModel
            .findOne({itemId: result.property.itemId})
            .sort({order: -1})
            .exec((err, property) => {
                if(err){
                    console.error(err);
                    cb("Có lỗi xảy ra xin vui lòng thử lại sau", null);
                    return
                }
                // Check if order number of property is exist then + 1 that order number is 
                const orderNumber = property && property.order ? property.order + 1 : 1;
                result.orderNumber = orderNumber;
                cb(null, result);
            })
        },
        (result, cb) => { // Create sub property
            const payload = new itemPropertyModel({
                name: req.body.name,
                itemId: result.property.itemId,
                parent: result.property._id,
                order: result.orderNumber
            });
            payload.save(err => {
                if(err){
                    console.log('Có lỗi khi create sub property, source: CTL/admin/property/add-sub-property -> addNewSubProperty3' + err);
                    return cb("Có lỗi xảy ra , vui lòng thử lại sau");
                }
                cb(null, "Tạo thành công")
            });
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.send(result);
    });
}