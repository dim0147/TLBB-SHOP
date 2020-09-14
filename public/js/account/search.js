$('document').ready(function(){

    let priceChange = false;
    let phaiGiaoLuuChange = false;

    $('.giaoluuArea').hide();
    $('.priceArea').hide();

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function setParameterByName(name, value){
        // Construct URLSearchParams object instance from current URL querystring.
        var queryParams = new URLSearchParams(window.location.search);
    
        // Set new or modify existing parameter value. 
        queryParams.set(name, value);
        return queryParams.toString();
    }

    function checkBoxProperty(){
        const params = new URLSearchParams(window.location.search);

        for(var pair of params.entries()) {
            let itemSlug = pair[0];
            let idProperty = pair[1];

            $('.itemProperty').each(function(){
                // console.log($(this).attr('item') + ' property' + $(this).attr('idProperty'));
                let itemSlugCB = $(this).attr('item');
                let propertyIdCB = $(this).attr('idProperty');
                if(itemSlugCB == itemSlug && idProperty == propertyIdCB)
                    $(this).prop('checked', true);
            });
        }
    }

    function calculatePage(){
        // alert('total ' + $(".totalAccount").attr('total') + ' item per ' + $('.itemPerPage').val());
        let totalItems = Number($(".totalAccount").attr('total'));
        let itemPerPage = Number($('.itemPerPage').val());
        let totalPages = Math.ceil(totalItems / itemPerPage);
        // let totalPages = 100;

        let currentPage = getParameterByName('page');
        if(currentPage == null || currentPage.length == 0)
            currentPage = 1;
        else
            currentPage = Number(currentPage);

        let buttonPrevious = '';
        let Pages = '';
        let buttonNext = '';

        buttonPrevious = '<li class="page-item">'+
        '                                    <a class="page-link" href="#" aria-label="Previous">'+
        '                                        <span aria-hidden="true">«</span>'+
        '                                        <span class="sr-only">Trước</span>'+
        '                                    </a>'+
        '                                </li>'


        Pages = '                                <li class="page-item active"><a class="page-link" href="#">1</a></li>'+
        '                                <li class="page-item"><a class="page-link" href="#">2</a></li>'+
        '                                <li class="page-item"><a class="page-link" href="#">3</a></li>';

                
        buttonNext =      '                                <li class="page-item">'+
        '                                    <a class="page-link" href="#" aria-label="Next">'+
        '                                        <span aria-hidden="true">»</span>'+
        '                                        <span class="sr-only">Tiếp</span>'+
        '                                    </a>'+
        '                                </li>';

        $('#navArea');

        // ----------------------- Display before
        if(currentPage > 1){    // Display button previous
            buttonPrevious = '<li class="page-item">'+
        '                                    <a class="page-link" href="/account/search?'+setParameterByName('page', (currentPage - 1))+'" aria-label="Previous">'+
        '                                        <span aria-hidden="true">«</span>'+
        '                                        <span class="sr-only">Trước</span>'+
        '                                    </a>'+
        '                                </li>'
            $('#navArea').append(buttonPrevious);
        }

        if(currentPage - 3 > 1){ // Display goto page 1
            let url = setParameterByName('page', 1);
            Pages = '                                <li class="page-item"><a class="page-link" href="/account/search?'+ url +'">1</a></li>'+
        '                                <li class="page-item"><a class="page-link" href="#">...</a></li>';
            $('#navArea').append(Pages);
        }

        if((currentPage - 1) <= 1){
            if(currentPage == 1){
                let url = setParameterByName('page', 1);
                Pages = '<li class="page-item active"><a class="page-link" href="/account/search?'+url+'">1</a></li>';
                $('#navArea').append(Pages);
            }else{
                for(let i = (currentPage - 1); i < currentPage; i++){
                    let url = setParameterByName('page', i);
                    Pages = '<li class="page-item"><a class="page-link" href="/account/search?'+url+'">'+i+'</a></li>';
                    $('#navArea').append(Pages);
                }
            }
        }else{
            Pages = '<li class="page-item"><a class="page-link" href="/account/search?'+setParameterByName('page', currentPage - 2)+'">'+(currentPage - 2)+'</a></li>' +
            '<li class="page-item"><a class="page-link" href="/account/search?'+setParameterByName('page', currentPage - 1)+'">'+(currentPage - 1)+'</a></li>';
            $('#navArea').append(Pages);
        }

        if(currentPage != 1){
            Pages = '<li class="page-item active"><a class="page-link" href="/account/search?'+setParameterByName('page', currentPage)+'">'+currentPage+'</a></li>'
            $('#navArea').append(Pages);
        }

        // ----------------------- End Display Before

        // ---- Display behind
        if(currentPage >= totalPages) return
        
        if((totalPages - currentPage) > 0){
            if((totalPages - currentPage) <= 3){
                for(let i = 0; i < (totalPages - currentPage); i++){
                    Pages = '<li class="page-item"><a class="page-link" href="/account/search?'+setParameterByName('page', (currentPage + i + 1))+'">'+(currentPage + i + 1)+'</a></li>'
                    $('#navArea').append(Pages);
                }
            }else{
                Pages = '<li class="page-item"><a class="page-link" href="/account/search?'+setParameterByName('page', (currentPage + 1))+'">'+(currentPage + 1)+'</a></li>' +
                '<li class="page-item"><a class="page-link" href="/account/search?'+setParameterByName('page', (currentPage + 2))+'">'+(currentPage + 2)+'</a></li>'
                $('#navArea').append(Pages);
            }

            // Display end Page
            if((totalPages - currentPage)>3){
                Pages = '<li class="page-item"><a class="page-link" href="#">...</a></li>' +
                '<li class="page-item"><a class="page-link" href="/account/search?'+setParameterByName('page', totalPages)+'">'+totalPages+'</a></li>'
                $('#navArea').append(Pages);
            }

            // Display button next
	        if(currentPage < totalPages){
                buttonNext =      '                                <li class="page-item">'+
                '                                    <a class="page-link" href="/account/search?'+setParameterByName('page', (currentPage + 1))+'" aria-label="Next">'+
                '                                        <span aria-hidden="true">»</span>'+
                '                                        <span class="sr-only">Tiếp</span>'+
                '                                    </a>'+
                '                                </li>';
                $('#navArea').append(buttonNext);
            }
        }
    }

    function sortFirstLoad(){
        let sort = getParameterByName('sort');
        if(sort == 'date-new'){
            $('.accountDiv').sort(function(a, b) {
                if (new Date($(a).attr('data-date')) > new Date($(b).attr('data-date'))) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        }
        else if (sort == 'date-old'){
            $('.accountDiv').sort(function(a, b) {
                if (new Date($(a).attr('data-date')) < new Date($(b).attr('data-date'))) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        }
        else if (sort == 'price-high'){
            $('.accountDiv').sort(function(a, b) {
                if ( Number($(a).attr('data-price')) > Number($(b).attr('data-price'))) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        }
        else if (sort == 'price-low'){
            $('.accountDiv').sort(function(a, b) {
                if ( Number($(a).attr('data-price')) < Number($(b).attr('data-price'))) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        }
        else if (sort == 'most-view'){
            $('.accountDiv').sort(function(a, b) {
                if ( Number($(a).attr('data-view')) > Number($(b).attr('data-view'))) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        }
        else if(sort == 'most-rate'){ // Phổ biến
            $('.accountDiv').sort(function(a, b) {
                if (Number($(a).attr('data-rate')) > Number($(b).attr('data-rate'))) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        } 
        else{
            $('.accountDiv').sort(function(a, b) {
                if ($(a).attr('data-date') > $(b).attr('data-date')) {
                  return -1;
                } else {
                  return 1;
                }
              }).appendTo($('.accountAreaRow'));
        }
        
    }

    function sortBySelect(){
        $('#sortAccount').on('change', function (e) {
            var valueSelected = this.value;
            if(valueSelected == 1){ // Gan day
                $('.accountDiv').sort(function(a, b) {
                    if (new Date($(a).attr('data-date')) > new Date($(b).attr('data-date'))) {
                      return -1;
                    } else {
                      return 1;
                    }
                  }).appendTo($('.accountAreaRow'));
            
            }
            else if(valueSelected == 5){ // Cũ nhất
                $('.accountDiv').sort(function(a, b) {
                    if (new Date($(a).attr('data-date')) < new Date($(b).attr('data-date'))) {
                      return -1;
                    } else {
                      return 1;
                    }
                  }).appendTo($('.accountAreaRow'));
            
            }
            else if(valueSelected == 2){ // Phổ biến
                $('.accountDiv').sort(function(a, b) {
                    if (Number($(a).attr('data-rate')) > Number($(b).attr('data-rate'))) {
                      return -1;
                    } else {
                      return 1;
                    }
                  }).appendTo($('.accountAreaRow'));
            } 
            else if(valueSelected == 3){ // Giá thấp
                $('.accountDiv').sort(function(a, b) {
                    if ( Number($(a).attr('data-price')) < Number($(b).attr('data-price'))) {
                      return -1;
                    } else {
                      return 1;
                    }
                  }).appendTo($('.accountAreaRow'));
            } 
            else if(valueSelected == 4){ // Giá cao
                $('.accountDiv').sort(function(a, b) {
                    if ( Number($(a).attr('data-price')) > Number($(b).attr('data-price'))) {
                      return -1;
                    } else {
                      return 1;
                    }
                  }).appendTo($('.accountAreaRow'));
            } 
            else if(valueSelected == 6){ // Most view
                $('.accountDiv').sort(function(a, b) {
                    if ( Number($(a).attr('data-view')) > Number($(b).attr('data-view'))) {
                      return -1;
                    } else {
                      return 1;
                    }
                  }).appendTo($('.accountAreaRow'));
            } 
        });
    }

    function searchFilter(){
        $('#ipSearchName').keyup(function(e) {
            var textSearch = $(this).val();
            if(textSearch.length < 3) return;
            let loadingDiv =' <div class="fa-3x text-center   ">'+
            '<p><i class="fas fa-spinner fa-spin"></i>  Đang tìm kiếm kết quả cho '+ "'" + textSearch +"'" + '</p> ' +
            ' </div>'
            $('.divResult').html(loadingDiv);
            
            $.ajax({
                url: '/account/search',
                method: 'GET',
                data: {
                    c_name: textSearch,
                    dataOnly: true
                },
                success: function(data){
                    console.log(data);
                    $('.divResult').removeClass('d-none');  
                    if(typeof data.accounts === 'undefined' || typeof data.totalCount === 'undefined' || data.accounts.length === 0 || data.totalCount.length === 0){
                        $('.divResult').html('<p> Không có kết quả nào cho '+"'" + textSearch +"'"+' </p>')
                    }
                    else{
                        $('.divResult').html('<p> Tìm thấy ' + data.totalCount[0].count+ ' kết quả cho '+"'" + textSearch +"'"+' </p>');
                        $('.divResult').append('<p> Hiển thị '+data.accounts.length+' kết quả</p>');
                        data.accounts.forEach(function(account){
                            if(account.transaction_type == 'sell')
                                account.transaction_type = 'Bán: ' + account.price.toLocaleString('vi', {style : 'currency', currency : 'VND'});
                            else if(account.transaction_type = 'trade')
                                account.transaction_type = 'Giao lưu ' + account.phaigiaoluu.name;
                            var myvar = '<a href="/account/view-account/' + account._id+'" class="divItemSearch">'+
                        '                                    <div class="itemInSearch" >'+
                        '                                        <img style="display:inline" width="120px" height="100px" src="/images/data/'+ account.image[0].url+'" alt="">'+
                        '                                        <div style="display: inline-block;">'+
                        '                                            <span style="display: inline;color:rgb(0, 240, 240);font-size:15px;">'+
                        '                                                Tên: '+account.c_name+'<br>'+
                        '                                                Server: '+account.server.name+ ' ('+ account.sub_server.name +')<br>' + 
                                                                        account.transaction_type +
                        '                                            </span>'+
                        '                                        </div>'+
                        '                                    </div>'+
                        '                                    </a>';   
                        $('.divResult').append(myvar);            
                        });     
                        if(Number(data.accounts.length) < Number(data.totalCount[0].count))   
                            $('.divResult').append('<a href="/account/search?c_name='+textSearch+'"><button class="btn btn-small btn-block btn-dark" type="button"><i class="fas fa-eye"></i>  Xem thêm '+ ( Number(data.totalCount[0].count) - Number(data.accounts.length))+' kết quả</button></a>');            
                    }
                },
                error: function(err){
                    console.log(err);
                    $('.divResult').html('<p> Có lổi xảy ra: vui lòng thử lại sau</p>')
                }
            });
        }); 
    }

    function checkChange(){
        $('.slider ').on('slideStop', function(ev){
            priceChange = true;
        });

        $('#selectPhaiGiaoLuu').on('change', function(){
            phaiGiaoLuuChange = true;
        });
    };

    checkChange();

    calculatePage();

    checkBoxProperty();

    sortBySelect();

    sortFirstLoad();

    searchFilter();

    $('.giaoluuArea').hide();

    $('#formSubmit').submit(function(e){
        if($('#c_nameIpFilter').val() == ''){
            $('#c_nameIpFilter').remove();
        } 

        if($('#transaction_type').val() == 'sell'){
            let price = $('.range-track').data('slider').getValue(); 
            if(typeof price[0] !== 'number')
                price[0] = Number(price[0].replace(/[^0-9.-]+/g,""));
            if(typeof price[1] !== 'number')
                price[1] = Number(price[1].replace(/[^0-9.-]+/g,""));
            $('#minPrice').val(price[0]);
            $('#maxPrice').val(price[1]);
            $('#selectPhaiGiaoLuu').remove();
        }
        else if ($('#transaction_type').val() == 'trade'){
            $('#minPrice').remove();
            $('#maxPrice').remove();
        }
        else{
            $('#minPrice').remove();
            $('#maxPrice').remove();
            $('#selectPhaiGiaoLuu').remove();
        }
    });

    $('#transaction_type').on('change', function() {
        if(this.value == 'sell'){
            $('.priceArea').show();
            $('.giaoluuArea').hide();
        }
        else if(this.value == 'trade'){
            $('.giaoluuArea').show();
            $('.priceArea').hide();
        }
        else{
            $('.giaoluuArea').hide();
            $('.priceArea').hide();
        }
            
      });

});