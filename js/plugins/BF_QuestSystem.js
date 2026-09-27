/*:
 * @plugindesc Bitz Fantasy — единый движок квестов, шагов, журнала и мини-приложений
 * @author ASTROLIT GAMES
 *
 * @help
 * Все квесты и их шаги редактируются ТОЛЬКО в BF_QuestConfig.js.
 * Этот плагин хранит состояние, рисует журнал и связывает мини-приложения
 * с текущим шагом квеста.
 *
 * ЕДИНСТВЕННЫЕ команды событий RPG Maker MV:
 *   BF_Quest start <id>
 *   BF_Quest step <id> <0-based step>
 *   BF_Quest next <id>
 *   BF_Quest complete <id>
 *   BF_Quest select <id>
 *   BF_Quest note <id>
 *   BF_Quest digit <id> <variableId>
 *   BF_Quest status <id>
 *   BF_Quest journal
 *   BF_Quest minigameStart <appId> [questId]
 *   BF_Quest minigameResult <SUCCESS|FAIL|CANCEL|COMPLETE>
 *
 * ЛОГИКА МИНИ-ПРИЛОЖЕНИЯ:
 *   1) При запуске приложение вызывает:
 *        BF_QuestSystem.minigameStart('APP_ID');
 *      Если передать второй аргумент, можно явно указать questId.
 *   2) При УСПЕХЕ приложение вызывает:
 *        BF_QuestSystem.minigameResult('SUCCESS');
 *   3) При ПРОВАЛЕ/ОТМЕНЕ ничего не меняет:
 *        BF_QuestSystem.minigameResult('FAIL');
 *        BF_QuestSystem.minigameResult('CANCEL');
 *   4) Для мгновенного завершения квеста:
 *        BF_QuestSystem.minigameResult('COMPLETE');
 *
 * ВАЖНО:
 * - движок НЕ угадывает шаги по предметам, NPC, событиям или переменным;
 * - цифры НЕ заданы в коде: их создаёт обычное событие RPG Maker;
 * - BF_Quest digit только считывает уже выданную цифру и сохраняет её;
 * - завершение квеста вызывается отдельной командой complete;
 * - мини-приложение работает только с тем квестом и шагом, для которого было
 *   зафиксировано его начало. Это исключает путаницу при нескольких активных квестах.
 */
