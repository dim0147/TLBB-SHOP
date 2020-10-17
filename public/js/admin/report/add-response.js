$(document).ready(function(){


    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    $('#submit').click(function(){
        const reply = $('#resText').val();
        const reportId = $('#reportId').val();

        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);


        $.ajax({
            url: '/api-service/admin/report/create-response',
            method: 'POST',
            data: {
                'report_id': reportId,
                'response_text': reply,
                _csrf: $('#_csrf').val() 
            },
            success: function(res){
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                iziToast.success({message: res});
                $('#resText').val('');
            },
            error: function(err){
                iziToast.error({message: err.responseText});
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
            }
        })
    })


})