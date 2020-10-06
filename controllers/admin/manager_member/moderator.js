const { query, validationResult } = require('express-validator');
const waterfall = require('async-waterfall');
const mongoose = require('mongoose');

const userModel = require('../../../models/user');

exports.renderModeratorPage = (req, res) => {
    res.render('admin/manager_member/moderator', {title: 'Quản trị viên', csrfToken: req.csrfToken()})
}

exports.checkQueryGetModeratorData = [
    query('order', 'Order không hợp lệ').isArray().custom(order => {
        if(!order[0] || typeof order[0] !== 'object')
            throw new Error('Value không hợp lệ');
        if(typeof order[0].column === 'undefined')
            throw new Error('Column không hợp lệ');
        if(isNaN(order[0].column))
            throw new Error('Column không phải số');
        return true;
    }),
    query('draw', 'draw không hợp lệ').isNumeric(),
    query('start', 'Start không hợp lệ').isNumeric(),
    query('length', 'Length không hợp lệ').isNumeric(),
    query('search.value', 'Search không hợp lệ').exists().isString(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.getModeratorData = (req, res) => {
    const drawNumber = Number(req.query.draw);
    const skip = Number(req.query.start);
    const limit = Number(req.query.length);

    // Analyze sort Query
    let sort = {};
    const columnToSort = Number(req.query.order[0].column);
    const sortType = req.query.order[0].dir;
    if(columnToSort === 0) // Sort Id
        sort['_id'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 2) // Sort name
        sort['name'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 3) // Sort email
        sort['email'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 4) // Sort phone
        sort['phone'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 5) // Sort Facebook
        sort['linkFB'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 6) // Sort status
        sort['status'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 7) // Sort date join
        sort['created_at'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 8) // Sort last online
        sort['last_online'] = sortType === 'asc' ? 1 : -1;
    else if (columnToSort === 9) // Sort type
        sort['type'] = sortType === 'asc' ? 1 : -1;
    else // Sort for default id
        sort['_id'] = sortType === 'asc' ? 1 : -1;

    // Analyze query
    let query = {
        role: 'moderator',
    };
    const textSearch = req.query.search.value;
    if(textSearch !== ''){
        if(mongoose.Types.ObjectId.isValid(textSearch))
            query['_id'] = mongoose.Types.ObjectId(textSearch);
        else{
            const condition = [];
            condition.push( {name: {$regex: textSearch, $options: 'i'}} )
            condition.push( {email: {$regex: textSearch, $options: 'i'}} )
            condition.push( {phone: {$regex: textSearch, $options: 'i'}} )
            condition.push( {linkFB: {$regex: textSearch, $options: 'i'}} )
            condition.push( {status: {$regex: textSearch, $options: 'i'}} )
            condition.push( {created_at: {$regex: textSearch, $options: 'i'}} )
            condition.push( {last_online: {$regex: textSearch, $options: 'i'}} )
            condition.push( {type: {$regex: textSearch, $options: 'i'}} )
            query['$or'] = condition;
        }
    }

    userModel.aggregate([
        {
            $match: query
        },
        {
            $facet: {
                data: [
                    {
                        $sort: sort
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ],
                count: [
                    {
                        $count: 'totalCount'
                    }
                ]
            }
        }
    ], async function(err, result){
        if(err){
            console.log('Error in ctl/manager_member/moderator.js -> getModeratorData 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        // Convert result
        if(result.length === 0)
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        result = result[0];

        // Get total documents 
        const totalUser = await userModel.countDocuments({role: 'moderator'}).catch(err => false);
        if(totalUser === false)
            return res.status(500).send('Có lỗi xảy ra vui lòng thử lại sau');

        // Get total filtered
        let totalFiltered = 0;
        if(result.count && result.count.length > 0 && result.count[0].totalCount)
            totalFiltered = result.count[0].totalCount;

        // Data to return
        const data = result.data.map(user => {
            return [
                user._id,
                user.urlImage,
                user.name,
                user.email,
                user.phone,
                user.linkFB,
                user.status,
                user.created_at,
                user.last_online,
                user.type,
                null, // For button
            ]
        })

        const returnData = {
            draw: drawNumber,
            recordsTotal: totalUser,
            recordsFiltered: totalFiltered,
            data: data
        }
        res.send(returnData);
    })
    
}