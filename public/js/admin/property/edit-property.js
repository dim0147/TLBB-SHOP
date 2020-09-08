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

    $("#submit").click(function(){
        let idProperty = $("#idProperty").val();
        let name = $("#name").val();
        let slug = $("#slug").val();

        $(this).prop("disabled",true);
        setAllowPointer(this, false);
        showAlert("Đang lưu property...", 3);
        $.ajax({
            method: "PATCH",
            url: '/admin/property/edit-property/' + idProperty,
            data: {_id: idProperty, name: name, slug: slug, _csrf: $('#_csrf').val() },
            success: res => {
                showAlert(res, 1);
                $(this).prop("disabled",false);
                setAllowPointer(this, true);
            },
            error: err => {
                showAlert("Có lỗi xảy ra: " + err.responseText, 0);
                $(this).prop("disabled",false);
                setAllowPointer(this, true);
            }
        })
    });
});