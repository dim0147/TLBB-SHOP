var express = require('express');
var router = express.Router();
const indexController = require('../controllers/index')

/* GET home page. */
router.get('/', indexController.indexPage);


router.get('/terms', indexController.termPage);

router.get('/privacy-policy', indexController.termPage);

router.get('/remove-user-data', function(req, res) {
    return res.send('Success')
});

module.exports = router;
