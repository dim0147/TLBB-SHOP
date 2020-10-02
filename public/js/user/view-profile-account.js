$(document).ready(function(){

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

    function removeParam(key, sourceURL = window.location.search) {
        var rtn = sourceURL.split("?")[0],
            param,
            params_arr = [],
            queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
            params_arr = queryString.split("&");
            for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                param = params_arr[i].split("=")[0];
                if (param === key) {
                    params_arr.splice(i, 1);
                }
            }
            rtn = rtn + "?" + params_arr.join("&");
        }
        return rtn;
    }

    function createHtmlDiv(res){
        if(res.accounts.length > 0){
                res.accounts.forEach(function(account){
                    let divRate = '';
                    if(account.totalRate == null)
                        account.totalRate = 0;
                    for(let i = 0; i < account.totalRate; i++){
                        divRate += ' <li class="list-inline-item selected"><i class="fas fa-star"></i></li>';
                    }

                    for(let i = account.totalRate; i < 5; i++){
                        divRate += ' <li class="list-inline-item selected"><i class="far fa-star"></i></li>';
                    }

                    let transactionDiv = '';
                    if(account.transaction_type == 'sell'){
                        transactionDiv = '<p style="color: orange">Bán '+account.price.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+'</p>'
                    }else if(account.transaction_type == 'trade'){
                        transactionDiv = '<p style="color: blue">Giao lưu '+account.phaigiaoluu.name+'</p>'
                    }
                    else if(account.transaction_type == 'all'){
                        transactionDiv = '<p style="color: red" >Bán '+account.price.toLocaleString('en-US', {style : 'currency', currency : 'VND'})+' hoặc Giao lưu '+account.phaigiaoluu.name+'</p>'
                    }

                    let status = '';
                    if(account.status == 'pending')
                        status = '<span style="color:  #cc00cc"><i class="fas fa-shopping-cart"></i>   Đang đăng</span>';
                    else if(account.status == 'done')
                        status = '<span style="color: green"><i class="fas fa-check"></i>  Hoàn thành giao dịch</span>';
                    var myvar = '<!-- ad listing list  -->'+
                    '                          <div style="cursor:pointer" class="ad-listing-list divA mt-20" data-href="/account/view-account/'+account._id+'">'+
                    '                      <div class="row p-lg-3 p-sm-5 p-4">'+
                    '                          <div class="col-lg-4 align-self-center">'+
                    '                              <a href="/account/view-account/'+account._id+'">'+
                    '                                  <img src="'+configClient.urlImagePrefix+account.image+'" class="img-fluid" alt="">'+
                    '                              </a>'+
                    '                          </div>'+
                    '                          <div class="col-lg-8">'+
                    '                              <div class="row">'+
                    '                                  <div class="col-lg-6 col-md-10">'+
                    '                                      <div class="ad-listing-content">'+
                    '                                          <div>'+
                    '                                              <a href="/account/view-account/'+account._id+'" class="font-weight-bold">'+account.title+'</a>'+
                    '                                          </div>'+
                    '                                          <ul class="list-inline mt-2 mb-3">'+
                    '                                              <li class="list-inline-item"><a style="color:red" href="/account/search?phai='+account.phai._id+'"> <i class="fa fa-folder-open-o"></i> '+account.phai.name+'</a></li>'+
                    '                                              <li class="list-inline-item"><i class="fa fa-calendar"></i>  '+dateFormat(new Date(account.createdAt), "d mmmm, yyyy")+'</li>'+
                    '                                              <li class="list-inline-item"><i class="fa fa-eye"></i>  '+account.totalView+' lượt xem</li>'+
                    '                                          </ul>'+
                    transactionDiv +
                    status +
                    '                                          <p style="color: rgb(43, 177, 177);">- Tên nhân vật: '+ account.c_name +
                    '                                          <br>- Server: '+ account.server.name+' - '+ account.sub_server.name +
                    '                                          <br>- Ngọc: ' + account.ngoc.name +
                    '                                          <br>- Điêu văn: ' + account.dieuvan.name +
                    '                                      </div>'+
                    '                                  </div>'+
                    '                                  <div class="col-lg-6 align-self-center">'+
                    '                                      <div class="product-ratings float-lg-right pb-3">'+
                    '                                          <ul class="list-inline">'+
                                                                divRate +
                    '                                          </ul>'+
                    '                                      </div>'+
                    '                                  </div>'+
                    '                              </div>'+
                    '                          </div>'+
                    '                      </div>'+
                    '                          </div>'

                $('.product-list').append(myvar);
            })
        }
    }

    function loadAccount(){
        const sort = getParameterByName('sort');
        const server = getParameterByName('server');
        const c_name = getParameterByName('c_name');
        const page = getParameterByName('page');
        const status = getParameterByName('status');
        const userId = $('#userId').val();

        let query = {};
        if(sort !==  null)
            query.sort = sort;
        if(server !== null)
            query.server = server;
        if(c_name !== null)
            query.c_name = c_name;
        if(status !== null)
            query.status = status;
        if(page !== null && !isNaN(page) && Number(page) > 0)
            query.page = page;

        $.ajax({
            url: `/user/${userId}/get-accounts`,
            type: 'GET',
            data: query,
            success: function(res){
                if(res.totalAccount > 0){
                    $('#titleP').html(`Có tất cả ${res.totalAccount} tài khoản`);
                    createHtmlDiv(res);
                    $('#pagination-demo').twbsPagination({
                        totalPages: Number(Math.ceil(res.totalAccount / 7)),
                        visiblePages: 5,
                        startPage: page !== null && !isNaN(page) && Number(page) > 0 ? Number(page) : 1,
                        first: false,
                        initiateStartPageClick: false,
                        prev: '<',
                        next: '>',
                        last: false,
                        loop: true,
                        onPageClick: function (event, page) {
                            window.location.href = window.location.href.split('?')[0] + '?' + setParameterByName('page',page);
                        }
                    });
                }
                else{
                    $('#titleP').html("Không tìm thấy tài khoản nào")
                }
                
            },
            error: function(err){
                $('#titleP').html("Không tìm thấy tài khoản nào")
                $('.product-list').html('<p>Có lỗi vui lòng thử lại sau: '+err.responseText+'</p>')
            }
        })
    }

    loadAccount();
    
    $(document).on('click', '.divA', function(){
        window.location.href = $(this).attr('data-href');
    })

    $('#btnSearch').click(function(){
        const sort = $('#sort').val();
        const server = $('#server').val();
        const c_name = $('#c_name').val();
        const status = $('#status').val();
        let querySearch = '?';
        querySearch += 'sort=' + sort ;
        if(server !== 'all')
            querySearch += '&' + 'server=' + server;
        if(status !== 'all')
            querySearch += '&' + 'status=' + status;
        if(c_name != '')
            querySearch += '&' + 'c_name=' + c_name;
        window.location.href = window.location.href.split('?')[0] + querySearch;
    })

    $('.copyIdIcon').click(function(){
        const userId = $(this).attr('user-id');
        const el = document.createElement('textarea');
        el.value = userId;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        iziToast.success({message: 'Copy thành công'})
    })

})