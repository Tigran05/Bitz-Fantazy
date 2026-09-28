/*:
 * @plugindesc BitzFantasy — мини-игра разоблачения жулика. Понятный интерфейс 816x624.
 * @help
 * Plugin Command: Cheater start
 * Управление: мышь / touch. После 3 правильных наблюдений нужно найти устройство на ноге.
 * Успех включает Self Switch A события, запустившего игру и сообщает BF_QuestSystem о SUCCESS.
 */
(function(){
"use strict";

var CM={mapId:0,eventId:0};
var old=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(c,a){
    old.call(this,c,a);
    if(String(c).toLowerCase()==="cheater" && a && String(a[0]).toLowerCase()==="start"){
        CM.mapId=$gameMap.mapId();
        CM.eventId=this._eventId;
        // Регистрируем запуск мини-игры в системе квестов.
        // Иначе BF_QuestSystem не знает, какой квест должен получить SUCCESS.
        if(window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameStart === "function") window.BF_QuestSystem.minigameStart("BF_Cheater", "manager");
        SceneManager.push(Scene_CheaterMini);
    }
};

function outline(b,x,y,w,h,c,t){
    t=t||2;
    b.fillRect(x,y,w,t,c);
    b.fillRect(x,y+h-t,w,t,c);
    b.fillRect(x,y,t,h,c);
    b.fillRect(x+w-t,y,t,h,c);
}
function panel(b,x,y,w,h,fill,border){
    b.fillRect(x,y,w,h,fill);
    outline(b,x,y,w,h,border||"#5b8795",2);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function Scene_CheaterMini(){this.initialize.apply(this,arguments);}
Scene_CheaterMini.prototype=Object.create(Scene_Base.prototype);
Scene_CheaterMini.prototype.constructor=Scene_CheaterMini;

Scene_CheaterMini.prototype.initialize=function(){
    Scene_Base.prototype.initialize.call(this);
    this.round=0;
    this.target=-1;
    this.locked=false;
    this.phase=0;
    this.pos=[];
    this.lastStatus="";
};

Scene_CheaterMini.prototype.create=function(){
    Scene_Base.prototype.create.call(this);
    var W=Graphics.boxWidth,H=Graphics.boxHeight;

    var bg=new Sprite(ImageManager.loadPicture("CheaterMini/cheater_background"));
    bg.scale.x=W/816;
    bg.scale.y=H/624;
    this.addChild(bg);

    // затемнение верхней/нижней областей, чтобы текст читался и не обрезался
    this.header=new Sprite(new Bitmap(W,122));
    this.header.bitmap.fillRect(0,0,W,122,"rgba(4,5,10,.92)");
    this.addChild(this.header);

    var b=this.header.bitmap;
    b.fontSize=27;
    b.textColor="#f0d16a";
    b.drawText("РАЗОБЛАЧЕНИЕ ЖУЛИКА",20,12,W-40,34,"center");
    b.fontSize=17;
    b.textColor="#d9e4ea";
    b.drawText("Наблюдай за жуликом и запоминай, в какой автомат он перемещается.",20,52,W-40,24,"center");
    b.drawText("После трёх наблюдений найди устройство на его ноге.",20,78,W-40,24,"center");

    // Три этапа. Всегда видны, но подсвечивается только текущий.
    this.steps=new Sprite(new Bitmap(W,68));
    this.steps.y=122;
    this.addChild(this.steps);
    this.drawSteps();

    // Слоты
    var gap=18, slotW=188, total=slotW*3+gap*2, start=(W-total)/2;
    this.pos=[start+slotW/2,start+slotW+gap+slotW/2,start+2*(slotW+gap)+slotW/2];
    this.m=[];
    var names=["АВТОМАТ №1","АВТОМАТ №2","АВТОМАТ №3"];
    for(var i=0;i<3;i++){
        var z=new Sprite(new Bitmap(slotW,82));
        z.x=start+i*(slotW+gap);
        z.y=272;
        z._i=i;
        panel(z.bitmap,0,0,slotW,82,"rgba(8,17,25,.94)","#6d9aaa");
        z.bitmap.fontSize=20;
        z.bitmap.textColor="#e8f5ff";
        z.bitmap.drawText(names[i],0,22,slotW,30,"center");
        z.bitmap.fontSize=13;
        z.bitmap.textColor="#a8bdc8";
        z.bitmap.drawText("НАБЛЮДАЙ",0,51,slotW,20,"center");
        this.addChild(z);this.m.push(z);
    }

    this.ch=new Sprite(ImageManager.loadSystem("CheaterMini/cheater"));
    this.ch.anchor.x=.5;this.ch.anchor.y=1;
    this.ch.x=this.pos[0];this.ch.y=264;
    this.addChild(this.ch);

    // Правая компактная инструкция — без дублирования текста.
    var pw=Math.min(300,W-40), ph=158;
    this.help=new Sprite(new Bitmap(pw,ph));
    this.help.x=W-pw-20;this.help.y=365;
    this.addChild(this.help);
    this.drawHelp();

    // Статус снизу
    this.status=new Sprite(new Bitmap(Math.min(560,W-40),58));
    this.status.x=(W-this.status.bitmap.width)/2;
    this.status.y=535;
    this.addChild(this.status);
    this.setStatus("Наблюдение начинается...");
    this.move();
};

Scene_CheaterMini.prototype.drawSteps=function(){
    var b=this.steps.bitmap,W=Graphics.boxWidth;
    b.clear();
    var gap=12,sw=(W-40-gap*2)/3;
    var labels=["1. НАБЛЮДАТЬ","2. ПРОВЕРИТЬ","3. УСПЕХ"];
    var subs=["3 раза найти автомат","найти устройство","жулика разоблачён"];
    for(var i=0;i<3;i++){
        var x=20+i*(sw+gap);
        var active=(this.phase===0 && i===0)||(this.phase===1 && i===1)||(this.phase===2 && i===2);
        b.fillRect(x,6,sw,56,active?"rgba(48,92,116,.95)":"rgba(30,45,55,.95)");
        outline(b,x,6,sw,56,active?"#9bd2e4":"#526774",2);
        b.fontSize=15;b.textColor=active?"#ffffff":"#aebcc4";
        b.drawText(labels[i],x+8,12,sw-16,20,"center");
        b.fontSize=12;b.textColor=active?"#d7eef6":"#8798a1";
        b.drawText(subs[i],x+8,35,sw-16,18,"center");
    }
};

Scene_CheaterMini.prototype.drawHelp=function(){
    var b=this.help.bitmap,W=b.width;
    b.clear();
    panel(b,0,0,W,b.height,"rgba(8,17,25,.94)","#6d9aaa");
    b.fontSize=19;b.textColor="#f0d16a";
    b.drawText("ЧТО ДЕЛАТЬ",16,12,W-32,25,"left");
    b.fontSize=15;b.textColor="#eef4f6";
    var lines=[];
    if(this.phase===0){
        lines=["Нажми на автомат, в который", "переместился жулик.", "Нужно 3 правильных наблюдения.", "Промах сбрасывает наблюдение."];
    } else if(this.phase===1){
        lines=["Найди устройство на его ноге.", "Нажми на само устройство.", "Цель подсвечена, ошибиться легко."];
    } else {
        lines=["Жулик разоблачён.", "Доказательство найдено."];
    }
    for(var i=0;i<lines.length;i++) b.drawText(lines[i],16,45+i*23,W-32,22,"left");
};

Scene_CheaterMini.prototype.setStatus=function(t){
    if(this.lastStatus===t)return;
    this.lastStatus=t;
    var b=this.status.bitmap,W=b.width;
    b.clear();
    panel(b,0,0,W,58,"rgba(5,10,18,.95)","#7db4c8");
    b.fontSize=18;b.textColor="#ffffff";
    b.drawText(t,10,15,W-20,28,"center");
};

Scene_CheaterMini.prototype.move=function(){
    this.locked=true;
    var old=Math.round((this.ch.x-this.pos[0])/(this.pos[1]-this.pos[0]));
    var n=Math.floor(Math.random()*3);
    while(n===old)n=Math.floor(Math.random()*3);
    this.target=n;
    var st=this.ch.x,en=this.pos[n],t=0,self=this;
    var id=setInterval(function(){
        t+=.05;
        var q=Math.min(t,1);
        self.ch.x=st+(en-st)*q;
        self.ch.y=264-Math.sin(q*Math.PI)*16;
        if(t>=1){
            clearInterval(id);
            self.ch.y=264;
            setTimeout(function(){
                self.locked=false;
                self.setStatus("Он остановился. Выбери нужный автомат.");
            },300);
        }
    },30);
};

Scene_CheaterMini.prototype.update=function(){
    Scene_Base.prototype.update.call(this);
    if(this.locked||!TouchInput.isTriggered())return;
    var x=TouchInput.x,y=TouchInput.y;
    if(this.phase===0){
        for(var i=0;i<3;i++){
            var m=this.m[i];
            if(x>=m.x&&x<=m.x+m.width&&y>=m.y&&y<=m.y+m.height){this.pick(i);return;}
        }
        this.setStatus("Выбери автомат №1, №2 или №3.");
    }else if(this.phase===1){
        var dx=x-this.ch.x,dy=y-(this.ch.y-92);
        if(Math.abs(dx)<95&&Math.abs(dy)<125)this.success();
        else this.setStatus("Нажми на устройство на ноге.");
    }
};

Scene_CheaterMini.prototype.pick=function(i){
    if(i!==this.target){
        this.round=0;
        this.setStatus("Промах. Начни наблюдение заново.");
        this.move();
        return;
    }
    this.round++;
    if(this.round>=3){
        this.phase=1;
        this.locked=false;
        this.ch.scale.x=1.25;this.ch.scale.y=1.25;
        this.ch.x=Graphics.boxWidth/2;this.ch.y=470;
        for(var k=0;k<3;k++)this.m[k].opacity=65;
        this.drawSteps();this.drawHelp();
        this.setStatus("Три наблюдения. Теперь найди устройство на ноге.");
    }else{
        this.setStatus("Верно! Наблюдение "+this.round+"/3. Следи дальше.");
        this.move();
    }
};

Scene_CheaterMini.prototype.success=function(){
    this.locked=true;this.phase=2;this.drawSteps();this.drawHelp();
    // Маркер для события слот-менеджера: шулер разоблачён.
    // Страница возврата менеджера проверяет Variable 10 == 9.
    if(window.$gameVariables) $gameVariables.setValue(10,9);
    if(CM.mapId===$gameMap.mapId()&&CM.eventId>0)$gameSelfSwitches.setValue([$gameMap.mapId(),CM.eventId,"A"],true);
    if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.minigameResult==='function')window.BF_QuestSystem.minigameResult("SUCCESS");
    var z=new Sprite(ImageManager.loadSystem("CheaterMini/success"));
    z.anchor.x=.5;z.anchor.y=.5;z.x=Graphics.boxWidth/2;z.y=185;this.addChild(z);
    this.setStatus("Устройство найдено. Жулик разоблачён!");
    var t=new Sprite(new Bitmap(Graphics.boxWidth,60));
    t.y=235;t.bitmap.fontSize=25;t.bitmap.textColor="#9cff9c";
    t.bitmap.drawText("ДОКАЗАТЕЛЬСТВО НАЙДЕНО!",0,10,Graphics.boxWidth,40,"center");
    this.addChild(t);
    setTimeout(function(){SceneManager.pop();},1200);
};

window.Scene_CheaterMini=Scene_CheaterMini;
})();
