const io = require('socket.io')();

const userConnectionModel = require('../models/user_connection');

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
    if(socket.request.user)
        addNewUserConnect(socket.request.user._id, socket.id)

    // If user disconnect
    socket.on('disconnect', function(){
        removeUserConnect(socket.id);
    });
});

module.exports = socketApi;

