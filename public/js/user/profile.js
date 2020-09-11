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
                showAlert(res, 1);
            },
            error: function(err){
                $(button).prop('disabled', false);
                setAllowPointer(button, true);
                showAlert('Có lỗi xảy ra: ' + err.responseText, 0);
            }
        })

    });

    $("#btnChangePassword").click(function(){
        const password = $('#password').val();
        if(password.length === 0)
            return showAlert('Xin hãy nhập mật khẩu', 2, $('#alert-password'));
        const newPassword = $('#new_password').val();
        if(newPassword.length === 0)
            return showAlert('Xin hãy nhập mật khẩu mới', 2,  $('#alert-password'));
        const confirmPassword = $('#confirm_password').val();
        if(confirmPassword.length === 0)
            return showAlert('Xin hãy nhập confirm mật khẩu', 2,  $('#alert-password'));

        if(newPassword != confirmPassword)    
            return showAlert('Xác nhận mật khẩu không chính xác', 0,  $('#alert-password'));

        const button = this;
        $(this).prop('disabled', true);
        setAllowPointer(this, false);
        showAlert('Xin hãy chờ...', 3, $('#alert-password'));

        $.ajax({
            url: '/user/profile/update-password',
            method: 'PATCH',
            data: {
                password: password,
                new_password: newPassword,
                confirm_password: confirmPassword,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                $(button).prop('disabled', false);
                setAllowPointer(button, true);
                showAlert(res, 1, $('#alert-password'));
            },
            error: function(err){
                $(button).prop('disabled', false);
                setAllowPointer(button, true);
                showAlert('Có lỗi xảy ra: ' + err.responseText, 0, $('#alert-password'));
            }
        });
    })
   

});


