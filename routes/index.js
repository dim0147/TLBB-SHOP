var express = require('express');
var router = express.Router();
const indexController = require('../controllers/index')

/* GET home page. */
router.get('/', indexController.indexPage);


router.get('/terms', indexController.termPage);

module.exports = router;
