$(document).ready(function(){
    function setAllowPointer(element, value, type = 'pointer'){
        if(value)
            $(element).css('cursor', type);
        else
            $(element).css('cursor', 'not-allowed');
    }

    const table = $('#table_id').DataTable({
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
                    if(data == 'Đang đăng')
                        data = '<p style="color: rgb(238, 142, 15)"><i class="fas fa-dolly-flatbed"></i>   ' + data + '</p>';
                    else if(data == 'Xong')
                        data = '<p style="color: rgb(78, 177, 99)"><i class="fas fa-check"></i>   ' + data + '</p>';
                    else if(data == 'Khoá')
                        data = '<p style="color:  rgb(160, 192, 72)"><i class="fas fa-lock"></i>  ' + data + '</p>';
                    else
                        data = '<p>  ' + data + '</p>';
                    return data;
                }
            },
            { 
                targets: 5, 
                render: function(data, t, row){
                    return '<p style="color: rgb(74, 206, 85)!important">'+data+'</p>'
                }
            },
            { 
                targets: 7, 
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
                targets: 8, 
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
                targets: 9, 
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
                targets: 12,
                render: function(data){
                    if (data == null)
                        data = 0;
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
                targets: 13,
                render: function(data){
                    if (data == 0)
                        return '<p>Chưa có lượt xem</p>' 
                    else
                        return '<p><i class="fas fa-eye"></i>   ' + data +'</p>'
                }
            },
            { // DO HERE
                targets: 14, 
                searchable: false,
                sortable: false,
                render: function(data, t, row){
                    let button = '';
                    if(row[4] === 'Đang đăng'){
                        button += '<button data-name-account="'+row[3]+'" data-id-account="'+ row[0]+'" title="Đánh dấu đã xong" class="btn btn-success btn-sm btnMarkAsDone"><i class="fas fa-check-circle"></i></button>' +
                        '<a target="_blank" href="/account/edit-account/'+ row[0]+'"><button title="Chỉnh sửa" class="btn btn-warning btn-sm btnEdit"><i class="fas fa-edit"></i></button></a>'+
                        '<button data-name-account="'+row[3]+'" data-id-account="'+ row[0]+'" title="Xoá tài khoản" class="btn btn-danger btn-sm btnRemove"><i class="fas fa-trash-alt"></i></button>';
                    }
                    else if(row[4] === 'Xong'){
                        button += '<button data-name-account="'+row[3]+'" data-id-account="'+ row[0]+'" title="Xoá tài khoản" class="btn btn-danger btn-sm btnRemove"><i class="fas fa-trash-alt"></i></button>';
                    }
                    else if(row[4] === 'Khoá'){
                        button += '<button data-id-account="'+ row[0]+'" title="Lí do bị khoá" class="btn btn-info btn-sm btnLock"><i class="fas fa-question-circle"></i></button>';
                    }
                        
                                    
                    return button;
                }
            },
        ],
        rowId: 'Id',
        "processing": true,
        serverSide: true,
        ajax: {
            url: '/user/profile/get-accounts',
            type: 'GET',
            error: function (error) {
                iziToast.error({title: 'Có lỗi khi tải dữ liệu', message: error.responseText, timeout: false})
            }
        }
    })

    $(document).on('click', '.btnMarkAsDone',function(){
        const button = this;

        setAllowPointer(button, false);
        $(button).prop("disabled",true);

        const c_name = $(button).attr('data-name-account');
        const idAccount = $(button).attr('data-id-account');

        let instanceRemoving = null;

        iziToast.show({ // Show confirm dialog
            theme: 'dark',
            close: false,
            icon: 'fas fa-question-circle',
            overlay: 'false',
            title: 'Xác nhận',
            message: 'Bạn muốn đánh dấu tài khoản '+ c_name +' này đã hoàn thành? Bạn không thể chỉnh sửa tài khoản này khi đã đánh dấu hoàn thành',
            position: 'center',
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-check"></i>  Đánh dấu đã xong</button>', // If click button confirm
                    function (instance, toast) {
                        instance.hide({transitionOut: 'fadeOutUp'}, toast, 'mark'); // hide current confirm dialog
                        iziToast.show({ // Create toast removing...
                            theme: 'dark',
                            icon: 'fas fa-angle-double-left',
                            close: false,
                            message: 'Đang đánh dấu hoàn thành tài khoản '+c_name+' ...',
                            timeout: false,
                            onOpening: function(instance, toast){
                                instanceRemoving = toast; // set instance of removing
                            },
                        });
                        $.ajax({
                            url: '/account/mark-done',
                            method: 'PATCH',
                            data: {
                                id: idAccount,
                                status: 'done',
                                _csrf: $('#_csrf').val()
                            },
                            success: function(res){ // Hide instance removing and display success message
                                iziToast.hide({transitionOut: 'fadeOutUp'}, instanceRemoving)
                                iziToast.success({title: 'Thành công', message: res})
                                table.draw(false);
                            },
                            error: function(err){ // Hide instance removing and display error message
                                iziToast.hide({transitionOut: 'fadeOutUp'}, instanceRemoving)
                                iziToast.error({title: 'Có lỗi', message: err.responseText})
                                setAllowPointer(button, true);
                                $(button).prop("disabled", false);
                            }
                        });
                    }
                ], // true to focus
                [
                    '<button><i class="fas fa-times"></i>   Huỷ</button>', 
                    function (instance, toast) {
                        instance.hide({transitionOut: 'fadeOutUp'}, toast, 'discard');
                    }
                ]
            ],
            onClosing: function(instance, toast, closedBy){
                if(closedBy !== 'mark'){
                    setAllowPointer(button, true);
                    $(button).prop("disabled", false);
                }
            }
        });
    });

    $(document).on('click', '.btnRemove', function(){
        const button = this;

        setAllowPointer(button, false);
        $(button).prop("disabled",true);

        let instanceRemoving = null;

        const c_name = $(button).attr('data-name-account');
        const idAccount = $(button).attr('data-id-account');

        iziToast.show({ // Show confirm dialog
            backgroundColor: 'rgb(187, 83, 83)',
            close: false,
            icon: 'fas fa-exclamation-circle',
            overlay: 'false',
            title: 'Xác nhận',
            message: 'Bạn muốn xoá tài khoản ' + c_name + '?',
            position: 'center',
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-trash"></i>  Xoá</button>', // If click button confirm
                    function (instance, toast) {
                        instance.hide({transitionOut: 'fadeOutUp'}, toast, 'delete'); // hide current confirm dialog
                        iziToast.show({ // Create toast removing...
                            theme: 'dark',
                            icon: 'fas fa-trash',
                            close: false,
                            message: 'Đang xoá tài khoản '+c_name+' ...',
                            timeout: false,
                            onOpening: function(instance, toast){
                                instanceRemoving = toast; // set instance of removing
                            },
                        });
                        $.ajax({
                            url: '/account/remove-account',
                            method: 'DELETE',
                            data: {
                                id: idAccount,
                                _csrf: $('#_csrf').val()
                            },
                            success: function(res){ // Hide instance removing and display success message
                                iziToast.hide({transitionOut: 'fadeOutUp'}, instanceRemoving)
                                iziToast.success({title: 'Thành công', message: res})
                                table.draw(false);
                            },
                            error: function(err){ // Hide instance removing and display error message
                                iziToast.hide({transitionOut: 'fadeOutUp'}, instanceRemoving)
                                iziToast.error({title: 'Có lỗi', message: err.responseText})
                                setAllowPointer(button, true);
                                $(button).prop("disabled", false);
                            }
                        });
                    }
                ], // true to focus
                [
                    '<button><i class="fas fa-times"></i>   Huỷ</button>', 
                    function (instance, toast) {
                        instance.hide({transitionOut: 'fadeOutUp'}, toast, 'discard');
                    }
                ]
            ],
            onClosing: function(instance, toast, closedBy){
                if(closedBy !== 'delete'){
                    setAllowPointer(button, true);
                    $(button).prop("disabled", false);
                }
            }
        });
    })  
})