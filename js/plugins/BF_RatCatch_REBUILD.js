/*:
 * @plugindesc BF RatCatch v4 - Broom chase mini-game for Bitz Fantasy
 * @author BF
 * @help
 * Plugin command:
 *   RatCatch start
 *
 * Goal: herd the rat into the trap with the broom.
 * Mouse/touch: tap one of the four broom zones around the rat.
 * Keyboard: Arrow keys / WASD.
 * Success: Variable 11 + 1 and Self Switch A ON.
 * Failure: nothing is changed; event remains available.
 */
(function(){
  'use strict';
  var GAME_TIME = 20 * 60;
  var ARENA_X=40, ARENA_Y=82, ARENA_W=760, ARENA_H=410;
  var RAT_R=19;

  function RatCatchScene(){ this.initialize.apply(this,arguments); }
  RatCatchScene.prototype=Object.create(Scene_Base.prototype);
  RatCatchScene.prototype.constructor=RatCatchScene;

  RatCatchScene.prototype.initialize=function(){
    Scene_Base.prototype.initialize.call(this);
    this._time=GAME_TIME; this._ended=false; this._won=false;
    this._hits=0; this._lastHit=-999; this._broomDir=-1; this._broomTimer=0;
    this._messageTimer=0; this._successCommitted=false;
    this._eventId=$gameTemp._ratCatchEventId||0; this._mapId=$gameMap.mapId();
    this._rat={x:145,y:145,vx:1.25,vy:.8,r:RAT_R,face:1,anim:0};
    this._trap={x:650,y:300,w:90,h:72};
    this._walls=[{x:275,y:80,w:145,h:26},{x:500,y:190,w:28,h:145},{x:205,y:335,w:175,h:26}];
  };

  RatCatchScene.prototype.create=function(){
    Scene_Base.prototype.create.call(this);
    this.createBackground(); this.createArena(); this.createRat(); this.createBroom(); this.createHud(); this.createHints();
  };

  RatCatchScene.prototype.createBackground=function(){
    this._bg=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));
    var b=this._bg.bitmap; b.fillAll('#171b21'); b.fillRect(18,16,804,544,'#252b33');
    b.fillRect(28,62,784,448,'#11161c'); this.addChild(this._bg);
  };

  RatCatchScene.prototype.createArena=function(){
    this._arena=new Sprite(new Bitmap(ARENA_W,ARENA_H)); this._arena.x=ARENA_X; this._arena.y=ARENA_Y;
    var b=this._arena.bitmap; b.fillRect(0,0,ARENA_W,ARENA_H,'#2d241d'); b.fillRect(8,8,744,394,'#574335');
    // floor planks
    for(var y=16;y<394;y+=34){ b.fillRect(10,y,740,2,'#46362c'); }
    for(var x=25;x<750;x+=72){ b.fillRect(x,10,2,390,'#49372d'); }
    b.fillRect(0,0,760,10,'#8a6548'); b.fillRect(0,400,760,10,'#8a6548'); b.fillRect(0,0,10,410,'#8a6548'); b.fillRect(750,0,10,410,'#8a6548');
    this._walls.forEach(function(w){b.fillRect(w.x,w.y,w.w,w.h,'#76543a');b.fillRect(w.x+3,w.y+3,w.w-6,w.h-6,'#9a704c');});
    var t=this._trap; b.fillRect(t.x,t.y,t.w,t.h,'#17120f'); b.fillRect(t.x+5,t.y+5,t.w-10,t.h-10,'#6e4c32'); b.fillRect(t.x+12,t.y+15,t.w-24,t.h-22,'#100d0b');
    b.font='bold 17px Arial'; b.textColor='#f6d58b'; b.drawText('ЛОВУШКА',t.x,t.y-20,t.w,'center');
    this.addChild(this._arena);
  };

  RatCatchScene.prototype.createRat=function(){
    this._ratSprite=new Sprite(new Bitmap(76,62)); this._ratSprite.anchor.x=.5; this._ratSprite.anchor.y=.5; this.addChild(this._ratSprite);
  };
  RatCatchScene.prototype.drawRat=function(){
    var b=this._ratSprite.bitmap; b.clear(); var bob=(this._rat.anim%2)*1.2;
    // tail
    b.lineWidth=5; b.strokeStyle='#b9b1a8'; b.beginPath(); b.moveTo(12,39); b.quadraticCurveTo(0,48,9,55); b.quadraticCurveTo(20,62,27,52); b.stroke();
    // ears/body/head
    b.fillStyle='#9f9892'; b.beginPath(); b.arc(38,38+bob,16,0,Math.PI*2); b.fill();
    b.fillStyle='#aaa39c'; b.beginPath(); b.arc(52,28+bob,13,0,Math.PI*2); b.fill();
    b.fillStyle='#b7a9a2'; b.beginPath(); b.arc(56,16+bob,7,0,Math.PI*2); b.fill(); b.beginPath(); b.arc(42,17+bob,7,0,Math.PI*2); b.fill();
    b.fillStyle='#d66d78'; b.beginPath(); b.arc(56,17+bob,3.2,0,Math.PI*2); b.fill(); b.beginPath(); b.arc(43,17+bob,3.2,0,Math.PI*2); b.fill();
    // face / eye / nose
    b.fillStyle='#171414'; b.beginPath(); b.arc(57,27+bob,2.8,0,Math.PI*2); b.fill(); b.beginPath(); b.arc(64,32+bob,3,0,Math.PI*2); b.fill();
    b.strokeStyle='#c8c0ba'; b.lineWidth=1; b.beginPath(); b.moveTo(62,34+bob); b.lineTo(73,31+bob); b.moveTo(62,36+bob); b.lineTo(73,38+bob); b.stroke();
    // feet
    b.fillStyle='#77716d'; b.fillRect(29,51+bob,12,4); b.fillRect(48,49+bob,11,4);
  };

  RatCatchScene.prototype.createBroom=function(){ this._broom=new Sprite(new Bitmap(180,130)); this._broom.anchor.x=.5; this._broom.anchor.y=.5; this._broom.visible=false; this.addChild(this._broom); };
  RatCatchScene.prototype.drawBroom=function(dir){
    var b=this._broom.bitmap; b.clear(); var w=b.width,h=b.height; b.lineWidth=9; b.strokeStyle='#c98a48'; b.beginPath();
    if(dir===0){b.moveTo(135,35);b.lineTo(55,65);} if(dir===1){b.moveTo(45,35);b.lineTo(125,65);} if(dir===2){b.moveTo(90,110);b.lineTo(90,42);} if(dir===3){b.moveTo(90,20);b.lineTo(90,88);} b.stroke();
    b.lineWidth=6; b.strokeStyle='#d8bd72'; b.beginPath();
    if(dir===0){for(var i=0;i<5;i++){b.moveTo(45,58+i*3);b.lineTo(18,50+i*5);}} if(dir===1){for(var j=0;j<5;j++){b.moveTo(135,58+j*3);b.lineTo(162,50+j*5);}} if(dir===2){for(var k=0;k<5;k++){b.moveTo(84+k*3,40);b.lineTo(70+k*5,15);}} if(dir===3){for(var q=0;q<5;q++){b.moveTo(84+q*3,90);b.lineTo(70+q*5,115);}} b.stroke();
  };

  RatCatchScene.prototype.createHud=function(){
    this._hud=new Sprite(new Bitmap(Graphics.boxWidth,62)); this._hud.y=0; var b=this._hud.bitmap;
    b.font='bold 26px Arial'; b.textColor='#f1d39a'; b.drawText('КРЫСОЛОВКА',30,8,300,'left');
    b.font='17px Arial'; b.textColor='#d2d5d8'; b.drawText('Загоните крысу в ловушку. Бейте веником с нужной стороны.',30,37,590,'left'); this.addChild(this._hud);
    this._timeText=new Sprite(new Bitmap(180,45));this._timeText.x=620;this._timeText.y=9;this.addChild(this._timeText);
    this._hitText=new Sprite(new Bitmap(150,45));this._hitText.x=735;this._hitText.y=40;this.addChild(this._hitText);
    this._msg=new Sprite(new Bitmap(760,40));this._msg.x=40;this._msg.y=515;this.addChild(this._msg); this._setMessage('Крыса убегает сама. Нажмите стрелку или кликните СТОРОНУ крысы.');
  };

  RatCatchScene.prototype.createHints=function(){
    this._hint=new Sprite(new Bitmap(190,190));this._hint.anchor.x=.5;this._hint.anchor.y=.5;this.addChild(this._hint);
  };
  RatCatchScene.prototype.updateHints=function(){
    var b=this._hint.bitmap;b.clear();b.font='bold 18px Arial';b.textColor='#f4d28d';
    b.drawText('←  УДАР  →',10,18,170,'center'); b.font='15px Arial';b.textColor='#d9dde0';b.drawText('↑ удар от снизу',25,48,140,'center');b.drawText('↓ удар сверху',25,168,140,'center');
    b.strokeStyle='#d9a85c';b.lineWidth=2;b.strokeRect(42,60,106,76); this._hint.x=ARENA_X+this._rat.x;this._hint.y=ARENA_Y+this._rat.y;
  };

  RatCatchScene.prototype._setMessage=function(text){var b=this._msg.bitmap;b.clear();b.font='bold 19px Arial';b.textColor='#e6e8ea';b.drawText(text,0,7,760,'center');};

  RatCatchScene.prototype.update=function(){
    Scene_Base.prototype.update.call(this);
    if(this._ended){ if(Input.isTriggered('ok')||TouchInput.isTriggered()){ SceneManager.pop(); } return; }
    this._time--; if(this._time<=0){this.finish(false,'Время вышло — крыса сбежала. Нажмите Enter и попробуйте снова.');return;}
    this.updateRat(); this.updateControls(); this.updateBroom(); this.updateHud(); this.updateHints();
    if(this._checkTrap()) this.finish(true,'ХЛОП! Крыса в ловушке! Нажмите Enter.');
  };

  RatCatchScene.prototype.updateRat=function(){
    var r=this._rat; if(Math.random()<.02){var a=Math.random()*Math.PI*2;r.vx+=Math.cos(a)*.18;r.vy+=Math.sin(a)*.18;}
    var sp=Math.sqrt(r.vx*r.vx+r.vy*r.vy);if(sp>2.8){r.vx*=2.8/sp;r.vy*=2.8/sp;} if(sp<.8){r.vx*=1.1;r.vy*=1.1;}
    var nx=r.x+r.vx,ny=r.y+r.vy;
    if(nx<30||nx>730){r.vx*=-1;nx=Math.max(30,Math.min(730,nx));} if(ny<30||ny>380){r.vy*=-1;ny=Math.max(30,Math.min(380,ny));}
    for(var i=0;i<this._walls.length;i++){var w=this._walls[i];if(this.circleRect(nx,ny,r.r,w)){if(!this.circleRect(r.x,ny,r.r,w))r.vy*=-1;else if(!this.circleRect(nx,r.y,r.r,w))r.vx*=-1;else{r.vx*=-1;r.vy*=-1;}nx=r.x+r.vx;ny=r.y+r.vy;}}
    r.x=nx;r.y=ny;if(Math.abs(r.vx)>.1)r.face=r.vx>0?1:-1;r.anim=Math.floor(Graphics.frameCount/10)%2;
    this._ratSprite.x=ARENA_X+r.x;this._ratSprite.y=ARENA_Y+r.y;this.drawRat();
    this._ratSprite.scale.x=r.face;
  };

  RatCatchScene.prototype.updateControls=function(){
    var dir=-1;
    if(Input.isTriggered('left')||Input.isTriggered('a'))dir=0;if(Input.isTriggered('right')||Input.isTriggered('d'))dir=1;if(Input.isTriggered('up')||Input.isTriggered('w'))dir=2;if(Input.isTriggered('down')||Input.isTriggered('s'))dir=3;
    if(TouchInput.isTriggered()){
      var x=TouchInput.x-ARENA_X,y=TouchInput.y-ARENA_Y,dx=x-this._rat.x,dy=y-this._rat.y;
      // Click a clear side of the rat: near center is ignored to prevent random hits.
      if(Math.abs(dx)+Math.abs(dy)<150 && (Math.abs(dx)>35||Math.abs(dy)>35)){dir=Math.abs(dx)>Math.abs(dy)?(dx<0?0:1):(dy<0?2:3);}
    }
    if(dir>=0&&Graphics.frameCount-this._lastHit>9)this.broomHit(dir);
  };

  RatCatchScene.prototype.broomHit=function(dir){
    this._lastHit=Graphics.frameCount;this._broomDir=dir;this._broomTimer=13;this._hits++;
    var r=this._rat,ax=0,ay=0;if(dir===0)ax=1;if(dir===1)ax=-1;if(dir===2)ay=1;if(dir===3)ay=-1;
    r.vx+=ax*2.0;r.vy+=ay*2.0;
    this._setMessage(['ШЛЁП!','Так! Гоним её к ловушке!','Ещё удар!','Почти!'][Math.min(3,Math.floor(this._hits/2))]);
  };

  RatCatchScene.prototype.updateBroom=function(){
    if(this._broomTimer>0){this._broomTimer--;this._broom.visible=true;this.drawBroom(this._broomDir);this._broom.x=ARENA_X+this._rat.x;this._broom.y=ARENA_Y+this._rat.y;this._broom.opacity=255;var t=(13-this._broomTimer)/13;this._broom.rotation=(this._broomDir===0?-.12:this._broomDir===1?.12:0)+(this._broomDir===2?-t*.35:this._broomDir===3?t*.35:0);}
    else this._broom.visible=false;
  };

  RatCatchScene.prototype.updateHud=function(){
    var b=this._timeText.bitmap;b.clear();b.font='bold 22px Arial';b.textColor=this._time<300?'#f07d6e':'#f1d39a';b.drawText('Время: '+Math.ceil(this._time/60),0,8,170,'right');
    var h=this._hitText.bitmap;h.clear();h.font='bold 18px Arial';h.textColor='#cbd0d4';h.drawText('Ударов: '+this._hits,0,0,140,'right');
  };
  RatCatchScene.prototype.circleRect=function(cx,cy,r,rect){var px=Math.max(rect.x,Math.min(cx,rect.x+rect.w)),py=Math.max(rect.y,Math.min(cy,rect.y+rect.h)),dx=cx-px,dy=cy-py;return dx*dx+dy*dy<r*r;};
  RatCatchScene.prototype._checkTrap=function(){var r=this._rat,t=this._trap;return r.x>t.x+14&&r.x<t.x+t.w-14&&r.y>t.y+14&&r.y<t.y+t.h-14;};

  RatCatchScene.prototype.finish=function(win,msg){
    if(this._ended)return;this._ended=true;this._won=win;this._setMessage(msg);
    var overlay=new Sprite(new Bitmap(600,145));overlay.x=120;overlay.y=215;overlay.bitmap.fillRect(0,0,600,145,'#20262d');overlay.bitmap.strokeStyle='#a97946';overlay.bitmap.lineWidth=4;overlay.bitmap.strokeRect(2,2,596,141);
    overlay.bitmap.font='bold 32px Arial';overlay.bitmap.textColor=win?'#f1d39a':'#ef8b7d';overlay.bitmap.drawText(win?'КРЫСА ПОЙМАНА!':'КРЫСА СБЕЖАЛА',0,25,600,'center');overlay.bitmap.font='18px Arial';overlay.bitmap.textColor='#e2e5e8';overlay.bitmap.drawText(win?'Квест засчитан.':'Попытка не засчитана.',0,70,600,'center');overlay.bitmap.drawText('Enter / клик — продолжить',0,105,600,'center');this.addChild(overlay);this._endOverlay=overlay;
    if(win&&!this._successCommitted){this._successCommitted=true;$gameVariables.setValue(11,Number($gameVariables.value(11))+1);if(this._eventId>0)$gameSelfSwitches.setValue([this._mapId,this._eventId,'A'],true);}
  };

  var _pc=Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand=function(command,args){_pc.call(this,command,args);if(String(command).toUpperCase()==='RATCATCH'&&args&&String(args[0]).toLowerCase()==='start'){$gameTemp._ratCatchEventId=this._eventId;$gameTemp._ratCatchMapId=$gameMap.mapId();SceneManager.push(RatCatchScene);}};
})();
