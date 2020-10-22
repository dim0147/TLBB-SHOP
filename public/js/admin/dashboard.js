$(document).ready(function(){
    helper.admin.setActiveSideMenu(['link-dashboard']);

    function getMonthAgo(totalMonth){

        var x = new Date();
        // x.setDate(0); // 0 will result in the last day of the previous month
        x.setDate(1); // 1 will result in the first day of the month
        x.setMonth(new Date().getMonth() - totalMonth)
        return x;
    }

    function getMondayOfLastNumbWeek(numbWeek = 1){
        const beforeOneWeek = new Date(new Date().getTime() - (60 * 60 * 24 * 7 * 1000 * numbWeek))
      , day = beforeOneWeek.getDay()
      , diffToMonday = beforeOneWeek.getDate() - day + (day === 0 ? -6 : 1)
      , lastMonday = new Date(beforeOneWeek.setDate(diffToMonday))
      return lastMonday;
    }

    // Load total user 3 months
    function loadUserRegisterLastNumbMonth(){
        const query = {
            'total_months': 3
        }

        $.ajax({
            url: '/api-service/admin/user/get-user-register-last-number-months',
            method: 'GET',
            data: query,
            success: function(res){
                $('.userNumber').html(res.count);
            },
            error: function(err){
                $('.userNumber').html(err.responseText);
            }
        })
    }
    loadUserRegisterLastNumbMonth();

    // Load total account 3 months
    function loadAccountPostLastNumbMonth(){
        const query = {
            'total_months': 3
        }

        $.ajax({
            url: '/api-service/admin/account/get-account-last-number-months',
            method: 'GET',
            data: query,
            success: function(res){
                $('.postNumber').html(res.count);
            },
            error: function(err){
                $('.postNumber').html(err.responseText);
            }
        })
    }
    loadAccountPostLastNumbMonth();

    // Load total report 3 months
    function loadReportLastNumbMonth(){
        const query = {
            'total_months': 3
        }

        $.ajax({
            url: '/api-service/admin/report/get-report-last-number-months',
            method: 'GET',
            data: query,
            success: function(res){
                $('.reportNumber').html(res.count);
            },
            error: function(err){
                $('.reportNumber').html(err.responseText);
            }
        })
    }
    loadReportLastNumbMonth();

    // Get data top 3 phai
    function loadTopPhaiPostLastNumbMonth(){
        const queryData = {
            'total_months': 3,
            'total_phais': 3
        }
        const parentElement = $('#canvas').parent(); 
        $('#canvas').remove(); 
      
        $(parentElement).append('<div class="line-loading"></div>')

        $.ajax({
            url: '/api-service/admin/account/get-account-sell-last-number-months',
            method: 'GET',
            data: queryData,
            success: function(res){
                res.data.reverse()

                // Initialize months
                const totalMonth = 3;
                const arrayMonth = [];
                for(let i = 0; i <= totalMonth; i++){
                    arrayMonth.push('Tháng ' + (new Date().getMonth() + 1 - i));
                }
                arrayMonth.reverse();

                // Analyze Column for data
                const dataColumn = [];
                res.phai.forEach( (namePhai, index) => {
                    // Equal order with res.phai
                    dataColumn[index] = [];
                    // phai order equal data.phai order
                    // Get totalCount of each month of specific phai
                    res.data.forEach(element => {
                        if(element.phai[index].name === namePhai)
                            dataColumn[index].push(element.phai[index].totalCount);
                    })
                })
                
                $(parentElement).html('');
                $(parentElement).append('<canvas id="newCanvas"></canvas>');
                var ctx = document.getElementById('newCanvas');
                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                    labels: arrayMonth,
                    datasets: [
                        {
                            label: res.phai[0] ? res.phai[0] : 'Không có',
                            fillColor: "blue",
                            data: dataColumn[0] ? dataColumn[0] : [],
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1
                        },
                        {
                            label: res.phai[1] ? res.phai[1] : 'Không có',
                            fillColor: "red",
                            data: dataColumn[1] ? dataColumn[1] : [],
                            backgroundColor: 'rgba(153, 102, 255, 1)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        },
                        {
                            label: res.phai[2] ? res.phai[2] : 'Không có',
                            fillColor: "green",
                            data: dataColumn[2] ? dataColumn[2] : [],
                            backgroundColor: 'rgba(255, 206, 86, 1)',
                            borderColor: 'rgba(255, 206, 86, 1)',
                        }
                    ]
                },
                                    options: {
                                        scales: {
                                            yAxes: [{
                                                ticks: {
                                                    beginAtZero: true
                                                }
                                            }]
                                        }
                                    }
                                });

            },
            error: function(err){
                $(parentElement).html(`<p>${err.responseText}</p>`);
            }
        })

    }
    loadTopPhaiPostLastNumbMonth();

    // Get top user
    function loadTopUserLastNumbMonth(){
        const query = {
            'time': getMonthAgo(3).toISOString(),
            'total_users': 10,
        }

        $.ajax({
            url: '/api-service/admin/user/get-top-user-at-time',
            method: 'GET',
            data: query,
            success: function(res){
                $('.listTopUser').html('');
                res.forEach(element => {
                    if(!element.user) return;
                    const { user, totalCount  } = element;
                    if(user.status === 'normal')
                        user.badge = '<div class="badge badge-success"><i class="fas fa-user-tie"></i>   Bình thường</div>';
                    else if(user.status === 'lock')
                        user.badge = '<div class="badge badge-warning"><i class="fas fa-user-lock"></i>   Khoá</div>'
                    else 
                        user.badge = '<div class="badge badge-danger"><i class="fas fa-question"></i>   Không khả dụng</div>'

                    if(user.role === 'user')
                        user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-info">Người dùng</div>'
                    else if (user.role === 'moderator')
                        user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-secondary"><i class="fas fa-star"></i>   Quản Trị Viên</div>'
                    else if (user.role === 'admin')
                        user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-danger"><i class="fas fa-user-shield"></i>   Admin</div>'
                    else
                        user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-dark">Không role</div>'
                    var myvar = '<li class="list-group-item">'+
                    '                                                                <div class="widget-content p-0">'+
                    '                                                                    <div class="widget-content-wrapper">'+
                    '                                                                        <div class="widget-content-left mr-3">'+
                    '                                                                            <img width="42" class="rounded-circle" src="'+user.urlImage+'" alt="" />'+
                    '                                                                        </div>'+
                    '                                                                        <div class="widget-content-left">'+
                    '                                                                            <div class="widget-heading"><a href="/user/'+user._id+'/accounts">'+user.name+'</a></div>'+
                    '                                                                            <div class="widget-subheading">'+user.email+'</div>'+
                    '                                                                            <div class="">'+user.badgeRole+'</div>'+
                    '                                                                        </div>'+
                    '                                                                        <div class="widget-content-right">'+
                    '                                                                            <div class="font-size-xlg text-muted">'+
                    '                                                                                <small class="pr-1">'+user.badge+'</small>'+
                    '                                                                                <span>'+totalCount+' tài khoản</span>'+
                    '                                                                            </div>'+
                    '                                                                        </div>'+
                    '                                                                    </div>'+
                    '                                                                </div>'+
                    '                                                            </li>';
                    $('.listTopUser').append(myvar);

                })
            },
            error: function(err){
                $('.listTopUser').html('<div class="text-center"><p>'+err.responseText+'</p></div>');
            }
        })
    }
    loadTopUserLastNumbMonth();

    // Load total account
    function loadTotalAccount(){
        $.ajax({
            url: '/api-service/admin/account/get-total-accounts',
            method: 'GET',
            success: function(res){
                $('.totalAccount').html(res.count);
            },
            error: function(err){
                $('.totalAccount').html(err.responseText)
            }
        })
    }
    loadTotalAccount();

    // Load total pending account
    function loadTotalPendingAccount(){
        $.ajax({
            url: '/api-service/admin/account/get-total-pending-accounts',
            method: 'GET',
            success: function(res){
                $('.totalPendingAccount').html(res.count);
            },
            error: function(err){
                $('.totalPendingAccount').html(err.responseText)
            }
        })
    }
    loadTotalPendingAccount();

    // Load total lock account
    function loadTotalDoneAccount(){
        $.ajax({
            url: '/api-service/admin/account/get-total-done-accounts',
            method: 'GET',
            success: function(res){
                $('.totalDoneAccount').html(res.count);
            },
            error: function(err){
                $('.totalDoneAccount').html(err.responseText)
            }
        })
    }
    loadTotalDoneAccount();

    // Get top user last week
    function loadTopUserLastWeek(){
        const query = {
            'time': getMondayOfLastNumbWeek(1).toISOString(),
            'total_users': 10,
        }
        $.ajax({
            url: '/api-service/admin/user/get-top-user-at-time',
            method: 'GET',
            data: query,
            success: function(res){
                renderTopUserTable(res);
            },
            error: function(err){
                $('.loadingTableTopUser').hide();
                $('.tableTopUser').html(err.responseText);
            }
        })

    }

    // Get top user last Month
    function loadTopUserLastMonth(){
        const query = {
            'time': getMonthAgo(1).toISOString(),
            'total_users': 10,
        }
        $.ajax({
            url: '/api-service/admin/user/get-top-user-at-time',
            method: 'GET',
            data: query,
            success: function(res){
                renderTopUserTable(res);
            },
            error: function(err){
                $('.loadingTableTopUser').hide();
                $('.tableTopUser').html(err.responseText);
            }
        })

    }

    function firstTimeLoadTopUser(){
        loadTopUserLastWeek();
    }
    firstTimeLoadTopUser();

    function renderTopUserTable(res){
        $('.loadingTableTopUser').hide();
        res.forEach(element => {
            if(!element.user)    
                return;
            const { user, totalCount } = element;
            if(user.status === 'normal')
                user.badgeStatus = '<div class="mb-2 mr-2 badge badge-pill badge-success">Bình Thường</div>';
            else if(user.status === 'lock')
                user.badgeStatus = '<div class="mb-2 mr-2 badge badge-pill badge-warning">Khoá</div>';
            else
                user.badgeStatus = '<div class="mb-2 mr-2 badge badge-pill badge-danger">Không khả thi</div>';

            if(user.role === 'user')
                user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-info">Người dùng</div>'
            else if (user.role === 'moderator')
                user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-secondary"><i class="fas fa-star"></i>   Quản Trị Viên</div>'
            else if (user.role === 'admin')
                user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-danger"><i class="fas fa-user-shield"></i>   Admin</div>'
            else
                user.badgeRole = '<div class="mb-2 mr-2 badge badge-pill badge-dark">Không role</div>'
            var myvar = '<tr>'+
            '                                                    <td class="text-center text-muted">'+user._id+'</td>'+
            '                                                    <td>'+
            '                                                        <div class="widget-content p-0">'+
            '                                                            <div class="widget-content-wrapper">'+
            '                                                                <div class="widget-content-left mr-3">'+
            '                                                                    <div class="widget-content-left">'+
            '                                                                        <img width="40" class="rounded-circle" src="'+user.urlImage+'" alt="" />'+
            '                                                                    </div>'+
            '                                                                </div>'+
            '                                                                <div class="widget-content-left flex2">'+
            '                                                                    <div class="widget-heading">'+user.name+'</div>'+
            '                                                                    <div class="widget-subheading opacity-7">'+user.email+'</div>'+
            '                                                                </div>'+
            '                                                            </div>'+
            '                                                        </div>'+
            '                                                    </td>'+
            '                                                    <td class="text-center">'+totalCount+'</td>'+
            '                                                    <td class="text-center">'+user.badgeStatus+'</td>'+
            '                                                    <td class="text-center">'+
                                                                    user.badgeRole +
            '                                                    </td>'+
            '                                                    <td class="text-center">'+
            '                                                        <a href="/user/'+user._id+'/accounts"><button type="button" id="PopoverCustomT-1" class="btn btn-primary btn-sm">Chi tiết</button></a>'+
            '                                                    </td>'+
            '                                                </tr>';
            $('.tableTopUser').append(myvar);
        })
    }

    $('.btnLastWeek').click(function(){
        $(this).addClass('active');
        $('.btnLastMonth').removeClass('active');
        
        $('.loadingTableTopUser').show();
        $('.tableTopUser').html('');
        loadTopUserLastWeek();
    })

    $('.btnLastMonth').click(function(){
        $(this).addClass('active');
        $('.btnLastWeek').removeClass('active');
        
        $('.loadingTableTopUser').show();
        $('.tableTopUser').html('');
        loadTopUserLastMonth();
    })
})