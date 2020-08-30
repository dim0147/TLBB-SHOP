const dateFormat = require('dateformat');
const waterfall = require('async-waterfall');

const cache = require('../cache/cache');
const config = require('../config/config');

const phaiModel = require('../models/phai');
const itemModel = require('../models/item');

const helper = require('../help/helper');

dateFormat.i18n = {
    dayNames: [
        'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7',
        'Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'
    ],
    monthNames: [
        'Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12',
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ],
    timeNames: [
        'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
    ]
};



// Set user session and convert image, user created day
exports.setUserSession = function(req, res, next) {
    if(req.isAuthenticated()){
        if(req.user.type === 'web') req.user.urlImage = config.urlWebsite + '/images/member.png';
        console.log('date ' +  req.user.created_at);
        if(typeof req.user.created_at === 'object')
            req.user.created_at = dateFormat(new Date(req.user.created_at), "d mmmm, yyyy")
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

