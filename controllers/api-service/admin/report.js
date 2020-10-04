const { query, validationResult } = require('express-validator');

const helper = require('../../../help/helper');

const reportModel = require('../../../models/report');

exports.checkQueryGetReportLastNumbMonth = [
    query('total_months', 'Tháng không hợp lệ').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next()
    }
]

exports.getReportLastNumbMonth = (req, res) => {
    const monthAgo = helper.getMonthAgo(req.query.total_months);
    reportModel.countDocuments({ createdAt: {$gte: monthAgo} }, (err, count) => {
        if(err){
            console.log('Error in ctl/api-service/admin/report.js ->  getReportLastNumbMonth 01 ' + err);
            return res.status(400).send('Có lỗi xảy ra vui lòng thử lại sau')
        }
        res.send({count});
    })
}