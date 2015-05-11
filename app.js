var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require('socket.io')(server);
// var html = require('html');
//var jade = require('jade');
//var util = require('util');
//var port = 4005;
var allUserOnServer = {}; //хранилище имен игроков на сервере
var room = [];

app.set('views', './views');
//app.set('view engine', "jade");
app.use( express.static('public') );

app.get('/', function(req, res){
    //res.render("index");
    res.sendfile('views/index2.html');
});

io.on("connection", function(socket){
    console.log(socket.id + " connection installed"); 

    socket.on("newPlayer", function(name){

    	var usId = socket.id;
    	var lengthUsersOnTheServer = Object.keys( allUserOnServer ).length;
    	
    	if (lengthUsersOnTheServer > 0) {
    	     for (var key in allUserOnServer) {
                if(allUserOnServer[key].nick == name) {
                    var HasNick = true;
    	            socket.emit("StatusName", HasNick); //Если имя занято на сервере
    	            console.log(allUserOnServer);
                } else {
                    putOnServer();
                    var HasNick = false;
                    socket.emit("StatusName", HasNick);//Если имя свободно
                    console.log("New Player"+' "'+name+'" '+ "created");
                }
    	    }
    	}  else {
    	    putOnServer();
    	    var HasNick = false;
            socket.emit("StatusName", HasNick); //Если имя свободно
            console.log("New Player"+' "'+name+'" '+ "created");
    	}
    	
    	function putOnServer(){
    	   // if (lengthUsersOnTheServer > 0) {
        // 	    for (var key in allUserOnServer) {
        // 	        console.log(allUserOnServer[key].nick + " отправлен циклом");
        // 	        socket.emit("toAcceptNames", allUserOnServer[key].nick);
        // 	    }
        // 	}
	        
	        // Создание игровых комнат Начало
	    	if (room.length > 0) { // Создание игровых комнат
        	    var lastRoomLength = room.length - 1; // Номер последней комнаты в массиве

        	    if (room[lastRoomLength].length < 3) {
                    for(var i = 0; i < room[lastRoomLength].length; i++){
                        var playerName = room[lastRoomLength][i];
                        io.to(socket.id).emit("toAcceptNames", playerName);
                        // console.log(room[lastRoomLength][i] + " отправлен циклом");
                        
            
                        for (var key in allUserOnServer) {// Отправка игрока его соседям по комнате
                            if(allUserOnServer[key].nick == playerName){
                                io.to(allUserOnServer[key].nickId).emit("sendName", name);
                                // console.log(name + "вы себя отправили соседям");
                            }
                        }
                        
                        
                    }
                    room[lastRoomLength].push(name);
        	    } else {
        	        var GameRoom = [];
        	        room.push(GameRoom);
        	        var lastRoomLength = room.length - 1;
        	        room[lastRoomLength].push(name);
        	       // socket.emit("leader");
        	    }
        	} else {
        	    var GameRoom = [];
        	    room.push(GameRoom);
        	    room[0].push(name);
        	   // socket.emit("leader");
        	}
        // 	console.log(room);
        	// Создание игровых комнат Конец
        	var playerData = {};
        	allUserOnServer[usId] = playerData;
        	allUserOnServer[usId].nick = name;
        	allUserOnServer[usId].nickId = usId;
        	
        	console.log(room + " комната");
        	
        // 	socket.broadcast.emit('sendName',name);
    	}
    });

    socket.on('coordinatesAndName', function(coord){
    	//console.log(coord);
    	socket.broadcast.emit("NameAndcoordinates",coord);
    });
    
//кто то нажал начать игру в комнате    
    socket.on("startGame", function(nameWhoClickPlay){
        for (var i = 0; i < room.length; i++ ) {
            for(var b = 0; b < room[i].length; b++){
                if(room[i][b] == nameWhoClickPlay){
                    var leaderOfRoom = room[i][0];
                    for (var key in allUserOnServer) {
                        if(allUserOnServer[key].nick == leaderOfRoom){
                            var leaderOfRoomId = allUserOnServer[key].nickId
                            // console.log(room[i][0] +" Че по чем");
                            io.to(leaderOfRoomId).emit("startLeader");
                            //команда лидеру комнаты начать обработку игры
                        }
                    }
                }
            }
        }
    });
//====================================

    socket.on('deleteRoom', function(nameOfLeader){
        
    });

    socket.on('disconnect',function(){
        var usId = socket.id;
        // console.log(allUserOnServer[usId] + " bla bla");
        if (allUserOnServer[usId] != undefined){
            var disconnectName = allUserOnServer[usId].nick;
            console.log("удаляем пользователя с сервера " + allUserOnServer[usId].nick);
        }
        //console.log(disconnectName + " Name cheloveka");
        delete allUserOnServer[usId];
        
        // for (var i = 0; i < room.length; i++ ){
        //     for( var b = 0; b < room[i].length; b++ ){
        //         if (room[i][b] == disconnectName){
        //             room[i].splice(b,1);
        //         }
        //     }
        // }
        socket.broadcast.emit("plugOut", disconnectName );
    });
});

server.listen(process.env.PORT, process.env.HOST);
//server.listen(port);
console.log("server started on port " + process.env.PORT);
