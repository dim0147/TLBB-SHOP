const { sortString, getDateDiff } = helper;
$(document).ready(function(){
    function setAllowPointer(element, value, type = 'pointer'){
        if(value)
            $(element).css('cursor', type);
        else
            $(element).css('cursor', 'not-allowed');
    }

    const table = $('.tableUser').DataTable({
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
                targets: 0, // Id
                visible: false
            },
            { 
                targets: 1, // Image
                searchable: false,
                sortable: false,
                render: function(data, t, row){
                    return `<img width="42" class="rounded-circle" src="${data}" alt="">`
                }
            },
            { 
                targets: 2, // Name
                render: function(data, t, row){
                    return '<a href="/admin/user/view-user/' + row[0] + '"><p class="titleP">'+ data +'</p></a>'
                }
            },
            { 
                targets: 3, // Email
                // render: function(data, t, row){
                //     // return '<a href="/account/view-account/' + row[0] + '"><p class="nameP">'+ data +'</p></a>'
                // }
            },
            { 
                targets: 4, // Phone
                render: function(data, t, row){
                    if(!data)
                        return 'Không có';
                    else
                        return data;
                }
            },
            { 
                targets: 5, // Facebook 
                render: function(data, t, row){
                    if(!data)
                        return 'Không có';
                    else
                        return `<a href="${data}">${sortString(data, 30)}</a>`;
                }
            },
            { 
                targets: 6, // Status
                render: function(data, t, row){
                    if(data === 'normal')
                        return '<div class="mb-2 mr-2 badge badge-success">Bình Thường</div>';
                    else if(data === 'lock')
                        return '<div class="mb-2 mr-2 badge badge-warning"><i class="fas fa-lock"></i>   Khoá</div>';
                    else
                        return '<div class="mb-2 mr-2 badge badge-danger"><i class="fas fa-question"></i>   Không khả thi</div>';
                }
            },
            {
                targets: 7, // Date join
                render: function(data){
                    return dateFormat(data, "d mmmm, yyyy")
                }
            },
            {
                targets: 8, // Date Last online
                render: function(data){
                    if(data)
                        return getDateDiff(data)
                    else
                        return 'Không biết'
                }
            },
            {
                targets: 9, // Type auth
                render: function(data){
                    if(data === 'web')
                        return '<i style="color: green" title="Xác thực với website" class="fas fa-desktop"></i>'
                    else if(data === 'facebook')
                        return '<i style="color: blue" title="Xác thực với Facebook" class="fab fa-facebook"></i>'
                    else if (data === 'google')
                        return '<i style="color: red" title="Xác thực với Google" class="fab fa-google-plus-g"></i>'
                    else
                        return '<i style="color: dark" title="Không xác định" class="fas fa-question"></i>'
                }
            },
            {
                targets: 10, //  Button
                sortable: false,
                searchable: false,
                render: function(data, t, row){
                    if(row[6] === 'normal')
                        return '<button title="Khoá tài khoản này" class="mb-2 mr-2 btn btn-warning"><i class="fas fa-key"></i>   </button>'
                    else if(row[6] === 'lock'){
                        return '<button data-id-user="'+ row[0]+'" title="Mở khoá tài khoản" class="btn btn-info btn-sm btnLock"><i class="fas fa-lock-open"></i></button>'
                    }
                    else
                        return '<button title="Trạng thái không hợp lệ" class="btn btn-danger btn-sm"><i class="fas fa-exclamation-circle"></i></button>'
                }
            }
        ],
        rowId: 'Id',
        "processing": true,
        serverSide: true,
        ajax: {
            url: '/admin/manager_member/get-users',
            type: 'GET',
            error: function (error) {
                iziToast.error({title: 'Có lỗi khi tải dữ liệu', message: error.responseText, timeout: false})
            }
        },
    })

})