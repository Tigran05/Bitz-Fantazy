/*:
 * @plugindesc Bitz Fantasy — карта текущей локации с местностью, целью и маршрутом
 * @author ASTROLIT GAMES
 *
 * Карта открывается кнопкой карты. Показывает:
 * - схему реальной проходимости текущей карты;
 * - игрока;
 * - текущую цель квеста;
 * - маршрут до цели;
 * - только игрок и текущая цель активного квеста; остальные события скрыты.
 *
 * Имя плагина: BF_QuestMap
 */
(function(){
'use strict';

var M = window.BF_QuestMap = window.BF_QuestMap || {};
M.version = '4.0';

/* Резервные цели. Если в проекте события имеют обычные имена NPC,
 * карта найдёт их автоматически. При необходимости сюда можно вписать
 * mapId/x/y без изменения имени плагина. */
M.TARGETS = M.TARGETS || {
    bartender: [{mapId:0,eventId:0}],
    engineer:  [{mapId:0,eventId:0}],
    manager:   [{mapId:0,eventId:0}],
    house:     [{mapId:0,eventId:0}],
    passage:   [{mapId:0,eventId:0}],
    safe:      [{mapId:0,eventId:0}],
    evidence:  [{mapId:0,eventId:0}]
};

M._keywords = {
    bartender:['бармен','bartender','крыса','крысы','подвал'],
    engineer:['инженер','engineer','азот','серверная','сервер'],
    manager:['менеджер','слот','шулер','доказательство','manager'],
    house:['бруно','дом бруно','bruno'],
    passage:['проход','подвал','тайный'],
    safe:['сейф','safe'],
    evidence:['бруно','bruno']
};

function eventText(ev){
    var out = [];
    if(!ev) return '';
    out.push(String(ev.name||''));
    var pages=ev.pages||[];
    pages.forEach(function(p){
        (p&&p.list||[]).forEach(function(cmd){
            if(cmd && (cmd.code===108 || cmd.code===408) && cmd.parameters) out.push(String(cmd.parameters[0]||''));
        });
    });
    return out.join(' ').toLowerCase();
}

M._findEvent = function(id){
    if(!$dataMap || !$dataMap.events) return null;
    var keys=M._keywords[id]||[];
    if(!keys.length) return null;
    var best=null, score=0;
    for(var i=1;i<$dataMap.events.length;i++){
        var ev=$dataMap.events[i];
        if(!ev) continue;
        var text=eventText(ev), s=0;
        keys.forEach(function(k){ if(text.indexOf(k.toLowerCase())>=0) s += (text===k.toLowerCase()?5:1); });
        if(s>score){ score=s; best=ev; }
    }
    return best;
};

M.currentTarget = function(){
    if (!window.BF_QuestSystem || !BF_QuestSystem.game) return null;
    var game = BF_QuestSystem.game();
    if (!game || !game.selectedQuest) return null;
    var id = game.selectedQuest();
    if (!id) return null;
    var q = game.get(id);
    if (!q || q.status !== 'active') return null;

    var arr=M.TARGETS[id]||[];
    var data=arr[q.step]||arr[0]||null;

    // First use explicit configured target.
    if(data && (Number(data.mapId||0) || data.x!=null)){
        return {id:id,step:q.step,data:data};
    }

    // Otherwise find a matching event in the current map.
    var ev=M._findEvent(id);
    if(ev) return {id:id,step:q.step,data:{mapId:$gameMap.mapId(),eventId:ev.id,x:ev.x,y:ev.y}};
    return {id:id,step:q.step,data:null};
};

M.resolve = function(t){
    if(!t) return null;
    var mapId=Number(t.mapId||0);
    if(!mapId) return null;
    if(t.eventId && $gameMap && $gameMap.mapId()===mapId){
        var ev=$gameMap.event(Number(t.eventId));
        if(ev) return ev ? {mapId:mapId,x:ev.x,y:ev.y} : null;
    }
    if(t.x!=null && t.y!=null) return {mapId:mapId,x:Number(t.x),y:Number(t.y)};
    return null;
};

function passable(x,y){
    if(x<0||y<0||x>=$gameMap.width()||y>=$gameMap.height()) return false;
    return $gameMap.isPassable(x,y,2)||$gameMap.isPassable(x,y,4)||
           $gameMap.isPassable(x,y,6)||$gameMap.isPassable(x,y,8);
}

function route(fromX,fromY,toX,toY){
    var q=[{x:fromX,y:fromY}], head=0, seen={}, prev={};
    var key=function(x,y){return x+','+y;};
    seen[key(fromX,fromY)]=true;
    var dirs=[[0,-1],[1,0],[0,1],[-1,0]];
    while(head<q.length){
        var n=q[head++];
        if(n.x===toX&&n.y===toY) break;
        dirs.forEach(function(d){
            var x=n.x+d[0],y=n.y+d[1],k=key(x,y);
            if(!seen[k] && passable(x,y)){
                seen[k]=true; prev[k]={x:n.x,y:n.y}; q.push({x:x,y:y});
            }
        });
    }
    var end=key(toX,toY);
    if(!seen[end]) return [];
    var out=[], cur={x:toX,y:toY};
    while(!(cur.x===fromX&&cur.y===fromY)){
        out.push(cur);
        cur=prev[key(cur.x,cur.y)];
        if(!cur) return [];
    }
    out.push({x:fromX,y:fromY});
    out.reverse();
    return out;
}

function terrainColor(x,y){
    var tags=[];
    try { tags.push($gameMap.terrainTag(x,y)); } catch(e){}
    var tid=0;
    try { tid=$gameMap.tileId(x,y,0); } catch(e){}
    // Common MV terrain conventions: terrain tag 1 is often water/decoration.
    if(tags[0]===1) return '#355f70';
    if(tags[0]>=2) return '#557b59';
    var p=passable(x,y);
    if(!p) return '#493b34';
    // Use lower-layer tile id to produce a little visual variation.
    if(tid % 7 === 0) return '#80715c';
    if(tid % 5 === 0) return '#74664f';
    return '#8d8068';
}

function Scene_BFMap(){ this.initialize.apply(this,arguments); }
Scene_BFMap.prototype=Object.create(Scene_Base.prototype);
Scene_BFMap.prototype.constructor=Scene_BFMap;

Scene_BFMap.prototype.create=function(){
    Scene_Base.prototype.create.call(this);
    this._dim=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));
    this._dim.bitmap.fillAll('rgba(0,0,0,0.62)');
    this.addChild(this._dim);

    var w=Math.min(Graphics.boxWidth-90,1100);
    var h=Math.min(Graphics.boxHeight-70,690);
    this._map=new Sprite(new Bitmap(w,h));
    this._map.x=(Graphics.boxWidth-w)/2;
    this._map.y=(Graphics.boxHeight-h)/2;
    this.addChild(this._map);
    this.refresh();
};

