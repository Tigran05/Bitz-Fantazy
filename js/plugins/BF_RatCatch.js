/*:
 * @plugindesc Bitz Fantasy - Rat Catch v14. Catch all 6 rats with clean selection and 4-frame animation.
 * @author BF
 * @help
 * Plugin command: RatCatch start
 *
 * Goal: catch ALL SIX rats. Click a rat to select it, then use the arrows around it
 * to drive that rat into the trap. Keyboard: arrows / WASD.
 * When a rat is caught it disappears from the room and the next uncaught rat can be selected.
 * Success after all 6 are caught: Variable 11 + 1 and Self Switch A ON.
 */
(function(){
'use strict';

var GAME_TIME = 60 * 60;
var AX=40, AY=78, AW=760, AH=430;
var RAT_R=17;

function RatCatchScene(){ this.initialize.apply(this,arguments); }
RatCatchScene.prototype=Object.create(Scene_Base.prototype);
RatCatchScene.prototype.constructor=RatCatchScene;

RatCatchScene.prototype.initialize=function(){
 Scene_Base.prototype.initialize.call(this);
 this._time=GAME_TIME; this._hits=0; this._lastHit=-999; this._ended=false; this._won=false;
 this._eventId=0; this._selected=0; this._broomDir=-1; this._broomTimer=0; this._caught=0;
 this._trap={x:625,y:315,w:112,h:84};
 this._walls=[
  {x:195,y:92,w:145,h:24},{x:425,y:78,w:24,h:135},
  {x:300,y:240,w:175,h:24},{x:535,y:235,w:24,h:105},
  {x:95,y:325,w:155,h:24}
 ];
 this.resetRats();
};

RatCatchScene.prototype.resetRats=function(){
 var p=[
  [80,70,1.00,.38],[235,175,-.72,.82],[385,125,.66,.88],
  [585,85,-.82,.50],[150,275,.88,-.62],[505,365,-.65,-.78]
 ];
 this._rats=[];
 for(var i=0;i<6;i++) this._rats.push({x:p[i][0],y:p[i][1],vx:p[i][2],vy:p[i][3],r:RAT_R,phase:i*11,panic:0,caught:false});
};

RatCatchScene.prototype.create=function(){
 Scene_Base.prototype.create.call(this);
 this.createBackground(); this.createArena(); this.createRats(); this.createSelection(); this.createHud();
 this.refreshAll();
};

RatCatchScene.prototype.createBackground=function(){
 var s=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight)),b=s.bitmap;
 b.fillAll('#17120e'); b.fillRect(22,58,756,486,'#302319'); b.fillRect(28,64,744,474,'#4a3423');
 this.addChild(s);
};

RatCatchScene.prototype.createArena=function(){
 var s=new Sprite(new Bitmap(AW,AH)),b=s.bitmap;
 b.fillRect(0,0,AW,AH,'#5d402c'); b.fillRect(7,7,AW-14,AH-14,'#b48655'); b.fillRect(13,13,AW-26,AH-26,'#e8cf9e');
 for(var y=28;y<AH-20;y+=40)b.fillRect(18,y,AW-36,2,'#d1ae78');
 for(var x=55;x<AW-30;x+=95)b.fillRect(x,18,2,AH-36,'#dfbd87');
 for(var i=0;i<this._walls.length;i++){
  var w=this._walls[i]; b.fillRect(w.x,w.y,w.w,w.h,'#70472c'); b.fillRect(w.x+3,w.y+3,w.w-6,w.h-6,'#a96d3e'); b.fillRect(w.x+5,w.y+5,w.w-10,3,'#c98b53');
 }
 var t=this._trap;
 b.fillRect(t.x-6,t.y-6,t.w+12,t.h+12,'#4b3020');
 b.fillRect(t.x,t.y,t.w,t.h,'#8f5d35');
 b.fillRect(t.x+9,t.y+9,t.w-18,t.h-18,'#201511');
 b.fillRect(t.x+16,t.y+16,t.w-32,t.h-32,'#0c0907');
 b.fillRect(t.x+28,t.y+29,t.w-56,3,'#a76f3f');
 b.font='bold 17px Arial'; b.textColor='#ffe8ad'; b.drawText('ЛОВУШКА',t.x,t.y+27,t.w,'center');
 b.font='12px Arial'; b.drawText('ЗАГНАТЬ СЮДА',t.x,t.y+49,t.w,'center');
 s.x=AX;s.y=AY;this.addChild(s);
};

