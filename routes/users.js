var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/'})

const userC = require('../controllers/user/add-account');

/* GET users listing. */
router.get('/add-account', userC.renderAddAccount);

router.post('/add-account', upload.array('images'), userC.addNewAccount)

module.exports = router;
