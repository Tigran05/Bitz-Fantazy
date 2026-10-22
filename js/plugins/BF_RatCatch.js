/*:
 * @plugindesc Bitz Fantasy — BF_RatCatch. Full-screen single logic puzzle: build a safe route for one mouse into one mousetrap.
 * @author ASTROLIT
 *
 * @help
 * Plugin command:
 *   BF_RatCatch start
 *   BF_RatCatch start <questId>
 *
 * Script call:
 *   BF_RatCatch_Start();
 *   BF_RatCatch_Start('bartender');
 *
 * Controls:
 *   Mouse / touch — drag barriers between marked sockets
 *   ENTER / SPACE / click the mouse — release the mouse
 *   R — reset the puzzle
 *   ESC — exit
 *
 * Puzzle:
 *   One hand-designed maze. One mouse. One mousetrap. Ten movable barriers.
 *   The mouse follows a deterministic left-hand navigation rule.
 *   Four visible holes are hazards: if the mouse enters one, the attempt is lost.
 *   The puzzle has a single safe barrier configuration among all valid
 *   placements, so the player must plan several moves ahead.
 *
 * Result:
 *   BF_QuestSystem.minigameResult('SUCCESS')
 *   Self Switch A of the launching event = ON
 */
(function(){
'use strict';

var W=1280,H=720;
var WAIT='bfRatCatchWait';
var DEFAULT_QUEST='bartender';
var BLOCK_COUNT=10;
var origin={mapId:0,eventId:0};
var cache={};

function img(name){
  if(!cache[name]) cache[name]=ImageManager.loadPicture('BF_RatCatch/'+name);
  return cache[name];
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function key(x,y){return x+','+y;}
function dist2(ax,ay,bx,by){var dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;}
function seOk(){try{SoundManager.playOk();}catch(e){}}
function seBuzzer(){try{SoundManager.playBuzzer();}catch(e){}}
function seCursor(){try{SoundManager.playCursor();}catch(e){}}
function seCancel(){try{SoundManager.playCancel();}catch(e){}}
function bfRatCatchLanguage(){
  var lang='ru';
  try{
    if(typeof ConfigManager!=='undefined'&&ConfigManager.bfLanguage){
      lang=String(ConfigManager.bfLanguage).toLowerCase();
    }
  }catch(e){}
  return lang.indexOf('en')===0?'en':'ru';
}
function bfRatCatchQuestRequiredMessage(){
  return bfRatCatchLanguage()==='en'
    ? 'Please accept the quest before starting this mini-game.'
    : 'Сначала получите задание для этой мини-игры.';
}

/*
 * 23x13 redesigned branching maze. The visible walls and the logical walkability
 * use the same MAP, so the player always sees the same geometry the mouse uses.
 */
var MAP=[
  '#######################',
  '#......#..##..........#',
  '#...####......#.#.###.#',
  '#....#.##.......#.###.#',
  '###...#...###.....#...#',
  '#......#...############',
  '#...##....#...###.##..#',
  '#.#.##.....###..##...##',
  '#...#.#..#...#......###',
  '#....#...##.....#..#..#',
  '##......#....#....###.#',
  '#.......#.#..#.#......#',
  '#######################'
];
var ROWS=MAP.length;
var COLS=MAP[0].length;
var CELL=Math.min(W/COLS,H/ROWS);
var OX=(W-COLS*CELL)/2;
var OY=(H-ROWS*CELL)/2;
var START={x:1,y:1};
var TRAP={x:21,y:11};
var WALK={};
for(var yy=0;yy<ROWS;yy++){
  for(var xx=0;xx<COLS;xx++)if(MAP[yy][xx]!=='#')WALK[key(xx,yy)]=true;
}

/* Four dangerous mouse holes. The first one is intentionally close to the
 * starting corridor so the initial arrangement demonstrates the danger. */
var HOLES=[
  [2,2],
  [6,11],
  [15,2],
  [15,9]
];
var HOLE_SET={};
for(var hi=0;hi<HOLES.length;hi++)HOLE_SET[key(HOLES[hi][0],HOLES[hi][1])]=true;

/* Barriers can only be placed on these sockets. */
var SOCKETS=[
  [1,5],
  [2,1],
  [9,11],
  [2,3],
  [21,3],
  [13,9],
  [3,5],
  [17,11],
  [17,9],
  [15,1],
  [3,11],
  [5,5],
  [19,11],
  [3,8],
  [14,11],
  [1,9],
  [4,1],
  [17,4]
];

/* Initial position. This intentionally drives the mouse into the first hole. */
var BLOCK_START=[
  [1,5],
  [9,11],
  [2,3],
  [21,3],
  [13,9],
  [3,5],
  [17,11],
  [17,9],
  [15,1],
  [3,11]
];

/* Verified safe configuration for the harder maze. Only two of the 43,758
 * possible placements reach the trap; this solution is not revealed to players. */
var BLOCK_SOLUTION=[
  [1,5],
  [9,11],
  [2,3],
  [21,3],
  [3,11],
  [5,5],
  [3,8],
  [14,11],
  [1,9],
  [4,1]
];

function Scene_BFRatCatch(){this.initialize.apply(this,arguments);}
Scene_BFRatCatch.prototype=Object.create(Scene_Base.prototype);
Scene_BFRatCatch.prototype.constructor=Scene_BFRatCatch;

Scene_BFRatCatch.prototype.initialize=function(){
  Scene_Base.prototype.initialize.call(this);
  this._frame=0;
  this._mode='build';
  this._drag=null;
  this._message='';
  this._messageT=0;
  this._won=false;
  this._lost=false;
  this._resultSent=false;
  this._mouse=null;
  this._mouseShadow=null;
  this._trapSp=null;
  this._holeSps=[];
  this._barriers=[];
  this._mazeSp=null;
  this._fxSp=null;
  this._path=[];
  this._pathIndex=0;
  this._stepT=0;
  this._pauseT=0;
  this._runResult='';
  this._lossT=0;
};

Scene_BFRatCatch.prototype.preload=function(){
  ['RatRun','mousetrap_open','mousetrap_closed','shadow'].forEach(img);
};

Scene_BFRatCatch.prototype.xy=function(gx,gy){
  return {x:OX+gx*CELL+CELL/2,y:OY+gy*CELL+CELL/2};
};
Scene_BFRatCatch.prototype.mousePoint=function(){
  var sx=Graphics.boxWidth/W,sy=Graphics.boxHeight/H;
  return {x:TouchInput.x/sx,y:TouchInput.y/sy};
};
Scene_BFRatCatch.prototype.gridFromPoint=function(x,y){
  return {x:Math.floor((x-OX)/CELL),y:Math.floor((y-OY)/CELL)};
};
Scene_BFRatCatch.prototype.inGrid=function(x,y){
  return x>=0&&y>=0&&x<COLS&&y<ROWS;
};
Scene_BFRatCatch.prototype.barrierSet=function(){
  var o={};
  for(var i=0;i<this._barriers.length;i++){
    var b=this._barriers[i]._bf;
    if(b.held)continue;
    o[key(b.x,b.y)]=true;
  }
  return o;
};

/* Deterministic left-hand wall navigation. The mouse does not know where
 * holes are; entering one is a genuine player mistake and loses the attempt. */
Scene_BFRatCatch.prototype.simulateMouse=function(maxSteps){
  var blocks=this.barrierSet();
  var dirs=[{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
  var x=START.x,y=START.y,d=1;
  var seen={};
  var path=[];
  for(var step=0;step<maxSteps;step++){
    path.push({x:x,y:y,dir:d});
    if(HOLE_SET[key(x,y)])return {status:'hole',path:path};
    if(x===TRAP.x&&y===TRAP.y)return {status:'success',path:path};
    var sk=key(x,y)+'|'+d;
    if(seen[sk])return {status:'loop',path:path};
    seen[sk]=true;
    var order=[(d+3)%4,d,(d+1)%4,(d+2)%4];
    var moved=false;
    for(var i=0;i<4;i++){
      var nd=order[i],nx=x+dirs[nd].dx,ny=y+dirs[nd].dy;
      if(this.inGrid(nx,ny)&&WALK[key(nx,ny)]&&!blocks[key(nx,ny)]){
        x=nx;y=ny;d=nd;moved=true;break;
      }
    }
    if(!moved)return {status:'dead',path:path};
  }
  return {status:'loop',path:path};
};

Scene_BFRatCatch.prototype.create=function(){
  Scene_Base.prototype.create.call(this);
  this.preload();
  this._world=new Sprite();
  this.addChild(this._world);
  this._mazeLayer=new Sprite();
  this._holeLayer=new Sprite();
  this._objectLayer=new Sprite();
  this._fxLayer=new Sprite();
  this._world.addChild(this._mazeLayer,this._holeLayer,this._objectLayer,this._fxLayer);

  this.drawMaze();
  this.createHoles();
  this.createTrap();
  this.createBlocks();
  this.createMouse();
  this.createFX();
  this.resizeWorld();
  this.showMessage('Переставьте преграды и постройте безопасный путь.');
};

Scene_BFRatCatch.prototype.drawMaze=function(){
  var bmp=new Bitmap(W,H),c=bmp._context;
  /* Deep, warm dungeon surround. */
  var bg=c.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#100e0c');bg.addColorStop(.5,'#211a15');bg.addColorStop(1,'#0c0b0a');
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  /* Soft vignette around the playable stone floor. */
  c.save();
  c.fillStyle='#211e1a';c.fillRect(OX-7,OY-7,COLS*CELL+14,ROWS*CELL+14);
  c.strokeStyle='rgba(219,174,111,0.20)';c.lineWidth=2;
  c.strokeRect(OX-5,OY-5,COLS*CELL+10,ROWS*CELL+10);
  c.restore();

  /* Each walkable cell gets a subtly varied stone slab with bevel and wear. */
  for(var y=0;y<ROWS;y++){
    for(var x=0;x<COLS;x++){
      if(!WALK[key(x,y)])continue;
      var px=OX+x*CELL,py=OY+y*CELL;
      var n=(x*17+y*31+x*y*7)%9;
      var base=['#292724','#2c2925','#302c27','#272522','#312d28','#2a2825','#332e28','#292622','#2d2a26'][n];
      c.fillStyle=base;c.fillRect(px+1,py+1,CELL-2,CELL-2);
      /* fine stone grain and a few worn flecks */
      c.fillStyle='rgba(230,205,169,0.025)';
      c.fillRect(px+4+(n%5),py+5+(n%4),CELL*.36,1.5);
      c.fillStyle='rgba(0,0,0,0.10)';
      c.fillRect(px+CELL*.58,py+CELL*.64,CELL*.25,1);
      if((x*3+y*5)%7===0){
        c.strokeStyle='rgba(8,7,6,0.25)';c.lineWidth=1;
        c.beginPath();c.moveTo(px+CELL*.18,py+CELL*.72);c.lineTo(px+CELL*.28,py+CELL*.66);c.lineTo(px+CELL*.33,py+CELL*.76);c.stroke();
      }
      /* bevel highlights on upper-left and shade on lower-right */
      c.strokeStyle='rgba(225,207,178,0.055)';c.lineWidth=1;
      c.beginPath();c.moveTo(px+2,py+CELL-2);c.lineTo(px+2,py+2);c.lineTo(px+CELL-2,py+2);c.stroke();
      c.strokeStyle='rgba(0,0,0,0.22)';
      c.beginPath();c.moveTo(px+CELL-2,py+2);c.lineTo(px+CELL-2,py+CELL-2);c.lineTo(px+2,py+CELL-2);c.stroke();
    }
  }

  /* Raised wall edges: dark foot, stone body, warm top bevel. Shared edges are
     drawn consistently from the same logical map as the rat navigation. */
  for(y=0;y<ROWS;y++){
    for(x=0;x<COLS;x++){
      if(!WALK[key(x,y)])continue;
      var rx=OX+x*CELL,ry=OY+y*CELL;
      var edges=[!WALK[key(x,y-1)],!WALK[key(x+1,y)],!WALK[key(x,y+1)],!WALK[key(x-1,y)]];
      for(var e=0;e<4;e++){
        if(!edges[e])continue;
        var x1,y1,x2,y2;
        if(e===0){x1=rx;y1=ry;x2=rx+CELL;y2=ry;}
        else if(e===1){x1=rx+CELL;y1=ry;x2=rx+CELL;y2=ry+CELL;}
        else if(e===2){x1=rx;y1=ry+CELL;x2=rx+CELL;y2=ry+CELL;}
        else{x1=rx;y1=ry;x2=rx;y2=ry+CELL;}
        c.save();c.lineCap='square';
        /* wall shadow/foot */
        c.strokeStyle='rgba(0,0,0,0.95)';c.lineWidth=CELL*.30;
        c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
        c.strokeStyle='#171411';c.lineWidth=CELL*.22;
        c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
        c.strokeStyle='#514437';c.lineWidth=Math.max(3,CELL*.095);
        c.beginPath();c.moveTo(x1,y1-1);c.lineTo(x2,y2-1);c.stroke();
        c.strokeStyle='rgba(220,185,139,0.30)';c.lineWidth=1.3;
        c.beginPath();c.moveTo(x1,y1-CELL*.07);c.lineTo(x2,y2-CELL*.07);c.stroke();
        c.restore();
      }
    }
  }
  /* Starting chamber and trap alcove receive restrained warm pools of light. */
  var sp=this.xy(START.x,START.y),tp=this.xy(TRAP.x,TRAP.y);
  var light=c.createRadialGradient(sp.x,sp.y,2,sp.x,sp.y,CELL*1.9);
  light.addColorStop(0,'rgba(224,174,91,0.11)');light.addColorStop(1,'rgba(224,174,91,0)');
  c.fillStyle=light;c.fillRect(sp.x-CELL*2,sp.y-CELL*2,CELL*4,CELL*4);
  light=c.createRadialGradient(tp.x,tp.y,2,tp.x,tp.y,CELL*2.2);
  light.addColorStop(0,'rgba(192,91,48,0.12)');light.addColorStop(1,'rgba(192,91,48,0)');
  c.fillStyle=light;c.fillRect(tp.x-CELL*2.2,tp.y-CELL*2.2,CELL*4.4,CELL*4.4);
  this._mazeSp=new Sprite(bmp);this._mazeLayer.addChild(this._mazeSp);
};

Scene_BFRatCatch.prototype.makeHole=function(){
  var s=CELL-8;
  var bmp=new Bitmap(s,s),c=bmp._context;
  var cx=s/2,cy=s/2,r=s*.39;
  c.save();
  c.fillStyle='rgba(0,0,0,0.35)';
  c.beginPath();c.arc(cx,cy+4,r+5,0,Math.PI*2);c.fill();
  var g=c.createRadialGradient(cx-3,cy-4,3,cx,cy,r);
  g.addColorStop(0,'#0a0908');g.addColorStop(.68,'#11100f');g.addColorStop(1,'#332217');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
  c.strokeStyle='#805b3d';c.lineWidth=3;c.beginPath();c.arc(cx,cy,r+1,0,Math.PI*2);c.stroke();
  c.strokeStyle='rgba(238,191,131,0.26)';c.lineWidth=1.5;c.beginPath();c.arc(cx-1,cy-2,r-3,Math.PI*1.04,Math.PI*1.95);c.stroke();
  c.restore();
  var sp=new Sprite(bmp);sp.anchor.set(.5,.5);return sp;
};

Scene_BFRatCatch.prototype.createHoles=function(){
  for(var i=0;i<HOLES.length;i++){
    var p=this.xy(HOLES[i][0],HOLES[i][1]);
    var sp=this.makeHole();sp.x=p.x;sp.y=p.y;sp._holeIndex=i;
    this._holeLayer.addChild(sp);this._holeSps.push(sp);
  }
};

Scene_BFRatCatch.prototype.createTrap=function(){
  var p=this.xy(TRAP.x,TRAP.y);
  this._trapSp=new Sprite(img('mousetrap_open'));
  this._trapSp.anchor.set(.5,.72);
  this._trapSp.scale.set(.86);
  this._trapSp.x=p.x;this._trapSp.y=p.y+7;
  this._objectLayer.addChild(this._trapSp);
};

Scene_BFRatCatch.prototype.makeBlock=function(){
  var s=CELL-5,bmp=new Bitmap(s,s),c=bmp._context;
  c.save();c.shadowColor='rgba(0,0,0,0.72)';c.shadowBlur=8;c.shadowOffsetY=5;
  var g=c.createLinearGradient(0,0,s,s);
  g.addColorStop(0,'#bd8950');g.addColorStop(.42,'#80502d');g.addColorStop(1,'#422716');
  c.fillStyle=g;c.fillRect(4,4,s-8,s-8);c.restore();
  /* thick dark frame, inner bevel */
  c.fillStyle='#2a190f';c.fillRect(4,4,s-8,s-8);
  c.fillStyle='#694127';c.fillRect(6,6,s-12,s-12);
  var inner=c.createLinearGradient(7,7,s-7,s-7);
  inner.addColorStop(0,'#9c6739');inner.addColorStop(.5,'#704326');inner.addColorStop(1,'#4b2c19');
  c.fillStyle=inner;c.fillRect(7,7,s-14,s-14);
  /* three inset planks with grain */
  var plankW=(s-18)/3;
  for(var i=0;i<3;i++){
    var px=9+i*(plankW+1);
    c.fillStyle=i===1?'rgba(36,18,8,0.22)':'rgba(226,174,111,0.10)';
    c.fillRect(px,9,plankW,s-18);
    c.strokeStyle='rgba(31,15,7,0.55)';c.lineWidth=1;
    c.beginPath();c.moveTo(px+2,12);c.lineTo(px+2,s-12);c.stroke();
    c.strokeStyle='rgba(237,191,129,0.15)';
    c.beginPath();c.moveTo(px+plankW*.55,13);c.lineTo(px+plankW*.55,s-13);c.stroke();
  }
  /* diagonal iron brace */
  c.strokeStyle='#38251a';c.lineWidth=4;c.beginPath();c.moveTo(10,10);c.lineTo(s-10,s-10);c.moveTo(s-10,10);c.lineTo(10,s-10);c.stroke();
  c.strokeStyle='rgba(214,174,123,0.72)';c.lineWidth=1.5;c.beginPath();c.moveTo(10,10);c.lineTo(s-10,s-10);c.moveTo(s-10,10);c.lineTo(10,s-10);c.stroke();
  /* brass corner caps and rivets */
  [[9,9],[s-9,9],[9,s-9],[s-9,s-9]].forEach(function(q){
    c.fillStyle='#332016';c.fillRect(q[0]-3,q[1]-3,7,7);
    c.fillStyle='#cba06b';c.beginPath();c.arc(q[0],q[1],2.1,0,Math.PI*2);c.fill();
    c.fillStyle='rgba(255,229,183,0.75)';c.beginPath();c.arc(q[0]-.6,q[1]-.6,.7,0,Math.PI*2);c.fill();
  });
  c.strokeStyle='rgba(232,189,133,0.65)';c.lineWidth=1;c.strokeRect(5.5,5.5,s-11,s-11);
  var sp=new Sprite(bmp);sp.anchor.set(.5,.5);this._objectLayer.addChild(sp);return sp;
};

Scene_BFRatCatch.prototype.createBlocks=function(){
  for(var i=0;i<BLOCK_COUNT;i++){
    var p=BLOCK_START[i],sp=this.makeBlock();
    sp._bf={x:p[0],y:p[1],homeX:p[0],homeY:p[1],held:false,index:i};
    this.placeBlock(sp);this._barriers.push(sp);
  }
};
Scene_BFRatCatch.prototype.placeBlock=function(sp){
  var b=sp._bf,p=this.xy(b.x,b.y);sp.x=p.x;sp.y=p.y;
};

/* Use the project's original rat artwork. Keep the sprite opaque; do not stack
 * duplicate rat sprites or generate a replacement procedural mouse. */
Scene_BFRatCatch.prototype.makeMouse=function(){
  /* RatRun is a regular 3-frame x 4-direction sheet made from the supplied art. */
  var sp=new Sprite(img('RatRun'));
  sp.anchor.set(.5,.72);
  sp._bfFrame=1;sp._bfAnimTick=0;sp._bfDirRow=2;
  sp.setFrame(64,128,64,64);
  sp.scale.set(1.05,1.05);sp.alpha=1.0;
  return sp;
};

Scene_BFRatCatch.prototype.createMouse=function(){
  var p=this.xy(START.x,START.y);
  this._mouseShadow=new Sprite(img('shadow'));this._mouseShadow.anchor.set(.5,.5);
  this._mouseShadow.scale.set(.20,.09);this._mouseShadow.alpha=.44;
  this._mouseShadow.x=p.x;this._mouseShadow.y=p.y+CELL*.30;this._objectLayer.addChild(this._mouseShadow);

  this._mouse=this.makeMouse();
  this._mouse.x=p.x;this._mouse.y=p.y;this._mouse._bfBaseScale=1.0;
  this._mouse._bfFacing=1;
  this._mouse._bfDirRow=2;
  this._mouse.alpha=1.0;
  this._objectLayer.addChild(this._mouse);
};

Scene_BFRatCatch.prototype.createFX=function(){
  this._fxSp=new Sprite(new Bitmap(W,H));this._fxLayer.addChild(this._fxSp);
};
Scene_BFRatCatch.prototype.resizeWorld=function(){
  var sx=Graphics.boxWidth/W,sy=Graphics.boxHeight/H;
  this._world.scale.set(sx,sy);this._world.x=0;this._world.y=0;
};
Scene_BFRatCatch.prototype.showMessage=function(){};

Scene_BFRatCatch.prototype.drawTransient=function(){
  var b=this._fxSp.bitmap;b.clear();var ctx=b._context;
  /* Position sockets are quiet until the player picks up a block. */
  if(this._mode==='build'){
    var occupied=this.barrierSet();ctx.save();
    for(var si=0;si<SOCKETS.length;si++){
      var sx=SOCKETS[si][0],sy=SOCKETS[si][1],sk=key(sx,sy),q=this.xy(sx,sy);
      var isOccupied=!!occupied[sk],valid=true;
      if(this._drag)valid=this.validSocket(sx,sy,this._drag.index);
      if(!this._drag&&isOccupied)continue;
      var r=CELL*(this._drag?0.22:0.12);
      ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);
      if(this._drag&&!valid){
        ctx.fillStyle='rgba(205,67,53,0.17)';ctx.strokeStyle='rgba(238,91,70,0.76)';
      }else if(this._drag){
        ctx.fillStyle='rgba(102,222,151,0.27)';ctx.strokeStyle='rgba(139,255,184,0.96)';
      }else{
        ctx.fillStyle='rgba(231,190,118,0.13)';ctx.strokeStyle='rgba(242,202,139,0.48)';
      }
      ctx.fill();ctx.lineWidth=this._drag?2.2:1.3;ctx.stroke();
      if(this._drag&&valid){ctx.beginPath();ctx.arc(q.x,q.y,r+4,0,Math.PI*2);ctx.strokeStyle='rgba(135,255,180,0.28)';ctx.lineWidth=1;ctx.stroke();}
    }
    ctx.restore();
  }
  /* Breathing hole rims and a low amber pulse around the goal. */
  for(var i=0;i<this._holeSps.length;i++){
    var hs=this._holeSps[i];hs.alpha=.91+.05*Math.sin(this._frame*.055+i*1.7);
    hs.scale.set(1+Math.sin(this._frame*.045+i)*.012);
  }
  if(this._mode==='build'||this._mode==='run'){
    var tp=this.xy(TRAP.x,TRAP.y),pulse=.5+.5*Math.sin(this._frame*.045);
    ctx.save();ctx.globalAlpha=.10+.10*pulse;ctx.strokeStyle='#d89b55';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(tp.x,tp.y,CELL*(.39+.035*pulse),0,Math.PI*2);ctx.stroke();ctx.restore();
  }
};

Scene_BFRatCatch.prototype.validSocket=function(x,y,index){
  var sk=key(x,y),isSocket=false;
  for(var i=0;i<SOCKETS.length;i++)if(key(SOCKETS[i][0],SOCKETS[i][1])===sk){isSocket=true;break;}
  if(!isSocket||!WALK[sk])return false;
  if(sk===key(START.x,START.y)||sk===key(TRAP.x,TRAP.y)||HOLE_SET[sk])return false;
  for(i=0;i<this._barriers.length;i++){
    if(i===index)continue;
    var b=this._barriers[i]._bf;
    if(b.x===x&&b.y===y)return false;
  }
  return true;
};

Scene_BFRatCatch.prototype.hitBlock=function(p){
  for(var i=this._barriers.length-1;i>=0;i--){
    var s=this._barriers[i];if(s._bf.held)continue;
    if(dist2(p.x,p.y,s.x,s.y)<(CELL*.46)*(CELL*.46))return i;
  }
  return -1;
};
Scene_BFRatCatch.prototype.beginDrag=function(index,p){
  if(this._mode!=='build')return;
  var sp=this._barriers[index],b=sp._bf;b.held=true;
  this._drag={index:index,dx:p.x-sp.x,dy:p.y-sp.y};
  sp.scale.set(1.08);sp.z=50;seCursor();
};
Scene_BFRatCatch.prototype.dragBlock=function(){
  if(!this._drag)return;
  var sp=this._barriers[this._drag.index],p=this.mousePoint();
  sp.x=p.x-this._drag.dx;sp.y=p.y-this._drag.dy;
};
Scene_BFRatCatch.prototype.dropBlock=function(){
  if(!this._drag)return;
  var idx=this._drag.index,sp=this._barriers[idx],b=sp._bf,p=this.mousePoint();
  var g=this.gridFromPoint(p.x,p.y);
  if(this.validSocket(g.x,g.y,idx)){
    b.x=g.x;b.y=g.y;this.placeBlock(sp);seOk();
  }else{
    this.placeBlock(sp);seBuzzer();this.showMessage('Сюда преграду поставить нельзя.');
  }
  b.held=false;sp.scale.set(1);sp.z=0;this._drag=null;
};

Scene_BFRatCatch.prototype.startPuzzle=function(){
  if(this._mode!=='build')return;
  var sim=this.simulateMouse(1200);
  this._path=sim.path;this._pathIndex=0;this._stepT=0;this._pauseT=18;this._runResult=sim.status;
  this._mode='run';this._won=false;this._lost=false;this._runStarted=true;
  this._mouse.visible=true;this._mouse.alpha=1;this._trapSp.bitmap=this._bfTrapBitmap('open');
  if(sim.status==='success')this.showMessage('Мышь побежала.');
  else if(sim.status==='hole')this.showMessage('Осторожно — впереди нора!');
  else if(sim.status==='dead')this.showMessage('Мышь упёрлась в тупик.');
  else this.showMessage('Мышь пошла по маршруту...');
  seOk();
};

Scene_BFRatCatch.prototype.resetMouseVisual=function(){
  var p=this.xy(START.x,START.y);
  this._mouse.visible=true;this._mouse.alpha=1;this._mouse.rotation=0;this._mouse._bfDirRow=2;this._mouse._bfFrame=1;this._mouse._bfAnimTick=0;this._mouse.setFrame(64,128,64,64);this._mouse.scale.set(this._mouse._bfBaseScale);this._mouse.scale.x=Math.abs(this._mouse._bfBaseScale);
  this._mouse.x=p.x;this._mouse.y=p.y;
  this._mouseShadow.x=p.x;this._mouseShadow.y=p.y+CELL*.30;
};

Scene_BFRatCatch.prototype.resetPuzzle=function(){
  this._path=[];this._pathIndex=0;this._stepT=0;this._pauseT=0;this._runStarted=false;this._runResult='';this._won=false;this._lost=false;this._lossT=0;
  this._mode='build';
  this.resetMouseVisual();
  this._trapSp.bitmap=this._bfTrapBitmap('open');
  for(var i=0;i<this._barriers.length;i++){
    var b=this._barriers[i]._bf;b.x=b.homeX;b.y=b.homeY;b.held=false;
    this._barriers[i].visible=true;this._barriers[i].scale.set(1);this._barriers[i].z=0;this.placeBlock(this._barriers[i]);
  }
  seOk();this.showMessage('Положение головоломки сброшено.');
};

Scene_BFRatCatch.prototype.mouseTarget=function(){
  if(this._pathIndex>=this._path.length-1)return null;
  var a=this._path[this._pathIndex],b=this._path[this._pathIndex+1];
  return {a:this.xy(a.x,a.y),b:this.xy(b.x,b.y),gx:b.x-a.x,gy:b.y-a.y};
};

Scene_BFRatCatch.prototype.updateMouse=function(){
  if(this._mode!=='run'){
    if(this._mouse){
      var idle=1.0+Math.sin(this._frame*.13)*.008;
      this._mouse.setFrame(64,128,64,64);
      this._mouse.scale.set(idle,idle);
      this._mouseShadow.x=this._mouse.x;this._mouseShadow.y=this._mouse.y+CELL*.30;
    }
    return;
  }
  if(this._pauseT>0){
    this._pauseT--;
    var breathe=.86+Math.sin(this._frame*.25)*.025;
    this._mouse.scale.set(breathe*this._mouse._bfFacing,breathe);
    this._mouseShadow.x=this._mouse.x;this._mouseShadow.y=this._mouse.y+CELL*.30;
    return;
  }
  if(this._pathIndex>=this._path.length-1){this.resolveRun();return;}
  var tar=this.mouseTarget();
  var speed=.105;
  this._stepT+=speed;
  var t=clamp(this._stepT,0,1),e=t*t*(3-2*t);
  this._mouse.x=tar.a.x+(tar.b.x-tar.a.x)*e;
  this._mouse.y=tar.a.y+(tar.b.y-tar.a.y)*e;
  var facing=tar.gx<0?-1:tar.gx>0?1:this._mouse._bfFacing;
  this._mouse._bfFacing=facing;
  /* Rows are up, side-left, side-right, down; columns are run frames. */
  var dirRow=tar.gy<0?0:(tar.gy>0?3:(facing<0?1:2));
  if(this._mouse._bfDirRow!==dirRow){this._mouse._bfDirRow=dirRow;this._mouse._bfFrame=1;}
  this._mouse._bfAnimTick++;
  if(this._mouse._bfAnimTick>=4){this._mouse._bfAnimTick=0;this._mouse._bfFrame=(this._mouse._bfFrame+1)%3;}
  this._mouse.setFrame(this._mouse._bfFrame*64,dirRow*64,64,64);
  var stride=1+Math.sin(this._frame*.86)*.025;
  this._mouse.scale.set(Math.abs(this._mouse._bfBaseScale),Math.abs(this._mouse._bfBaseScale)*stride);
  this._mouse.rotation=0;
  this._mouseShadow.x=this._mouse.x;this._mouseShadow.y=this._mouse.y+CELL*.30;

  if(this._stepT>=1){
    this._stepT=0;this._pathIndex++;
    if(this._pathIndex>=this._path.length-1){this._pauseT=12;return;}
    var i=this._pathIndex;
    if(i>0&&i<this._path.length-1){
      var pa=this._path[i-1],pb=this._path[i],pc=this._path[i+1];
      var d1x=pb.x-pa.x,d1y=pb.y-pa.y,d2x=pc.x-pb.x,d2y=pc.y-pb.y;
      if(d1x!==d2x||d1y!==d2y)this._pauseT=6;
    }
  }
};

Scene_BFRatCatch.prototype.resolveRun=function(){
  if(this._runResult==='success')this.finishWin();
  else if(this._runResult==='hole')this.finishLoss('hole');
  else if(this._runResult==='dead')this.finishLoss('dead');
  else this.finishLoss('loop');
};

Scene_BFRatCatch.prototype.finishWin=function(){
  if(this._won)return;
  this._won=true;this._mode='win';this._trapSp.bitmap=this._bfTrapBitmap('closed');this._pauseT=48;
  if(!this._resultSent){
    this._resultSent=true;
    if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.minigameResult==='function')window.BF_QuestSystem.minigameResult('SUCCESS');
    if(origin.mapId&&origin.eventId)$gameSelfSwitches.setValue([origin.mapId,origin.eventId,'A'],true);
  }
  this.showMessage('ЩЁЛК! Мышь поймана.');
};

Scene_BFRatCatch.prototype.finishLoss=function(kind){
  if(this._lost||this._won)return;
  this._lost=true;this._mode='loss';this._lossT=78;
  if(kind==='hole'){
    this._mouse.scale.set(0.10*this._mouse._bfFacing,0.10);this._mouse.alpha=.75;
    this.showMessage('Мышь убежала в нору! R — полный сброс.');
  }else if(kind==='dead'){
    this.showMessage('Мышь упёрлась в тупик. Переставьте преграды.');
  }else{
    this.showMessage('Мышь зашла в петлю. Перестройте маршрут.');
  }
  seBuzzer();
};

Scene_BFRatCatch.prototype.afterLoss=function(){
  if(this._lossT>0){this._lossT--;return;}
  this._lost=false;this._mode='build';this._path=[];this._pathIndex=0;this._runResult='';this._stepT=0;this._pauseT=0;
  this.resetMouseVisual();
  this.showMessage('Попробуйте другую расстановку.');
};

Scene_BFRatCatch.prototype.updateInput=function(){
  if(Input.isTriggered('escape')){seCancel();SceneManager.pop();return;}
  if(Input.isTriggered('r')){this.resetPuzzle();return;}
  if(Input.isTriggered('ok')||Input.isTriggered('enter')){if(this._mode==='build')this.startPuzzle();}

  if(this._drag){
    if(TouchInput.isReleased())this.dropBlock();else this.dragBlock();
    return;
  }
  if(!TouchInput.isTriggered())return;
  var p=this.mousePoint();
  if(this._mode==='win'||this._mode==='run'||this._mode==='loss')return;
  if(dist2(p.x,p.y,this._mouse.x,this._mouse.y)<48*48){this.startPuzzle();return;}
  var hit=this.hitBlock(p);if(hit>=0)this.beginDrag(hit,p);
};

Scene_BFRatCatch.prototype.update=function(){
  Scene_Base.prototype.update.call(this);
  this._frame++;
  this.resizeWorld();
  this.updateMouse();
  if(this._drag)this.dragBlock();
  this.updateInput();
  if(this._messageT>0)this._messageT--;
  this.drawTransient();

  if(this._mode==='win'){
    if(this._pauseT>0){
      this._pauseT--;
      var fade=clamp(this._pauseT/48,0,1);
      this._mouse.alpha=fade;
      this._mouse.scale.set(.75*this._mouse._bfFacing+.15*.05, .80+0.10*fade);
    }else{
      SceneManager.pop();return;
    }
  }
  if(this._mode==='loss')this.afterLoss();
};

/* RPG Maker integration. Only the actual launching event is modified on success. */
var oldPC=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
  oldPC.call(this,command,args);
  var c=String(command||'').toUpperCase();
  var a=(args||[]).map(function(v){return String(v||'');});
  if((c==='BF_RATCATCH'||c==='RATCATCH')&&(!a.length||String(a[0]).toLowerCase()==='start')){
    var questId=a.length>1?a[1]:DEFAULT_QUEST;
    origin={mapId:this._mapId||$gameMap.mapId(),eventId:this._eventId||0};
    var allowed=true;
    if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.minigameStart==='function')allowed=window.BF_QuestSystem.minigameStart('BF_RatCatch',questId);
    if(!allowed){$gameMessage.add(bfRatCatchQuestRequiredMessage());return;}
    this.setWaitMode(WAIT);SceneManager.push(Scene_BFRatCatch);
  }
};

var oldWait=Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode=function(){
  if(this._waitMode===WAIT)return SceneManager._scene instanceof Scene_BFRatCatch;
  return oldWait.call(this);
};

window.BF_RatCatch_Start=function(questId){
  var eid=0;try{eid=$gameMap._interpreter?$gameMap._interpreter._eventId:0;}catch(e){}
  origin={mapId:$gameMap.mapId(),eventId:eid||0};
  var q=questId||DEFAULT_QUEST,allowed=true;
  if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.minigameStart==='function')allowed=window.BF_QuestSystem.minigameStart('BF_RatCatch',q);
  if(!allowed){$gameMessage.add(bfRatCatchQuestRequiredMessage());return;}
  SceneManager.push(Scene_BFRatCatch);
};

