$(document).ready(function(){

    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    function showAlert(text, type){
        let alertElement = $("#alert");
        alertElement.removeClass();

        if(type === 1)
            alertElement.addClass("alert alert-success");
        else if(type === 2)
            alertElement.addClass("alert alert-warning");
        else if(type === 3)
            alertElement.addClass("alert alert-dark");
        else if (type === 0)
            alertElement.addClass("alert alert-danger");
        else
            alertElement.addClass("alert alert-dark");
        alertElement.html(text);
    }


    $("#selectReason").on('change', function(){
        if(this.value == 'Khác')
            $('#divIpReason').removeClass('d-none');
        else
            $('#divIpReason').addClass('d-none');
    })

    $('#submit').click(function(){
        const button = this;
        if($('#selectReason').val() == 'Khác' && $('#ipReason').val() == '')
            return showAlert('Xin nhập lí do', 2);
        const reason = $('#selectReason').val() != 'Khác' ?  $('#selectReason').val() : $('#ipReason').val();
        
        setAllowPointer(this, false);
        $(this).prop('disabled', true);

        $.ajax({
            url: '/admin/account/add-lock-reason/' + $('#idAccount').val(),
            type: 'POST',
            data: {
                id: $('#idAccount').val(),
                reason: reason,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                showAlert(res, 1);
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
            },
            error: function(err){
                showAlert(err.responseText, 0);
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
            }
        })
    })

})