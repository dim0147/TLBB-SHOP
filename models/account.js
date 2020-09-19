const mongoose = require('mongoose');
const waterfall = require('async-waterfall');

const config = require('../config/config');
const cache = require('../cache/cache');
const helper = require('../help/helper');

const itemModel = require('../models/item');
const itemPropertyModel = require('../models/item_property');
const phaiModel = require('../models/phai');


const accountSchema = mongoose.Schema({
    title: {type: String, required: true, minlength: 5, maxlength: 80},
    c_name: {type: String, required: true, minlength: 2, maxlength: 20},
    phai: {type: mongoose.Schema.Types.ObjectId, ref: 'phais', required: true},
    level: {type: Number, required: true, min: 1, max: 119},

    server: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties', required: true},
    sub_server: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties', required: true},
    vohon: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    amkhi: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    thankhi: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    tuluyen: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    ngoc: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    doche: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    dieuvan: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    longvan: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties',required: true},
    channguyen: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties', required: true},
    thanmocvuongdinh: {type: mongoose.Schema.Types.ObjectId, ref: 'item-properties', required: true},

    transaction_type: {type: String, required: true, enum: config.account.transaction_type},
    price: {type: Number},
    phaigiaoluu: {type: mongoose.Schema.Types.ObjectId, ref: 'phais'},
    status: {type: String, required: true, enum: config.account.status, default: 'pending', required: true},
    phone: Number,
    loinhan: String,
    contactFB: {type: String, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref:'users', required: true}
},{ timestamps: { createdAt: 'createdAt' , updatedAt: 'updatedAt'} } );

accountSchema.pre('save', async function(next) {
    // Initialize the list of field to check
    const fields = helper.getSlugItem();
    
    // Initialize list promise
    const listPromise = [];


    // Checking phai
    if(!mongoose.Types.ObjectId.isValid(this.phai))
      return next("Phái không hợp lệ!");
    let phaiPromise = new Promise((resolve, reject) => {
      phaiModel.countDocuments({_id: this.phai}, (err, count) =>{
        if(err) return reject(err);
        if(count === 0) return reject("Phái không tìm thấy");
        resolve();
      });
    });
    listPromise.push(phaiPromise);

    // Checking phaigiaoluu
    if(typeof this.phaigiaoluu !== 'undefined'){
      let phaiGLPromise = new Promise((resolve, reject) => {
        phaiModel.countDocuments({_id: this.phaigiaoluu}, (err, count) =>{
          if(err) return reject(err);
          if(count === 0) return reject("Phái giao lưu không tìm thấy");
          resolve();
        });
      });
      listPromise.push(phaiGLPromise);
    }

    // Checking server and sub server
    if(!mongoose.Types.ObjectId.isValid(this.server) || !mongoose.Types.ObjectId.isValid(this.sub_server))
      return next("Server không hợp lệ!");
    let serverPromise = new Promise((resolve, reject) => {
      itemPropertyModel.findOne({_id: this.sub_server, parent: this.server}).exec((err, property) => {
        if(err) return reject(err);
        if(property === null) return reject("Sub Server không trùng với Server");
        resolve();
      });
    });
    listPromise.push(serverPromise);

    // Checking if status is pending or not
    if(typeof this.status !== "undefined" && this.status != "pending"){
      return next("Status không hợp lệ");
    }
    
    // Loop though field of current document for checking fields
    for(const field in this){

      // If current field include one of field to check
      if(fields.includes(field)){

        // Check if is mongoId 
        if(!mongoose.Types.ObjectId.isValid(this[field]))
          return next("Object id không hợp lệ " + field + ' value ' + this[field]);

        // Create new promise
        const promise = new Promise((resolve, reject) => {
          waterfall([
            // Check item property is exist
            (cb) => {
              itemPropertyModel.findOne({_id: this[field]}).exec(function(err, property){
                if(err) return cb(err);
                if(property === null) return cb("Không tìm thấy property " + field + " value " + this[field]);
                cb(null, {idItem: property.itemId, slug: field});
              });
            },
            // Check if item property is correct with slug
            (result, cb) => {
              itemModel.countDocuments({_id: result.idItem, slug: result.slug}, function(err, count){
                if(err) return cb(err);
                if (count === 0) return cb("Item property không hợp lệ với slug: " + result.slug);
                cb(null);
              });
            }
          ], function(err, result){
            if(err) return reject(err);
            resolve();
          });
        });

        // Push new promise to list Promise
        listPromise.push(promise);

      }

    }

    Promise.all(listPromise)
    .then((result) => {
      next();
    })
    .catch((err) => {
      console.log(err);
      next(err);
    })

});

