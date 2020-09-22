const waterfall = require('async-waterfall');
const { param, body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const config = require('../../config/config');
const helper = require('../../help/helper');

const accountModel = require('../../models/account');
const phaiModel = require('../../models/phai');
const itemModel = require('../../models/item');
const addFieldModel = require('../../models/add_field');
const accountLinkAddFieldModel = require('../../models/account-link-addfield');
const imageModel = require('../../models/image');

exports.checkParamRenderPage = [
    param('id', 'Id không hợp lệ').notEmpty().isMongoId(),
    (req, res, next) =>{
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.render('account/edit-account', {title: 'Chỉnh sửa tài khoản', error: errors.array()[0].msg});
        next();
    }
]

exports.renderPage = (req, res) => {
    if(!req.isAuthenticated())
        return res.render('account/edit-account', {title: 'Chỉnh sửa tài khoản', error: 'Bạn chưa đăng nhập'});

    waterfall([
        function(cb){   // Query account and check if correct user to edit
            accountModel.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(req.params.id)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $lookup: {
                        from: 'account-link-addfields',
                        localField: '_id',
                        foreignField: 'accountId',
                        as: 'bosung'
                    }
                },
                {
                    $lookup: {
                        from: 'images',
                        localField: '_id',
                        foreignField: 'account',
                        as: 'images'
                    }
                }
            ], function(err, accounts){
                if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                if(accounts.length === 0) return cb("Không tìm thấy tài khoản")
                if(accounts[0].user[0].length === 0) return cb("Không tìm thấy user")
                if(accounts[0].user[0]._id.toString() != req.user._id) return cb('Bạn không có quyền chỉnh sửa tài khoản này');
                if(accounts[0].status.toString() != 'pending') return cb('Tài khoản này không thể chỉnh sửa');
                cb(null, {account: accounts[0]})
            })
        },
        function(result, cb){   // Query phai
            phaiModel.find({}, (err, phais) => {
                if(err){
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                result.phais = phais;
                cb(null, result);
            });
        },
        function(result, cb){    // Query bo sung fields
            addFieldModel.find({}, (err, addFields) => {
                if(err){
                    cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    return
                }
                result.addFields = addFields
                cb(null, result);
            });
        },
        function(result, cb){ // Query items

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
                            }
                        ],
                        as: 'detail'
                    } 
                }
            ], function(err, items){
                if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                result.items = items;
                cb(null, result);
            })
        }
    ], function(err, result){
        if(err){
            res.render('account/edit-account', {title: 'Chỉnh sưa tài khoản ', error: err});
            return
        }
        res.render('account/edit-account', {title:"Chỉnh sưa tài khoản", account:result.account, items: result.items, phais: result.phais, addFields: result.addFields, csrfToken: req.csrfToken()});
    });
}

function filterAllowField(bodyRequest){
        //  Setup field update
        const speField = ['idAccount', 'bosung', 'listImgDel', 'listBosungAdd', 'listBosungDel', 'listImgDel'];
        const slugItem = helper.getSlugItem();
        const allowField = config.account.allowField.concat(speField, slugItem);

        //  Remove non-field
        for(let field in bodyRequest){
            if(!allowField.includes(field))
                delete bodyRequest[field];
        }

        return bodyRequest;
}

function checkEmptyField(bodyRequest){
    //  Setup field not check null
    const fieldNoCheckNull = ['listBosungAdd', 'listBosungDel', 'listImgDel'];

    // Check null, and check if not is a string or number return false;
    for(let field in bodyRequest){
        if(!fieldNoCheckNull.includes(field) && typeof bodyRequest[field] !== 'string' && typeof bodyRequest[field] !== 'number')
            return true;
        if (!fieldNoCheckNull.includes(field) && typeof bodyRequest[field] === 'string' && bodyRequest[field].length === 0)
            return true;
    }

    return false;
}

