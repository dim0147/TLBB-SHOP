const waterfall = require('async-waterfall');
const config = require('../../config/config');
const userModel = require('../../models/user');
const phaiModel = require('../../models/phai');
const itemModel = require('../../models/item');
const itemPropertyModel = require('../../models/item_property');
const addFieldModel = require('../../models/add_field');
const helper = require('../../help/helper');

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
    return items;
}

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


async function checkItemProperty(req, arrSlug){
    // Init array of promise check item and item property is exist
    arrSlug = arrSlug.map(async slug => {
        return new Promise((resolve, reject) => {
            waterfall([
                //  Check if item is exist
                function(cb){
                    itemModel.findOne({ slug: slug}, (err, item) =>{
                        if (err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                        if(item === null) return cb("Không tìm thấy item !!!");
                        cb(null, item);
                    });
                },
                //  Check if property item is exist
                function(item, cb){
                    if(typeof req[slug] === 'undefined')
                        return cb("Slug không chính xác !!!");
                    itemPropertyModel.findOne({itemId: item._id, _id: req[slug]}, (err, itemP) => {
                        if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                        if(itemP === null) cb("Không tìm thấy item property !!!");
                        cb(null, "Xác thực thành công")
                    });
                }
            ], function(err, result){
                if(err) return reject(err);
                resolve(result);
            });
            
        });
    });
    // -----------------------------Promise all call an array of promise that init above
    let result = await Promise.all(arrSlug)
    .then(val => {
        return {
            status: 'OK',
            message: 'Xác thực thành công'
        }
    })
    .catch(err => {
        return {
            status: 'ERROR',
            message: err
        }
    })
    return result;
}

async function checkBosung(listIdBosung){
let result = await new Promise((resolve, reject) => {
    addFieldModel.find({_id: {$in: listIdBosung}}, (err, addFields) => {
        if(err)
            reject("Có lỗi xảy ra vui lòng thử lại sau")
        if(addFields.length === 0)
            reject("Không tìm thấy bổ sung !!!")
        if(addFields.length !== listIdBosung.length)
            reject("Có trùng lập trong truy vấn")
        resolve("Xác thực thành công");
    });
}).then(val => {return {status: "OK", message: "Xác thực thành công"} } )
.catch(err => {return {status: "ERROR", message: err}});
return result;
}

async function checkPhai(idPhai){
let result = await new Promise((resolve, reject) =>{
    phaiModel.findById(idPhai, (err, phai) => {
        if(err) reject(err);
        if(phai === null) reject("Không tìm thấy phái!!");
        resolve("Xác thực phái thành công!");
    });
}).then(val => {return {status:'OK', message: val}})
.catch(err => {return {status:'ERROR', message: err}});
return result;
}

exports.addNewAccount = async (req, res) => {
    console.log(req.body);
    console.log(req.files);
    ;
    // Validate request
    const fieldsToCheck = ['title', 'c_name', 'level', 'phai', 'vohon', 'amkhi', 'dieuvan', 'ngoc', 'thankhi', 'tuluyen', 'doche', 'longvan', 'server', 'postType', 'price', 'phaigiaoluu', 'loinhan', 'contactfb', 'phone'];
    const fieldsNoCheckNull = ['price', 'phaigiaoluu', 'loinhan', 'phone'];
    if(helper.checkEmptyRequest(req.body, fieldsToCheck, fieldsNoCheckNull))
        return res.status(400).send("Xác thực yêu cầu không thành công!!!");

    // Check Level
    let level = Number(req.body.level);
    if(Number.isNaN(level) || Number(level) <= 0 || Number(level) >=120)
        return res.status(400).send("Level không hợp lệ!!!");

    // Check Sell Or Trade
    if(req.body.postType != 'giaoluu' && req.body.postType != 'ban')
        return res.status(400).send("Hình thức giao dịch không hợp lệ!!!");
        // Check price is valid
        let price = Number(req.body.price);
        if(req.body.postType == 'ban' && (price == '' || Number.isNaN(price)))
            return res.status(400).send("Giá không hợp lệ!!!");
        // Check phai is valid
        if(req.body.postType == 'giaoluu'){
            if(req.body.phaigiaoluu.length === 0) return res.status(400).send("Hãy chọn phái cần giao lưu!!!");
            let cPhaiGL = await checkPhai(req.body.phaigiaoluu);
            if(cPhaiGL.status !== 'OK') return res.status(400).send("Phái giao lưu không hợp lệ!!!");
        }
    
    // Check image upload
    if(typeof req.files === 'undefined' || req.files.length < 10)
        return res.status(400).send("Xin hãy upload ảnh đúng yêu cầu !!!");

    // Check Item Property
    let arrSlug = ['vohon', 'amkhi', 'dieuvan', 'ngoc', 'thankhi', 'tuluyen', 'doche', 'longvan', 'server'];
    let cItemP = await checkItemProperty(req.body, arrSlug);
    if(cItemP.status !== 'OK')
        res.status(400).send(cItemP.message);

    // Check if have bosung field, validate it
    if(typeof req.body.bosung !== 'undefined'){
        let listIdBosung = [];
        if(typeof req.body.bosung === 'string')
            listIdBosung.push(req.body.bosung)
        else if (typeof req.body.bosung === 'object' && req.body.bosung.length > 0)
            listIdBosung = req.body.bosung;
        else
            return res.status(400).send("Xác thực lỗi!!!");
        let result = await checkBosung(listIdBosung);
        if(result.status !== 'OK')
            return res.status(400).send(result.message);
    }

    // Check phai
    let cPhai = await checkPhai(req.body.phai);
    if(cPhai.status === 'OK')
        res.send(cPhai.message);
    else
        res.status(400).send(cPhai.message);
    
}



