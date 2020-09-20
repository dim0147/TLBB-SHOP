const waterfall = require('async-waterfall');
const fs = require('fs');
const mongoose = require('mongoose');

const phaiModel = require('../models/phai');
const itemModel = require('../models/item');
const bosungField = require('../models/add_field')
const activityModel = require('../models/activity');
const commentModel = require('../models/comment');
const notificationModel = require('../models/notification');

const cache = require('../cache/cache')

exports.checkEmptyRequest = function(req, arrayProperty, arrayNoCheckNull = []){
    for (var i = 0; i < arrayProperty.length; i++){
        let property = arrayProperty[i];
        if(typeof req[property] === 'undefined'){
            return true;
        }
        if(!arrayNoCheckNull.includes(property) && req[property].length === 0)
            return true;
    }
    return false;
}


exports.getMenuData = function(){
  return new Promise((resolve, reject) => {
      waterfall([
          cb => {
              phaiModel.find({}).lean().exec((err, phais) => {
                  if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                  cb(null, phais)
              });
          },
          (phais, cb) => {
              itemModel.aggregate([
                  {
                      $lookup: {
                          from: 'item-properties',
                          let: {idItem: '$_id'},
                          pipeline: [
                              {
                                  $match: {
                                      $expr:{
                                          $eq: ['$itemId', '$$idItem']
                                      },
                                      parent: null
                                  }
                              },
                              {
                                  $lookup: {
                                      from: 'item-properties',
                                      localField: '_id',
                                      foreignField: 'parent',
                                      as: 'sub_properties'
                                  }
                              }
                          ],
                          as: 'properties'
                      }
                  }
              ], function(err, items) {
                  if(err) return cb('Có lỗi xảy ra, vui lòng thử lại sau');
                  menuView = {
                      phais: phais,
                      items: items
                  }
                  cb(null, menuView)
  4                   
              });
          }
      ], function(err, result){
          if(err) return reject(err);
          resolve(result);
      });
  })
}

exports.getBosungFields = function(){
    return new Promise((resolve, reject) =>{
        bosungField.find({}).exec(function(err, result){
            if(err) return reject(err);
            resolve(result);
        });
    })
}

exports.isEmpty = function(map) {
    for(var key in map) {
      if (map.hasOwnProperty(key)) {
         return false;
      }
    }
    return true;
}

exports.checkProperty = function(object, arrayProperty){
    for(let i = 0; i < arrayProperty.length; i++){
        if(!object.hasOwnProperty(arrayProperty[i]))
            return false
    }
    return true
}