function checkUserAccount(idAccount, userId){
    return new Promise((resolve, reject) => {
        // Check if is mongo id
        if(!mongoose.Types.ObjectId.isValid(idAccount))
            return reject(new Error("Id account không hợp lệ"));

        // Query account
        accountModel.findById(idAccount).exec((err, account) => {
            if(err) return reject(new Error('Có lỗi xảy ra vui lòng thử lại sau'));
            if(account === null) return reject(new Error("Tài khoản không tìm thấy"));
            if(account.userId.toString() != userId) return reject(new Error("Bạn không thể chỉnh sửa tài khoản ày!"));
            if(account.status.toString() != 'pending') return reject(new Error("Tài khoản này không thể chỉnh sửa"));
            resolve();
        });
    });
}

function addBosungField(idAccount, listBosung, session){

    return new Promise((resolve, reject) => {

        // Check if valid id
        for(let i = 0; i < listBosung.length; i++){
            if(!mongoose.Types.ObjectId.isValid(listBosung[i]))
                return reject(new Error('Thêm bổ sung không hợp lệ'))
        }

        waterfall([
            //  Check if list bosung is exist in db
            (cb) => {
                addFieldModel.countDocuments({_id: {$in: listBosung}}, (err, count) => {
                    if(err) return cb("Có lổi xảy ra vui lòng thử lại sau");
                    if(listBosung.length != count) return cb("Add list bổ sung xác thực không thành công")
                    cb(null);
                });
            },
            //  Check if account have any bosung field in db already
            (cb) => {
                accountLinkAddFieldModel.countDocuments({accountId: idAccount, fieldId: {$in: listBosung}}, (err, count) => {
                    if(err) return cb("Có lổi xảy ra vui lòng thử lại sau");
                    if(count !== 0) return cb("Tài khoản đã có bổ sung")
                    cb(null);
                });
            },
            // Create list bosung
            (cb) => {
                const payload = listBosung.map(idBosung => {
                    return {accountId: idAccount, fieldId: idBosung}
                });
                accountLinkAddFieldModel.insertMany(payload, {session: session}, err => {
                    if(err) return cb("Có lổi xảy ra vui lòng thử lại sau");
                    cb(null);
                });
            }
        ], function(err, result){
            if(err) return reject(new Error(err));
            resolve();
        });
    });
}

function removeBosungField(idAccount, listBosung, session){
    return new Promise((resolve, reject) => {
         // Check if valid id
         for(let i = 0; i < listBosung.length; i++){
            if(!mongoose.Types.ObjectId.isValid(listBosung[i]))
                return reject(new Error('Remove bổ sung không hợp lệ'));
        }

        waterfall([
            // Check if account have list bosung to delete
            (cb) => { 
                accountLinkAddFieldModel.countDocuments({accountId: idAccount, fieldId: {$in: listBosung}}, (err, count) => {
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    if(count !== listBosung.length) return cb("List remove bổ sung không phù hợp");
                    cb(null);
                });
            },
            // Remove list bosung
            (cb) => {
                accountLinkAddFieldModel.deleteMany({accountId: idAccount, fieldId: {$in: listBosung}}, {session: session}, function(err, result){
                    if(err) return cb("Có lỗi xảy ra, vui lòng thử lại sau");
                    cb(null);
                });
            }
        ], function(err, result){
            if(err) return reject(new Error(err));
            resolve();
        });
    });
}

function validateUpdateList(updateList){
    const objectAccount = accountModel.schema.paths;
    for(const field in updateList){
        if(!objectAccount.hasOwnProperty(field))
            return false;
    }
    return true;
}

function updateAccount(idAccount, updateList, session){
    return new Promise((resolve, reject) => {
        accountModel.updateOne({_id: idAccount}, updateList, {session: session, runValidators: true}, (err, result) => {
            if(err){
                if(err.isPreUpdate) return reject(new Error(err.message))
                else{
                    console.log('System error, ctl/account/edit-account->updateAccount 01 ' + err );
                    return reject(new Error("Có lỗi xảy ra, vui lòng thử lại sau"));
                }
            }
            resolve();
        });
    });
}

