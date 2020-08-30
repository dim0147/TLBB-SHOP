const waterfall = require('async-waterfall');

const phaiModel = require('../models/phai');
const itemModel = require('../models/item');
const bosungField = require('../models/add_field')

exports.checkEmptyRequest = function(req, arrayProperty, arrayNoCheckNull = []){
    for (var i = 0; i < arrayProperty.length; i++){
        let property = arrayProperty[i];
        if(typeof req[property] === 'undefined'){
            console.log('fail ' + property);
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
                                      }
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
