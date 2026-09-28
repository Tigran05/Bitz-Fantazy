/*:
 * @plugindesc Bitz Fantasy — BF_RatCatch. Puzzle mini-game: rats, baited mousetrap, vents, fan, valve, crates and visible airflow.
 * @author ASTROLIT
 *
 * @help
 * Plugin command:
 *   BF_RatCatch start
 *
 * Script call:
 *   BF_RatCatch_Start();
 *
 * Result:
 *   Quest receives SUCCESS
 *   Self Switch A of the launching event = ON
 *
 * Controls:
 *   Mouse / touch — interact and drag cheese/crates
 *   ESC — exit
 *   R — reset
 *   S — hint
 */
(function(){
'use strict';

var W=1280,H=720,TOTAL=6,RESULT_VAR=0,WAIT='bfRatCatchWait';
var ROOT='BF_RatCatch/';
var origin={mapId:0,eventId:0};
var cache={};

function img(name){
  if(!cache[name]) cache[name]=ImageManager.loadPicture(ROOT+name);
  return cache[name];
}
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function dist(ax,ay,bx,by){ var dx=ax-bx,dy=ay-by; return Math.sqrt(dx*dx+dy*dy); }
function insidePoly(x,y,p){
  var c=false;
  for(var i=0,j=p.length-1;i<p.length;j=i++){
    var xi=p[i][0],yi=p[i][1],xj=p[j][0],yj=p[j][1];
    if(((yi>y)!==(yj>y)) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) c=!c;
  }
  return c;
}
function circleRect(cx,cy,r,rect){
  var nx=clamp(cx,rect.x,rect.x+rect.w),ny=clamp(cy,rect.y,rect.y+rect.h);
  var dx=cx-nx,dy=cy-ny; return dx*dx+dy*dy<=r*r;
}
function pointerHit(x,y,cx,cy,r){ return dist(x,y,cx,cy)<=r; }
function seOk(){ try{SoundManager.playOk();}catch(e){} }
function seBuzzer(){ try{SoundManager.playBuzzer();}catch(e){} }

function Scene_BFRatCatch(){ this.initialize.apply(this,arguments); }
Scene_BFRatCatch.prototype=Object.create(Scene_Base.prototype);
Scene_BFRatCatch.prototype.constructor=Scene_BFRatCatch;

Scene_BFRatCatch.prototype.initialize=function(){
  Scene_Base.prototype.initialize.call(this);
  this._frame=0; this._caught=0; this._drag=null; this._done=false; this._tokenTaken=false;
  this._finishTimer=0; this._tokenSeed=2; this._lastHint=0; this._finishTimer=0;
  this._fanOn=false; this._fanFrame=0; this._fanTimer=0;
  this._valveMode=0; // -1 left, 0 closed, 1 right
  this._valveAngle=0; this._valveFrom=0; this._valveTo=0; this._valveT=1;
  this._shutters=[false,false]; this._shutterP=[0,0];
  this._rats=[]; this._crates=[]; this._wind=[];
  this._msg=''; this._msgT=0;
  this._playPoly=[
    [150,456],[260,448],[390,445],[520,442],[680,442],[835,446],[980,450],[1100,462],
    [1200,480],[1250,520],[1270,575],[1260,640],[1235,690],[1090,710],[910,712],[730,712],
    [545,708],[390,695],[275,665],[205,630],[170,590],[150,530]
  ];
  this._trap={x:640,y:590,r:82,busy:0};
  this._cheese={x:435,y:585,homeX:435,homeY:585,placed:false,held:false,sprite:null};
};

Scene_BFRatCatch.prototype.preload=function(){
  var n=['background','cheese','crate','shadow','mousetrap_open','mousetrap_closed','token','wind_streak','wind_glow','valve'];
  for(var i=0;i<4;i++){ n.push('fan_frame_'+i); n.push('shutter_frame_'+i); }
  for(var r=1;r<=6;r++) n.push('rat_'+r);
  n.forEach(img);
};
Scene_BFRatCatch.prototype.sp=function(name,x,y,scale,ax,ay,layer){
  var s=new Sprite(img(name)); s.anchor.set(ax==null?.5:ax,ay==null?.5:ay); s.x=x; s.y=y; if(scale)s.scale.set(scale); (layer||this._world).addChild(s); return s;
};

Scene_BFRatCatch.prototype.create=function(){
  Scene_Base.prototype.create.call(this); this.preload();
  this._world=new Sprite(); this.addChild(this._world);
  this._bgLayer=new Sprite(); this._mechLayer=new Sprite(); this._objLayer=new Sprite(); this._windLayer=new Sprite(); this._ratLayer=new Sprite(); this._fxLayer=new Sprite();
  this._world.addChild(this._bgLayer,this._mechLayer,this._objLayer,this._windLayer,this._ratLayer,this._fxLayer);
  this._bg=new Sprite(img('background')); this._bg.x=0;this._bg.y=0;this._bgLayer.addChild(this._bg);
  this.createMechanisms(); this.createTrap(); this.createCrates(); this.createCheese(); this.createRats(); this.createWind();
  this.createHud(); this.resizeWorld(); this.refreshHud();
  this.showMessage('Поставьте сыр в крысоловку.');
};

Scene_BFRatCatch.prototype.createMechanisms=function(){
  // These coordinates are in the same 1280x720 space as the background.
  this._leftSh=this.sp('shutter_frame_0',470,205,.86,.5,.5,this._mechLayer);
  this._fan=this.sp('fan_frame_0',640,205,.92,.5,.5,this._mechLayer);
  this._rightSh=this.sp('shutter_frame_0',810,205,.86,.5,.5,this._mechLayer);

  // Real fixed wheel on the pipe. Only this wheel rotates; its pivot is its exact image centre.
  this._valveX=1182; this._valveY=405;
  this._valve=this.sp('valve',this._valveX,this._valveY,1.0,.5,.5,this._mechLayer);
};

Scene_BFRatCatch.prototype.createTrap=function(){
  this._trapSp=this.sp('mousetrap_open',this._trap.x,this._trap.y,.62,.5,.72,this._objLayer);
};
Scene_BFRatCatch.prototype.createCrates=function(){
  // Ground positions from the user's marked blue zone, near the tunnel mouth.
  var starts=[[445,468],[545,468],[645,468]];
  for(var i=0;i<starts.length;i++){
    var p=starts[i],shadow=this.sp('shadow',p[0],p[1]+8,.19,.5,.5,this._objLayer);
    shadow.alpha=.16;
    var s=this.sp('crate',p[0],p[1],.58,.5,1,this._objLayer);
    this._crates.push({x:p[0],y:p[1],homeX:p[0],homeY:p[1],w:64,h:58,held:false,sprite:s,shadow:shadow});
  }
};
Scene_BFRatCatch.prototype.createCheese=function(){
  this._cheese.sprite=this.sp('cheese',this._cheese.x,this._cheese.y,.62,.5,1,this._objLayer);
};
Scene_BFRatCatch.prototype.createRats=function(){
  var starts=[[205,525],[305,590],[420,535],[865,530],[1005,585],[1150,525]];
  for(var i=0;i<6;i++){
    var p=starts[i],sh=this.sp('shadow',p[0],p[1]+8,.16,.5,.5,this._ratLayer); sh.alpha=.15;
    var s=this.sp('rat_'+(i+1),p[0],p[1],.84,.5,1,this._ratLayer);
    this._rats.push({id:i,x:p[0],y:p[1],homeX:p[0],homeY:p[1],side:i<3?0:1,speed:28+(i%3)*2,panic:0,angle:0,target:null,caught:false,committed:false,interested:0,seed:1.7*i,sprite:s,shadow:sh,wait:0,goalIndex:i});
  }
};

Scene_BFRatCatch.prototype.createWind=function(){
  for(var side=0;side<2;side++){
    for(var i=0;i<14;i++){
      var s=new Sprite(img('wind_streak')); s.anchor.set(.05,.5); s.visible=false; s._side=side; s._i=i; s._p=i/14; s._lane=(i-6.5)*8; this._wind.push(s); this._windLayer.addChild(s);
    }
    var g=new Sprite(img('wind_glow')); g.anchor.set(.5,.5); g.alpha=0; g._side=side; g._glow=true; g.x=side===0?470:810; g.y=215; this._wind.push(g); this._windLayer.addChild(g);
  }
};

Scene_BFRatCatch.prototype.createHud=function(){
  this._hudBmp=new Bitmap(W,H); this._hudSp=new Sprite(this._hudBmp); this.addChild(this._hudSp);
};
Scene_BFRatCatch.prototype.refreshHud=function(){
  var b=this._hudBmp; b.clear(); b.fontFace='Arial'; b.textColor='#fff8e6'; b.outlineColor='#000'; b.outlineWidth=6;
  b.fillOpacity=225; b.fillRect(30,24,625,62,'#070707'); b.fillOpacity=255; b.fontSize=27; b.drawText('ЗАГОНИТЕ ВСЕХ КРЫС В ЛОВУШКУ',48,38,590,34,'left');
  b.fillOpacity=225; b.fillRect(1070,24,180,62,'#070707'); b.fillOpacity=255; b.fontSize=25; b.drawText('КРЫСЫ: '+this._caught+' / '+TOTAL,1075,40,170,34,'center');
  b.fontSize=20; b.outlineWidth=5; b.drawText('ESC — выйти',1090,675,160,28,'right');
  if(this._msgT>0&&this._msg){
    b.fillOpacity=238; b.fillRect(300,635,680,55,'#050607'); b.fillOpacity=255; b.fontSize=24; b.outlineWidth=7; b.drawText(this._msg,315,648,650,30,'center');
  }
};
Scene_BFRatCatch.prototype.showMessage=function(t){ this._msg=t;this._msgT=170;this.refreshHud(); };
Scene_BFRatCatch.prototype.resizeWorld=function(){
  var sx=Graphics.boxWidth/W,sy=Graphics.boxHeight/H;
  this._world.scale.set(sx,sy); this._world.x=0;this._world.y=0;
  // HUD stays in screen space so it remains readable.
  this._hudSp.scale.set(1,1); this._hudSp.x=0;this._hudSp.y=0;
};
Scene_BFRatCatch.prototype.mouse=function(){ return {x:TouchInput.x/(Graphics.boxWidth/W),y:TouchInput.y/(Graphics.boxHeight/H)}; };

Scene_BFRatCatch.prototype.playable=function(x,y,r){
  if(!insidePoly(x,y,this._playPoly))return false;
  return x>=120&&x<=1270&&y>=440&&y<=712;
};
Scene_BFRatCatch.prototype.boxRect=function(c){ return {x:c.x-c.w/2,y:c.y-c.h,w:c.w,h:c.h}; };
Scene_BFRatCatch.prototype.blocked=function(x,y,r,ignore){
  for(var i=0;i<this._crates.length;i++){ var c=this._crates[i]; if(c===ignore||c.held)continue; if(circleRect(x,y,r,this.boxRect(c)))return true; }
  return false;
};
Scene_BFRatCatch.prototype.crateOverlaps=function(c,x,y){
  var cx=x,cy=y;
  if(!this.playable(cx,cy,35))return true;
  var rr={x:cx-c.w/2,y:cy-c.h,w:c.w,h:c.h};
  if(dist(cx,cy,this._trap.x,this._trap.y)<115)return true;
  for(var i=0;i<this._crates.length;i++){var q=this._crates[i];if(q===c||q.held)continue;var qr=this.boxRect(q);if(rr.x<qr.x+qr.w&&rr.x+rr.w>qr.x&&rr.y<qr.y+qr.h&&rr.y+rr.h>qr.y)return true;}
  return false;
};

Scene_BFRatCatch.prototype.windLeft=function(){ return this._fanOn&&this._valveMode<0&&this._shutters[0]; };
Scene_BFRatCatch.prototype.windRight=function(){ return this._fanOn&&this._valveMode>0&&this._shutters[1]; };
Scene_BFRatCatch.prototype.crossDraft=function(side){
  if(!this._fanOn||this._valveMode===0)return false;
  var open=side===0?this._shutters[0]:this._shutters[1];
  var active=side===0?this.windLeft():this.windRight();
  return open&&!active;
};

Scene_BFRatCatch.prototype.updateMechanisms=function(){
  if(this._fanOn){this._fanTimer++;if(this._fanTimer%4===0)this._fanFrame=(this._fanFrame+1)%4;}else this._fanFrame=0;
  this._fan.bitmap=img('fan_frame_'+this._fanFrame);
  if(this._valveT<1){
    this._valveT=Math.min(1,this._valveT+.11); this._valveAngle=this._valveFrom+(this._valveTo-this._valveFrom)*(1-(1-this._valveT)*(1-this._valveT));
  }
  this._valve.x=this._valveX; this._valve.y=this._valveY; this._valve.rotation=this._valveAngle;
  for(var i=0;i<2;i++){
    var goal=this._shutters[i]?1:0; this._shutterP[i]+=(goal-this._shutterP[i])*.20;
    var p=this._shutterP[i],f=p<.20?0:p<.50?1:p<.80?2:3;
    if(i===0)this._leftSh.bitmap=img('shutter_frame_'+f); else this._rightSh.bitmap=img('shutter_frame_'+f);
  }
  if(this._trap.busy>0){this._trap.busy--;if(this._trap.busy===0)this._trapSp.bitmap=img('mousetrap_open');}
};

Scene_BFRatCatch.prototype.updateWind=function(){
  var active=[this.windLeft(),this.windRight()];
  for(var i=0;i<this._wind.length;i++){
    var s=this._wind[i],on=active[s._side];
    if(s._glow){
      s.visible=on; if(on){s.alpha=.45+.18*Math.sin(this._frame*.08);s.scale.set(.8+.05*Math.sin(this._frame*.04));}
      continue;
    }
    if(!on){s.visible=false;continue;}
    var side=s._side,t=(s._p+this._frame*.012+(s._i%3)*.002)%1;
    var sx=side===0?470:810,sy=220,ex=side===0?650:630,ey=495;
    s.x=sx+(ex-sx)*t; s.y=sy+(ey-sy)*t+s._lane;
    s.rotation=Math.atan2(ey-sy,ex-sx);
    s.alpha=.20+.78*Math.sin(Math.PI*t);
    s.scale.set(.55+1.15*(1-Math.abs(t-.5)),.70);
    s.visible=true;
  }
};

Scene_BFRatCatch.prototype.pickPoint=function(r){
  var pts=[[190,505],[265,565],[350,500],[450,565],[555,510],[655,555],[755,500],[860,560],[960,505],[1060,560],[1170,515],[1140,640],[1010,675],[870,650],[700,670],[530,650],[360,660],[240,625]];
  return pts[(r.goalIndex+Math.floor(this._frame/240))%pts.length];
};
Scene_BFRatCatch.prototype.ratTarget=function(r){
  if(r.caught)return {x:r.x,y:r.y};
  if(!this._cheese.placed)return this.pickPoint(r);

  // The cheese is mandatory: without it rats can NEVER be captured.
  // Once airflow is aimed at a rat's side, that rat follows the scent corridor.
  var activeSide=this._valveMode<0?0:(this._valveMode>0?1:-1);
  var active=activeSide>=0 && this._fanOn && (activeSide===0?this._shutters[0]:this._shutters[1]);
  var dCheese=dist(r.x,r.y,this._cheese.x,this._cheese.y);

  if(!r.committed && active && r.side===activeSide){
    r.interested=Math.min(1,(r.interested||0)+.025);
    // Close enough to smell the bait: lock this rat onto the trap route.
    if(dCheese<120 || r.interested>.72) r.committed=true;
  } else {
    r.interested=Math.max(0,(r.interested||0)-.008);
  }

  if(r.committed)return {x:this._trap.x,y:this._trap.y-4};
  if(dCheese<140){
    return {x:this._cheese.x+(r.side===0?-30:30),y:this._cheese.y+8};
  }
  return this.pickPoint(r);
};
Scene_BFRatCatch.prototype.moveRat=function(r,dt){
  var target=this.ratTarget(r);
  var otherSide=this.crossDraft(r.side===0?1:0);
  if(otherSide&&!(this._cheese.placed&&(r.side===0?this.windLeft():this.windRight()))) {
    r.panic=Math.min(1,r.panic+.06); target=r.side===0?{x:1160,y:560}:{x:180,y:560};
  }else r.panic=Math.max(0,r.panic-.025);
  var dx=target.x-r.x,dy=target.y-r.y,d=Math.max(1,Math.sqrt(dx*dx+dy*dy));
  var spd=r.panic>.15?90:r.speed; var vx=dx/d*spd,vy=dy/d*spd;
  if(r.panic<=.15&&this._cheese.placed&&(r.side===0?this.windLeft():this.windRight())){
    var w=r.side===0?1:-1; vx+=w*13; vy+=5;
  }
  // Soft rat-to-rat separation
  for(var i=0;i<this._rats.length;i++){if(this._rats[i]===r||this._rats[i].caught)continue;var q=this._rats[i],dd=dist(r.x,r.y,q.x,q.y);if(dd<38&&dd>0){var push=(38-dd)*1.2;vx+=(r.x-q.x)/dd*push;vy+=(r.y-q.y)/dd*push;}}
  // Crate avoidance
  for(var c=0;c<this._crates.length;c++){var box=this._crates[c];if(box.held)continue;var bx=box.x,by=box.y-box.h/2,dd2=dist(r.x,r.y,bx,by);if(dd2<70&&dd2>0){var pu=(70-dd2)*1.0;vx+=(r.x-bx)/dd2*pu;vy+=(r.y-by)/dd2*pu;}}
  var nx=r.x+vx*dt,ny=r.y+vy*dt;
  var ok=this.playable(nx,ny,16)&&!this.blocked(nx,ny,16,null);
  if(ok){r.x=nx;r.y=ny;}else{
    var ox=this.playable(nx,r.y,16)&&!this.blocked(nx,r.y,16,null);var oy=this.playable(r.x,ny,16)&&!this.blocked(r.x,ny,16,null);
    if(ox)r.x=nx;else vx*=-.3; if(oy)r.y=ny;else vy*=-.3;
    if(!ox&&!oy)r.goalIndex=(r.goalIndex+3)%18;
  }
  r.angle=Math.atan2(vy,vx);
};
Scene_BFRatCatch.prototype.updateRats=function(){
  for(var i=0;i<this._rats.length;i++){
    var r=this._rats[i]; if(r.caught)continue; this.moveRat(r,1/60);
    r.sprite.x=r.x;r.sprite.y=r.y; r.shadow.x=r.x;r.shadow.y=r.y+7;
    var base=Math.abs(r.sprite.scale.x)||.84; r.sprite.scale.x=r.angle>Math.PI/2||r.angle< -Math.PI/2?-base:base;
    r.sprite.y=r.y+Math.sin(this._frame*.16+r.seed)*1.5;
    r.sprite.rotation=Math.sin(this._frame*.08+r.seed)*.025;
    if(this._trap.busy<=0&&this._cheese.placed&&r.committed&&dist(r.x,r.y,this._trap.x,this._trap.y)<62)this.captureRat(r);
  }
};

Scene_BFRatCatch.prototype.captureRat=function(r){
  if(r.caught)return; r.caught=true; this._caught++; r.sprite.visible=false;r.shadow.visible=false;
  this._trap.busy=28; this._trapSp.bitmap=img('mousetrap_closed'); seOk();
  if(this._caught<TOTAL){
    this.showMessage('Щёлк! Крыса поймана.');
    return;
  }

  // Все крысы пойманы: это и есть выполнение задания.
  // Монетка — необязательная скрытая находка и на квест не влияет.
  this.showMessage('Все крысы пойманы. Поищите спрятанную фишку!');
  if(this._token){ this._token.visible=true; this._token.alpha=.62; this._token.x=1038; this._token.y=612; }
  this._finishTimer=240;
  if(window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameResult==='function'){
    window.BF_QuestSystem.minigameResult('SUCCESS');
  }
  // После успешной поимки событие крыс больше нельзя запустить повторно.
  if(origin.mapId&&origin.eventId){
    $gameSelfSwitches.setValue([origin.mapId,origin.eventId,'A'],true);
  }
  // В квесте бармена отдельно открываем страницу возврата к Майку.
  var mg = null;
  try {
    mg = window.BF_QuestSystem && window.BF_QuestSystem.game ? window.BF_QuestSystem.game()._minigame : null;
  } catch(e) {}
  if (mg && mg.questId === 'bartender') {
    $gameSelfSwitches.setValue([7,8,'A'],true);
  }
};

Scene_BFRatCatch.prototype.hit=function(p){
  if(this._caught===TOTAL&&this._token.visible&&pointerHit(p.x,p.y,this._token.x,this._token.y,46))return{type:'token'};
  if(!this._cheese.placed&&pointerHit(p.x,p.y,this._cheese.x,this._cheese.y-25,45))return{type:'cheese'};
  for(var i=this._crates.length-1;i>=0;i--){var c=this._crates[i];if(!c.held&&pointerHit(p.x,p.y,c.x,c.y-c.h/2,48))return{type:'crate',obj:c};}
  if(pointerHit(p.x,p.y,this._valveX,this._valveY,60))return{type:'valve'};
  if(pointerHit(p.x,p.y,640,205,70))return{type:'fan'};
  if(p.x>395&&p.x<545&&p.y>150&&p.y<280)return{type:'shutter',i:0};
  if(p.x>735&&p.x<885&&p.y>150&&p.y<280)return{type:'shutter',i:1};
  return null;
};
Scene_BFRatCatch.prototype.beginDrag=function(type,obj,p){this._drag={type:type,obj:obj,dx:p.x-obj.x,dy:p.y-obj.y};obj.held=true;};
Scene_BFRatCatch.prototype.drag=function(){
  if(!this._drag)return;var p=this.mouse(),o=this._drag.obj;o.x=clamp(p.x-this._drag.dx,150,1210);o.y=clamp(p.y-this._drag.dy,445,700);o.sprite.x=o.x;o.sprite.y=o.y;
  if(o.shadow){o.shadow.x=o.x;o.shadow.y=o.y+8;}
};
Scene_BFRatCatch.prototype.dropDrag=function(){
  if(!this._drag)return;this.drag();var d=this._drag,o=d.obj;
  if(d.type==='cheese'){
    if(dist(o.x,o.y,this._trap.x,this._trap.y-10)<78){o.x=this._trap.x;o.y=this._trap.y-13;this._cheese.placed=true;seOk();}
    else{o.x=o.homeX;o.y=o.homeY;seBuzzer();}
  }else if(d.type==='crate'){
    if(this.crateOverlaps(o,o.x,o.y)){o.x=o.homeX;o.y=o.homeY;this.showMessage('Здесь ящик мешает проходу.');seBuzzer();}
    else{seOk();}
  }
  o.held=false;o.sprite.x=o.x;o.sprite.y=o.y;if(o.shadow){o.shadow.x=o.x;o.shadow.y=o.y+8;}this._drag=null;
};

Scene_BFRatCatch.prototype.turnValve=function(){
  var next=this._valveMode===-1?0:this._valveMode===0?1:-1;
  this._valveMode=next;this._valveFrom=this._valveAngle;
  this._valveTo=next<0?-Math.PI/2:next>0?Math.PI/2:0;this._valveT=0;
  // The big valve controls the two shutters. No second button puzzle.
  this._shutters=[next<0,next>0];
  if(next<0)this.showMessage('Поток направлен влево: крысы слева слышат сыр.');
  else if(next>0)this.showMessage('Поток направлен вправо: крысы справа слышат сыр.');
  else this.showMessage('Вентиляция перекрыта.');
  seOk();
};
Scene_BFRatCatch.prototype.toggleFan=function(){
  if(!this._cheese.placed){ this.showMessage('Сначала положите сыр в крысоловку.'); seBuzzer(); return; }
  if(this._valveMode===0){ seBuzzer(); return; }
  this._fanOn=!this._fanOn;this.showMessage(this._fanOn?'Вентилятор запущен.':'Вентилятор остановлен.');seOk();
};
Scene_BFRatCatch.prototype.toggleShutter=function(i){ seBuzzer(); };
Scene_BFRatCatch.prototype.takeToken=function(){
  if(this._tokenTaken)return;
  this._tokenTaken=true;
  if(this._token)this._token.visible=false;
  if(window.BF_Inventory && typeof window.BF_Inventory.game==='function'){
    window.BF_Inventory.game().add('coin',1);
  } else if(window.$gameBFInventory && typeof window.$gameBFInventory.add==='function'){
    window.$gameBFInventory.add('coin',1);
  }
  this._finishTimer=1;
  this._done=true;
  seOk();
};
Scene_BFRatCatch.prototype.createToken=function(){
  // Hidden easter egg: visible only after all rats are caught, but bright enough to be discoverable.
  this._token=this.sp('token',1038,612,.42,.5,.5,this._fxLayer);
  this._token.alpha=.62;
  this._token.visible=false;
};
Scene_BFRatCatch.prototype.resetPuzzle=function(){
  this._caught=0;this._tokenTaken=false;this._done=false;this._fanOn=false;this._fanFrame=0;this._fanTimer=0;this._valveMode=0;this._valveAngle=0;this._valveFrom=0;this._valveTo=0;this._valveT=1;this._shutters=[false,false];this._shutterP=[0,0];this._trap.busy=0;this._trapSp.bitmap=img('mousetrap_open');this._finishTimer=0;this._tokenTaken=false;if(this._token){this._token.visible=false;this._token.alpha=.62;this._token.scale.set(.42);}
  this._cheese.x=this._cheese.homeX;this._cheese.y=this._cheese.homeY;this._cheese.placed=false;this._cheese.held=false;this._cheese.sprite.x=this._cheese.x;this._cheese.sprite.y=this._cheese.y;
  for(var i=0;i<this._crates.length;i++){var c=this._crates[i];c.x=c.homeX;c.y=c.homeY;c.held=false;c.sprite.visible=true;c.sprite.x=c.x;c.sprite.y=c.y;c.shadow.x=c.x;c.shadow.y=c.y+8;}
  for(var j=0;j<this._rats.length;j++){var r=this._rats[j];r.x=r.homeX;r.y=r.homeY;r.caught=false;r.committed=false;r.interested=0;r.panic=0;r.sprite.visible=true;r.shadow.visible=true;r.sprite.x=r.x;r.sprite.y=r.y;r.goalIndex=j;r.vx=0;r.vy=0;}
  this.showMessage('Головоломка сброшена.');
};

Scene_BFRatCatch.prototype.updateInput=function(){
  if(Input.isTriggered('escape')){SceneManager.pop();return;}
  if(Input.isTriggered('r')){this.resetPuzzle();return;}
  if(Input.isTriggered('s')){return;}
  if(this._drag){if(TouchInput.isReleased())this.dropDrag();else this.drag();return;}
  if(!TouchInput.isTriggered())return;
  var p=this.mouse(),h=this.hit(p);if(!h)return;
  if(h.type==='token'){this.takeToken();return;}
  if(h.type==='cheese'){this.beginDrag('cheese',this._cheese,p);return;}
  if(h.type==='crate'){this.beginDrag('crate',h.obj,p);return;}
  if(h.type==='fan'){this.toggleFan();return;}
  if(h.type==='valve'){this.turnValve();return;}
  if(h.type==='shutter'){this.toggleShutter(h.i);return;}
};

Scene_BFRatCatch.prototype.update=function(){
  Scene_Base.prototype.update.call(this);this._frame++;this.resizeWorld();
  this.updateMechanisms();this.updateWind();this.updateRats();this.updateInput();
  if(this._msgT>0){this._msgT--;if(this._msgT%4===0)this.refreshHud();}
  if(this._finishTimer>0){
    this._finishTimer--;
    if(this._token&&this._token.visible){
      this._token.alpha=.48+.20*Math.sin(this._frame*.18);
      var ps=.42+.035*Math.sin(this._frame*.12); this._token.scale.set(ps);
    }
    if(this._finishTimer===0){this._done=true;SceneManager.pop();return;}
  }
};

// Patch create() to create token after layers are ready.
var _create=Scene_BFRatCatch.prototype.create;
Scene_BFRatCatch.prototype.create=function(){_create.call(this);this.createToken();};

var oldPC=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
  oldPC.call(this,command,args);
  var c=String(command||'').toUpperCase();var a=(args||[]).map(function(v){return String(v||'').toLowerCase();});
  if((c==='BF_RATCATCH'||c==='RATCATCH')&&(!a.length||a[0]==='start')){
    origin={mapId:this._mapId||$gameMap.mapId(),eventId:this._eventId||0};
    var allowed=true;
    if(window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameStart==='function'){
      allowed=window.BF_QuestSystem.minigameStart('BF_RatCatch','bartender');
    }
    if(!allowed){
      $gameMessage.add('Сначала поговорите с барменом.');
      return;
    }
    this.setWaitMode(WAIT); SceneManager.push(Scene_BFRatCatch);
  }
};
var oldWait=Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode=function(){if(this._waitMode===WAIT)return SceneManager._scene instanceof Scene_BFRatCatch;return oldWait.call(this);};
window.BF_RatCatch_Start=function(){origin={mapId:$gameMap.mapId(),eventId:0};SceneManager.push(Scene_BFRatCatch);};

})();
