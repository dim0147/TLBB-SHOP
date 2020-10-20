$(document).ready(function(){

    helper.admin.setActiveSideMenu(['link-report', 'link-report-show']);

    
    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    const table = $('.table').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "Không có Báo cáo",
            "info":           "Hiện _START_ tới _END_ Báo cáo trong tổng cộng _TOTAL_ Báo cáo",
            "infoEmpty":      "Hiện 0 tới 0 của 0 mục",
            "infoFiltered":   "(Lọc từ _MAX_ toàn bộ Báo cáo)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Hiện _MENU_ Báo cáo",
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
                targets: 2, // account
                render: data => {
                    if(data)
                        return `<a href="/account/view-account/${data._id}">${data.title}</a>`;
                    else return '';
                }
            },
            { 
                targets: 3, // conversation
                sortable: false,
                render: data => {
                    if(data && data.peoples && data.peoples.length > 0){
                        const nameNavigation = data.peoples.map(user => {
                            return `<a href="/user/${user._id}/accounts">${user.name}</a>`
                        });
                        return nameNavigation.join(',') + (`(<a href="/admin/report/conversation/${data._id}">Xem cuộc trò chuyện này</a>)`);
                    }
                    else return '';
                }
            },
            {
                targets: 4, // user
                render: data => {
                    if(data){
                        return `<a href="/user/${data._id}/accounts">${data.name}</a>`
                    }
                    else return '';
                }
            },
            {
                targets: 6,
                render: data => {
                    if(data === 'Đang chờ')
                        return `<div class="mb-2 mr-2 badge badge-pill badge-warning">Đang chờ</div>`;
                    else if(data === 'Đã xử lí')
                        return `<div class="mb-2 mr-2 badge badge-pill badge-success">Đã xử lí</div>`;
                    else
                        return data;
                }
            },
            { 
                targets: 7, // owner
                render: (data) => {
                    if(data){
                        return `<a href="/user/${data._id}/accounts">${data.name}</a>`
                    }
                    else return '';
                }
            },
            { 
                targets: 8, 
                sortable: false, 
                searchable: false,
                render: (data, t, row) => {
                    if(row[6] === 'Đang chờ')
                        return `<button data-report-id="${row[0]}" data-report-owner="${row[7] ?  row[7].name : 'Người dùng không khả dụng'}" data-report-type="${row[1]}" title="Phản hồi báo cáo này" data-toggle="modal" data-target="#responseModal"  class="btn btn-primary btn-sm btnResponse"><i class="fas fa-reply"></i></button>`;
                    else if(row[6] === 'Đã xử lí')
                    return `<a href="/admin/report/add-response/${row[0]}"><button data-report-id="${row[0]}" data-report-owner="${row[7] ?  row[7].name : 'Người dùng không khả dụng'}" data-report-type="${row[1]}" title="Thêm phản hồi cho báo cáo này" class="btn btn-success btn-sm"><i class="fas fa-plus"></i></button>`;
                }
            },
        ],
        processing: true,
        serverSide: true,
        ajax: {
            url: '/admin/report/show/get-reports',
            type: 'GET',
            error: function(err){
                iziToast.error({message: err.responseText})
            }
        }
    });

    $(document).on('click', '.btnResponse', function(){
        const reportId = $(this).attr('data-report-id');
        const ownerName = $(this).attr('data-report-owner');
        const type = $(this).attr('data-report-type');

        $('#responseModalTitle').html(`<i class="fas fa-reply" aria-hidden="true"></i>   Phản hồi báo cáo "${type}" của người dùng ${ownerName}`);
        $('#reportId').val(reportId);
    })

    $('.btnSendReply').click(function(){
        const button = this;
        const reportId = $('#reportId').val();
        setAllowPointer(this, false);
        $(button).prop('disabled', true);
        $(this).html('<i class="fas fa-spinner fa-spin"></i>   Đang gửi phản hồi...');
        $.ajax({
            url: '/api-service/admin/report/create-response',
            method: 'POST',
            data: {
                'report_id': reportId,
                'response_text': $('#repText').val(),
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Phản hồi');
                $('#responseModal').modal('hide');
                $('.btnClose').click();
                table.draw(false);
                iziToast.success({message: res})
            },
            error: function(err){
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Phản hồi');
                iziToast.error({message: err.responseText})
            }
        })
    })

})