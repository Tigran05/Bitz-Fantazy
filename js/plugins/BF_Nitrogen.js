/*:
 * @plugindesc BitzFantasy — Nitrogen V6. Реальная мини-игра с ручным вентилем, инерцией, риском и таймингами.
 * @help
 * Plugin Command: Nitrogen start
 * Успех: Variable 12 +1, Self Switch A ON.
 * Мышь/сенсор. Игрок не нажимает готовые кнопки: он вращает вентиль и управляет процессом.
 */
(function(){
'use strict';
var BF={mapId:0,eventId:0};
var _pc=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
 _pc.call(this,command,args);
 if(String(command).toLowerCase()==='nitrogen' && String(args&&args[0]).toLowerCase()==='start'){
   BF.mapId=this._mapId; BF.eventId=this._eventId; SceneManager.push(Scene_NitrogenV6);
 }
};

function Scene_NitrogenV6(){this.initialize.apply(this,arguments)}
Scene_NitrogenV6.prototype=Object.create(Scene_Base.prototype);
Scene_NitrogenV6.prototype.constructor=Scene_NitrogenV6;
Scene_NitrogenV6.prototype.initialize=function(){
 Scene_Base.prototype.initialize.call(this); this._mx=0;this._my=0;this._drag=false;this._lastA=0;
 this._pressure=18;this._temp=-92;this._fill=0;this._valve=0;this._stability=100;this._time=90;
 this._fault=null;this._faultT=0;this._message='Поверни вентиль и держи давление в зелёной зоне';this._won=false;this._lost=false;this._started=false;
};
Scene_NitrogenV6.prototype.create=function(){Scene_Base.prototype.create.call(this);this.createWindowLayer();this.createHud();this._started=true;};
Scene_NitrogenV6.prototype.createHud=function(){
 this._g=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));this.addChild(this._g);this.redraw();
};
Scene_NitrogenV6.prototype.redraw=function(){
 var b=this._g.bitmap,w=Graphics.boxWidth,h=Graphics.boxHeight;b.clear();
 b.fillRect(0,0,w,h,'#111820');b.fillRect(0,0,w,82,'#18232d');
 b.textColor='#eaf6ff';b.fontSize=28;b.drawText('ЖИДКИЙ АЗОТ — РУЧНОЕ УПРАВЛЕНИЕ',24,15,700,36,'left');
 b.fontSize=18;b.textColor='#9fb2c2';b.drawText('Не угадывай кнопку — управляй установкой.',24,48,700,25,'left');
 // tank
 b.fillRect(70,150,190,400,'#263640');b.fillRect(90,170,150,360,'#0b1115');
 var fh=350*this._fill/100;b.fillRect(92,528-fh,146,fh,'#86d9ef');
 b.strokeRect(70,150,190,400,'#78909c');b.fontSize=20;b.textColor='#fff';b.drawText('БАЛЛОН',92,565,150,28,'center');b.drawText(Math.floor(this._fill)+' %',92,300,146,30,'center');
 // pressure gauge
 b.fillRect(330,145,330,85,'#202d36');b.fontSize=18;b.textColor='#fff';b.drawText('ДАВЛЕНИЕ',350,157,150,25,'left');
 var px=350,py=198,pw=285;b.fillRect(px,py,pw,12,'#394a55');b.fillRect(px+pw*.45,py,pw*.25,12,'#62b36b');var knob=Math.max(0,Math.min(1,this._pressure/100));b.fillRect(px,py,pw*knob,12,'#d8edf5');b.fontSize=22;b.drawText(this._pressure.toFixed(1)+' bar',500,155,140,30,'right');
 // temp
 b.fillRect(330,250,330,85,'#202d36');b.fontSize=18;b.drawText('ТЕМПЕРАТУРА',350,262,170,25,'left');b.fontSize=22;b.drawText(this._temp.toFixed(0)+' °C',500,260,140,30,'right');
 var tc=Math.max(0,Math.min(1,(-this._temp-80)/110));b.fillRect(350,303,285,12,'#394a55');b.fillRect(350,303,285*tc,12,'#82cde1');
 // valve
 var vx=500,vy=455,r=76;b.fillCircle(vx,vy,r,'#344955');b.strokeCircle(vx,vy,r,'#a9c3d0');
 var ang=-Math.PI*.75 + this._valve*Math.PI*1.5;b.fillRect(vx-7,vy-64,14,64,'#e1edf2');b.rotation=0; // draw rotated handle via polygon
 var x2=vx+Math.cos(ang)*58,y2=vy+Math.sin(ang)*58;b.fillCircle(vx,vy,11,'#d7e7ed');b.fillCircle(x2,y2,16,'#d7e7ed');
 b.fontSize=18;b.textColor='#fff';b.drawText('ВЕНТИЛЬ',425,555,150,26,'center');b.textColor='#a8bac6';b.drawText('тяни мышью по кругу',390,580,220,24,'center');
 // status
 b.fillRect(710,145,Graphics.boxWidth-750,385,'#202d36');b.fontSize=20;b.textColor='#fff';b.drawText('СОСТОЯНИЕ',735,160,260,28,'left');
 b.fontSize=18;b.textColor=this._pressure>=45&&this._pressure<=72?'#8fe09a':'#ff9b7d';b.drawText('Давление: '+(this._pressure>=45&&this._pressure<=72?'НОРМА':'ОПАСНО'),735,205,300,26,'left');
 b.textColor=this._temp<=-150?'#8fe09a':'#ffcc76';b.drawText('Охлаждение: '+(this._temp<=-150?'ГОТОВО':'ИДЁТ'),735,245,300,26,'left');
 b.textColor=this._stability>60?'#8fe09a':this._stability>25?'#ffcc76':'#ff8c78';b.drawText('Стабильность: '+Math.floor(this._stability)+'%',735,285,300,26,'left');
 b.textColor='#fff';b.drawText('Время: '+this._time.toFixed(1)+' s',735,325,300,26,'left');
 b.fontSize=17;b.textColor='#c7d4dc';b.drawText('Заполнение идёт только при',735,375,300,24,'left');b.drawText('давлении 45–72 bar.',735,400,300,24,'left');
 if(this._fault){b.textColor='#ff725f';b.fontSize=23;b.drawText('АВАРИЯ: '+this._fault,735,445,360,30,'left');b.fontSize=16;b.textColor='#ffb1a5';b.drawText('быстро стабилизируй установку!',735,475,350,24,'left');}
 b.fontSize=19;b.textColor='#dce8ef';b.drawText(this._message,24,620,w-48,32,'center');
};
Scene_NitrogenV6.prototype.update=function(){
 Scene_Base.prototype.update.call(this);if(!this._started)return;
 this._readMouse();
 if(this._won||this._lost){if(Input.isTriggered('ok')||TouchInput.isTriggered()){SceneManager.pop();}return;}
 var dt=1/60;this._time-=dt;
 // Valve position controls flow continuously. Center-ish is stable; extremes are dangerous.
 var target=this._valve;
 var flow=(target-.50)*38; // signed valve effect
 this._pressure += flow*dt;
 this._pressure += (this._pressure-55)*0.012*dt*(-1); // weak return inertia
 this._pressure=Math.max(0,Math.min(100,this._pressure));
 // cooling improves when valve opened enough; overheating if pressure too high
 this._temp -= Math.max(0,(this._valve-.22))*0.48*dt;
 this._temp += Math.max(0,this._pressure-78)*0.20*dt;
 // fill only in a narrow window, so timing matters
 if(this._pressure>=45&&this._pressure<=72&&this._temp<=-150){this._fill += 5.0*dt;this._message='Держи вентиль! Сейчас идёт заправка — не сорви давление.';}
 else if(this._fill<96){this._message=this._pressure<45?'Мало давления — чуть приоткрой вентиль.':this._pressure>72?'Слишком высокое давление — прикрой вентиль!':this._temp>-150?'Установка ещё слишком тёплая — держи режим.':'Лови стабильную зону.';}
 // stability damage outside safe zone
 var risk=0;if(this._pressure<35||this._pressure>82)risk+=10;if(this._temp>-125)risk+=3;if(this._pressure>90)risk+=25;this._stability-=risk*dt;this._stability=Math.max(0,this._stability);
 // random faults every 8-14 sec
 this._lastA+=dt;if(!this._fault&&this._lastA>8+Math.random()*6){this._lastA=0;var fs=['УТЕЧКА','ОБМЕРЗАНИЕ ВЕНТИЛЯ','СКАЧОК ДАВЛЕНИЯ','ПЕРЕГРЕВ'];this._fault=fs[Math.floor(Math.random()*fs.length)];this._faultT=4+Math.random()*3;}
 if(this._fault){this._faultT-=dt;
   if(this._fault==='УТЕЧКА'){this._pressure-=7*dt;this._fill-=2.2*dt;}
   if(this._fault==='ОБМЕРЗАНИЕ ВЕНТИЛЯ'){this._pressure+=(this._valve>.55?5:-5)*dt;}
   if(this._fault==='СКАЧОК ДАВЛЕНИЯ'){this._pressure+=9*dt;}
   if(this._fault==='ПЕРЕГРЕВ'){this._temp+=5*dt;}
   // counter-actions are inferred from physical manipulation, not a button
   var fixed=(this._fault==='УТЕЧКА'&&this._valve>.62)||(this._fault==='ОБМЕРЗАНИЕ ВЕНТИЛЯ'&&this._valve<.38)||(this._fault==='СКАЧОК ДАВЛЕНИЯ'&&this._valve<.40)||(this._fault==='ПЕРЕГРЕВ'&&this._valve<.45);
   if(fixed){this._fault=null;this._message='Авария устранена. Продолжай контролировать установку.';this._stability=Math.min(100,this._stability+5);}
   else if(this._faultT<=0){this._stability-=18;this._fault=null;}
 }
 if(this._pressure>96){this._lost=true;this._message='РАЗРЫВ СИСТЕМЫ — давление стало критическим.';}
 if(this._stability<=0||this._time<=0){this._lost=true;this._message=this._time<=0?'ВРЕМЯ ВЫШЛО.':'УСТАНОВКА ПОТЕРЯНА.';}
 if(this._fill>=96&&this._pressure>=45&&this._pressure<=72&&this._temp<=-150&&this._stability>25){this._won=true;this._fill=100;this._message='УСПЕХ! Баллон заполнен. Ты удержал установку в режиме.';this._complete();}
 this.redraw();
};
Scene_NitrogenV6.prototype._readMouse=function(){
 var x=TouchInput.x,y=TouchInput.y; if(TouchInput.isTriggered()){
   var dx=x-500,dy=y-455;if(Math.sqrt(dx*dx+dy*dy)<100)this._drag=true;
 }
 if(!TouchInput.isPressed())this._drag=false;
 if(this._drag){var a=Math.atan2(y-455,x-500);var v=(a+Math.PI*.75)/(Math.PI*1.5);while(v<0)v+=1;while(v>1)v-=1;this._valve=Math.max(0,Math.min(1,v));}
};
Scene_NitrogenV6.prototype._complete=function(){
 $gameVariables.setValue(12,$gameVariables.value(12)+1);if(BF.eventId>0){var key=[BF.mapId,BF.eventId,'A'];$gameSelfSwitches.setValue(key,true);}
};
Scene_NitrogenV6.prototype.terminate=function(){Scene_Base.prototype.terminate.call(this);};
window.Scene_NitrogenV6=Scene_NitrogenV6;
})();