RatCatchScene.prototype.createRats=function(){
 this._ratSprites=[];
 this._ratBitmaps=[];
 for(var i=0;i<6;i++){
  var s=new Sprite(); s.anchor.x=.5; s.anchor.y=.5; s._ratIndex=i;
  /* Uses the supplied RatRun.png: 3 frames x 4 directions.
     Sheet layout: row 0=down/front, row 1=left, row 2=right, row 3=up/back.
     Each frame is exactly 48x48 pixels, matching a standard RPG Maker 3x4 character sheet. */
  s.bitmap=ImageManager.loadCharacter('RatRun');
  s.bitmap.smooth=false;
  s._ratFrame=0;
  this.addChild(s); this._ratSprites.push(s); this._ratBitmaps.push(s.bitmap);
 }
};

/*
 * Real RatRun animation supplied by the user.
 * Three genuine walking frames are cycled continuously. Direction is selected
 * from the rat's current velocity so side-walking uses the proper side row.
 */
RatCatchScene.prototype.drawRat=function(index){
 var s=this._ratSprites[index],r=this._rats[index];
 if(r.caught){s.visible=false;return;}
 s.visible=true;
 var bmp=s.bitmap;
 if(!bmp || !bmp.isReady || !bmp.isReady()) return;
 var dx=Math.abs(r.vx),dy=Math.abs(r.vy),row;
 if(dx>dy) row=(r.vx<0)?1:2;
 else row=(r.vy<0)?3:0;
 var moving=(dx+dy)>0.10;
 var frame=moving ? Math.floor((Graphics.frameCount+r.phase)/6)%3 : 1;
 s._ratFrame=frame;
 /* The supplied RatRun sheet is a standard 3 columns x 4 rows, 48x48 per frame. */
 s.setFrame(frame*48,row*48,48,48);
 s.scale.x=1.0;
 s.scale.y=1.0;
 bmp.smooth=false;
};

RatCatchScene.prototype.createSelection=function(){
 this._selection=new Sprite(new Bitmap(112,112));this._selection.anchor.x=.5;this._selection.anchor.y=.5;this.addChild(this._selection);
 this._arrowSprites=[];
 for(var i=0;i<4;i++){var s=new Sprite(new Bitmap(48,38));s.anchor.x=.5;s.anchor.y=.5;s._dir=i;this.addChild(s);this._arrowSprites.push(s);}
 this._selectText=new Sprite(new Bitmap(250,28));this.addChild(this._selectText);
};

RatCatchScene.prototype.drawSelection=function(){
 var s=this._selection,b=s.bitmap;b.clear();
 if(this._ended || this._rats[this._selected].caught){s.visible=false;this._selectText.visible=false;return;}
 s.visible=true;this._selectText.visible=true;
 var r=this._rats[this._selected];
 b.fillRect(8,8,17,3,'#ffd86f');b.fillRect(8,8,3,17,'#ffd86f');
 b.fillRect(87,8,17,3,'#ffd86f');b.fillRect(101,8,3,17,'#ffd86f');
 b.fillRect(8,101,17,3,'#ffd86f');b.fillRect(8,87,3,17,'#ffd86f');
 b.fillRect(87,101,17,3,'#ffd86f');b.fillRect(101,87,3,17,'#ffd86f');
 s.x=AX+r.x;s.y=AY+r.y;
 this._selectText.x=s.x-125;this._selectText.y=s.y-78;
 var tb=this._selectText.bitmap;tb.clear();tb.font='bold 14px Arial';tb.textColor='#5b3a20';tb.drawText('КРЫСА '+(this._selected+1)+' — ВЫБРАНА',0,3,250,'center');
};

RatCatchScene.prototype.drawArrow=function(s,dir,hot){
 var b=s.bitmap;b.clear();
 b.fillRect(1,1,46,36,hot?'#f1b94f':'#6c4b31'); b.fillRect(4,4,40,30,hot?'#9b5c2c':'#86613d');
 b.font='bold 25px Arial';b.textColor='#fff0c2';b.drawText(['←','→','↑','↓'][dir],0,4,48,'center');
};

RatCatchScene.prototype.createHud=function(){
 this._title=new Sprite(new Bitmap(Graphics.boxWidth,54));var b=this._title.bitmap;
 b.font='bold 24px Arial';b.textColor='#ffe5a0';b.drawText('КРЫСЫ В ПОДВАЛЕ',38,4,350,'left');
 b.font='15px Arial';b.textColor='#e8c996';b.drawText('Выберите крысу и гоните её стрелками в ловушку',38,31,560,'left');this.addChild(this._title);
 this._timeText=new Sprite(new Bitmap(130,38));this._timeText.x=650;this._timeText.y=9;this.addChild(this._timeText);
 this._countText=new Sprite(new Bitmap(130,38));this._countText.x=775;this._countText.y=9;this.addChild(this._countText);
 this._message=new Sprite(new Bitmap(760,38));this._message.x=40;this._message.y=510;this.addChild(this._message);
};

