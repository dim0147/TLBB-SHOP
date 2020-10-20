$(document).ready(function(){
    helper.admin.setActiveSideMenu(['link-ticket', 'link-ticket-show']);

    const table = $('.table').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có Ticket",
            "info":           "Hiện _START_ tới _END_ Ticket trong tổng cộng _TOTAL_ Ticket",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ Ticket)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ Ticket",
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
            {
                targets: 3, // account
                render: data => {
                    if(data)
                        return `<a href="/account/view-account/${data._id}">${data.title}</a>`;
                    else return '';
                }
            },
            {
                targets: 5, // user
                render: data => {
                    if(data){
                        return `<a href="/user/${data._id}/accounts">${data.name}</a>`
                    }
                    else return '';
                }
            },
            {
                targets: 6, // status
                render: data => {
                    if(data === 'Đang chờ')
                        return `<div class="mb-2 mr-2 badge badge-pill badge-warning">Đang chờ</div>`;
                    else if(data === 'Đã trả lời')
                        return `<div class="mb-2 mr-2 badge badge-pill badge-info">Đã trả lời</div>`;
                    else if(data === 'Đã xử lí')
                        return `<div class="mb-2 mr-2 badge badge-pill badge-success">Đã xử lí</div>`;
                    else
                        return data;
                }
            },
            { 
                targets: 7, // createdAt
                render: (data) => {
                    return dateFormat(data, 'd mmmm, yyyy HH:MM:ss');
                }
            },
            { 
                targets: 8, // createdAt
                render: (data) => {
                    return dateFormat(data, "d mmmm, yyyy HH:MM:ss");
                }
            },
            { 
                targets: 9, 
                sortable: false, 
                searchable: false,
                render: (data, t, row) => {
                    if(row[6] === 'Đang chờ')
                        return `<a title="Trả lời ticket" href="/admin/ticket/response-ticket/${row[0]}"><button class="btn btn-primary btn-sm"><i class="fas fa-reply"></i></button></a>`;
                    else if(row[6] === 'Đã xử lí')
                        return `<a title="Thêm trả lời cho ticket" href="/admin/ticket/response-ticket/${row[0]}"><button class="btn btn-dark btn-sm"><i class="fas fa-eye"></i></button></a>`;
                    else if(row[6] === 'Đã trả lời')
                    return `<a title="Xem ticket" href="/admin/ticket/response-ticket/${row[0]}"><button class="btn btn-success btn-sm"><i class="fas fa-plus"></i></button></a>`;
                    else
                        return '';
                }
            },
        ],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/admin/ticket/show/get-tickets',
            type: 'GET',
            // success: function(res){
            //     console.log(res);
            // },
            error: function(err){
                iziToast.error({message: err.responseText})
            }
        }
    });


})