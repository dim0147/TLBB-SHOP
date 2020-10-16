$(document).ready(function(){

    helper.admin.setActiveSideMenu(['link-phai', 'link-phai-show']);

    const table = $('.table').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có Phái",
            "info":           "Hiện _START_ tới _END_ Phái trong tổng cộng _TOTAL_ Phái",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ Phái)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ Phái",
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
        rowId: 'Id',
        columnDefs: [
            { targets: 0, visible: false},
            { targets: 4, sortable: false, searchable: false},
        ]
    });

    $(document).on('click', '.btnEditTable', function(){
        const phaiName = $(this).attr('data-phai-name');
        const phaiId = $(this).attr('data-phai-id');

        $('.ipPhaiName').val(phaiName);
        $('.ipPhaiId').val(phaiId);
        $('#exampleModalLabel').html(`Chỉnh sửa phái ${phaiName}`)
    })

    $(document).on('click', '.btnRemove', function(){
        const self = this;
        const phaiName = $(self).attr('data-phai-name');
        const data = {
            'phai_id': $(self).attr('data-phai-id'),
            _csrf: $('#_csrf').val()
        };

        function deletePhai(toast){
            $.ajax({
                url: '/admin/phai/delete',
                method: 'DELETE',
                data,
                success: function(res){
                    toast.instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast.toast, '');
                    table
                    .row( $(self).parents('tr') )
                    .remove()
                    .draw();
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
            icon: 'fas fa-trash',
            title: 'Xác nhận',
            message: `Bạn muốn xoá phái "${phaiName}"?`,
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-check"></i>   Xoá</button>', function (instance, toast) {
                    deletePhai({instance, toast})
                }, true], // true to focus
                ['<button>Đóng</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast, 'buttonName');
                }]
            ],
        });
    })

    $('.btnEdit').click(function(){
        const phaiName =  $('.ipPhaiName').val();
        const phaiId =  $('.ipPhaiId').val();

        $.ajax({
            url: '/admin/phai/edit',
            method: 'PUT',
            data: {
                'phai_name': phaiName,
                'phai_id': phaiId,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                iziToast.success({
                    message: res
                });
                $('#exampleModal').modal('hide');
                $('.btnCloseModal').click();
            },
            error: function(err){
                iziToast.error({message: err.responseText});
            }
        })
    })


})