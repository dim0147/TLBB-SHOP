$("document").ready(function() {

    function fetchComment(){
        if($('#loginFB').length) return
        $.ajax({
            method: 'GET',
            url: '/account/fetch-comment/'+$('#idComment').val(),
            success: function(res){
                displayCommentFirstLoad(res);
                
            },
            error: function(err){
                alert('Có lỗI xảy ra khi xem bình luận, vui lòng thử lại sau');
            }
        })
    }

    function displayCommentFirstLoad(comment){
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

        if(!comment) return;

            commentObject = {
                _id: comment._id,
                userId: comment.userDetail._id,
                name: comment.userDetail.name,
                avatar: comment.userDetail.urlImage,
                comment: comment.comment,
                parent: null,
                rate: comment.userDetail.rate,
                totalLike: comment.likes,
                likeFromUser: comment.likeFromUser,
                time: dateFormat(comment.createdAt, 'd mmmm, yyyy')
            }
            let div = createComment(commentObject);
            if(comment.replies.length > 0 ){
                comment.replies.reverse();
                const firstIndex = 0;
                comment.replies.map( (reply, i) => {
                    replyd = {
                        _id: reply._id,
                        userId: reply.userDetail._id,
                        name: reply.userDetail.name,
                        avatar: reply.userDetail.urlImage,
                        comment: reply.comment,
                        parent: reply.parent,
                        rate: reply.userDetail.rate,
                        totalLike: reply.likes,
                        likeFromUser: reply.likeFromUser,
                        time: dateFormat(reply.createdAt, 'd mmmm, yyyy')
                    }
                    let resultDiv = createComment(replyd, div);
                    if(i === firstIndex && comment.totalReplyLeft != 0){ // end of comment
                        if(Number(comment.totalLeft) > 10)
                            comment.totalReplyLeft = 'Hiển thị thêm trả lời'
                        else
                            comment.totalReplyLeft = 'Hiển thị thêm ' +  comment.totalReplyLeft +' trả lời'
                        $(resultDiv).after('<h6 class="more-replies" parentId="'+ reply.parent +'" continueId="'+comment.continueId+'" style="color: rgb(18, 177, 18); "><span class="badge badge-success"><i class="fas fa-arrow-down"></i></span>     '+comment.totalReplyLeft + '</h6>')
                    }
                });
            }

    }

    function displayComment(comments){
        /*
            comment = {
                _id,
                userId,
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
                userId: comment.userDetail[0]._id,
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
                        userId: reply.userReply[0]._id,
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
                userId: reply.userDetail[0]._id,
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
                createComment({_id: res.comment._id, userId: $('#userId').val(), name: res.comment.name, avatar: res.comment.avatar, comment: res.comment.comment, parent: null, rate: res.rate, time: res.comment.createdAt})
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
            err: err  => {
                alert('Có lỗI xảy ra khi thích bình luận, vui lòng thử lại sau');
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
                createComment({_id: res.comment._id, userId:$('#userId').val(), name: res.comment.name, avatar: res.comment.avatar, comment: res.comment.comment, parent: res.comment.parent, rate: res.rate, time: res.comment.createdAt}, $('.replyTextarea').prev());
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
            success: function(res){
                $(button).remove();
                displayComment(res);
                
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText
                });
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
                    message: err.responseText
                });
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).text("Hiển thị thêm bình luận")
            }
        })

    });
    
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


    function createComment(comment, btnReplyElement = null){
        /*
            comment = {
                _id,
                userId,
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
        '												<a href="/user/'+comment.userId+'/accounts"><h5>' + comment.name +'</h5></a>'+
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
})

