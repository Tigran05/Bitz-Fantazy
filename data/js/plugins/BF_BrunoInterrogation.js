/*:
 * @plugindesc BitzFantasy — Допрос Бруно v2.0 (мышь + touch)
 * @help
 * Plugin Command: BRUNO_INTERROGATION
 *
 * Управление: мышь, touch, стрелки, Enter/Space.
 * После успеха переменная 20 (глава 2) = 1.
 */
(function(){
'use strict';
var WAIT='bruno_interrogation', RESULT=20;
var _pc=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
 _pc.call(this,command,args);
 if(String(command).toUpperCase()==='BRUNO_INTERROGATION'){
  this.setWaitMode(WAIT); SceneManager.push(Scene_BrunoInterrogation);
 }
};
var _uw=Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode=function(){
 if(this._waitMode===WAIT) return SceneManager._scene instanceof Scene_BrunoInterrogation;
 return _uw.call(this);
};
function Scene_BrunoInterrogation(){this.initialize.apply(this,arguments);}
Scene_BrunoInterrogation.prototype=Object.create(Scene_MenuBase.prototype);
Scene_BrunoInterrogation.prototype.constructor=Scene_BrunoInterrogation;
Scene_BrunoInterrogation.prototype.initialize=function(){
 Scene_MenuBase.prototype.initialize.call(this);
 this.round=0; this.msg=''; this.timer=0; this.done=false;
};
Scene_BrunoInterrogation.prototype.create=function(){
 Scene_MenuBase.prototype.create.call(this);
 this.win=new Window_Bruno(0,0,Graphics.boxWidth,Graphics.boxHeight,this);
 this.addWindow(this.win); this.win.activate(); this.win.select(0);
};
Scene_BrunoInterrogation.prototype.data=function(){
 if(this.round===0)return [
  ['МАЙНИНГ НА СЕРВЕРАХ','Серверы казино добывали криптовалюту',true],
  ['АЗОТ','Только охлаждение оборудования',false],
  ['ОБЫЧНЫЕ СЕРВЕРЫ','Только игровые данные',false]
 ];
 if(this.round===1)return [
  ['ШУЛЕР С УСТРОЙСТВОМ','Специальное устройство для обмана',true],
  ['ВЕЗЕНИЕ','Он просто хорошо играл',false],
  ['СЛУЧАЙНЫЕ ВЫИГРЫШИ','Никакой схемы не было',false]
 ];
 return [
  ['ЗАРПЛАТЫ','Обычные расходы казино',false],
  ['ВСЁ СХОДИТСЯ','Майнинг, шулеры и бухгалтерия связаны',true],
  ['ТОЛЬКО ШУЛЕР','Доход только от одного игрока',false]
 ];
};
Scene_BrunoInterrogation.prototype.heading=function(){
 return ['ДОКАЗАТЕЛЬСТВО 1 — СЕРВЕРЫ','ДОКАЗАТЕЛЬСТВО 2 — ШУЛЕР','ДОКАЗАТЕЛЬСТВО 3 — БУХГАЛТЕРИЯ'][this.round];
};
Scene_BrunoInterrogation.prototype.bruno=function(){return [
 '«Серверы? Обычное оборудование казино. Вы ничего не докажете.»',
 '«Шулер? Ему просто везло. При чём здесь я?»',
 '«Деньги могли поступать откуда угодно. Бухгалтерия ничего не доказывает.»'
][this.round];};
Scene_BrunoInterrogation.prototype.answer=function(i){
 var d=this.data()[i]; if(!d||this.timer>0||this.done)return;
 if(d[2]){
  if(this.round===0)this.msg=$gameVariables.value(12)===1?
   '«Азот охлаждал оборудование. А серверы использовали мощности казино для майнинга криптовалюты.»':
   '«Серверы использовали мощности казино для майнинга криптовалюты.»';
  if(this.round===1)this.msg='«У шулера было специальное устройство. Это была организованная схема, а не простое везение.»';
  if(this.round===2){this.msg='«Цифры сошлись: майнинг, шулеры и бухгалтерия — части одной схемы.»';this.done=true;}
  this.round++; this.timer=this.done?105:85; SoundManager.playOk(); this.win.refresh();
 }else{
  this.msg='Бруно: «И что это должно доказывать?» Выбери более убедительную улику.';
  this.timer=70; SoundManager.playBuzzer(); this.win.refresh();
 }
};
Scene_BrunoInterrogation.prototype.update=function(){
 Scene_MenuBase.prototype.update.call(this);
 if(this.timer>0){this.timer--;if(this.timer===0){
  if(this.done){$gameVariables.setValue(RESULT,1);this.popScene();}
  else{this.msg='';this.win.refresh();}
 }}
};
function Window_Bruno(x,y,w,h,scene){
 this.scene=scene; this._cards=[];
 Window_Selectable.prototype.initialize.call(this,x,y,w,h);
 this.opacity=0; this.refresh();
}
Window_Bruno.prototype=Object.create(Window_Selectable.prototype);
Window_Bruno.prototype.constructor=Window_Bruno;
Window_Bruno.prototype.maxItems=function(){return 3;};
Window_Bruno.prototype.hitCard=function(x,y){
 for(var i=0;i<this._cards.length;i++){var r=this._cards[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return i;}
 return -1;
};
Window_Bruno.prototype.box=function(c,x,y,w,h,fill,line){
 c.fillRect(x,y,w,h,fill);
 if(line){c.fillRect(x,y,w,2,line);c.fillRect(x,y+h-2,w,2,line);c.fillRect(x,y,2,h,line);c.fillRect(x+w-2,y,2,h,line);}
};
Window_Bruno.prototype.wrapText=function(text,x,y,w,lineH,maxLines){
 var c=this.contents,words=String(text).split(/\s+/),line='',lines=[],i;
 for(i=0;i<words.length;i++){
  var test=line?line+' '+words[i]:words[i];
  if(c.measureTextWidth(test)>w&&line){lines.push(line);line=words[i];}
  else line=test;
 }
 if(line)lines.push(line);
 if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);var last=lines.length-1;while(c.measureTextWidth(lines[last]+'…')>w&&lines[last].length)lines[last]=lines[last].slice(0,-1);lines[last]+='…';}
 for(i=0;i<lines.length;i++)this.drawText(lines[i],x,y+i*lineH,w,'left');
 return lines.length*lineH;
};
Window_Bruno.prototype.refresh=function(){
 var c=this.contents,W=this.contentsWidth(),s=this.scene;
 c.clear(); this._cards=[];
 c.fontSize=28;c.textColor='#f0c84b';this.drawText('ДОПРОС БРУНО',0,2,W,'center');
 c.fontSize=15;c.textColor='#aeb5c0';this.drawText(s.heading(),0,38,W,'center');
 for(var p=0;p<3;p++)c.fillRect(W/2-138+p*92,66,72,6,p<s.round?'#66c85a':'#38404a');
 var bx=18,by=88,bw=205,dx=238,dw=W-dx-18;
 this.box(c,bx,by,bw,150,'#171d25','#806237');
 c.fontSize=50;c.textColor='#c99559';this.drawText('Б',bx,by+18,bw,'center');
 c.fontSize=20;c.textColor='#f2f2f2';this.drawText('БРУНО',bx,by+82,bw,'center');
 c.fontSize=13;c.textColor='#aeb5c0';this.drawText('ПОДОЗРЕВАЕМЫЙ',bx,by+112,bw,'center');
 c.fontSize=13;c.textColor='#7d8792';this.drawText('Дело казино',bx,by+132,bw,'center');
 this.box(c,dx,by,dw,92,'#11161d','#46515e');
 c.fontSize=18;c.textColor='#f1f3f5';this.wrapText(s.bruno(),dx+14,by+12,dw-28,23,3);
 var infoY=190;
 if(s.msg){
  this.box(c,dx,infoY,dw,96,s.done?'#18251a':'#20251d',s.done?'#4f9c4a':'#8c7136');
  c.fontSize=16;c.textColor=s.done?'#c7f3bb':'#f1dfaa';this.wrapText(s.msg,dx+12,infoY+10,dw-24,20,4);
  infoY+=106;
 }
 if(!s.done){
  var startY=infoY+4;
  c.fontSize=17;c.textColor='#f0c84b';this.drawText('ВЫБЕРИ УЛИКУ',dx,startY,dw,'left');
  var a=s.data(),cardY=startY+30,cardH=64;
  for(var n=0;n<3;n++){
   var yy=cardY+n*(cardH+8),sel=n===this.index();
   this._cards.push({x:dx,y:yy,w:dw,h:cardH});
   this.box(c,dx,yy,dw,cardH,sel?'#352c19':'#1a2028',sel?'#e0b746':'#46505b');
   c.fontSize=17;c.textColor=sel?'#fff0ad':'#f3f4f5';this.drawText(a[n][0],dx+12,yy+6,dw-24,'left');
   c.fontSize=13;c.textColor='#aeb6c0';this.wrapText(a[n][1],dx+12,yy+31,dw-24,16,2);
  }
  c.fontSize=12;c.textColor='#808a96';this.drawText('Клик / касание — выбрать   •   ↑↓ — выбор   •   Enter — подтвердить',dx,cardY+3*(cardH+8)+2,dw,'center');
 }else{
  this.box(c,dx,205,dw,115,'#18251a','#4f9c4a');
  c.fontSize=26;c.textColor='#7be35e';this.drawText('ДЕЛО РАСКРЫТО',dx,225,dw,'center');
  c.fontSize=15;c.textColor='#d7e9d2';this.wrapText('Бруно больше не может отрицать связь между майнингом, шулерами и бухгалтерией.',dx+20,267,dw-40,20,2);
 }
};
Window_Bruno.prototype.update=function(){
 Window_Selectable.prototype.update.call(this);
 if(this.scene.done)return;
 var changed=false;
 if(Input.isTriggered('down')){this.select((this.index()+1)%3);changed=true;}
 if(Input.isTriggered('up')){this.select((this.index()+2)%3);changed=true;}
 if(changed){SoundManager.playCursor();this.refresh();}
 if(Input.isTriggered('ok'))this.scene.answer(this.index());
 if(TouchInput.isTriggered()){
  var hit=this.hitCard(TouchInput.x,TouchInput.y);
  if(hit>=0){
   if(hit!==this.index()){this.select(hit);SoundManager.playCursor();this.refresh();}
   this.scene.answer(hit);
  }
 }
};
})();
