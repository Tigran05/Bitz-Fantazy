/*:
 * @plugindesc Bitz Fantasy — BF_Nitrogen. Полноэкранная мини-игра инженера: криогенная установка с экраном процесса и отдельным пультом управления.
 * @author ASTROLIT
 *
 * @help
 * Команда: Nitrogen start
 * Скрипт: BF_Nitrogen_Start();
 *
 * Управление:
 *   ЛКМ / touch — 4 большие кнопки на пульте.
 *   1 / 2 / 3 / 4 — A / B / C / D.
 *   S — подсказка.
 *   R — полный сброс.
 *   ESC — выйти.
 *
 * Успех:
 *   nitrogen в BF_Inventory, engineer -> шаг 1,
 *   Variable 10 = 6, Self Switch A запускающего события.
 */
(function(){
'use strict';

var ORIGIN={mapId:0,eventId:0};
var DESIGN_W=1280, DESIGN_H=720, TAU=Math.PI*2;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rr(b,x,y,w,h,r,fill,stroke,lw){
  var c=b._context;if(!c)return;c.save();c.beginPath();
  c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}
  c.restore();if(b._setDirty)b._setDirty();
}
function line(b,x1,y1,x2,y2,col,lw){
  var c=b._context;if(!c)return;c.save();c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);
  c.strokeStyle=col;c.lineWidth=lw||2;c.lineCap='round';c.stroke();c.restore();if(b._setDirty)b._setDirty();
}
function circle(b,x,y,r,fill,stroke,lw){
  var c=b._context;if(!c)return;c.save();c.beginPath();c.arc(x,y,r,0,TAU);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}
  c.restore();if(b._setDirty)b._setDirty();
}

function Scene_BFNitrogen(){this.initialize.apply(this,arguments);}
Scene_BFNitrogen.prototype=Object.create(Scene_Base.prototype);
Scene_BFNitrogen.prototype.constructor=Scene_BFNitrogen;

Scene_BFNitrogen.prototype.initialize=function(){
  Scene_Base.prototype.initialize.call(this);
  this._frame=0;this._won=false;this._lost=false;this._successApplied=false;
  this._toast='';this._toastT=0;this._hint=0;
  this._valves={A:false,B:false,C:false};
  this._bleedPulse=0;
  this._temp=-72;this._pressure=28;this._stability=100;this._fill=0;
  this._state='COOL';this._alarm='НОРМА';
  this._overPressureT=0;this._underPressureT=0;this._fillStarted=false;
  this._pressedKey='';this._pressedT=0;this._hoverKey='';
};

Scene_BFNitrogen.prototype.create=function(){
  Scene_Base.prototype.create.call(this);
  var vw=Graphics.boxWidth||Graphics.width||DESIGN_W;
  var vh=Graphics.boxHeight||Graphics.height||DESIGN_H;
  this._bmp=new Bitmap(vw,vh);
  this._sp=new Sprite(this._bmp);this.addChild(this._sp);
  this._layoutW=DESIGN_W;this._layoutH=DESIGN_H;this._mobileLayout=false;
  this.resizeWorld();
  this.redraw();
};

Scene_BFNitrogen.prototype.resizeWorld=function(){
  var vw=Graphics.boxWidth||Graphics.width||DESIGN_W;
  var vh=Graphics.boxHeight||Graphics.height||DESIGN_H;
  var touchCap=(typeof window!=='undefined'&&('ontouchstart' in window));
  var mobile=(vw/vh<1.10)||(touchCap&&vw<760);
  var lw=mobile?480:DESIGN_W,lh=mobile?854:DESIGN_H;
  if(this._layoutW!==lw||this._layoutH!==lh){this._layoutW=lw;this._layoutH=lh;}
  if(this._bmp&&(this._bmp.width!==vw||this._bmp.height!==vh)&&this._bmp.resize)this._bmp.resize(vw,vh);
  this._mobileLayout=mobile;
  var s=Math.min(vw/lw,vh/lh);
  this._view={s:s,ox:(vw-lw*s)/2,oy:(vh-lh*s)/2,vw:vw,vh:vh,lw:lw,lh:lh};
  this._sp.x=0;this._sp.y=0;this._sp.scale.set(1,1);
};

