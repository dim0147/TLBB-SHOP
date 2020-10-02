
$(document).ready(function(){

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function setAllowPointer(element, value, type = 'pointer'){
        if(value)
            $(element).css('cursor', type);
        else
            $(element).css('cursor', 'not-allowed');
    }

    function setTextFilter(){
        const filter = getParameterByName('filter');
        $("#filter option").each(function()
        {
            if($(this).val() == filter)
                $('#filterText').html('Đang sắp xếp theo ' + $(this).html())
        });
    }

    function loadActivity(){
        const filter = getParameterByName('filter');
        let query = {
            _csrf: $('#_csrf').val()
        }
        if(filter && filter !== 'all') query.filter = filter;
        $.ajax({
            url: '/user/profile/get-activities',
            method: 'GET',
            data: query,
            success: function(res){
                if(Array.isArray(res.activities) && res.activities.length > 0)
                    renderActivity(res.activities, res.totalLeft);
                else if(res.activities.length === 0)
                    $('.activitiesDiv').append('<h1>Chưa có lịch sử hoạt động nào!');
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText,
                    position: 'center',
                    timeout: false
                });
            }
        });
    }

    function renderActivity(activities, totalLeft){
        activities.forEach(function(activity){
            switch(activity.type){
                case 'add-comment':
                    renderAddComment(activity);
                    break;
                case 'add-reply-comment':
                    renderAddReplyComment(activity);
                    break;
                case 'add-new-account':
                    renderAddAccount(activity);
                    break;
                case 'update-account':
                    renderUpdateAccount(activity);
                    break;
                case 'remove-account':
                    renderRemoveAccount(activity);
                    break;
                case 'add-collection':
                    renderAddCollection(activity);
                    break;
                case 'remove-collection':
                    renderRemoveCollection(activity);
                    break;
                case 'like-comment':
                    renderLikeComment(activity);
                    break;
                case 'unlike-comment':
                    renderUnlikeComment(activity);
                    break;
                case 'rate-account':
                    renderRateAccount(activity);
                    break;
                case 'update-rate-account':
                    renderUpdateRateAccount(activity);
                    break;
                case 'view-account-detail':
                    renderViewAccountDetail(activity);
                    break;
                case 'view-user-profile':
                    renderViewUserProfile(activity);
            }
               
        })
        $('#loadMoreBtn').remove();
        if(totalLeft > 0){
            const lastId = activities[activities.length - 1]._id;
            $('.activitiesDiv').append(' <button id="loadMoreBtn" continue-id="'+lastId+'" class="btn btn-large btn-block btn-primary" type="button">Xem thêm '+ totalLeft +' hoạt động</button>')
               
        }
    };

    function renderAddComment(activity){
        const account  = activity.account;

        let divAccount = '';
        if(typeof account.status == 'string' && (account.status == 'pending' || account.status == 'done')){
            divAccount +=     '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name+' - '+account.sub_server.name+' '+
            '                                                <br> '+
            '                                                + Tên nhân vật: '+ account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }
        else if(account.status == 'lock'){
            divAccount += '<p><i class="fas fa-lock"></i>  Tài khoản bị khoá</p>';
        }    
        else if(account.status == 'deleted'){
            divAccount += '<p><i class="fas fa-trash"></i>  Tài khoản không tồn tại hoặc đã bị xoá</p>';
        }    
        else{
            divAccount += '<p>Tài khoản không hợp lệ</p>';
        }
        
        let divComment = '';
        if(activity.comment){
            divComment += '<span>'+activity.comment.comment+'</span>'
        }
        else{
            divComment += '<span>Bình luận không tồn tại hoặc đã bị xoá</span>'
        }

        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color: green"><i class="fas fa-comment"></i>  Bạn đã bình luận ở một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a></h5>'+
                                            divAccount +
        '                                    '+
                                            divComment+
        '                                    <p>'+dateFormat(new Date(activity.createdAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderAddReplyComment(activity){
        let divComment = '';
        if(activity.comment && activity.comment.parent){
            divComment +=  '                                    <h5 style="color:rgb(154, 202, 157)"><i class="fas fa-reply-all"></i>  Bạn đã phản hồi một <a style="color:blue;text-decoration:underline;" href="/account/view-comment/'+activity.comment.parent._id+'">bình luận</a></h5>'+
            '                                    <div style="background: white;width: max-content">'+
            '                                        <span style="color:rgb(116, 145, 151)">'+activity.comment.parent.comment+'</span>'+
            '                                    </div>'+
            '                                    <span>'+activity.comment.comment+'</span>';
        }else if(activity.comment && !activity.comment.parent){
            divComment +=  '                                    <h5 style="color:rgb(154, 202, 157)"><i class="fas fa-reply-all"></i>  Bạn đã phản hồi một bình luận</h5>'+
            '                                    <div style="background: white;width: max-content">'+
            '                                        <span style="color:rgb(116, 145, 151)">Bình luận không tồn tại hoặc bị xoá</span>'+
            '                                    </div>'+
            '                                    <span>'+activity.comment.comment+'</span>';
        }else{
            divComment +=  '                                    <h5 style="color:rgb(154, 202, 157)"><i class="fas fa-reply-all"></i>  Bạn đã phản hồi một bình luận</h5>'+
            '                                    <div style="background: white;width: max-content">'+
            '                                        <span style="color:rgb(116, 145, 151)">Bình luận không tồn tại hoặc bị xoá</span>'+
            '                                    </div>'
        }
        
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
                                         divComment
        '                                    <p>'+dateFormat(new Date(activity.createdAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderAddAccount(activity){
        const account = activity.account;

        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name+' - '+account.sub_server.name+
            '                                                <br> '+
            '                                                + Tên nhân vật: ' +account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color: orange"><i class="fas fa-upload"></i>  Bạn đã đăng lên một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a></h5>'+
                                             divAccount +
        '                                    <p>'+ dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderUpdateAccount(activity){
        const account = activity.account;

        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name +' - '+ account.sub_server.name + 
            '                                                <br> '+
            '                                                + Tên nhân vật: '+account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color: rgb(0, 204, 255)"><i class="fas fa-edit"></i>  Bạn đã chỉnh sửa một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a></h5>'+
                                                divAccount +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderRemoveAccount(activity){
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color: rgb(158, 105, 105)"><i class="fas fa-trash-alt"></i> Bạn đã xoá một tài khoản <button class="showIdBtn" data-id-account="'+activity.account._id+'">Hiện ID tài khoản</button></h5>'+
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderAddCollection(activity){
        const account = activity.account;

        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name +' - '+ account.sub_server.name + 
            '                                                <br> '+
            '                                                + Tên nhân vật: '+account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }

        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color:yellowgreen"><i class="fas fa-bookmark" aria-hidden="true"></i>  Bạn đã lưu một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a> vào hộ sưu tập</h5>'+
                                            divAccount +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderRemoveCollection(activity){
        const account = activity.account;

        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name +' - '+ account.sub_server.name + 
            '                                                <br> '+
            '                                                + Tên nhân vật: '+account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }

        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color:rgb(173, 223, 175)"><i class="fas fa-toilet-paper-slash"></i>  Bạn đã huỷ một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a> khỏi hộ sưu tập</h5>' +
                                            divAccount +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderLikeComment(activity){
        let divComment = '';
        if(activity.comment)
            divComment =  ' <h5 style="color:rgb(201, 58, 194)"><i class="fas fa-heart"></i>  Bạn đã thích một <a style="color:blue;text-decoration:underline;" href="/account/view-comment/'+activity.comment._id+'">bình luận</a></h5>'+
            '            <span>'+activity.comment.comment+'</span>';
        else
            divComment =  ' <h5 style="color:rgb(201, 58, 194)"><i class="fas fa-heart"></i>  Bạn đã thích một bình luận</a></h5>'+
        '            <p>Bình luận không tồn tại hoặc đã bị xoá</p>';
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
                                            divComment +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
            
        $('.activitiesDiv').append(myvar);
    }

    function renderUnlikeComment(activity){
        let divComment = '';
        if(activity.comment)
            divComment =  ' <h5 style="color:rgb(224, 180, 222)"><i class="fas fa-heartbeat"></i>  Bạn đã huỷ thích một <a style="color:blue;text-decoration:underline;" href="/account/view-comment/'+activity.comment._id+'">bình luận</a></h5>'+
            '            <span>'+activity.comment.comment+'</span>';
        else
            divComment =  ' <h5 style="color:rgb(224, 180, 222)"><i class="fas fa-heartbeat"></i>  Bạn đã huỷ thích một bình luận</a></h5>'+
        '            <p>Bình luận không tồn tại hoặc đã bị xoá</p>';
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
                                            divComment +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
            
        $('.activitiesDiv').append(myvar);
    }

    function renderRateAccount(activity){
        const account = activity.account;
        
        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name +' - '+ account.sub_server.name + 
            '                                                <br> '+
            '                                                + Tên nhân vật: '+account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }
        
        let rateDiv = '';
        for (let i = 0; i < activity.rate; i++){
            rateDiv += '<span style="color: rgb(224, 226, 86)"><i class="fas fa-star" aria-hidden="true"></i></span>';
        }
        for(let i = activity.rate; i < 5; i++){
            rateDiv += '<span style="color: rgb(224, 226, 86)"><i class="far fa-star" aria-hidden="true"></i></span>';
        }
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '                                    <h5 style="color: rgb(240, 112, 8)"><i class="fas fa-smile"></i>  Bạn đã đánh giá ở một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a></h5>'+
                                            divAccount      +
        '                                    <div>'+
                                            rateDiv         +
        '                                    </div>'+
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);

    }

    function renderUpdateRateAccount(activity){
        const account = activity.account;
        
        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name +' - '+ account.sub_server.name + 
            '                                                <br> '+
            '                                                + Tên nhân vật: '+account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }
        
        let rateDiv = '';
        for (let i = 0; i < activity.rate; i++){
            rateDiv += '<span style="color: rgb(224, 226, 86)"><i class="fas fa-star" aria-hidden="true"></i></span>';
        }
        for(let i = activity.rate; i < 5; i++){
            rateDiv += '<span style="color: rgb(224, 226, 86)"><i class="far fa-star" aria-hidden="true"></i></span>';
        }
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '<h5 style="color: rgb(199, 100, 20)"><i class="fas fa-smile"></i>  Bạn đã cập nhật đánh giá ở một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a></h5>'+
                                            divAccount      +
        '                                    <div>'+
                                            rateDiv         +
        '                                    </div>'+
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderViewAccountDetail(activity){
        const account = activity.account;

        let divAccount = '';
        if(account.status == 'pending' || account.status == 'done'){
            divAccount = '                                    <div style="margin: 5px;">'+
            '                                        <img style="width:160px;height:130px;display:inline" class="card-img-top img-fluid" src="'+configClient.urlImagePrefix+account.image+'" alt="Card image cap">'+
            '                                        <div style="display: inline-block;" >'+
            '                                            <span style="display: inline;color:purple">'+
            '                                                - '+account.title+' '+
            '                                                <br>'+
            '                                                + Server: '+account.server.name +' - '+ account.sub_server.name + 
            '                                                <br> '+
            '                                                + Tên nhân vật: '+account.c_name+
            '                                            </span>'+
            '                                        </div>'+
            '                                    </div>';
        }else if(account.status == 'lock'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-lock"></i>  Tài khoản này đã bị khoá</p>' +
            ' </div>';
        }else if(account.status == 'deleted'){
            divAccount = ' <div style="margin: 5px;">'+
            '<p><i class="fas fa-trash"></i>  Tài khoản này không còn tồn tại</p>' +
            ' </div>';
        }else{
            divAccount = ' <div style="margin: 5px;">'+
            '<p>Tài khoản không hợp lệ</p>' +
            ' </div>';
        }
        var myvar = '<div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        '<h5 style="color: rgb(199, 20, 160)"><i class="fab fa-twitch"></i>  Bạn đã xem một <a style="color:blue;text-decoration:underline;" href="/account/view-account/'+account._id+'">tài khoản</a></h5>'+
                                                divAccount +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.activitiesDiv').append(myvar);
    }

    function renderViewUserProfile(activity){
        
        let divUser = '';
        if(activity.user)
            divUser =  '                                    <h5 style="color: rgb(20, 199, 20)"><i class="fas fa-glasses"></i>  Bạn đã ghé thăm trang cá nhân của <a style="color:blue;text-decoration:underline;" href="/user/'+activity.user._id+'/accounts">'+activity.user.name+'</a></h5>';
        else
        divUser =  '                                    <h5 style="color: rgb(20, 199, 20)"><i class="fas fa-glasses"></i>  Bạn đã ghé thăm một trang cá nhân, nhưng trang cá nhân này không còn tồn tại</h5>';
        var myvar = ' <div class="row">'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result bg-gray">'+
        divUser +
        '                                    <p>'+dateFormat(new Date(activity.createdAt), 'd mmmm,yyyy')+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
	
        $('.activitiesDiv').append(myvar);
    }

    setTextFilter();

    loadActivity();
    

    $('#filter').on('change', function(){
        const filter =$(this).val();
        window.location.href = '/user/profile/activities?filter=' + filter;
    })

    $(document).on('click', '.showIdBtn', function(){
        $(this).after('<p style="display: inline;">' + $(this).attr('data-id-account') + '</p>');
        $(this).remove();
    });

    $(document).on('click', '#loadMoreBtn', function(){
        const filter = getParameterByName('filter');
        const continueId = $(this).attr('continue-id');
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fas fa-spinner fa-spin"></i> Đang tải');
        let query = {
            _csrf: $('#_csrf').val(),
            continueId: continueId
        }
        if(filter && filter !== 'all') query.filter = filter;
        $.ajax({
            url: '/user/profile/get-activities',
            method: 'GET',
            data: query,
            success: function(res){
                if(Array.isArray(res.activities) && res.activities.length > 0)
                    renderActivity(res.activities, res.totalLeft);
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText,
                    position: 'center',
                    timeout: false
                });
                setAllowPointer(button, true);
                $(button).prop('disabled', false);
                $(button).html('Tải lại');
            }
        });
    });

})