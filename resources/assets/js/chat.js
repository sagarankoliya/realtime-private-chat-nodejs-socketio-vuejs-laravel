const WS_URL = $('meta[name=ws_url]').attr("content");
const USER_ID = Number($('meta[name=user_id]').attr("content"));
var socket = io(WS_URL, { query: "id= "+USER_ID });
var app = new Vue({
    el: '#chatApp',
    data: {
        user_id: USER_ID,
        chatLists: [],
        chatBox: [],
        socketConnected : {
            status: false,
            msg: 'Connecting Please Wait...'
        },
        bArr: {}
    },
    methods: {
        chat: function(chat){
            if(!this.chatBox.includes(chat.id)){
                chat.msgCount = 0;
                const chatboxObj = Vue.extend(chatbox);
                let b = new chatboxObj({
                    propsData: {
                        socket: socket,
                        user_id: this.user_id,
                        cChat: chat,
                        chatBoxClose: this.chatBoxClose,
                        chatBoxMinimize: this.chatBoxMinimize
                    }
                }).$mount();
                $('body').append(b.$el);
                this.bArr[chat.id] = b;
                this.chatBox.unshift(chat.id);
                $('#msginput-'+chat.id).focus();
            }else {
                var index = this.chatBox.indexOf(chat.id);
                this.chatBox.splice(index, 1);
                this.chatBox.unshift(chat.id);
                $('#msginput-'+chat.id).focus();
            }
            this.calcChatBoxStyle();
        },
        chatBoxClose: function(eleId){
            $('#chatbox-'+eleId).remove();
            this.bArr[eleId].$destroy();
            var index = this.chatBox.indexOf(eleId);
            this.chatBox.splice(index, 1);
            this.calcChatBoxStyle();
        },
        chatBoxMinimize: function(eleId){
        	$("#chatbox-"+eleId+" .box-body, #chatbox-"+eleId+" .box-footer").slideToggle('slow');
        },
        calcChatBoxStyle(){
            var i = 270; // start position
            var j = 260;  //next position
            this.chatBox.filter(function (value, key) {
                if(key < 4){
                    $('#chatbox-'+value).css("right",i).show();
                    i = i + j;
                }else {
                    $('#chatbox-'+value).hide();
                }

            });
        }
    }
});
socket.on('connect', function(data){
    app.socketConnected.status = true;
    socket.emit('chatList',app.user_id);
});
socket.on('connect_error', function(){
    app.socketConnected.status = false;
    app.socketConnected.msg = 'Could not connect to server';
    app.chatLists = [];
});
socket.on('chatListRes', function(data){
    if (data.userDisconnected) {
        app.chatLists.findIndex(function(el) {
            if(el.socket_id == data.socket_id){
                el.online = 'N';
                el.socket_id = '';
            }
        });
    }else if (data.userConnected) {
        app.chatLists.findIndex(function(el) {
            if(el.id == data.userId){
                el.online = 'Y';
                el.socket_id = data.socket_id;
            }
        });
    }else {
        data.chatList.findIndex(function(el) {
            el.msgCount = 0;
        });
        app.chatLists = data.chatList;
    }
});
// user chat box not open, count incomming  messages
socket.on('addMessageResponse', function(data){
    if(!app.chatBox.includes(data.fromUserId)){
        app.chatLists.findIndex(function(el) {
            if(el.id == data.fromUserId){
                el.msgCount += 1;
            }
        });
    }
});

