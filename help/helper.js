
const crypto = require('crypto'); 

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

exports.hashPassword = function(password) { 
  this.salt = crypto.randomBytes(16).toString('hex'); 
  this.hash = crypto.pbkdf2Sync(password, this.salt,  
  1000, 64, `sha512`).toString(`hex`); 
  return this.hash;
}; 

exports.verifyPassword = function(password, hashPassword) { 
  this.salt = crypto.randomBytes(16).toString('hex'); 
  var hash = crypto.pbkdf2Sync(password,  
  this.salt, 1000, 64, `sha512`).toString(`hex`); 
  return hashPassword == hash; 
}; 
