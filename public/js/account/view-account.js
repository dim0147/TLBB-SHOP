$("document").ready(function() {

    $('.starrr').starrr({
        rating: $('.starrr').attr('data-rating')
    })

    function loadComment(){
        
        if($('#loginFB').length) return
        $.ajax({
            method: 'GET',
            url: '/account/get-comments',
            data: {
                accountId: $("#idAccount").val(),
                first_load: true,
                continueId: false,
                parentId: false
            },
            success: function(res){
                console.log(res);
            },
            error: function(err){
                console.log(err);
            }
        })
    }

    loadComment();

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

    //  Comment button
    $("#submitBtn").click(function(){
        if($('#comment').val().length < 5)   return showAlert('Xin hãy nhập ít nhất 5 kí tự!', 2)
        $(this).prop("disabled",true);
        setAllowPointer(this, false);
        showAlert("Đang đăng bình luận...", 3);
        $.ajax({
            method: "POST",
            url: '/account/create-comment',
            data: {
                comment: $('#comment').val(),
                accountId: $("#idAccount").val(),
                parent: null
            },
            success: res => {
                createComment({_id: res.comment._id, name: res.comment.name, avatar: res.comment.avatar, comment: res.comment.comment, parent: null, rate: res.rate, time: res.comment.createdAt})
                showAlert('Đăng bình luận thành công!', 1);
                $('#comment').val('');
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
            url: '/account/create-rating',
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

    $('#comment-section').on('click', 'button.btn-createReply', function(){
        if(!$('#urlImage').length)
        return;
        createInputReplyComment(this);
    });

    $('#comment-section').on('click', 'button.btn-reply', function(){
        if($('#replyTextArea').val().length < 5) return showAlert('Xin hãy nhập ít nhất 5 kí tự', 2, $('#alert-reply'));
        const thisButton = this;
        setAllowPointer(this, false);
        $(this).text('Đang đăng...');
        showAlert('Đang xử lý...', 3, $('#alert-reply'));
        $.ajax({
            method: 'POST',
            url: '/account/create-comment',
            data: {
                comment: $('#replyTextArea').val(),
                accountId: $("#idAccount").val(),
                parent: $(thisButton).parent().attr('comment-id')
            },
            success: function(res){
                console.log(res);
                createComment({_id: res.comment._id, name: res.comment.name, avatar: res.comment.avatar, comment: res.comment.comment, parent: res.comment.parent, rate: res.rate, time: res.comment.createdAt}, $('.replyTextarea').prev());
                $('.replyTextarea').remove();
            },
            error: function(err){
                setAllowPointer(this, true);
                $(thisButton).text('Đăng');
                showAlert('Có lỗi xảy ra: ' + err.responseText, 0, $('#alert-reply'));
            }
        })
    });
    
    function createComment(comment, btnReplyElement = null){
        /*
            comment = {
                _id,
                name,
                avatar,
                comment,
                parent,
                rate,
                time
            }
        */

       let parentDiv = '<div class="media">';
       let divComment = '<div class="media-body" comment-id="' + comment._id + '"  name="'+ comment.name +'" >'
       if(comment.parent !== null){
           parentDiv = '<div style="margin-left: 50px" class="media">';
           divComment = '<div class="media-body" comment-id="' + comment.parent + '"  name="'+ comment.name +'" >'
       }

       let divRate = '';
       if(comment.rate !== null){
           for(let i = 0; i < 5; i ++){
                if(i < comment.rate){
                    divRate += '<li class="list-inline-item">'+
                    '<i class="fa fa-star"></i>'+
                    '</li>'
                }
                else{
                    divRate += '<li class="list-inline-item">'+
                    '<i class="fa fa-star-o"></i>'+
                    '</li>'
                }
           }
           divRate = '<div class="ratings">'+
                    '<ul class="list-inline">'+  
                    divRate +
                    '</ul>'+
                    '</div>';
           
       }

        const myvar = parentDiv +
        '										'+
        '										<img src="'+ comment.avatar + '" alt="avater">'+
                                                    divComment +
        '											'+
                                                    divRate + 
        '											<div class="name">'+
        '												<h5>' + comment.name +'</h5>'+
        '											</div>'+
        '											<div class="date">'+
        '												<p>' + comment.time +'</p>'+
        '											</div>'+
        '											<div class="review-comment">'+
        '												<p>'+
                                                        comment.comment +
        '												</p>'+
        '											</div>'+
        '<button style="margin: 0px; padding: 0px" class="btn btn-like"><span><i class="far fa-heart"></i> Thích</span></button>' +
        '<button style="margin-left: 20px; padding: 0px" class="btn btn-createReply"><span><i class="fas fa-comment-dots"></i> Trả Lời</span></button>'+
        '										</div>'+
        '									</div>';
        if(comment.parent == null)
            $('#comment-section').append(myvar);
        else
            $(btnReplyElement).after(myvar);
    }

    function createInputReplyComment(btnReplyElement){
        $('.replyTextarea').remove();

        let commentId = $(btnReplyElement).parent().attr('comment-id')
        let nameToReply = $(btnReplyElement).parent().attr('name');
        let urlImageOwner = $('#urlImage').val();

        var myvar = '<div style="margin-left: 50px" class="media replyTextarea">' +
        '<img src="' + urlImageOwner + '" alt="avater">' +
        '<div class="media-body">' +
            '<div class="review-comment" comment-id="' + commentId +'">' +
                '<p><i class="fa fa-reply" aria-hidden="true"></i>    Trả lời ' + nameToReply + '</p>' +
                '<textarea name="" id="replyTextArea" rows="9" class="form-control"></textarea>' +
                '<br><div id="alert-reply" class="alert alert-secondary d-none" role="alert">' +
                '</div>' +
                '<button style="margin-top: 10px" class="btn btn-primary pull-right btn-reply">Đăng</button>' +
           ' </div>' +
        '</div>' +
   ' </div>' 

        $(btnReplyElement).parent().parent().after(myvar)
    }
})

