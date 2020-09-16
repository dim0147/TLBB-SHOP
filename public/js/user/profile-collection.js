$(document).ready(function(){
    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    $('.unsavedBtn').click(function(){
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fas fa-circle-notch fa-spin"></i>');

        $.ajax(
            {
                url: '/user/delete-collection',
                method: 'DELETE',
                data: {
                    account: $(button).attr('data-account'),
                    _csrf: $('#_csrf').val()
                },
                success: function(res){
                    $(button).parent().parent().parent().parent().remove();
                    iziToast.success({
                        title: 'Thành công',
                        message: res
                    })
                },
                error: function(err){
                    iziToast.error({
                        title: 'Có lỗi',
                        overlay: true,
                        position: 'center',
                        message: err.responseText,
                    })
                    setAllowPointer(button, true);
                    $(button).prop('disabled', false);
                    $(button).html('<i class="fas fa-times" aria-hidden="true"></i>');
                }
            }
        )
    })
})