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

  var params = PluginManager.parameters('BF_RatCatch');
  var GAME_TIME = 20 * 60;
  var RAT_W = 48, RAT_H = 48;

  function RatCatchScene(){ this.initialize.apply(this, arguments); }
  RatCatchScene.prototype = Object.create(Scene_Base.prototype);
  RatCatchScene.prototype.constructor = RatCatchScene;

  RatCatchScene.prototype.initialize = function(){
    Scene_Base.prototype.initialize.call(this);
    this._time = GAME_TIME;
    this._won = false;
    this._ended = false;
    this._hits = 0;
    this._lastHit = -60;
    this._rat = {x:150,y:150,vx:1.45,vy:0.95,r:18};
    this._trap = {x:710,y:430,w:92,h:72};
    this._walls = [
      {x:300,y:125,w:150,h:28},
      {x:520,y:245,w:28,h:150},
      {x:230,y:360,w:180,h:28}
    ];
  };

  RatCatchScene.prototype.create = function(){
    Scene_Base.prototype.create.call(this);
    this.createBackground();
    this.createArena();
    this.createRat();
    this.createHud();
    this.createInputZones();
  };

  RatCatchScene.prototype.createBackground = function(){
    this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
    var b=this._bg.bitmap;
    b.fillAll('#f4ead4');
    b.fillRect(35,70,Graphics.boxWidth-70,Graphics.boxHeight-105,'#fff8e8');
    this.addChild(this._bg);
  };

  RatCatchScene.prototype.createArena = function(){
    this._arena = new Sprite(new Bitmap(760,410));
    this._arena.x=40; this._arena.y=80;
    var b=this._arena.bitmap;
    b.fillRect(0,0,760,410,'#ead9b8');
    b.fillRect(8,8,744,394,'#f8edcf');
    b.fillRect(0,0,760,10,'#9b7651');
    b.fillRect(0,400,760,10,'#9b7651');
    b.fillRect(0,0,10,410,'#9b7651');
    b.fillRect(750,0,10,410,'#9b7651');
    this._walls.forEach(function(w){ b.fillRect(w.x,w.y,w.w,w.h,'#b98552'); b.fillRect(w.x+4,w.y+4,w.w-8,w.h-8,'#d6a66f'); });
    // trap
    var t=this._trap;
    b.fillRect(t.x,t.y,t.w,t.h,'#704c32');
    b.fillRect(t.x+6,t.y+6,t.w-12,t.h-12,'#c99b63');
    b.fillRect(t.x+14,t.y+14,t.w-28,t.h-28,'#3d3028');
    b.font='bold 20px Arial'; b.textColor='#fff8e8'; b.drawText('ЛОВУШКА',t.x,t.y+24,t.w,'center');
    this.addChild(this._arena);
  };

  RatCatchScene.prototype.createRat = function(){
    var bmp=ImageManager.loadCharacter('RatRun');
    this._ratSprite=new Sprite(bmp);
    this._ratSprite.anchor.x=0.5; this._ratSprite.anchor.y=0.5;
    this._ratSprite.setFrame(0,0,RAT_W,RAT_H);
    this.addChild(this._ratSprite);
  };

  RatCatchScene.prototype.createHud = function(){
    this._hud=new Sprite(new Bitmap(Graphics.boxWidth,58));
    this._hud.y=0;
    var b=this._hud.bitmap;
    b.font='bold 23px Arial'; b.textColor='#4a3525'; b.drawText('КРЫСОЛОВКА',28,7,260,'left');
    b.font='16px Arial'; b.drawText('Выберите направление удара',28,34,300,'left');
    this.addChild(this._hud);
    this._timeText=new Sprite(new Bitmap(180,48)); this._timeText.x=545; this._timeText.y=5; this.addChild(this._timeText);
    this._hitText=new Sprite(new Bitmap(170,48)); this._hitText.x=720; this._hitText.y=5; this.addChild(this._hitText);
    this._msg=new Sprite(new Bitmap(760,32)); this._msg.x=40; this._msg.y=470; this.addChild(this._msg);
    this._setMessage('Крыса отмечена. Загоните её в ловушку кнопками направления.');
  };

  RatCatchScene.prototype.createInputZones=function(){
    // Four clearly visible controls in a compact strip below the arena.
    this._zoneSprites=[];
    var labels=['← ВЛЕВО','→ ВПРАВО','↑ ВВЕРХ','↓ ВНИЗ'];
    var xs=[250,385,520,655];
    for(var i=0;i<4;i++){
      var s=new Sprite(new Bitmap(120,44));
      s.x=xs[i]-60; s.y=500; s.opacity=255; s._dir=i;
      var b=s.bitmap;
      b.fillRect(2,2,116,40,'#4b3827');
      b.fillRect(5,5,110,34,'#f2d7a2');
      b.font='bold 15px Arial'; b.textColor='#3d2b1e';
      b.drawText(labels[i],0,9,120,24,'center');
      this.addChild(s); this._zoneSprites.push(s);
    }
  };

  RatCatchScene.prototype._setMessage=function(text){
    var b=this._msg.bitmap; b.clear(); b.font='bold 20px Arial'; b.textColor='#4a3525'; b.drawText(text,0,8,760,'center');
  };

  RatCatchScene.prototype.update=function(){
    Scene_Base.prototype.update.call(this);
    if(this._ended){
      if(Input.isTriggered('ok') || TouchInput.isTriggered()){
        if(this._won) SceneManager.pop();
        else this.restart();
      }
      return;
    }
    this._time--;
    if(this._time<=0){ this.finish(false,'Крыса убежала! Попробуйте ещё раз.'); return; }
    this.updateRat();
    this.updateControls();
    this.updateHud();
    this.updateZones();
    if(this._checkTrap()) this.finish(true,'ХЛОП! Крыса поймана!');
  };

  RatCatchScene.prototype.updateRat=function(){
    var r=this._rat;
    // gentle wandering; after hits, movement remains controllable rather than chaotic
    if(Math.random()<0.018){
      var a=Math.random()*Math.PI*2; r.vx += Math.cos(a)*0.25; r.vy += Math.sin(a)*0.25;
    }
    var speed=Math.sqrt(r.vx*r.vx+r.vy*r.vy); if(speed>3.3){r.vx*=3.3/speed;r.vy*=3.3/speed;} if(speed<1.0){r.vx*=1.08;r.vy*=1.08;}
    var nx=r.x+r.vx, ny=r.y+r.vy;
    if(nx<25 || nx>735){r.vx*=-1; nx=Math.max(25,Math.min(735,nx));}
    if(ny<25 || ny>385){r.vy*=-1; ny=Math.max(25,Math.min(385,ny));}
    for(var i=0;i<this._walls.length;i++){
      var w=this._walls[i];
      if(this.circleRect(nx,ny,r.r,w)){
        if(!this.circleRect(r.x,ny,r.r,w)) r.vy*=-1;
        else if(!this.circleRect(nx,r.y,r.r,w)) r.vx*=-1;
        else {r.vx*=-1;r.vy*=-1;}
        nx=r.x+r.vx; ny=r.y+r.vy;
      }
    }
    r.x=nx;r.y=ny;
    this._ratSprite.x=40+r.x; this._ratSprite.y=80+r.y;
    // animate between 3 frames in the first row; crop remains one rat only
    var f=Math.floor(Graphics.frameCount/8)%3; this._ratSprite.setFrame(f*48,0,48,48);
  };

  RatCatchScene.prototype.updateControls=function(){
    var dir=null;
    if(Input.isTriggered('left') || Input.isTriggered('a')) dir=0;
    if(Input.isTriggered('right') || Input.isTriggered('d')) dir=1;
    if(Input.isTriggered('up') || Input.isTriggered('w')) dir=2;
    if(Input.isTriggered('down') || Input.isTriggered('s')) dir=3;
    if(TouchInput.isTriggered()){
      var x=TouchInput.x-40, y=TouchInput.y-80;
      var dx=x-this._rat.x, dy=y-this._rat.y;
      if(Math.abs(dx)+Math.abs(dy)<120){
        if(Math.abs(dx)>Math.abs(dy)) dir=dx<0?0:1; else dir=dy<0?2:3;
      } else {
        // tapping an edge zone also works, useful on phones
        if(x<150)dir=0; else if(x>610)dir=1; else if(y<100)dir=2; else if(y>330)dir=3;
      }
    }
    if(dir!==null && Graphics.frameCount-this._lastHit>12) this.broomHit(dir);
  };

  RatCatchScene.prototype.broomHit=function(dir){
    this._lastHit=Graphics.frameCount;
    var r=this._rat;
    var ax=0,ay=0;
    if(dir===0)ax=1; if(dir===1)ax=-1; if(dir===2)ay=1; if(dir===3)ay=-1;
    // Hit pushes the rat away from the tapped side.
    r.vx += ax*2.5; r.vy += ay*2.5;
    this._hits++;
    this._setMessage(['ШЛЁП!','Хорошо! Гоним её к ловушке!','Почти поймали!'][Math.min(2,this._hits-1)]);
    this._flash=10;
  };

  RatCatchScene.prototype.updateZones=function(){
    var x=40+this._rat.x, y=80+this._rat.y;
    var pos=[[x-75,y-35],[x-45,y-35],[x-35,y-75],[x-35,y+5]];
    for(var i=0;i<4;i++){var s=this._zoneSprites[i];s.x=pos[i][0];s.y=pos[i][1];s.opacity=(this._lastHit+8>Graphics.frameCount)?180:70;}
  };

  RatCatchScene.prototype.updateHud=function(){
    var tb=this._timeText.bitmap;tb.clear();tb.font='bold 22px Arial';tb.textColor='#4a3525';tb.drawText('Время: '+Math.ceil(this._time/60),0,8,180,'right');
    var hb=this._hitText.bitmap;hb.clear();hb.font='bold 20px Arial';hb.textColor='#4a3525';hb.drawText('Взмахов: '+this._hits,0,8,170,'right');
  };

  RatCatchScene.prototype.circleRect=function(cx,cy,r,rect){
    var px=Math.max(rect.x,Math.min(cx,rect.x+rect.w));
    var py=Math.max(rect.y,Math.min(cy,rect.y+rect.h));
    var dx=cx-px,dy=cy-py;return dx*dx+dy*dy<r*r;
  };

  RatCatchScene.prototype._checkTrap=function(){
    var r=this._rat,t=this._trap;
    return r.x>t.x+10 && r.x<t.x+t.w-10 && r.y>t.y+10 && r.y<t.y+t.h-10;
  };

  RatCatchScene.prototype.finish=function(win,msg){
    if(this._ended)return;
    this._ended=true; this._won=win;
    this._setMessage(msg);
    var overlay=new Sprite(new Bitmap(600,150)); overlay.x=120;overlay.y=205;
    overlay.bitmap.fillRect(0,0,600,150,'#fff8e8');
    overlay.bitmap.font='bold 32px Arial'; overlay.bitmap.textColor='#4a3525';
    overlay.bitmap.drawText(win?'КРЫСА ПОЙМАНА!':'ВРЕМЯ ВЫШЛО',0,18,600,'center');
    overlay.bitmap.font='19px Arial';
    overlay.bitmap.drawText(win?'Подвал очищен. Нажмите Enter или экран.':'Крысы разбежались. Нажмите Enter/экран, чтобы попробовать снова.',0,68,600,'center');
    overlay.bitmap.font='16px Arial';
    overlay.bitmap.drawText(win?'':'Событие НЕ считается выполненным, пока вы не поймаете всех крыс.',0,103,600,'center');
    this.addChild(overlay); this._endOverlay=overlay;
    if(win){
      $gameVariables.setValue(11, $gameVariables.value(11)+1);
      if($gameTemp && $gameTemp._ratCatchEventId){
        $gameSelfSwitches.setValue([$gameMap.mapId(),$gameTemp._ratCatchEventId,'A'],true);
      }
    }
  };

  RatCatchScene.prototype.restart=function(){
    if(this._endOverlay){ this.removeChild(this._endOverlay); this._endOverlay=null; }
    this._ended=false; this._won=false; this._time=GAME_TIME; this._hits=0; this._lastHit=-60;
    this._rat={x:150,y:150,vx:1.45,vy:0.95,r:18};
    this._setMessage('Попробуйте ещё раз. Загоните крысу в ловушку!');
    this.updateRat(); this.updateHud(); this.updateZones();
  };

  var _pluginCommand=Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand=function(command,args){
    _pluginCommand.call(this,command,args);
    if(String(command).toUpperCase()==='RATCATCH'){
      if(args && String(args[0]).toLowerCase()==='start'){
        $gameTemp._ratCatchEventId=this._eventId;
        SceneManager.push(RatCatchScene);
      }
    }
  };
})();