Scene_BFMap.prototype.refresh=function(){
    var b=this._map.bitmap,w=b.width,h=b.height;
    b.clear(); b.fillAll('#171514'); b.paintOpacity=255;

    b.fillRect(8,8,w-16,h-16,'#332b24');
    var border='#e8cf9a';
    b.fillRect(8,8,w-16,2,border); b.fillRect(8,h-10,w-16,2,border);
    b.fillRect(8,8,2,h-16,border); b.fillRect(w-10,8,2,h-16,border);

    var title='КАРТА';
    if($dataMapInfos&&$dataMapInfos[$gameMap.mapId()]){
        var n=$dataMapInfos[$gameMap.mapId()].name;
        if(n) title+=' — '+n;
    }
    b.font='bold 25px Georgia'; b.textColor='#f0d49a';
    b.drawText(title,25,22,w-50,35,'center');

    var areaX=32,areaY=70,areaW=w-64,areaH=h-145;
    var mw=$gameMap.width(),mh=$gameMap.height();
    var scale=Math.min(areaW/mw,areaH/mh);
    // Keep the map readable: don't let tiny maps become a single giant square.
    var mapW=mw*scale,mapH=mh*scale;
    var ox=areaX+(areaW-mapW)/2,oy=areaY+(areaH-mapH)/2;

    // Actual map terrain/progress schematic.
    for(var y=0;y<mh;y++){
        for(var x=0;x<mw;x++){
            var c=terrainColor(x,y);
            var px=ox+x*scale,py=oy+y*scale;
            b.fillRect(px,py,Math.ceil(scale),Math.ceil(scale),c);
            if(scale>=8){
                b.paintOpacity=28;
                b.fillRect(px,py,Math.ceil(scale)-1,1,'#f5e7c6');
                b.fillRect(px,py,1,Math.ceil(scale)-1,'#f5e7c6');
                b.paintOpacity=255;
            }
        }
    }

    var target=M.currentTarget(),resolved=M.resolve(target&&target.data);
    var path=[];
    if(resolved && resolved.mapId===$gameMap.mapId()){
        path=route($gamePlayer.x,$gamePlayer.y,resolved.x,resolved.y);
        if(path.length){
            b.paintOpacity=190;
            for(var i=0;i<path.length;i++){
                var p=path[i],rx=ox+p.x*scale+scale/2,ry=oy+p.y*scale+scale/2;
                b.fillRect(rx-Math.max(2,scale*.13),ry-Math.max(2,scale*.13),
                           Math.max(4,scale*.26),Math.max(4,scale*.26),'#e2a83d');
            }
            b.paintOpacity=255;
        }
        var tx=ox+resolved.x*scale+scale/2,ty=oy+resolved.y*scale+scale/2;
        b.drawCircle(tx,ty,Math.max(6,Math.min(11,scale*.75)),'#ffd15a');
        b.font='bold 14px Georgia';b.textColor='#ffd15a';
        b.drawText('ЦЕЛЬ',tx+10,ty-10,110,22,'left');
    }

    var px=ox+$gamePlayer.x*scale+scale/2,py=oy+$gamePlayer.y*scale+scale/2;
    b.drawCircle(px,py,Math.max(5,Math.min(10,scale*.7)),'#52b9ff');
    b.font='bold 14px Georgia';b.textColor='#52b9ff';
    b.drawText('ВЫ',px+10,py-10,80,22,'left');

    // Не показываем остальные события карты.
    // На карте игрок видит только себя и текущую цель активного квеста.
    // NPC, триггеры, скрытые события и технические события не являются
    // точками интереса и не должны раскрывать игроку устройство карты.

    if(target && !resolved){
        b.font='16px Georgia';b.textColor='#ffd15a';
        b.drawText('Цель находится в другой локации или ещё не определена.',
                   0,h-68,w,25,'center');
    } else if(target && !path.length && resolved){
        b.font='14px Georgia';b.textColor='#f0c97a';
        b.drawText('Прямой маршрут не найден — ориентируйся по карте.',
                   0,h-68,w,25,'center');
    }

    b.font='15px Georgia';b.textColor='#ead9bd';
    b.drawText('● ВЫ     ● ЦЕЛЬ     — МАРШРУТ',
               25,h-38,w-50,22,'center');
};

Scene_BFMap.prototype.update=function(){
    Scene_Base.prototype.update.call(this);
    if(Input.isTriggered('cancel')||TouchInput.isCancelled()) SceneManager.pop();
};

window.Scene_BFMap=Scene_BFMap;
})();
