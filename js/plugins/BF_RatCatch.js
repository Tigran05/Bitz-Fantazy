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
 *   S — show valid barrier sockets
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

/*
 * 23x13 hand-designed maze. The visible walls and the logical walkability
 * use the same MAP, so the player always sees the same geometry the mouse uses.
 */
var MAP=[
  '#######################',
  '#...#.........#.......#',
  '##..#####.###.#.#.#####',
  '#...#.....#...#.#.#...#',
  '#..##.#####.###...#.#.#',
  '#...#.#.#...#...#...#.#',
  '###...#.#.########.##.#',
  '#...#.#...............#',
  '#.###.#.#####.#######.#',
  '#.....#.#.....#...#...#',
  '##.#.##...#.###.###.###',
  '#.........#...........#',
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
  [2,1],[9,1],[17,1],[3,2],[2,3],[1,4],[15,4],[17,4],[18,5],
  [3,6],[7,7],[9,7],[13,7],[18,7],[2,9],[11,9],[7,10],[15,11]
];

/* Initial position. This intentionally drives the mouse into the first hole. */
var BLOCK_START=[
  [17,1],[3,2],[1,4],[18,5],[3,6],
  [13,7],[18,7],[11,9],[7,10],[15,11]
];

/* Unique safe configuration found for this exact maze/rule set. It is not
 * revealed to the player; it exists here only as the hand-authored solution. */
