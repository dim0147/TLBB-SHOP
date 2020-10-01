const waterfall = require('async-waterfall');
const mongoose = require('mongoose');
const io = require('socket.io')();

const userModel = require('../models/user');
const userConnectionModel = require('../models/user_connection');
const conversationModel = require('../models/conversation');

function removeAllConnections(){
    userConnectionModel.remove((err, result) => {
        if(err){
            console.log('Error in io/io.js -> removeAllConnections ' + err);
            return cb('Có lỗi xảy ra vui lòng thử lại sau')
        }
        console.log('Total delete connection: ' + result.deletedCount);
    })
}

// Add new connection of user with socket id when user connect
function addNewUserConnect(userId, socketId){
    const newConnect = new userConnectionModel({
        user: userId,
        socketId: socketId
    }).save(err => {
        if(err)
            console.log('System Error when create new connection for user io/io.js -> addNewUserConnect 01 ' + err);
    });

}

// Update last_online of user
function updateLastOnline(userId){
    userModel.findByIdAndUpdate(userId, {last_online: new Date()}, err => {
        if(err){
            console.log('Error in io/io.js -> updateLastOnline 01  ' + err);
        }
    })
}

// Get user last online
function getLastOnlineUser(data){
    return new Promise((resolve, reject) => {

        if(!mongoose.Types.ObjectId.isValid(data.targetUser)) return reject({OK: false, message: 'Id target không họp lệ'});

        waterfall([
            (cb) => { // Check if current user and user Target is in same conversation
             conversationModel
             .findOne({peoples: { $all: [data.currentUser, data.targetUser] }})
             .select('_id')
             .lean()
             .exec((err, conversation) => {
                if(err){
                    console.log('Error in io/io.js -> getLastOnlineUser 01 ' + err);
                    return cb('Có lỗi xảy ra vui lòng thử lại sau')
                }
                if(!conversation) return cb('Không tìm thấy cuộc trò chuyện');
                cb(null, conversation);
             })
            },
            (conversation, cb) => { // Get latest connection, if have return is online otherwise query user's last_online field
                userConnectionModel
                .findOne({user: data.targetUser})
                .sort({createdAt: -1})
                .select('createdAt')
                .exec((err, connection) => {
                    if(err){
                        console.log('Error in io/io.js -> getLastOnlineUser 02  ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    if(!connection) return cb(null, null);
                    cb(null, {OK: true, isOnline: true, last_online: connection.createdAt});
                })
            },
            (result, cb) => { // Query last_online field of user if user not online 
                if(result) return cb(null, result) // Mean is online 
                userModel
                .findById(data.targetUser)
                .select('last_online')
                .exec((err, user) => {
                    if(err){
                        console.log('Error in io/io.js -> getLastOnlineUser 03  ' + err);
                        return cb('Có lỗi xảy ra vui lòng thử lại sau')
                    }
                    cb(null, {OK: true, isOnline: false, last_online: user.last_online});
                })
            }
        ], function(err, result){
            if(err) return reject({OK: false, message: err});
            resolve(result);
        })

    })
}

// Delete socket id in database when user disconnect
function removeUserConnect(socketId){
    userConnectionModel.findOneAndDelete({socketId: socketId}, err => {
        if(err)
            console.log('Error in io/io.js -> removeUserConnect 01 ' + err);
    });
}

// Send event to specific sockets
function emitSockets(sockets, data){
    // Check if is list socketId, loop through and emit each one
    if(Array.isArray(sockets)){
        sockets.forEach(function(socket){
            io.to(socket).emit(data.event, data.value);
        })
        return true
    }
    // If sockets is string mean one socket only
    else if(typeof sockets === 'string'){
        io.to(sockets).emit(data.event, data.value)
        return true
    }
    else{
        console.log('Error, list sockets not valid, please check again, list socket: ');
        console.log(sockets);
        return false
    }
}

// Send event to all sockets
function emitToAllSockets(data){
    io.emit(data.event, data.value);
}

// Remove all connection after restart server
removeAllConnections();

const socketApi = {
    io: io,
    emitSockets: emitSockets,
    emitToAllSockets: emitToAllSockets
}

// Get connection when user connect
io.on('connection', (socket) => {

    // Add new connection to user 
    if(socket.request.user){
        addNewUserConnect(socket.request.user._id, socket.id);
        updateLastOnline(socket.request.user);
    }

    // Get user lastOnline
    socket.on('get_user_last_online', data => {
        data.currentUser = socket.request.user._id; 
        getLastOnlineUser(data)
        .then(result => {
            socket.emit('get_user_last_online', result);
        })
        .catch(error => {
            socket.emit('get_user_last_online', error);
        })
    })

    // If user disconnect
    socket.on('disconnect', function(){
        removeUserConnect(socket.id);
    });
    
});

module.exports = socketApi;

