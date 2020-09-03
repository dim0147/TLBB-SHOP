const waterfall = require('async-waterfall');
const { body, validationResult } = require('express-validator');

const config = require('../../config/config');

const accountModel = require('../../models/account');
const phaiModel = require('../../models/phai');
const itemModel = require('../../models/item');
const itemPropertyModel = require('../../models/item_property');
const addFieldModel = require('../../models/add_field');
const accountLinkAddFieldModel = require('../../models/account-link-addfield');
const imageModel = require('../../models/image')

const helper = require('../../help/helper');
const imgur = require('imgur');

// Setup Imgur API
imgur.setAPIUrl(config.imgurDEV.API_URL);
imgur.setCredentials(config.imgurDEV.username, config.imgurDEV.password, config.imgurDEV.clientID);

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
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                cb(null, phais);
            });
        },
        function(phais, cb){
            addFieldModel.find({}, (err, addFields) => {
                if(err){
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                cb(null, phais, addFields);
            });
        },
        function(phais, addFields, cb){
            itemModel.find().lean().exec((err, items) => {
                if(err){
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
            res.render('account/add-account', {title: 'Thêm ', error: err});
            return
        }
        res.render('account/add-account', {title:"Add new account", items: result.items, phais: result.phais, addFields: result.addFields, csrfToken: req.csrfToken()});
    });
}

exports.checkBody = [
    // body('title', 'Tiêu đề không được ít hơn 5 kí tự và nhiều hơn 20 kí tự').notEmpty().isLength({min: 5, max: 20}),
    // body('c_name', 'Tên nhân vật không được ít hơn 5 kí tự và nhiều hơn 15 kí tự').notEmpty().isLength({min: 1, max: 15}),
    body('phai', 'Phái không hợp lệ').notEmpty().isMongoId(),
    body('vohon', 'Võ hồn không hợp lệ').notEmpty().isMongoId(),
    body('amkhi', 'Ám khí không hợp lệ').notEmpty().isMongoId(),
    body('dieuvan', 'Điêu văn không hợp lệ').notEmpty().isMongoId(),
    body('ngoc', 'Ngọc không hợp lệ').notEmpty().isMongoId(),
    body('thankhi', 'Thần khí không hợp lệ').notEmpty().isMongoId(),
    body('tuluyen', 'Tu luyện không hợp lệ').notEmpty().isMongoId(),
    body('doche', 'Đồ chế không hợp lệ').notEmpty().isMongoId(),
    body('longvan', 'Long văn không hợp lệ').notEmpty().isMongoId(),
    body('server', 'Server không hợp lệ').notEmpty().isMongoId(),
    body('postType', 'Hình thức không hợp lệ').notEmpty(),
    function(req, res, next) {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
];

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

function removeAccount(idAccount){
    waterfall([
        cb => { // Delete bosung fields
            accountLinkAddFieldModel.deleteMany({accountId: idAccount}, err => {
                if(err) return cb(err);
                cb(null)
            });
        },
        cb => { // Query images
            imageModel.find({account: idAccount}, (err, images) => {
                if(err) return cb(err);
                cb(null, {images: images})
            });
        },
        (result, cb) => {   // Remove image from db and storage
            if(result.images.length > 0){
                imageModel.deleteMany({account: idAccount}, err => {
                    if(err) return cb(err);
                    const listImagePath = result.images.map(image => config.pathStoreImageUpload + '/' + image.name);
                    helper.deleteManyFiles(listImagePath);
                    cb(null);
                });
            }
            else{
                cb(null);
            }
        },
        cb => {
            accountModel.findOneAndDelete({_id: idAccount}, err => {
                if(err) return cb(err);
                cb(null)
            });
        }
    ], function(err, result){
        if(err){
            console.log('Có lỗi khi remove account:');
            console.log(err);
            return
        }
        console.log('Remove account thành công:');
    })
    
}

exports.addNewAccount = async (req, res) => {
// ----------------------------- VALIDATION ----------------
    // Validate request
    const fieldsToCheck = ['title', 'c_name', 'level', 'phai', 'vohon', 'amkhi', 'dieuvan', 'ngoc', 'thankhi', 'tuluyen', 'doche', 'longvan', 'server', 'postType', 'price', 'phaigiaoluu', 'loinhan', 'contactfb', 'phone'];
    const fieldsNoCheckNull = ['price', 'phaigiaoluu', 'loinhan', 'phone'];
    if(helper.checkEmptyRequest(req.body, fieldsToCheck, fieldsNoCheckNull))
        return res.status(400).send("Xác thực yêu cầu không thành công!!!");

    // Check Level
    let level = Number(req.body.level);
    if(Number.isNaN(level) || Number(level) <= 0 || Number(level) >=120)
        return res.status(400).send("Level không hợp lệ!!!");

    //  Check title
    if(req.body.title.length > 25)
        return res.status(400).send("Tựa bài viết không được quá 20 kí tự!!!");

    // Check postType
    if(req.body.postType != 'trade' && req.body.postType != 'sell' && req.body.postType != 'all')
        return res.status(400).send("Hình thức giao dịch không hợp lệ!!!");
        // Check price is valid
        let price = Number(req.body.price);
        if(req.body.postType == 'sell' && (price == '' || Number.isNaN(price)))
            return res.status(400).send("Giá không hợp lệ!!!");
        // Check phai is valid
        if(req.body.postType == 'trade'){
            if(req.body.phaigiaoluu.length === 0) return res.status(400).send("Hãy chọn phái cần giao lưu!!!");
            let cPhaiGL = await checkPhai(req.body.phaigiaoluu);
            if(cPhaiGL.status !== 'OK') return res.status(400).send("Phái giao lưu không hợp lệ!!!");
        }
        // Check if is all, checking price and phaigiaoluu
        if(req.body.postType == 'all'){
            // Check price is valid
            if(price == '' || Number.isNaN(price))
                return res.status(400).send("Giá không hợp lệ!!!");
            // Check phai is valid
            if(req.body.phaigiaoluu.length === 0) return res.status(400).send("Hãy chọn phái cần giao lưu!!!");
            let cPhaiGL = await checkPhai(req.body.phaigiaoluu);
            if(cPhaiGL.status !== 'OK') return res.status(400).send("Phái giao lưu không hợp lệ!!!");
        }
    
    // Check image upload
    if(req.errorImage)
        return res.status(400).send("Chỉ được cho phép upload ảnh !!!");
    if(typeof req.files === 'undefined' || req.files.length < 10)
        return res.status(400).send("Xin hãy upload ảnh đúng yêu cầu !!!");
    if(req.files.length > 50)
        return res.status(400).send("Xin hãy upload dưới 50 ảnh !!!");
    

    // Check Item Property
    let arrSlug = ['vohon', 'amkhi', 'dieuvan', 'ngoc', 'thankhi', 'tuluyen', 'doche', 'longvan', 'server'];
    let cItemP = await checkItemProperty(req.body, arrSlug);
    if(cItemP.status !== 'OK')
        res.status(400).send(cItemP.message);

    // Check if have bosung field, validate it
    let listIdBosung = [];
    if(typeof req.body.bosung !== 'undefined'){
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
    if(cPhai.status !== 'OK')
        res.status(400).send(cPhai.message);
        
// ----------------------------- END VALIDATION ----------------

    // Create account
    waterfall([
        //  Create account
        cb => {
            accountModel.create({
                title: req.body.title,
                c_name: req.body.c_name,
                phai: req.body.phai,
                level: req.body.level,
                server: req.body.server,
                vohon: req.body.vohon,
                amkhi: req.body.amkhi,
                thankhi: req.body.thankhi,
                tuluyen: req.body.tuluyen,
                ngoc: req.body.ngoc,
                doche: req.body.doche,
                dieuvan: req.body.dieuvan,
                longvan: req.body.longvan,
                transaction_type: req.body.postType,
                price: req.body.price,
                phaigiaoluu: req.body.phaigiaoluu,
                status: 'pending',
                phone: req.body.phone,
                loinhan: req.body.loinhan,
                contactFB: req.body.contactfb,
                userId: req.user._id
            }, (err, newAccount) => {
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                cb(null, newAccount)
            });
        },
        // Create bosung field if have
        (newAccount, cb) => {
            if(listIdBosung.length === 0) return cb(null, newAccount);
            let listAddFields = listIdBosung.map(idBosung => {
                return {accountId: newAccount._id, fieldId: idBosung}
            });
            accountLinkAddFieldModel.create(listAddFields, err => {
                if(err){
                    err.message = 'Có lỗi xảy ra, vui lòng thử lại sau';
                    err.accountId = newAccount._id;
                    return cb(err)
                } 
                cb(null, newAccount);
            });
        },
        // Upload Image to imgur server
        // (newAccount, cb) => {
        //     let arrImages = req.files.map(image => {
        //         return image.buffer.toString('base64')
        //     });
        //     imgur.uploadAlbum(arrImages, 'Base64')
        //     .then(function(album) {
        //         cb(null, album, newAccount);
        //     })
        //     .catch(function (err) {
        //         console.error("Có lỗi khi upload ảnh lên imgur");
        //         console.error(err.message);
        //         removeAccount(newAccount);
        //         cb("Có lỗi xảy ra, không thể tải ảnh lên server, vui lòng thử lại sau");
        //     });
        // },
        
        (newAccount, cb) => {   // Save image to db
            if(req.files.length === 0){
                err.message = 'Có lỗi xảy ra, không có ảnh, vui lòng thử lại sau';
                err.accountId = newAccount._id;
                return cb(err);
            }
            let listImages = req.files.map(image => {
                return {
                    url: image.filename,
                    albumId: 'TLBB',
                    account: newAccount._id
                }
            });
            imageModel.create(listImages, err => {
                if (err){
                    err.message = 'Có lỗi xảy ra, vui lòng thử lại sau';
                    err.accountId = newAccount._id;
                    return cb(err);
                }
                cb(null, "Tạo bài đăng thành công !!!");
            });
        }
    ], function(err, result){
        if(err){
            // Check if have account id remove image and remove account from db
            if(typeof err.message === "string" && typeof err.accountId !== "undefined"){
                removeAccount(err.accountId);   //  Delete account and image from db
                if(req.files.length > 0){   // Delete image from storage
                    const listImagePath = req.files.map(image => image.path);
                    helper.deleteManyFiles(listImagePath);
                }
                return res.status(400).send(err.message)
            }else{
                return res.status(400).send(err)
            }
        } 
        res.send(result);
    })
    
}