accountSchema.pre('updateOne', function(next) {
  const doc = this.getUpdate();

  // Initialize the list of field to check
  const fields = helper.getSlugItem();
  
  // Initialize list promise
  const listPromise = [];

  // Checking phai
  if(typeof doc.phai !== 'undefined'){

    // If not mongoose object id
    if(!mongoose.Types.ObjectId.isValid(doc.phai))
      return next("Phái không hợp lệ!");

    // Check if is id of phai
    let phaiPromise = new Promise((resolve, reject) => {
      phaiModel.countDocuments({_id: doc.phai}, (err, count) =>{
        if(err) return reject(err);
        if(count === 0) return reject("Phái không tìm thấy");
        resolve();
      });
    });

    listPromise.push(phaiPromise);

  }

  // Checking phaigiaoluu
  if(typeof doc.phaigiaoluu !== 'undefined'){

  let phaiGLPromise = new Promise((resolve, reject) => {
    phaiModel.countDocuments({_id: doc.phaigiaoluu}, (err, count) =>{
      if(err) return reject(err);
      if(count === 0) return reject("Phái giao lưu không tìm thấy");
      resolve();
    });
  });

  listPromise.push(phaiGLPromise);
  }

  // Checking server and sub server
  if(typeof doc.server !== "undefined" || typeof doc.sub_server !== "undefined"){
    if(typeof doc.server === "undefined" || typeof doc.sub_server === "undefined")
      return next("Server missing field");

      if(!mongoose.Types.ObjectId.isValid(doc.server) || !mongoose.Types.ObjectId.isValid(doc.sub_server))
        return next("Server không hợp lệ!");
      let serverPromise = new Promise((resolve, reject) => {
        itemPropertyModel.findOne({_id: doc.sub_server, parent: doc.server}).exec((err, property) => {
          if(err) return reject(err);
          if(property === null) return reject("Sub Server không trùng với Server");
          resolve();
        });
      });
      listPromise.push(serverPromise);
  }

  // Loop though field of current document for checking fields
  for(const field in doc){

    // If current field include one of field to check
    if(fields.includes(field)){

      // Check if is mongoId 
      if(!mongoose.Types.ObjectId.isValid(doc[field]))
        return next("Object id không hợp lệ " + field + ' value ' + doc[field]);

      // Create new promise
      const promise = new Promise((resolve, reject) => {
        waterfall([
          // Check item property is exist
          (cb) => {
            itemPropertyModel.findOne({_id: doc[field]}).exec(function(err, property){
              if(err) return cb(err);
              if(property === null) return cb("Không tìm thấy property " + field + " value " + doc[field]);
              cb(null, {idItem: property.itemId, slug: field});
            });
          },
          // Check if item property is correct with slug
          (result, cb) => {
            itemModel.countDocuments({_id: result.idItem, slug: result.slug}, function(err, count){
              if(err) return cb(err);
              if (count === 0) return cb("Item property không hợp lệ với slug: " + result.slug);
              cb(null);
            });
          }
        ], function(err, result){
          if(err) return reject(err);
          resolve();
        });
      });

      // Push new promise to list Promise
      listPromise.push(promise);

    }

  }

  Promise.all(listPromise)
    .then((result) => {
      next();
    })
    .catch((err) => {
      console.log(err);
      next(err);
    })
});



module.exports = mongoose.model('accounts', accountSchema);