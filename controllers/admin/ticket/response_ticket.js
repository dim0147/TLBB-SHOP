const mongoose = require('mongoose');
const dateFormat = require('dateformat');
const waterfall = require('async-waterfall');
const {param, body, validationResult} = require('express-validator');

const ticketModel = require('../../../models/ticket');
const ticketPostModel = require('../../../models/ticket_post');

exports.checkParam = [
    param('ticketId', 'ticket không hợp lệ').isMongoId(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.renderPage = (req, res) => {
    const {ticketId} = req.params;
    waterfall([
        (cb) => { // Check if ticket is exist
            ticketModel
            .findById(ticketId)
            .select('account email status title type createdAt')
            .lean()
            .exec((err, ticket) => {
                if(err){
                    console.log('Error in ctl/admin/ticket/response_ticket.js -> renderPAge01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!ticket) return cb('Không tìm thấy ticket')
                cb(null, ticket);
            })
        },
        (ticket, cb) => {
            ticketPostModel
            .find({ticket: ticketId})
            .select('owner text createdAt')
            .populate({
                path: 'owner',
                select: 'urlImage name status role _id'
            })
            .sort({createdAt: 1})
            .lean()
            .exec((err, ticketPosts) => {
                if(err){
                    console.log('Error in ctl/admin/ticket/response_ticket.js -> renderPage 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null, {
                    ticket,
                    ticketPosts
                })
            })
        }
    ], function(err, result){
        if(err) return res.status(400).send(err);
        res.render('admin/ticket/response_ticket', {title: 'Chi tiếc ticket', dateFormat, ticket: result.ticket, ticketPosts: result.ticketPosts, csrfToken: req.csrfToken()})  
    })
}

exports.checkBodyCreateResponseTicket = [
    body('ticket_id', 'ticket không hợp lệ').isMongoId(),
    body('status', 'status không hợp lệ').isIn(['response', 'done']),
    body('text', 'text không hợp lệ').isString().notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).send(errors.array()[0].msg);
        next();
    }
]

exports.createResponseTicket = async (req, res) => {
    const { 'ticket_id': ticketId, status, text } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    waterfall([
        (cb) => { // Check if ticket is valid
            ticketModel
            .findById(ticketId)
            .select('status')
            .lean()
            .session(session)
            .exec((err, ticket) => {
                if(err){
                    console.log('Error in ctl/admin/ticket/response_ticket.js -> createResponseTicket 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!ticket) return cb('Không tìm thấy ticket')
                if(ticket.status === 'done') return cb('Không thể thêm phản hồi cho ticket này')
                cb(null);
            })
        },
        (cb) => { // Create ticketPost
            ticketPostModel
            .create([
                {
                    ticket: ticketId,
                    owner: req.user._id,
                    text // req.body
                }
            ], 
            {session},
            (err, ticketPosts) => {
                if(err){
                    console.log('Error in ctl/admin/ticket/response_ticket.js -> createResponseTicket 02 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                cb(null);
            })
        },
        (cb) => { // Update status of ticket
            ticketModel
            .updateOne(
                {
                    _id: ticketId,
                },
                {
                    status: status // req.body
                },
                {
                    runValidators: true,
                    session
                },
                (err, upResult) => {
                    if(err){
                        console.log('Error in ctl/admin/ticket/response_ticket.js -> createResponseTicket 03 ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(upResult.ok !== 1) return cb('Không thể update')
                    cb(null, 'Phản hồi thành công');
                }
            )
        }
    ], async function(err, result){
        if(err){
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(err);
        }
        await session.commitTransaction();
        session.endSession();
        res.send(result);
    })
}