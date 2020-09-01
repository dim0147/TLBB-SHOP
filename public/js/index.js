$('#test').click(function(){
    $.ajax({
        method: 'GET',
        url: '/',
        success: function(res){
            console.log(res);
        },
        error: function(err){
            console.log(err);
        }
    })
});