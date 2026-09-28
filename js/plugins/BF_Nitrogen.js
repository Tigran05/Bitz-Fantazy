/*:
 * @plugindesc Bitz Fantasy — BF_Nitrogen V7. Понятная мини-игра получения жидкого азота.
 * @help
 * Управление только одним вентилем:
 * 1) ОТКРЫТЬ вентиль — охладить систему до -150 C.
 * 2) ПРИКРЫТЬ вентиль — выставить давление 45–72 bar.
 * 3) УДЕРЖИВАТЬ давление в зелёной зоне — баллон заполнится автоматически.
 * Успех: engineer -> шаг 1, Variable 10 = 6, Self Switch A ON.
 */
(function(){
'use strict';
function circle(b,x,y,r,fill,stroke,lw){var c=b._context;if(!c)return;c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}c.restore();if(b._setDirty)b._setDirty();}
function rect(b,x,y,w,h,stroke,lw){var c=b._context;if(!c)return;c.save();c.strokeStyle=stroke;c.lineWidth=lw||2;c.strokeRect(x,y,w,h);c.restore();if(b._setDirty)b._setDirty();}
var BF={mapId:0,eventId:0};
var _pc=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){_pc.call(this,command,args);if(String(command).toLowerCase()==='nitrogen'&&String(args&&args[0]).toLowerCase()==='start'){BF.mapId=this._mapId;BF.eventId=this._eventId;SceneManager.push(Scene_NitrogenV7);}};
function Scene_NitrogenV7(){this.initialize.apply(this,arguments)}
Scene_NitrogenV7.prototype=Object.create(Scene_Base.prototype);Scene_NitrogenV7.prototype.constructor=Scene_NitrogenV7;
Scene_NitrogenV7.prototype.initialize=function(){
 Scene_Base.prototype.initialize.call(this);
 this._mx=0;this._my=0;this._drag=false;
 this._pressure=18;this._temp=-92;this._fill=0;this._valve=.35;this._time=120;this._stability=100;
 this._stage=0;this._won=false;this._lost=false;this._started=false;this._hold=0;
 this._message='Открой вентиль: тяни ручку ПО ЧАСОВОЙ стрелке до зелёной зоны.';
};
Scene_NitrogenV7.prototype.create=function(){Scene_Base.prototype.create.call(this);this.createWindowLayer();this.createHud();this._started=true;};
Scene_NitrogenV7.prototype.createHud=function(){this._g=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));this.addChild(this._g);this.redraw();};
Scene_NitrogenV7.prototype.redraw=function(){
 var b=this._g.bitmap,w=Graphics.boxWidth,h=Graphics.boxHeight;b.clear();
 b.fillRect(0,0,w,h,'#101820');b.fillRect(0,0,w,92,'#18252f');
 b.textColor='#eaf6ff';b.fontSize=28;b.drawText('ПОЛУЧЕНИЕ ЖИДКОГО АЗОТА',24,12,700,34,'left');
 b.fontSize=16;b.textColor='#a9bcc8';b.drawText('Здесь нужен только один орган управления — РУЧНОЙ ВЕНТИЛЬ.',24,51,720,24,'left');
 // stages
 var st=[['1','ОХЛАДИТЬ','до −150 °C'],['2','ДАВЛЕНИЕ','45–72 bar'],['3','ЗАПРАВИТЬ','100 %']];
 for(var i=0;i<3;i++){var x=24+i*250,active=i===this._stage,done=i<this._stage;b.fillRect(x,104,230,50,done?'#244b3a':active?'#31546a':'#202d36');b.fontSize=15;b.textColor=done?'#9ce8ae':active?'#fff':'#81919b';b.drawText(st[i][0]+'. '+st[i][1],x+12,111,205,20,'left');b.fontSize=13;b.textColor=done?'#9ce8ae':active?'#b9d8e8':'#71818b';b.drawText(st[i][2],x+12,132,205,18,'left');}
 // left: tank and process arrows
 b.fillRect(55,180,170,280,'#263640');b.fillRect(72,198,136,244,'#0b1115');var fh=226*this._fill/100;b.fillRect(74,440-fh,132,fh,'#86d9ef');rect(b,55,180,170,280,'#78909c',2);b.fontSize=19;b.textColor='#fff';b.drawText('БАЛЛОН',67,468,146,26,'center');b.fontSize=22;b.drawText(Math.floor(this._fill)+' %',67,300,146,32,'center');b.fontSize=13;b.textColor='#9fb2c2';b.drawText('заправка',67,332,146,20,'center');
 b.fontSize=15;b.textColor='#b8d7e2';b.drawText('ХОЛОДИЛЬНИК',55,475,170,22,'center');b.drawText('↓',125,496,30,24,'center');b.textColor=this._temp<=-150?'#8fe09a':'#ffcc76';b.drawText(this._temp.toFixed(0)+' °C',67,518,146,24,'center');
 // gauges
 b.fillRect(240,180,290,100,'#202d36');b.fontSize=17;b.textColor='#fff';b.drawText('ДАВЛЕНИЕ',260,193,130,22,'left');b.fontSize=20;b.drawText(this._pressure.toFixed(1)+' bar',415,191,105,28,'right');var px=260,py=230,pw=250;b.fillRect(px,py,pw,17,'#394a55');b.fillRect(px+pw*.45,py,pw*.27,17,'#3f8b57');b.fillRect(px,py,pw*Math.max(0,Math.min(1,this._pressure/100)),17,'#d8edf5');b.fontSize=12;b.textColor='#a8c2ad';b.drawText('зелёная зона 45–72 bar',260,253,250,18,'center');
 b.fillRect(240,292,290,100,'#202d36');b.fontSize=17;b.textColor='#fff';b.drawText('ОХЛАЖДЕНИЕ',260,305,180,22,'left');var cool=Math.max(0,Math.min(100,((-this._temp)-92)/58*100));b.fillRect(260,343,250,17,'#394a55');b.fillRect(260,343,250*cool/100,17,'#82cde1');b.fontSize=12;b.textColor='#b8d7e2';b.drawText('цель −150 °C',260,365,250,18,'center');
 // valve
 var vx=385,vy=475,r=68;circle(b,vx,vy,r,'#344955','#a9c3d0',3);
 var c=b._context;c.save();c.beginPath();c.arc(vx,vy,r-10,-Math.PI*.85,Math.PI*.25);c.strokeStyle='#69b77b';c.lineWidth=12;c.stroke();c.restore();
 var ang=-Math.PI*.72+this._valve*Math.PI*1.5,x2=vx+Math.cos(ang)*52,y2=vy+Math.sin(ang)*52;circle(b,vx,vy,12,'#d7e7ed');circle(b,x2,y2,16,'#d7e7ed');
 b.fontSize=16;b.textColor='#fff';b.drawText('РУЧНОЙ ВЕНТИЛЬ',315,548,190,22,'center');b.fontSize=12;b.textColor='#a8bac6';b.drawText('ЛКМ: ЗАЖМИ РУЧКУ И ТЯНИ ПО КРУГУ',270,570,230,18,'center');b.textColor='#7fc88e';b.drawText('зелёная дуга = нужное положение',295,590,230,18,'center');
 // right instructions — короткая подсказка без дублирования показателей
 var rx=Math.min(550,w-250),rw=w-rx-24;b.fillRect(rx,180,rw,424,'#202d36');b.fontSize=18;b.textColor='#fff';b.drawText('ЧТО ДЕЛАТЬ',rx+14,195,rw-28,26,'left');
 var title='',body='';
 if(this._stage===0){title='ШАГ 1 — ОХЛАДИТЬ';body='Зажми ЛКМ на ручке и тяни её по часовой стрелке. Открой вентиль до зелёной дуги. Жди −150 °C.';}
 else if(this._stage===1){title='ШАГ 2 — ДАВЛЕНИЕ';body='Поверни вентиль обратно и выставь давление в зелёной зоне: 45–72 bar.';}
 else {title='ШАГ 3 — ЗАПРАВКА';body='Удерживай давление 45–72 bar. Баллон заполнится автоматически до 100%.';}
 b.fontSize=15;b.textColor='#9ce8ae';b.drawText(title,rx+12,236,rw-24,24,'left');b.fontSize=14;b.textColor='#dce8ef';var lines=this._wrap(body,27),yy=274;for(var q=0;q<lines.length;q++){b.drawText(lines[q],rx+12,yy,rw-24,20,'left');yy+=22;}
 b.fontSize=14;b.textColor='#fff';b.drawText('ВЕНТИЛЬ: '+Math.round(this._valve*100)+'%',rx+12,365,rw-24,20,'left');b.textColor=this._pressure>=45&&this._pressure<=72?'#8fe09a':'#ff9b7d';b.drawText('ДАВЛЕНИЕ: '+this._pressure.toFixed(1)+' bar',rx+12,391,rw-24,20,'left');b.textColor=this._temp<=-150?'#8fe09a':'#ffcc76';b.drawText('ТЕМПЕРАТУРА: '+this._temp.toFixed(0)+' °C',rx+12,417,rw-24,20,'left');
 b.fillRect(rx+10,458,rw-20,108,this._stage===2?'#183b2a':'#263640');b.fontSize=13;b.textColor=this._stage===2?'#9ce8ae':'#dce8ef';var m=this._stage===2?'Заправка идёт автоматически.':this._message;var ml=this._wrap(m,27);for(q=0;q<ml.length;q++)b.drawText(ml[q],rx+18,470+q*19,rw-36,19,'left');
 b.fontSize=14;b.textColor='#dce8ef';b.drawText(this._stage===0?'ЦЕЛЬ: ОХЛАДИТЬ':this._stage===1?'ЦЕЛЬ: 45–72 bar':'ЦЕЛЬ: 100 %',24,603,w-48,20,'center');
};
Scene_NitrogenV7.prototype._wrap=function(s,n){var a=s.split(' '),out=[],line='';for(var i=0;i<a.length;i++){var t=line+(line?' ':'')+a[i];if(t.length>n){out.push(line);line=a[i];}else line=t;}if(line)out.push(line);return out;};
Scene_NitrogenV7.prototype.update=function(){
 Scene_Base.prototype.update.call(this);if(!this._started)return;
 this._readMouse();if(this._won||this._lost){if(Input.isTriggered('ok')||TouchInput.isTriggered())SceneManager.pop();return;}
 var dt=1/60;this._time-=dt;
 // Valve is the only control. More open = more cooling, but pressure tends to rise too.
 var open=this._valve;
 this._pressure += ((open*95)-this._pressure)*0.035*dt;
 this._pressure=Math.max(0,Math.min(100,this._pressure));
 if(this._stage===0){this._temp-=Math.max(0,open-.25)*1.35*dt;this._temp+=Math.max(0,this._pressure-88)*0.22*dt;if(this._temp<=-150){this._stage=1;this._message='Отлично! Теперь прикрой вентиль и выставь 45–72 bar.';}}
 else if(this._stage===1){if(this._pressure>=45&&this._pressure<=72){this._stage=2;this._message='Давление в норме. Баллон теперь заполняется сам.';this._hold=0;}else{this._message=this._pressure<45?'Давление низкое — немного открой вентиль.':'Давление высокое — немного прикрой вентиль.';}}
 if(this._stage===2){if(this._pressure>=45&&this._pressure<=72){this._fill+=8.0*dt;this._hold+=dt;}else{this._message=this._pressure<45?'Заправка остановилась: немного открой вентиль.':'Заправка остановилась: немного прикрой вентиль.';}}
 // Keep temperature cold after cooling.
 if(this._stage>=1&&this._temp>-150)this._temp-=0.15*dt;
 if(this._pressure>96)this._stability-=8*dt;if(this._pressure<25)this._stability-=3*dt;this._stability=Math.max(0,this._stability);
 if(this._pressure>96){this._lost=true;this._message='АВАРИЯ: слишком высокое давление.';}
 if(this._time<=0||this._stability<=0){this._lost=true;this._message=this._time<=0?'Время вышло.':'Система нестабильна.';}
 if(this._fill>=100&&this._pressure>=45&&this._pressure<=72&&this._stability>25){this._fill=100;this._won=true;this._message='УСПЕХ! Жидкий азот получен. Нажми экран.';this._complete();}
 this.redraw();
};
Scene_NitrogenV7.prototype._readMouse=function(){var x=TouchInput.x,y=TouchInput.y;if(TouchInput.isTriggered()){var dx=x-385,dy=y-475;if(Math.sqrt(dx*dx+dy*dy)<100)this._drag=true;}if(!TouchInput.isPressed())this._drag=false;if(this._drag){var a=Math.atan2(y-475,x-385),v=(a+Math.PI*.72)/(Math.PI*1.5);while(v<0)v+=1;while(v>1)v-=1;this._valve=Math.max(0,Math.min(1,v));}};
Scene_NitrogenV7.prototype._complete=function(){if(window.BF_QuestSystem&&typeof window.BF_QuestSystem.game==='function')window.BF_QuestSystem.game().setStep('engineer',1);if(window.$gameVariables)$gameVariables.setValue(10,6);if(BF.eventId>0)$gameSelfSwitches.setValue([BF.mapId,BF.eventId,'A'],true);};
Scene_NitrogenV7.prototype.terminate=function(){Scene_Base.prototype.terminate.call(this);};
window.Scene_NitrogenV6=Scene_NitrogenV7;
})();
