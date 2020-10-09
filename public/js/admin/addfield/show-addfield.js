$(document).ready(function(){
    helper.admin.setActiveSideMenu(['link-bosung', 'link-bosung-show']);

    const table = $('.table').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có Bổ sung",
            "info":           "Hiện _START_ tới _END_ Bổ sung trong tổng cộng _TOTAL_ Bổ sung",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ Bổ sung)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ Bổ sung",
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
            { targets: 5, sortable: false, searchable: false},
        ]
    });

    $(document).on('click', '.btnRemove', function(){
        const self = this;
        const nameBosung = $(self).attr('data-addfield-name');
        const data = {
            'addField_id': $(self).attr('data-addfield-id'),
            _csrf: $('#_csrf').val()
        };

        function deleteAddField(toast){
            $.ajax({
                url: '/admin/addfield/delete-addfield',
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
            message: `Bạn muốn xoá bổ sung "${nameBosung}"?`,
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-check"></i>   Xoá</button>', function (instance, toast) {
                    deleteAddField({instance, toast})
                }, true], // true to focus
                ['<button>Đóng</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'fadeOutUp',
                    }, toast, 'buttonName');
                }]
            ],
        });
    })

})