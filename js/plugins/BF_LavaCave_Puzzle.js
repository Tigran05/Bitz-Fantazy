/*:
 * @plugindesc Bitz Fantasy — ловушки и головоломки Лавовой пещеры
 * @author ASTROLIT GAMES
 *
 * @help
 * BF_LavaCave_Puzzle.js — RPG Maker MV
 *
 * Теги пишутся в поле «Примечание» события (или в комментарии страницы).
 *
 * <BF_LAVA_CRYSTAL>          обычный собираемый кристалл
 * <BF_LAVA_FINAL_CRYSTAL>    финальный Огненный кристалл; появляется после сбора всех обычных
 * <BF_LAVA_SPIKES>            старый режим шипов: опасны постоянно
 * <BF_LAVA_SPIKES:45,45,60>   таймерные шипы: предупреждение, опасность, пауза
 * <BF_LAVA_GEYSER:45,45,60,121>
 *                             тег гейзера; опасность определяется по анимации события
 * <BF_LAVA_FIRE:120,60>       огненная струя: цикл 120 кадров, опасна первые 60
 * <BF_LAVA_FLOOR>             хрупкая плита: после наступания проваливается
 * <BF_LAVA_SWITCH:gate1>      нажимной переключатель, открывает gate1
 * <BF_LAVA_GATE:gate1>        ворота, закрыты пока переключатель не активирован
 * <BF_LAVA_EXIT>              выход; открывается после сбора всех кристаллов
 * <BF_LAVA_TELEPORT:pair1>    точка телепорта; одинаковый ID на обеих точках
 * <BF_LAVA_RESET>             точка возврата после смертельной ловушки
 * <BF_LAVA_PRESSURE:bridge1>   нажимная плита моста
 * <BF_LAVA_CRATE>              передвигаемый камень (движение только кнопкой действия)
 * <BF_LAVA_BRIDGE:bridge1,3,1> мост: ID, ширина, высота; ориентация определяется размерами
 * <BF_LAVA_BRIDGE:bridge2,1,3> вертикальный мост
 * Дополнительно можно указать ,horizontal или ,vertical после размеров
 *
 * Таймеры указываются в кадрах (60 кадров ≈ 1 секунда).
 * Для таймерных шипов/гейзеров: первое число — безопасное предупреждение,
 * второе — опасная фаза, третье — безопасная пауза. Затем цикл повторяется.
 * Координаты ловушек берутся автоматически из расположения событий.
 *
 * Если на карте 42 нет события <BF_LAVA_RESET> и не задана команда
 * BF_LavaCave respawn, смертельные ловушки возвращают игрока на Map 42 X=5 Y=49.
 *
 * КОМАНДЫ ПЛАГИНА:
 * BF_LavaCave status
 * BF_LavaCave reset
 * BF_LavaCave crystals 3
 * BF_LavaCave respawn 5 49
 * BF_LavaCave open gate1
 * BF_LavaCave close gate1
 */
