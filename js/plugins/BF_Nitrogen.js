/*:
 * @plugindesc Bitz Fantasy — mobile-first cryogenic pipe puzzle, three reservoirs.
 * @author ASTROLIT
 * @help Plugin command: Nitrogen start
 * Tap any installed pipe to rotate it 90 degrees. Copper pipe artwork is stored in img/pictures/BF_Nitrogen_Assets/. Connect nitrogen to all three tanks.
 * Enter/Space starts flow; F resets; Esc exits. Preserves engineer quest/reward integration.
 */
(function(){'use strict';
var ORIGIN={mapId:0,eventId:0},W=1280,H=720,CELL=84,OX=130,OY=95,COLS=8,ROWS=6;
var RU={title:'КРИОУСТАНОВКА',subtitle:'СОЕДИНИТЕ ИСТОЧНИК АЗОТА СО ВСЕМИ ТРЕМЯ РЕЗЕРВУАРАМИ',time:'ВРЕМЯ',pressure:'ДАВЛЕНИЕ',temperature:'ТЕМПЕРАТУРА',status:'СОСТОЯНИЕ СИСТЕМЫ',standby:'ПОВЕРНИТЕ ТРУБЫ',ready:'СХЕМА ГОТОВА К ПРОВЕРКЕ',flowing:'АЗОТ ПОСТУПАЕТ',success:'ВСЕ РЕЗЕРВУАРЫ ЗАПОЛНЕНЫ',success2:'Криоустановка работает. Азот получен.',failed:'ВРЕМЯ ВЫШЛО',failed2:'Сбросьте схему и попробуйте снова.',start:'ПУСК',reset:'СБРОС',exit:'НАЖМИТЕ / КОСНИТЕСЬ, ЧТОБЫ ПРОДОЛЖИТЬ',hint:'КОСНИТЕСЬ ТРУБЫ, ЧТОБЫ ПОВЕРНУТЬ',incomplete:'ПОТОК НЕ ДОХОДИТ ДО ВСЕХ РЕЗЕРВУАРОВ',mismatch:'ПРОВЕРЬТЕ СОЕДИНЕНИЯ ТРУБ',closed:'КЛАПАН ЗАКРЫТ',deadend:'ТРУБОПРОВОД ОБРЫВАЕТСЯ',leak:'ПРОРЫВ ТРУБЫ! АЗОТ УТЕКАЕТ',leakFail:'УТЕЧКА! СОЕДИНИТЕ ТРУБЫ И ПОВТОРИТЕ ПУСК'},
EN={title:'CRYOGENIC UNIT',subtitle:'CONNECT THE NITROGEN SOURCE TO ALL THREE RESERVOIRS',time:'TIME',pressure:'PRESSURE',temperature:'TEMPERATURE',status:'SYSTEM STATUS',standby:'ROTATE THE PIPES',ready:'READY TO TEST',flowing:'NITROGEN FLOWING',success:'ALL RESERVOIRS FILLED',success2:'Cryogenic unit operational. Nitrogen acquired.',failed:'TIME EXPIRED',failed2:'Reset the board and try again.',start:'START',reset:'RESET',exit:'TAP / PRESS TO CONTINUE',hint:'TAP A PIPE TO ROTATE IT',incomplete:'FLOW DOES NOT REACH ALL RESERVOIRS',mismatch:'CHECK PIPE CONNECTIONS',closed:'VALVE CLOSED',deadend:'PIPELINE ENDS ABRUPTLY',leak:'PIPE RUPTURE! NITROGEN LEAKING',leakFail:'LEAK DETECTED! REPAIR THE CONNECTIONS AND RESTART'};
function tr(k){return(window.ConfigManager&&ConfigManager.bfLanguage==='en'?EN:RU)[k]||k;}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function round(c,x,y,w,h,r,fill,stroke,lw){c.save();c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||1;c.stroke();}c.restore();}
function txt(c,s,x,y,size,col,align,weight){c.save();c.font=(weight||700)+' '+size+'px Arial,sans-serif';c.fillStyle=col||'#f4e6c8';c.textAlign=align||'left';c.textBaseline='top';c.shadowColor='rgba(0,0,0,.8)';c.shadowBlur=2;c.fillText(String(s),x,y);c.restore();}
function ln(c,x,y,X,Y,col,w){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=col;c.lineWidth=w||2;c.lineCap='round';c.stroke();c.restore();}function circ(c,x,y,r,fill,stroke,w){c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w||1;c.stroke();}c.restore();}
function key(x,y){return x+','+y;}function opp(d){return(d+2)%4;}function ports(t,r){var a=t==='I'?[1,3]:t==='L'?[0,1]:t==='T'?[0,1,3]:[0,1,2,3];return a.map(function(d){return(d+r)%4;});}
function pieceFromPorts(ds){var s=ds.slice().sort().join(',');var types={'1,3':'I','0,2':'I','0,1':'L','0,3':'L','1,2':'L','2,3':'L','0,1,3':'T','0,1,2':'T','0,2,3':'T','1,2,3':'T','0,1,2,3':'X'};return types[s]||'X';}
// Exact pipe-type layout supplied by the user: 8 columns x 6 rows.
// L = elbow, I = straight, T = three-way. Initial rotations are scrambled;
// the solved rotations below connect the source to all three tanks.
var LEVEL_TYPES=[
 'LILLIITL',
 'LIITIIIL',
 'TILILITL',
 'TIITTIIL',
 'LITILLIL',
 'IILIILLL'
];
var SOLUTION_ROT=[
 [1,2,3,0,0,0,2,1],
 [0,0,2,2,2,0,0,3],
 [2,2,2,1,2,0,1,1],
 [1,0,1,1,2,2,0,3],
 [0,0,2,0,3,1,0,2],
 [1,2,0,0,0,3,2,0]
];
function makeSolution(){
 var map={};
 for(var y=0;y<ROWS;y++) for(var x=0;x<COLS;x++){
   var t=LEVEL_TYPES[y].charAt(x);
   // Fixed, repeatable starting layout. No flow is rendered until START is pressed.
   var scramble=(x*3+y*2+1)%4;
   map[key(x,y)]={t:t,r:(SOLUTION_ROT[y][x]+scramble)%4,open:true};
 }
 return map;
}
function Scene_BFNitrogen(){this.initialize.apply(this,arguments);}Scene_BFNitrogen.prototype=Object.create(Scene_Base.prototype);Scene_BFNitrogen.prototype.constructor=Scene_BFNitrogen;
Scene_BFNitrogen.prototype.initialize=function(){Scene_Base.prototype.initialize.call(this);this._won=false;this._lost=false;this._rewarded=false;this._running=false;this._flow=0;this._time=180;this._pressure=0;this._temperature=-20;this._anim=0;this._toast='hint';this._toastT=0;this._filled={};this._leakPoints=[];this._leakElapsed=0;this._board=makeSolution();};
Scene_BFNitrogen.prototype.create=function(){Scene_Base.prototype.create.call(this);this._bitmap=new Bitmap(W,H);this._sprite=new Sprite(this._bitmap);this.addChild(this._sprite);this.resizeView();};
Scene_BFNitrogen.prototype.resizeView=function(){var vw=Graphics.boxWidth||Graphics.width||W,vh=Graphics.boxHeight||Graphics.height||H,s=Math.min(vw/W,vh/H);this._view={s:s,ox:(vw-W*s)/2,oy:(vh-H*s)/2};this._sprite.x=this._view.ox;this._sprite.y=this._view.oy;this._sprite.scale.set(s,s);};
Scene_BFNitrogen.prototype.point=function(){var v=this._view;return{x:(TouchInput.x-v.ox)/v.s,y:(TouchInput.y-v.oy)/v.s};};
Scene_BFNitrogen.prototype.toast=function(k){this._toast=k;this._toastT=150;};
Scene_BFNitrogen.prototype.cellAt=function(x,y){var gx=Math.floor((x-OX)/CELL),gy=Math.floor((y-OY)/CELL);return gx<0||gx>=COLS||gy<0||gy>=ROWS?null:{x:gx,y:gy};};
Scene_BFNitrogen.prototype.rotateCell=function(cell){if(!cell||this._running||this._won||this._lost)return;var p=this._board[key(cell.x,cell.y)];if(!p)return;p.r=(p.r+1)%4;this._toastT=45;this._toast='hint';};
Scene_BFNitrogen.prototype.reset=function(){this._won=false;this._lost=false;this._rewarded=false;this._running=false;this._flow=0;this._time=180;this._pressure=0;this._temperature=-20;this._filled={};this._leakPoints=[];this._leakElapsed=0;this._board=makeSolution();this.toast('hint');};
Scene_BFNitrogen.prototype.checkPath=function(){
 var start={x:0,y:2},queue=[start],seen={},path=[],leaks=[],tanks={top:false,mid:false,bottom:false};
 if(ports(this._board[key(0,2)].t,this._board[key(0,2)].r).indexOf(3)<0)return{ok:false,reason:'incomplete',path:[],tanks:tanks,leaks:[],count:0};
 function addLeak(x,y,d){leaks.push({x:x,y:y,d:d});}
 while(queue.length){
  var q=queue.shift(),k=key(q.x,q.y);if(seen[k])continue;seen[k]=true;path.push({x:q.x,y:q.y});
  var p=this._board[k],ps=ports(p.t,p.r);
  ps.forEach(function(d){
   var nx=q.x+(d===1?1:d===3?-1:0),ny=q.y+(d===2?1:d===0?-1:0);
   // The source inlet is a sealed connection, not a leak.
   if(nx===-1&&ny===2&&d===3)return;
   // The three right-side ports are sealed reservoir connections.
   if(nx===COLS&&(ny===0||ny===2||ny===5)&&d===1){tanks[ny===0?'top':ny===2?'mid':'bottom']=true;return;}
   // Any other outward-facing port on a live pipe vents nitrogen.
   if(nx<0||nx>=COLS||ny<0||ny>=ROWS){addLeak(q.x,q.y,d);return;}
   var np=this._board[key(nx,ny)];
   if(ports(np.t,np.r).indexOf(opp(d))<0){addLeak(q.x,q.y,d);return;}
   if(!seen[key(nx,ny)])queue.push({x:nx,y:ny});
  },this);
 }
 var count=(tanks.top?1:0)+(tanks.mid?1:0)+(tanks.bottom?1:0);
 return{ok:count===3&&leaks.length===0,reason:leaks.length?'leak':'incomplete',path:path,tanks:tanks,leaks:leaks,count:count};
};
Scene_BFNitrogen.prototype.startFlow=function(){
 if(this._running||this._won||this._lost)return;
 var r=this.checkPath();
 if(r.leaks.length){this._flowPath=r.path;this._leakPoints=r.leaks;this._leakElapsed=0;this._filled=r.tanks;this._running=true;this._flow=0;this._pressure=2;this._temperature=-80;this.toast('leak');return;}
 if(!r.ok){this.toast('incomplete');return;}
 this._flowPath=r.path;this._leakPoints=[];this._filled=r.tanks;this._running=true;this._flow=0;this._pressure=2;this._temperature=-80;this.toast('flowing');
};
Scene_BFNitrogen.prototype.input=function(){if(Input.isTriggered('escape')){SceneManager.pop();return;}if(this._won){if(Input.isTriggered('ok')||TouchInput.isTriggered())SceneManager.pop();return;}if(this._lost){if(Input.isTriggered('ok')||Input.isTriggered('f')||TouchInput.isTriggered())this.reset();return;}if(Input.isTriggered('f'))this.reset();if(Input.isTriggered('ok')||Input.isTriggered('space'))this.startFlow();if(TouchInput.isTriggered()){var p=this.point();if(p.x>990&&p.x<1255&&p.y>205&&p.y<305){this.reset();return;}if(p.x>990&&p.x<1255&&p.y>105&&p.y<195){this.startFlow();return;}var cell=this.cellAt(p.x,p.y);if(cell)this.rotateCell(cell);}};
Scene_BFNitrogen.prototype.update=function(){Scene_Base.prototype.update.call(this);this._anim++;this.resizeView();this.input();if(this._toastT>0)this._toastT--;if(!this._running&&!this._won&&!this._lost&&this._anim>60)this._time=Math.max(0,this._time-1/60);if(this._time<=0&&!this._running){this._lost=true;this.toast('failed');}if(this._running&&!this._won){this._flow+=1/60;this._pressure=Math.min(18,2+this._flow*4);this._temperature=Math.max(-196,-80-this._flow*35);if(this._leakPoints&&this._leakPoints.length){this._leakElapsed+=1/60;if(this._leakElapsed>=1.65){this._running=false;this._lost=true;this._pressure=0;this.toast('leakFail');}}else if(this._flow>=4){this._won=true;this._running=false;this._complete();this.toast('success');}}this.redraw();};
// Load sprite assets from img/pictures/BF_Nitrogen. The board logic remains unchanged.
Scene_BFNitrogen.prototype._spriteBitmap=function(name){
  this._pipeBitmaps=this._pipeBitmaps||{};
  if(!this._pipeBitmaps[name]) this._pipeBitmaps[name]=ImageManager.loadPicture('BF_Nitrogen/'+name);
  return this._pipeBitmaps[name];
};
Scene_BFNitrogen.prototype._drawAsset=function(c,name,x,y,w,h,rotation){
  var bmp=this._spriteBitmap(name);
  if(!bmp || !bmp.isReady || !bmp.isReady() || !bmp._canvas) return false;
  c.save(); c.translate(x,y); if(rotation) c.rotate(rotation);
  c.drawImage(bmp._canvas,-w/2,-h/2,w,h); c.restore(); return true;
};
Scene_BFNitrogen.prototype.drawPipe=function(c,x,y,t,r,size,active){
  // Canonical 256x256 copper sprites have ports centered on tile edges.
  // Native ports: I=left/right, L=right/down, T=left/right/down, X=all four.
  // Logical ports: I=left/right, L=up/right, T=up/left/right, X=all four.
  var rot=(r||0)*Math.PI/2;
  // Canonical sprites are authored with ports centered exactly on tile edges.
  // Rotate around the tile center only; do not apply per-type correction angles.
  if(!this._drawAsset(c,'pipe_'+t,x,y,size,size,rot)){
    this.drawPipeFallback(c,x,y,t,r,size,active,this._board);
    return;
  }
  if(active){
    var ds=ports(t,r||0), rad=size*.39;
    c.save(); c.translate(x,y); c.lineCap='round'; c.lineJoin='round';
    c.shadowColor='rgba(56,225,255,.95)'; c.shadowBlur=8;
    c.strokeStyle='rgba(45,220,255,.78)'; c.lineWidth=size*.15;
    c.beginPath();
    if(t==='L' && ds.length===2){
      var a=ds[0], b=ds[1];
      var ax=a===1?rad:a===3?-rad:0, ay=a===2?rad:a===0?-rad:0;
      var bx=b===1?rad:b===3?-rad:0, by=b===2?rad:b===0?-rad:0;
      c.moveTo(ax,ay); c.quadraticCurveTo(0,0,bx,by);
    } else {
      ds.forEach(function(d){
        var ex=d===1?rad:d===3?-rad:0, ey=d===2?rad:d===0?-rad:0;
        c.moveTo(0,0); c.lineTo(ex,ey);
      });
    }
    c.stroke(); c.shadowBlur=0; c.strokeStyle='rgba(190,250,255,.98)';
    c.lineWidth=Math.max(2,size*.04); c.stroke(); c.restore();
  }
};
Scene_BFNitrogen.prototype.drawPipeFallback=function(c,x,y,t,r,size,active,board){
 // Use the board passed by the scene instead of relying on implicit callback `this`.
 board=board||((typeof this!=='undefined'&&this)?this._board:null)||{};
 c.save(); c.translate(x,y);
 // Clip every pipe body to its own cell. Without this clip, the thick shadow,
 // rounded caps and elbow curves spill into neighboring tiles and make a mess.
 c.beginPath(); c.rect(-CELL/2+1,-CELL/2+1,CELL-2,CELL-2); c.clip();
 c.rotate((r||0)*Math.PI/2);
 // Pipe centerlines reach the cell edge; clipping trims only the stroke overflow.
 var h=CELL/2, th=CELL*0.285;
 var dirs=ports(t,0);
 function xy(d,rad){return {x:d===1?rad:d===3?-rad:0,y:d===2?rad:d===0?-rad:0};}
 function strokePath(path,color,width){
   c.save(); c.beginPath(); path(c); c.strokeStyle=color; c.lineWidth=width;
   c.lineCap='round'; c.lineJoin='round'; c.stroke(); c.restore();
 }
 // Heavy shadow, dark iron rim, copper body and a narrow highlight.
 function paintPath(path){
   strokePath(path,'rgba(0,0,0,.78)',th+11);
   strokePath(path,'#30221a',th+7);
   var grad=c.createLinearGradient(0,-th/2,0,th/2);
   grad.addColorStop(0,'#e6a36c'); grad.addColorStop(.15,'#b96a3c');
   grad.addColorStop(.43,'#8b492b'); grad.addColorStop(.68,'#c77b49');
   grad.addColorStop(.88,'#9b532f'); grad.addColorStop(1,'#542e20');
   strokePath(path,grad,th);
   strokePath(path,function(q){path(q);},Math.max(2,th*.07));
 }
 function straight(d1,d2){
   var a=xy(d1,h),b=xy(d2,h);
   paintPath(function(q){q.moveTo(a.x,a.y);q.lineTo(b.x,b.y);});
   // Reinforced collars just inside the cell edge; neighboring pipes overlap them.
   [a,b].forEach(function(p){
     var dx=p.x===0?0:(p.x>0?-1:1),dy=p.y===0?0:(p.y>0?-1:1);
     var cx=p.x+dx*5,cy=p.y+dy*5;
     strokePath(function(q){q.moveTo(cx-(dy*th*.40),cy+(dx*th*.40));q.lineTo(cx+(dy*th*.40),cy-(dx*th*.40));},'#633720',4);
     strokePath(function(q){q.moveTo(cx-(dy*th*.33),cy+(dx*th*.33));q.lineTo(cx+(dy*th*.33),cy-(dx*th*.33));},'#e0a06a',1.4);
   });
 }
 if(t==='I'){
   straight(dirs[0],dirs[1]);
 } else if(t==='L'){
   var a=xy(dirs[0],h),b=xy(dirs[1],h);
   // Rounded 90-degree copper elbow, with its endpoints reaching the cell edges.
   paintPath(function(q){
     q.moveTo(a.x,a.y);
     var vx1=a.x===0?0:(a.x>0?-1:1), vy1=a.y===0?0:(a.y>0?-1:1);
     var vx2=b.x===0?0:(b.x>0?-1:1), vy2=b.y===0?0:(b.y>0?-1:1);
     q.bezierCurveTo(a.x+vx1*th*.9,a.y+vy1*th*.9,b.x+vx2*th*.9,b.y+vy2*th*.9,b.x,b.y);
   });
 } else if(t==='T'){
   var pair=null,branch=null;
   for(var i=0;i<dirs.length;i++) for(var j=i+1;j<dirs.length;j++) if(opp(dirs[i])===dirs[j]){pair=[dirs[i],dirs[j]];}
   for(var k=0;k<dirs.length;k++) if(!pair|| (dirs[k]!==pair[0]&&dirs[k]!==pair[1])) branch=dirs[k];
   if(pair) straight(pair[0],pair[1]);
   if(branch!==null){
     var z=xy(branch,h);
     paintPath(function(q){q.moveTo(0,0);q.lineTo(z.x,z.y);});
   }
   circ(c,0,0,th*.48,'#98512d','#e0a06a',2);
 } else {
   straight(1,3);straight(0,2);
 }
 if(active){
   c.save(); c.globalCompositeOperation='screen'; c.strokeStyle='rgba(70,235,255,.9)';
   c.lineWidth=th*.27; c.lineCap='round';
   dirs.forEach(function(d){var z=xy(d,h*.92);c.beginPath();c.moveTo(0,0);c.lineTo(z.x,z.y);c.stroke();});
   c.restore();
 }
 c.restore();

 // Polished couplers only where two neighboring pipe mouths really meet.
 // The copper runs still reach the cell edge; a dark steel collar and narrow
 // brass rings make connected cells read as one continuous pipeline.
 var gx=Math.round((x-OX-CELL/2)/CELL), gy=Math.round((y-OY-CELL/2)/CELL);
 var actualPorts=ports(t,r||0), pipeWidth=th;
 for(var ci=0;ci<actualPorts.length;ci++){
   var d=actualPorts[ci], nx=gx+(d===1?1:d===3?-1:0), ny=gy+(d===2?1:d===0?-1:0);
   if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
   var np=board[key(nx,ny)];
   if(!np || ports(np.t,np.r).indexOf(opp(d))<0) continue;
   var jx=x+(d===1?CELL/2:d===3?-CELL/2:0);
   var jy=y+(d===2?CELL/2:d===0?-CELL/2:0);
   c.save();
   // Outer steel flange across the joint, perpendicular to pipe direction.
   c.lineCap='butt'; c.lineJoin='round';
   c.strokeStyle='rgba(0,0,0,.78)'; c.lineWidth=pipeWidth+10;
   c.beginPath(); if(d===1||d===3){c.moveTo(jx,jy-pipeWidth*.62);c.lineTo(jx,jy+pipeWidth*.62);}else{c.moveTo(jx-pipeWidth*.62,jy);c.lineTo(jx+pipeWidth*.62,jy);} c.stroke();
   c.strokeStyle='#343638'; c.lineWidth=pipeWidth+5; c.stroke();
   c.strokeStyle='#c28a51'; c.lineWidth=pipeWidth+1.5; c.stroke();
   c.strokeStyle='#f0bb7d'; c.lineWidth=2; c.stroke();
   // Two fine seam lines make the coupler look machined rather than capped.
   c.strokeStyle='#653820'; c.lineWidth=1.8;
   if(d===1||d===3){[-pipeWidth*.48,pipeWidth*.48].forEach(function(off){c.beginPath();c.moveTo(jx,jy+off-1.5);c.lineTo(jx,jy+off+1.5);c.stroke();});}
   else{[-pipeWidth*.48,pipeWidth*.48].forEach(function(off){c.beginPath();c.moveTo(jx+off-1.5,jy);c.lineTo(jx+off+1.5,jy);c.stroke();});}
   c.restore();
 }
};
Scene_BFNitrogen.prototype.drawTank=function(c,x,y,label,filled){
  var isSource=label==='N₂';
  var asset=isSource?'tank_source':(filled?'tank_reservoir_full':'tank_reservoir_empty');
  var w=isSource?84:82, h=isSource?130:130;
  if(this._drawAsset(c,asset,x,y,w,h,0)){
    if(!isSource) txt(c,label,x,y+65,18,filled?'#8fffe4':'#c7d6d8','center',900);
    return;
  }
  // Vector fallback while images load.
  var g=c.createLinearGradient(x-25,y-45,x+25,y+45);g.addColorStop(0,'#d4dfe0');g.addColorStop(.25,'#3b5058');g.addColorStop(.5,'#9daeb1');g.addColorStop(.75,'#273941');g.addColorStop(1,'#b7c6c8');round(c,x-25,y-46,50,92,13,'#101a20','#c5a168',2);round(c,x-21,y-42,42,84,10,g,'#6b7c80',1);round(c,x-14,y-34,28,68,7,'#071d28','#9eb7bc',1);if(filled){var grd=c.createLinearGradient(x,y+32,x,y-30);grd.addColorStop(0,'#0878a4');grd.addColorStop(1,'#a8f8ff');round(c,x-12,y-32,24,64,5,grd,'#71eaff',1);circ(c,x,y-31,4,'#e4ffff');}txt(c,label,x,y+50,18,filled?'#8fffe4':'#c7d6d8','center',900);
};
Scene_BFNitrogen.prototype.redraw=function(){if(!this._board)this._board=makeSolution();var b=this._bitmap;if(!b)return;var c=b._context,tm=this._anim;c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);var bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#b9b0a5');bg.addColorStop(.55,'#8f8578');bg.addColorStop(1,'#6b6258');c.fillStyle=bg;c.fillRect(0,0,W,H);for(var by=0;by<H;by+=58){for(var bx=(Math.floor(by/58)%2)*42;bx<W;bx+=84){round(c,bx+2,by+2,80,52,4,'#c5b9aa','#75685d',2);ln(c,bx+7,by+7,bx+74,by+7,'rgba(255,255,255,.22)',1);}}
round(c,12,10,1256,700,9,'rgba(20,23,24,.12)','#50453c',2);
 round(c,26,18,720,58,7,'#343638','#8d7966',2);txt(c,tr('title'),44,31,27,'#f5e7d4','left',900);round(c,1000,18,250,58,7,'#343638','#8d7966',2);txt(c,tr('time'),1016,24,15,'#e2c7a5','left',800);txt(c,this.timeText(),1230,22,27,'#fff0d3','right',900);round(c,1016,56,214,7,3,'#0a1318','#687980',1);round(c,1018,58,210*clamp(this._time/180,0,1),3,2,this._time<30?'#e55f48':'#cba45e');
 // source pipe and three target tanks
 this.drawTank(c,82,OY+2.5*CELL,'N₂',this._running||this._won);
 // Source neck reaches the first tile edge; matching copper/steel layers prevent a gap.
 ln(c,105,OY+2.5*CELL,OX+1,OY+2.5*CELL,'#292d2e',30);
 ln(c,105,OY+2.5*CELL,OX+1,OY+2.5*CELL,'#9c552f',21);
 ln(c,105,OY+2.5*CELL-3,OX+1,OY+2.5*CELL-3,'#d58b54',10);
 txt(c,'ИСТОЧНИК',82,OY+2.5*CELL+57,16,'#f3e9dc','center',800);
 var tx=OX+COLS*CELL+42, tankYs=[OY+CELL/2,OY+2.5*CELL,OY+5.5*CELL];
 this.drawTank(c,tx,tankYs[0],'01',this._running&&this._flow>.8||this._won);
 this.drawTank(c,tx,tankYs[1],'02',this._running&&this._flow>1.8||this._won);
 this.drawTank(c,tx,tankYs[2],'03',this._running&&this._flow>2.8||this._won);
 // Short copper outlet necks are drawn over the board frame and into each reservoir.
 tankYs.forEach(function(ty,idx){
   ln(c,OX+COLS*CELL-1,ty,tx-22,ty,'#2c2925',30);
   ln(c,OX+COLS*CELL-1,ty,tx-22,ty,'#a65c32',21);
   ln(c,OX+COLS*CELL-1,ty-3,tx-22,ty-3,'#e0a06a',8);
   round(c,tx-30,ty-14,13,28,3,'#383d3e','#c5a06a',2);
 });
 round(c,OX-9,OY-9,COLS*CELL+18,ROWS*CELL+18,8,'#111a20','#98794b',3);for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++){var xx2=OX+x*CELL,yy2=OY+y*CELL,k=key(x,y),p=this._board[k];var tile=c.createLinearGradient(xx2,yy2,xx2,yy2+CELL);tile.addColorStop(0,'rgba(231,220,205,.25)');tile.addColorStop(.55,'rgba(100,87,75,.10)');tile.addColorStop(1,'rgba(46,42,38,.18)');round(c,xx2+1,yy2+1,CELL-2,CELL-2,4,tile,'rgba(76,61,49,.38)',1);circ(c,xx2+7,yy2+7,2,'#c39a58');circ(c,xx2+CELL-7,yy2+CELL-7,2,'#c39a58');var active=this._running&&this._flowPath&&this._flowPath.some(function(q,i){return q.x===x&&q.y===y&&this._flow>i*.08;},this);this.drawPipe(c,xx2+CELL/2,yy2+CELL/2,p.t,p.r,CELL,active);}
  // Nitrogen leak effect: a short bright jet, icy mist and pulsing droplets at each open live port.
  if(this._running&&this._leakPoints&&this._leakPoints.length){
    var scene=this, pulse=.72+.28*Math.sin(tm*.9);
    this._leakPoints.forEach(function(lp){
      var cx=OX+lp.x*CELL+CELL/2,cy=OY+lp.y*CELL+CELL/2;
      var ex=cx+(lp.d===1?CELL*.48:lp.d===3?-CELL*.48:0),ey=cy+(lp.d===2?CELL*.48:lp.d===0?-CELL*.48:0);
      var dx=lp.d===1?1:lp.d===3?-1:0,dy=lp.d===2?1:lp.d===0?-1:0;
      c.save();c.lineCap='round';c.shadowColor='#48dfff';c.shadowBlur=18;
      c.strokeStyle='rgba(56,220,255,'+(.75*pulse)+')';c.lineWidth=13;
      c.beginPath();c.moveTo(ex-dx*7,ey-dy*7);c.lineTo(ex+dx*(18+Math.sin(tm*1.7)*7),ey+dy*(18+Math.sin(tm*1.7)*7));c.stroke();
      c.shadowBlur=0;c.strokeStyle='rgba(220,252,255,.95)';c.lineWidth=4;c.stroke();
      for(var si=0;si<5;si++){var travel=((tm*2.4+si*.21)%1),side=Math.sin(tm*3+si*2)*9;circ(c,ex+dx*(8+travel*34)-dy*side,ey+dy*(8+travel*34)+dx*side,2+((si%3)*.7),'rgba(117,239,255,'+(1-travel)*.85+')');}
      c.restore();
    });
  }
 // Redraw the inlet/outlet necks on top of the frame so the whole line reads as one assembly.
 var sy=OY+2.5*CELL;
 ln(c,OX-5,sy,OX+2,sy,'#2b2926',31);ln(c,OX-5,sy,OX+2,sy,'#9d552f',22);ln(c,OX-5,sy-3,OX+2,sy-3,'#df9c64',8);
 tankYs.forEach(function(ty){
   ln(c,OX+COLS*CELL-2,ty,tx-19,ty,'#2b2926',31);
   ln(c,OX+COLS*CELL-2,ty,tx-19,ty,'#9d552f',22);
   ln(c,OX+COLS*CELL-2,ty-3,tx-19,ty-3,'#df9c64',8);
   round(c,tx-30,ty-14,13,28,3,'#3b3d3c','#d0a66a',2);
 });
 // Large touch controls are stacked on the right, directly below the timer.
 round(c,990,105,265,90,10,'#225344','#9bd9b4',3);circ(c,1030,150,18,'#0d2921','#8be6b3',2);c.beginPath();c.moveTo(1024,139);c.lineTo(1041,150);c.lineTo(1024,161);c.closePath();c.fillStyle='#d7ffe8';c.fill();txt(c,tr('start'),1130,134,27,'#e4fff0','center',900);
 round(c,990,205,265,90,10,'#3a4248','#bda16e',3);circ(c,1030,250,18,null,'#e4cf9c',3);c.beginPath();c.arc(1030,250,11,-Math.PI*.7,Math.PI*.9);c.strokeStyle='#e4cf9c';c.lineWidth=3;c.stroke();txt(c,tr('reset'),1130,234,27,'#f8e9ca','center',900);
 if(this._toastT>0&&!this._won&&!this._lost){round(c,255,78,740,42,7,'rgba(35,34,32,.97)',this._toast==='leak'?'#55dfff':'#bda16e',2);txt(c,tr(this._toast),625,87,20,this._toast==='leak'?'#8ff2ff':'#ffe7b4','center',900);}if(this._won||this._lost){c.fillStyle='rgba(1,6,9,.78)';c.fillRect(0,0,W,H);round(c,280,230,720,250,12,this._won?'#17483d':'#4b2723','#d0ac70',3);txt(c,tr(this._won?'success':'failed'),640,270,32,this._won?'#b6ffe3':'#ffc6b4','center',900);txt(c,tr(this._won?'success2':(this._toast==='leakFail'?'leakFail':'failed2')),640,326,21,'#edf5f0','center',700);txt(c,tr('exit'),640,420,18,'#cbd9df','center',700);}c.restore();if(b._setDirty)b._setDirty();};
