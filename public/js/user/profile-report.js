$(document).ready(function(){

    let continueTimeStamp = null;

    function setAllowPointer(element, value){
        if(value)
            $(element).css('cursor', 'default');
        else
            $(element).css('cursor', 'not-allowed');
    }

    function loadReport(){
        const data = continueTimeStamp === null ? {} : {'continue_timestamp': continueTimeStamp};
        $.ajax({
            url: '/user/profile/reports/get-reports',
            method: 'GET',
            data,
            success: function(res){
                console.log(res);
                if(res.reports.length > 0)
                    renderReports(res);
                else
                    $('.loadingFirst').remove();
            },
            error: function(err){
                iziToast.error({message: err.responseText});
                $('.loadingFirst').remove();
                setAllowPointer($('.btnLoadMore'), true);
                $('.btnLoadMore').html('Tải lại');
            }
        })
    }

    function renderReports(res){
        console.log(res);
        const { reports, totalLeft, continueTimestamp: continueTimestampRes } = res;
        $('.loadingFirst').remove();

        reports.forEach(report => {
            // Analyze icon
            let icon = '';
            if(report.type === 'conversation')
                icon = '<i class="fas fa-comment-alt"></i>';
            else if(report.type === 'user')
                icon = '<i class="fas fa-user-times"></i>';
            else if(report.type === 'account')
                icon = '<i class="fas fa-dumpster"></i>'

            // Analyze title
            let titleReport = '';
            if(report.type === 'conversation'){
                titleReport = 'Báo cáo cuộc trò chuyện';
                if(report.conversation && report.conversation['target_user']){
                    const targetUser = report.conversation['target_user'];
                    titleReport += ` với <a href="/user/${targetUser._id}/accounts">${targetUser.name}</a>`
                }
                else
                    titleReport += ' với (Người dùng không hợp lệ hoặc cuộc trò chuyện không hợp lệ)';
            }
            else if(report.type === 'account'){
                titleReport = 'Báo cáo tài khoản';
                if(report.account && (report.account.status === 'pending' || report.account.status === 'done' || report.account.status === 'lock')){
                    titleReport += ` <a href="/account/view-account/${report.account._id}">"${helper.sortString(report.account.title, 20)}"</a>`
                }
                else{
                    titleReport += ` (Tài khoản này không còn khả dụng)`
                }
            }
            else if(report.type === 'user'){
                titleReport = 'Báo cáo người dùng';
                if(report.user){
                    const user = report.user;
                    titleReport += ` <a href="/user/${user._id}/accounts">${user.name}</a>`;
                }
                else
                    titleReport += ' (Người dùng không còn khả dụng)';
            }

            // Analyze status
            let status = '';
            if(report.status === 'pending')
                status = '<div class="mb-2 mr-2 badge badge-pill badge-warning">Đang chờ</div>';
            else if(report.status === 'done')
                status = '<div class="mb-2 mr-2 badge badge-pill badge-success">Đã xử lí</div>';

            // Analyze responses
            let responses = '';
            if(report.responses){
                report.responses.forEach(response => {
                    responses += `<hr><h5 class="card-title"><i class="fas fa-envelope-open"></i>   RE: ${titleReport}</h5>`+
                    `                                <span class="card-subtitle">- ${response.text}</span>`+
                    `                                <p>${getDateDiffHelper(response.createdAt)}</p>`;
                })
            }

            // Get reason
            const reason = `Lí do: ${report.reason}`;
            
            var myvar = '<div class="main-card mb-3 card">'+
            '                            <div class="card-body">'+
            `                                <h5 class="card-title">${icon}   ${titleReport}  ${status}</h5>`+
            `                                <span class="card-subtitle">${reason}</span>`+
            `                                <p>${getDateDiffHelper(report.createdAt)}</p>`+
                                        responses
            '                            </div>'+
            '                        </div>';

            $('.divReport').append(myvar);

        })
    
        $('.btnLoadMore').remove();
        if(totalLeft > 0){
            continueTimeStamp = continueTimestampRes;
            $('.divReport').append(`<button class="btn btn-large btn-block btn-primary btnLoadMore" type="button">Tải thêm ${totalLeft} báo cáo</button>`)
        }
    }

    loadReport();

    $(document).on('click', '.btnLoadMore', function(){
        setAllowPointer(this, false);
        $('.btnLoadMore').html('<i class="fas fa-spinner fa-spin"></i>');
        loadReport();
    })

})