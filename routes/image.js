const express = require('express');
const router = express.Router();

const imageUploadC = require('../controllers/image/image');

router.post('/upload/description', imageUploadC.multerUpload)

module.exports = router;