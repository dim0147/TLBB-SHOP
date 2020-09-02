let newWindow;

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

    $("#submit").click(function(){
        let username = $("#username").val();
        if(username == ""){
            showAlert("Hãy nhập username!", 2);
            return;
        }

        let password = $("#password").val();
        if(password == ""){
            showAlert("Hãy nhập mật khẩu", 2);
            return;
        }

        $(this).prop("disabled",true);
        setAllowPointer(this, false);
        showAlert("Đang đăng nhập...", 3);
        $.ajax({
            method: "POST",
            url: '/user/login',
            data: {
                username: username,
                password: password,
                remember_me: $("#remember_me").is(":checked"),
                _csrf: $('#_csrf').val()
            },
            success: res => {
                showAlert(res, 1);
                $(this).prop("disabled",false);
                setAllowPointer(this, true);
            },
            error: err => {
                showAlert("Có lỗi xảy ra: " + err.responseText, 0);
                $(this).prop("disabled",false);
                setAllowPointer(this, true);
            }
        })
    });

    $("#loginFB").click(function(){
        newWindow = window.open('/user/login/facebook','_blank','location=yes,height=570,width=520,scrollbars=yes,status=yes');
        setInterval(function(){
            if(newWindow && newWindow.closed){
                window.location.href = "/user/login";
            }
            }, 1000);
    });

    $("#loginGG").click(function(){
        newWindow = window.open('/user/login/google','_blank','location=yes,height=570,width=520,scrollbars=yes,status=yes');
        setInterval(function(){
            if(newWindow && newWindow.closed){
                window.location.href = "/user/login";
            }
            }, 1000);
    });


});


