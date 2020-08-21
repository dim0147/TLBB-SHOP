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
})