(function() {
 'use strict';
 var BF = window.BF_LavaCave = window.BF_LavaCave || {};
 BF.version = '1.7';
 var TAGS = {
  crystal: /<BF_LAVA_CRYSTAL\s*>/i,
  finalCrystal: /<BF_LAVA_FINAL_CRYSTAL\s*>/i,
  geyser: /<BF_LAVA_GEYSER\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+))?\s*>/i,
  fire: /<BF_LAVA_FIRE\s*:\s*(\d+)\s*,\s*(\d+)\s*>/i,
  floor: /<BF_LAVA_FLOOR\s*>/i,
  switch: /<BF_LAVA_SWITCH\s*:\s*([\w-]+)\s*>/i,
  gate: /<BF_LAVA_GATE\s*:\s*([\w-]+)\s*>/i,
  exit: /<BF_LAVA_EXIT\s*>/i,
  teleport: /<BF_LAVA_TELEPORT\s*:\s*([\w-]+)\s*>/i,
  reset: /<BF_LAVA_RESET\s*>/i,
  pressure: /<BF_LAVA_PRESSURE\s*:\s*([\w-]+)\s*>/i,
  crate: /<BF_LAVA_CRATE\s*>/i,
  bridge: /<BF_LAVA_BRIDGE\s*:\s*([\w-]+)(?:\s*,\s*(\d+)\s*,\s*(\d+))?(?:\s*,\s*(horizontal|vertical))?\s*>/i
 };
 function tagText(ev) {
  if (!ev || !ev.event) return '';
  var d=ev.event(), s=(d.note||'')+'\n'+(d.name||'');
  (d.pages||[]).forEach(function(p){ (p.list||[]).forEach(function(c){
   if(c && (c.code===108||c.code===408) && c.parameters) s+='\n'+String(c.parameters[0]||'');
  }); });
  return s;
 }
 function match(ev, key) { return TAGS[key].exec(tagText(ev)); }
 function tagged(key) { return $gameMap.events().filter(function(e){return !!match(e,key);}); }
 function state() {
  if (!$gameSystem._bfLavaCave) $gameSystem._bfLavaCave={maps:{}, required:0, respawn:null};
  var root=$gameSystem._bfLavaCave, id=String($gameMap.mapId());
  if(!root.maps[id]) root.maps[id]={collected:{}, switches:{}, collapsed:{}, opened:{}, lastFire:{}, finalCrystalCollected:false};
   if(root.maps[id].finalCrystalCollected===undefined) root.maps[id].finalCrystalCollected=false;
  return root.maps[id];
 }
 function rootState(){ if(!$gameSystem._bfLavaCave)$gameSystem._bfLavaCave={maps:{},required:0,respawn:null}; return $gameSystem._bfLavaCave; }
 function crystalsRequired(){ var n=Number(rootState().required)||0; return n>0?n:tagged('crystal').length; }
 function crystalCount(){ return Object.keys(state().collected).filter(function(k){return state().collected[k];}).length; }
 function flashMessage(s){ if(!$gameMessage.isBusy()) $gameMessage.add(s); }
 function sound(name){ if(window.SoundManager && SoundManager[name]) SoundManager[name](); }
 function addFireCrystalJournalNote(){
  var qs=window.BF_QuestSystem;
  if(!qs || typeof qs.game!=='function') return false;
  var game=qs.game();
  if(!game || !game._notes) return false;
  game._notes.fire_crystal='Получен Огненный кристалл в Лавовой пещере.';
  return true;
 }

 function timedConfig(ev, kind) {
  var m=match(ev,kind);
  if(!m) return null;
  return {
   timed:true,
   warn:Math.max(0,Number(m[1])||0),
   on:Math.max(1,Number(m[2])||45),
   off:Math.max(0,Number(m[3])||0),
   anim:kind==='geyser'?Math.max(0,Number(m[4])||0):0
  };
 }
 function timedPhase(ev, cfg) {
  var cycle=cfg.warn+cfg.on+cfg.off;
  if(cycle<=0) return 'on';
  // Each event starts at its own deterministic offset, so many traps do not
  // all activate on the same frame.
  var offset=(ev.eventId()*37)%cycle;
  var t=(Graphics.frameCount+offset)%cycle;
  if(t<cfg.warn) return 'warn';
  if(t<cfg.warn+cfg.on) return 'on';
  return 'off';
 }
 function refreshEvents(){
  var st=state();
  tagged('crystal').forEach(function(e){ var got=!!st.collected[String(e.eventId())]; e.setTransparent(got); e.setThrough(true); e.setPriorityType(0); });
  tagged('finalCrystal').forEach(function(e){ var unlocked=crystalsRequired()>0 && crystalCount()>=crystalsRequired(); e.setTransparent(!unlocked || !!st.finalCrystalCollected); e.setThrough(true); e.setPriorityType(0); });
  tagged('gate').forEach(function(e){ var id=(match(e,'gate')||[])[1], open=!!st.opened[id]; e.setThrough(open); e.setPriorityType(open?0:1); e.setTransparent(open); });
  tagged('floor').forEach(function(e){ var gone=!!st.collapsed[String(e.eventId())]; e.setTransparent(gone); e.setThrough(gone); e.setPriorityType(gone?0:1); });
  tagged('geyser').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('fire').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('switch').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('exit').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('teleport').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('reset').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('pressure').forEach(function(e){ e.setThrough(true); e.setPriorityType(0); });
  tagged('crate').forEach(function(e){ e.setThrough(false); e.setPriorityType(1); });
  tagged('bridge').forEach(function(e){ e.setTransparent(true); e.setThrough(true); e.setPriorityType(0); });
 }
 function respawnPlayer(){
  var root=rootState(), r=root.respawn;
  if(!r || r.mapId!==$gameMap.mapId()) {
   var marks=tagged('reset');
   if(marks.length) r={mapId:$gameMap.mapId(),x:marks[0].x,y:marks[0].y};
   else if($gameMap.mapId()===42) r={mapId:42,x:5,y:49};
  }
  if(r && r.mapId===$gameMap.mapId()) $gamePlayer.locate(r.x,r.y);
  else $gamePlayer.reserveTransfer($gameMap.mapId(),$gamePlayer.x,$gamePlayer.y,2,0);
  $gamePlayer.refresh(); sound('playDamage');
 }
 function triggerHazard(ev, kind){
  var st=state(), key=String(ev.eventId());
  if(kind==='spikes') { flashMessage('Ловушка! Шипы пронзают проход.'); respawnPlayer(); return; }
  if(kind==='geyser') { flashMessage('Гейзер! Попадание в горячую струю.'); respawnPlayer(); return; }
  if(kind==='fire') { flashMessage('Огненная струя! Нужно дождаться безопасного момента.'); respawnPlayer(); return; }
  if(kind==='floor') {
   if(!st.collapsed[key]) { st.collapsed[key]=true; ev.setTransparent(true); ev.setThrough(true); ev.setPriorityType(0); }
   flashMessage('Каменная плита обрушилась!'); respawnPlayer();
  }
 }
 function checkTile(x,y){
  var events=$gameMap.eventsXy(x,y), st=state();
  events.forEach(function(e){
   if(match(e,'crystal')) { var k=String(e.eventId()); if(!st.collected[k]) { st.collected[k]=true; e.setTransparent(true); e.setThrough(true); refreshEvents(); sound('playRecovery'); flashMessage('Получен кристалл! ('+crystalCount()+'/'+crystalsRequired()+')'); if(crystalCount()>=crystalsRequired() && crystalsRequired()>0) flashMessage('Все кристаллы собраны. Огненный кристалл появился!'); } }
   var fc=match(e,'finalCrystal');
   if(fc && crystalsRequired()>0 && crystalCount()>=crystalsRequired() && !st.finalCrystalCollected) {
    st.finalCrystalCollected=true; e.setTransparent(true); e.setThrough(true);
    addFireCrystalJournalNote();
    // Передаём сюжетный огненный камень в общий счётчик квеста.
    if (window.BF_QuestSystem && window.BF_QuestSystem.elementalStones &&
        typeof window.BF_QuestSystem.elementalStones.collect === 'function') {
     window.BF_QuestSystem.elementalStones.collect('fire');
    }
    refreshEvents(); sound('playRecovery'); flashMessage('Получен Огненный кристалл!');
    $gameSwitches.setValue(1,true);
   }
   // Geysers are handled by the frame poll below; don't trigger them from step checks.
   var fm=match(e,'fire');
   if(fm) { var period=Math.max(1,Number(fm[1])||120), active=Math.max(1,Math.min(period,Number(fm[2])||60)); var phase=(Graphics.frameCount+(e.eventId()*37))%period; if(phase<active) triggerHazard(e,'fire'); }
   if(match(e,'floor') && !st.collapsed[String(e.eventId())]) triggerHazard(e,'floor');
   var sw=match(e,'switch'); if(sw) { var id=sw[1]; if(!st.opened[id]) { st.opened[id]=true; refreshEvents(); sound('playSwitch'); flashMessage('Механизм сработал. Ворота открыты!'); } }
   if(match(e,'exit')) { if(crystalsRequired()===0 || crystalCount()>=crystalsRequired()) { sound('playOk'); flashMessage('Ты прошёл Лавовую пещеру!'); $gameSwitches.setValue(1,true); } else { sound('playBuzzer'); flashMessage('Выход запечатан. Собери все кристаллы: '+crystalCount()+'/'+crystalsRequired()+'.'); } }
   var tp=match(e,'teleport'); if(tp) { var label=tp[1], all=tagged('teleport').filter(function(t){return (match(t,'teleport')||[])[1]===label;}); if(all.length>=2) { var target=all.filter(function(t){return t!==e;})[0]; if(target) { $gamePlayer.locate(target.x,target.y); sound('playMagicEvasion'); } } }
  });
 }
 var lastStepKey='';
 var _increaseSteps=Game_Player.prototype.increaseSteps;
 Game_Player.prototype.increaseSteps=function(){ _increaseSteps.call(this); var k=$gameMap.mapId()+':'+this.x+','+this.y+':'+Graphics.frameCount; if(k!==lastStepKey){lastStepKey=k;checkTile(this.x,this.y);} };
 var _setup=Game_Map.prototype.setup;
 Game_Map.prototype.setup=function(mapId){ _setup.call(this,mapId); };
 var _sceneMapStart=Scene_Map.prototype.start;
 Scene_Map.prototype.start=function(){ _sceneMapStart.call(this); var self=this; setTimeout(function(){ if(window.$gameMap && $gameMap.mapId()) refreshEvents(); },0); };
 var _triggerButtonAction=Game_Player.prototype.triggerButtonAction;
 Game_Player.prototype.triggerButtonAction=function(){
  var d=this.direction(), x=$gameMap.roundXWithDirection(this.x,d), y=$gameMap.roundYWithDirection(this.y,d), evs=$gameMap.eventsXy(x,y), handled=false, st=state();
  evs.forEach(function(e){
   var sw=match(e,'switch'); if(sw){if(!st.opened[sw[1]]){st.opened[sw[1]]=true;refreshEvents();sound('playSwitch');flashMessage('Механизм сработал. Ворота открыты!');}handled=true;}
   if(match(e,'exit')){ if(crystalsRequired()===0||crystalCount()>=crystalsRequired()){flashMessage('Ты прошёл Лавовую пещеру!');$gameSwitches.setValue(1,true);}else{sound('playBuzzer');flashMessage('Нужно собрать все кристаллы: '+crystalCount()+'/'+crystalsRequired()+'.');}handled=true;}
   if(match(e,'reset')){var r=rootState();r.respawn={mapId:$gameMap.mapId(),x:e.x,y:e.y};sound('playRecovery');flashMessage('Точка возврата установлена.');handled=true;}
   if(match(e,'finalCrystal')){checkTile(e.x,e.y);handled=true;}
   if(match(e,'crystal')){checkTile(e.x,e.y);handled=true;}
  });
  if(handled)return true;
  return _triggerButtonAction.call(this);
 };
 var _pluginCommand=Game_Interpreter.prototype.pluginCommand;
 Game_Interpreter.prototype.pluginCommand=function(command,args){
  _pluginCommand.call(this,command,args); if(String(command).toLowerCase()!=='bf_lavacave')return;
  args=args||[]; var act=String(args[0]||'').toLowerCase(), r=rootState(), st=state();
  if(act==='status'){ console.log('[BF_LavaCave] map='+$gameMap.mapId()+' crystals='+crystalCount()+'/'+crystalsRequired(),JSON.stringify(st)); flashMessage('Кристаллы: '+crystalCount()+'/'+crystalsRequired()+'.'); }
  else if(act==='crystals'){r.required=Math.max(0,Number(args[1])||0);flashMessage('Требуется кристаллов: '+crystalsRequired()+'.');}
  else if(act==='respawn'){r.respawn={mapId:$gameMap.mapId(),x:Number(args[1])||0,y:Number(args[2])||0};flashMessage('Точка возврата установлена.');}
  else if(act==='open'||act==='close'){var id=String(args[1]||'');st.opened[id]=act==='open';refreshEvents();}
  else if(act==='reset'){r.maps[String($gameMap.mapId())]={collected:{},switches:{},collapsed:{},opened:{},lastFire:{},finalCrystalCollected:false};refreshEvents();flashMessage('Головоломка сброшена.');}
 };
 var _isMapPassable=Game_Map.prototype.isPassable;
 Game_Map.prototype.isPassable=function(x,y,d){
  var nx=this.roundXWithDirection(x,d), ny=this.roundYWithDirection(y,d);
  if(this.eventsXy(nx,ny).some(function(e){return !!match(e,'gate') && !state().opened[(match(e,'gate')||[])[1]];})) return false;
  if(this.eventsXy(nx,ny).some(function(e){return !!match(e,'floor') && !!state().collapsed[String(e.eventId())];})) return false;
  return _isMapPassable.call(this,x,y,d);
 };
 var _canMove=Game_Player.prototype.canMove;
 Game_Player.prototype.canMove=function(){return _canMove.call(this);};
 var _update=Game_Event.prototype.update;
 Game_Event.prototype.update=function(){
  _update.call(this);
  var fm=match(this,'fire');
  if(fm){var period=Math.max(1,Number(fm[1])||120), active=Math.max(1,Number(fm[2])||60); this.setTransparent(((Graphics.frameCount+(this.eventId()*37))%period)>=active);}
  // Do not start or loop geyser animations from the plugin. The event page
  // controls its animation; collision is dangerous only while that animation plays.
 };
 // Check active geyser animations every frame. Event-command animations may begin
 // after the player's step hook has already run, so step-only checks miss them.
 // A latch prevents the same ongoing animation from returning the player repeatedly.
 function checkActiveGeysers() {
  if (!$gameMap || $gameMap.mapId() !== 42 || !$gamePlayer) return;
  var px=$gamePlayer.x, py=$gamePlayer.y;
  $gameMap.eventsXy(px,py).forEach(function(e) {
   if (!match(e,'geyser')) return;
   var eventAnimating=!!(e.isAnimationPlaying && e.isAnimationPlaying());
   var playerAnimating=!!($gamePlayer.isAnimationPlaying && $gamePlayer.isAnimationPlaying());
   var active=eventAnimating || playerAnimating;
   if (!e._bfLavaGeyserAnimationLatched && active) {
    e._bfLavaGeyserAnimationLatched=true;
    triggerHazard(e,'geyser');
   } else if (!active) {
    e._bfLavaGeyserAnimationLatched=false;
   }
  });
 }
 var _mapUpdate=Scene_Map.prototype.update;
 Scene_Map.prototype.update=function(){
  _mapUpdate.call(this);
  if($gameMap && $gameMap._bfLavaRefreshPending){refreshEvents();$gameMap._bfLavaRefreshPending=false;}
  checkActiveGeysers();
 };

 // --- Подъёмные мосты и ящики ---
 // Orientation comes from the bridge zone dimensions: w>=h => horizontal,
 // h>w => vertical. Four separate PNGs are used for the two directions/states.
 function bridgeId(ev){ var m=match(ev,'bridge'); return m ? m[1] : null; }
 function pressureId(ev){ var m=match(ev,'pressure'); return m ? m[1] : null; }
 function bridgeIsOpen(id){
  var plates=tagged('pressure').filter(function(e){return pressureId(e)===id;});
  if(!plates.length) return false;
  return plates.every(function(p){return $gameMap.eventsXy(p.x,p.y).some(function(e){return e!==p && !!match(e,'crate');});});
 }
 function bridgeData(ev){ var m=match(ev,'bridge')||[]; var w=Math.max(1,Number(m[2])||3), h=Math.max(1,Number(m[3])||1); var orientation=String(m[4]||'').toLowerCase(); if(orientation!=='horizontal' && orientation!=='vertical') orientation=(w>=h?'horizontal':'vertical'); return {id:m[1],w:w,h:h,orientation:orientation}; }
 function bridgeAt(x,y){
  var found=null;
  tagged('bridge').some(function(e){
   var d=bridgeData(e), left=e.x-Math.floor(d.w/2), top=e.y-Math.floor(d.h/2);
   if(x>=left && x<left+d.w && y>=top && y<top+d.h){ found={event:e,data:d,open:bridgeIsOpen(d.id)}; return true; }
   return false;
  });
  return found;
 }
 // Crates move ONLY after an explicit action-button press (Enter/Z or the
 // contextual BF_InteractionButton). Walking into a crate never pushes it.
 function pushLavaCrate(crate, d){
  var x=crate.x, y=crate.y;
  var nx=$gameMap.roundXWithDirection(x,d), ny=$gameMap.roundYWithDirection(y,d);
  if(!$gameMap.isValid(nx,ny)) { sound('playBuzzer'); return true; }
  var occupied=$gameMap.eventsXy(nx,ny).some(function(e){return e!==crate && !e.isThrough();});
  if(occupied || !$gameMap.isPassable(x,y,d) || !$gameMap.isPassable(nx,ny,10-d)) {
   sound('playBuzzer'); return true;
  }
  crate.locate(nx,ny); crate.setDirection(d); crate.straighten(); crate.refresh();
  $gameMap._bfLavaBridgeNeedsRefresh=true;
  sound('playCursor');
  return true;
 }
 var _lavaTriggerAction=Game_Player.prototype.triggerAction;
 Game_Player.prototype.triggerAction=function(){
  if(this.canMove() && !$gameMessage.isBusy()){
   var d=this.direction(), x=$gameMap.roundXWithDirection(this.x,d), y=$gameMap.roundYWithDirection(this.y,d);
   var crate=$gameMap.eventsXy(x,y).filter(function(e){return !!match(e,'crate');})[0];
   if(crate){
    var pressed=window.BF_InteractionButton ? window.BF_InteractionButton.consumeAction() : Input.isTriggered('ok');
    if(pressed) return pushLavaCrate(crate,d);
    return true;
   }
  }
  return _lavaTriggerAction.call(this);
 };
 // Render the matching orientation and fade between raised/lowered states.
 // PNG names: Bridge_H_Raised, Bridge_H_Lowered, Bridge_V_Raised, Bridge_V_Lowered.
 var _Spriteset_Map_createCharacters=Spriteset_Map.prototype.createCharacters;
 Spriteset_Map.prototype.createCharacters=function(){
  _Spriteset_Map_createCharacters.call(this);
  this._bfLavaBridgePairs=[];
  var self=this;
  tagged('bridge').forEach(function(ev){
   var data=bridgeData(ev), prefix=data.orientation==='horizontal'?'Bridge_H_':'Bridge_V_';
   var raised=new Sprite(); raised.bitmap=ImageManager.loadPicture(prefix+'Raised');
   raised.anchor.x=0.5; raised.anchor.y=1; raised.scale.x=0.75; raised.scale.y=0.75; raised.z=1.5;
   raised._bfBridgeEventId=ev.eventId(); raised.opacity=255;
   var lowered=new Sprite(); lowered.bitmap=ImageManager.loadPicture(prefix+'Lowered');
   lowered.anchor.x=0.5; lowered.anchor.y=1; lowered.scale.x=0.75; lowered.scale.y=0.75; lowered.z=1.51;
   lowered._bfBridgeEventId=ev.eventId(); lowered.opacity=0;
   self._tilemap.addChild(raised); self._tilemap.addChild(lowered);
   self._bfLavaBridgePairs.push({raised:raised,lowered:lowered,orientation:data.orientation});
  });
 };
 var _Spriteset_Map_update=Spriteset_Map.prototype.update;
 Spriteset_Map.prototype.update=function(){
  _Spriteset_Map_update.call(this);
  if(!this._bfLavaBridgePairs || !$gameMap) return;
  this._bfLavaBridgePairs.forEach(function(pair){
   var ev=$gameMap.event(pair.raised._bfBridgeEventId); if(!ev) return;
   var data=bridgeData(ev), isOpen=bridgeIsOpen(data.id);
   // If an event was edited to another orientation, keep its art in sync.
   var prefix=data.orientation==='horizontal'?'Bridge_H_':'Bridge_V_';
   if(pair.orientation!==data.orientation){
    pair.orientation=data.orientation;
    pair.raised.bitmap=ImageManager.loadPicture(prefix+'Raised');
    pair.lowered.bitmap=ImageManager.loadPicture(prefix+'Lowered');
   }
   var raisedTarget=isOpen?0:255, loweredTarget=isOpen?255:0;
   if(pair.raised.opacity<raisedTarget) pair.raised.opacity=Math.min(raisedTarget,pair.raised.opacity+32);
   else if(pair.raised.opacity>raisedTarget) pair.raised.opacity=Math.max(raisedTarget,pair.raised.opacity-32);
   if(pair.lowered.opacity<loweredTarget) pair.lowered.opacity=Math.min(loweredTarget,pair.lowered.opacity+32);
   else if(pair.lowered.opacity>loweredTarget) pair.lowered.opacity=Math.max(loweredTarget,pair.lowered.opacity-32);
   [pair.raised,pair.lowered].forEach(function(spr){
    spr.x=$gameMap.adjustX(ev._realX)*$gameMap.tileWidth()+$gameMap.tileWidth()/2;
    spr.y=$gameMap.adjustY(ev._realY)*$gameMap.tileHeight()+$gameMap.tileHeight();
    spr.visible=spr.opacity>0;
   });
  });
 };
 var _mapPassableBridge=Game_Map.prototype.isPassable;
 Game_Map.prototype.isPassable=function(x,y,d){
  var b=bridgeAt(x,y);
  if(b) return b.open;
  var nx=this.roundXWithDirection(x,d), ny=this.roundYWithDirection(y,d), bn=bridgeAt(nx,ny);
  if(bn && !bn.open) return false;
  return _mapPassableBridge.call(this,x,y,d);
 };
})();
