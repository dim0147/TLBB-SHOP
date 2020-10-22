const { sortString, getDateDiff } = helper;
$(document).ready(function(){
    helper.admin.setActiveSideMenu(['link-manager_member', 'link-manager_member-user']);
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
                    return '<a href="/user/' + row[0] + '/accounts"><p class="titleP">'+ data +'</p></a>'
                }
            },
            { 
                targets: 3, // Email
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
                    if(row[6] === 'normal'){
                        let button = '<button data-name-user="'+row[2]+'" data-id-user="'+ row[0]+'" title="Khoá tài khoản này" data-toggle="modal" data-target="#lockModal" class="mb-2 mr-2 btn btn-warning btnLock"><i class="fas fa-key"></i>   </button>';
                        if(helper.admin.isAdmin())
                            button += '<button data-name-user="'+row[2]+'" data-id-user="'+ row[0]+'" title="Duyệt làm quản trị viên" class="mb-2 mr-2 btn btn-alternate btnMakeModerator"><i class="fas fa-star"></i>   </button>';
                        return button
                    }
                    else if(row[6] === 'lock'){
                        return '<button data-name-user="'+row[2]+'" data-id-user="'+ row[0]+'" title="Mở khoá tài khoản" class="btn btn-info btn-sm btnUnLock"><i class="fas fa-lock-open"></i></button>' +
                               '<button data-name-user="'+row[2]+'" data-id-user="'+ row[0]+'" title="Thêm lí do khoá" data-toggle="modal" data-target="#lockModal" style="margin-top: 5px;" class="btn btn-success btn-sm  btnLock"><i class="fa fa-plus-circle" aria-hidden="true"></i></button>' +
                               '<button data-name-user="'+row[2]+'" data-id-user="'+ row[0]+'" title="Xem lí do khoá" style="margin-top: 5px;" class="btn btn-secondary btn-sm btnSeeReason"><i class="fas fa-eye"></i></button>'
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

    // Click on button lock account in table
    $(document).on('click', '.btnLock', function (e) {
        const nameUser = $(this).attr('data-name-user');
        const idUser = $(this).attr('data-id-user');
        $('#lockModalLabel').html(`<i class="fas fa-lock"></i>   Khoá người dùng "${nameUser}"`)
        $('#lockModalLabel').attr('data-id-user', idUser);
    })

    // Click on button unlock in table
    $(document).on('click', '.btnUnLock', function(e) {
        const nameUser = $(this).attr('data-name-user');
        const idUser = $(this).attr('data-id-user');
        const data = {
            'user_id': idUser,
            '_csrf': $('#_csrf').val()
        }
        function unlockAccount(toast){
            $.ajax({
                url: '/api-service/admin/user/unlock',
                method: 'PATCH',
                data,
                success: function(res){
                    toast.instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast.toast, '');
                    table.draw(false);
                    iziToast.success({message: res});
                },
                error: function(err){
                    toast.instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast.toast, '');

                    iziToast.error({message: err.responseText})
                }
            })
        }

        iziToast.show({
            theme: 'dark',
            timeout: false,
            overlay: true,
            progressBar: false,
            icon: 'fas fa-question',
            title: 'Xác nhận',
            message: `Bạn muốn mở khoá tài khoản "${nameUser}"?`,
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-lock-open"></i>   Mở khoá</button>', function (instance, toast) {
                    unlockAccount({instance, toast})
                }, true], // true to focus
                ['<button>Đóng</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast, 'buttonName');
                }]
            ],
        });
    })

    // Click on see reason 
    $(document).on('click', '.btnSeeReason', function(){
        const button = this;
        const nameUser = $(this).attr('data-name-user');
        const idUser = $(this).attr('data-id-user');
        const data = {
            'user_id': idUser,
        }

        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fas fa-spinner fa-pulse"></i>');

        $.ajax({
            url: '/api-service/admin/user/get-lock-reason',
            type: 'GET',
            data,
            success: function(res){
                let divReason = '';
                let title = '';
                if(typeof res === 'object' && res.length > 0){
                    title = 'Khoá vào ngày: ' + dateFormat(new Date(res[Number(res.length) - 1].createdAt), "d mmmm, yyyy");
                    res.forEach(function(reason){ // Convert date and create div
                        const lockAt = reason.createdAt;
                        reason.createdAt = dateFormat(new Date(reason.createdAt), "d mmmm, yyyy");
                        divReason += '- ' + reason.reason + ' ('+getDateDiff(lockAt)+')<br>';
                    })
                }
                else{
                    divReason = 'Không tìm thấy, vui lòng thử lại sau';
                    title = 'Có lỗi xảy ra';
                }
                iziToast.show({
                    theme: 'dark',
                    icon: 'fas fa-lock',
                    iconColor: 'yellow',
                    progressBar: false,
                    title: title,
                    message: divReason,
                    position: 'center', 
                    overlay: true,
                    timeout: false,
                    layout: 2,
                    onClosing: function(instance, toast, closedBy){
                        setAllowPointer(button, true);
                        $(button).prop('disabled', false);
                        $(button).html('<i class="fas fa-eye"></i>')
                    }
                });
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText
                });
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('<i class="fas fa-eye"></i>')
            }
        })

    });

    // Click make moderator
    $(document).on('click', '.btnMakeModerator', function(){
        const nameUser = $(this).attr('data-name-user');
        const idUser = $(this).attr('data-id-user');
        const data = {
            'user_id': idUser,
            '_csrf': $('#_csrf').val()
        }

        function makeModerator(toast){
            $.ajax({
                url: '/api-service/admin/user/make-moderator',
                method: 'PATCH',
                data,
                success: function(res){
                    toast.instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast.toast, '');
                    table.draw(false);
                    iziToast.success({message: res});
                },
                error: function(err){
                    toast.instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast.toast, '');

                    iziToast.error({message: err.responseText})
                }
            })
        }

        iziToast.show({
            theme: 'dark',
            timeout: false,
            overlay: true,
            progressBar: false,
            icon: 'fas fa-star',
            iconColor: 'yellow',
            title: 'Xác nhận',
            titleColor: 'yellow',
            message: `Bạn muốn duyệt "${nameUser}" trở thành Moderator?`,
            messageColor: 'yellow',
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-star"></i>   Duyệt</button>', function (instance, toast) {
                    makeModerator({instance, toast})
                }, true], // true to focus
                ['<button>Đóng</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast, 'buttonName');
                }]
            ],
        });
    })

    // Click on button lock in modals
    $('.btnLockSubmit').click(function(){
        const idUser =  $('#lockModalLabel').attr('data-id-user');
        const reason = $('.dropdown-select').attr('data-choose') !== 'Khác' ? $('.dropdown-select').attr('data-choose') : $('.ipReason').val();
        const data = {
            'user_id': idUser,
            reason,
            _csrf: $('#_csrf').val()
        };
        $.ajax({
            url: '/api-service/admin/user/add-lock-reason',
            method: 'POST',
            data,
            success: function(res){
                $('.btnCloseModal').click();
                $(".btnCloseModal").click(); 
                iziToast.success({message: res});
                table.draw(false);
            },
            error: function(err){
                iziToast.error({message: err.responseText})
            }
        })
    })
    window.addEventListener("load", function () {
        const dropdownItems = document.querySelectorAll(
        "#lightdropdown .dropdown-item"
        );
        const dropdownSelect = document.querySelector(
        "#lightdropdown .dropdown-select"
        );
        const dropdownSelectText = document.querySelector(
        "#lightdropdown .dropdown-selected"
        );
        const dropdownList = document.querySelector(
        "#lightdropdown .dropdown-list"
        );
        const dropdownCaret = document.querySelector(
        "#lightdropdown .dropdown-caret"
        );
        dropdownSelect.addEventListener("click", function () {
        dropdownList.classList.toggle("show");
        dropdownCaret.classList.toggle("fa-angle-up");
        });
        function handleSelectDropdown(e) {
        const { value } = e.target.dataset;
        $('.dropdown-select').attr('data-choose', value);
        if(value === 'Khác')
            $('.ipReason').removeClass('d-none');
        else
            $('.ipReason').addClass('d-none');

        dropdownSelectText.textContent = value;
        dropdownList.classList.remove("show");
        dropdownCaret.classList.remove("fa-angle-up");
        }
        dropdownItems.forEach((el) =>
        el.addEventListener("click", handleSelectDropdown)
        );
        });
})