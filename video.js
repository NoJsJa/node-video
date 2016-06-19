/*基本原理:通过getUserMedia获得摄像头，并通过createObjectURL将数据流复制给video标签的src*/

var messageNode = 0;
//这是聊天列表的聊天信息行数

/*自定义jQuery插件*/
(function($) {
    $.video =  function(s) {
        var s = $.extend({
                video: true,
                audio: false,
                goStream: goStream,
                noStream: noStream,
                callBack: null,
                videoId: 'video'
            }, s),
            video = $('#' + s.videoId),
            canvas = $('#' + s.canvasId),
            getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

        if(!getUserMedia) {
            alert('不支持');
            return false;
        }
        function noStream(err) {
            if(err.PERMISSION_DENIED) {
                alert('用户拒绝了浏览器请求媒体的权限');
            } else if(err.NOT_SUPPORTED_ERROR) {
                alert('constraint中指定的媒体类型不被支持');
            } else if(err.MANDATORY_UNSATISFIED_ERROR) {
                alert('指定的媒体类型未接收到媒体流');
            }
            console.log(err);
        }

        /*一直获取摄像头的数据流调用callback回调函数*/
        function goStream(stream) {
            video[0].src = URL.createObjectURL(stream);
            if(typeof s.callBack == 'function') {
                s.callBack(video[0]);
            }
            stream.oninactive = noStream;
        }
        /*Navigator 对象包含的属性描述了正在使用的浏览器。可以使用这些属性进行平台专用的配置。
        虽然这个对象的名称显而易见的是 Netscape 的 Navigator 浏览器，但其他实现了 JavaScript 的浏览器也支持这个对象。
        Navigator 对象的实例是唯一的，可以用 Window 对象的 navigator 属性来引用它。*/
        getUserMedia.call(navigator, {video: s.video, audio: s.audio}, s.goStream, s.noStream);
    }

})(jQuery);

$(function() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");
    var a = webSocketFuc();
    $.video({callBack: function(video) {
        video.addEventListener('play', function(){
            /*var $this = this;*/
            setInterval(function() {
                /*后面两个参数是坐标点*/
                ctx.drawImage(video, 0, 0);
                /*将canvas转化为图片的image对象*/
                var image = canvas.toDataURL("image/png");
                a.send(JSON.stringify({
                    type: 'image',
                    msg: image
                }));
            }, 100);
        },false);
        video.play();

    }});
    /*#send绑定事件click*/
    $(document).on('click','#send', function () {
        sendMessage();
    });

    /*发送消息*/
    function sendMessage(){
        var msg = $('#test').val();
        if(msg != ''){
            a.send(JSON.stringify({
                type: 'chat',
                msg: msg
            }));
            checkMessageNode();
            $("#chat").append("<span class='send_name shadow3 send_me'>" + '我：'+
                "</span>" + "<span class='send_msg inset-shadow'>" + msg + "</span>" + '<br>');
            $("#test").val('');

        }else {
            alert('消息不能为空！');
        }
    }

    /*返回主页*/
    $("#backButton").click(function(){
        window.location.href = "/chatRoom/homePage.jsp";
    });

    /*接收键盘事件，响应Enter键发送消息*/
    document.onkeydown = function(event){
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if(e && e.keyCode == 13){ // enter 键
            sendMessage();
        }
    };

    /*自动加载emoji表情*/
    (function appendEmoji() {

        var emojiDiv = document.getElementById("emojiDiv");
        if (emojiDiv.hasChildNodes()) {
            while(emojiDiv.hasChildNodes()) {
                emojiDiv.removeChild(emojiDiv.firstChild)
            }
        }
        for(var i = 1; i <= 16; i++) {
            //javascript闭包
            (function() {
                var j = i;
                var emoji = document.createElement("div");
                emoji.setAttribute("class", "emoji");
                var img = document.createElement("img");
                var imgSrc = "emoji/" + i + ".png";
                img.setAttribute("src", imgSrc);
                emoji.appendChild(img);
                emoji.onclick = function() {
                    var emojiMsg = "<img class='emojiMsg' src='emoji/"+ j + ".png'" + ">";
                    a.send(JSON.stringify({
                        type:'emoji',
                        emoji:emojiMsg
                    }));
                    checkMessageNode();
                    $("#chat").append("<span class='send_name shadow3 send_me'>" +
                        '我：'+"</span>"+ emojiMsg + '<br>');

                };
                emojiDiv.appendChild(emoji);
            })();
        }
    })();
})

/*检查聊天页面的节点，超出则清空消息列表*/
function checkMessageNode(){
    //移除子节点，设置最大子节点数为100
    messageNode++;
    if(messageNode >= 100) {
        $('#chat').children().remove();
        messageNode = 0;
    }
}
/*初始化连接服务器*/
function webSocketFuc() {
    var canvas2 = document.getElementById('canvas2');
    var name_sender = document.getElementById('name_sender').innerText;
    var name_sendTo = document.getElementById('name_sendTo').innerText;
    var ctx = canvas2.getContext("2d");
    var wsServer = 'ws://127.0.0.1:8888',
        wss = new WebSocket(wsServer);
    wss.binaryType = "arraybuffer";
    wss.onopen = function() {
        console.log('open');
        wss.send(JSON.stringify({
            type:'identify',
            name_sender:name_sender,
            name_sendTo:name_sendTo
        }));
    }

    wss.onclose = function() {
        console.log('close');
    }
    /* 可以传送json和字符串还有二进制数据 */
    wss.onmessage = function(ev) {
        //video.src = URL.createObjectURL(data);
        var json_arr = JSON.parse(ev.data);
        if(json_arr.type == 'image' ) {
            var image = new Image();
            image.src = json_arr.msg;
            image.onload = function() {
                ctx.drawImage(image, 0, 0);
            }
        }else if(json_arr.type == 'chat'){
            checkMessageNode();
            $("#chat").append("<span class='send_name shadow3'>" + name_sendTo + '：'+"</span>" +
                "<span class='send_msg inset-shadow'>" + json_arr.msg + "</span>" + '<br>');
        }else if(json_arr.type == 'emoji'){
            checkMessageNode();
            $("#chat").append("<span class='send_name shadow3'>" + name_sendTo + '：'+"</span>"+ json_arr.emoji + '<br>');
        }
    }
    wss.onerror = function(err) {
        console.log(err);
    }
    return wss;
}