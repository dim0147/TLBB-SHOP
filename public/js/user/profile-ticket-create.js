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

    $('#inputGroupSelect').on('change', function(){
        const value = $(this).val();
        $('.inputAccount').addClass('d-none');
        $('.inputUser').addClass('d-none');
        if(value === 'unlock_account')
            $('.inputAccount').removeClass('d-none');
        else if(value === 'unlock_user')
            $('.inputUser').removeClass('d-none');
    })

    $('.btnSubmit').click(function(){
        const type = $('#inputGroupSelect').val();
        const title = $('#titleTicket').val();
        const text = $('#textTicketPost').val();
        let query = {type, title, text, _csrf: $('#_csrf').val()};
        if(type === 'unlock_account')
            query['account_id'] = $('#accountId').val();
        else if (type === 'unlock_user')
            query['user_email'] = $('#userEmail').val();
        else
            return iziToast.error({message: 'Loại không hợp lệ'})

        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fa fa-spinner fa-spin"></i>   Đang gửi...')
        $.ajax({
            url: '/user/profile/create-ticket',
            method: 'POST',
            data: query,
            success: function(res){
                iziToast.success({message: res});
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Gửi phiếu hỗ trợ')
            },
            error: function(err){
                iziToast.error({message: err.responseText});
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Gửi phiếu hỗ trợ')
            }
        })
    })
})