(function(){
'use strict';

var BF = window.BF_QuestSystem = window.BF_QuestSystem || {};
if (BF.__questSystemV6Loaded) return;
BF.__questSystemV6Loaded = true;
BF.version = '6.0-clean-minigame';

BF.config = function(){
    return window.BF_QuestConfig || {QUESTS:{}, NOTES:{}};
};
BF.questsConfig = function(){ return BF.config().QUESTS || {}; };
BF.notesConfig = function(){ return BF.config().NOTES || {}; };
BF.QUESTS = BF.questsConfig();
BF.NOTES = BF.notesConfig();
BF.refreshConfigAliases = function(){
    BF.QUESTS = BF.questsConfig();
    BF.NOTES = BF.notesConfig();
};
BF.normalizeId = function(id){ return String(id == null ? '' : id).trim(); };
BF.configFor = function(id){
    id = BF.normalizeId(id);
    return BF.questsConfig()[id] || null;
};

function Game_BFQuests(){ this.initialize.apply(this, arguments); }
Game_BFQuests.prototype.initialize = function(){
    this._data = {};
    this._notes = {};
    this._digits = {};
    this._currentQuest = null;
    this._selectedQuest = null;
    this._minigame = null;
};

Game_BFQuests.prototype.validateState = function(){
    var self=this;
    if(!this._data || typeof this._data!=='object') this._data={};
    if(!this._notes || typeof this._notes!=='object') this._notes={};
    if(!this._digits || typeof this._digits!=='object') this._digits={};
    if(this._currentQuest && !BF.configFor(this._currentQuest)) this._currentQuest=null;
    if(this._selectedQuest && !BF.configFor(this._selectedQuest)) this._selectedQuest=null;
    if(this._minigame && (!this._minigame.questId || !BF.configFor(this._minigame.questId))) this._minigame=null;
    Object.keys(this._data).forEach(function(id){
        var q=self._data[id], cfg=BF.configFor(id);
        if(!cfg || !q || typeof q!=='object') return;
        if(q.status!=='active' && q.status!=='completed' && q.status!=='available') q.status='available';
        var max=Math.max(0,(cfg.steps||[]).length-1);
        var n=Number(q.step);
        if(!isFinite(n)) n=0;
        q.step=Math.max(0,Math.min(Math.floor(n),max));
    });
};

Game_BFQuests.prototype._finishWorkersChain = function(){
    if(this.isStarted('intro') && !this.isCompleted('intro')) this.complete('intro');
    if(!this.isStarted('house')) this.start('house');
};

Game_BFQuests.prototype.ensure = function(id){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id);
    if(!cfg) return null;
    if(!this._data[id]) this._data[id]={status:'available',step:0,startedAt:0,completedAt:0};
    return this._data[id];
};
Game_BFQuests.prototype.get = function(id){ id=BF.normalizeId(id); return this._data[id] || null; };
Game_BFQuests.prototype.status = function(id){ var q=this.get(id); return q?q.status:'locked'; };
Game_BFQuests.prototype.isStarted = function(id){ var q=this.get(id); return !!q&&(q.status==='active'||q.status==='completed'); };
Game_BFQuests.prototype.isCompleted = function(id){ var q=this.get(id); return !!q&&q.status==='completed'; };
Game_BFQuests.prototype.workersComplete = function(){
    return this.isCompleted('bartender') && this.isCompleted('engineer') && this.isCompleted('manager');
};
Game_BFQuests.prototype.checkPrerequisite = function(id){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id);
    if(!cfg || !cfg.prerequisite) return true;
    switch(String(cfg.prerequisite)){
        case 'workersComplete': return this.workersComplete();
        case 'houseComplete': return this.isCompleted('house');
        case 'passageComplete': return this.isCompleted('passage');
        case 'safeComplete': return this.isCompleted('safe');
        default: return this.isCompleted(cfg.prerequisite);
    }
};
Game_BFQuests.prototype.canStart = function(id){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id);
    if(!cfg) return false;
    if(id==='intro') return true;
    if(id==='bartender'||id==='engineer'||id==='manager') return this.isStarted('intro');
    return this.checkPrerequisite(id);
};
Game_BFQuests.prototype.start = function(id,step){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id), q=this.ensure(id);
    if(!cfg || !q) return false;
    if(q.status==='completed'){
        this._currentQuest=id;
        this._selectedQuest=id;
        return true;
    }
    if(q.status==='active'){
        if(step!==undefined) this.setStep(id,step);
        this._currentQuest=id;
        this._selectedQuest=id;
        return true;
    }
    if(!this.canStart(id)) return false;
    q.status='active';
    var max=Math.max(0,(cfg.steps||[]).length-1);
    var n=step===undefined?0:Number(step);
    if(!isFinite(n)) n=0;
    q.step=Math.max(0,Math.min(Math.floor(n),max));
    q.startedAt=Date.now();
    this._currentQuest=id;
    this._selectedQuest=id;
    return true;
};
Game_BFQuests.prototype.setStep = function(id,step){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id), q=this.get(id);
    if(!cfg || !q || q.status!=='active') return false;
    var max=Math.max(0,(cfg.steps||[]).length-1), n=Number(step);
    if(!isFinite(n)) n=0;
    q.step=Math.max(0,Math.min(Math.floor(n),max));
    this._currentQuest=id;
    this._selectedQuest=id;
    return true;
};
Game_BFQuests.prototype.nextStep = function(id){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id), q=this.get(id);
    if(!cfg || !q || q.status!=='active') return false;
    var max=(cfg.steps||[]).length-1;
    if(max<0 || q.step>=max) return this.complete(id);
    q.step++;
    this._currentQuest=id;
    this._selectedQuest=id;
    return true;
};

