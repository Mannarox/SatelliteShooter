var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require('socket.io')(server);
// var html = require('html');
//var jade = require('jade');
//var util = require('util');
//var port = 4005;
var globalRoom = []; //game rooms and their contents
var globalIntervalOfStorage = [];

app.set('views', './views');
//app.set('view engine', "jade");
app.use( express.static('public') );

app.get('/', function(req, res){
    res.sendfile('views/index2.html');
});


//====function of copy of object====
function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    var temp = obj.constructor(); 
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
    return temp;
}
//====function of copy of object The END====


//====SOCKET====START=====
io.on("connection", function(socket){ //new player connected to server
    socket.on("newPlayer", function(name){
        
        console.log("Запрос с клиента прошел!");
    	
    	if (globalRoom.length > 0) { //if server has game rooms
    	    var copyGlobalRoom = ( cloneObject(globalRoom) );
    	    var lastRoom = copyGlobalRoom[copyGlobalRoom.length -1];
    	    
    	    for (var i = 0; i < copyGlobalRoom.length; i++ ) {//go through all the game rooms
            
    	        for(var b = 0; b < copyGlobalRoom[i].length; b++){ //go through all players in every game room
    	            if(copyGlobalRoom[i][b].nick == name) { //check names on server, if name is occupied
    	                console.log(name +" это имя занято!");
                        var HasNick = true;
        	            socket.emit("StatusName", HasNick); //to say to client, that name is occupied
        	            break;
                    } else {
                        if(i == copyGlobalRoom.length - 1 && b == copyGlobalRoom[i].length -1){
                            console.log(name +" это имя свободно");
                            var HasNick = false;
                            socket.emit("StatusName", HasNick);//if this the name is not on the server, among other names
                            putOnServer(copyGlobalRoom,lastRoom);
                        }
                    }
    	        }
    	    }
    	}  else { //if the server does not have playrooms
    	    var HasNick = false;
            socket.emit("StatusName", HasNick); //the server does not have game rooms and is free nick, tell it to the client
            putOnServer(); //to start to create playroom and to put nick in room (call)
    	}

    	function putOnServer(copyGlobalRoom,lastRoom){// to start to create playroom and to put nick in room

	    	if (globalRoom.length > 0) { //if server has game rooms
	    	    
	    	    if (lastRoom.length < 3) { //and last room has free place
	    	        var lastRoomLength = lastRoom.length;
	    	        for(var i = 0; i<lastRoomLength; i++){//go through all the users in the room
	    	             socket.emit('toAcceptNames',lastRoom[i].nick); //I get the names of those who came before me in room
	    	             io.to(lastRoom[i].id).emit("sendName", name); //those who are already in the room, accept my nick
	    	             
	    	             //=====data of new player to put to server====:
	    	             if(i == lastRoom.length -1){
        	                var PlayerData = {};
        	    	        PlayerData.nick = name;
        	    	        PlayerData.id = socket.id;
        	    	        globalRoom[globalRoom.length -1].push(PlayerData);
	    	             }
	    	             //=====data of new player to put to server====the end
	    	        }
	    	    } else { //and last room hasn't free place, //=====data of new player to put to server====:
	    	        var GameRoom = [];
            	    var PlayerData = {};
            	    var roomIntervalStorage = {};
            	    PlayerData.nick = name;
    	    	    PlayerData.id = socket.id;
    	    	    GameRoom.push(PlayerData);
            	    globalRoom.push(GameRoom);
            	    globalIntervalOfStorage.push(roomIntervalStorage);
            	    console.log("New Player"+' "'+name+'" '+ "created");
	    	    }
	    	    //=====data of new player to put to server====the end
        
        	} else { //if server has not rooms
        	    var GameRoom = [];
        	    var PlayerData = {};
        	    var roomIntervalStorage = {};
        	    PlayerData.nick = name;
	    	    PlayerData.id = socket.id;
	    	    GameRoom.push(PlayerData);
        	    globalRoom.push(GameRoom);
        	    globalIntervalOfStorage.push(roomIntervalStorage);
        	    console.log("New Player"+' "'+name+'" '+ "created");
        	   // socket.emit("leader");
        	}
        	
        	socket.emit("informationServer", globalRoom); //send information for developers
    	}
    });

//===============to accept and send coordinates about cursor all players=========
    socket.on('coordinatesAndName', function(coord){
    	//console.log(coord);
    	socket.broadcast.emit("NameAndcoordinates",coord);
    });
//===============to accept and send coordinates about cursor all players=====The end==== 

//===============someone pushed the button to start game===================
    socket.on("startGame", function(nameWhoClickPlay){
        var thisRoom;
        var thisIntervalStorage;
  
        searchPlayers:for (var i = 0; i < globalRoom.length; i++ ) { //definition of room of player who clicked button and number of players in room
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].nick == nameWhoClickPlay){
                    thisRoom = globalRoom[i];
                    thisIntervalStorage = globalIntervalOfStorage[i];
                    // console.log(thisRoom + " |||| "+globalRoom[i]);
                    for(var c = 0; c < thisRoom.length; c++ ){ //Notify other players, that game is running and turn off panel in client
                        if(thisRoom[c].nick != nameWhoClickPlay){
                            io.to( thisRoom[c].id ).emit("turnOffPanel");
                            console.log("отправляю игроку отключить панель!");
                        }
                    }
                    break searchPlayers;
                }
            }
        }
        function randomInteger(min, max) { // function for generate diapason of numbers
            var rand = min - 0.5 + Math.random() * (max - min + 1);
            rand = Math.round(rand);
            return rand;
        }
        
        
        //=====start of generate game objects=======
        function checkLenghtRoom() {
            var timeRespawn;
            if (thisRoom.length == 1){timeRespawn = 800} 
            else if(thisRoom.length == 2){timeRespawn = 700}
            else if(thisRoom.length == 3){timeRespawn = 600}
            return timeRespawn;
        }
        setTimeout(startSpawnMonster, 1500); //monsters generate
            function startSpawnMonster(){ 
                var monstrInterval = setInterval( startCount, checkLenghtRoom() );   //call of interval generate monsters
                thisIntervalStorage.monstr = monstrInterval;
            }
        var bossInterval = setInterval(startRandomBoss, 13100); //10500/5000 //call of interval generate bosses
        thisIntervalStorage.boss = bossInterval;
        
        setTimeout(startSpawnHealing, 2000); //generate healing box
            function startSpawnHealing(){
                var healingInterval = setInterval(startSendHealing, 5000);
                thisIntervalStorage.healing = healingInterval;
            }
        //=====start of generate game objects=======the end====
        
 
        
        function startCount(){//Генерация монстров
            // console.log( "генерация мобов идет" );
            var monstrPosition = randomInteger(1, 12);
            var identifier = randomInteger(0, 500);
            for (var i = 0; i<thisRoom.length; i++ ) {
                io.to( thisRoom[i].id ).emit("spawnMonster", {position:monstrPosition, monstrId:identifier} );
            }
        }
        function startRandomBoss(){//Генерация босса
            var position = randomInteger(1, 4);
            var bossId = randomInteger(1, 50); //1,10
            console.log("bossnumber "+bossId);
            for (var i = 0; i<thisRoom.length; i++ ) {
                io.to( thisRoom[i].id ).emit("spawnBoss", {position:position, bossNumber:bossId} );
                // console.log("Boss player");
            }
        }
        function startSendHealing(){
            var chance = randomInteger(1, 2);
            if(chance == 2){
                var posTop = randomInteger(10, 90);
                var posLeft = randomInteger(10, 90);
                var healingId = randomInteger(1, 50);
                for (var i = 0; i<thisRoom.length; i++ ) {
                    io.to( thisRoom[i].id ).emit("spawnHealing", {posTop:posTop, posLeft:posLeft, healingId:healingId} );
                }
            }
        }
    });
