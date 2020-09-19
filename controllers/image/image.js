const multer = require('multer');
const path = require('path');
const fs = require('fs');

const helper = require('../../help/helper');
const config = require('../../config/config');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, config.pathStoreImageUploadDescription + '/')
    },
    filename: function (req, file, cb) {
        let nameImage = helper.generateRandomString(9) + path.extname(file.originalname);
        do{
            nameImage = helper.generateRandomString(9) + path.extname(file.originalname);
        }while(fs.existsSync(config.pathStoreImageUploadDescription + '/' + nameImage))
      cb(null, nameImage)
    }
})

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
      var ext = path.extname(file.originalname);
      if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
          req.errorImage = true;
          return callback('Ảnh không hợp lệ')
      }
      callback(null, true)
    }, 
}).single('fileToUpload');

exports.multerUpload = (req, res) => {
    upload(req, res, err => {
        if(err){
            console.log('Có lỗi khi upload image description');
            console.log(err);
            return res.status(400).send(
                {
                    success: false,
                    file: null
                }
            )
        }
        res.send({
            success: true,
            file: '/images/description/' + req.file.filename
        })

    });
}