Scene_BFNitrogen.prototype.mouse=function(){
  var p=this._view||{s:1,ox:0,oy:0,lw:DESIGN_W,lh:DESIGN_H};
  return {x:clamp((TouchInput.x-p.ox)/p.s,0,p.lw),y:clamp((TouchInput.y-p.oy)/p.s,0,p.lh)};
};

Scene_BFNitrogen.prototype.text=function(b,t,x,y,w,h,size,col,align,weight){
  var c=b&&b._context;if(!c)return;
  c.save();
  c.font=(weight||600)+' '+(size||16)+'px Arial, "Segoe UI", Tahoma, sans-serif';
  c.fillStyle=col||'#fff';
  c.textBaseline='top';
  c.textAlign=align==='center'?'center':align==='right'?'right':'left';
  var xx=align==='center'?x+w/2:align==='right'?x+w:x;
  var maxH=h||size||16;
  var str=String(t==null?'':t);
  var parts=str.split('\n');
  for(var i=0;i<parts.length;i++){
    if(i*(size+3)>=maxH)break;
    c.fillText(parts[i],xx,y+i*(size+3));
  }
  c.restore();
  if(b._setDirty)b._setDirty();
};

Scene_BFNitrogen.prototype.toast=function(t){this._toast=t;this._toastT=95;};

Scene_BFNitrogen.prototype.buttonRects=function(){
  if(this._mobileLayout){
    return {A:{x:48,y:704,w:178,h:88},B:{x:254,y:704,w:178,h:88},C:{x:48,y:806,w:178,h:88},D:{x:254,y:806,w:178,h:88}};
  }
  return {A:{x:984,y:346,w:116,h:108},B:{x:1116,y:346,w:116,h:108},C:{x:984,y:472,w:116,h:108},D:{x:1116,y:472,w:116,h:108}};
};
Scene_BFNitrogen.prototype.hit=function(x,y,r,pad){pad=pad||0;return x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad;};

Scene_BFNitrogen.prototype.toggle=function(k){
  if(this._won||this._lost)return;
  if(k==='D'){
    this._bleedPulse=1.0;this.toast('СБРОС ДАВЛЕНИЯ');return;
  }
  this._valves[k]=!this._valves[k];
  var names={A:'ПОДАЧА',B:'ОХЛАЖДЕНИЕ',C:'ЗАПРАВКА'};
  this.toast(names[k]+' · '+(this._valves[k]?'ВКЛ':'ВЫКЛ'));
};

Scene_BFNitrogen.prototype.reset=function(){
  this._valves={A:false,B:false,C:false};this._bleedPulse=0;
  this._temp=-72;this._pressure=28;this._stability=100;this._fill=0;
  this._state='COOL';this._alarm='НОРМА';this._overPressureT=0;this._underPressureT=0;
  this._won=false;this._lost=false;this._successApplied=false;this._hint=0;this._fillStarted=false;
  this._pressedKey='';this._pressedT=0;this._hoverKey='';this.toast('СИСТЕМА СБРОШЕНА');
};

Scene_BFNitrogen.prototype.phase=function(){
  if(this._fill>=100)return 'DONE';
  if(this._temp>-150)return 'COOL';
  if(!this._valves.C)return 'PRESSURE';
  return 'FILL';
};

