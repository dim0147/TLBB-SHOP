function incNumbOfUnreadNotifications(){
    let currentNumb = isNaN($('.spanNotification').attr('amount')) ? false : Number($('.spanNotification').attr('amount'))
    if(currentNumb === false || currentNumb > 9) return
    currentNumb++;

    $.ajax({
        url: '/api-service/notification/get-unread-notifications',
        method: 'GET',
        success: function(res){
            const testNotification = Number(res.count) > 9 ? '9+' : Number(res.count);
            var myvar = '<i class="fas fa-bell" aria-hidden="true"></i>'+
            '								'+
            '									'+
            '										<span class="badge badge-danger">'+testNotification+'</span>'+
            '									'+
            '								'+
            '								Thông Báo'+
            '							</a>';
                
            
            $('.spanNotification').html(myvar);
            $('.spanNotification').attr('amount', currentNumb);
        }
    })
}

function showNotification(data){
    const titleNotification = data.text + (data.link ? ' <a class="linkNotification" href="'+data.link+'">Nhấn vào đây để xem</a>' : '');
    if(data.type === 'like-my-comment'){
        iziToast.show({
            backgroundColor: 'pink',
            icon: 'fab fa-gratipay',
            iconColor: '#e37bb0',
            title: titleNotification,
            titleColor: '#c426e0',
            progressBar: false,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        });
        incNumbOfUnreadNotifications();
    }
    else if(data.type === 'comment-on-my-account'){
        iziToast.show({
            backgroundColor: '#82e09b',
            icon: 'fas fa-comment',
            iconColor: '#8f8b54',
            title: titleNotification,
            titleColor: '#8f8b54',
            progressBar: false,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        });
        incNumbOfUnreadNotifications();
    }
    else if(data.type === 'reply-my-comment'){
        iziToast.show({
            backgroundColor: '#19bbe3',
            icon: 'fas fa-comment-dots',
            iconColor: '#6c45cc',
            title: titleNotification,
            titleColor: '#6c45cc',
            progressBar: false,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        });
        incNumbOfUnreadNotifications();
    }
    else if(data.type === 'rate-my-account'){
        iziToast.show({
            backgroundColor: '#edd309',
            icon: 'fas fa-smile',
            iconColor: '#bf8106',
            title: titleNotification,
            titleColor: '#bf8106',
            progressBar: false,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        });        
        incNumbOfUnreadNotifications();
    }
    else if(data.type === 'admin-lock-account'){
        iziToast.show({
            backgroundColor: '#18b7ba',
            icon: 'fas fa-lock',
            iconColor: '#5f1d91',
            title: titleNotification,
            titleColor: '#5f1d91',
            progressBar: false,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        });        
        incNumbOfUnreadNotifications();
    }
    else if(data.type === 'place-offer-on-my-account'){
        iziToast.show({
            backgroundColor: '#9ded07',
            icon: 'fas fa-donate',
            iconColor: '#739630',
            title: titleNotification,
            titleColor: '#739630',
            progressBar: false,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        });   
        incNumbOfUnreadNotifications();
    }
}

const host = window.location.origin;
const socket = io(host);

socket.on('push_notification', data => {
    showNotification(data)
  console.log(data);  
});

