const config = {
    
    mongodb: {
        uri: 'mongodb://mongo:27017/TLBB-SHOP'
    },

    pathStoreImageUpload: 'public/images/data',

    urlWebsite: 'https://localhost:3000',

    // account for db
    account: {
        transaction_type: ["sell", "trade", "all"],
        status: ['pending', 'approve', 'done'],
        field: ['title', 'c_name', 'level', 'phai', 'vohon', 'amkhi', 'dieuvan', 'ngoc', 'thankhi', 'tuluyen', 'doche', 'longvan', 'server', 'postType', 'price', 'phaigiaoluu', 'loinhan', 'contactFB', 'phone']
    },

    session: {
        secretKey: 'BonSexy',
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
        urlCallBack: 'https://localhost:3000/user/login/facebook/callback'
    },

    googleDEV: {
        clientID:'976094802997-gglm40rjm202ln42ru4mj3cg4ji4k1is.apps.googleusercontent.com', 
        clientSecret:'_GAdt1-wVku-zL-nC0utupZ0',
        urlCallBack: 'https://localhost:3000/user/login/google/callback'
    },

    imgurDEV: {
        clientID: 'bba69b0109addd1',
        API_URL: 'https://api.imgur.com/3/',
        username: 'provandam0369',
        password: '5371165okA'
    }
}

module.exports = config;