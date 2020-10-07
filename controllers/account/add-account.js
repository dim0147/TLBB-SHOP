const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const imgur = require('imgur');

const config = require('../../config/config');
const helper = require('../../help/helper');
const cache = require('../../cache/cache');

const accountModel = require('../../models/account');
const phaiModel = require('../../models/phai');
const itemModel = require('../../models/item');
const addFieldModel = require('../../models/add_field');
const accountLinkAddFieldModel = require('../../models/account-link-addfield');
const imageModel = require('../../models/image');

// Setup Imgur API
imgur.setAPIUrl(config.imgurDEV.API_URL);
imgur.setCredentials(config.imgurDEV.username, config.imgurDEV.password, config.imgurDEV.clientID);


exports.renderAddAccount = (req, res) => {
    waterfall([
        function(cb){   // Query phai
            phaiModel.find({}, (err, phais) => {
                if(err){
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                cb(null, phais);
            });
        },
        function(phais, cb){    // Query bo sung fields
            addFieldModel.find({}, (err, addFields) => {
                if(err){
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                cb(null, phais, addFields);
            });
        },
        function(phais, addFields, cb){ // Query items
            itemModel.aggregate(
            [
                {
                    $lookup:{
                        from: 'item-properties',
                        let: {idItem: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$itemId', '$$idItem']
                                    },
                                    parent: null
                                }
                            },
                            {
                                $lookup:{
                                    from: 'item-properties',
                                    localField: '_id',
                                    foreignField: 'parent',
                                    as: 'sub_properties'
                                }
                            },
                            {
                                $sort: {order: 1}
                            }
                        ],
                        as: 'detail'
                    } 
                }
            ], function(err, items){
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                let result = {
                    items: items,
                    phais: phais,
                    addFields: addFields
                };
                cb(null, result);
            })
        },
    ], function(err, result){
        if(err){
            res.render('account/add-account', {title: 'Thêm tài khoản', error: err});
            return
        }
        res.render('account/add-account', {title: "Thêm tài khoản", items: result.items, phais: result.phais, addFields: result.addFields, csrfToken: req.csrfToken()});
    });
}

exports.checkBody = [
    body('title', 'Tiêu đề không được ít hơn 5 kí tự và nhiều hơn 80 kí tự').isLength({min: 5, max: 80}),
    body('c_name', 'Tên nhân vật không được ít hơn 5 kí tự và nhiều hơn 20 kí tự').isLength({min: 1, max: 20}),
    body('level', 'Level không hợp lệ').isInt({min: 1, max: 119}),
    body('phai', 'Phái không hợp lệ!!!').isMongoId(),
    body('vohon', 'Võ hồn không hợp lệ').isMongoId(),
    body('amkhi', 'Ám khí không hợp lệ').isMongoId(),
    body('dieuvan', 'Điêu văn không hợp lệ').isMongoId(),
    body('ngoc', 'Ngọc không hợp lệ').isMongoId(),
    body('thankhi', 'Thần khí không hợp lệ').isMongoId(),
    body('tuluyen', 'Tu luyện không hợp lệ').isMongoId(),
    body('doche', 'Đồ chế không hợp lệ').isMongoId(),
    body('longvan', 'Long văn không hợp lệ').isMongoId(),
    body('server', 'Server không hợp lệ').isMongoId(),
    body('sub_server', 'Server không hợp lệ').isMongoId(),
    body('postType', 'Hình thức không hợp lệ').notEmpty().custom(value => {
        const allowString = config.account.transaction_type;
        if(!allowString.includes(value)){
            return false;
        }
        return true;
    }),
    body('contactFB', 'Link facebook không hợp lệ').isURL(),
    function(req, res, next) {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return sendError(errors.array()[0].msg, req, res);
        }
            
        next();
    }
];

