$(document).ready(function(){
    // Show images when adding success
    var imagesPreview = function(input, placeToInsertImagePreview) {
        if (input.files) {
            var filesAmount = input.files.length;
            for (i = 0; i < filesAmount; i++) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    let imgTemp =  $($.parseHTML('<img>'));
                    imgTemp.attr('src', event.target.result).appendTo(placeToInsertImagePreview);
                    imgTemp.width(150);
                    imgTemp.height(120);
                    imgTemp.css('margin', '5px');
                }
                reader.readAsDataURL(input.files[i]);
            }
        }
    };

    $('#file-upload').on('change', function() {
        // User choose image finish, clear previous image that showing and begin new one
        $(".gallery").empty();
        imagesPreview(this, 'div.gallery');
    });

    function handleFileSelect(evt) {
        // Drag image finish, clear previous image that showing and begin new one
        $(".gallery").empty();
        evt.stopPropagation();
        evt.preventDefault();
        document.querySelector('.cmm').files = evt.dataTransfer.files;
        var files = evt.dataTransfer; // FileList object.
        imagesPreview(files, 'div.gallery');
      }
    
      function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
      }

      // set up drad
  var dropZone = document.getElementById('dragArea');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);

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

    $("#formSubmit").submit(function (e) {
        e.preventDefault();
        if(!$("#conditionCB").is(':checked')){
            showAlert("Xin hãy chấp nhận điều khoản!", 0);
            return;
        }
        if($('#banRadio').is(':checked') && $("#priceSell").val().length === 0){
            showAlert("Xin hãy nhập giá", 0);
            return;
        }
        if(!$('#giaoluuRadio').is(':checked') && !$('#banRadio').is(':checked')){
            showAlert("Xin hãy chọn hình thức giao dịch", 0);
            return;
        }

        if( document.getElementById("file-upload").files.length < 10 ){
            showAlert("Hãy chọn ít nhất 10 ảnh để có thể tiếp tục", 0);
            return;
        }
        $('#submit').prop("disabled",true);
        setAllowPointer($("#submit"), false);    
        showAlert("Đang tạo bài đăng...", 3);
        $.ajax( {
            url: '/account/add-account',
            type: 'POST',
            data: new FormData( this ),
            processData: false,
            contentType: false,
            success: res => {
                            showAlert(res, 1);
                            $('#submit').prop("disabled",false);
                            setAllowPointer($("#submit"), true);
                        },
                        error: err => {
                            showAlert("Có lỗi xảy ra: " + err.responseText, 0);
                            $('#submit').prop("disabled",false);
                            setAllowPointer($("#submit"), true);
                        }
          } );

    });


});