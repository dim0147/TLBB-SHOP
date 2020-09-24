const waterfall = require('async-waterfall');

const helper = require('../../help/helper');
const socketApi = require('../../io/io');

const conversationModel = require('../../models/conversation');

exports.renderChatPage = (req, res) => {
    res.render('user/chat', {title: 'Tin nhắn'})
} 