// -------------------------
// Универсальный интерфейс мини-приложений
// -------------------------
Game_BFQuests.prototype._stepMinigameId = function(id,step){
    var cfg=BF.configFor(id);
    if(!cfg) return '';
    var map=cfg.minigameByStep || cfg.minigames || {};
    return map[String(step)] || map[step] || '';
};
Game_BFQuests.prototype._findQuestForMinigame = function(appId){
    appId=String(appId||'');
    var active=this.getActive(), selected=this.selectedQuest(), matches=[];
    for(var i=0;i<active.length;i++){
        var id=active[i], q=this.get(id);
        if(q && this._stepMinigameId(id,q.step)===appId) matches.push(id);
    }
    if(selected && matches.indexOf(selected)>=0) return selected;
    if(matches.length===1) return matches[0];
    return selected || (active.length?active[0]:null);
};
Game_BFQuests.prototype.minigameStart = function(appId,questId){
    appId=String(appId||'').trim();
    var id=questId ? BF.normalizeId(questId) : this._findQuestForMinigame(appId);
    if(!appId || !id) return false;
    var q=this.get(id);
    if(!q || q.status!=='active') return false;
    var configured=this._stepMinigameId(id,q.step);
    if(configured && configured!==appId) return false;
    this._minigame={appId:appId,questId:id,step:q.step,startedAt:Date.now()};
    this._currentQuest=id;
    this._selectedQuest=id;
    return true;
};
Game_BFQuests.prototype.minigameResult = function(result,questId){
    var r=String(result||'').toUpperCase();
    var ctx=this._minigame;
    var id=questId ? BF.normalizeId(questId) : (ctx ? ctx.questId : this.selectedQuest());
    if(!id) return false;
    var q=this.get(id);
    if(!q || q.status!=='active') { this._minigame=null; return false; }
    if(ctx && ctx.questId===id && q.step!==ctx.step) {
        this._minigame=null;
        return false;
    }
    if(r==='FAIL' || r==='CANCEL') { this._minigame=null; return false; }
    var ok=false;
    if(r==='SUCCESS') ok=this.nextStep(id);
    else if(r==='COMPLETE') ok=this.complete(id);
    this._minigame=null;
    return ok;
};

Game_BFQuests.prototype.captureDigit = function(id,variableId){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id);
    if(!cfg) return false;
    var v=Number(variableId || cfg.digitVariable || 0);
    if(!v || !$gameVariables) return false;
    var digit=Number($gameVariables.value(v));
    if(!isFinite(digit)) return false;
    this._digits[id]=digit;
    this._notes['digit_'+id]=String(cfg.digitNote || 'Цифра: {digit}').replace(/\{digit\}/g,String(digit));
    return true;
};

