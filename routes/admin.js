var express = require('express');
var router = express.Router();

const dashboardC = require('../controllers/admin/dashboard');

const addPropertyC = require('../controllers/admin/property/add-property');
const editPropertyC = require('../controllers/admin/property/edit-property')
const addSubPropertyC = require('../controllers/admin/property/add-sub-property');

const addItemC = require('../controllers/admin/item/add-item');

const addPhaiC = require('../controllers/admin/phai/add-phai');

const addAddFieldC = require('../controllers/admin/addfield/add-addfield');

const addLockReasonAccount = require('../controllers/admin/account/add-lock-readson');

/* Dashboard  Page. */
router.get('/dashboard', dashboardC.renderDashboard);

/* Property  Page. */
router.get('/property/add-property', addPropertyC.renderPage);
router.post('/property/add-property', addPropertyC.addNewProperty);

router.get('/property/edit-property/:id', editPropertyC.renderPage);
router.patch('/property/edit-property/:id', editPropertyC.checkBodyEditProperty, editPropertyC.editProperty);

router.get('/property/add-sub-property/:idItem', addSubPropertyC.renderPage);
router.post('/property/add-sub-property/:idItem', addSubPropertyC.checkBodyAddNewSubP, addSubPropertyC.addNewSubProperty);

/* Item  Page. */
router.get('/item/add-item', addItemC.renderPage);
router.post('/item/add-item', addItemC.addNewItem);

/* Phai  Page. */
router.get('/phai/add-phai', addPhaiC.renderPage);
router.post('/phai/add-phai', addPhaiC.addNewPhai);

/* Addition field  Page. */
router.get('/addfield/add-addfield', addAddFieldC.renderPage);
router.post('/addfield/add-addfield', addAddFieldC.addNewAdditionField);

/* Lock account. */
router.get('/account/add-lock-reason/:id', addLockReasonAccount.checkParam, addLockReasonAccount.renderPage);
router.post('/account/add-lock-reason/:id', addLockReasonAccount.checkBody, addLockReasonAccount.addLockReason);


module.exports = router;
