
$(document).ready(function(){
    
    let lastTimeStampConversation = '';
    let lastTimeStampMessage = '';

    $('.ipMessage').emoji();

    function sortString(string, length = 10){
        return string.length > length ? string.substr(string, length) + '...' : string;
    }

    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function cleanListUser(){
        $('.listUser').html('');
    }

    function cleanConversation(){
        $('.tray-right').html('');
        $('.chat-right').html('');
    }

    function loadConversation(continueTimeStamp = null){
        let query = {};
        if(continueTimeStamp)
            query.continueTimeStamp = continueTimeStamp;
        $.ajax({
            url : '/user/chat/get-conversations',
            type: 'GET',
            data: query,
            success: function(res){
                console.log('Load conversation');
                console.log(res);
                if(res.length > 0)
                    renderConversation(res);
                if(res.length < 2)
                    $('.divLoadMore').remove();
            },
            error: function(err){
                if($('#loadMoreBtn').length){
                    setAllowPointer($('#loadMoreBtn'), true);
                    $('#loadMoreBtn').prop('disabled', false);
                    $('#loadMoreBtn').html('Tải lại')
                }
                iziToast.error({message: err.responseText})
            }
        })
    }

    function renderConversation(conversations){
        conversations.forEach(function(conversation){
            // Analyze target image and url
            if(!conversation.target || (conversation.target && conversation.target.status != 'normal')){
                conversation.target.urlImage = '/images/member-disable.png';
                conversation.target.name = 'Người dùng không còn hợp lệ';
            }

             // Analyze account title
            const titleAccount = conversation.account ? `<h6>${sortString(conversation.account.title, 15)}</h6>` : '';
           
             // Analyze last message
            let lastMessage = '';
            if(conversation.message && conversation.message.type === "offer"){
                lastMessage = 'Đề nghị với giá ' + conversation.message.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
            }
            else if(conversation.message && conversation.message.type === 'accept_offer'){
                lastMessage = 'Đồng ý với giá ' + conversation.message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
            }
            else if(conversation.message && conversation.message.type === 'cancel_offer'){
                lastMessage = 'Từ chối với giá ' + conversation.message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
            }
            else if(conversation.message && conversation.message.type === 'denied_offer'){
                lastMessage = 'Từ chối với giá ' + conversation.message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
            }
            else if(conversation.message && conversation.message.type === 'message'){
                lastMessage = conversation.message.message;
            }
            else
                lastMessage = 'Có lỗi xảy ra, không thể xem tin nhắn';

            if(conversation.message && conversation.message.user == $('#userId').val()){
                lastMessage = 'Bạn: ' + lastMessage;
            }

            // Analyze updated time, check if updated time conversation is today or yesterday or days ago
            let updatedTime = '';
            const timeDiffFromCurrent = getDateDiff(conversation.updatedAt);
            if( timeDiffFromCurrent === 'Hôm nay')
                updatedTime = dateFormat(conversation.updatedAt, 'HH:MM');
            else if(timeDiffFromCurrent)
                updatedTime = timeDiffFromCurrent;
            else
                updatedTime = dateFormat(conversation.updatedAt, 'd mmmm, yyyy')

            // Analyze image account
            let imageAccount = '';
            if(conversation.account && conversation.account.image){
                imageAccount = '<img'+
                '                      class="profile-image account-image"'+
                '                      src="/images/data/'+conversation.account.image+'"'+
                '                      alt=""'+
                '                      />';
            }

            const accountId = conversation.account ? conversation.account._id : '';
            var myvar = '<div class="friend-drawer read friend-drawer--onhover"  data-account="'+accountId+'" data-conversation="'+conversation._id+'">'+
            '                  <img'+
            '                    class="profile-image"'+
            '                    src="'+conversation.target.urlImage+'"'+
            '                    alt=""'+
            '                  />'+
            '                  <div class="text">'+
            '                    <p style="color: black">'+conversation.target.name+'</p>'+
                                titleAccount +
            '                    <p class="text-muted messageFirst">'+lastMessage+'</p>'+
            '                  </div>'+
            '                  <div class="account-info-div">'+
            '                      <span class="time text-muted small">'+updatedTime+'</span>'+
                                imageAccount +
            '                  </div>'+
            '                </div>'+
            '                <hr />';
            $('.listUser').append(myvar);
        })
        $('.divLoadMore').remove();
        $('.listUser').append(' <div class="text-center divLoadMore"><button id="loadMoreBtn" class="btn" type="button">Tải thêm</button></div>')
        lastTimeStampConversation = conversations[conversations.length - 1].updatedAt;
    }

    function createMessageToServer(message, conversationId){
        $.ajax({
            url: '/api-service/chat/create-message',
            type: 'POST',
            data: {
                id_conversation: conversationId,
                message: message,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log(res);
                renderMessages([res], 'after');
                makeConversationOnTop(res);
            },
            error: function(err){
                iziToast.error({
                    title: 'Có lỗi xảy ra',
                    message: err.responseText
                })
            }
        })
    }

    function renderMessages(messages, type = 'before'){
        messages.forEach(function(message){
             // Analyze updated time, check if updated time conversation is today or yesterday or days ago
             let updatedTime = '';
             const timeDiffFromCurrent = getDateDiff(message.createdAt);
             if( timeDiffFromCurrent === 'Hôm nay')
                 updatedTime = dateFormat(message.createdAt, 'HH:MM');
             else if(timeDiffFromCurrent)
                 updatedTime = timeDiffFromCurrent + ' ' + dateFormat(message.createdAt, 'HH:MM');
             else
                 updatedTime = dateFormat(message.createdAt, 'd mmmm, yyyy')
            
            // Message to show
            let messageToShow = '';
            if(message.type === 'offer')
                messageToShow = ' <h4 class="offer"><i class="fas fa-hand-holding-usd"></i>  Đưa ra đề nghị<br>'+message.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</h4>'
            if(message.type === 'cancel_offer')
                messageToShow = '  <h4 class="cancel-offer"><i class="fas fa-strikethrough"></i>  Huỷ đề nghị<br>'+message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</h4>'
            if(message.type === 'denied_offer')
                messageToShow = ' <h4 class="denied-offer"><i class="fas fa-handshake-alt-slash"></i>   Từ chối đề nghị<br>'+message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</h4>'
            if(message.type === 'accept_offer')
                messageToShow = ' <h4 class="accept-offer"><i class="far fa-handshake"></i>   Chấp nhận đề nghị<br>'+message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</h4>'
            else if(message.type === 'message')
                messageToShow = message.message;

            // Analyze target
            let target = {};
            if(message.user == $('#userId').val()){
                target.direction = 'chat-bubble--right';
                target.offset = 'offset-md-9' // For me only
                target.time = 'timeChatRight text-muted timeChat'
            }
            else{
                target.direction = 'chat-bubble--left';
                target.offset = '';
                target.time = 'time text-muted small timeChat'
            }
                
            var myvar = '<div class="row no-gutters" title="'+updatedTime+'">'+
            '                  <div class="col-md-3 '+target.offset+'">'+
            '                    <div class="chat-bubble '+target.direction+'">'+
                                messageToShow + 
            '                      <span style="font-size: 11px;" class="'+target.time+'">'+updatedTime+'</span>'+
            '                    </div>'+
            '                  </div>'+
            '                </div>';

            if(type === 'before') // Mean load message
                $('.chat-list').prepend(myvar);
            else if (type === 'after') // Mean send message
                $('.chat-list').append(myvar);
        })
        if (type === 'after')
            $('.chat-right').scrollTop($('.chat-right')[0].scrollHeight);
        else if(type === 'before'){
            $('.divLoadMoreMessage').remove();
            // Limit each load is 10, equal 10 mean still have, lest than 10 means no more
            if(messages.length === 10){
                $('.chat-list').prepend('<div class="text-center divLoadMoreMessage"><button id="loadMoreMessageBtn" class="btn" type="button">Tải thêm...</button></div>')
                lastTimeStampMessage = messages[messages.length - 1].createdAt;
            }
        }
    }
    
    function loadSpecificConversation(conversationId) {
    
        $.ajax({
            url: '/user/chat/get-specific-conversation',
            type: 'GET',
            data: {
                conversation_id: conversationId
            },
            success: function(res){
                console.log('Load specific conversation');
                console.log(res);
                // Check if target user is valid
                if(Array.isArray(res.peoples) && res.peoples.length > 0 && res.peoples[0].status === 'normal'){
                    renderTrayChatList(res.peoples[0])
                    // If conversation have account
                    if(res.account)
                        renderStickyAccount(res);
                    // Render message
                    renderMessages(res.messages);
                }
            },
            error: function(err){
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    }
    
    function renderTrayChatList(user){
        $('.user-title').html(user.name);
        $('.image-user').attr('src', user.urlImage);
    }

    function renderStickyAccount(conversation){
        // Get image of account
        const imageAccount = conversation.account.image ? '/images/data/' + conversation.account.image : '';
         // Get title of account
        const title = sortString(conversation.account.title, 20);

        // Get transaction type
        let transactionType = '';
        if(conversation.account.transaction_type === 'sell'){
            transactionType = 'Bán ' + conversation.account.price.toLocaleString('en-US', {style : 'currency', currency : 'VND'})
        }else if(conversation.account.transaction_type === 'trade')
            transactionType = 'Giao lưu ' + conversation.account.phaigiaoluu.name;
        else if(conversation.account.transaction_type === 'all')
        transactionType = 'Bán ' + conversation.account.price.toLocaleString('en-US', {style : 'currency', currency : 'VND'}) + ' hoặc giao lưu ' + conversation.account.phaigiaoluu.name;
        
        // Get offer price if have
        const offer = conversation.offer ? '<p class="offerTarget" style="margin: 5px;color: red;"><i class="fas fa-dollar-sign"></i>   Đề nghị với giá '+conversation.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</p>' : '';

        // Get button action depend on current user, check if have offer or not 
        let buttonDiv = '';
        
        // First check if account is not locked
        if(conversation.account.status === 'pending' || conversation.account.status === 'done'){
            // If owner
            if(conversation.account.isOwner){
                // Accept offer or mark account is done if have offer
                if(conversation.offer && conversation.account.status === 'pending'){
                    buttonDiv =  '<button data-offer="'+conversation.offer._id+'" style="margin: 5px" class="btn btn-sm accept-offer btnAcceptOffer"><i class="fa fa-handshake-o" aria-hidden="true"></i>   Chấp nhận đề nghị</button>'+
                    '<button data-offer="'+conversation.offer._id+'" style="margin: 5px;color: red" class="btn btn-sm btnDeniedOffer"><i class="fas fa-handshake-alt-slash"></i>   Từ chối đề nghị</button>'+
                    '<button data-account="'+conversation.account._id+'" class="btn btn-sm btn-success btnMarkAsDone"><i class="fas fa-check"></i>   Đánh dấu hoàn thành</button>'
                }
                // Waiting for offer if not have offer
                else if(!conversation.offer && conversation.account.status === 'pending'){
                    buttonDiv =  '<p>Đang chờ đề nghị</p>';
                }
                // Account is done
                else if(conversation.account.status === 'done' && conversation.status === 'archived'){
                    buttonDiv =  '<p>Bạn đã chấp nhận đề nghị này </p><a href="/account/view-account/'+conversation.account._id+'"><button style="margin: 5px" class="btn btn-sm btn-primary">  Xem tài khoản</button></a>';
                }
                else if(conversation.account.status === 'done'){
                    buttonDiv =  '<p>Tài khoản đã hoàn thành giao dịch </p><a href="/account/view-account/'+conversation.account._id+'"><button style="margin: 5px" class="btn btn-sm btn-primary">  Xem tài khoản</button></a>';
                }
            }
            // If not owner
            else if(!conversation.account.isOwner){
                // Edit offer if place offer already
                if(conversation.offer && conversation.account.status === 'pending'){
                    buttonDiv =  '<button  data-offer="'+conversation.offer._id+'" style="margin: 5px; color:orange" class="btn btn-sm btnEditOffer" data-toggle="modal" data-target="#exampleModal"><i class="fas fa-edit"></i>   Chỉnh sửa đề nghị</button>'+
                    '<button  data-offer="'+conversation.offer._id+'" class="btn btn-sm cancel-offer btnCancelOffer"><i class="fas fa-strikethrough"></i>   Huỷ bỏ đề nghị</button>';
                }
                // Place offer if not place offer yet
                else if(!conversation.offer && conversation.account.status === 'pending'){
                    buttonDiv =  '<button data-account="'+conversation.account._id+'" style="margin: 5px" class="btn btn-sm offer btnPlaceOffer" data-toggle="modal" data-target="#exampleModal"><i class="fas fa-hand-holding-usd" aria-hidden="true"></i>  Đề nghị giá</button>';
                }
                else if(conversation.account.status === 'done' && conversation.status === 'archived')
                    buttonDiv = 'Chúc mừng bạn đã mua thành công tài khoản này'
                else if(conversation.account.status === 'done'){
                    buttonDiv =  '<p>Tài khoản đã hoàn thành giao dịch </p><a href="/account/view-account/'+conversation.account._id+'"><button style="margin: 5px" class="btn btn-sm btn-primary">  Xem tài khoản</button></a>';
                }
            }
        }
        else{
            buttonDiv = 'Tài khoản không còn khả dụng';
        }

        var myvar = '<div class="row sticky" style="position:sticky; top:0">'+
        '                    <div class="w-100 sticky-account border-bottom">'+
        '                        <img class="profile-image account-image" src="'+ imageAccount +'" alt="">'+
        '                        <a href="/account/view-account/'+conversation.account._id+'"><h6 style="margin: 10px;">'+title+'<br><p>'+transactionType+'</p></h6></a>'+
                                    offer+
        '                        <div class="divButton">'+
                                buttonDiv +
        '                        </div>'+
        '                    </div>'+
        '                </div>';
            
        $('.chat-right').prepend(myvar);
    }

    function loadMessage(idConversation, continueTimeStamp = null){
        const query = {};
        if(continueTimeStamp)
            query.continueTimeStamp = continueTimeStamp;
        query.id_conversation = idConversation;
        $.ajax({
            url: '/user/chat/get-messages',
            type: 'GET',
            data: query,
            success: function(res){
                console.log(res);
                renderMessages(res)
            },
            error: function(err){
                $('.divLoadMore').remove();
                $('.chat-list').prepend('<div class="text-center divLoadMore"><button id="loadMoreMessageBtn" class="btn" type="button">Tải thêm...</button></div>');
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    }

    function makeConversationOnTop(message){ // message contain conversation id
        $('.friend-drawer').each(function(i, obj) {
            const currentConversation = $(this).attr('data-conversation');
            if(currentConversation === message.conversation){
                // Append to top
                $(this).next().remove('hr');
                $('.listUser').prepend($(this).detach());
                $(this).after('<hr />');
                 // Analyze last message
                let lastMessage = '';
                if(message && message.type === "offer"){
                    lastMessage = 'Đề nghị với giá ' + message.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
                }
                else if(message && message.type === 'accept_offer'){
                    lastMessage = 'Đồng ý với giá ' + message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
                }
                else if(message && message.type === 'cancel_offer'){
                    lastMessage = 'Từ chối với giá ' + message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
                }
                else if(message && message.type === 'denied_offer'){
                    lastMessage = 'Từ chối với giá ' + message.offer.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
                }
                else if(message && message.type === 'message'){
                    lastMessage = message.message;
                }
                else
                    lastMessage = 'Có lỗi xảy ra, không thể xem tin nhắn';

                if(message && message.user == $('#userId').val()){
                    lastMessage = 'Bạn: ' + lastMessage;
                }
                $(this).find('.messageFirst').html(lastMessage);
            }
        });
    }

    loadConversation();

    // Load more conversation
    $(document).on('click', '#loadMoreBtn', function(err) {
        setAllowPointer(this, false);
        $(this).prop('disabled', true);
        $(this).html('<i class="fas fa-spinner fa-spin"></i>   Đang tải')
        loadConversation(lastTimeStampConversation);
    });

    // Load more messages
    $(document).on('click', '#loadMoreMessageBtn', function(err) {
        setAllowPointer(this, false);
        $(this).prop('disabled', true);
        $(this).html('<i class="fas fa-spinner fa-spin"></i>   Đang tải')
        const idConversation = $('.chat-right').attr('data-conversation')
        loadMessage(idConversation, lastTimeStampMessage);
    });

    
    // Click on conversation
    $( document ).on( 'click', '.friend-drawer--onhover',  function() {
        $('.friend-drawer--onhover').css('background', '');
        $(this).css('background', '#eee');
        // Remove sticky account
        $('.sticky').remove();
        // Remove messages
        $('.chat-list').html('');
        // Set id Conversation to chat right
        const idConversation = $(this).attr('data-conversation');
        const idAccount = $(this).attr('data-account');
        $('.chat-right').attr('data-conversation', idConversation);
        $('.chat-right').attr('data-account', idAccount);
        loadSpecificConversation(idConversation)
    });


    // Press enter when type input text 
    $(document).on('keypress', '.ipMessage', function(e) {
        if(e.which == 13) {
            if($('.ipMessage').val() === '') return;
            const conversationId = $('.chat-right').attr('data-conversation');
            createMessageToServer($('.ipMessage').val(), conversationId);
            $('.ipMessage').val('');
        }
        
    });

    // Press send button
    $('.sendBtn').click(function(e){
        if($('.ipMessage').val() === '') return;
        const conversationId = $('.chat-right').attr('data-conversation');
        createMessageToServer($('.ipMessage').val(), conversationId);
        $('.ipMessage').val('');
    })


    $(document).on('click', '.btnAcceptOffer', function(){
        const conversationId = $('.chat-right').attr('data-conversation');
        const offerId = $(this).attr('data-offer');
        $.ajax({
            url: '/api-service/offer/accept-offer',
            method: 'PATCH',
            data: {
                conversation_id: conversationId,
                offer_id: offerId,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log('accept offer ');
                console.log(res);
                renderMessages([res], 'after');
                makeConversationOnTop(res);
                $('.divButton').html('<p>Bạn đã chấp nhận đề nghị này </p>');
            },
            error: function(err){
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    })
    
    $(document).on('click', '.btnDeniedOffer', function(){
        const conversationId = $('.chat-right').attr('data-conversation');
        const offerId = $(this).attr('data-offer');
        $.ajax({
            url: '/api-service/offer/denied-offer',
            method: 'PATCH',
            data: {
                conversation_id: conversationId,
                offer_id: offerId,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log('denied offer ');
                console.log(res);
                renderMessages([res], 'after')
                makeConversationOnTop(res);
                $('.divButton').html('<p>Đang chờ đề nghị</p>');
                $('.offerTarget').remove();
            },
            error: function(err){
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    })

    $(document).on('click', '.btnMarkAsDone', function(){
        const accountId = $('.chat-right').attr('data-account');
        $.ajax({
            url: '/account/mark-done',
            method: 'PATCH',
            data: {
                id: accountId,
                status: 'done',
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log('Mark as done');
                console.log(res);
                $('.divButton').html('<p>Tài khoản đã hoàn thành giao dịch </p><a href="/account/view-account/'+accountId+'"><button style="margin: 5px" class="btn btn-sm btn-primary">  Xem tài khoản</button></a>');
                $('.offerTarget').remove();
            },
            error: function(err){
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    })
    
    $(document).on('click', '.btnSendOffer', function(){
        const accountId = $('.chat-right').attr('data-account');
        const price = $('.ipOfferPrice').val();
        $.ajax({
            url: '/account/place-offer',
            method: 'POST',
            data: {
                idAccount: accountId,
                price: price,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log('edit offer ');
                console.log(res);
                $('#exampleModal').modal('hide');
                renderMessages([res.offer], 'after')
                makeConversationOnTop(res.offer);
                $('.offerTarget').remove();
                $('.divButton').remove();
                $('.sticky-account').append('<p class="offerTarget" style="margin: 5px;color: red;"><i class="fas fa-dollar-sign" aria-hidden="true"></i>   Đề nghị với giá '+Number(price).toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</p>')
                $('.sticky-account').append('<div class="divButton"><button  data-offer="'+res.offer._id+'" style="margin: 5px; color:orange" class="btn btn-sm btnEditOffer" data-toggle="modal" data-target="#exampleModal"><i class="fas fa-edit"></i>   Chỉnh sửa đề nghị</button>'+
                '<button  data-offer="'+res.offer._id+'" class="btn btn-sm cancel-offer btnCancelOffer"><i class="fas fa-strikethrough"></i>   Huỷ bỏ đề nghị</button></div>')
            },
            error: function(err){
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    })
    
    $(document).on('click', '.btnCancelOffer', function(){
        const conversationId = $('.chat-right').attr('data-conversation');
        const offerId = $(this).attr('data-offer');
        const accountId = $('.chat-right').attr('data-account');
        $.ajax({
            url: '/api-service/offer/cancel-offer',
            method: 'PATCH',
            data: {
                conversation_id: conversationId,
                offer_id: offerId,
                _csrf: $('#_csrf').val()
            },
            success: function(res){
                console.log('cancel offer ');
                console.log(res);
                renderMessages([res], 'after');
                makeConversationOnTop(res);
                $('.divButton').html('<button  data-toggle="modal" data-target="#exampleModal" data-account="'+accountId+'" style="margin: 5px" class="btn btn-sm offer btnPlaceOffer"><i class="fas fa-hand-holding-usd" aria-hidden="true"></i>  Đề nghị giá</button>');
                $('.offerTarget').remove();
            },
            error: function(err){
                iziToast.error({
                    title: err.responseText
                })
            }
        })
    })
    
    socket.on('user-send-message', data => {
        console.log('user-send-message');
        console.log(data.message);
        const message = data.message;

        const currentConversation = $('.chat-right').attr('data-conversation');
        if(message.conversation === currentConversation){
            if(message.type !== 'message'){
                $('.offerTarget').remove();
                $('.divButton').remove();
            }

            const idAccount = $('.chat-right').attr('data-account');

            if(message.type === 'offer'){   // From client
                $('.sticky-account').append('<p class="offerTarget" style="margin: 5px;color: red;"><i class="fas fa-dollar-sign"></i>   Đề nghị với giá '+Number(message.price_offer).toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</p>');
                $('.sticky-account').append('<div class="divButton"><button data-offer="'+message._id+'" style="margin: 5px" class="btn btn-sm accept-offer btnAcceptOffer"><i class="fa fa-handshake-o" aria-hidden="true"></i>   Chấp nhận đề nghị</button>'+
                '<button data-offer="'+message._id+'" style="margin: 5px;color: red" class="btn btn-sm btnDeniedOffer"><i class="fas fa-handshake-alt-slash"></i>   Từ chối đề nghị</button>'+
                '<button data-account="'+idAccount+'" class="btn btn-sm btn-success btnMarkAsDone"><i class="fas fa-check"></i>   Đánh dấu hoàn thành</button></div>');
            }else if(message.type === 'cancel_offer'){ // From client
                $('.sticky-account').append('<p class="offerTarget">Đang chờ đề nghị</p>')
            }else if(message.type === 'denied_offer'){ // From owner
                $('.sticky-account').append('<div class="divButton"><button data-account="'+idAccount+'" style="margin: 5px" class="btn btn-sm offer btnPlaceOffer" data-toggle="modal" data-target="#exampleModal"><i class="fas fa-hand-holding-usd" aria-hidden="true"></i>  Đề nghị giá</button></div>')
            }else if(message.type === 'accept_offer'){ // From owner
                $('.sticky-account').append('<div class="divButton">Chúc mừng bạn đã mua thành công tài khoản này</div>')
            }

            renderMessages([message], 'after');
        }
        makeConversationOnTop(message);
    })

    socket.on('status-account-update', data => {
        console.log('status-account-update');
        console.log(data);

        const currentAccountId = $('.chat-right').attr('data-account');
        if(data.accountId === currentAccountId){
            $('.offerTarget').remove();
            $('.divButton').remove();
            $('.sticky-account').append('<p>Tài khoản đã hoàn thành giao dịch </p><a href="/account/view-account/'+data.accountId+'"><button style="margin: 5px" class="btn btn-sm btn-primary">  Xem tài khoản</button></a>')
        }
    })

    $('.ipOfferPrice').on('input', function(){
        const price = Number($(this).val());
        if(!isNaN(price))
          $('.priceLabel').html('Đề nghị với giá '+ price.toLocaleString('en-US', {style : 'currency', currency : 'VND'}));
    })

});


