const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const dateFormat = require('dateformat');

const config = require('../../../config/config');

const itemModel = require('../../../models/item');
const itemPropertyModel = require('../../../models/item_property');


exports.renderPage = (req, res) => {
    itemModel.aggregate([
        {
            $lookup: {
                from: 'item-properties',
                let: {itemId: '$_id'},
                pipeline: [
                    {
                        $match: {$expr: {$eq: ['$itemId', '$$itemId']}}
                    },
                    {
                        $sort: {order: 1}
                    }
                ],
                as: 'properties'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                slug: 1,
                createdAt: 1,
                updatedAt: 1,
                properties: {
                    _id: 1,
                    name: 1
                }
            }
        }
    ], function(err, items){
        res.render('admin/item/show-items', {title: 'Hiển thị item', items: items, dateFormat, csrfToken: req.csrfToken()});
    })
}
