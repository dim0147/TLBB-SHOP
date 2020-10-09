$(document).ready(function(){
    helper.admin.setActiveSideMenu(['link-property', 'link-property-show-property']);
    const table = $('.table').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có Property",
            "info":           "Hiện _START_ tới _END_ Property trong tổng cộng _TOTAL_ Property",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ Property)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ Property",
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
        const nameProperty = $(self).attr('data-property-name');
        const data = {
            'property_id': $(self).attr('data-property-id'),
            _csrf: $('#_csrf').val()
        };

        function deleteProperty(toast){
            $.ajax({
                url: '/admin/property/delete-property',
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
            message: `Bạn muốn xoá item "${nameProperty}"?`,
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-check"></i>   Xoá</button>', function (instance, toast) {
                    deleteProperty({instance, toast})
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