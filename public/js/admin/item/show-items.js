$(document).ready(function(){
    const table = $('.table').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có Item",
            "info":           "Hiện _START_ tới _END_ Item trong tổng cộng _TOTAL_ Item",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ Item)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ Item",
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
            { targets: 6, sortable: false, searchable: false},
        ]
    });

    $(document).on('click', '.btnRemove', function(){
        const self = this;
        const nameItem = $(self).attr('data-item-name');
        const data = {
            'item_id': $(self).attr('data-item-id'),
            _csrf: $('#_csrf').val()
        };

        function deleteItem(toast){
            $.ajax({
                url: '/admin/item/delete-item',
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
            message: `Bạn muốn xoá item "${nameItem}"?`,
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button><i class="fas fa-check"></i>   Xoá</button>', function (instance, toast) {
                    deleteItem({instance, toast})
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