var chatbox = {
    data: function () {
        return {
            messages: [],
            message: '',
            typing: '',
            timeout: ''
        }
    },
    props: ['user_id','cChat', 'socket', 'chatBoxClose', 'chatBoxMinimize'],
    mounted: function(){
        socket.emit('getMessages', {fromUserId: this.user_id,toUserId: this.cChat.id});
        socket.on('getMessagesResponse', this.getMessagesResponse);
        socket.on('addMessageResponse', this.addMessageResponse);
        socket.on('typing', this.typingListener);
        socket.on('image-uploaded', this.imageuploaded);
    },
    destroyed: function() {
        socket.removeListener('getMessagesResponse', this.getMessagesResponse);
        socket.removeListener('addMessageResponse', this.addMessageResponse);
        socket.removeListener('typing', this.typingListener);
    },
    methods: {
        sendMessage: function(event){
            if(event.keyCode === 13){
                if (this.message.length > 0) {
                    let messagePacket = this.createMsgObj('text', '', this.message);
                    this.socket.emit('addMessage', messagePacket);
                    this.messages.push(messagePacket);
                    this.message = "";
                    this.scrollToBottom();
                }else{
                    alert("Please Enter Your Message.");
                }
            }else{
                if((event.keyCode != 116) && (event.keyCode != 82 && !event.ctrlKey)){
                    this.socket.emit('typing', {typing:'typing...',socket_id:this.cChat.socket_id});
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(this.timeoutFunction, 500);
                }
            }
        },
        timeoutFunction: function(){
            socket.emit("typing", {typing:false,socket_id:this.cChat.socket_id});
        },
        scrollToBottom: function(){
            $("#chatboxscroll-"+this.cChat.id).stop().animate({ scrollTop: $("#chatboxscroll-"+this.cChat.id)[0].scrollHeight}, 1);
        },
        createMsgObj : function(type, fileFormat, message){
            return {
                type: type,
                fileFormat: fileFormat,
                filePath: '',
                fromUserId: this.user_id,
                toUserId: this.cChat.id,
                toSocketId: this.cChat.socket_id,
                message: message,
                time: new moment().format("hh:mm A"),
                date: new moment().format("Y-MM-D")
            }
        },
        addMessageResponse: function(data){
            if (data && data.fromUserId == this.cChat.id) {
                this.messages.push(data);
                this.scrollToBottom();
            }
        },
        typingListener: function(data){
            if (data.typing && data.to_socket_id == this.cChat.socket_id) {
                this.typing = "is "+data.typing;
            } else {
                this.typing = "";
            }
        },
        getMessagesResponse: function(data){
            if (data.toUserId == this.cChat.id) {
                this.messages = data.result;
                this.$nextTick(function () {
                    this.scrollToBottom();
                });
            }
        },
        imageuploaded: function(data){
            if (data && data.toUserId == this.cChat.id) {
                $(".overlay").parent().parent().remove();
                this.messages.push(data);
                this.scrollToBottom();
            }
        },
        file: function(event){
            var file = event.target.files[0];
            if (this.validateSize(file)) {
                let fileFormat = file.type.split('/')[0];
                let reader  = new FileReader();
                reader.onload = function () {
                    let messagePacket = this.createMsgObj('file', fileFormat, reader.result);
                    messagePacket['fileName'] = file.name;
                    socket.emit('upload-image', messagePacket);
                    messagePacket.type = "text";
                    if(fileFormat != 'image'){
                        messagePacket.message = '<span class="info-box-icon bg-primary" style="color: white;background:none;"><i class="fa fa-paperclip"></i></span><div class="overlay"><i style="color:#fff" class="fa fa-refresh fa-spin"></i></div>';
                    }else {
                        let src = URL.createObjectURL(new Blob([reader.result]));
                        messagePacket.message = '<img height="100px;" width="100px;" src="'+src+'"><div class="overlay"><i style="color:#fff" class="fa fa-refresh fa-spin"></i></div>';
                    }
                    this.messages.push(messagePacket);
                    this.scrollToBottom();
                }.bind(this);
                reader.readAsArrayBuffer(file);
            }else {
                event.target.value = "";
                alert('File size exceeds 10 MB');
            }
        },
        validateSize: function(file) {
            var fileSize = file.size / 1024 / 1024; // in MB
            if (fileSize > 10) {
                return false;
            }
            return true;
        }
    },
    filters: {
        dateFormat: function(value) {
            return new moment(value).format("D-MMM-YY")
        }
    },
    template: `
        <div class="chat_box" v-bind:id="'chatbox-' + cChat.id" style="right:270px">
            <div class="box box-primary direct-chat direct-chat-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ cChat.name }}</h3> <span>{{ typing }}</span>
                    <div class="box-tools pull-right">
                        <button type="button" class="btn btn-box-tool" data-widget="collapse" @click="chatBoxMinimize(cChat.id)"><i class="fa fa-minus"></i>
                        </button>
                        <button type="button" class="btn btn-box-tool" @click="chatBoxClose(cChat.id)"><i class="fa fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- /.box-header -->
                <div style="" class="box-body">
                    <div class="direct-chat-messages" v-bind:id="'chatboxscroll-' + cChat.id">
                        <div v-for="messagePacket in messages" class="direct-chat-msg" v-bind:class="{ 'right' : (messagePacket.fromUserId == user_id) }">
                            <div class="direct-chat-info clearfix">
                                <small class="direct-chat-timestamp"  v-bind:class="{ 'pull-right' : (messagePacket.fromUserId == user_id), 'pull-left' : (messagePacket.fromUserId != user_id) }">{{ messagePacket.date | dateFormat }},{{ messagePacket.time }}</small>
                            </div>

                            <div v-if="messagePacket.type == 'text'" v-bind:class="{ 'pull-right' : (messagePacket.fromUserId == user_id), 'pull-left' : (messagePacket.fromUserId != user_id) }" v-html=messagePacket.message class="direct-chat-text clearfix" style="margin-right: 1px;margin-left: 1px;word-break: break-all;padding: 3px 10px;">
                            </div>

                            <div v-if="messagePacket.type == 'file'" v-bind:class="{ 'pull-right' : (messagePacket.fromUserId == user_id), 'pull-left' : (messagePacket.fromUserId != user_id) }" class="direct-chat-text clearfix" style="margin-right: 1px;margin-left: 1px;word-break: break-all;padding: 3px 3px;">
                                <a v-if="messagePacket.fileFormat == 'image'" :href="'`+WS_URL+`' + messagePacket.filePath" download :title="messagePacket.message" target="_new"><img height="110px;" width="110px;" :src="'`+WS_URL+`' + messagePacket.filePath"></a>
                                <a v-else :href="'`+WS_URL+`' + messagePacket.filePath" download :title="messagePacket.message" target="_new"><span class="info-box-icon" style="color: white;background:none;"><i class="fa fa-paperclip"></i></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: block;" class="box-footer">
                    <div class="input-group">
                        <input name="message" v-bind:id="'msginput-' + cChat.id" v-model.trim="message" placeholder="Type Message And Hit Enter" class="form-control" type="text" v-on:keydown="sendMessage($event)">
                        <span class="input-group-btn">
                            <div class="btn btn-default btn-file">
                                <i class="fa fa-paperclip"></i>
                                <input name="attachment" type="file" v-on:change="file($event)">
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        </div>`
};