Scene_BFNitrogen.prototype.timeText=function(){var t=Math.ceil(this._time);return('0'+Math.floor(t/60)).slice(-2)+':'+('0'+t%60).slice(-2);};
Scene_BFNitrogen.prototype._complete=function(){if(!this._won||this._rewarded)return;this._rewarded=true;try{if(window.BF_Inventory&&typeof window.BF_Inventory.game==='function')window.BF_Inventory.game().add('nitrogen',1);}catch(e){}try{if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.game==='function')window.BF_QuestSystem.game().setStep('engineer',1);}catch(e){}if(window.$gameVariables)$gameVariables.setValue(10,6);if(ORIGIN.mapId&&ORIGIN.eventId&&window.$gameSelfSwitches)$gameSelfSwitches.setValue([ORIGIN.mapId,ORIGIN.eventId,'A'],true);};
var oldPC=Game_Interpreter.prototype.pluginCommand;Game_Interpreter.prototype.pluginCommand=function(command,args){oldPC.call(this,command,args);var c=String(command||'').toLowerCase(),a=(args||[]).map(function(v){return String(v||'').toLowerCase();});if(c==='nitrogen'&&(!a.length||a[0]==='start')){ORIGIN.mapId=this._mapId||($gameMap?$gameMap.mapId():0);ORIGIN.eventId=this._eventId||0;this.setWaitMode('bfNitrogenWait');SceneManager.push(Scene_BFNitrogen);}};var oldWM=Game_Interpreter.prototype.updateWaitMode;Game_Interpreter.prototype.updateWaitMode=function(){if(this._waitMode==='bfNitrogenWait')return SceneManager._scene instanceof Scene_BFNitrogen;return oldWM.call(this);};window.BF_Nitrogen_Start=function(){ORIGIN.mapId=$gameMap.mapId();ORIGIN.eventId=0;SceneManager.push(Scene_BFNitrogen);};window.Scene_NitrogenV6=Scene_BFNitrogen;window.Scene_NitrogenV7=Scene_BFNitrogen;
})();