function getTotalImageAccount(idAccount){
    return new Promise((resolve, reject) => {
        imageModel.countDocuments({account: idAccount}, (err, count) => {
            if(err) return reject(new Error("Có lỗi xảy ra, vui lòng thử lại sau"));
            resolve(count);
        });
    });
}

function addNewImages(idAccount, listImages, session){
    return new Promise((resolve, reject) => {
        const payload = listImages.map(image => {
            return {
                account: idAccount,
                albumId: 'TLBB',
                url: image.filename
            }
        });
        imageModel.insertMany(payload, {session: session}, (err) => {
            if(err) return reject(new Error("Có lỗi xảy ra, vui lòng thử lại sau"));
            resolve();
        });
    })
    
}

function deleteImages(idAccount, listImgDel, session){
    return new Promise((resolve, reject) => {
        waterfall([
            (cb) => {
                imageModel.countDocuments({ account: idAccount, url: {$in: listImgDel}}, (err, count) => {
                    if(err) return cb(new Error("Có lỗi xảy ra, vui lòng thử lại sau"));
                    if(count !== listImgDel.length) return cb(new Error("Image delete không hợp lệ"))
                    cb(null)
                });
            },
            (cb) => {
                imageModel.deleteMany({ account: idAccount, url: {$in: listImgDel}}, (err, count) => {
                    if(err) return cb(new Error("Có lỗi xảy ra, vui lòng thử lại sau"));
                    cb(null);
                });
            },
            (cb) => {
                listImgDel = listImgDel.map((img) => config.pathStoreImageUpload + '/' + img);
                helper.deleteManyFiles(listImgDel);
                cb(null);
            }
        ], function(err, result){
            if(err) return reject(err);
            resolve();
        });
    })
}

