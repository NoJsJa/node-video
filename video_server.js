var http = require('http');
var app = http.createServer(function(req, res) {
}).listen(8888, function (err) {
   if(err){
      return console.log("err");
   }
    console.log('开启监听！');
});

/*新建websocket服务器*/
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer( { server : app });
wss.on('connection', function(ws) {
    var clients = wss.clients, len = clients.length, i =0;
    for(; i< len; i++) {
        clients[i].send(JSON.stringify({'type':'system', 'msg': 'connection'}));
    }
    ws.on('message', function(data, flags) {
        //确认连接者和发送者
        if(JSON.parse(data).type == 'identify'){
            ws.name_sender = JSON.parse(data).name_sender;
            ws.name_sendTo = JSON.parse(data).name_sendTo;
            console.log(ws.name_sender + " TO " + ws.name_sendTo);
            return;
        }
        var clients = wss.clients, len = clients.length, i =0;
        for(; i< len; i++) {
            if(wss.clients[i].name_sender == (ws.name_sendTo)){
                clients[i].send(data);
            }
        }
    });
    ws.on('close', function(e) {
        if(e == 10001) {
            console.log('现有终端连接数:' + wss.clients.length);
        }
        console.log('close');
    })
});