exports.generateRandomString = function(length){
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

exports.deleteManyFiles = function(arrFiles){
    try {
        arrFiles.forEach(path => fs.existsSync(path) && fs.unlinkSync(path));
        return true;
      } catch (err) {
        console.error(err)
        return false;
      }
}

exports.isEmptyObject = obj => {
    if(Object.keys(obj).length > 0){
        return false;    
    }
    return true
}

exports.createActivity = function(payload){
    const activity = new activityModel(payload);
    activity.save(err => {
        if(err)
            console.log('Có lỗi khi tạo activity to DB ->  ' + err);
    })
}

exports.getSlugItem = function(menuView = cache.getKey('menuView')){
    const arraySlugItem = [];
    if(menuView.items && menuView.items.length > 0){
        menuView.items.forEach(item  => {
            arraySlugItem.push(item.slug);
        });
    }
    return arraySlugItem;
}

exports.getItemPopACField = function(menuView = cache.getKey('menuView')){
    const arraySlugItem = [];
    if(menuView.items && menuView.items.length > 0){
        menuView.items.forEach(item  => {
            const payload = {
                path: item.slug,
                model: 'item-properties',
                select: '_id name'
            }
            arraySlugItem.push(payload);
        });
    }
    return arraySlugItem;
}

//----------------------- NOTIFICATION ------------------------
// const notifySchema = new mongoose.Schema({
//     comment: {type: mongoose.Schema.Types.ObjectId, ref: 'comments'},
//     account: {type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
//     values: {type: String},
//     type: {type: String, enum: typeNotify, required: true},
//     status: {type: String, enum: status, default: 'unseen', required: true},
//     owner: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
// })

//---------"comment-on-my-account" TYPE ---------------------
function getTwoRecentUserComment(idAccount){
    return new Promise((resolve, reject) => {
        commentModel.find({
            account: mongoose.Types.ObjectId(idAccount),
        })
        .sort({createdAt: -1})
        .limit(2)
        .populate(
            {
                path: 'user',
                select: 'name'
            }
        )
        .exec((err, comments) => {
            if(err){
                console.log('Error in help/helper.js -> ntfCreateCmtOnMyAccount 02 ' + err);
                return reject('Có lỗi xảy ra vui lòng thử lại sau')
            }
            switch(comments.length){
                case 2:
                    const twoUser = comments[0].user.name + ', ' + comments[0].user.name;
                    resolve(twoUser);
                    break;
                case 1:
                    const oneUser = comments[0].user.name;
                    resolve(oneUser);
                    break;
                default:
                    resolve('Không có ai');
            }
        });
    });
}

function getTotalUserComment(idAccount){
    return new Promise((resolve, reject) => {
        commentModel.countDocuments({account: mongoose.Types.ObjectId(idAccount)}, (err, count) => {
            if(err){
                console.log('Error in help/helper.js -> ntfCreateCmtOnMyAccount 03 ' + err);
                return reject('Có lỗi xảy ra vui lòng thử lại sau')
            }
            resolve(count);
        });
    });
}

function getTextNotifyUserCommentMyAC(idAccount){
    return new Promise((res, rej) => {

        Promise.all([getTwoRecentUserComment(idAccount), getTotalUserComment(idAccount)])
        .then(values => {
            const recentUserComment = values[0];
            const totalUserComment = values[1];
            let text = '';

            if(totalUserComment === 0)
                text = 'Không có ai bình luận';
            else if (totalUserComment === 1 || totalUserComment === 2)
                text = recentUserComment;
            else
                text = recentUserComment + ' và ' + (totalUserComment - 2) + ' người khác';
            res(text)
        })
        .catch(err => {
            rej(err);
        })
    });
}

function CreateNtfCmtOnMyAccount(data){
    waterfall([
        (cb) => { // Check if notification is exist
            notificationModel.findOne(
            {
                owner: mongoose.Types.ObjectId(data.owner),
                account: mongoose.Types.ObjectId(data.account),
                type: 'comment-on-my-account'
            })
            .lean()
            .exec(function(err, notification){
                if(err){
                    console.log('Error in help/helper.js -> ntfCreateCmtOnMyAccount 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                let result = { data: data, notification: notification };
                return cb(null, result);
            });
        },
        (result, cb) => { // Get text recent user comment and total comment
            getTextNotifyUserCommentMyAC(result.data.account)
            .then(text => {
                result.data.values = JSON.stringify({userAndOther: text});
                cb(null, result);
            })
            .catch(err => cb(err));
        },
        (result, cb) => { // Update if exist
            if(!result.notification) return cb(null, result);
            notificationModel.findByIdAndUpdate(result.notification._id, {values: result.data.values}, (err) => {
                if(err){
                    console.log('Error in help/helper.js -> ntfCreateCmtOnMyAccount 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, 'Update success');
            });
        },
        (result, cb) => { // Create if not exist
            if(result.notification) return cb(null, result);
            const newNotification = new notificationModel(result.data).save(err => {
                if(err){
                    console.log('Error in help/helper.js -> ntfCreateCmtOnMyAccount 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, 'Create success');
            });
        }
    ], function(err, result) {
        if(!err)
            console.log(result);
    });
} 
//--------- END "comment-on-my-account" TYPE ---------------------

exports.createNotification = function(data){
    switch (data.type){
        case 'comment-on-my-account':
            CreateNtfCmtOnMyAccount(data)
            break;
    }
}