Scene_BFNitrogen.prototype.updatePhysics=function(dt){
  if(this._bleedPulse>0)this._bleedPulse=Math.max(0,this._bleedPulse-dt);
  var A=this._valves.A,B=this._valves.B,C=this._valves.C,D=this._bleedPulse>0;
  var cold=this._temp<=-150;
  var charging=C&&cold&&this._pressure>=48&&this._pressure<=70;

  if(A){this._pressure+=2.75*dt;this._temp+=0.38*dt;this._stability-=0.05*dt;}
  else{this._pressure-=0.10*dt;}
  if(A&&B&&!C){this._temp-=2.00*dt;this._stability+=0.10*dt;}
  else if(B&&!C){this._temp-=0.80*dt;this._stability+=0.03*dt;}
  else if(!B&&!C&&this._temp<-95){this._temp+=0.12*dt;}
  if(C){
    this._pressure+=1.80*dt;this._temp+=(B?0.26:1.05)*dt;this._stability-=0.04*dt;
    if(charging){this._fill+=6.0*dt;this._stability+=0.10*dt;this._fillStarted=true;}
    else{this._stability-=0.35*dt;}
  }
  if(D){this._pressure-=15.0*dt;this._stability-=0.08*dt;}

  this._pressure=clamp(this._pressure,0,105);
  this._temp=clamp(this._temp,-190,-55);
  this._stability=clamp(this._stability,0,100);
  this._fill=clamp(this._fill,0,100);

  if(this._pressure>82){this._overPressureT+=dt;this._stability-=0.45*dt;}
  else this._overPressureT=Math.max(0,this._overPressureT-1.5*dt);
  if(this._pressure<20){this._underPressureT+=dt;this._stability-=0.18*dt;}
  else this._underPressureT=Math.max(0,this._underPressureT-1.0*dt);

  this._state=this.phase();
  if(this._pressure>82)this._alarm='ВЫСОКОЕ ДАВЛЕНИЕ';
  else if(this._pressure<20)this._alarm='НИЗКОЕ ДАВЛЕНИЕ';
  else if(C&&!charging)this._alarm='НЕВЕРНЫЙ РЕЖИМ';
  else this._alarm='НОРМА';

  if(this._state==='COOL')this._msg='ОХЛАДИТЕ КАМЕРУ ДО −150 °C';
  else if(this._state==='PRESSURE')this._msg='ВЫКЛЮЧИТЕ A · ВЫСТАВЬТЕ 48–70 bar';
  else if(this._state==='FILL')this._msg='ЗАПРАВКА: C + B · СЛЕДИТЕ ЗА ДАВЛЕНИЕМ';
  else this._msg='СИСТЕМА ГОТОВА';

  if(this._overPressureT>4.0||this._underPressureT>10||this._stability<=0){
    this._lost=true;this._msg=this._stability<=0?'СИСТЕМА НЕСТАБИЛЬНА':'АВАРИЯ: ДАВЛЕНИЕ ВЫШЛО ЗА ПРЕДЕЛЫ';
  }

  // Once the tank actually reaches 100% through a valid charging process, finish immediately.
  if(this._fill>=100&&this._fillStarted){
    this._fill=100;this._won=true;this._msg='ЖИДКИЙ АЗОТ ПОЛУЧЕН';this._complete();
  }
};

Scene_BFNitrogen.prototype.hint=function(){
  var tips=[
    'Сначала включите A и B и доведите камеру до −150 °C.',
    'После охлаждения выключите A и удерживайте давление 48–70 bar.',
    'Для заправки включите C и оставьте B включённым.',
    'Если давление растёт слишком сильно, коротко нажмите D.'
  ];
  this.toast(tips[Math.min(this._hint++,tips.length-1)]);
};

Scene_BFNitrogen.prototype.input=function(){
  if(Input.isTriggered('escape')){SceneManager.pop();return;}
  if(Input.isTriggered('r')){this.reset();return;}
  if(Input.isTriggered('s')){this.hint();return;}
  if(Input.isTriggered('1')||Input.isTriggered('a')){this.toggle('A');return;}
  if(Input.isTriggered('2')||Input.isTriggered('b')){this.toggle('B');return;}
  if(Input.isTriggered('3')||Input.isTriggered('c')){this.toggle('C');return;}
  if(Input.isTriggered('4')||Input.isTriggered('d')){this.toggle('D');return;}

  var p=this.mouse(),rs=this.buttonRects(),ks=['A','B','C','D'];this._hoverKey='';
  for(var i=0;i<ks.length;i++){if(this.hit(p.x,p.y,rs[ks[i]],6)){this._hoverKey=ks[i];break;}}
  if(this._won||this._lost){if(Input.isTriggered('ok')||TouchInput.isTriggered())SceneManager.pop();return;}
  if(TouchInput.isTriggered()){
    for(var j=0;j<ks.length;j++){
      var k=ks[j];if(this.hit(p.x,p.y,rs[k],10)){this._pressedKey=k;this._pressedT=10;this.toggle(k);return;}
    }
  }
};

Scene_BFNitrogen.prototype.panel=function(b,x,y,w,h,title,sub){
  rr(b,x,y,w,h,18,'#10191e','#536b75',2);
  rr(b,x+8,y+8,w-16,h-16,13,'#091116','#263b44',1);
  this.text(b,title,x+20,y+16,w-40,22,17,'#e8f2f5','left',700);
  if(sub)this.text(b,sub,x+20,y+40,w-40,18,11,'#88a0a9','left',500);
};