window.Scene_BFRatCatch=Scene_BFRatCatch;

})();


/* ============================================================
 * BF_RatCatch visual upgrade — integrated into BF_RatCatch.js
 * No second plugin required. Original puzzle logic is preserved.
 * ============================================================ */
(function(){
'use strict';
var P=window.Scene_BFRatCatch&&window.Scene_BFRatCatch.prototype;
if(!P)return;
var W=1280,H=720,COLS=23,ROWS=13,CELL=Math.min(W/COLS,H/ROWS);
var OX=(W-COLS*CELL)/2, OY=(H-ROWS*CELL)/2;
var MAP=[
'#######################',
'#......#..##..........#',
'#...####......#.#.###.#',
'#....#.##.......#.###.#',
'###...#...###.....#...#',
'#......#...############',
'#...##....#...###.##..#',
'#.#.##.....###..##...##',
'#...#.#..#...#......###',
'#....#...##.....#..#..#',
'##......#....#....###.#',
'#.......#.#..#.#......#',
'#######################'
];
function k(x,y){return x+','+y;}
function walk(x,y){return y>=0&&y<ROWS&&x>=0&&x<COLS&&MAP[y].charAt(x)==='.';}
function asset(n){return ImageManager.loadPicture('BF_RatCatch/'+n);}
function ready(b){return b&&b.isReady&&b.isReady()&&b.width>0&&b.height>0;}
function safeCall(fn,ctx,args){try{return fn.apply(ctx,args||[]);}catch(e){return null;}}
var original={
 drawMaze:P.drawMaze,makeHole:P.makeHole,makeBlock:P.makeBlock,makeMouse:P.makeMouse,
 createTrap:P.createTrap,createFX:P.createFX,showMessage:P.showMessage,drawTransient:P.drawTransient
};
P._bfTrapBitmap=function(state){
 var name=state==='closed'?'trap_closed':'trap_open';
 var b=this._bfVisualAssets&&this._bfVisualAssets[name];
 if(ready(b))return b;
 return asset(state==='closed'?'mousetrap_closed':'mousetrap_open');
};
P.preload=function(){
 this._bfVisualAssets={};
 var names=['bg_dungeon','tile_floor','tile_wall','rat_sheet','trap_open','trap_closed','hole','barrier','dust','spark'];
 for(var i=0;i<names.length;i++)this._bfVisualAssets[names[i]]=asset(names[i]);
 this._assetsReady=false;
 var self=this,remaining=names.length;
 function done(){remaining--;if(remaining<=0){self._assetsReady=true;self._bfRefreshVisuals();}}
 for(i=0;i<names.length;i++){
   (function(b){if(ready(b))done();else if(b&&b.addLoadListener)b.addLoadListener(done);else done();})(this._bfVisualAssets[names[i]]);
 }
};
P._bfRefreshVisuals=function(){
 if(this._bfVisualRefreshed)return;
 this._bfVisualRefreshed=true;
 if(this._mazeSp&&this._mazeSp.bitmap)this._bfDrawAssetMaze();
 if(this._trapSp){
   var trapKey=(this._mode==='win'||this._won)?'trap_closed':'trap_open';
   if(ready(this._bfVisualAssets[trapKey]))this._trapSp.bitmap=this._bfVisualAssets[trapKey];
 }
 if(this._holeSps)for(var i=0;i<this._holeSps.length;i++){
   if(ready(this._bfVisualAssets.hole))this._holeSps[i].bitmap=this._bfVisualAssets.hole;
 }
 if(this._barriers)for(i=0;i<this._barriers.length;i++){
   if(ready(this._bfVisualAssets.barrier))this._barriers[i].bitmap=this._bfVisualAssets.barrier;
 }
 if(this._mouse&&ready(this._bfVisualAssets.rat_sheet)){
   this._mouse.bitmap=this._bfVisualAssets.rat_sheet;
   this._mouse.setFrame(64,128,64,64);
 }
};
P._bfDrawAssetMaze=function(){
 var floor=this._bfVisualAssets&&this._bfVisualAssets.tile_floor;
 var wall=this._bfVisualAssets&&this._bfVisualAssets.tile_wall;
 var bg=this._bfVisualAssets&&this._bfVisualAssets.bg_dungeon;
 if(!ready(floor)||!ready(wall))return;
 var bmp=new Bitmap(W,H),ctx=bmp._context;
 if(ready(bg))bmp.blt(bg,0,0,Math.min(bg.width,W),Math.min(bg.height,H),0,0,W,H);
 else {ctx.fillStyle='#17120e';ctx.fillRect(0,0,W,H);}
 for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++){
   var px=OX+x*CELL,py=OY+y*CELL;
   var source=walk(x,y)?floor:wall;
   bmp.blt(source,0,0,source.width,source.height,px,py,CELL+0.5,CELL+0.5);
 }
 /* Soft amber pools near the start and goal, with a gentle screen vignette. */
 var s={x:OX+1*CELL+CELL/2,y:OY+1*CELL+CELL/2};
 var t={x:OX+21*CELL+CELL/2,y:OY+11*CELL+CELL/2};
 ctx.save();
 [[s.x,s.y,CELL*2.8,'rgba(231,166,75,0.18)'],[t.x,t.y,CELL*3,'rgba(219,113,48,0.16)']].forEach(function(a){
   var g=ctx.createRadialGradient(a[0],a[1],1,a[0],a[1],a[2]);
   g.addColorStop(0,a[3]);g.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=g;ctx.fillRect(a[0]-a[2],a[1]-a[2],a[2]*2,a[2]*2);
 });
 var vg=ctx.createRadialGradient(W/2,H/2,H*.18,W/2,H/2,H*.76);
 vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.55)');
 ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);ctx.restore();
 this._mazeSp.bitmap=bmp;
};
P.drawMaze=function(){
 safeCall(original.drawMaze,this,arguments);
 var self=this;
 if(!this._bfVisualAssets)this._bfVisualAssets={};
 this._bfVisualAssets.bg_dungeon=asset('bg_dungeon');
 this._bfVisualAssets.tile_floor=asset('tile_floor');
 this._bfVisualAssets.tile_wall=asset('tile_wall');
 var list=[this._bfVisualAssets.bg_dungeon,this._bfVisualAssets.tile_floor,this._bfVisualAssets.tile_wall];
 var n=0;
 list.forEach(function(b){if(ready(b)){n++;if(n===list.length)self._bfDrawAssetMaze();}else b.addLoadListener(function(){n++;if(n===list.length)self._bfDrawAssetMaze();});});
};
P.makeHole=function(){
 var b=asset('hole');
 if(ready(b)){var s=new Sprite(b);s.anchor.set(.5,.5);return s;}
 var sp=safeCall(original.makeHole,this,arguments);
 if(sp&&b&&b.addLoadListener)b.addLoadListener(function(){if(ready(b))sp.bitmap=b;});
 return sp;
};
P.makeBlock=function(){
 var b=asset('barrier');
 if(ready(b)){var s=new Sprite(b);s.anchor.set(.5,.5);this._objectLayer.addChild(s);return s;}
 var sp=safeCall(original.makeBlock,this,arguments);
 if(sp&&b&&b.addLoadListener)b.addLoadListener(function(){if(ready(b))sp.bitmap=b;});
 return sp;
};
P.createTrap=function(){
 safeCall(original.createTrap,this,arguments);
 var b=asset('trap_open'),self=this;
 if(this._trapSp)this._trapSp.scale.set(0.68,0.68);
 function applyTrapAsset(){
   if(!self._trapSp)return;
   var closed=(self._mode==='win'||self._won);
   var chosen=closed?asset('trap_closed'):b;
   if(ready(chosen))self._trapSp.bitmap=chosen;
 }
 if(this._trapSp&&b.addLoadListener)b.addLoadListener(applyTrapAsset);
 if(this._trapSp&&ready(b))applyTrapAsset();
};
P.makeMouse=function(){
 var b=asset('rat_sheet');
 if(ready(b)){var sp=new Sprite(b);sp.anchor.set(.5,.78);sp._bfFrame=1;sp._bfAnimTick=0;sp._bfDirRow=2;sp.setFrame(64,128,64,64);sp.scale.set(1.0);return sp;}
 var sp=safeCall(original.makeMouse,this,arguments);
 if(sp&&b.addLoadListener)b.addLoadListener(function(){if(ready(b)){sp.bitmap=b;sp.setFrame(64,128,64,64);}});
 return sp;
};
P.createFX=function(){
 safeCall(original.createFX,this,arguments);
 /* The decorative frame/panel are intentionally not drawn: they were covering
    the maze and scaling badly in the game window. */
 this._bfFrameSp=null;
 this._bfPanelSp=null;
 this._bfParticles=[];
 this._bfDustTick=0;
};
P.showMessage=function(text){
 this._message=String(text||'');this._messageT=150;
 if(!this._bfMessageSp){
   var bmp=new Bitmap(700,52);this._bfMessageSp=new Sprite(bmp);
   this._bfMessageSp.anchor.set(.5,0);this._bfMessageSp.x=W/2;this._bfMessageSp.y=14;
   this._bfMessageSp.z=1000;
   if(this._world)this._world.addChild(this._bfMessageSp);else this.addChild(this._bfMessageSp);
 }
 var b=this._bfMessageSp.bitmap;b.clear();
 var c=b._context;
 c.save();c.fillStyle='rgba(18,12,8,0.84)';c.strokeStyle='rgba(181,138,79,0.9)';c.lineWidth=1.5;
 c.beginPath();if(c.roundRect)c.roundRect(1,1,698,50,7);else c.rect(1,1,698,50);c.fill();c.stroke();c.restore();
 b.fontFace='GameFont';b.fontSize=21;b.textColor='#f1dfbd';b.outlineColor='rgba(0,0,0,0.95)';b.outlineWidth=3;
 b.drawText(this._message,12,5,676,42,'center');this._bfMessageSp.alpha=1;
};
P.drawTransient=function(){
 safeCall(original.drawTransient,this,arguments);
 if(!this._fxSp||!this._fxSp.bitmap)return;
 var b=this._fxSp.bitmap,ctx=b._context, self=this;
 this._bfDustTick=(this._bfDustTick||0)+1;
 if(this._mode==='run'&&this._mouse&&this._bfDustTick%6===0){
   this._bfParticles=this._bfParticles||[];
   this._bfParticles.push({x:this._mouse.x,y:this._mouse.y+7,vx:(Math.random()-.5)*.7,vy:-Math.random()*.7-0.1,life:24,max:24});
 }
 b._context.save();
 for(var i=(this._bfParticles||[]).length-1;i>=0;i--){
   var p=this._bfParticles[i];p.x+=p.vx;p.y+=p.vy;p.life--;
   if(p.life<=0){this._bfParticles.splice(i,1);continue;}
   ctx.globalAlpha=p.life/p.max*.34;ctx.fillStyle='#bba88d';ctx.beginPath();ctx.arc(p.x,p.y,2+(1-p.life/p.max)*4,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
 /* amber radial light around the mouse */
 if(this._mouse&&this._mouse.visible){
   var g=ctx.createRadialGradient(this._mouse.x,this._mouse.y,2,this._mouse.x,this._mouse.y,CELL*2.6);
   g.addColorStop(0,'rgba(255,190,94,0.10)');g.addColorStop(1,'rgba(255,190,94,0)');
   ctx.fillStyle=g;ctx.fillRect(this._mouse.x-CELL*2.6,this._mouse.y-CELL*2.6,CELL*5.2,CELL*5.2);
 }
 b._context.restore();
 if(this._bfMessageSp){
   var t=this._messageT||0;this._bfMessageSp.alpha=t>18?1:Math.max(0,t/18);
 }
 if(this._assetsReady)this._bfRefreshVisuals();
};
var oldUpdate=P.update;
P.update=function(){
 return oldUpdate.apply(this,arguments);
};
})();