Game_BFQuests.prototype.complete = function(id){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id), q=this.get(id);
    if(!cfg || !q || q.status!=='active') return q && q.status==='completed';

    // Сначала фиксируем цифру, пока квест ещё активен.
    if(cfg.digitVariable) this.captureDigit(id,cfg.digitVariable);

    q.status='completed';
    q.step=Math.max(0,(cfg.steps||[]).length-1);
    q.completedAt=Date.now();
    if(cfg.note) this._notes[id]=cfg.note;
    if(id==='intro'){
        if(BF.notesConfig().ape) this._notes.ape=BF.notesConfig().ape;
        if(BF.notesConfig().workers) this._notes.workers=BF.notesConfig().workers;
    }
    if(id==='house' && BF.notesConfig().house) this._notes.house=BF.notesConfig().house;
    if(id==='safe' && BF.notesConfig().accounting) this._notes.accounting=BF.notesConfig().accounting;

    if(this.workersComplete()) this._finishWorkersChain();
    if(id==='house' && !this.isStarted('passage')) this.start('passage');
    if(id==='passage' && !this.isStarted('safe')) this.start('safe');
    if(id==='safe' && !this.isStarted('evidence')) this.start('evidence');

    if(this._minigame && this._minigame.questId===id) this._minigame=null;
    if(this._currentQuest===id) this._currentQuest=null;
    if(this._selectedQuest===id) this._selectedQuest=null;
    return true;
};
Game_BFQuests.prototype.addNote = function(id){
    id=BF.normalizeId(id);
    var notes=BF.notesConfig();
    if(notes[id]) this._notes[id]=notes[id];
    return !!notes[id];
};
Game_BFQuests.prototype.selectQuest = function(id){
    id=BF.normalizeId(id);
    var q=this.get(id);
    if(!q || q.status!=='active') return false;
    this._selectedQuest=id;
    this._currentQuest=id;
    return true;
};
Game_BFQuests.prototype.selectedQuest = function(){
    var id=BF.normalizeId(this._selectedQuest || this._currentQuest);
    if(id){
        var q=this.get(id);
        if(q && q.status==='active') return id;
    }
    var active=this.getActive();
    return active.length?active[0]:null;
};
Game_BFQuests.prototype.getActive = function(){
    var out=[],seen={},self=this;
    Object.keys(this._data||{}).forEach(function(id){
        var q=self._data[id];
        if(!q || q.status!=='active' || !BF.configFor(id) || seen[id]) return;
        seen[id]=true; out.push(id);
    });
    return out;
};
Game_BFQuests.prototype.getCompleted = function(){
    var out=[],seen={},self=this;
    Object.keys(this._data||{}).forEach(function(id){
        var q=self._data[id];
        if(!q || q.status!=='completed' || !BF.configFor(id) || seen[id]) return;
        seen[id]=true; out.push(id);
    });
    return out;
};
Game_BFQuests.prototype.getStepText = function(id){
    id=BF.normalizeId(id);
    var cfg=BF.configFor(id),q=this.get(id);
    if(!cfg || !q || !cfg.steps || !cfg.steps.length) return '';
    return String(cfg.steps[q.step] || '');
};
Game_BFQuests.prototype.getDigits=function(){ return this._digits||{}; };

window.Game_BFQuests=Game_BFQuests;
window.$gameBFQuests=window.$gameBFQuests||null;
BF.game=function(){
    if(!window.$gameBFQuests || typeof window.$gameBFQuests.start!=='function') window.$gameBFQuests=new Game_BFQuests();
    if(typeof window.$gameBFQuests.validateState==='function') window.$gameBFQuests.validateState();
    return window.$gameBFQuests;
};
BF.minigameStart=function(appId,questId){ return BF.game().minigameStart(appId,questId); };
BF.minigameResult=function(result,questId){ return BF.game().minigameResult(result,questId); };
window.BF_QuestSystem.minigameStart=BF.minigameStart;
window.BF_QuestSystem.minigameResult=BF.minigameResult;

// -------------------------
// Сохранение / загрузка
// -------------------------
if(!DataManager.__bfQuestSavePatch){
    var _createGameObjects=DataManager.createGameObjects;
    DataManager.createGameObjects=function(){ _createGameObjects.call(this); window.$gameBFQuests=new Game_BFQuests(); };
    var _makeSaveContents=DataManager.makeSaveContents;
    DataManager.makeSaveContents=function(){ var c=_makeSaveContents.call(this); c.bfQuests=window.$gameBFQuests; return c; };
    var _extractSaveContents=DataManager.extractSaveContents;
    DataManager.extractSaveContents=function(c){
        _extractSaveContents.call(this,c);
        window.$gameBFQuests=c&&c.bfQuests?c.bfQuests:new Game_BFQuests();
        if(window.$gameBFQuests.validateState) window.$gameBFQuests.validateState();
    };
    DataManager.__bfQuestSavePatch=true;
}