Scene_BFNitrogen.prototype.drawButton=function(b,k,r,on,label,sub,danger){
  var hovered=this._hoverKey===k,pressed=this._pressedKey===k&&this._pressedT>0,shift=pressed?3:0;
  var body=danger?(on?'#5d3127':'#252021'):(on?'#225c46':'#253941');
  var edge=danger?(on?'#e08c75':'#775f5a'):(on?'#66d29a':'#6c8791');
  var cap=danger?(on?'#c85c49':'#5a423d'):(on?'#4eb883':'#2f4d59');
  var hi=hovered?'#f3fbff':(on?'#eafff4':'#b9ccd2');

  rr(b,r.x-6,r.y-6,r.w+12,r.h+12,14,'#15191c','#3d4d52',2);
  circle(b,r.x+12,r.y+12,4,'#819196');circle(b,r.x+r.w-12,r.y+12,4,'#819196');
  circle(b,r.x+12,r.y+r.h-12,4,'#819196');circle(b,r.x+r.w-12,r.y+r.h-12,4,'#819196');
  rr(b,r.x,r.y+shift,r.w,r.h,15,body,hovered?'#dcebf0':edge,3);
  rr(b,r.x+9,r.y+9+shift,r.w-18,52,12,cap,hi,2);
  this.text(b,k,r.x+12,r.y+17+shift,r.w-24,31,25,on?'#05100b':'#f1f6f8','center',800);
  this.text(b,label,r.x+7,r.y+68+shift,r.w-14,18,12,'#f0f6f8','center',700);
  this.text(b,sub,r.x+7,r.y+86+shift,r.w-14,16,10,on?(danger?'#ffc5b9':'#a8efd0'):'#8aa0a8','center',500);
};

Scene_BFNitrogen.prototype.gauge=function(b,x,y,w,h,label,val,min,max,goodA,goodB,unit){
  rr(b,x,y,w,h,11,'#091318','#2d4651',2);
  this.text(b,label,x+14,y+10,w-28,18,11,'#82a0ab','left',700);
  this.text(b,Math.round(val)+' '+unit,x+14,y+31,w-28,28,21,'#f2f7f8','left',700);
  var bx=x+14,by=y+h-17,bw=w-28;b.fillStyle='#050b0f';b.fillRect(bx,by,bw,8);
  if(goodA!=null){var ga=clamp((goodA-min)/(max-min),0,1),gb=clamp((goodB-min)/(max-min),0,1);b.fillStyle='#28563e';b.fillRect(bx+bw*ga,by,bw*(gb-ga),8);}
  var f=clamp((val-min)/(max-min),0,1);b.fillStyle=(goodA!=null&&val>=goodA&&val<=goodB)?'#83d89b':'#58bfd4';b.fillRect(bx,by,bw*f,8);
};

