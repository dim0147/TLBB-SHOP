const { query, validationResult } = require('express-validator');

const accountModel = require('../../models/account');

exports.renderDashboard = (req, res) => {
    res.render('admin/dashboard', {title: 'Dashboard'})
}

exports.checkQueryGetAccountPastNumbMonths = [
    query('total_months', 'Tháng không hợp hợp lệ').isNumeric(),
    query('total_phais', 'Phái không hợp lệ').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            res.status(400).send(errors.array()[0].msg);
        next();
    }
]

function getMonthAgo(totalMonth){

    var x = new Date();
    // x.setDate(0); // 0 will result in the last day of the previous month
    x.setDate(1); // 1 will result in the first day of the month
    x.setMonth(new Date().getMonth() - totalMonth)
    return x;
}

function getPhai(result){
    const array = [];
    result.forEach(element => {
       element.phai.forEach(phai => {
           if(!array.includes(phai._id.phai))
            array.push(phai._id.phai);
       })
    });
    return array;
}

function initializeArray(totalMonth, phaiUnique){
    let array = [];
    for(let i = 0; i <= totalMonth; i++){
        const phaiInitialize = phaiUnique.map( phai => {
            return {name: phai, totalCount: 0}
        } )
        const initializeObjectMonth = {
            month: (new Date().getMonth() + 1) - i,
            phai: phaiInitialize
        }
        array.push(initializeObjectMonth);
    }
    return array;
}

function queryArray(result, array){
    // Loop each element in array first
    array.forEach(arrayElement => {
        const monthArrayElement = arrayElement.month;
        // Then loop each element in result check if result month equal element in array month
        result.forEach(resultElement => {
            const monthResultElement = resultElement._id;
            // Result month equal element in array month
            if(monthArrayElement === monthResultElement){
                // Loop each element in array phai of arrayElement
                // element like this: {name: 'CB', totalCount: 0}
                arrayElement.phai.forEach(phaiArray => {
                    const phaiArrayElement = phaiArray.name;
                    // Loop each element in result phai of resultElement
                    // element like this: {_id: {phai: 'CB'}, totalCount: 3}
                    resultElement.phai.forEach(phaiResult => {
                        const phaiResultElement = phaiResult._id.phai;
                        // If phai result equal phai element, change totalCount of that phai in array Element
                        if(phaiArrayElement === phaiResultElement)
                            phaiArray.totalCount = phaiResult.totalCount;
                    })
                })
            }
        })
    })
    return array;
}

exports.getAccountPostedPastThreeMonths = (req, res) => {

    const totalMonth = Number(req.query.total_months);
    const totalPhai = Number(req.query.total_phais);
    const lastThreeMonths = getMonthAgo(totalMonth);

    accountModel.aggregate([
        { // Get account
            $match: {
                createdAt: {$gte: lastThreeMonths}
            }
        },
        { // Get phai
            $lookup: {
                from: 'phais',
                localField: 'phai',
                foreignField: '_id',
                as: 'phai'
            }
        },
        { // Edit phai field
            $addFields: {
                phai: {$cond: [
                    { $anyElementTrue: ['$phai'] },
                    { $arrayElemAt: ['$phai.name', 0] },
                    null
                ]}
            }
        },
        { // Group phai, get total of each phai and push all createdAt of each account as array
            $group: {
                _id: '$phai',
                createdAt: {$push: '$createdAt'},
                totalCount: {$sum: 1},
            }
        },
        { // Sort to see top number phai in last number months
            $sort: {totalCount: -1, _id: -1}
        },
        { // Get number phai top in number months
            $limit: totalPhai
        },
        // Result: [
        //     {_id: 'CB', createdAt: [46], totalCount: 46}
        //     {_id: 'VD', createdAt: [25], totalCount: 25}
        //     {_id: 'NM', createdAt: [21], totalCount: 21}
        // ]
        { // extract createdAt of account of each phai
            $unwind: '$createdAt'
        },
        { // Group each month with each phai will result: 
            // [
                // {_id: {month: 7, phai: CB}, total}, 
                // {_id: {month: 7, phai: VD}, total},
                // {_id: {month: 6, phai: TD}, total},
                // {_id: {month: 6, phai: NM}, total}
            //]
            $group: {
                _id: {month: {$month: '$createdAt'}, phai: '$_id'},
                totalCount: {$sum: 1}
            }
        },
        { // Group each month(for beautiful), result:
            // [
            //     {_id: 7},
            //     phai: [
            //         {_id: {month: 7, phai: CB}, total},
            //         {_id: {month: 7, phai: VD}, total}
            //     ]
            // ]
            $group: {
                _id: '$_id.month',
                phai: {$push: '$$ROOT'}
            }
        },
        { // Display from smaller then taller(7,8,9)
          $sort: {_id: 1}  
        },
        { // Project to remove "{_id: {month: 7} "
            $project: {
                _id: 1,
                phai: {
                    _id: {phai: 1},
                    totalCount: 1
                },
            }
        }
    ], function(err, result){
        if(err){
            console.log('Error in ctl/admin/dashboard.js -> getAccountPostedPastThreeMonths 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau');
        }

        const phaiUnique = getPhai(result);

        const array = initializeArray(totalMonth, phaiUnique);
        queryArray(result, array);
        res.send({data: array, phai: phaiUnique});
    })
}