exports.updateAccount =  async (req, res) => {

        // Filter allow field only
        req.body = filterAllowField(req.body);
        if(helper.isEmptyObject(req.body))
            return res.status(400).send("Thiếu trường");

        // Checking field if empty
        if(checkEmptyField(req.body))
            return res.status(400).send('Trường bỏ trống');

        // Check if idAccount is valid
        if(typeof req.body.idAccount === 'undefined' || !mongoose.Types.ObjectId.isValid(req.body.idAccount))
            return res.status(400).send("Id tài khoản không hợp lệ");

        // Check if only idAccount field in req.body
        if(Object.keys(req.body).length == 1)
            return res.status(400).send("Thiếu trường update");

        // Check if user is login
        if(!req.isAuthenticated())
            return res.status(400).send("Bạn chưa đăng nhập");

        // Start session, if have error will rollback
        const session = await mongoose.startSession();
        session.startTransaction();

        try{
            // Check if account and user is correct, jump to catch if not valid
            await checkUserAccount(req.body.idAccount, req.user._id);

            // Elevate add bosung
            if(typeof req.body.listBosungAdd !== 'undefined'){
                //  Check if not object(array) or length < 0
                if(typeof req.body.listBosungAdd !== 'object' || req.body.listBosungAdd.length < 0)
                    return res.status(400).send("Bổ sung không hợp lệ!");
                await addBosungField(req.body.idAccount, req.body.listBosungAdd, session);
                delete req.body.listBosungAdd;
            }

            // Elevate remove bosung
            if(typeof req.body.listBosungDel !== 'undefined'){
                //  Check if not object(array) or length < 0
                if(typeof req.body.listBosungDel !== 'object' || req.body.listBosungDel.length < 0)
                    return res.status(400).send("Remove bổ sung không hợp lệ!");
                await removeBosungField(req.body.idAccount, req.body.listBosungDel, session);
                delete req.body.listBosungDel;
            }

            // Elevate transaction type
            if(typeof req.body.postType !== 'undefined'){
                if(typeof req.body.postType !== 'string')
                    throw new Error('PostType phải là string');
                // Validate postType
                if(req.body.postType !== 'sell' && req.body.postType !== 'trade' && req.body.postType !== 'all')
                    throw new Error('PostType không hợp lệ');
                if( (req.body.postType === 'sell' && typeof req.body.phaigiaoluu !== 'undefined') 
                    || 
                    (req.body.postType === 'trade' && typeof req.body.price !== 'undefined')
                    ||
                    (req.body.postType === 'all' && (typeof req.body.price === 'undefined' || typeof req.body.phaigiaoluu === 'undefined') )
                )
                    throw new Error('Lỗi postType');
                // Check if is sell
                if(req.body.postType === 'sell'){
                    if(isNaN(req.body.price))
                        throw new Error('Giá không hợp lệ')
                }
                // Check if is trade
                else if(req.body.postType === 'trade'){
                    if(!mongoose.Types.ObjectId.isValid(req.body.phaigiaoluu))
                        throw new Error('Phái giao lưu không hợp lệ')
                }
                // Check if is both
                else if(req.body.postType === 'all'){
                    if(isNaN(req.body.price) || !mongoose.Types.ObjectId.isValid(req.body.phaigiaoluu))
                        throw new Error('Lỗi postType all')
                }
                // Assign post type to transaction type and remove postType field and 
                req.body.transaction_type = req.body.postType;
                delete req.body.postType;
            }

            // Remove and save special field(listImageDel, idAccount) before update
            const idAccount = req.body.idAccount;
            const listImgDel = (typeof req.body.listImgDel !== 'undefined' && typeof req.body.listImgDel === 'object' && req.body.listImgDel.length > 0) ? req.body.listImgDel : null;
            delete req.body.idAccount;
            delete req.body.listImgDel;

            // Validate update list
            if(!validateUpdateList(req.body))
                throw new Error('Có lỗi khi validate update list');

            // Update account 
            await updateAccount(idAccount, req.body, session);

            // Check if have image add or image delete, calculate if less than 10 or more than 50 image return error
            if( (typeof req.files !== 'undefined' && req.files.length > 0) || listImgDel !== null ){
                const totalImage = await getTotalImageAccount(idAccount);
                //  Check if total (image + image add) - image del < 10 or more than 50
                if((typeof req.files !== 'undefined' && req.files.length > 0) && listImgDel !== null){
                    const predictImg = (Number(totalImage) + Number(req.files.length)) - Number(listImgDel.length);
                    if (predictImg < 10)
                        throw new Error('Phải có ít nhất 10 ảnh');
                    if(predictImg > 50)
                        throw new Error('Một tài khoản giới hạn 50 ảnh');
                }
                //  Check if totalImg + image add > 50
                else if((typeof req.files !== 'undefined' && req.files.length > 0) && listImgDel === null){
                    const predictImg = Number(totalImage) + Number(req.files.length);
                    if(predictImg > 50)
                        throw new Error('Một tài khoản giới hạn 50 ảnh');
                }
                //  Check if totalImg - image add < 10
                else if((typeof req.files === 'undefined' || req.files.length === 0) && listImgDel !== null){
                    const predictImg = Number(totalImage) - Number(listImgDel.length);
                    if (predictImg < 10)
                        throw new Error('Phải có ít nhất 10 ảnh');
                }
            }
                
            // Check if have new images
            if(typeof req.files !== 'undefined' && req.files.length > 0)
                await addNewImages(idAccount, req.files, session);
            
            // Check if have delete images
            if(listImgDel !== null){
                await deleteImages(idAccount, listImgDel, session);
            }

            // Commit transaction
            await session.commitTransaction(); 

            // Save activity
            helper.createActivity({
                type: 'update-account',
                account: idAccount,
                owner: req.user._id
            });

            res.send('Chỉnh sửa tài khoản thành công, <a href="/account/view-account/'+idAccount+'"> bấm vào đây để xem thay đổi</a>'); 
        }
        catch(err){
            // Delete storage image
            if(typeof req.files !== 'undefined' && req.files.length > 0){
                const listImgPath = req.files.map(image => image.path);
                helper.deleteManyFiles(listImgPath);
            }
            // End session
            await session.abortTransaction().catch(err => console.log(err));
            session.endSession();

            res.status(400).send(err.message);
        }
    
}