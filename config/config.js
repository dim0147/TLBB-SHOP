const config = {
    mongodb: {
        uri: 'mongodb://mongo:27017/TLBB-SHOP'
    },
    // account for db
    account: {
        server: ['Tình Kiếm', 'Tình Kiếm 2'],
        phai: ['Thiếu Lâm', 'Minh Giáo', 'Cái Bang', 'Võ Đang', 'Nga My', 'Tỉnh Túc', 'Thiên Long', 'Thiên Sơn', 'Tiêu Dao', 'Mộ Dung'],
        vohon: ['Chưa có', 'Sơ Cấp', 'Xuất Sắc', 'Kiệt Xuất', 'Trác Việt', 'Toàn Mỹ'],
        amkhi: ['Chưa có', 'Sơ Cấp', 'Xuất Sắc', 'Kiệt Xuất', 'Trác Việt', 'Toàn Mỹ'],
        thankhi: ['Chưa Có', '105', '119', '119 Giảm Tốc', '119 (1 Thuộc Tính)', '119 (2 Thuộc Tính)', '119 (3 Thuộc Tính)', '119 (4 Thuộc Tính)'],
        tuluyen: ['Chưa có', 'Thấp', 'Bình Thường', 'Cao'],
        ngoc: ['Full 5', 'Full 5 + 6', 'Full 6', 'Full 6 + 7', 'Full 7'],
        doche: ['Chưa có', 'Bình thường', 'Chuẩn', 'Boss'],
        dieuvan: ['Chưa có', 'Full 5', 'Full 5 + 6', 'Full 6', 'Full 6 + 7', 'Full 7'],
        longvan: ['Chưa có', 'Bình thường', 'Cấp 80'],
        bosung: ['Dư nhiều ngọc', 'Có pet boss', 'Có 2 set đồ', 'Có nhiều thần khí', 'Còn điểm tặng'],
        transaction_type: ["sell", "trade"],
        status: ['pending', 'approve', 'done']
    },
    session: {
        secretKey: 'BonSexy',
        cookieRememberMe: 2592000000 // 30 day
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
    }
}

module.exports = config;