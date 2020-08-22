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
        let nameItem = $("#title").val();
        if(nameItem == ""){
            showAlert("Hãy nhập tên!", 2);
            return;
        }

        let slug = $("#slug").val();
        if(slug == ""){
            showAlert("Hãy nhập slug, Lưu ý: Không nhập dấu!", 2);
            return;
        }

        $(this).prop("disabled",true);
        setAllowPointer(this, false);
        showAlert("Đang tạo mới item...", 3);
        $.ajax({
            method: "POST",
            url: '/admin/item/add-item',
            data: {name: nameItem, slug: slug},
            success: res => {
                showAlert("Tạo item '" + nameItem + "' thành công!", 1);
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