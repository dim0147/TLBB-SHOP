$("document").ready(function() {
    let rate = 5;
        $('.starrr').starrr({
            rating: $('.starrr').attr('data-rating')
        })

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

    $("#loginFB").click(function(){
        newWindow = window.open('/user/login/facebook','_blank','location=yes,height=570,width=520,scrollbars=yes,status=yes');
        setInterval(function(){
            if(newWindow && newWindow.closed){
                location.reload();
            }
            }, 1000);
    });

    $("#loginGG").click(function(){
        newWindow = window.open('/user/login/google','_blank','location=yes,height=570,width=520,scrollbars=yes,status=yes');
        setInterval(function(){
            if(newWindow && newWindow.closed){
                location.reload();
            }
            }, 1000);
    });

    $("#loginFBRIGHT").click(function(){
        newWindow = window.open('/user/login/facebook','_blank','location=yes,height=570,width=520,scrollbars=yes,status=yes');
        setInterval(function(){
            if(newWindow && newWindow.closed){
                location.reload();
            }
            }, 1000);
    });

    $("#loginGGRIGHT").click(function(){
        newWindow = window.open('/user/login/google','_blank','location=yes,height=570,width=520,scrollbars=yes,status=yes');
        setInterval(function(){
            if(newWindow && newWindow.closed){
                location.reload();
            }
            }, 1000);
    });

    //  Send button
    $("#submitBtn").click(function(){
        
        $(this).prop("disabled",true);
        setAllowPointer(this, false);
        showAlert("Đang đăng nhập...", 3);
        $.ajax({
            method: "POST",
            url: '/user/login',
            data: {
                username: username,
                password: password,
                remember_me: $("#remember_me").is(":checked")
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
    })

    // Start in right menu
    $('.starrr').on('starrr:change', function(e, value){
        showAlert("Đang gửi đánh giá của bạn...", 3, $('#sideAlert'));
        $.ajax({
            method: "POST",
            url: '/account/rate/create-rating',
            data: {
                accountId: $("#idAccount").val(),
                rate: value
            },
            success: res => {
                showAlert(res, 1, $('#sideAlert'));
            },
            error: err => {
                showAlert("Có lỗi xảy ra: " + err.responseText, 0);
                showAlert("Có lỗi xảy ra: " + err.responseText, 0, $('#sideAlert'));
            }
        })
    })
})