var http = require('http');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var httpServer;
//멀티 코어 클러스터
httpServer = http.createServer(function(req, res) {
}).listen(1337);

var io = require('socket.io').listen(httpServer);
console.log('Server running at http://localhost:1337/');

//클라이언트 소켓 정보 저장 key : socket.id, value : userId
var socket_ids = [];
function registerUser(socket, id) {
	
	var checkUser = socket_ids[socket.id];
	
	
	//기존 user 목록에 있다면 삭제 함
	if(checkUser != undefined) delete socket_ids[socket.id];
	
	//key : socket.id, value : userId
	socket_ids[socket.id] = id;
	var list = [];
	for(var key in socket_ids){
		list.push(socket_ids[key]);
	}
	
	io.sockets.emit('userlist', {
		users : list
	})

}

io.sockets.on('connection', function(socket) {
	socket.emit('toclient', {
		msg : 'Welcome !</br>귓속말 : /w 아이디 spacebar</br>'
			 +'리플 : /r spacebar</br>'
			 +'귓속말해지 : /x spacebar</br>'
	});
	
	socket.on('fromclient', function(data) {
		var whisper = data.whisperTarget;
		var socket_id = '';
		if(whisper !== ''){
			for(var key in socket_ids){
				if(socket_ids[key] === whisper){
					socket_id = key;
					break;
				}
			}
			//귓속말 대상 socket id를 찾아 대상자에게만 보냄
			console.log('socket_id : ' + socket_id);
			console.log(socket_ids);
			if(socket_id !== '' && socket_id !== undefined)
				socket.broadcast.to(socket_id).emit('toclient', data);
//				io.sockets.connected[socket_id].emit('toclient', data);
		}else{
			socket.broadcast.emit('toclient', data); // 자신을 제외하고 다른 클라이언트에게 보냄
		}
		//socket.emit('toclient', data); // 모두 보냄
	})
	
	socket.on('init', function(data){
		registerUser(socket, data.userId);
		if(data.userState === 'F'){
			socket.broadcast.emit('toclient', data);	// 나를 제외한 모두에게 알림
		}
		
		if(data.userState === 'CID'){
			socket.emit('toclient', data); 				// 아이디를 변경 하였을경우 나에게 알림
			socket.broadcast.emit('toclient', data);	// 나를 제외한 모두에게 알림		
		}
		
		
	})
	
	socket.on('disconnect', function(){
		delete socket_ids[socket.id];
		var list = [];
		
		for(var key in socket_ids){
			list.push(socket_ids[key]);
		}
		
		io.sockets.emit('userlist', {
			users : list
		})
	})
});


