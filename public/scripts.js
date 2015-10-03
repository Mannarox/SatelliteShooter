
window.onload = function() {
   myFunction(); 
};

function myFunction() {
    var socket = io.connect('https://foralexey-mannarox.c9.io/'); //socket
    var message1 = "Не буду многословен боец, мутанты обнаружили расположение нашего бункера и их орды мчаться сейчас сюда. Наше военное положение крайне тяжелое! Я отдал приказ начать эвакуацию людей.";
    var message2 = "Часть наших отрядов защищает вход. Вам предстоит взять под управление спутник с рельсотронной пушкой, и делать удары с орбиты по подступающим противникам. Продержитесь, сколько сможете. Это приказ!";
    var gamePole = document.getElementsByClassName("gamePole")[0];
    var but = document.getElementsByClassName("buttonAccept")[0];
    var bigFrom = document.getElementsByClassName("bigForm")[0];
    var forma = document.getElementsByClassName("nameCursor")[0];
    var score = document.getElementsByClassName("score")[0];
    var preview = document.getElementsByClassName("preview")[0];
    var start = document.getElementsByClassName("start")[0];
    var ButtonRestart = document.getElementsByClassName("restartGame")[0];
    var SolderPanel = document.getElementsByClassName("SolderPanel")[0];
    var textSolder = document.getElementsByClassName("textSolder")[0];
    var buttonBackUp = document.getElementsByClassName("backUp")[0];
    var buttonForward = document.getElementsByClassName("forward")[0];
    var BunkerLife = document.getElementsByTagName("progress")[0];
    var corpsContainer = document.getElementById("corpsContainer");
    var monstrContainer = document.getElementById("monstrContainer");
    var bonusesContainer = document.getElementById("bonusesContainer");
    var defeatPanel = document.getElementsByClassName("defeatPanel")[0];
    var ContainerResultsPanel = document.getElementsByClassName("ContainerResultsPanel")[0];
    var livesOfBoss;
    var $faceSolder = $(".faceSolder");
    var myName;
    var myScore = 0;
    var SolderTextStep = 1;
    var myWindowWidth = $(window).width();
    var width1Percent = myWindowWidth/100;
    var myWindowHeight = $(window).height();
    var height1Percent = myWindowHeight/100;
    
    // console.log("Ширина окна = "+myWindowWidth);
    // console.log("1% ширины окна = "+width1Percent);
    
    socket.on("informationServer", function(inf){
                // console.log("массив сервера" + inf);
    });
    
    window.addEventListener("resize", function(){
         myWindowWidth = $(window).width();
         width1Percent = myWindowWidth/100;
         myWindowHeight = $(window).height();
         height1Percent = myWindowHeight/100;
    });
    document.addEventListener("submit",submitt); //turn off event submit
    function submitt(e){
        e.preventDefault();
    }
    forma.addEventListener("paste", function(e){ //turn off paste (ctrl + V)
        e.preventDefault();
    });
    forma.addEventListener("keypress", function(e){
        if(e.keyCode == 32){
            e.preventDefault();
        } else if(e.keyCode == 13){
            listen();
        }
    });
    
    but.addEventListener( "click", listen); // clicked accept nick button
    function listen(){
        if (forma.value == '' || forma.value == " ") {
            alert("Ты забыл ввести имя?");
        } else {
            myName = forma.value;
            socket.emit("newPlayer", myName ); // send nick on server for check, occupied nick or free
        }
    }
    socket.on("StatusName", function(status){ // status of nick on server
        console.log("Получаем статус имени!");
        if (status == true) { //if nick occupied on server
            alert("Имя занято!");
        } else { //if nick free on server
            console.dir(score);
            
            myName = forma.value;
            var NameBox = document.getElementsByClassName("nameBox")[0];
            var div = document.createElement('div');
            var divName = document.createElement('div');
            var divScore = document.createElement('div');
            NameBox.innerText = myName;
            NameBox.id = myName;
            
            NameBox.style.display = "block";
            gamePole.style.display = "block";
            bigFrom.style.display = "none";
            
            div.className ='scorePlayer';
            divName.className ='defeatName';
            divScore.className ='defeatScore';
            div.id = myName+"Score";
            divName.innerText = myName + " : ";
            divScore.innerText = " 0 очков";
            score.appendChild(div);
            div.appendChild(divName);
            div.appendChild(divScore);
            
            document.addEventListener("mousemove", mouseMove, false); //listening to mouse movements of users
            function mouseMove (event){
                var x = event.x;
                var y = event.y;
                NameBox.style.left = x + 20 + "px";
                NameBox.style.top = y - 10 + "px";
                var leftCoord = x/width1Percent; 
                var topCoord = y/height1Percent;
                
                socket.emit("coordinatesAndName", { name:myName, xLeft:leftCoord, yTop:topCoord } ); //send mouse coordinates other users in my room
                document.removeEventListener("mousemove", mouseMove);
                setTimeout(addMouseMove, 40);
            }
            function addMouseMove() {
                document.addEventListener("mousemove", mouseMove, false);
            }
            
            buttonBackUp.addEventListener( "click", function(){ //button for back up message of soldier
                if(SolderTextStep == 2){
                   SolderTextStep = 1; 
                   textSolder.innerText = message1;
                }
            });
            buttonForward.addEventListener( "click", function(){ //button for next message of soldier
                if(SolderTextStep == 1){
                   SolderTextStep = 2; 
                   textSolder.innerText = message2;
                }
            });
            
            start.addEventListener( "click", startGameAllPlayers);
        }
    });
  
    
    
    function startGameAllPlayers(){ //if player clicked button START GAME!
        alert("startGame!");
        BunkerLife.value = 100;
        socket.emit("startGame", myName); //send start to server, (start calculation in server)
        SolderPanel.style.display = "none";
        preview.style.width = "auto";
    }
    socket.on("turnOffPanel", function(){ //turn off panel of message of solder
        $faceSolder.css( "background-image","url(./image/soldier3.png)" );
        SolderPanel.style.display = "none";
        preview.style.width = "auto";
        
        if(defeatPanel.style.display == "block"){
            var LengthContainerResultsPanel = ContainerResultsPanel.children.length;
            for(var i = 0; i < LengthContainerResultsPanel; i++){
              ContainerResultsPanel.children[0].remove();
            }
            for(var i = 0; i < score.children.length; i++){
                score.children[i].children[1].innerText = "0 очков";
            }
            defeatPanel.style.display = "none";
            BunkerLife.value = 100;
        }
    });
    
    function GameOver(){ //DEFEAT GAME , if bunker was destroyed ( life = 0 )
    
        socket.emit("defeatGame", myName);
        
        //==wipe off monsters in map==========
        $(".monstr").remove();
        $(".boss").remove();
        setTimeout(function(){
            $(".monstr").remove();
            $(".boss").remove();
        },200);
        //==wipe off monsters in maps==the end==
        
        myScore = 0; //reset my points
        
        //====cycle add information about players in panel of results===
        for(var i = 0; i<score.children.length; i ++){
            
            var name = score.children[i].children[0].innerText;
            var playerPoints = score.children[i].children[1].innerText;
      
            var div = document.createElement('div');
            var divName = document.createElement('div');
            var divScore = document.createElement('div');
            
            div.className ='resultsPanel';
            divName.className ='defeatName';
            divScore.className ='defeatScore';
            
            divName.innerText = name;
            divScore.innerText = playerPoints;
            
            div.appendChild(divName);
            div.appendChild(divScore);
            ContainerResultsPanel.appendChild(div);
        }
        //====cycle add information about players in panel of results===the end==
        
        defeatPanel.style.display = "block";

        ButtonRestart.addEventListener( "click", function(){ // button of "Начать заново"
            $faceSolder.css( "background-image","url(./image/soldier3.png)" );
            SolderPanel.style.display = "block";
            preview.style.width = "560px";
            
            var LengthContainerResultsPanel = ContainerResultsPanel.children.length;
            for(var i = 0; i < LengthContainerResultsPanel; i++){
              ContainerResultsPanel.children[0].remove();
            }
            for(var i = 0; i < score.children.length; i++){
                score.children[i].children[1].innerText = "0 очков";
            }
            defeatPanel.style.display = "none";
        });
    }
    
    
    //=====accept simple monsters from server======
    socket.on("spawnMonster", function(monstrData){
        var div = document.createElement('div');
        
        if (monstrData.position == 1) {
            div.className ='monstr';
            div.classList.add("position1");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationTopToBottom.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 2) {
            div.className ='monstr';
            div.classList.add("position2");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationTopToBottom.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 3) {
            div.className ='monstr';
            div.classList.add("position3");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationTopToBottom.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 4) {
            div.className ='monstr';
            div.classList.add("position4");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationRightToLeft.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 5) {
            div.className ='monstr';
            div.classList.add("position5");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationRightToLeft.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 6) {
            div.className ='monstr';
            div.classList.add("position6");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationRightToLeft.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 7) {
            div.className ='monstr';
            div.classList.add("position7");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationBottomToTop.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 8) {
            div.className ='monstr';
            div.classList.add("position8");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationBottomToTop.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 9) {
            div.className ='monstr';
            div.classList.add("position9");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationBottomToTop.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 10) {
            div.className ='monstr';
            div.classList.add("position10");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationLeftToRight.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 11) {
            div.className ='monstr';
            div.classList.add("position11");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationLeftToRight.gif)";
            monstrContainer.appendChild(div);
        } else if(monstrData.position == 12) {
            div.className ='monstr';
            div.classList.add("position12");
            div.id = "Monstr" + monstrData.monstrId;
            div.style.backgroundImage = "url(./image/monstrAnimationLeftToRight.gif)";
            monstrContainer.appendChild(div);
        }
        
        //========if after 7 seconds, monster entered in bunker, bunker loses 10 lives========
        setTimeout(function(){
            if($("#Monstr"+monstrData.monstrId)[0] != undefined){
                $("#Monstr"+monstrData.monstrId).remove();
                BunkerLife.value -= 10;
                
                if( BunkerLife.value <= 50 && BunkerLife.value >= 40 ){
                     $faceSolder.css( "background-image","url(./image/soldier3_injured.png)" );
                } else if ( BunkerLife.value == 0){
                    GameOver();
                }
            }
        }, 7000);
        //====if after 7 seconds, monster entered in bunker, bunker loses 10 lives====the end==
        
        $(".monstr").off("click");  
        $(".monstr").on("click", function(event){ //if player clicked on monster
            socket.emit( "monstrKill", {Name:myName, idOfMonstr:$(this).attr("id"), score:myScore } );//send identifier dead monster to server
        });
    });
    //=====accept simple monsters from server======the end=====
    
    socket.on("mostrDead", function(monstrData){ // accept from server dead monster, for delete
        var corps = document.createElement('img');
        var expl = document.createElement('img');
        var coordY = $("#"+monstrData.idOfMonstr).offset().top; 
        var coordX = $("#"+monstrData.idOfMonstr).offset().left;
        
        //====create explosion animation====
        expl.className ='explosion';
        expl.src = "https://foralexey-mannarox.c9.io/image/explosionAnimation.gif";
        expl.style.top = coordY+"px";
        expl.style.left = coordX+"px";
        document.body.children[1].appendChild(expl);
        setTimeout(function(){
            expl.remove();
        },700);
        //====create explosion animation====the end===
        
        //====create corps of monster====
        corps.className ='corps';
        corps.src = "https://foralexey-mannarox.c9.io/image/corps.png";
        corps.style.top = coordY+"px";
        corps.style.left = coordX+"px";
        corpsContainer.appendChild(corps);
        setTimeout(function(){
            corps.remove();
        },6000);
        //====create corps of monster====the end===
        
        $("#"+monstrData.idOfMonstr).remove();
        var addPoints = monstrData.scorePlayer += 10;
        if(monstrData.Name == myName){myScore += 10;}
        $("#"+monstrData.Name+"Score")[0].children[1].innerText = addPoints+" очков";
    });
    
    //=====accept monster boss from server===========
    socket.on("spawnBoss", function(bossData){
        var divBoss = document.createElement('div');
        livesOfBoss = 3;
        if(bossData.position == 1){
            // console.log("BOS111111");
            divBoss.classList.add("position2");
            divBoss.classList.add("boss");
            divBoss.id = "Boss"+bossData.bossNumber;
            divBoss.style.backgroundImage = "url(./image/bossTopToBottom.gif)";
            monstrContainer.appendChild(divBoss);
        } else if(bossData.position == 2){
            // console.log("BOS222222");
            divBoss.classList.add("position5");
            divBoss.classList.add("boss");
            divBoss.id = "Boss"+bossData.bossNumber;
            divBoss.style.backgroundImage = "url(./image/bossRightToLeft.gif)";
            monstrContainer.appendChild(divBoss); 
        } else if(bossData.position == 3){
            // console.log("BOS333333");
            divBoss.classList.add("position8");
            divBoss.classList.add("boss");
            divBoss.id = "Boss"+bossData.bossNumber;
            divBoss.style.backgroundImage = "url(./image/bossBottomToTop.gif)";
            monstrContainer.appendChild(divBoss); 
        } else if(bossData.position == 4){
            // console.log("BOS444444");
            divBoss.classList.add("position11");
            divBoss.classList.add("boss");
            divBoss.id = "Boss"+bossData.bossNumber;
            divBoss.style.backgroundImage = "url(./image/bossLeftToRight.gif)";
            monstrContainer.appendChild(divBoss); 
        }
        setTimeout(function(){
            if($("#Boss"+bossData.bossNumber)[0] != undefined){
                $("#Boss"+bossData.bossNumber).remove();
                BunkerLife.value -= 15;
                
                if( BunkerLife.value <= 50 && BunkerLife.value >= 40 ){
                     $faceSolder.css( "background-image","url(./image/soldier3_injured.png)" );
                } else if ( BunkerLife.value == 0){
                    GameOver();
                }
            }
        }, 10000);
        
        $("#Boss"+bossData.bossNumber).off("click");  
        $("#Boss"+bossData.bossNumber).on("click", function(){
            console.log("BossShot!");
            socket.emit( "BossShot", {Name:myName, idOfBoss:$(this).attr("id"), score:myScore} );
        });
    });
    //=====accept monster boss from server=======the end====
    
    socket.on("BossShotAllPlayers", function(nameWhoShot){ // accept from server dead boss, for delete
        var corps = document.createElement('img');
        var corps = document.createElement('img');
        var expl = document.createElement('img');
        var coordY = $("#"+nameWhoShot.idOfBoss).offset().top; 
        var coordX = $("#"+nameWhoShot.idOfBoss).offset().left;
        
        //====create explosion animation====
        expl.className ='explosion';
        expl.src = "https://foralexey-mannarox.c9.io/image/explosionAnimation.gif";
        expl.style.top = coordY+"px";
        expl.style.left = coordX+"px";
        document.body.children[1].appendChild(expl);
        setTimeout(function(){
            expl.remove();
        },700);
        //====create explosion animation====the end===
        
        livesOfBoss -= 1;
        var addPoints = nameWhoShot.scorePlayer += 15;
        if(nameWhoShot.Name == myName){myScore += 15;}
        $("#"+nameWhoShot.Name+"Score")[0].children[1].innerText = addPoints+" очков";
        
        if(livesOfBoss == 0){
            //====create corps of monster============
            $("#"+nameWhoShot.idOfBoss).remove();
            corps.className ='bossCorps';
            corps.src = "https://foralexey-mannarox.c9.io/image/bossCorps.png";
            corps.style.top = coordY+"px";
            corps.style.left = coordX+"px";
            corpsContainer.appendChild(corps);
            
            setTimeout(function(){
                corps.remove();
            },8000);
            //====create corps of monster===the end===
        }
    });
    
    socket.on("spawnHealing", function(healingData){// accept from server healing box
        var healingBox = document.createElement('div');
        healingBox.className ='healingBox';
        healingBox.style.top = healingData.posTop * height1Percent + "px";
        healingBox.style.left = healingData.posLeft * width1Percent + "px";
        
        healingBox.id = "Healing"+healingData.healingId;
        bonusesContainer.appendChild(healingBox); 
        
        setTimeout(function(){
            $("#Healing"+healingData.healingId).remove();
        },2500);
        
        $(".healingBox").off("click");  
        $(".healingBox").on("click", function(){
             socket.emit( "clickHealing", {Name:myName, idOfHealing:$(this).attr("id"), score:myScore} );
        });
    });
    socket.on("HealingClickAllPlayers", function(healingData){ // accept from server information about player who clicked on healing box
        var addPoints = healingData.scorePlayer += 10;
        if(healingData.Name == myName){myScore += 10;}
        $("#"+healingData.Name+"Score")[0].children[1].innerText = addPoints+" очков";
        $("#"+healingData.idOfHealig).remove();
        BunkerLife.value += 15;
        
    });
    
    
    socket.on("sendName",function(name){ //accept new name of new player (присоеденяются после меня (connceted after me))
        var div = document.createElement('div');
        var divScore = document.createElement('div');
        var divScoreName = document.createElement('div');
        var divScoreNameScore = document.createElement('div');

        
        div.className ='nameBox';
        div.id = name;
        div.innerText = name;
        document.body.children[1].appendChild(div);
        div.style.display = "block";
         
        divScore.className ='scorePlayer';
        divScore.id = name+"Score";
        divScoreName.className ='defeatName';
        divScoreNameScore.className ='defeatScore';
        
        // divScore.classList.add(name);
        divScoreName.innerText = name + " : ";
        divScoreNameScore.innerText = " 0 очков";
        
        score.appendChild(divScore);
        divScore.appendChild(divScoreName);
        divScore.appendChild(divScoreNameScore);
    });
    
    //======accept nick of player who went on server before I=======
    socket.on('toAcceptNames', function(names){ //Получение игроков зашедших раньше на сервер
        console.log("Получил список пользователей на сервере" + names);
        // alert("hello!!!!!");
        var div = document.createElement('div');
        var divScore = document.createElement('div');
        var divScoreName = document.createElement('div');
        var divScoreNameScore = document.createElement('div');
        
        div.className ='nameBox';
        div.id = names;
        div.innerText = names;
        document.body.children[1].appendChild(div);
        div.style.display = "block";
         
        divScore.className ='scorePlayer';
        divScore.id = names+"Score";
        
        divScoreName.className ='defeatName';
        divScoreNameScore.className ='defeatScore';

        // divScore.innerText = names + ": 0 очков";
        divScoreName.innerText = names + " : ";
        divScoreNameScore.innerText = " 0 очков";
        
        score.appendChild(divScore);
        divScore.appendChild(divScoreName);
        divScore.appendChild(divScoreNameScore);
    });
    //======accept nick of player who went on server before I===the end=====
    

    //======accept coordinates of cursors other players in my room===============
    socket.on('NameAndcoordinates',function(NameAndCoord){ //получаем координаты других игроков с клиентов
        var user = document.getElementById(NameAndCoord.name);
        user.style.left = Math.round( width1Percent * NameAndCoord.xLeft ) + "px";
        user.style.top = Math.round( height1Percent * NameAndCoord.yTop ) + "px";
    });
    //======accept coordinates of cursors other players=====the end====
    
    socket.on("deleteUser", function(disconnectName){ //действие при откючении игроков (if player disconnected)
        console.log(disconnectName + " был отключен от игры");
        var discUser = document.getElementById(disconnectName);
        var discUserScore = document.getElementById(disconnectName+"Score");
        discUser.remove();
        discUserScore.remove();
    });
}
