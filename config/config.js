const config = {
    
    mongodb: {
        // uri: 'mongodb://mongo:27017/TLBB-SHOP'
        uri: 'mongodb+srv://user123:5371165@cluster0.l9dot.mongodb.net/TLBB-SHOP?retryWrites=true&w=majority'
    },

    pathStoreImageUpload: 'public/images/data',
    pathStoreImageUploadDescription: 'public/images/description',

    urlWebsite: 'https://localhost:3000',

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
        clientID:'339252677259852', 
        clientSecret:'e8cf170990869214504ea05f92d2d914',
        urlCallBack: 'https://tlbb-shop.herokuapp.com/user/login/facebook/callback'
    },

    googleDEV: {
        clientID:'976094802997-gglm40rjm202ln42ru4mj3cg4ji4k1is.apps.googleusercontent.com', 
        clientSecret:'_GAdt1-wVku-zL-nC0utupZ0',
        urlCallBack: 'https://tlbb-shop.herokuapp.com/user/login/google/callback'
    },

    imgurDEV: {
        clientID: 'bba69b0109addd1',
        API_URL: 'https://api.imgur.com/3/',
        username: 'provandam0369',
        password: '5371165okA'
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
        urlImagePrefix: '/images/data/'
    }
}

module.exports = config;