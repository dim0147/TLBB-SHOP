$(document).ready(function(){
    $('#table_id').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có tài khoản",
            "info":           "Hiện _START_ tới _END_ tài khoản trong tổng cộng _TOTAL_ tài khoản",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ tài khoản)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ tài khoản",
            "loadingRecords": "Đang tải...",
            "processing":     "Đang xử lí...",
            "search":         "Tìm kiếm:",
            "zeroRecords":    "Không tìm thấy kết quả",
            "paginate": {
                "first":      "Đầu",
                "last":       "Cuối",
                "next":       "Tiếp theo",
                "previous":   "Trước"
            }   
        },
        columnDefs: [
            { 
                targets: 0, 
                visible: false
            },
            { 
                targets: 1,
                searchable: false,
                sortable: false,
                render: function(data, t, row){
                    return '<a href="/account/view-account/' + row[0] + '"><img src="/images/data/'+data+'" width=100 height=70></a>'
                }
            },
            { 
                targets: 2, 
                render: function(data, t, row){
                    return '<a href="/account/view-account/' + row[0] + '"><p class="titleP">'+ data +'</p></a>'
                }
            },
            { 
                targets: 3, 
                render: function(data, t, row){
                    return '<a href="/account/view-account/' + row[0] + '"><p class="nameP">'+ data +'</p></a>'
                }
            },
            { 
                targets: 4, 
                render: function(data, t, row){
                    return '<p style="color: rgb(74, 206, 85)!important">'+data+'</p>'
                }
            },
            { 
                targets: 6, 
                render: function(data, t, row){
                    let div = null;
                    if(data == "Bán và giao lưu")
                        div = '<p style="color:orange!important">'+ data +'</p>'
                    else if(data == 'Giao lưu')
                        div = '<p style="color:red!important">'+ data +'</p>'
                    else
                        div = '<p style="color:blue!important">'+ data +'</p>'
                    return div;
                }
            },
            {
                targets: 7, 
                render: function(data){
                    let div = null;
                    if(data == null)
                        div = '<p style="color: red"><i class="fa fa-ban" aria-hidden="true"></i></p>';
                    else
                        div = '<p style="color:rgb(17, 194, 170)!important">' + Number(data).toLocaleString('en-US', {style : 'currency', currency : 'VND'}) + '</p>';
                    return div
                }
            },
            {
                targets: 8, 
                render: function(data){
                    let div = null;
                    if(data == 'Không có')
                        div =  '<p style="color: red"><i class="fa fa-ban" aria-hidden="true"></i></p>';
                    else
                        div = '<p style="color:rgb(194, 17, 135)!important">' + data + '</p>';
                    return div
                }
            },
            {
                targets: 11,
                render: function(data){
                    if (data == null)
                        data = 5;
                    data = Math.floor(data);
                    let divStart = '';
                    for(let i = 0; i < data; i++){
                        divStart += '<span style="color: red"><i class="fas fa-star"></i></span>'
                    }
                    for(let i = data; i < 5; i++){
                        divStart += '<span style="color: red"><i class="far fa-star"></i></span>'
                    }

                    return divStart;
                }
            },
            {
                targets: 12,
                render: function(data){
                    if (data == 0)
                        return '<p>Chưa có lượt xem</p>' 
                    else
                        return '<p><i class="fas fa-eye"></i>   ' + data +'</p>'
                }
            },
            { // DO HERE
                targets: 13, 
                searchable: false,
                sortable: false,
                render: function(){
                    return '<button class="btn btn-warning btn-small"><i class="fa fa-home"></i></button>';
                }
            },
        ],
        rowId: 'Id',
        "processing": true,
        serverSide: true,
        ajax: {
            url: '/user/profile/get-accounts',
            type: 'GET'
        }
    })
})