$(document).ready(function(){

    $.ajax({
        url: '/admin/dashboard/get-account-sell-last-three-month',
        method: 'GET',
        success: function(res){
            res.data.reverse()
            console.log(res);

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
                dataColumn[index] = [];
                res.data.forEach(element => {
                    if(element.phai[index].name === namePhai)
                        dataColumn[index].push(element.phai[index].totalCount);
                })
            })

            console.log('dataColumn');
            console.log(dataColumn);

            const parentd = $('#canvas').parent(); // this is my <canvas> element
            $('#canvas').remove(); // this is my <canvas> element
            $(parentd).append('<canvas id="newCanvas"><canvas>');
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
            console.log(err.responseText);
        }
    })

})