Scene_BFNitrogen.prototype.drawProcessScreen=function(b,x,y,w,h){
  this.panel(b,x,y,w,h,'ЭКРАН ПРОЦЕССА','СЛЕДИТЕ ЗА ПОТОКОМ · ТЕМПЕРАТУРОЙ · ДАВЛЕНИЕМ');
  var sx=x+24,sy=y+70,cold=this._temp<=-150,press=this._pressure>=48&&this._pressure<=70,A=this._valves.A,B=this._valves.B,C=this._valves.C,D=this._bleedPulse>0;

  rr(b,sx,sy,w-48,40,10,'#071014','#28434e',1);
  var state=this._state==='COOL'?'ОХЛАЖДЕНИЕ':this._state==='PRESSURE'?'СТАБИЛИЗАЦИЯ':this._state==='FILL'?'ЗАПРАВКА':'ГОТОВО';
  this.text(b,'ПРОЦЕСС: '+state,sx+14,sy+10,w-220,18,13,this._won?'#8fe3a0':'#dbecef','left',700);
  this.text(b,this._alarm,sx+w-210,sy+10,195,18,12,this._alarm==='НОРМА'?'#8ee3a0':'#ef9a87','right',700);

  var py=sy+119;
  var p1=sx+34,p2=sx+180,p3=sx+352,p4=sx+525,p5=sx+652;
  rr(b,p1-30,py-42,100,84,11,'#19303a','#607d88',2);this.text(b,'N₂',p1-27,py-21,94,27,26,'#f0fbfd','center',700);this.text(b,'ГАЗ',p1-27,py+11,94,16,10,'#9ab1b9','center',600);
  var pipe=function(x1,x2,on,col){line(b,x1,py,x2,py,'#071013',22);line(b,x1,py,x2,py,on?col:'#2a3b42',12);if(on){for(var q=0;q<5;q++){var t=(this._frame*.01+q*.2)%1;circle(b,x1+(x2-x1)*t,py,3,'#dbfbff');}}}.bind(this);
  pipe(p1+70,p2,A,'#55c3dc');
  rr(b,p2-12,py-44,138,88,10,A?'#1c3e49':'#17252b','#5e7a84',2);this.text(b,'ПРЕДОХЛАД.',p2-2,py-27,118,18,12,'#e0eef2','center',700);this.text(b,'−80 → −120 °C',p2-2,py+2,118,18,12,A?'#a0ebf4':'#82969d','center',600);
  pipe(p2+126,p3,A&&B,'#55c3dc');
  rr(b,p3-10,py-44,138,88,10,A&&B?'#173b47':'#17252b','#5e7a84',2);this.text(b,'ГЛУБОКИЙ ХОЛОД',p3,py-27,118,18,11,'#e0eef2','center',700);this.text(b,'ДО −170 °C',p3,py+2,118,18,12,A&&B?'#a0ebf4':'#82969d','center',600);
  pipe(p3+128,p4,B,'#55c3dc');
  rr(b,p4-4,py-50,122,100,12,cold?'#173d4a':'#18272e',cold?'#86dde8':'#5f7781',2);this.text(b,'КАМЕРА',p4+6,py-31,100,18,11,'#e0eef2','center',700);this.text(b,Math.round(this._temp)+' °C',p4+6,py-5,100,27,21,cold?'#9ae9f4':'#f1c878','center',700);this.text(b,cold?'ГОТОВО':'ОХЛАЖДЕНИЕ',p4+6,py+26,100,15,9,cold?'#91dfa0':'#a4b1b5','center',700);

  line(b,p4+56,py+50,p4+56,py+122,'#071013',22);line(b,p4+56,py+50,p4+56,py+122,C&&cold&&press?'#d7ab68':'#2d3c42',12);
  line(b,p4+56,py+122,p5-22,py+122,'#071013',22);line(b,p4+56,py+122,p5-22,py+122,C&&cold&&press?'#d7ab68':'#2d3c42',12);
  rr(b,p5-22,py+92,96,80,10,'#122028','#5e7882',2);this.text(b,'БАЛЛОН',p5-14,py+102,80,17,10,'#e0edf0','center',700);this.text(b,Math.floor(this._fill)+' %',p5-12,py+125,76,25,19,'#f0fafb','center',700);b.fillStyle='#050b0e';b.fillRect(p5-2,py+153,58,7);b.fillStyle='#7cd8ea';b.fillRect(p5-2,py+153,58*this._fill/100,7);

  line(b,p3+58,py+44,p3+58,py+150,'#071013',18);line(b,p3+58,py+44,p3+58,py+150,D?'#db7660':'#2d3c42',10);this.text(b,'D · СБРОС',p3+13,py+150,88,18,10,D?'#ffb5a4':'#83969e','center',700);

  var gy=sy+304,gap=12,gw=(w-48-gap*2)/3;
  this.gauge(b,sx,gy,gw,78,'ТЕМПЕРАТУРА',this._temp,-180,-50,-180,-150,'°C');
  this.gauge(b,sx+gw+gap,gy,gw,78,'ДАВЛЕНИЕ',this._pressure,0,100,48,70,'bar');
  this.gauge(b,sx+(gw+gap)*2,gy,gw,78,'ЗАПРАВКА',this._fill,0,100,75,100,'%');

  rr(b,sx,gy+91,w-48,66,10,'#091318','#2a414c',2);
  this.text(b,'СОСТОЯНИЕ',sx+14,gy+102,105,16,10,'#7d98a1','left',700);
  this.text(b,this._msg,sx+14,gy+124,w-200,20,12,'#e4eef1','left',700);
  this.text(b,'СТАБИЛЬНОСТЬ '+Math.round(this._stability)+' %',sx+w-165,gy+122,145,20,11,this._stability>=50?'#8ce0a0':'#ef9d86','right',700);
};

