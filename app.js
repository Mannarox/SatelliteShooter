var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require('socket.io')(server);
// var html = require('html');
//var jade = require('jade');
//var util = require('util');
//var port = 4005;
var globalRoom = []; //игровые комнаты и их содержимое
var globalIntervalOfStorage = [];

app.set('views', './views');
//app.set('view engine', "jade");
app.use( express.static('public') );

app.get('/', function(req, res){
    res.sendfile('views/index2.html');
});

function cloneObject(obj) { //функция копирования объекта
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
 
    var temp = obj.constructor(); 
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
 
    return temp;
}


//====SOCKET=====
io.on("connection", function(socket){
    // console.log(socket.id + " connection installed"); 

    socket.on("newPlayer", function(name){
        
        console.log("Запрос с клиента прошел!");
    	
    	if (globalRoom.length > 0) { //если есть комнаты
            // console.log('комната есть');
    	   // var copyGlobalRoom =[];
    	    
    	    var copyGlobalRoom = ( cloneObject(globalRoom) );
    	    var lastRoom = copyGlobalRoom[copyGlobalRoom.length -1];
    	    
    	   // copyGlobalRoom.push(globalRoom); //что бы не было ссылки на оригинальный массив
    	   // copyGlobalRoom = globalRoom.concat();
    	   // socket.emit("informationServer", copyGlobalRoom);
    	    for (var i = 0; i < copyGlobalRoom.length; i++ ) {
                // console.log( "цикл Проходимся по комнатам");
            
    	        for(var b = 0; b < copyGlobalRoom[i].length; b++){ 
    	            if(copyGlobalRoom[i][b].nick == name) {
    	               // console.log(90000000000000);
    	               // console.log(copyGlobalRoom[i][b].nick);
    	                console.log(name +" это имя занято!");
                        var HasNick = true;
        	            socket.emit("StatusName", HasNick); //Если имя занято на сервере
        	            break
                    } else {
                        if(i == copyGlobalRoom.length - 1 && b == copyGlobalRoom[i].length -1){
                            console.log(name +" это имя свободно");
                            var HasNick = false;
                            socket.emit("StatusName", HasNick);//Если имени нет среди других имен
                            putOnServer(copyGlobalRoom,lastRoom);
                        }
                    }
                // console.log("конец цикла на проверку имени внутри комнаты");
    	        }
    	   // console.log("конец цикла на прохождение по комнатам (проверка имен)");
    	    }
    	    
    	}  else {
    	    var HasNick = false;
            socket.emit("StatusName", HasNick); //Если имя свободно
            putOnServer();
    	}

    	function putOnServer(copyGlobalRoom,lastRoom){// Создание игровых комнат Начало

	    	if (globalRoom.length > 0) { //Если есть комната
	    	    
	    	    if (lastRoom.length < 3) { //и в Последней комнате есть свободное место
	    	    
	    	        var lastRoomLength = lastRoom.length;
	    	        for(var i = 0; i<lastRoomLength; i++){
	    	             socket.emit('toAcceptNames',lastRoom[i].nick); // Получаю имена тех кто со мной в одной комнате
	    	             io.to(lastRoom[i].id).emit("sendName", name); // остальные в комнате получают моё имя
	    	             
	    	             if(i == lastRoom.length -1){
        	                var PlayerData = {};
        	    	        PlayerData.nick = name;
        	    	        PlayerData.id = socket.id;
        	    	        globalRoom[globalRoom.length -1].push(PlayerData);
        	    	      //  console.log( globalRoom + "получил других игроков, отправил игрока в комнату");
	    	            }
	    	        }
	    	    } else { // и в Последней комнате нет свободного места
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
        
        	} else { //Если на сервере нет ни одной комнаты
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
        	// Создание игровых комнат Конец
        	
        	socket.emit("informationServer", globalRoom);
    	}
    });

//===============Получение и отправка координат курсора игроков=========
    socket.on('coordinatesAndName', function(coord){
    	//console.log(coord);
    	socket.broadcast.emit("NameAndcoordinates",coord);
    });
//===============Получение и отправка координат курсора игроков=====The end==== 

//===============кто то нажал начать игру в комнате===================
    socket.on("startGame", function(nameWhoClickPlay){
        var thisRoom;
        var thisIntervalStorage;
  
        searchPlayers:for (var i = 0; i < globalRoom.length; i++ ) { //определение комнаты игрока и количество игроков в ней
            for(var b = 0; b < globalRoom[i].length; b++){
                if(globalRoom[i][b].nick == nameWhoClickPlay){
                    thisRoom = globalRoom[i];
                    thisIntervalStorage = globalIntervalOfStorage[i];
                    // console.log(thisRoom + " |||| "+globalRoom[i]);
                    for(var c = 0; c < thisRoom.length; c++ ){ //уведомление других игроков о запуске игры
                        if(thisRoom[c].nick != nameWhoClickPlay){
                            io.to( thisRoom[c].id ).emit("turnOffPanel");
                            console.log("отправляю игроку отключить панель!");
                        }
                    }
                    break searchPlayers;
                }
            }
        }
        function randomInteger(min, max) { // генератор диапозона чисел
            var rand = min - 0.5 + Math.random() * (max - min + 1);
            rand = Math.round(rand);
            return rand;
        }
        
        
        // ||||Запускх функций Генерации объектов игры|||||
        function checkLenghtRoom() {
            var timeRespawn;
            if (thisRoom.length == 1){timeRespawn = 800} 
            else if(thisRoom.length == 2){timeRespawn = 700}
            else if(thisRoom.length == 3){timeRespawn = 600}
            return timeRespawn
        }
        setTimeout(startSpawnMonster, 1500); //вызов Генерации монстров 
            function startSpawnMonster(){ 
                var monstrInterval = setInterval( startCount, checkLenghtRoom() );   //вызов Интервал генерации монстров
                thisIntervalStorage.monstr = monstrInterval;
            }
        var bossInterval = setInterval(startRandomBoss, 13100); //10500/5000 //вызов Интервал генерации босса
        thisIntervalStorage.boss = bossInterval;
        
        setTimeout(startSpawnHealing, 2000); //Восстановление жизней бункера
            function startSpawnHealing(){
                var healingInterval = setInterval(startSendHealing, 5000);
                thisIntervalStorage.healing = healingInterval;
            }
        // ||||Запуск функций Генерации объектов игры КОНЕЦ|||||
        
 
        
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
//===============кто то нажал начать игру в комнате========the end===========

//===============monstr dead===================
        //СПРОСИТЬ ПРО ПРЕРЫВАНИЕ НЕСКОЛЬКО УРОВНЕЙ ЦИКЛОВ break
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

//===============Healing==Ckick========================
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
//===============Healing==Ckick====the end============

//===============Defeat Game========================
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
//server.listen(port);
console.log("server started on port " + process.env.PORT);
