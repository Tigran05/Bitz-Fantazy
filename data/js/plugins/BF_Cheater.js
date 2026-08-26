/*:
 * @plugindesc BitzFantasy — мини-игра разоблачения жулика.
 * @help
 * Запуск: Plugin Command -> Cheater start
 * Управление: мышь / touch, Enter не нужен.
 * Успех включает Self Switch A события, запустившего игру.
 * Третью цифру кода выдавайте событием слот-менеджера.
 */
(function(){
"use strict";
var CM={mapId:0,eventId:0};
var old=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(c,a){
 old.call(this,c,a);
 if(String(c).toLowerCase()==="cheater" && a && String(a[0]).toLowerCase()==="start"){
  CM.mapId=$gameMap.mapId(); CM.eventId=this._eventId; SceneManager.push(Scene_CheaterMini);
 }
};
function outline(b,x,y,w,h,c,t){t=t||2;b.fillRect(x,y,w,t,c);b.fillRect(x,y+h-t,w,t,c);b.fillRect(x,y,t,h,c);b.fillRect(x+w-t,y,t,h,c);}
function Scene_CheaterMini(){this.initialize.apply(this,arguments);}
Scene_CheaterMini.prototype=Object.create(Scene_Base.prototype);
Scene_CheaterMini.prototype.constructor=Scene_CheaterMini;
Scene_CheaterMini.prototype.initialize=function(){
 Scene_Base.prototype.initialize.call(this);this.round=0;this.target=-1;this.locked=false;this.phase=0;this.pos=[170,408,646];
};
Scene_CheaterMini.prototype.create=function(){
 Scene_Base.prototype.create.call(this);
 var b=new Sprite(ImageManager.loadPicture("CheaterMini/cheater_background"));b.scale.x=Graphics.boxWidth/816;b.scale.y=Graphics.boxHeight/624;this.addChild(b);
 this.ui=new Sprite(new Bitmap(Graphics.boxWidth,150));this.addChild(this.ui);
 this.ui.bitmap.fillRect(0,0,Graphics.boxWidth,150,"rgba(4,5,10,.9)");
 this.ui.bitmap.fontSize=30;this.ui.bitmap.textColor="#f0d16a";this.ui.bitmap.drawText("РАЗОБЛАЧЕНИЕ ЖУЛИКА",0,12,Graphics.boxWidth,40,"center");
 this.ui.bitmap.fontSize=18;this.ui.bitmap.textColor="#fff";this.ui.bitmap.drawText("Следи за ним. Когда он остановится — тапни по нужному автомату.",10,58,Graphics.boxWidth-20,30,"center");
 this.status=new Sprite(new Bitmap(Graphics.boxWidth,60));this.status.y=555;this.addChild(this.status);
 this.m=[];var n=["СЛОТ №1","СЛОТ №2","СЛОТ №3"];
 for(var i=0;i<3;i++){var z=new Sprite(new Bitmap(190,70));z.x=this.pos[i]-95;z.y=360;z._i=i;z.bitmap.fillRect(3,3,184,64,"rgba(8,17,25,.94)");outline(z.bitmap,3,3,184,64,"#5b8795",2);z.bitmap.fontSize=22;z.bitmap.textColor="#e8f5ff";z.bitmap.drawText(n[i],0,19,190,30,"center");this.addChild(z);this.m.push(z);}
 this.ch=new Sprite(ImageManager.loadSystem("CheaterMini/cheater"));this.ch.anchor.x=.5;this.ch.anchor.y=1;this.ch.x=this.pos[0];this.ch.y=350;this.addChild(this.ch);
 this.setStatus("Наблюдение начинается...");this.move();
};
Scene_CheaterMini.prototype.setStatus=function(t){this.status.bitmap.clear();this.status.bitmap.fillRect(65,0,Graphics.boxWidth-130,55,"rgba(5,10,18,.92)");outline(this.status.bitmap,65,0,Graphics.boxWidth-130,55,"#7db4c8",2);this.status.bitmap.fontSize=20;this.status.bitmap.textColor="#fff";this.status.bitmap.drawText(t,75,13,Graphics.boxWidth-150,30,"center");};
Scene_CheaterMini.prototype.move=function(){
 this.locked=true;var old=Math.round((this.ch.x-this.pos[0])/(this.pos[1]-this.pos[0])),n=Math.floor(Math.random()*3);while(n===old)n=Math.floor(Math.random()*3);
 this.target=n;var st=this.ch.x,en=this.pos[n],t=0,self=this;
 var id=setInterval(function(){t+=.05;self.ch.x=st+(en-st)*Math.min(t,1);self.ch.y=350-Math.sin(Math.min(t,1)*Math.PI)*18;if(t>=1){clearInterval(id);self.ch.y=350;setTimeout(function(){self.locked=false;self.setStatus("Он остановился. Где он?");},250);}},30);
};
Scene_CheaterMini.prototype.update=function(){
 Scene_Base.prototype.update.call(this);if(this.locked||!TouchInput.isTriggered())return;
 var x=TouchInput.x,y=TouchInput.y;
 if(this.phase===0){for(var i=0;i<3;i++){var m=this.m[i];if(x>=m.x&&x<=m.x+190&&y>=m.y&&y<=m.y+70){this.pick(i);return;}}}
 else {var dx=x-this.ch.x,dy=y-(this.ch.y-95);if(Math.abs(dx)<80&&Math.abs(dy)<115)this.success();else this.setStatus("Не здесь. Ищи устройство на ноге.");}
};
Scene_CheaterMini.prototype.pick=function(i){
 if(i!==this.target){this.round=0;this.setStatus("Промах! Жулик заметил слежку.");this.move();return;}
 this.round++;if(this.round>=3){this.phase=1;this.locked=false;this.ch.scale.x=1.25;this.ch.scale.y=1.25;this.ch.x=Graphics.boxWidth/2;this.ch.y=500;for(var k=0;k<3;k++)this.m[k].opacity=70;this.setStatus("Теперь осмотри его. Тапни по устройству на ноге.");}
 else{this.setStatus("Верно! Раунд "+this.round+"/3. Следи дальше.");this.move();}
};
Scene_CheaterMini.prototype.success=function(){
 this.locked=true;
 if(CM.mapId===$gameMap.mapId()&&CM.eventId>0)$gameSelfSwitches.setValue([$gameMap.mapId(),CM.eventId,"A"],true);
 var z=new Sprite(ImageManager.loadSystem("CheaterMini/success"));z.anchor.x=.5;z.anchor.y=.5;z.x=Graphics.boxWidth/2;z.y=210;this.addChild(z);
 this.setStatus("Устройство найдено! Жулик разоблачён.");
 var t=new Sprite(new Bitmap(Graphics.boxWidth,70));t.y=260;t.bitmap.fontSize=28;t.bitmap.textColor="#9cff9c";t.bitmap.drawText("ДОКАЗАТЕЛЬСТВО НАЙДЕНО!",0,15,Graphics.boxWidth,40,"center");this.addChild(t);
 setTimeout(function(){SceneManager.pop();},1200);
};
window.Scene_CheaterMini=Scene_CheaterMini;
})();