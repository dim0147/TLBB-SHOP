var express = require('express');
var router = express.Router();
const userController = require('../controllers/user');
const multer = require('multer');
const upload = multer({ dest: 'uploads/'})

/* GET users listing. */
router.get('/add-account', userController.renderAddAccount);

router.post('/add-account', upload.array('images'), userController.addNewAccount)

module.exports = router;
