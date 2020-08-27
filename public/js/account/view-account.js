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
                console.log(res);
                displayComment(res);
                
            },
            error: function(err){
                console.log(err);
            }
        })
    }

//     {   
//         account: 1,
//         comment: 1,
//         createdAt: 1,
//         updatedAt: 1,
//         replies: {
//             account: 1,
//             comment: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             parent: 1,
//             userReply: {
//                 _id: 1,
//                 name: 1,
//                 urlImage: 1,
//                 role: 1,
//                 createdAt: 1,
//                 rate: {
//                     rate: 1,
//                     createdAt: 1
//                 }
//             }
//         },
//         userDetail: {
//             _id: 1,
//             name: 1,
//             urlImage: 1,
//             role: 1,
//             createdAt: 1,
//             rate: {
//                 rate: 1,
//                 createdAt: 1
//             }
//         },
//         totalReply: { $size: '$replies' }
//     }
// }

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
        if(comments.length === 0)   return;
        comments.map(function(comment){
            commentObject = {
                _id: comment._id,
                name: comment.userDetail[0].name,
                avatar: comment.userDetail[0].urlImage,
                comment: comment.comment,
                parent: null,
                rate: comment.userDetail[0].rate.length > 0 ? comment.userDetail[0].rate[0].rate : null,
                totalLike: comment.likes.length,
                likeFromUser: comment.likeFromUser.length > 0 ? true : false,
                time: dateFormat(comment.createdAt, 'dddd mmmm d, yyyy')
            }
            let div = createComment(commentObject);
            if(comment.replies.length > 0 )
                comment.replies.map( reply => {
                    replyd = {
                        _id: reply._id,
                        name: reply.userReply[0].name,
                        avatar: reply.userReply[0].urlImage,
                        comment: reply.comment,
                        parent: reply.parent,
                        rate: reply.userReply[0].rate.length > 0 ? reply.userReply[0].rate[0].rate : null,
                        totalLike: reply.likes.length,
                        likeFromUser: reply.likeFromUser.length > 0 ? true : false,
                        time: dateFormat(reply.createdAt, 'dddd mmmm d, yyyy')
                    }
                    createComment(replyd, div);
                });
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
                parent: null
            },
            success: res => {
                console.log(res);
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
                liked: $(this).attr('liked')
            },
            success : res => {
                console.log(res)
            },
            err: err  => {
                console.log(err);
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
})
