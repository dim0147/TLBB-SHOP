
function getDateDiffHelper(date){
    const dateToCheck = new Date(date);
  
    const today = new Date();
    const yesterday = new Date();
    const twoDayAgo = new Date();
    const threeDayAgo = new Date();
    const fourDayAgo = new Date();
    const fiveDayAgo = new Date();
    const sixDayAgo = new Date();
    const sevenDayAgo = new Date();
  
    yesterday.setDate(today.getDate() - 1);
    twoDayAgo.setDate(today.getDate() - 2);
    threeDayAgo.setDate(today.getDate() - 3);
    fourDayAgo.setDate(today.getDate() - 4);
    fiveDayAgo.setDate(today.getDate() - 5);
    sixDayAgo.setDate(today.getDate() - 6);
    sevenDayAgo.setDate(today.getDate() - 7);
  
  
    if (dateToCheck.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (dateToCheck.toDateString() === yesterday.toDateString()) {
        return "Hôm qua";
    } else if (dateToCheck.toDateString() === twoDayAgo.toDateString()) {
        return '2 ngày trước';
    } else if (dateToCheck.toDateString() === threeDayAgo.toDateString()) {
        return '3 ngày trước';
    } else if (dateToCheck.toDateString() === fourDayAgo.toDateString()) {
        return '4 ngày trước';
    } else if (dateToCheck.toDateString() === fiveDayAgo.toDateString()) {
        return '5 ngày trước';
    } else if (dateToCheck.toDateString() === sixDayAgo.toDateString()) {
        return '6 ngày trước';
    } else if (dateToCheck.toDateString() === sevenDayAgo.toDateString()) {
        return '7 ngày trước';
    } else {
        return false;
    }
}

const helper = {
    sortString: function(str, length = 10){
        if(str.length <= length) return str;
        return str.substring(0, length) + '...';
    },

    getDateDiff: function(date){
        const dateToCheck = new Date(date);
      
        const today = new Date();
        const yesterday = new Date();
        const twoDayAgo = new Date();
        const threeDayAgo = new Date();
        const fourDayAgo = new Date();
        const fiveDayAgo = new Date();
        const sixDayAgo = new Date();
        const sevenDayAgo = new Date();
      
        yesterday.setDate(today.getDate() - 1);
        twoDayAgo.setDate(today.getDate() - 2);
        threeDayAgo.setDate(today.getDate() - 3);
        fourDayAgo.setDate(today.getDate() - 4);
        fiveDayAgo.setDate(today.getDate() - 5);
        sixDayAgo.setDate(today.getDate() - 6);
        sevenDayAgo.setDate(today.getDate() - 7);
      
      
        if (dateToCheck.toDateString() === today.toDateString()) {
          return "Hôm nay lúc " + dateFormat(date, "HH:MM");
        } else if (dateToCheck.toDateString() === yesterday.toDateString()) {
            return "Hôm qua";
        } else if (dateToCheck.toDateString() === twoDayAgo.toDateString()) {
            return '2 ngày trước';
        } else if (dateToCheck.toDateString() === threeDayAgo.toDateString()) {
            return '3 ngày trước';
        } else if (dateToCheck.toDateString() === fourDayAgo.toDateString()) {
            return '4 ngày trước';
        } else if (dateToCheck.toDateString() === fiveDayAgo.toDateString()) {
            return '5 ngày trước';
        } else if (dateToCheck.toDateString() === sixDayAgo.toDateString()) {
            return '6 ngày trước';
        } else if (dateToCheck.toDateString() === sevenDayAgo.toDateString()) {
            return '7 ngày trước';
        } else {
            return dateFormat(date, "d mmmm, yyyy");
        }
    },

    admin: {
        setActiveSideMenu: function(arrayElement){
            arrayElement.forEach(function(element){
                $(`.${element}`).addClass('mm-active');
            })
        },
        isAdmin: function(){
            if($('#isAdmin').length)
                return true
            else
                return false
        }
    }
}