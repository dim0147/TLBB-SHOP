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

    $("#submitForm").submit(function(e){
        e.preventDefault();
        const arrayData = [];
        $('.orderNumber').each(function(){
            arrayData.push({_id: $(this).attr('data-property-id'), order:  $(this).val()});
        })
                // console.log(arrayData);
        $.ajax({
            url: '/admin/item/sort-properties',
            method: 'PATCH',
            data: {data: arrayData, itemId: $('#itemId').val(), _csrf: $('#_csrf').val()},
            success: function(res){
                iziToast.success({message: res})
            },
            error: function(err){
                iziToast.error({message: err.responseText})
            }
        })

    });
});