var BLOCK_SOLUTION=[
  [1,4],[2,9],[7,7],[7,10],[11,9],
  [15,4],[15,11],[17,1],[17,4],[18,5]
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
  this._hintT=0;
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
  ['rat_1','mousetrap_open','mousetrap_closed','shadow'].forEach(img);
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
  c.save();
  c.fillStyle='#171412';c.fillRect(0,0,W,H);
  c.fillStyle='#242321';c.fillRect(OX,OY,COLS*CELL,ROWS*CELL);
  /* Slight floor variation without a visible debug grid. */
  for(var y=0;y<ROWS;y++){
    for(var x=0;x<COLS;x++){
      if(!WALK[key(x,y)])continue;
      var px=OX+x*CELL,py=OY+y*CELL;
      c.fillStyle=((x+y)%2===0)?'rgba(255,255,255,0.018)':'rgba(0,0,0,0.018)';
      c.fillRect(px,py,CELL,CELL);
    }
  }
  c.restore();

  for(y=0;y<ROWS;y++){
    for(x=0;x<COLS;x++){
      if(!WALK[key(x,y)])continue;
      var rx=OX+x*CELL,ry=OY+y*CELL;
      var edges=[!WALK[key(x,y-1)],!WALK[key(x+1,y)],!WALK[key(x,y+1)],!WALK[key(x-1,y)]];
      for(var e=0;e<4;e++){
        if(!edges[e])continue;
        var x1,y1,x2,y2;
        if(e===0){x1=rx;y1=ry;x2=rx+CELL;y2=ry;}
        if(e===1){x1=rx+CELL;y1=ry;x2=rx+CELL;y2=ry+CELL;}
        if(e===2){x1=rx;y1=ry+CELL;x2=rx+CELL;y2=ry+CELL;}
        if(e===3){x1=rx;y1=ry;x2=rx;y2=ry+CELL;}
        c.save();
        c.strokeStyle='rgba(0,0,0,0.96)';
        c.lineWidth=Math.max(10,CELL*.24);
        c.lineCap='square';
        c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
        c.strokeStyle='rgba(129,110,87,0.68)';
        c.lineWidth=3;
        c.beginPath();c.moveTo(x1,y1+1);c.lineTo(x2,y2+1);c.stroke();
        c.strokeStyle='rgba(235,205,165,0.10)';
        c.lineWidth=1;
        c.beginPath();c.moveTo(x1,y1-2);c.lineTo(x2,y2-2);c.stroke();
        c.restore();
      }
    }
  }

  var sp=this.xy(START.x,START.y),tp=this.xy(TRAP.x,TRAP.y);
  c.save();
  c.fillStyle='rgba(245,205,128,0.08)';c.beginPath();c.arc(sp.x,sp.y,CELL*.33,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(211,69,48,0.08)';c.beginPath();c.arc(tp.x,tp.y,CELL*.33,0,Math.PI*2);c.fill();
  c.restore();

  this._mazeSp=new Sprite(bmp);
  this._mazeLayer.addChild(this._mazeSp);
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
  this._trapSp.scale.set(.78);
  this._trapSp.x=p.x;this._trapSp.y=p.y+7;
  this._objectLayer.addChild(this._trapSp);
};

Scene_BFRatCatch.prototype.makeBlock=function(){
  var s=CELL-8,bmp=new Bitmap(s,s),c=bmp._context;
  c.save();
  c.shadowColor='rgba(0,0,0,0.55)';c.shadowBlur=10;c.shadowOffsetY=6;
  var g=c.createLinearGradient(0,0,s,s);
  g.addColorStop(0,'#a56b3a');g.addColorStop(.48,'#774625');g.addColorStop(1,'#422411');
  c.fillStyle=g;c.fillRect(5,5,s-10,s-10);c.restore();
  c.save();
  c.strokeStyle='rgba(26,12,5,0.96)';c.lineWidth=3;c.strokeRect(5,5,s-10,s-10);
  c.strokeStyle='rgba(236,180,111,0.30)';c.lineWidth=2;
  c.beginPath();c.moveTo(12,12);c.lineTo(s-12,s-13);c.stroke();
  c.beginPath();c.moveTo(s-12,12);c.lineTo(12,s-13);c.stroke();
  c.fillStyle='#d9c09a';
  [[12,12],[s-12,12],[12,s-12],[s-12,s-12]].forEach(function(q){c.beginPath();c.arc(q[0],q[1],3,0,Math.PI*2);c.fill();});
  c.restore();
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
  var sp=new Sprite(img('rat_1'));
  sp.anchor.set(.5,.94);
  sp.scale.set(1.0,1.0);
  sp.alpha=1.0;
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
Scene_BFRatCatch.prototype.showMessage=function(t){this._message=t;this._messageT=130;};

Scene_BFRatCatch.prototype.drawTransient=function(){
  var b=this._fxSp.bitmap,c=b._context;b.clear();
  if(this._messageT>0&&this._message){
    var a=Math.min(1,this._messageT/24);
    c.save();c.globalAlpha=a*.92;
    c.fillStyle='rgba(5,5,5,0.73)';
    c.fillRect(235,H-48,810,34);
    c.fillStyle='#fff1da';c.font='18px Arial';c.textAlign='center';c.textBaseline='middle';
    c.fillText(this._message,W/2,H-31);c.restore();
  }
  if(this._hintT>0){
    var occupied=this.barrierSet();
    c.save();c.globalAlpha=clamp(this._hintT/36,0,1)*.80;
    for(var i=0;i<SOCKETS.length;i++){
      var q=this.xy(SOCKETS[i][0],SOCKETS[i][1]);
      var occ=!!occupied[key(SOCKETS[i][0],SOCKETS[i][1])];
      c.strokeStyle=occ?'rgba(210,80,58,.72)':'rgba(246,211,135,.84)';
      c.lineWidth=2.5;c.setLineDash([7,6]);
      c.strokeRect(q.x-CELL/2+5,q.y-CELL/2+5,CELL-10,CELL-10);
    }
    c.restore();
  }
  /* Tiny animated warning pulse around holes. */
  for(i=0;i<this._holeSps.length;i++){
    var hs=this._holeSps[i];
    hs.alpha=.90+.06*Math.sin(this._frame*.07+i*1.7);
    hs.scale.set(1+Math.sin(this._frame*.06+i)*.015);
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
  sp.scale.set(1.08);sp.z=50;this._hintT=170;seCursor();
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
  b.held=false;sp.scale.set(1);sp.z=0;this._drag=null;this._hintT=0;
};

Scene_BFRatCatch.prototype.startPuzzle=function(){
  if(this._mode!=='build')return;
  var sim=this.simulateMouse(1200);
  this._path=sim.path;this._pathIndex=0;this._stepT=0;this._pauseT=18;this._runResult=sim.status;
  this._mode='run';this._won=false;this._lost=false;this._runStarted=true;
  this._mouse.visible=true;this._mouse.alpha=1;this._trapSp.bitmap=img('mousetrap_open');
  if(sim.status==='success')this.showMessage('Мышь побежала.');
  else if(sim.status==='hole')this.showMessage('Осторожно — впереди нора!');
  else if(sim.status==='dead')this.showMessage('Мышь упёрлась в тупик.');
  else this.showMessage('Мышь пошла по маршруту...');
  seOk();
};

Scene_BFRatCatch.prototype.resetMouseVisual=function(){
  var p=this.xy(START.x,START.y);
  this._mouse.visible=true;this._mouse.alpha=1;this._mouse.rotation=0;this._mouse.scale.set(this._mouse._bfBaseScale);this._mouse.scale.x=this._mouse._bfBaseScale;
  this._mouse.x=p.x;this._mouse.y=p.y;
  this._mouseShadow.x=p.x;this._mouseShadow.y=p.y+CELL*.30;
};

Scene_BFRatCatch.prototype.resetPuzzle=function(){
  this._path=[];this._pathIndex=0;this._stepT=0;this._pauseT=0;this._runStarted=false;this._runResult='';this._won=false;this._lost=false;this._lossT=0;
  this._mode='build';
  this.resetMouseVisual();
  this._trapSp.bitmap=img('mousetrap_open');
  for(var i=0;i<this._barriers.length;i++){
    var b=this._barriers[i]._bf;b.x=b.homeX;b.y=b.homeY;b.held=false;
    this._barriers[i].visible=true;this._barriers[i].scale.set(1);this._barriers[i].z=0;this.placeBlock(this._barriers[i]);
  }
  seOk();this.showMessage('Положение головоломки сброшено.');
};

Scene_BFRatCatch.prototype.hint=function(){
  if(this._mode!=='build')return;
  this._hintT=180;
  this.showMessage('Избегайте нор и перекрывайте ложные маршруты. Принцип движения мыши всегда одинаков.');
  seCursor();
};

Scene_BFRatCatch.prototype.mouseTarget=function(){
  if(this._pathIndex>=this._path.length-1)return null;
  var a=this._path[this._pathIndex],b=this._path[this._pathIndex+1];
  return {a:this.xy(a.x,a.y),b:this.xy(b.x,b.y),gx:b.x-a.x,gy:b.y-a.y};
};

Scene_BFRatCatch.prototype.updateMouse=function(){
  if(this._mode!=='run'){
    if(this._mouse){
      var idle=.86+Math.sin(this._frame*.13)*.014;
      this._mouse.scale.set(idle*this._mouse._bfFacing,idle);
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
  var stride=1+Math.sin(this._frame*.86)*.055;
  this._mouse.scale.set(Math.abs(this._mouse._bfBaseScale)*facing,Math.abs(this._mouse._bfBaseScale)*stride);
  this._mouse.rotation=Math.sin(this._frame*.22)*.028;
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
  this._won=true;this._mode='win';this._trapSp.bitmap=img('mousetrap_closed');this._pauseT=48;
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
  if(Input.isTriggered('s')){this.hint();return;}
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
  if(this._hintT>0)this._hintT--;
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
    if(!allowed){$gameMessage.add('Сначала получите задание для этой мини-игры.');return;}
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
  if(!allowed){$gameMessage.add('Сначала получите задание для этой мини-игры.');return;}
  SceneManager.push(Scene_BFRatCatch);
};

window.Scene_BFRatCatch=Scene_BFRatCatch;

})();
