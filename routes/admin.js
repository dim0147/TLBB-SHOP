var express = require('express');
var router = express.Router();
const addPropertyC = require('../controllers/admin/property/add-property');
const addItemC = require('../controllers/admin/item/add-item');
const addPhaiC = require('../controllers/admin/phai/add-phai');
const addAddFieldC = require('../controllers/admin/addfield/add-addfield');


/* Property  Page. */
router.get('/property/add-property', addPropertyC.renderPage);

router.post('/property/add-property', addPropertyC.addNewProperty);

/* Item  Page. */
router.get('/item/add-item', addItemC.renderPage);

router.post('/item/add-item', addItemC.addNewItem);

/* Phai  Page. */
router.get('/phai/add-phai', addPhaiC.renderPage);

router.post('/phai/add-phai', addPhaiC.addNewPhai);

/* Addition field  Page. */
router.get('/addfield/add-addfield', addAddFieldC.renderPage);

router.post('/addfield/add-addfield', addAddFieldC.addNewAdditionField);


module.exports = router;