// -------------------------
// Plugin Commands
// -------------------------
function executeCommand(args){
    args=args||[];
    var cmd=String(args[0]||'').toLowerCase();
    var id=String(args[1]||'').trim();
    var game=BF.game();
    if(cmd==='start'){ game.start(id); return; }
    if(cmd==='step'){ game.setStep(id,Number(args[2]||0)); return; }
    if(cmd==='next'){ game.nextStep(id); return; }
    if(cmd==='complete'){ game.complete(id); return; }
    if(cmd==='select'){ game.selectQuest(id); return; }
    if(cmd==='note'){ game.addNote(id); return; }
    if(cmd==='digit'){ game.captureDigit(id,Number(args[2]||0)); return; }
    if(cmd==='status'){ console.log('BF_Quest',id,game.status(id),game.get(id)); return; }
    if(cmd==='journal'){ SceneManager.push(Scene_BFJournal); return; }
    if(cmd==='minigamestart'){
        game.minigameStart(id,args[2]);
        return;
    }
    if(cmd==='minigameresult'){
        game.minigameResult(String(id||'').toUpperCase());
        return;
    }
}

// -------------------------
// Journal UI
// -------------------------
function Window_BFJournalText(){ this.initialize.apply(this,arguments); }
Window_BFJournalText.prototype=Object.create(Window_Base.prototype);
Window_BFJournalText.prototype.constructor=Window_BFJournalText;
Window_BFJournalText.prototype.initialize=function(x,y,w,h,mode){
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.opacity=0; this.backOpacity=0; this._mode=mode; this.refresh();
};
Window_BFJournalText.prototype.setMode=function(mode){ if(this._mode!==mode){this._mode=mode;this.refresh();} };
Window_BFJournalText.prototype.refresh=function(){
    this.contents.clear();
    this.contents.fontFace='Georgia, "Times New Roman", serif';
    this.contents.fontBold=false; this.contents.outlineWidth=0;
    var game=BF.game(), self=this;
    var ox=this._bookX||0, oy=this._bookY||0, bsx=this._bookScaleX||1, bsy=this._bookScaleY||1;
    function X(v){return ox+v*bsx;} function Y(v){return oy+v*bsy;} function W(v){return v*bsx;}
    function heading(win,text,x,y,w){win.contents.fontSize=32;win.contents.fontBold=true;win.changeTextColor('#6b3e1c');win.drawText(text,X(x),Y(y),W(w),'center');win.contents.fontBold=false;}
    function title(win,text,x,y,w){win.contents.fontSize=25;win.contents.fontBold=true;win.changeTextColor('#4a2814');win.drawText(text,X(x),Y(y),W(w),'left');win.contents.fontBold=false;}
    function body(win,text,x,y,w,a){win.contents.fontSize=25;win.contents.fontBold=false;win.changeTextColor('#4d301d');win.drawText(text,X(x),Y(y),W(w),a||'left');}
    function wrapPx(win,text,maxWidth){var words=String(text==null?'':text).split(/\s+/),lines=[],line='';words.forEach(function(word){if(!word)return;var t=line?line+' '+word:word;if(line&&win.contents.measureTextWidth(t)>maxWidth){lines.push(line);line=word;}else line=t;});if(line)lines.push(line);return lines;}
    function wrapped(win,text,x,y,w,h){var yy=y;win.contents.fontSize=25;wrapPx(win,text,W(w)).forEach(function(line){body(win,line,x,yy,w,'left');yy+=h;});return yy;}
    var L=92,LW=500,R=690,RW=455;
    if(this._mode==='active'){
        heading(this,'ТЕКУЩИЕ ДЕЛА',L,72,LW);heading(this,'ЗАПИСЬ РАССЛЕДОВАНИЯ',R,72,RW);
        var active=game.getActive();
        if(!active.length){title(this,'Пока нет текущих дел.',L,145,LW);body(this,'Когда Катя получит новое дело,',L,190,LW,'center');body(this,'оно появится здесь.',L,220,LW,'center');}
        else{
            var ly=135;
            active.forEach(function(id){var cfg=BF.configFor(id),q=game.get(id);if(!cfg||!q)return;title(self,'• '+cfg.title,L,ly,LW);ly+=34;ly=wrapped(self,(cfg.steps||[])[q.step]||'',L,ly,LW,28)+16;if(ly<590){self.contents.paintOpacity=70;self.contents.fillRect(X(L),Y(ly),W(LW),1,'#8f6a42');self.contents.paintOpacity=255;ly+=18;}});
        }
        var selected=game.selectedQuest();
        if(!selected){title(this,'Запись появится после получения дела.',R,145,RW);}
        else{
            var sc=BF.configFor(selected),sq=game.get(selected); if(sc&&sq){
                title(this,sc.title,R,142,RW);var ry=wrapped(this,sc.description||'',R,180,RW,28); 
                this.contents.paintOpacity=70;this.contents.fillRect(X(R),Y(ry+4),W(RW),1,'#8f6a42');this.contents.paintOpacity=255;
                if(sc.steps&&sc.steps.length){title(this,'Текущий шаг',R,ry+30,RW);wrapped(this,sc.steps[sq.step]||'',R,ry+65,RW,28);}
            }
        }
    } else if(this._mode==='notes'){
        heading(this,'ЛИЧНЫЕ ЗАМЕТКИ',L,72,LW);heading(this,'НАЙДЕННЫЕ СВЕДЕНИЯ',R,72,RW);
        var notes=game._notes||{},keys=Object.keys(notes);
        if(!keys.length){title(this,'Записей пока нет.',L,145,LW);}else{var ny=140;keys.forEach(function(k){ny=wrapped(self,notes[k],L,ny,LW,28)+10;});}
        body(this,'Здесь появляются только сведения,',R,150,RW,'left');body(this,'которые Катя уже узнала',R,182,RW,'left');body(this,'во время расследования.',R,214,RW,'left');
    } else {
        heading(this,'ЗАВЕРШЁННЫЕ ДЕЛА',L,72,LW);heading(this,'АРХИВ РАССЛЕДОВАНИЯ',R,72,RW);
        var done=game.getCompleted(); if(!done.length) title(this,'Пока ничего не завершено.',L,145,LW); else {var dy=145;done.forEach(function(id){var cfg=BF.configFor(id);if(!cfg)return;title(self,'✓ '+cfg.title,L,dy,LW);dy+=40;});}
        body(this,'Завершённые дела остаются',R,175,RW,'center');body(this,'в архиве Кати.',R,207,RW,'center');
    }
};

