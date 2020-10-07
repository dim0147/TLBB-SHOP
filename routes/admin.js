var express = require('express');
var router = express.Router();

const dashboardC = require('../controllers/admin/dashboard');

const addPropertyC = require('../controllers/admin/property/add-property');
const editPropertyC = require('../controllers/admin/property/edit-property')
const addSubPropertyC = require('../controllers/admin/property/add-sub-property');

const addItemC = require('../controllers/admin/item/add-item');
const showItemC = require('../controllers/admin/item/show-item');
const editItemC = require('../controllers/admin/item/edit-item');
const delItemC = require('../controllers/admin/item/delete-item');
const sortPropertyC = require('../controllers/admin/item/sort-properties');

const addPhaiC = require('../controllers/admin/phai/add-phai');

const addAddFieldC = require('../controllers/admin/addfield/add-addfield');

const addLockReasonAccount = require('../controllers/admin/account/add-lock-readson');

const managerMemberUserC = require('../controllers/admin/manager_member/user');
const managerMemberModeratorC = require('../controllers/admin/manager_member/moderator');

function isLogin(req, res, next){ // if not login save current url to session then redirect to login page
    if(!req.isAuthenticated()){
        req.session.oldUrl = '/admin' + req.url;
        return res.redirect('/user/login');
    }
    next();
}

function isNormalUser(req, res, next){
    if(req.isAuthenticated() && req.user.status == 'normal' ){
      return next();
    }

    return res.redirect('/user/logout')
}

function isNormalUserAjax(req, res, next){
    if(req.isAuthenticated() && req.user.status == 'normal' ){
      return next();
    }
  
    return res.status(401).send("Tài khoản không hợp lệ, xin vui lòng logout")
  }

function isAdmin(req, res, next){
    if(req.user.role !== 'admin')
        return res.status(403).send('Admin Unauthorized')
    next();
}

function isAdminOrModerator(req, res, next){
    if(req.user.role !== 'admin' && req.user.role !== 'moderator')
        return res.status(403).send('Bạn không có quyền truy cập vào đây')
    next();
}


/* Dashboard  Page. */
router.get('/dashboard', isLogin, isNormalUser, isAdminOrModerator, dashboardC.renderDashboard);

/* Manager User Page. */
router.get('/manager_member/user', isLogin, isNormalUser, isAdminOrModerator, managerMemberUserC.renderUserPage);
router.get('/manager_member/get-users', isLogin, isNormalUserAjax, isAdminOrModerator, managerMemberUserC.checkQueryGetUserData, managerMemberUserC.getUserData);
/* Manager Moderator Page. */
router.get('/manager_member/moderator', isLogin, isNormalUser, isAdmin, managerMemberModeratorC.renderModeratorPage);
router.get('/manager_member/get-moderators', isLogin, isNormalUser, isAdmin, managerMemberModeratorC.checkQueryGetModeratorData, managerMemberModeratorC.getModeratorData);

/* Property  Page. */
router.get('/property/add-property', isLogin, isNormalUser, isAdmin, addPropertyC.renderPage);
router.post('/property/add-property', isLogin, isNormalUserAjax, isAdmin, addPropertyC.addNewProperty);

router.get('/property/edit-property/:id', isLogin, isNormalUser, isAdmin, editPropertyC.renderPage);
router.patch('/property/edit-property/:id', isLogin, isNormalUserAjax, isAdmin, editPropertyC.checkBodyEditProperty, editPropertyC.editProperty);

router.get('/property/add-sub-property/:idItem', isLogin, isNormalUser, isAdmin, addSubPropertyC.renderPage);
router.post('/property/add-sub-property/:idItem',  isLogin, isNormalUserAjax, isAdmin, addSubPropertyC.checkBodyAddNewSubP, addSubPropertyC.addNewSubProperty);

/* Item  Page. */
router.get('/item/add-item', isLogin, isNormalUser, isAdmin, addItemC.renderPage);
router.post('/item/add-item', isLogin, isNormalUserAjax, isAdmin, addItemC.addNewItem);
router.get('/item/show-items', isLogin, isNormalUser, isAdmin, showItemC.renderPage);
router.get('/item/edit-item/:itemId', isLogin, isNormalUser, isAdmin, editItemC.renderPage);
router.put('/item/edit-item', isLogin, isNormalUser, isAdmin, editItemC.updateItem);
router.delete('/item/delete-item', isLogin, isNormalUser, isAdmin, delItemC.checkBodyDeleteItem, delItemC.deleteItem);
router.get('/item/sort-properties/:itemId', isLogin, isNormalUser, isAdmin, sortPropertyC.checkParam, sortPropertyC.renderPage);
router.patch('/item/sort-properties', isLogin, isNormalUser, isAdmin, sortPropertyC.checkBody, sortPropertyC.updateOrderProperties);

/* Phai  Page. */
router.get('/phai/add-phai', isLogin, isNormalUser, isAdmin, addPhaiC.renderPage);
router.post('/phai/add-phai', isLogin, isNormalUserAjax, isAdmin, addPhaiC.addNewPhai);

/* Addition field  Page. */
router.get('/addfield/add-addfield', isLogin, isNormalUser, isAdmin, addAddFieldC.renderPage);
router.post('/addfield/add-addfield', isLogin, isNormalUserAjax, isAdmin, addAddFieldC.addNewAdditionField);

/* Lock account. */
router.get('/account/add-lock-reason/:id', isLogin, isNormalUser, isAdmin, addLockReasonAccount.checkParam, addLockReasonAccount.renderPage);
router.post('/account/add-lock-reason/:id', isLogin, isNormalUserAjax, isAdmin, addLockReasonAccount.checkBody, addLockReasonAccount.addLockReason);


module.exports = router;
