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

        let cfPassword = $("#confirm-password").val();
        if(cfPassword == ""){
            showAlert("Hãy xác nhận mật khẩu", 2);
            return;
        }

        let name = $("#name").val();
        if(name == ""){
            showAlert("Hãy nhập tên", 2);
            return;
        }

        let email = $("#email").val();
        if(email == ""){
            showAlert("Hãy nhập email", 2);
            return;
        }

        if(password != cfPassword){
            showAlert("Xác nhận mất khẩu không chính xác", 2);
            return;
        }
        
        if(!$("#term").is(':checked')){
            showAlert("Xin hãy chấp nhận điều khoản!", 0);
            return;
        }

        $(this).prop("disabled",true);
        setAllowPointer(this, false);
        showAlert("Đang tạo tài khoản...", 3);
        $.ajax({
            method: "POST",
            url: '/user/register    ',
            data: {
                username: username,
                password: password,
                cfPassword: cfPassword,
                name: name,
                email: email
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
});