RatCatchScene.prototype.setMessage=function(text){var b=this._message.bitmap;b.clear();b.font='bold 17px Arial';b.textColor='#ffe6ad';b.drawText(text,0,4,760,'center');};

RatCatchScene.prototype.findNext=function(){
 for(var i=0;i<6;i++)if(!this._rats[i].caught)return i;
 return -1;
};

RatCatchScene.prototype.update=function(){
 Scene_Base.prototype.update.call(this);
 if(this._ended){if(Input.isTriggered('ok')||TouchInput.isTriggered()){if(this._won)SceneManager.pop();else this.restartAttempt();}return;}
 this._time--; if(this._time<=0){this.finish(false,'Время вышло. Enter / тап — новая попытка.');return;}
 this.updateRats();this.updateControls();this.refreshAll();
 if(this._caught>=6)this.finish(true,'Все 6 крыс пойманы! Квест засчитан.');
};

RatCatchScene.prototype.updateRats=function(){
 for(var k=0;k<this._rats.length;k++){
  var r=this._rats[k]; if(r.caught)continue;
  if(r.panic>0)r.panic--;
  if(Math.random()<.008){var a=Math.random()*Math.PI*2;r.vx+=Math.cos(a)*.08;r.vy+=Math.sin(a)*.08;}
  var sp=Math.sqrt(r.vx*r.vx+r.vy*r.vy),max=r.panic>0?3.15:1.35;
  if(sp>max){r.vx*=max/sp;r.vy*=max/sp;} if(sp<.35){r.vx*=1.05;r.vy*=1.05;}
  var nx=r.x+r.vx,ny=r.y+r.vy;
  if(nx<27||nx>AW-27){r.vx*=-1;nx=Math.max(27,Math.min(AW-27,nx));}
  if(ny<27||ny>AH-27){r.vy*=-1;ny=Math.max(27,Math.min(AH-27,ny));}
  for(var i=0;i<this._walls.length;i++){var w=this._walls[i];if(this.circleRect(nx,ny,r.r,w)){
   if(!this.circleRect(r.x,ny,r.r,w))r.vy*=-1;else if(!this.circleRect(nx,r.y,r.r,w))r.vx*=-1;else{r.vx*=-1;r.vy*=-1;}
   nx=r.x+r.vx;ny=r.y+r.vy;
  }}
  r.x=nx;r.y=ny;
 }
};

RatCatchScene.prototype.updateControls=function(){
 var dir=null;
 if(Input.isTriggered('left')||Input.isTriggered('a'))dir=0;if(Input.isTriggered('right')||Input.isTriggered('d'))dir=1;
 if(Input.isTriggered('up')||Input.isTriggered('w'))dir=2;if(Input.isTriggered('down')||Input.isTriggered('s'))dir=3;
 if(TouchInput.isTriggered()){
  var px=TouchInput.x,py=TouchInput.y;
  /* Select an uncaught rat by clicking its body. */
  for(var i=0;i<6;i++){var rr=this._rats[i];if(rr.caught)continue;var dx=px-(AX+rr.x),dy=py-(AY+rr.y);if(dx*dx+dy*dy<36*36){this._selected=i;this.setMessage('Крыса '+(i+1)+' выбрана. Нажимайте стрелки вокруг неё.');return;}}
  /* Arrow hitboxes are outside the rat sprite. */
  for(var j=0;j<4;j++){var s=this._arrowSprites[j];if(!s.visible)continue;if(px>=s.x-24&&px<=s.x+24&&py>=s.y-19&&py<=s.y+19){dir=j;break;}}
 }
 if(dir!==null&&Graphics.frameCount-this._lastHit>=9)this.broomHit(dir);
};

RatCatchScene.prototype.broomHit=function(dir){
 this._lastHit=Graphics.frameCount;this._broomDir=dir;this._broomTimer=10;
 var r=this._rats[this._selected]; if(!r||r.caught)return;
 /* Classic broom mechanic: hit from a side, rat runs AWAY from that side.
    Thus pressing LEFT pushes the rat to the RIGHT, etc. */
 if(dir===0)r.vx+=2.25;if(dir===1)r.vx-=2.25;if(dir===2)r.vy+=2.25;if(dir===3)r.vy-=2.25;
 r.panic=12;this._hits++;
 this.setMessage('ВЗМАХ ВЕНИКОМ — '+['влево','вправо','вверх','вниз'][dir]+'!');
};

