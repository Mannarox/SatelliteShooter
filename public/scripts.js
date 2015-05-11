
window.onload = function() {
   myFunction(); 
};

function myFunction() {
    var socket = io.connect('https://foralexey-mannarox.c9.io/');
    //var tesssss = document.getElementsByClassName("chat")[0];

    var but = document.getElementsByClassName("button")[0];
    var bigFrom = document.getElementsByClassName("bigForm")[0];
    var forma = document.getElementsByClassName("nameCursor")[0];
    var score = document.getElementsByClassName("score")[0];
    var leaderOfRoom = false;
    var start = document.getElementsByClassName("start")[0];
    var CurrentBunkerLife = document.getElementsByTagName("progress")[0].value;
    var myName;
    // var div = document.createElement('div');
    // console.dir(CurrentBunkerLife);
    
    document.addEventListener("submit",submitt); // отключение события submit
    function submitt(e){
        e.preventDefault();
    }

    but.addEventListener( "click", listen);
    function listen(){
        //var trimValue = forma.value.trim();
        //console.log(trimValue);
        
        if (forma.value == '' || forma.value == " ") {
            alert("Ты забыл ввести имя?");
        } else {
            myName = forma.value;
            socket.emit("newPlayer", myName );
            
            socket.on("StatusName", function(status){
                
                if (status == true) {
                    alert("Имя занято!");
                } else {
                    // console.log("имя есть на сервере = " + status);
                    // var name = forma.value;
                    var NameBox = document.getElementsByClassName("nameBox")[0];
                    var offButton = document.getElementsByClassName("offButton")[0];
                    var div = document.createElement('div');
                    NameBox.innerText = myName;
                    NameBox.style.display = "block";
                    NameBox.id = myName;
                    
                    forma.style.display = "none";
                    offButton.style.display = "none";
                    bigFrom.style.display = "none";
                    
                    div.className ='scorePlayer';
                    div.classList.add(myName);
                    div.innerText = myName + ": 0 очков";
                    score.appendChild(div);
        
                    
                    document.addEventListener("mousemove", mouseMove, false);
                    function mouseMove (event){
                        var x = event.x;
                        var y = event.y;
                        NameBox.style.left = x + 20 + "px";
                        NameBox.style.top = y - 10 + "px";
                        socket.emit("coordinatesAndName", { x:x, y:y, name:myName } );
                        document.removeEventListener("mousemove", mouseMove);
                        setTimeout(addMouseMove, 40);
                    }
                    function addMouseMove() {
                        document.addEventListener("mousemove", mouseMove, false);
                    }
                    
                    start.addEventListener( "click", startGameAllPlayers);
                    function startGameAllPlayers(){
                        socket.emit("startGame", myName); //Кто то в комнате нажал начать игру,(поиск лидера на сервере)
                    }
                }
            });
        }
    }
    
    socket.on("startLeader", function(){ //Лидер комнаты начинает обработку игры
        var div = document.createElement('div');
        var monstrPosition1 = "1%";
        var monstrPosition2 = "2%";
        var numberOfMonstr = 1;
        div.className ='monstr';
        
        setTimeout(function() { 
            setInterval(spownMonster, 1000);
            function spownMonster(){
                div.id = numberOfMonstr;
                numberOfMonstr+=numberOfMonstr;
                document.body.children[1].appendChild(div);
                socket.emit("spawnMonstr",numberOfMonstr);
            }
            
            $(".monstr").on("click", function(){
                console.log("victory!");
            });
            
        }, 2500);

    });
    
    socket.on("sendName",function(name){ //Полчение имени нового игрока
        var div = document.createElement('div');
        var divScore = document.createElement('div');
        
        div.className ='nameBox';
        //console.log(name);
        div.id = name;
        div.innerText = name;
        document.body.children[1].appendChild(div);
        div.style.display = "block";
        // console.log(div);
         
        divScore.className ='scorePlayer';
        divScore.classList.add(name);
        // div.id = names;
        divScore.innerText = name + ": 0 очков";
        score.appendChild(divScore);
    });
    socket.on('toAcceptNames', function(names){ //Получение игроков зашедших раньше на сервер
        console.log("Получил список пользователей на сервере" + names);
        // alert("hello!!!!!");
        var div = document.createElement('div');
        var divScore = document.createElement('div');
        
        div.className ='nameBox';
        div.id = names;
        div.innerText = names;
        document.body.children[1].appendChild(div);
        div.style.display = "block";
         
        divScore.className ='scorePlayer';
        divScore.classList.add(names);
        // div.id = names;
        divScore.innerText = names + ": 0 очков";
        score.appendChild(divScore);
    });
    
    // socket.on("leader", function(value){
    //     leaderOfRoom = true;
    //     console.log("you are leader of room");
    // });
    
    socket.on('NameAndcoordinates',function(NameAndCoord){ //получаем координаты других игроков
        var user = document.getElementById(NameAndCoord.name);
        user.style.left = NameAndCoord.x + 20 + "px";
        user.style.top = NameAndCoord.y - 10 + "px";
        console.log("Получаем информацию от другого пользователя");
    });
 
    socket.on("plugOut", function(disconnectName){ //действие при откючении игроков
        console.log(disconnectName + " был отключен от игры");
        var discUser = document.getElementById(disconnectName);
        var discUserScore = document.getElementsByClassName(disconnectName)[0];
        discUser.style.display = "none";
        discUserScore.style.display = "none";
    });
}
