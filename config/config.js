const config = {
    
    mongodb: {
        // uri: 'mongodb://mongo:27017/TLBB-SHOP'
        uri: process.env.MONGO_URI
    },

    pathStoreImageUpload: 'public/images/data',
    pathStoreImageUploadDescription: 'public/images/description',

    urlWebsite: process.env.WEBSITE_URL,

    // account for db
    account: {
        transaction_type: ["sell", "trade", "all"],
        status: ['pending', 'done', 'lock'],
        allowField: [
            'title', 
            'c_name', 
            'level', 

            'phai',

            'sub_server', // parent field

            'postType', 
            'price', 
            'phaigiaoluu',

            'loinhan', 
            'contactFB', 
            'phone'
        ],
        popAcFields: [
            {
                path: 'phai',
                model: 'phais',
                select: '_id name'
            },
            {
                path: 'phaigiaoluu',
                model: 'phais',
                select: '_id name'
            },
            {
                path: 'sub_server',
                model: 'item-properties',
                select: '_id name'
            }
        ]
    },

    session: {
        secretKey: 'BonSexy',
        key: 'tlbb-shop',
        cookieRememberMe: 2592000000 // 30 day
    },

    view: {
        menu: {
            listItemToShow: ['ngoc', 'dieuvan']
        }
        
    },

    facebookDEV: {
        clientID: process.env.FB_APP_ID, 
        clientSecret: process.env.FB_APP_ID,
        urlCallBack: process.env.FB_CALLBACK_URL,
    },

    googleDEV: {
        clientID:'976094802997-gglm40rjm202ln42ru4mj3cg4ji4k1is.apps.googleusercontent.com', 
        clientSecret:'_GAdt1-wVku-zL-nC0utupZ0',
        urlCallBack: 'https://tlbb-shop.herokuapp.com/user/login/google/callback'
    },

    imgurDEV: {
        clientID: process.env.IMGUR_CLIENT_ID,
        API_URL: 'https://api.imgur.com/3/',
        username: process.env.IMGUR_USERNAME,
        password: process.env.IMGUR_PASSWORD
    },

    notifyText: {
        'comment-on-my-account': '${userAndOther} đã bình luận về tài khoản của bạn: "${titleAccount}"',
        'rate-my-account': '${userAndOther} đã đánh giá về tài khoản của bạn: "${titleAccount}"',
        'place-offer-on-my-account': '${userAndOther} đã đưa ra đề nghị về tài khoản của bạn: "${titleAccount}"',
        'reply-my-comment': '${userAndOther} đã phản hồi bình luận của bạn: "${comment}"',
        'like-my-comment': '${userAndOther} đã thích bình luận của bạn: "${comment}"',
        'admin-lock-account': 'Tài khoản "${account_c_name}" đã bị khoá, bấm vào đây để xem lí do khoá, vui lòng liên hệ hỗ trợ để biết thêm thông tin',
    },

    client: {
        urlImagePrefix: `${process.env.IMAGE_DATA_URL}/images/data/`
    }
}

module.exports = config;