const dateFormat = require('dateformat');
const waterfall = require('async-waterfall');

const cache = require('../cache/cache');
const config = require('../config/config');

const phaiModel = require('../models/phai');
const itemModel = require('../models/item');

const helper = require('../help/helper');


// Set user session and convert image, user created day
exports.setUserSession = function(req, res, next) {
    if(req.isAuthenticated()){
        if(req.user.type === 'web') req.user.urlImage = config.urlWebsite + '/images/member.png';
        req.user.created_at = dateFormat(new Date(req.user.created_at), "mmmm d, yyyy")
      }
      res.locals.userSS = req.user;
      next()
}

// Load menu 
exports.loadMenuView = function(req, res, next){
    // Check if cache have menu data
    const items = cache.getKey('menuView');
    if(typeof items !== 'undefined'){
        console.log('Using cache to show menu');
        res.locals.menuView = items;
        return next();
    }

    // If not query and create
    helper.getMenuData()
    .then(function(result){
        cache.setKey('menuView', result)
        res.locals.menuView = result;
        console.log('Store to cache');
        next();
    })
    .catch(function(err){
        res.status(400).send(err);
    });
   
}