Scene_BFNitrogen.prototype.drawConsole=function(b){
  var x=914,y=24,w=340,h=666;
  rr(b,x,y,w,h,22,'#141a1e','#6c7f85',3);rr(b,x+10,y+10,w-20,h-20,18,'#242a2d','#0b1013',2);
  rr(b,x+22,y+22,w-44,60,13,'#3c2c24','#92796a',2);
  this.text(b,'CRYO CONTROL',x+35,y+32,w-70,22,19,'#f4eadd','center',800);
  this.text(b,'ПУЛЬТ ОПЕРАТОРА',x+35,y+56,w-70,16,10,'#c7ad9c','center',700);

  rr(b,x+24,y+96,w-48,110,12,'#071014','#6b7e84',2);
  this.text(b,'SYSTEM MONITOR',x+40,y+108,w-80,16,10,'#7897a1','left',700);
  var cold=this._temp<=-150,press=this._pressure>=48&&this._pressure<=70;
  this.text(b,Math.round(this._temp)+' °C',x+40,y+134,92,27,21,cold?'#91e3a2':'#efc777','left',700);
  this.text(b,this._pressure.toFixed(0)+' bar',x+142,y+134,104,27,21,press?'#91e3a2':'#efc777','center',700);
  this.text(b,Math.floor(this._fill)+' %',x+246,y+134,58,27,21,'#d2f0f6','right',700);
  this.text(b,this._alarm,x+40,y+172,w-80,16,10,this._alarm==='НОРМА'?'#8de09c':'#ef9a85','center',700);

  line(b,x+24,y+220,x+w-24,y+220,'#4a5b61',2);
  this.text(b,'УПРАВЛЕНИЕ',x+28,y+237,w-56,18,11,'#bed0d5','center',700);

  var rs=this.buttonRects();
  this.drawButton(b,'A',rs.A,this._valves.A,'ПОДАЧА','газ в контур',false);
  this.drawButton(b,'B',rs.B,this._valves.B,'ОХЛАЖДЕНИЕ','глубокий холод',false);
  this.drawButton(b,'C',rs.C,this._valves.C,'БАЛЛОН','заправка',false);
  this.drawButton(b,'D',rs.D,this._bleedPulse>0,'СБРОС','сброс давления',true);

  circle(b,x+48,y+624,10,this._alarm==='НОРМА'?'#67d493':'#ea805f','#b7ced3',2);
  this.text(b,'СИСТЕМА',x+66,y+612,72,17,10,'#86a1aa','left',700);
  this.text(b,this._alarm,x+66,y+632,110,17,10,this._alarm==='НОРМА'?'#8de09c':'#ef9a84','left',700);
  this.text(b,'1  2  3  4',x+220,y+622,84,18,10,'#8ea2aa','center',600);
};

