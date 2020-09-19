$("document").ready(function() {

    $('.starrr').starrr({
        rating: $('.starrr').attr('data-rating')
    })

    function fetchComment(){
        
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
                displayComment(res);
                
            },
            error: function(err){
                
            }
        })
    }

    function displayComment(comments){
        /*
            comment = {
                _id,
                name,
                avatar,
                comment,
                parent,
                rate,
                totalLike, (undefined = 0)
                likeFromUser, (undefined = set Like)
                time
            }
        */

        if(comments.data.length === 0)   return;

        const lastIndex = comments.data.length - 1;
        comments.data.map(function(comment, index) {
            commentObject = {
                _id: comment._id,
                name: comment.userDetail[0].name,
                avatar: comment.userDetail[0].urlImage,
                comment: comment.comment,
                parent: null,
                rate: comment.userDetail[0].rate.length > 0 ? comment.userDetail[0].rate[0].rate : null,
                totalLike: comment.likes.length,
                likeFromUser: comment.likeFromUser.length > 0 ? true : false,
                time: dateFormat(comment.createdAt, 'd mmmm, yyyy')
            }
            let div = createComment(commentObject);
            if(comment.replies.data.length > 0 ){
                comment.replies.data.reverse();
                const firstIndex = 0;
                comment.replies.data.map( (reply, i) => {
                    replyd = {
                        _id: reply._id,
                        name: reply.userReply[0].name,
                        avatar: reply.userReply[0].urlImage,
                        comment: reply.comment,
                        parent: reply.parent,
                        rate: reply.userReply[0].rate.length > 0 ? reply.userReply[0].rate[0].rate : null,
                        totalLike: reply.likes.length,
                        likeFromUser: reply.likeFromUser.length > 0 ? true : false,
                        time: dateFormat(reply.createdAt, 'd mmmm, yyyy')
                    }
                    let resultDiv = createComment(replyd, div);
                    if(i === firstIndex && comment.replies.totalLeft != 0){ // end of comment
                        if(Number(comment.totalLeft) > 10)
                            comment.replies.totalLeft = 'Hiển thị thêm trả lời'
                        else
                            comment.replies.totalLeft = 'Hiển thị thêm ' +  comment.replies.totalLeft +' trả lời'
                        $(resultDiv).after('<h6 class="more-replies" parentId="'+ reply.parent +'" continueId="'+reply._id+'" style="color: rgb(18, 177, 18); "><span class="badge badge-success"><i class="fas fa-arrow-down"></i></span>     '+comment.replies.totalLeft + '</h6>')
                    }
                });
            }

            
            if(index === lastIndex && comments.totalLeft != 0){ // end of comment
                if(Number(comments.totalLeft) > 10)
                    comments.totalLeft = 'Hiển thị thêm bình luận'
                else
                    comments.totalLeft = 'Hiển thị thêm ' +  comments.totalLeft +' bình luận'
                $('#comment-section').append('<button id="btn-load-comment" continueId="' + comment._id  + '" style="margin-bottom: 10px" class="btn-load-comment btn btn-large btn-block btn-primary" type="button">' +  comments.totalLeft +'</button>')
                return
            }
        });

    }

    function displayReplyComment(comments, elementToAddBehind){
        if(comments.data.length === 0)   return;

        const firstIndex = 0;
        comments.data.reverse();
        comments.data.map( (reply, i) => {
            replyd = {
                _id: reply._id,
                name: reply.userDetail[0].name,
                avatar: reply.userDetail[0].urlImage,
                comment: reply.comment,
                parent: reply.parent,
                rate: reply.userDetail[0].rate.length > 0 ? reply.userDetail[0].rate[0].rate : null,
                totalLike: reply.likes.length,
                likeFromUser: reply.likeFromUser.length > 0 ? true : false,
                time: dateFormat(reply.createdAt, 'd mmmm, yyyy')
            }
            let resultDiv = createComment(replyd, elementToAddBehind);
            if(i === firstIndex && comments.totalLeft != 0){ // end of comments
                if(Number(comments.totalLeft) > 10)
                    comments.totalLeft = 'Hiển thị thêm trả lời'
                else
                    comments.totalLeft = 'Hiển thị thêm ' +  comments.totalLeft +' trả lời'
                $(resultDiv).after('<h6 class="more-replies" parentId="'+ reply.parent +'" continueId="'+reply._id+'" style="color: rgb(18, 177, 18); "><span class="badge badge-success"><i class="fas fa-arrow-down"></i></span>     '+comments.totalLeft + '</h6>')
            }
        });
    }


    fetchComment();

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
                parent: null,
                _csrf: $('#_csrf').val()
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
                rate: value,
                _csrf: $('#_csrf').val()
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

    $('#comment-section').on('click', 'button.btn-like', function(){
        if(!$('#urlImage').length)
        return;

        if($(this).attr('liked') === 'true'){
            let numb = Number($(this).attr('totalLike')) - 1
            $(this).attr('totalLike', numb)
            $(this).html('<span>' + (numb == 0 ? '' : numb) +'   <i class="far fa-heart"></i> Thích</span>')
            $(this).attr('liked', 'false')
        }
        else if ($(this).attr('liked') === 'false'){
            let numb = Number($(this).attr('totalLike')) + 1
            $(this).attr('totalLike', numb)
            $(this).html('<span>'+  (numb == 0 ? '' : numb) +'   <i class="fas fa-heart"></i> Bỏ Thích</span>')
            $(this).attr('liked', 'true')
        }
        else{
            return alert('Có lỗi xảy ra, vui lòng thử lại sau');
        }
        let element = this;
        $.ajax({
            url: '/account/liked',
            method: 'POST',
            data: { 
                commentId: $(this).parent().attr('comment-own-id'),
                liked: $(this).attr('liked'),
                _csrf: $('#_csrf').val()
            },
            success : res => {
                iziToast.success({
                    title: 'Thành công',
                    message: res,
                })
            },
            err: err  => {
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText,
                })
            }
        })          
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
                parent: $(thisButton).parent().attr('comment-id'),
                _csrf: $("#_csrf").val()
            },
            success: function(res){
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

    $('#comment-section').on('click', 'button.btn-load-comment', function(){
        if(!$('#urlImage').length)
        return;

        setAllowPointer(this, false);
        $(this).prop('disabled', true)
        $(this).html('<i class="fas fa-spinner fa-spin"></i>   Đang tải...</i>');
        const button = this;
        $.ajax({
            method: 'GET',
            url: '/account/get-comments',
            data: {
                accountId: $("#idAccount").val(),
                first_load: false,
                continueId: $(this).attr('continueId'),
                parentId: false
            },
            success: function(res){;
                $(button).remove();
                displayComment(res);
                
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText,
                })
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).text("Hiển thị thêm bình luận")
            }
        })

    });

    $('#comment-section').on('click', 'h6.more-replies', function(){
        if(!$('#urlImage').length)
        return;


        setAllowPointer(this, false);
        $(this).prop('disabled', true)
        $(this).html('<i class="fas fa-spinner fa-spin"></i>   Đang tải...</i>');
        const element = this;
        $.ajax({
            method: 'GET',
            url: '/account/get-comments',
            data: {
                accountId: $("#idAccount").val(),
                first_load: false,
                continueId: $(this).attr('continueId'),
                parentId: $(this).attr('parentId')
            },
            success: function(res){
                displayReplyComment(res, element);
                $(element).remove();
                
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText,
                })
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).text("Hiển thị thêm bình luận")
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
                totalLike, (undefined = 0)
                likeFromUser, (undefined = set Like)
                time
            }
        */

       let parentDiv = '<div class="media" data-test="cc" >';
       let divComment = '<div class="media-body" comment-own-id="'+ comment._id + '" comment-id="' + comment._id + '"  name="'+ comment.name +'" >'
       let replyTextDiv = '';
       if(comment.parent !== null){
           parentDiv = '<div style="margin-left: 50px" class="media">';
           divComment = '<div class="media-body" comment-own-id="'+ comment._id +'" comment-id="' + comment.parent + '"  name="'+ comment.name +'" >'
           replyTextDiv = '<p><i class="fa fa-reply" aria-hidden="true"></i>      Trả lời </p>'
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

       let totalLike = 0;
       let drawNumber = '';

       let likeStatus = 'false';
       let likeFromUserDiv = '<span><i class="far fa-heart"></i> Thích</span>';
       
       if(typeof comment.totalLike !== 'undefined'){
            totalLike = comment.totalLike;
            drawNumber = totalLike
       }
       if(drawNumber == 0)
        drawNumber = '';

       if(typeof comment.likeFromUser !== 'undefined'){
           if(comment.likeFromUser == true){
            likeStatus = 'true';
            likeFromUserDiv = '<span>' +drawNumber  +'   <i class="fas fa-heart"></i> Bỏ Thích</span>';
           }
           else{
            likeStatus = 'false';
            likeFromUserDiv = '<span>' +drawNumber  +'   <i class="far fa-heart"></i> Thích</span>';
           }
       }

        let myvar = parentDiv +
        '										'+
        '										<img src="'+ comment.avatar + '" alt="avater">'+
                                                    divComment +
        '											'+
                                                    divRate + replyTextDiv +
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
        '<button style="margin: 0px; padding: 0px" class="btn btn-like" totalLike="'+ totalLike +'" liked="' + likeStatus +'">' + likeFromUserDiv + '</button>' +
        '<button style="margin-left: 20px; padding: 0px" class="btn btn-createReply"><span><i class="fas fa-comment-dots"></i> Trả Lời</span></button>'+
        '										</div>'+
        '									</div>';
        myvar = $(myvar);
        if(comment.parent == null)
            $('#comment-section').append(myvar);
        else
            $(btnReplyElement).after(myvar);
       return myvar;
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

    $('#btnMark').click(function(e){
        e.preventDefault();
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        iziToast.show({
            timeout: false,
            progressBar: false,
            close: false,
            backgroundColor: 'green',
            messageColor: 'rgb(185, 204, 78)',
            titleColor: 'rgb(212, 195, 37)',
            icon: 'fa fa-question',
            overlay: true,
            title: 'Bạn muốn đánh dấu tài khoản này đã hoàn thành',
            message: 'Bạn không thể chỉnh sửa tài khoản này khi đã đánh dấu hoàn thành, bạn muốn tiếp tục?',
            position: 'center',
            buttons: [
                ['<button><i class="fas fa-check"></i>  Đánh dấu hoàn thành</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'confirm');
                    $.ajax({
                        url: '/account/mark-done',
                        type: 'PATCH',
                        data: {
                            id: $('#idAccount').val(),
                            status: 'done',
                            _csrf: $('#_csrf').val()
                        },
                        success: function(res){
                            iziToast.success({
                                title: 'Hoàn thành',
                                overlay: true,
                                position: 'center',
                                message: res,
                            })
                            setTimeout(function(){ window.location.reload() }, 3000);
                        },
                        error: function(error){
                            iziToast.error({
                                title: 'Có lỗi',
                                overlay: true,
                                position: 'center',
                                message: error.responseText,
                            })
                            setAllowPointer(button, true);
                            $(button).prop('disabled', false);
                        }
                    })
         
                }],
                ['<button><i class="far fa-times-circle"></i>  Huỷ</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'discard');
         
                }],
            ],
            onClosing: function(instance, toast, closedBy){
                if(closedBy != 'confirm'){
                    setAllowPointer(button, true);
                    $(button).prop('disabled', false);
                }
            }
        });
    })

    $('#btnRemove').click(function(e){
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);

        iziToast.show({
            timeout: false,
            progressBar: false,
            close: false,
            backgroundColor: ' rgb(179, 11, 11)',
            messageColor: 'rgb(75, 224, 107)',
            titleColor: 'rgb(75, 224, 107)',
            icon: 'fas fa-exclamation-triangle',
            overlay: true,
            title: 'Xác nhận',
            message: 'Bạn muốn xoá tài khoản này?',
            position: 'center',
            buttons: [
                ['<button><i class="fas fa-trash"></i>  Xoá</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'confirm');
                    $.ajax({
                        url: '/account/remove-account',
                        type: 'DELETE',
                        data: {
                            id: $('#idAccount').val(),
                            _csrf: $('#_csrf').val()
                        },
                        success: function(res){
                            iziToast.success({
                                title: 'Hoàn thành',
                                overlay: true,
                                position: 'center',
                                message: res,
                            })
                            setTimeout(function(){ window.location.href = '/' }, 3000);
                        },
                        error: function(error){
                            iziToast.error({
                                title: 'Có lỗi',
                                overlay: true,
                                position: 'center',
                                message: error.responseText,
                            })
                            setAllowPointer(button, true);
                            $(button).prop('disabled', false);
                        }
                    })
         
                }],
                ['<button><i class="far fa-times-circle"></i>  Huỷ</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'discard');
         
                }],
            ],
            onClosing: function(instance, toast, closedBy){
                if(closedBy != 'confirm'){
                    setAllowPointer(button, true);
                    $(button).prop('disabled', false);
                }
            }
        });
    })

    $('#btnSave').click(function(e){
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        let option = {};
        const isSaved = $(button).attr('is-saved');
        if(isSaved === 'true'){
            option.url = '/user/delete-collection';
            option.method = 'DELETE';
            option.message = 'Bạn có muốn bỏ lưu tài khoản này khỏi bộ sưu tập?';
            option.icon = 'fas fa-trash';
            option.text = 'Bỏ lưu';
        }
        else{
            option.url = '/user/create-collection';
            option.method = 'POST';
            option.message = 'Bạn muốn lưu tài khoản này vào bộ sưu tập?';
            option.icon = 'fas fa-save';
            option.text = ' Lưu';
        }
        iziToast.show({
            timeout: false,
            progressBar: false,
            close: false,
            backgroundColor: 'rgb(64, 68, 156)',
            messageColor: 'rgb(237, 228, 230)',
            titleColor: 'rgb(245, 0, 122)',
            icon: 'fa fa-question',
            overlay: true,
            title: 'Lưu',
            message: option.message,
            position: 'center',
            buttons: [
                ['<button><i class="'+option.icon+'"></i>'+'  '+option.text+'</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'confirm');

                    $.ajax({
                        url: option.url,
                        type: option.method,
                        data: {
                            account: $('#idAccount').val(),
                            _csrf: $('#_csrf').val()
                        },
                        success: function(res){
                            iziToast.success({
                                title: 'Hoàn thành',
                                overlay: true,
                                position: 'center',
                                message: res,
                            })
                            setAllowPointer(button, true);
                            $(button).prop('disabled', false);
                            if(isSaved === 'true'){
                                $(button).html('<i class="fas fa-vote-yea"></i> Lưu vào bộ sưu tập')
                                $(button).attr('is-saved', 'false');
                            }
                            else{
                                $(button).html('<i class="fas fa-close"></i> Bỏ lưu');
                                $(button).attr('is-saved', 'true');
                            }
                               
                        },
                        error: function(error){
                            iziToast.error({
                                title: 'Có lỗi',
                                overlay: true,
                                position: 'center',
                                message: error.responseText,
                            })
                            setAllowPointer(button, true);
                            $(button).prop('disabled', false);
                        }
                    })
         
                }],
                ['<button><i class="far fa-times-circle"></i>  Huỷ</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'discard');
         
                }],
            ],
            onClosing: function(instance, toast, closedBy){
                if(closedBy != 'confirm'){
                    setAllowPointer(button, true);
                    $(button).prop('disabled', false);
                }
            }
        });
    })
})