RatCatchScene.prototype.refreshAll=function(){
 for(var i=0;i<6;i++){this.drawRat(i);var r=this._rats[i],s=this._ratSprites[i];if(!r.caught){s.x=AX+r.x;s.y=AY+r.y;}}
 this.drawSelection();
 var r=this._rats[this._selected],cx=AX+r.x,cy=AY+r.y;
 var pos=[[cx-62,cy],[cx+62,cy],[cx,cy-62],[cx,cy+62]];
 for(var j=0;j<4;j++){
  var ar=this._arrowSprites[j];
  ar.visible=!this._ended&&!r.caught;
  ar.x=pos[j][0];ar.y=pos[j][1];this.drawArrow(ar,j,(this._broomTimer>0&&this._broomDir===j));
 }
 if(this._broomTimer>0)this._broomTimer--;
 var tb=this._timeText.bitmap;tb.clear();tb.font='bold 17px Arial';tb.textColor='#ffe7a3';tb.drawText('ВРЕМЯ '+Math.ceil(this._time/60),0,3,130,'center');
 var cb=this._countText.bitmap;cb.clear();cb.font='bold 17px Arial';cb.textColor='#f1d4a1';cb.drawText('ПОЙМАНО '+this._caught+'/6',0,3,130,'center');
};

RatCatchScene.prototype.tryCatch=function(){
 var r=this._rats[this._selected],t=this._trap;
 if(r.caught)return false;
 if(r.x>t.x+12&&r.x<t.x+t.w-12&&r.y>t.y+12&&r.y<t.y+t.h-12){
  r.caught=true;this._caught++;this._hits=0;this._broomTimer=0;
  this._ratSprites[this._selected].visible=false;
  var next=this.findNext();
  if(next>=0){this._selected=next;this.setMessage('Крыса поймана! Теперь гоним крысу '+(next+1)+' из оставшихся.');}
  else this.setMessage('Все крысы пойманы!');
  return true;
 }
 return false;
};

/* Check after each movement/input so a rat can be caught immediately on entering the trap. */
var _oldUpdateRat=RatCatchScene.prototype.updateRats;
RatCatchScene.prototype.updateRats=function(){
 _oldUpdateRat.call(this);
 this.tryCatch();
};

RatCatchScene.prototype.circleRect=function(cx,cy,r,rect){var px=Math.max(rect.x,Math.min(cx,rect.x+rect.w)),py=Math.max(rect.y,Math.min(cy,rect.y+rect.h));var dx=cx-px,dy=cy-py;return dx*dx+dy*dy<r*r;};

RatCatchScene.prototype.finish=function(win,msg){
 if(this._ended)return;
 this._ended=true;this._won=!!win;
 this.setMessage(msg);
 var s=new Sprite(new Bitmap(640,160));s.x=80;s.y=205;
 var b=s.bitmap;
 b.fillAll('#21160f');
 b.fillRect(4,4,632,152,'#ead2a4');
 b.fillRect(8,8,624,144,'#fff0c8');
 b.fontFace='Arial';
 b.fontSize=30;
 b.textColor='#3a2619';
 b.drawText(win?'ВСЕ 6 КРЫС ПОЙМАНЫ!':'КРЫСЫ УБЕЖАЛИ',20,18,600,38,'center');
 b.fontSize=20;
 b.textColor='#5b3a20';
 b.drawText(win?'Квест засчитан!':'Попытка не засчитана.',20,62,600,30,'center');
 b.fontSize=17;
 b.textColor='#70482c';
 b.drawText(win?'Нажмите Enter или коснитесь экрана':'Нажмите Enter или коснитесь экрана, чтобы начать заново',20,102,600,30,'center');
 this.addChild(s);this._endOverlay=s;
 if(win)this.completeQuest();
};

RatCatchScene.prototype.completeQuest=function(){
 var old=Number($gameVariables.value(11))||0;$gameVariables.setValue(11,old+1);
 var id=this._eventId||0;if(!id&&$gameMap&&$gameMap._interpreter)id=$gameMap._interpreter._eventId||0;
 if(id>0)$gameSelfSwitches.setValue([$gameMap.mapId(),id,'A'],true);
};

RatCatchScene.prototype.restartAttempt=function(){
 if(this._endOverlay){this.removeChild(this._endOverlay);this._endOverlay=null;}
 this._time=GAME_TIME;this._hits=0;this._lastHit=-999;this._ended=false;this._won=false;this._selected=0;this._broomTimer=0;this._caught=0;this.resetRats();
 this.setMessage('Выберите крысу. Стрелки вокруг неё показывают направление удара. Нужно поймать все 6.');this.refreshAll();
};

var _BF_RatCatch_cmd=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
 _BF_RatCatch_cmd.call(this,command,args);
 if(String(command).toUpperCase()==='RATCATCH'&&args&&String(args[0]).toLowerCase()==='start'){
  $gameTemp._ratCatchEventId=this._eventId;
  SceneManager.push(RatCatchScene);
 }
};
})();
