const waterfall = require('async-waterfall');
const fs = require('fs');
const mongoose = require('mongoose');

const phaiModel = require('../models/phai');
const itemModel = require('../models/item');
const bosungField = require('../models/add_field')
const activityModel = require('../models/activity');
const commentModel = require('../models/comment');
const likeModel = require('../models/like');
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

//----------------------- NOTIFICATION SECTION------------------------

// Get unread notifications
exports.getUnreadNotifications = function(userId){
    return new Promise((resolve, reject) => {
        notificationModel.countDocuments({owner: mongoose.Types.ObjectId(userId), status: 'unseen'}, (err, count) => {
            if(err) return reject(err);
            resolve(count);
        });
    });
}

//---------"comment-on-my-account" TYPE ---------------------
function getUserAndOtherCmt(idAccount, ownerId){
    return new Promise((resolve, reject) => {
        commentModel.aggregate([
            {
                $match: {
                    account: mongoose.Types.ObjectId(idAccount),
                    user: {$ne: mongoose.Types.ObjectId(ownerId)}
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user', 
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $group: {
                    _id: '$user._id',
                    name: {$first: '$user.name'},
                    commentCreatedAt : {$last: '$createdAt'}
                }
            },
            {
                $facet: {
                    data: [
                        {
                            $sort: {commentCreatedAt: -1}
                        },
                        {
                            $limit: 2
                        }
                    ],
                    count: [
                        {
                            $count: 'totalUser'
                        }
                    ]
                }
            },
        ], function(err, rs){
            if(err){
                console.log('Error in help/helper.js -> getTotalUserCmt 01 ' + err);
                return reject('Có lỗi xảy ra vui lòng thử lại sau')
            }
            // Get two recent user and total user comment
            const users = rs[0].data.length === 0 ? [] : rs[0].data;
            const totalUserComment = rs[0].count.length === 0 ? 0 : rs[0].count[0].totalUser;

            // Check if have two user or one user comment or nobody
            let recentUserCmt = null;
            if(users.length === 2)
                recentUserCmt = users[0].name + ', ' + users[1].name;
            else if(users.length === 1)
                recentUserCmt = users[0].name;
            else
                recentUserCmt = 'Không có ai';
            
            /// Check if total user comment more than 3 or 2 or 1
            let text = null;
            if(totalUserComment === 0)
                text = 'Không có ai bình luận';
            else if (totalUserComment === 1 || totalUserComment === 2) // If 1 or 2 user comment
                text = recentUserCmt;
            else // More than 3
                text = recentUserCmt + ' và ' + (totalUserComment - 2) + ' người khác';
            resolve(text);
        })
    });
}

function CmtOnMyAccount(data){
    if(data.commentOwner.toString() == data.owner.toString()) // means owner comment on his/her account
        return;
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
                    console.log('Error in help/helper.js -> CmtOnMyAccount 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                let result = { data: data, notification: notification };
                return cb(null, result);
            });
        },
        (result, cb) => { // Get text recent user comment and total comment and add to values field
            getUserAndOtherCmt(result.data.account, result.data.owner)
            .then(text => {
                result.data.values = JSON.stringify({userAndOther: text});
                cb(null, result);
            })
            .catch(err => console.log(err));
        },
        (result, cb) => { // Update if exist
            if(!result.notification) return cb(null, result);
            notificationModel.findByIdAndUpdate(result.notification._id, {values: result.data.values}, (err) => {
                if(err){
                    console.log('Error in help/helper.js -> CmtOnMyAccount 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.message = 'Update success';
                cb(null, result);
            });
        },
        (result, cb) => { // Create if not exist
            if(result.notification) return cb(null, result);
            const payload = {
                account: result.data.account,
                owner: result.data.owner,
                values: result.data.values,
                type: 'comment-on-my-account'
            }
            const newNotification = new notificationModel(payload).save(err => {
                if(err){
                    console.log('Error in help/helper.js -> CmtOnMyAccount 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.message = 'Create success';
                cb(null, result);
            });
        }
    ]);
} 

/* ********************************************************************************* */

//---------"reply-my-comment" TYPE ---------------------
function getUserAndOtherRepCmt(idComment, ownerId){
    return new Promise((resolve, reject) => {
        commentModel.aggregate([
            {
                $match: {
                    parent: mongoose.Types.ObjectId(idComment),
                    user: {$ne: mongoose.Types.ObjectId(ownerId)}
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user', 
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $group: {
                    _id: '$user._id',
                    name: {$first: '$user.name'},
                    commentCreatedAt : {$last: '$createdAt'}
                }
            },
            {
                $facet: {
                    data: [
                        {
                            $sort: {commentCreatedAt: -1}
                        },
                        {
                            $limit: 2
                        }
                    ],
                    count: [
                        {
                            $count: 'totalUser'
                        }
                    ]
                }
            },
        ], function(err, rs){
            if(err){
                console.log('Error in help/helper.js -> getTotalUserCmt 01 ' + err);
                return reject('Có lỗi xảy ra vui lòng thử lại sau')
            }
            // Get two recent user and total user comment
            const users = rs[0].data.length === 0 ? [] : rs[0].data;
            const totalUserRepCmt = rs[0].count.length === 0 ? 0 : rs[0].count[0].totalUser;

            // Check if have two user or one user comment or nobody
            let recentUserCmt = null;
            if(users.length === 2)
                recentUserCmt = users[0].name + ', ' + users[1].name;
            else if(users.length === 1)
                recentUserCmt = users[0].name;
            else
                recentUserCmt = 'Không có ai';
            
            /// Check if total user comment more than 3 or 2 or 1
            let textTotalUserRepCmt = null;
            if(totalUserRepCmt === 0)
                textTotalUserRepCmt = 'Không có ai';
            else if (totalUserRepCmt === 1 || totalUserRepCmt === 2) // If 1 or 2 user comment
                textTotalUserRepCmt = '';
            else // More than 3
                textTotalUserRepCmt = ' và ' + (totalUserRepCmt - 2) + ' người khác';
            const text = recentUserCmt + textTotalUserRepCmt;
            resolve(text);
        })
    });
}

function RepMyComment(data){
    if(data.childCommentOwner.toString() == data.owner.toString()) // Means owner reply his/her own comment
        return;
    waterfall([
        (cb) => { // Check if notification is exist
            notificationModel.findOne(
            {
                owner: mongoose.Types.ObjectId(data.owner),
                comment: mongoose.Types.ObjectId(data.comment),
                type: 'reply-my-comment'
            })
            .lean()
            .exec(function(err, notification){
                if(err){
                    console.log('Error in help/helper.js -> RepMyComment 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                let result = { data: data, notification: notification };
                return cb(null, result);
            });
        },
        (result, cb) => { // Get text recent user reply comment and total reply comment
            getUserAndOtherRepCmt(result.data.comment, result.data.owner)
            .then(text => {
                result.data.values = JSON.stringify({userAndOther: text});
                cb(null, result);
            })
            .catch(err => console.log(err));
        },
        (result, cb) => { // Update if exist
            if(!result.notification) return cb(null, result);
            notificationModel.findByIdAndUpdate(result.notification._id, {values: result.data.values}, (err) => {
                if(err){
                    console.log('Error in help/helper.js -> RepMyComment 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.message = 'Update success';
                cb(null, result);
            });
        },
        (result, cb) => { // Create if not exist
            if(result.notification) return cb(null, result);
            const payload = {
                comment: result.data.comment,
                owner: result.data.owner,
                values: result.data.values,
                type: 'reply-my-comment'
            }
            const newNotification = new notificationModel(payload).save(err => {
                if(err){
                    console.log('Error in help/helper.js -> RepMyComment 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.message = 'Create success';
                cb(null, result);
            });
        }
    ]);
}

/* ********************************************************************************* */

//---------"like-my-comment" TYPE ---------------------
function getUserAndOtherLikeCmt(idComment, ownerId){
    return new Promise((resolve, reject) => {
        likeModel.aggregate([
            {
                $match: {
                    comment: mongoose.Types.ObjectId(idComment),
                    user: {$ne: mongoose.Types.ObjectId(ownerId)}
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user', 
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $group: {
                    _id: '$user._id',
                    name: {$first: '$user.name'},
                    likeCreatedAt : {$last: '$createdAt'}
                }
            },
            {
                $facet: {
                    data: [
                        {
                            $sort: {likeCreatedAt: -1}
                        },
                        {
                            $limit: 2
                        }
                    ],
                    count: [
                        {
                            $count: 'totalLike'
                        }
                    ]
                }
            },
        ], function(err, rs){
            if(err){
                console.log('Error in help/helper.js -> getUserAndOtherLikeCmt 01 ' + err);
                return reject('Có lỗi xảy ra vui lòng thử lại sau')
            }
            // Get two recent user and total user like
            const users = rs[0].data.length === 0 ? [] : rs[0].data;
            const totalUserLike = rs[0].count.length === 0 ? 0 : rs[0].count[0].totalLike;

            // Check if have two user or one user like or nobody
            let recentUserLike = null;
            if(users.length === 2)
                recentUserLike = users[0].name + ', ' + users[1].name;
            else if(users.length === 1)
                recentUserLike = users[0].name;
            else
                recentUserLike = 'Không có ai';
            
            /// Check if total user comment more than 3 or 2 or 1
            let textTotalUserLikeCmt = null;
            if(totalUserLike === 0)
                textTotalUserLikeCmt = 'Không có ai';
            else if (totalUserLike === 1 || totalUserLike === 2) // If 1 or 2 user comment
                textTotalUserLikeCmt = '';
            else // More than 3
                textTotalUserLikeCmt = ' và ' + (totalUserLike - 2) + ' người khác';
            const text = recentUserLike + textTotalUserLikeCmt;
            resolve(text);
        })
    });
}

function LikeMyComment(data){
    if(data.likeOwner.toString() == data.owner.toString()) // Means owner like his/her own comment
        return;
    waterfall([
        (cb) => { // Check if notification is exist
            notificationModel.findOne(
            {
                owner: mongoose.Types.ObjectId(data.owner),
                comment: mongoose.Types.ObjectId(data.comment),
                type: 'like-my-comment'
            })
            .lean()
            .exec(function(err, notification){
                if(err){
                    console.log('Error in help/helper.js -> LikeMyComment 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                let result = { data: data, notification: notification };
                return cb(null, result);
            });
        },
        (result, cb) => { // Get text recent user like comment and total like comment
            getUserAndOtherLikeCmt(result.data.comment, result.data.owner)
            .then(text => {
                result.data.values = JSON.stringify({userAndOther: text});
                cb(null, result);
            })
            .catch(err => console.log(err));
        },
        (result, cb) => { // Update if exist
            if(!result.notification) return cb(null, result);
            notificationModel.findByIdAndUpdate(result.notification._id, {values: result.data.values}, (err) => {
                if(err){
                    console.log('Error in help/helper.js -> LikeMyComment 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.message = 'Update success';
                cb(null, result);
            });
        },
        (result, cb) => { // Create if not exist
            if(result.notification) return cb(null, result);
            const payload = {
                comment: result.data.comment,
                owner: result.data.owner,
                values: result.data.values,
                type: 'like-my-comment'
            }
            const newNotification = new notificationModel(payload).save(err => {
                if(err){
                    console.log('Error in help/helper.js -> LikeMyComment 03 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                result.message = 'Create success';
                cb(null, result);
            });
        }
    ]);
}

/* ********************************************************************************* */

//---------"admin-lock-account" TYPE ---------------------
function AdminBlockAccount(data){
    waterfall([
        cb => { // Check if notification is exist
            notificationModel.findOne({
                type: 'admin-lock-account',
                account: mongoose.Types.ObjectId(data.account),
                owner: mongoose.Types.ObjectId(data.owner)
            })
            .exec((err, notification) => {
                if(err){
                    console.log('Error in help/helper.js -> AdminBlockAccount 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, { data: data, notification: notification });
            });
        },
        (result, cb) => { // Create notification if not exist
            if(result.notification) return cb(null); // Exist already
            const payload = {
                type: 'admin-lock-account',
                account: result.data.account,
                owner: result.data.owner
            }
            const newNotification = new notificationModel(payload).save(err => {
                if(err){
                    console.log('Error in help/helper.js -> AdminBlockAccount 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null);
            });
        }
    ])
}

exports.createNotification = function(data){
    switch (data.type){
        case 'comment-on-my-account':
            CmtOnMyAccount(data)
            break;
        case 'reply-my-comment':
            RepMyComment(data)
            break;
        case 'like-my-comment':
            LikeMyComment(data)
            break;
        case 'admin-lock-account':
            AdminBlockAccount(data)
            break;
    }
}