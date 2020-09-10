let newWindow;

$(document).ready(function(){


    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    function showAlert(text, type, alertElement = $("#alert")){
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

    $("#btnProfileSubmit").click(function(){
        const name = $('#name').val();
        if(name.length === 0)
            return showAlert('Xin hãy nhập tên', 2);
        const email = $('#email').val();
        if(email.length === 0)
            return showAlert('Xin hãy nhập email', 2);

        const button = this;
        $(this).prop('disabled', true);
        setAllowPointer(this, false);
        showAlert('Xin hãy chờ...', 3);

        $.ajax({
            url: '/user/profile/update-profile',
            method: 'PATCH',
            data: {
                name: name,
                email: email,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                $(button).prop('disabled', false);
                setAllowPointer(button, true);
                showAlert('Cập nhật thành công!', 1);
            },
            error: function(err){
                $(button).prop('disabled', false);
                setAllowPointer(button, true);
                showAlert('Có lỗi xảy ra: ' + err.responseText, 0);
            }
        })

    });

   

});


