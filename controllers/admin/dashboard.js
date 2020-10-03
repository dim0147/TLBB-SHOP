
const accountModel = require('../../models/account');

exports.renderDashboard = (req, res) => {
    res.render('admin/dashboard', {title: 'Dashboard'})
}

exports.getAccountPostedPastThreeMonths = (req, res) => {

    const totalMonth = 3;

    var x = new Date();
    x.setDate(0); // 0 will result in the last day of the previous month
    x.setDate(1); // 1 will result in the first day of the month
    x.setMonth(new Date().getMonth() - totalMonth)


    accountModel.aggregate([
        { // Get account
            $match: {
                createdAt: {$gte: x}
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
        { // Sort to see top 3 phai in last 3 months
            $sort: {totalCount: -1, _id: -1}
        },
        { // Get 3 phai top in 3 months
            $limit: 3
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
        if(err) console.log(err);

        const phaiUnique = getPhai(result);

        const array = initializeArray(totalMonth, phaiUnique);
        result = queryArray(result, array);
        res.send({data: array, phai: phaiUnique});
    })
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

function queryArray(result, array){
    result.forEach(elementResult => {
        array.forEach(elementArray => {
            if(elementResult._id === elementArray.month){

                elementResult.phai.forEach(phaiResult => {
                    elementArray.phai.forEach(phaiArray => {
                        if(phaiResult._id.phai === phaiArray.name)
                            phaiArray.totalCount = phaiResult.totalCount
                    })
                })

            }
        })
    })
}