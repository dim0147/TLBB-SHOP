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
        const status = getParameterByName('status');
        $("#filter option").each(function()
        {
            if($(this).val() == filter)
                $('#filterText').html('Đang sắp xếp theo ' + $(this).html())
        });
        $("#status option").each(function()
        {
            if($(this).val() == status)
                $('#filterText').html($('#filterText').html() + ', Trạng thái: ' + $(this).html())
        });
    }

    function loadNotifications(){
        const filter = getParameterByName('filter');
        const status = getParameterByName('status');
        let query = {
            _csrf: $('#_csrf').val()
        }
        if(filter && filter !== 'all') query.filter = filter;
        if(status && status !== 'all') query.status = status;
        $.ajax({
            url: '/user/profile/get-notifications',
            method: 'GET',
            data: query,
            success: function(res){
                    console.log(res);
                    $('#loadingDiv').remove();
                    if(res.notifications.length === 0)
                        $('.notificationsDiv').append('<h1>Chưa có lịch sử hoạt động nào!');
                    else
                        renderNotification(res);
            },
            error: function(err){
                $('#loadingDiv').remove();
                iziToast.error({
                    title: 'Có lỗi',
                    message: err.responseText,
                    position: 'center',
                    timeout: false
                });
            }
        });
    }

    function renderNotification(res){
        let listIdNotifications = [];
        res.notifications.forEach(function(notification){
            switch(notification.type){
                case 'comment-on-my-account':
                    renderAddComment(notification);
                    break;
                case 'reply-my-comment':
                    renderAddReplyComment(notification);
                    break;
                case 'like-my-comment':
                    renderLikeComment(notification);
                    break;
                case 'admin-lock-account':
                    renderLockAccount(notification);
                    break;
            }
            listIdNotifications.push(notification._id);
        })
        $('#loadMoreBtn').remove();
        if(res.totalLeft > 0)
            $('.notificationsDiv').append(' <button id="loadMoreBtn" continue-time="'+res.continueTime+'" exclude-id="'+res.excludeId+'" class="btn btn-large btn-block btn-primary" type="button">Xem thêm '+ res.totalLeft +' thông báo</button>')      
        updateSeenNotifications(listIdNotifications, 'seen');
    }

    function renderAddComment(notification){
        if(!notification.account || !notification.text)
            return
        const text  = notification.text;
        const bg = notification.status === 'read' ? null : 'bg-gray';
        var myvar = '<div class="row divNotification" data-notification-id="'+notification._id+'" data-href="/account/view-account/'+notification.account._id+'" >'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result '+bg+' titleNotification">'+
        '                                    <h5 style="color: green"><i class="fas fa-comment"></i>  '+text+'</h5>'+
        '                                    <p>'+dateFormat(new Date(notification.updatedAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.notificationsDiv').append(myvar);
    }

    function renderAddReplyComment(notification){
        if(!notification.comment || !notification.text)
        return
        const text  = notification.text;
        const bg = notification.status === 'read' ? null : 'bg-gray';
        var myvar = '<div class="row divNotification" data-notification-id="'+notification._id+'" data-href="/account/view-comment/'+notification.comment._id+'" >'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result '+bg+' titleNotification">'+
        '                                    <h5 style="color:#b366ff"><i class="fas fa-reply-all"></i>  '+text+'</h5>'+
        '                                    <p>'+dateFormat(new Date(notification.updatedAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.notificationsDiv').append(myvar);
    }

    function renderLikeComment(notification){
        if(!notification.comment || !notification.text) return
        const text  = notification.text;
        const bg = notification.status === 'read' ? null : 'bg-gray';
        var myvar = '<div class="row divNotification" data-notification-id="'+notification._id+'" data-href="/account/view-comment/'+notification.comment._id+'" >'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result '+bg+' titleNotification">'+
        '                                    <h5 style="color:rgb(201, 58, 194)"><i class="fas fa-heart"></i>  '+text+'</h5>'+
        '                                    <p>'+dateFormat(new Date(notification.updatedAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.notificationsDiv').append(myvar);
    }

    function renderLockAccount(notification){
        if(!notification.account || !notification.text)
            return
        const text  = notification.text;
        const bg = notification.status === 'read' ? null : 'bg-gray';
        var myvar = '<div class="row divNotification" data-notification-id="'+notification._id+'" data-href="/user/profile/accounts?id='+notification.account._id+'" >'+
        '                            <div class="col-md-12">'+
        '                                <div class="search-result '+bg+' titleNotification">'+
        '                                    <h5 style="color: orange"><i class="fas fa-lock"></i>  '+text+'</h5>'+
        '                                    <p>'+dateFormat(new Date(notification.updatedAt), "d mmmm, yyyy")+'</p>'+
        '                                </div>'+
        '                            </div>'+
        '                        </div>';
        $('.notificationsDiv').append(myvar);
    }

    function updateSeenNotifications(listIdNotifications, status){
        $.ajax({
            url: '/user/profile/update-notification',
            method: 'PATCH',
            json: true,
            data: {
                listIdNotifications: listIdNotifications,
                status: status,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log(res);
            },
            error: function(err){
                console.log(err);
            }
        })
    }

    $(document).on('click', '.divNotification', function(){
        const div = this;
        const idNotification = $(div).attr('data-notification-id');
        updateSeenNotifications([idNotification], 'read');
        window.location.href = $(div).attr('data-href');
       
    });

    $(document).on('click', '#loadMoreBtn', function(){
        const filter = getParameterByName('filter');
        const status = getParameterByName('status');
        const excludeId = $(this).attr('exclude-id');
        const continueTime = $(this).attr('continue-time');
        const button = this;
        setAllowPointer(button, false);
        $(button).prop('disabled', true);
        $(button).html('<i class="fas fa-spinner fa-spin"></i> Đang tải');
        let query = {
            _csrf: $('#_csrf').val(),
        }
        if(filter && filter !== 'all') query.filter = filter;
        if(status && status !== 'all') query.status = status;
        if(excludeId) query.excludeId = excludeId;
        if(continueTime) query.continueTime = continueTime;
        $.ajax({
            url: '/user/profile/get-notifications',
            method: 'GET',
            data: query,
            success: function(res){
                console.log(res);
                if(Array.isArray(res.notifications) && res.notifications.length > 0)
                    renderNotification(res);
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
    })

    $('.searchBtn').click(function(){
        const filter = $('#filter').val();
        const status = $('#status').val();
        window.location.href = '/user/profile/notifications?filter=' + filter + '&status=' + status;
    })

    setTextFilter();
    loadNotifications();

})