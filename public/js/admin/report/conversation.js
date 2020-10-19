

$(document).ready(function(){
    
    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    function loadMessage(continueTimestamp = null){
        let query = {
            'conversation_id': $('#conversationId').val(),
            _csrf: $('#_csrf').val()
        };
        if(continueTimestamp){
            query['continue_timestamp'] = continueTimestamp;
        }

        $.ajax({
            url: '/admin/report/conversation/get-messages',
            method: 'GET',
            data: query,
            success: function(res){
                renderMessage(res);
            },
            error: function(err){
                $('.firstLoad').remove();
                $('.spanLoadMore').html('Tải lại');
                iziToast.error({message: err.responseText ? 'Có lỗi xảy ra vui lòng thử lại sau' : err.responseText});
            }
        })
    }

    function renderMessage(messages){
        $('.firstLoad').remove();
        const starterId = $('#starterId').val();
        messages.forEach(message => {
            if(!message.user) return;
            const { user } = message;

            let target = '';
            // Analyze target
            if(user._id === starterId){
                target = 'right';
            }
            else
                target = 'left';

            //ANALYZE messages
            let textMessage = '';
            if(message.type === 'offer')
                textMessage = 'Đưa ra đề nghị ' + message.price_offer.toLocaleString('en-US', {style : 'currency', currency : 'VND'});
            else if(message.type === 'cancel_offer')
                textMessage = 'Huỷ đề nghị';
            else if(message.type === 'denied_offer')
                textMessage = 'Từ chối đề nghị';
            else if(message.type === 'accept_offer')
                textMessage = 'Chấp nhận đề nghị';
            else if(message.type === 'message')
                textMessage = message.message;
            if((message.type === 'offer' || message.type === 'cancel_offer' || message.type === 'denied_offer' || message.type === 'accept_offer') && message.offer)
                textMessage += ' '+Number(message.offer.price_offer).toLocaleString('en-US', {style : 'currency', currency : 'VND'});

           
            var myvar = `<div class="answer ${target}">`+
            '                   <div class="avatar">'+
            `                     <img src="${user.urlImage}" alt="${user.name}">`+
            '                     <div class="status online"></div>'+
            '                   </div>'+
            `                   <div class="name">${user.name}</div>`+
            '                   <div class="text">'+
            `                    ${textMessage}`+
            '                   </div>'+
            `                   <div class="time">${helper.getDateDiff(message.createdAt)}</div>`+
            '                  </div>';
                    
            $('.chat-body').prepend(myvar);
        })
        
        $('.loadMore').remove();
        if(messages.length >= 5){
            const continueTimestamp = new Date(messages.slice(-1)[0].createdAt).toISOString();
            var loadMore = '<div class="text-center loadMore">'+
            `                    <span style="cursor: pointer" class="spanLoadMore" data-continue-timestamp=${continueTimestamp}>Tải thêm</span>`+
            '                </div>';
            $('.chat-body').prepend(loadMore);
        }
    }

    loadMessage();


    $(document).on('click', '.spanLoadMore', function(){
        $('.spanLoadMore').html('<i class="fas fa-spinner fa-spin"></i>   Đang tải')
        const continueTimestamp = $(this).attr('data-continue-timestamp');
        loadMessage(continueTimestamp);
    })
})