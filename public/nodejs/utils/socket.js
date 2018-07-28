'use strict';

const moment = require('moment');
const path = require('path');
const fs = require('fs');
const helper = require('./helper');

class Socket{

    constructor(socket){
        this.io = socket;
    }

    socketEvents(){
        this.io.on('connection', (socket) => {
            /**
            * get the user's Chat list
            */
            socket.on('chatList', async (userId) => {
                const result = await helper.getChatList(userId);
                this.io.to(socket.id).emit('chatListRes', {
                    userConnected: false,
                    chatList: result.chatlist
                });

                socket.broadcast.emit('chatListRes', {
                    userConnected: true,
                    userId: userId,
                    socket_id: socket.id
                });
            });
            /**
            * get the get messages
            */
            socket.on('getMessages', async (data) => {
                const result = await helper.getMessages(data.fromUserId, data.toUserId);
				if (result === null) {
                    this.io.to(socket.id).emit('getMessagesResponse', {result:[],toUserId:data.toUserId});
				}else{
                    this.io.to(socket.id).emit('getMessagesResponse', {result:result,toUserId:data.toUserId});
				}
            });

            /**
            * send the messages to the user
            */
            socket.on('addMessage', async (response) => {
                response.date = new moment().format("Y-MM-D");
                response.time = new moment().format("hh:mm A");
                this.insertMessage(response, socket);
                socket.to(response.toSocketId).emit('addMessageResponse', response);
            });

            socket.on('typing', function (data) {
                socket.to(data.socket_id).emit('typing', {typing:data.typing, to_socket_id:socket.id});
            });

            socket.on('upload-image', async (response) => {
                let dir = moment().format("D-M-Y")+ "/" + moment().format('x') + "/" + response.fromUserId
                await helper.mkdirSyncRecursive(dir);
                let filepath = dir + "/" + response.fileName;
                var writer = fs.createWriteStream(path.basename('uploads') + "/" + filepath, { encoding: 'base64'});
                writer.write(response.message);
                writer.end();
                writer.on('finish', function () {
                    response.message = response.fileName;
                    response.filePath = filepath;
                    response.date = new moment().format("Y-MM-D");
                    response.time = new moment().format("hh:mm A");
                    this.insertMessage(response, socket);
                    socket.to(response.toSocketId).emit('addMessageResponse', response);
                    socket.emit('image-uploaded', response);
                }.bind(this));
            });

            socket.on('disconnect', async () => {
                const isLoggedOut = await helper.logoutUser(socket.id);
                socket.broadcast.emit('chatListRes', {
                    userDisconnected: true,
                    socket_id: socket.id
                });
        	});
        });
    }

    async insertMessage(data, socket){
        const sqlResult = await helper.insertMessages({
            type: data.type,
            fileFormat: data.fileFormat,
            filePath: data.filePath,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            message: data.message,
            date: data.date,
            time: data.time,
            ip: socket.request.connection.remoteAddress
        });
    }

    socketConfig(){
        this.io.use( async (socket, next) => {
            let userId = socket.request._query['id'];
            let userSocketId = socket.id;
            const response = await helper.addSocketId( userId, userSocketId);
            if(response &&  response !== null){
                next();
            }else{
                console.error(`Socket connection failed, for  user Id ${userId}.`);
            }
        });
        this.socketEvents();
    }
}
module.exports = Socket;