//===============someone pushed the button to start game========the end===========

//===============monstr dead===================
    socket.on("monstrKill", function(monstrInformation){
        var thisRoom;
        // console.log(monstrInformation.idOfMonstr);  
        searchPlayers:for (var i = 0; i < globalRoom.length; i++ ){
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].nick == monstrInformation.Name) {
                    thisRoom = globalRoom[i];
                    for(var c = 0; c < thisRoom.length; c++){
                          io.to( thisRoom[c].id ).emit("mostrDead", {idOfMonstr: monstrInformation.idOfMonstr, Name:monstrInformation.Name, scorePlayer:monstrInformation.score} );
                        //   console.log(monstrInformation.score);
                    }
                    break searchPlayers;
                }
            }
        }
    });
//===============monstr dead==========the end=========

//===============Boss shot========================
    socket.on("BossShot", function(playerShotName){
        var thisRoom;
        // console.log(monstrInformation.idOfMonstr);  
        searchPlayers:for (var i = 0; i < globalRoom.length; i++ ){
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].nick == playerShotName.Name) {
                    thisRoom = globalRoom[i];
                    for(var c = 0; c < thisRoom.length; c++){
                          io.to( thisRoom[c].id ).emit("BossShotAllPlayers", {Name:playerShotName.Name, scorePlayer:playerShotName.score, idOfBoss:playerShotName.idOfBoss});
                    }
                    break searchPlayers;
                }
            }
        }
    });