function Scene_BFJournal(){this.initialize.apply(this,arguments);}
Scene_BFJournal.prototype=Object.create(Scene_Base.prototype);
Scene_BFJournal.prototype.constructor=Scene_BFJournal;
Scene_BFJournal.prototype.drawBFTabs=function(bitmap){
    var b=bitmap;b.clear();b.fontFace='Georgia, "Times New Roman", serif';b.fontBold=true;b.fontSize=24;b.textColor='#f2dfb4';b.outlineColor='#2d1208';b.outlineWidth=3;
    var sx=this._bookScaleX||1,sy=this._bookScaleY||1,bx=this._bookX||0,by=this._bookY||0;
    var tabs=[{x:1162,y:108,w:106,h:88,label:'ДЕЛА'},{x:1162,y:207,w:106,h:88,label:'ЗАМЕТКИ'},{x:1162,y:307,w:106,h:88,label:'АРХИВ'}];
    function X(v){return Math.round(bx+v*sx);}function Y(v){return Math.round(by+v*sy);}function SW(v){return Math.round(v*sx);}function SH(v){return Math.round(v*sy);}
    tabs.forEach(function(t){b.drawText(t.label,X(t.x),Y(t.y)+Math.round(28*sy),SW(t.w),Math.max(28,Math.round(34*sy)),'center');});
    this._tabHit={tabs:tabs.map(function(t){return{x:X(t.x),y:Y(t.y),w:SW(t.w),h:SH(t.h)};}),closeX:X(1184),closeY:Y(8),closeW:SW(78),closeH:SH(82)};
};
Scene_BFJournal.prototype.create=function(){
    BF.refreshConfigAliases();Scene_Base.prototype.create.call(this);this._mode='active';
    this._dim=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));this._dim.bitmap.fillAll('rgba(0,0,0,0.18)');this.addChild(this._dim);
    var W=1280,H=720, sx=Math.min(1,Graphics.boxWidth/W), sy=Math.min(1,Graphics.boxHeight/H), scale=Math.min(sx,sy);
    this._bookX=Math.round((Graphics.boxWidth-W*scale)/2);this._bookY=Math.round((Graphics.boxHeight-H*scale)/2);this._bookScaleX=scale;this._bookScaleY=scale;this._bookScale=scale;
    this._book=new Sprite(ImageManager.loadPicture('BFJournal/JournalBook'));this._book.anchor.set(0,0);this._book.scale.set(scale,scale);this._book.x=this._bookX;this._book.y=this._bookY;this.addChild(this._book);
    this._bfTabs=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));this.drawBFTabs(this._bfTabs.bitmap);this.addChild(this._bfTabs);
    this._text=new Window_BFJournalText(0,0,Graphics.boxWidth,Graphics.boxHeight,'active');this._text.opacity=0;this._text.backOpacity=0;this._text.padding=0;
    this._text._bookX=this._bookX;this._text._bookY=this._bookY;this._text._bookScaleX=scale;this._text._bookScaleY=scale;this._text.createContents();this._text.refresh();this.addChild(this._text);
};
Scene_BFJournal.prototype.update=function(){
    Scene_Base.prototype.update.call(this);
    if(Input.isTriggered('cancel')||TouchInput.isCancelled()){SceneManager.pop();return;}
    if(!TouchInput.isTriggered())return;
    var x=TouchInput.x,y=TouchInput.y,hit=this._tabHit;
    if(hit&&x>=hit.closeX&&x<=hit.closeX+hit.closeW&&y>=hit.closeY&&y<=hit.closeY+hit.closeH){SceneManager.pop();return;}
    if(hit&&hit.tabs){
        if(y>=hit.tabs[0].y&&y<hit.tabs[0].y+hit.tabs[0].h&&x>=hit.tabs[0].x&&x<=hit.tabs[0].x+hit.tabs[0].w){this.setMode('active');return;}
        if(y>=hit.tabs[1].y&&y<hit.tabs[1].y+hit.tabs[1].h&&x>=hit.tabs[1].x&&x<=hit.tabs[1].x+hit.tabs[1].w){this.setMode('notes');return;}
        if(y>=hit.tabs[2].y&&y<hit.tabs[2].y+hit.tabs[2].h&&x>=hit.tabs[2].x&&x<=hit.tabs[2].x+hit.tabs[2].w){this.setMode('done');return;}
    }
    if(this._mode==='active'){
        var active=BF.game().getActive(),ly=132;
        for(var i=0;i<active.length;i++){
            var cfg=BF.configFor(active[i]),q=BF.game().get(active[i]);if(!cfg||!q)continue;
            var step=String((cfg.steps||[])[q.step]||''), lines=Math.max(1,Math.ceil(step.length/44)), h=Math.max(54,lines*28+34);
            if(y>=ly&&y<ly+h&&x>=80&&x<=625){BF.game().selectQuest(active[i]);this._text.refresh();return;}
            ly+=h+18;if(ly>620)break;
        }
    }
};
Scene_BFJournal.prototype.setMode=function(mode){this._mode=mode;this._text.setMode(mode);};
window.Scene_BFJournal=Scene_BFJournal;

if(!Game_Interpreter.prototype.__bfQuestSystemCommandPatchV6){
    var _bfPrevPluginCommand=Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand=function(command,args){
        if(String(command||'').toLowerCase()==='bf_quest'){executeCommand(args);return;}
        return _bfPrevPluginCommand.call(this,command,args);
    };
    Game_Interpreter.prototype.__bfQuestSystemCommandPatchV6=true;
}

})();