Scene_BFNitrogen.prototype.redrawMobile=function(ctx){
  var b=this._bmp;if(!b)return;var w=480,h=854;
  rr(b,0,0,w,h,0,'#05090c',null,0);
  this.text(b,'КРИОУСТАНОВКА',20,18,440,30,24,'#f1f7f8','left',800);
  this.text(b,'ПОЛУЧЕНИЕ ЖИДКОГО АЗОТА',20,49,440,18,11,'#8aa1a9','left',600);
  rr(b,14,80,452,418,16,'#0c171c','#607a84',2);
  this.text(b,'ЭКРАН ПРОЦЕССА',28,96,210,20,15,'#e0edf0','left',700);
  var st=this._state==='COOL'?'ОХЛАЖДЕНИЕ':this._state==='PRESSURE'?'СТАБИЛИЗАЦИЯ':this._state==='FILL'?'ЗАПРАВКА':'ГОТОВО';
  this.text(b,st,28,121,250,20,14,this._won?'#8fe3a0':'#dbecef','left',700);
  rr(b,28,153,424,94,10,'#081115','#263f48',2);
  this.text(b,'ТЕМПЕРАТУРА',42,167,145,16,10,'#7d98a2','left',700);this.text(b,Math.round(this._temp)+' °C',42,187,150,32,25,this._temp<=-150?'#8fe2a2':'#efc777','left',700);
  this.text(b,'ДАВЛЕНИЕ',210,167,105,16,10,'#7d98a2','left',700);this.text(b,Math.round(this._pressure)+' bar',210,187,125,32,25,(this._pressure>=48&&this._pressure<=70)?'#8fe2a2':'#efc777','left',700);
  this.text(b,'N₂',365,167,52,16,10,'#7d98a2','center',700);this.text(b,Math.floor(this._fill)+' %',350,187,82,32,25,'#cfeff5','center',700);
  var y=294;line(b,44,y,436,y,'#091014',24);line(b,44,y,436,y,(this._valves.A||this._valves.B)?'#4eb9d2':'#2f3e45',12);
  rr(b,34,256,96,76,10,'#192c35','#597580',2);this.text(b,'N₂',44,273,76,24,22,'#effafd','center',700);this.text(b,'ПОДАЧА',44,301,76,16,9,'#93aab2','center',700);
  rr(b,150,256,180,76,10,(this._valves.A&&this._valves.B)?'#173944':'#17252b','#597783',2);this.text(b,'ОХЛАЖДЕНИЕ',160,272,160,18,12,'#d8edf2','center',700);this.text(b,this._valves.B?'АКТИВНО':'ВЫКЛ',160,298,160,16,10,this._valves.B?'#8fe3a0':'#81969e','center',700);
  rr(b,350,256,96,76,10,this._valves.C&&this._temp<=-150?'#3c3422':'#17252b',this._valves.C&&this._temp<=-150?'#c9aa72':'#597783',2);this.text(b,'БАЛЛОН',358,272,80,18,10,'#d8edf2','center',700);this.text(b,Math.floor(this._fill)+' %',358,295,80,22,17,'#eef9fa','center',700);
  rr(b,28,347,424,94,10,'#091318','#2a414d',2);this.text(b,'СОСТОЯНИЕ',42,360,105,16,10,'#7d98a2','left',700);
  this.text(b,this._lost?'АВАРИЯ — НАЖМИТЕ R.':this._won?'ЖИДКИЙ АЗОТ ПОЛУЧЕН':this._msg,42,383,392,42,13,this._lost?'#ef9e86':this._won?'#8fe3a0':'#dbeaf0','left',700);
  this.text(b,'СТАБИЛЬНОСТЬ '+Math.round(this._stability)+' %',42,419,392,16,10,this._stability>=50?'#8bdfa0':'#ef9e86','right',700);
  rr(b,14,520,452,320,20,'#161b1f','#748389',3);rr(b,24,530,432,300,16,'#22282c','#0a0f12',2);
  rr(b,40,548,400,48,10,'#3b2c24','#93796a',2);this.text(b,'CRYO CONTROL',52,557,376,20,17,'#f2e8dd','center',800);this.text(b,'ПУЛЬТ ОПЕРАТОРА',52,580,376,14,9,'#c4ab9c','center',700);
  var rs=this.buttonRects();this.drawButton(b,'A',rs.A,this._valves.A,'ПОДАЧА','газ',false);this.drawButton(b,'B',rs.B,this._valves.B,'ОХЛАЖДЕНИЕ','холод',false);this.drawButton(b,'C',rs.C,this._valves.C,'БАЛЛОН','заправка',false);this.drawButton(b,'D',rs.D,this._bleedPulse>0,'СБРОС','давление',true);
  this.text(b,'1 / 2 / 3 / 4 · S подсказка · R сброс',34,832,412,16,9,'#78929c','center',600);
  if(this._won||this._lost){var c=b._context;c.save();c.globalAlpha=.76;c.fillStyle='#000';c.fillRect(0,0,w,h);c.restore();rr(b,42,330,396,170,18,this._won?'#17392a':'#341c18',this._won?'#79b994':'#ae6d60',3);this.text(b,this._won?'ЖИДКИЙ АЗОТ ПОЛУЧЕН':'АВАРИЙНАЯ ОСТАНОВКА',58,366,364,30,23,this._won?'#a9e9b9':'#f2a194','center',800);this.text(b,this._won?'Баллон заполнен.':'Нажмите R для повторной попытки.',72,410,336,22,13,'#e2eef1','center',600);this.text(b,'ЛКМ / ENTER — выйти',72,451,336,20,12,'#a9bec6','center',600);}
};

