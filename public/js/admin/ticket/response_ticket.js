$(document).ready(function(){

    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

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

    $('.btnSubmit').click(function(){
        const ticketId = $('#ticketId').val();
        const status = $('#status').val();
        const text = $('#textTicketPost').val();
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fa fa-spinner fa-spin"></i>   Đang phản hồi...');

        $.ajax({
            url: '/admin/ticket/response-ticket',
            method: 'POST',
            data: {
                'ticket_id': ticketId,
                status,
                text,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                iziToast.success({message: res});
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Phản hồi');
            },
            error: function(err){
                iziToast.error({message: err.responseText});
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Phản hồi');
            }
        })
    })


})