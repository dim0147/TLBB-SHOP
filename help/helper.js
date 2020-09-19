const waterfall = require('async-waterfall');
const fs = require('fs');

const phaiModel = require('../models/phai');
const itemModel = require('../models/item');
const bosungField = require('../models/add_field')
const activityModel = require('../models/activity');

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

