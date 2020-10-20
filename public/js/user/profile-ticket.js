$(document).ready(function(){
    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }
    
    const loadingGUI = '<div class="loadingGUI" style="padding-left: 50%">'+
    '                                <div class="dashed-loading"></div>'+
    '                            </div>';
        


    function loadTicketResponse(ticketId){
        $('.loadingGUI').remove();
        $('.responseDiv').remove();
        $('.message-sideright').html(loadingGUI);
        $.ajax({
            url: '/user/profile/tickets/get-ticket-response',
            method: 'GET',
            data: {
                'ticket_id': ticketId
            },
            success: function(res){
                $('.loadingGUI').remove();
                renderTicketPost(res);
            },
            error: function(err){
                iziToast.error({message: err.responseText});
                $('.loadingGUI').remove();
            }
        })
    }

    function renderTicketPost(res){
        if(!res || !res.ticket || !res.ticketPosts ) return;

        const {ticket, ticketPosts} = res;

        // Analyze type
        let type = '';
        if(ticket.type === 'unlock_account')
            type = 'Mở khoá bài đăng';
        else if(ticket.type === 'unlock_user') 
            type = 'Mở khoá tài khoản';
        else type = ticket.type;

        // Analyze status
        let status = '';
        if(ticket.status === 'pending')
            status = '<div class="mb-2 mr-2 badge badge-pill badge-warning">Đang chờ</div>';
        else if(ticket.status === 'response') 
            status = '<div class="mb-2 mr-2 badge badge-pill badge-info">Đã trả lời</div>';
        else if(ticket.status === 'done') 
            status = '<div class="mb-2 mr-2 badge badge-pill badge-success">Đã xử lí</div>';
        else status = ticket.status;

        // Analyze email or account
        let infoRequire = '';
        if(ticket.type === 'unlock_account' && ticket.account)
            infoRequire = `Id bài đăng: ${ticket.account}`;
        else if(ticket.type === 'unlock_user') 
            infoRequire = `Email tài khoản cần hỗ trợ: ${ticket.email}`;
        
        
        const divIntro = '<div class="intro">'+
        `                                <h6>Mã phiếu: ${ticket._id}</h6>`+
        `                                <h6>Tiêu đề: ${ticket.title}</h6>`+
        `                                <h6>Loại: ${type}</h6>`+
        `                                <h6>${infoRequire}</h6>`+
        `                                <h6>Trạng thái: ${status}</h6>`+
        '                            </div>';
        $('.message-sideright').append(divIntro);


        // Analyze ticketPost
        ticketPosts.forEach(post => {
            if(!post.owner) return;

            let role = '';
            if(post.owner.role === 'moderator')
                role = '<small>(<i class="fas fa-star" aria-hidden="true"></i>   Quản trị viên)</small>';
            else if(post.owner.role === 'admin')
                role = '<small>(<i class="fas fa-user-shield" aria-hidden="true"></i>   Admin)</small>';
            var myvar = '<div class="panel">'+
            '                                <div class="card-header">'+
            '                                    <div class="media">'+
            '                                        <a'+
            '                                        class="float-left" href="#">'+
            `                                            <img src="${post.owner.urlImage}" alt="${post.owner.name}"  width="50" height="40" `+
            '                                            class="rounded-circle avatar">'+
            '                                            </a>'+
            '                                            <div class="media-body">'+
            `                                                 <h4 class="media-heading">${post.owner.name} ${role}</h4>`+
            `                     <small>${dateFormat(post.createdAt, 'd mmmm, yyyy HH:MM:ss')}</small>`+
            '                                            </div>'+
            '                                    </div>'+
            '                                </div>'+
            '                                <!-- /.card-header -->'+
            '                                <div class="card-body">'+
                                            post.text                                    
            '                                </div>'+
            '                                <!-- /.card-body -->'+
            '                            </div>';
            $('.message-sideright').append(myvar);
        })

        if(ticket.status === 'response'){
            $('.message-sideright').append(`<div class="responseDiv"><hr><h5>Phản hồi của bạn:</h5><textarea id="textTicketPost" class="border p-3 w-100" rows="7"></textarea><div class="text-center"></div><button data-ticket-id="${ticket._id}" class="btn btn-primary btnSendResponse">Gửi phản hồi</button></div>`);
            $('#textTicketPost').trumbowyg({
                svgPath: '/plugins/Trumbowyg/icons.svg',
                lang: 'vi',
                btns: [
                    ['upload'],
                    ['noembed'],
                    ['fontsize'],
                    ['link'],
                    ['strong', 'em'],
                    ['horizontalRule'],
                    ['justifyLeft', 'justifyCenter', 'justifyRight'],
                    ['removeformat'],
                    ['undo', 'redo'],
                    ['fullscreen']
                ],
                plugins: {
                    upload: {
                        serverPath: '/image/upload/description?_csrf='+ $('#_csrf').val(),
                        urlPropertyName: 'file',
                        imageWidthModalEdit: true
                    }
                },
                minimalLinks: true
            });        
        }
            

    }

    $(document).on('click', '.btnSendResponse', function(){
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fa fa-spinner fa-spin"></i>   Đang gửi phản hồi');

        const text = $('#textTicketPost').val();
        const ticketId = $(this).attr('data-ticket-id');
        $.ajax({
            url: '/user/profile/tickets/response-ticket',
            method: 'POST',
            data: {
                text,
                'ticket_id' : ticketId,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                iziToast.success({message: res});
                $('.responseDiv').remove();
            },
            error: function(err){
                iziToast.error({message: err.responseText});
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Gửi phản hồi');
            }
        })
    })

    $('.divTicket').click(function(e){
        e.preventDefault();
        $('.divTicket').each(function(){
            $(this).removeClass('active');
        })
        $(this).addClass('active');

        const ticketId = $(this).attr('data-ticket-id');
        loadTicketResponse(ticketId);
    })
    
})