//===============Boss shot=======the end============

//===============Healing==Ckick=====================
//========if someone clicked on healing box=========
    socket.on("clickHealing", function(playerClickName){
        var thisRoom;
        // console.log(monstrInformation.idOfMonstr);  
        searchPlayers:for (var i = 0; i < globalRoom.length; i++ ){
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].nick == playerClickName.Name) {
                    thisRoom = globalRoom[i];
                    for(var c = 0; c < thisRoom.length; c++){
                          io.to( thisRoom[c].id ).emit("HealingClickAllPlayers", {Name:playerClickName.Name, scorePlayer:playerClickName.score, idOfHealig:playerClickName.idOfHealing});
                    }
                    break searchPlayers;
                }
            }
        }
    });
//===============Healing==Ckick====the end==========

//===============Defeat Game========================
//======if life of bunker less or zero==============
    socket.on('defeatGame', function(myName){
        console.log("Конец игры пришол");
        //  var thisRoom;
         searchPlayers:for (var i = 0; i < globalRoom.length; i++ ){
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].nick == myName) {
                    // thisRoom = globalRoom[i];
                    
                    clearInterval( globalIntervalOfStorage[i].monstr );
                    clearInterval( globalIntervalOfStorage[i].boss );
                    clearInterval( globalIntervalOfStorage[i].healing );
                    // globalIntervalOfStorage.splice(i, 1); 
                    break searchPlayers;
                }
            }
        }
        
    });
//===============Defeat Game=======the end============

//===============Disconnect player==================
    socket.on('disconnect', function(){
        console.log("Пользователь отключился от сервера");
        searchPlayers:for (var i = 0; i < globalRoom.length; i++ ){
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].id == socket.id) {
                    for(var c = 0; c < globalRoom[i].length; c++){
                        if(globalRoom[i][c].id != socket.id){
                            io.to( globalRoom[i][c].id ).emit("deleteUser", globalRoom[i][b].nick);
                            console.log("отправить клиентам удалить пользователя");
                        }
                    }
                    globalRoom[i].splice(b, 1);
                    console.log("id игрок удален");
                    
                    if( globalRoom[i].length == 0 ){
                        globalRoom.splice(i, 1);
                        
                        clearInterval( globalIntervalOfStorage[i].monstr );
                        clearInterval( globalIntervalOfStorage[i].boss );
                        clearInterval( globalIntervalOfStorage[i].healing );
                        globalIntervalOfStorage.splice(i, 1); 
                        
                        console.log("комната удалена");
                    }
                    break searchPlayers;
                }
            }
        }
    });
//===============Disconnect player=====the end=============
  
});
//====SOCKET===THE END==

server.listen(process.env.PORT, process.env.HOST);
console.log("server started on port " + process.env.PORT);