function filterAllowField(bodyRequest){
    //  Setup field update
    const speField = ['bosung'];
    const slugItem = helper.getSlugItem(cache.getKey('menuView'));
    const allowField = config.account.allowField.concat(speField, slugItem);

    //  Remove non-field
    for(let field in bodyRequest){
        if(!allowField.includes(field))
            delete bodyRequest[field];
    }

    return bodyRequest;
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


function sendError(message, req, res){
    // Delete storage image
    if(typeof req.files !== 'undefined' && req.files.length > 0){
        const listImgPath = req.files.map(image => image.path);
        helper.deleteManyFiles(listImgPath);
    }
    res.status(400).send(message);
}

exports.addNewAccount = async (req, res) => {

// ----------------------------- VALIDATION ----------------

    //  Check if login
    if(!req.isAuthenticated())
        return sendError("Xin hãy đăng nhập trước!", req, res);

    // Filter get specific field only
    req.body = filterAllowField(req.body);

    // Check postType
    if(req.body.postType == 'sell'){
        if(typeof req.body.price === 'undefined' || isNaN(req.body.price))
            return sendError("Giá không hợp lệ", req, res)
        delete req.body.phaigiaoluu;
    }
    else if(req.body.postType == 'trade'){
        if(typeof req.body.phaigiaoluu === 'undefined' || !mongoose.Types.ObjectId.isValid(req.body.phaigiaoluu))
            return sendError("Phái giao lưu không hợp lệ", req, res)
        delete req.body.price;
    }
    else if(req.body.postType == 'all'){
        if(typeof req.body.price === 'undefined' || isNaN(req.body.price))
            return sendError("Giá không hợp lệ", req, res)
        if(typeof req.body.phaigiaoluu === 'undefined' || !mongoose.Types.ObjectId.isValid(req.body.phaigiaoluu))
            return sendError("Phái giao lưu không hợp lệ", req, res)
    }
    else{
        return sendError("postType không hợp lệ", req, res)
    }
    req.body.transaction_type = req.body.postType;
    delete req.body.postType;
    
    // Check image upload
    if(typeof req.files === 'undefined' || req.files.length < 10)
        return sendError("Xin hãy upload ảnh đúng yêu cầu !!!", req, res);
    if(req.files.length > 50)
        return sendError("Xin hãy upload dưới 50 ảnh !!!", req, res);
    

    // Check if have bosung field, validate it
    let listIdBosung = [];
    if(typeof req.body.bosung !== 'undefined'){
        if(typeof req.body.bosung === 'string')
            listIdBosung.push(req.body.bosung)
        else if (typeof req.body.bosung === 'object' && req.body.bosung.length > 0)
            listIdBosung = req.body.bosung;
        else
            return sendError("Xác thực lỗi!!!", req, res);
        let result = await checkBosung(listIdBosung);
        if(result.status !== 'OK')
            return sendError(result.message);
        delete req.body.bosung;
    }

    // Add user 
    req.body.userId = req.user._id;
        
// ----------------------------- END VALIDATION ----------------

    const session = await mongoose.startSession();
    session.startTransaction();

    waterfall([
        //  Create account
        cb => {
            accountModel.create([req.body], {session: session}, (err, newAccount) => {
                if(err){
                    if(err.isPreSave) return cb(err.message);
                    else{
                        console.log('Error in CTL/account/add-account.js -> addNewAccount 01 ' + err);
                        return cb("Có lỗi xảy ra, vui lòng thử lại sau")
                    }
                }
                cb(null, newAccount[0])
            });
        },
        // Create bosung field if have
        (newAccount, cb) => {
            if(listIdBosung.length === 0) return cb(null, newAccount);
            let listAddFields = listIdBosung.map(idBosung => {
                return {accountId: newAccount._id, fieldId: idBosung}
            });
            accountLinkAddFieldModel.create(listAddFields, {session: session} ,err => {
                if(err){
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau')
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
                return cb('Có lỗi xảy ra, không có ảnh, vui lòng thử lại sau');
            }
            let listImages = req.files.map(image => {
                return {
                    url: image.filename,
                    albumId: 'TLBB',
                    account: newAccount._id
                }
            });
            imageModel.create(listImages, {session: session} ,err => {
                if (err){
                    return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                }
                // Create activity
                helper.createActivity({
                    type: 'add-new-account',
                    account: newAccount._id,
                    owner: req.user._id
                });
                cb(null, "Tạo bài đăng thành công !!!");
            });
        }
    ], async function(err, result){
        if(err){
            await session.abortTransaction();
            session.endSession();
            return sendError(err, req, res);
        };
        session.commitTransaction();
        res.send(result);
    });
    
}