Scene_BFNitrogen.prototype.redraw=function(){
  var b=this._bmp;if(!b)return;
  var v=this._view||{s:1,ox:0,oy:0,vw:DESIGN_W,vh:DESIGN_H};
  var c=b._context;c.save();
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,b.width,b.height);
  c.translate(v.ox,v.oy);c.scale(v.s,v.s);
  if(this._mobileLayout){this.redrawMobile(c);c.restore();if(b._setDirty)b._setDirty();return;}
  b.fillStyle='#05090c';b.fillRect(0,0,DESIGN_W,DESIGN_H);
  rr(b,18,16,884,688,20,'#10191e','#1e3038',2);
  this.text(b,'КРИОУСТАНОВКА',38,30,500,32,30,'#edf7fa','left',800);
  this.text(b,'ОПЕРАТОРСКИЙ КОНТУР · ПОЛУЧЕНИЕ ЖИДКОГО АЗОТА',40,63,560,18,12,'#8ca4ad','left',600);
  this.drawProcessScreen(b,34,96,848,566);
  this.drawConsole(b);
  if(this._toastT>0){rr(b,48,672,820,28,8,'#0a151a','#405b66',1);this.text(b,this._toast,60,678,796,16,11,'#d9eef3','center',700);}
  if(this._won||this._lost){c.save();c.globalAlpha=.76;c.fillStyle='#000';c.fillRect(0,0,DESIGN_W,DESIGN_H);c.restore();rr(b,240,246,570,188,20,this._won?'#17392a':'#341c18',this._won?'#79b994':'#ae6d60',3);this.text(b,this._won?'ЖИДКИЙ АЗОТ ПОЛУЧЕН':'АВАРИЙНАЯ ОСТАНОВКА',270,280,510,38,27,this._won?'#a9e9b9':'#f2a194','center',800);this.text(b,this._won?'Баллон заполнен. Система стабилизирована.':'Нажмите R для повторной попытки.',300,328,450,26,15,'#e2eef1','center',600);this.text(b,'ENTER / ЛКМ — выйти',300,382,450,22,13,'#a9bec6','center',600);}
  c.restore();if(b._setDirty)b._setDirty();
};

Scene_BFNitrogen.prototype.update=function(){
  Scene_Base.prototype.update.call(this);
  this._frame++;this.resizeWorld();
  if(!this._won&&!this._lost)this.updatePhysics(1/60);
  this.input();
  if(this._toastT>0)this._toastT--;
  if(this._pressedT>0){this._pressedT--;if(this._pressedT===0)this._pressedKey='';}
  this.redraw();
};

Scene_BFNitrogen.prototype._complete=function(){
  if(!this._won||this._successApplied)return;this._successApplied=true;
  try{if(window.BF_Inventory&&typeof window.BF_Inventory.game==='function')window.BF_Inventory.game().add('nitrogen',1);}catch(e){}
  try{if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.game==='function')window.BF_QuestSystem.game().setStep('engineer',1);}catch(e){}
  if(window.$gameVariables)$gameVariables.setValue(10,6);
  if(ORIGIN.mapId&&ORIGIN.eventId)$gameSelfSwitches.setValue([ORIGIN.mapId,ORIGIN.eventId,'A'],true);
};

var _BFNitrogen_pluginCommand=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
  _BFNitrogen_pluginCommand.call(this,command,args);
  var c=String(command||'').toLowerCase(),a=(args||[]).map(function(v){return String(v||'').toLowerCase();});
  if(c==='nitrogen'&&(!a.length||a[0]==='start')){ORIGIN.mapId=this._mapId||($gameMap?$gameMap.mapId():0);ORIGIN.eventId=this._eventId||0;this.setWaitMode('bfNitrogenWait');SceneManager.push(Scene_BFNitrogen);}
};
var _BFNitrogen_wait=Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode=function(){if(this._waitMode==='bfNitrogenWait')return SceneManager._scene instanceof Scene_BFNitrogen;return _BFNitrogen_wait.call(this);};
window.BF_Nitrogen_Start=function(){ORIGIN.mapId=$gameMap.mapId();ORIGIN.eventId=0;SceneManager.push(Scene_BFNitrogen);};
window.Scene_NitrogenV6=Scene_BFNitrogen;window.Scene_NitrogenV7=Scene_BFNitrogen;
})();
