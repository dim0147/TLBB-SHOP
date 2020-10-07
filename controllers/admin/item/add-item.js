const waterfall = require('async-waterfall');
const mongoose = require('mongoose');

const config = require('../../../config/config');

const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');


exports.renderPage = (req, res) => {
    res.render('admin/item/add-item', {title: 'Thêm Item', account: config.account, csrfToken: req.csrfToken()});
}

exports.addNewItem = async (req, res) => {
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

    const session = await mongoose.startSession().catch(err => {return {error: err}});
    if(session.error){
        if(err){
            console.log('Error in controllers/admin/item/add-item.js -> addNewItem 01 ' + err);
            return res.status(500).send('Có lỗi vui lòng thử lại sau');
        }
    }
    session.startTransaction();
    waterfall([
        //  Check if name is exist 
        function(cb){
            itemModel.findOne({ name: req.body.name}, null, {session: session}, (err, item) => {
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
            itemModel.findOne({ slug: req.body.slug}, null, {session: session}, (err, item) => {
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
            itemModel.create([{name: req.body.name, slug: req.body.slug}], {session: session}, (err, items) => {
                if(err){ 
                    console.error('Lỗi create item database: ' + err.message);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(items.length === 0) {
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, items[0]);
            })
        },
        // Create "Chưa có" sub properties
        function(item, cb){ 
            itemPropertyModel.create([{name: 'Chưa có', itemId: item._id, order: 1}], {session: session}, function(err){
                if(err){
                    console.log('Error in ctl/admin/item/add-item.js -> addNewItem 05 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, 'Tạo item ' + item.name + ' thành công');
            });
        }
    ], async function(err, result){
        if(err){
            await session.abortTransaction().catch(err => console.log(err))
            session.endSession();
            res.status(400);
            res.send(err);
            return
        }
        const commitRs = await session.commitTransaction().catch(err => { return {error: err} })
        session.endSession();
        if(commitRs.error){
            console.log('Có lỗi khi commit transaction ' + commitRs.error);
            return res.status(500).send('Có lỗi xảy ra , vui lòng thử lại sau');
        }
        res.send(result);
    });
 
}