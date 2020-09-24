
$(document).ready(function(){


    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    function showAlert(text, type){
        let alertElement = $("#alert");
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

    $( '.friend-drawer--onhover' ).on( 'click',  function() {
        $('.friend-drawer--onhover').css('background', '')
        $(this).css('background', '#eee')
        $( '.chat-bubble' ).hide('slow').show('slow');
        
    });

    $(function () {
        $('.ipMessage').emoji();
      })

});


