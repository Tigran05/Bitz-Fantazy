/*:
 * @plugindesc Bitz Fantasy — BF_SwitchPuzzle V1. "Электрощит Вермилиона" — мини-игра с 5 тумблерами.
 * @help
 * Plugin Command:
 *   BF_SwitchPuzzle start
 *
 * Управление: мышь / touch по тумблерам, Esc (cancel) — выход без успеха.
 * Успех включает Self Switch A события, запустившего игру, и сообщает
 * BF_QuestSystem о SUCCESS (квест 'vermillion' сам продвигает шаг 7 -> 8).
 */
(function(){
'use strict';

function rect(b,x,y,w,h,fill,stroke,lw){
    if(!b) return;
    if(fill){ b.fillRect(x,y,w,h,fill); }
    if(stroke){
        var c=b._context; if(!c) return;
        c.save(); c.strokeStyle=stroke; c.lineWidth=lw||2; c.strokeRect(x+0.5,y+0.5,w-1,h-1); c.restore();
        if(b._setDirty) b._setDirty();
    }
}
function circle(b,x,y,r,fill,stroke,lw){
    var c=b._context; if(!c) return;
    c.save(); c.beginPath(); c.arc(x,y,r,0,Math.PI*2);
    if(fill){ c.fillStyle=fill; c.fill(); }
    if(stroke){ c.strokeStyle=stroke; c.lineWidth=lw||2; c.stroke(); }
    c.restore();
    if(b._setDirty) b._setDirty();
}
function line(b,x1,y1,x2,y2,stroke,lw){
    var c=b._context; if(!c) return;
    c.save(); c.strokeStyle=stroke; c.lineWidth=lw||3; c.lineCap='round';
    c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.restore();
    if(b._setDirty) b._setDirty();
}

var BF={mapId:0,eventId:0};
var TARGET=[1,0,1,1,0];

var _pc=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
    _pc.call(this,command,args);
    if(String(command).toLowerCase()==='bf_switchpuzzle' && String(args&&args[0]).toLowerCase()==='start'){
        BF.mapId=this._mapId||$gameMap.mapId();
        BF.eventId=this._eventId||0;
        if(window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameStart==='function'){
            window.BF_QuestSystem.minigameStart('BF_SwitchPuzzle','vermillion');
        }
        SceneManager.push(Scene_BFSwitchPuzzle);
    }
};

function Scene_BFSwitchPuzzle(){ this.initialize.apply(this,arguments); }
Scene_BFSwitchPuzzle.prototype=Object.create(Scene_Base.prototype);
Scene_BFSwitchPuzzle.prototype.constructor=Scene_BFSwitchPuzzle;
Scene_BFSwitchPuzzle.prototype.initialize=function(){
    Scene_Base.prototype.initialize.call(this);
    this._toggles=[0,0,0,0,0];
    this._won=false;
    this._successApplied=false;
    this._errorTimer=0;
    this._wonTimer=0;
    this._message='Переключите тумблеры в правильную комбинацию.';
    this._started=false;
};
Scene_BFSwitchPuzzle.prototype.create=function(){
    Scene_Base.prototype.create.call(this);
    this.createWindowLayer();
    this._layout();
    this.createHud();
    this._started=true;
};
Scene_BFSwitchPuzzle.prototype.createHud=function(){
    this._g=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));
    this.addChild(this._g);
    this.redraw();
};
Scene_BFSwitchPuzzle.prototype._layout=function(){
    var w=Graphics.boxWidth;
    var count=this._toggles.length;
    var panelW=Math.min(640,w-60);
    var startX=Math.floor((w-panelW)/2);
    var gap=Math.floor(panelW/count);
    this._slots=[];
    for(var i=0;i<count;i++){
        var cx=startX+gap*i+Math.floor(gap/2);
        this._slots.push({cx:cx,trackY:260,trackH:140,lampY:220,r:26});
    }
    this._panelX=startX-40;
    this._panelW=panelW+80;
    this._exitRect={x:w-150,y:16,w:120,h:40};
};
Scene_BFSwitchPuzzle.prototype.redraw=function(){
    var b=this._g.bitmap,w=Graphics.boxWidth,h=Graphics.boxHeight;
    b.clear();
    b.fillRect(0,0,w,h,'#0d1419');
    b.fillRect(0,0,w,86,'#161f27');

    b.textColor='#eaf6ff'; b.fontSize=28;
    b.drawText('ЭЛЕКТРОЩИТ',24,10,500,34,'left');
    b.fontSize=15; b.textColor='#a9bcc8';
    b.drawText('Восстановите питание.',24,46,500,22,'left');

    // exit button
    var ex=this._exitRect;
    rect(b,ex.x,ex.y,ex.w,ex.h,'#2a1c1c','#9a5050',2);
    b.fontSize=15; b.textColor='#eab8b8';
    b.drawText('ВЫХОД (Esc)',ex.x,ex.y+10,ex.w,20,'center');

    // switchboard panel
    var panelY=120, panelH=320;
    rect(b,this._panelX,panelY,this._panelW,panelH,'#1c2730','#56707d',3);
    rect(b,this._panelX+8,panelY+8,this._panelW-16,panelH-16,'#141d24',null,0);

    // central power core
    var coreX=Math.floor(w/2), coreY=panelY+30;
    circle(b,coreX,coreY,16,this._won?'#e9c25a':'#3a4a52', this._won?'#fff6cf':'#6c8896',3);

    for(var i=0;i<this._slots.length;i++){
        var s=this._slots[i];
        var on=!!this._toggles[i];

        // wire from core to toggle
        line(b,coreX,coreY+16,s.cx,s.lampY-s.r,this._won?'#e9c25a':'#3a4a52',3);

        // indicator lamp
        var lampColor=on?'#8fe09a':'#3a2a2a';
        var lampStroke=on?'#c9ffd1':'#6c4a4a';
        circle(b,s.cx,s.lampY-s.r,10,lampColor,lampStroke,2);

        // toggle track (slot)
        rect(b,s.cx-18,s.trackY,36,s.trackH,'#232f38','#55707d',2);

        // toggle handle: top = ON, bottom = OFF
        var handleY = on ? (s.trackY+34) : (s.trackY+s.trackH-34);
        rect(b,s.cx-16,s.trackY+2,32,s.trackH-4,'#1a2229',null,0);
        circle(b,s.cx,handleY,22,on?'#6fae7a':'#8a5a5a',on?'#bdf0c5':'#d99d9d',3);

        b.fontSize=13; b.textColor='#9fb2c2';
        b.drawText(String(i+1),s.cx-15,s.trackY+s.trackH+6,30,18,'center');
        b.fontSize=12; b.textColor=on?'#9ce8ae':'#c98f8f';
        b.drawText(on?'ON':'OFF',s.cx-25,s.trackY+s.trackH+24,50,16,'center');
    }

    // message line
    var msgY=panelY+panelH+20;
    b.fontSize=16;
    b.textColor=this._won?'#9ce8ae':(this._errorTimer>0?'#ff9b7d':'#dce8ef');
    b.drawText(this._message,24,msgY,w-48,24,'center');

    // instruction
    b.fontSize=13; b.textColor='#7f919b';
    b.drawText('Переключите тумблеры в правильную комбинацию.',24,msgY+30,w-48,20,'center');
};
Scene_BFSwitchPuzzle.prototype.update=function(){
    Scene_Base.prototype.update.call(this);
    if(!this._started) return;

    if(this._errorTimer>0){ this._errorTimer--; if(this._errorTimer===0){ this._message='Переключите тумблеры в правильную комбинацию.'; this.redraw(); } }

    if(this._won){
        this._wonTimer--;
        if(this._wonTimer<=0){ this._finish(); }
        return;
    }

    if(Input.isTriggered('cancel')){ this._cancel(); return; }

    if(TouchInput.isTriggered()){
        var x=TouchInput.x, y=TouchInput.y;
        var ex=this._exitRect;
        if(x>=ex.x && x<=ex.x+ex.w && y>=ex.y && y<=ex.y+ex.h){ this._cancel(); return; }
        for(var i=0;i<this._slots.length;i++){
            var s=this._slots[i];
            if(x>=s.cx-24 && x<=s.cx+24 && y>=s.trackY-4 && y<=s.trackY+s.trackH+4){
                this._toggles[i]=this._toggles[i]?0:1;
                SoundManager.playCursor();
                this._checkCombo();
                this.redraw();
                break;
            }
        }
    }
};
Scene_BFSwitchPuzzle.prototype._checkCombo=function(){
    var ok=true;
    for(var i=0;i<TARGET.length;i++){ if(this._toggles[i]!==TARGET[i]){ ok=false; break; } }
    if(ok){
        this._won=true;
        this._wonTimer=50;
        this._message='НАПРЯЖЕНИЕ ВОССТАНОВЛЕНО!';
        SoundManager.playOk();
        this._applySuccess();
    } else {
        this._errorTimer=36;
        this._message='Неверная комбинация.';
    }
};
Scene_BFSwitchPuzzle.prototype._applySuccess=function(){
    if(this._successApplied) return;
    this._successApplied=true;
    if(BF.eventId>0 && window.$gameSelfSwitches){
        $gameSelfSwitches.setValue([BF.mapId,BF.eventId,'A'],true);
    }
    if(window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameResult==='function'){
        window.BF_QuestSystem.minigameResult('SUCCESS');
    }
};
Scene_BFSwitchPuzzle.prototype._cancel=function(){
    SceneManager.pop();
};
Scene_BFSwitchPuzzle.prototype._finish=function(){
    SceneManager.pop();
};
Scene_BFSwitchPuzzle.prototype.terminate=function(){
    Scene_Base.prototype.terminate.call(this);
};

window.Scene_BFSwitchPuzzle=Scene_BFSwitchPuzzle;
})();
