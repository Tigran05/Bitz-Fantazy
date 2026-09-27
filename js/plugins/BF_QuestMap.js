/*:
 * @plugindesc Bitz Fantasy — красивая карта-пергамент: местность, игрок, текущая цель и маршрут
 * @author ASTROLIT GAMES
 *
 * Карта показывает только:
 * - стилизованную местность текущей карты;
 * - игрока;
 * - текущую цель активного квеста, если она явно задана в BF_QuestConfig;
 * - маршрут до цели на текущей карте.
 *
 * НЕ показывает события карты: NPC, двери, переходы, катсцены, триггеры,
 * сундуки и технические события не сканируются и не рисуются.
 *
 * Имя плагина: BF_QuestMap
 */
(function(){
'use strict';

var M = window.BF_QuestMap = window.BF_QuestMap || {};
M.version = '6.0';

/*
 * Цели карты задаются только в BF_QuestConfig.js.
 * Пример:
 *
 * mapTargets: {
 *   0: { mapId: 12, x: 18, y: 9 },
 *   1: { mapId: 12, x: 22, y: 14 }
 * }
 *
 * Или с eventId, если цель должна привязываться к известному событию:
 *   1: { mapId: 12, eventId: 7 }
 *
 * Карта НИКОГДА не сканирует список событий ради поиска целей.
 */

M.currentTarget = function(){
    if (!window.BF_QuestSystem || !BF_QuestSystem.game) return null;
    var game = BF_QuestSystem.game();
    if (!game || !game.selectedQuest) return null;

    var id = game.selectedQuest();
    if (!id) return null;

    var q = game.get(id);
    if (!q || q.status !== 'active') return null;

    var cfg = window.BF_QuestConfig && BF_QuestConfig.QUESTS && BF_QuestConfig.QUESTS[id];
    if (!cfg || !cfg.mapTargets) return { id:id, step:q.step, data:null };

    var data = cfg.mapTargets[q.step];
    if (!data) return { id:id, step:q.step, data:null };

    return { id:id, step:q.step, data:data };
};

M.resolve = function(t){
    if(!t) return null;

    var mapId = Number(t.mapId || 0);
    if(!mapId) return null;

    // EventId используется только если он прямо указан в конфиге.
    if(t.eventId && $gameMap && $gameMap.mapId()===mapId){
        var ev = $gameMap.event(Number(t.eventId));
        if(ev) return { mapId:mapId, x:ev.x, y:ev.y };
        return null;
    }

    if(t.x!=null && t.y!=null){
        return { mapId:mapId, x:Number(t.x), y:Number(t.y) };
    }

    return null;
};

function passable(x,y){
    if(x<0 || y<0 || x>=$gameMap.width() || y>=$gameMap.height()) return false;
    return $gameMap.isPassable(x,y,2) ||
           $gameMap.isPassable(x,y,4) ||
           $gameMap.isPassable(x,y,6) ||
           $gameMap.isPassable(x,y,8);
}

function route(fromX,fromY,toX,toY){
    if(fromX===toX && fromY===toY) return [{x:fromX,y:fromY}];

    var q=[{x:fromX,y:fromY}], head=0, seen={}, prev={};
    var key=function(x,y){ return x+','+y; };
    var startKey=key(fromX,fromY);
    seen[startKey]=true;

    var dirs=[[0,-1],[1,0],[0,1],[-1,0]];

    while(head<q.length){
        var n=q[head++];
        if(n.x===toX && n.y===toY) break;

        for(var i=0;i<dirs.length;i++){
            var x=n.x+dirs[i][0], y=n.y+dirs[i][1], k=key(x,y);
            if(seen[k] || !passable(x,y)) continue;
            seen[k]=true;
            prev[k]={x:n.x,y:n.y};
            q.push({x:x,y:y});
        }
    }

    var end=key(toX,toY);
    if(!seen[end]) return [];

    var out=[], cur={x:toX,y:toY};
    while(!(cur.x===fromX && cur.y===fromY)){
        out.push(cur);
        cur=prev[key(cur.x,cur.y)];
        if(!cur) return [];
    }
    out.push({x:fromX,y:fromY});
    out.reverse();
    return out;
}

function terrainInfo(x,y){
    var tag=0, tile=0;
    try{ tag=Number($gameMap.terrainTag(x,y)||0); }catch(e){}
    try{ tile=Number($gameMap.tileId(x,y,0)||0); }catch(e){}

    return {
        tag:tag,
        tile:tile,
        pass:passable(x,y)
    };
}

function hash(x,y){
    var n = ((x+17)*374761393 + (y+31)*668265263) | 0;
    n = (n ^ (n >>> 13)) | 0;
    n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function line(bitmap,x1,y1,x2,y2,width,color,alpha){
    var c=bitmap.context;
    c.save();
    c.globalAlpha = alpha==null ? 1 : alpha;
    c.strokeStyle=color;
    c.lineWidth=width;
    c.lineCap='round';
    c.beginPath();
    c.moveTo(x1,y1);
    c.lineTo(x2,y2);
    c.stroke();
    c.restore();
}

function poly(bitmap,points,fill,alpha,stroke,strokeWidth){
    if(!points || !points.length) return;
    var c=bitmap.context;
    c.save();
    c.globalAlpha=alpha==null ? 1 : alpha;
    c.beginPath();
    c.moveTo(points[0][0],points[0][1]);
    for(var i=1;i<points.length;i++) c.lineTo(points[i][0],points[i][1]);
    c.closePath();
    if(fill){ c.fillStyle=fill; c.fill(); }
    if(stroke){ c.strokeStyle=stroke; c.lineWidth=strokeWidth||1; c.stroke(); }
    c.restore();
}

function drawRoundRect(bitmap,x,y,w,h,r,fill,stroke,strokeWidth){
    var c=bitmap.context;
    c.save();
    c.beginPath();
    c.moveTo(x+r,y);
    c.lineTo(x+w-r,y);
    c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);
    c.quadraticCurveTo(x,y,x+r,y);
    c.closePath();
    c.fillStyle=fill; c.fill();
    if(stroke){ c.strokeStyle=stroke; c.lineWidth=strokeWidth||1; c.stroke(); }
    c.restore();
}

function drawCompass(bitmap,cx,cy,r){
    var c=bitmap.context;
    c.save();
    c.translate(cx,cy);

    // shadow
    c.globalAlpha=.18;
    c.fillStyle='#3b2416';
    c.beginPath(); c.arc(4,5,r+4,0,Math.PI*2); c.fill();
    c.globalAlpha=1;

    c.fillStyle='#ead39c';
    c.beginPath(); c.arc(0,0,r+2,0,Math.PI*2); c.fill();
    c.strokeStyle='#704826'; c.lineWidth=2; c.stroke();

    var pts=[
        [0,-r],[r*.22,-r*.22],[0,0],[-r*.22,-r*.22],
        [r,0],[r*.22,r*.22],[0,0],[r*.22,-r*.22]
    ];
    poly(bitmap,[[-r*.18,0],[0,-r],[r*.18,0],[0,r]],'#6e4728',1,'#3e2818',1.5);
    poly(bitmap,[[-r*.18,0],[0,r], [r*.18,0],[0,-r]],'#b38d5b',1,'#3e2818',1.2);
    c.fillStyle='#5a371f';
    c.font='bold 14px Georgia'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('N',0,-r-14);
    c.fillText('S',0,r+14);
    c.fillText('E',r+14,0);
    c.fillText('W',-r-14,0);
    c.restore();
}

function Scene_BFMap(){ this.initialize.apply(this,arguments); }
Scene_BFMap.prototype=Object.create(Scene_Base.prototype);
Scene_BFMap.prototype.constructor=Scene_BFMap;

Scene_BFMap.prototype.create=function(){
    Scene_Base.prototype.create.call(this);

    this._dim=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));
    this._dim.bitmap.fillAll('rgba(16,12,8,0.72)');
    this.addChild(this._dim);

    this._panel=new Sprite(new Bitmap(Math.min(Graphics.boxWidth-80,1160), Math.min(Graphics.boxHeight-52,668)));
    this._panel.x=(Graphics.boxWidth-this._panel.bitmap.width)/2;
    this._panel.y=(Graphics.boxHeight-this._panel.bitmap.height)/2;
    this.addChild(this._panel);

    this.refresh();
};

Scene_BFMap.prototype.refresh=function(){
    var b=this._panel.bitmap;
    var w=b.width, h=b.height;
    var mapLocalX=38, mapLocalY=112;
    var mapLocalW=w-360, mapLocalH=h-165;
    var sideX=mapLocalX+mapLocalW+24, sideW=w-sideX-28;

    b.clear();
    b.paintOpacity=255;
    b.fillAll('#1f1710');

    // Пергамент с двойной рамкой.
    drawRoundRect(b,8,8,w-16,h-16,18,'#d8c08c','#7a4d2b',4);
    drawRoundRect(b,17,17,w-34,h-34,14,'#ead8aa','#a67a49',2);
    drawRoundRect(b,25,25,w-50,h-50,12,'rgba(255,245,211,0.20)', '#d0aa72',1);

    // Декоративные уголки.
    var corner='#80552f';
    line(b,38,48,92,48,3,corner,.72);
    line(b,38,48,38,90,3,corner,.72);
    line(b,w-38,48,w-92,48,3,corner,.72);
    line(b,w-38,48,w-38,90,3,corner,.72);
    line(b,38,h-48,92,h-48,3,corner,.72);
    line(b,38,h-48,38,h-90,3,corner,.72);
    line(b,w-38,h-48,w-92,h-48,3,corner,.72);
    line(b,w-38,h-48,w-38,h-90,3,corner,.72);

    b.font='bold 31px Georgia';
    b.textColor='#4e2e1b';
    b.drawText('КАРТА',44,31,w-180,40,'left');

    var mapName='';
    try{
        if($dataMapInfos && $dataMapInfos[$gameMap.mapId()]) mapName=$dataMapInfos[$gameMap.mapId()].name||'';
    }catch(e){}
    if(mapName){
        b.font='italic 16px Georgia';
        b.textColor='#785335';
        b.drawText('— '+mapName+' —',210,39,w-450,24,'left');
    }

    this.drawCloseButton(b,w-92,56);

    // Плашка текущего задания.
    var target=M.currentTarget();
    var questTitle='Нет выбранного дела';
    var stepText='Открой блокнот и выбери активное дело.';
    if(target && target.id && window.BF_QuestConfig && BF_QuestConfig.QUESTS){
        var cfg=BF_QuestConfig.QUESTS[target.id];
        if(cfg){
            questTitle=cfg.title||target.id;
            if(window.BF_QuestSystem && BF_QuestSystem.game){
                var g=BF_QuestSystem.game(),q=g.get(target.id);
                if(q && cfg.steps) stepText=String(cfg.steps[q.step]||'');
            }
        }
    }
    drawRoundRect(b,mapLocalX,mapLocalY,mapLocalW,mapLocalH,8,'#efe0b5','#91643b',3);

    // Карта без сетки: крупные пятна рельефа/местности.
    this.drawTerrain(b,mapLocalX+10,mapLocalY+10,mapLocalW-20,mapLocalH-20);

    // Компас.
    drawCompass(b,mapLocalX+62,mapLocalY+62,27);

    // Боковая карточка задания.
    drawRoundRect(b,sideX,112,sideW,mapLocalH,10,'rgba(108,75,42,0.10)','#9b7047',2);
    b.font='bold 15px Georgia';b.textColor='#5a361e';
    b.drawText('ТЕКУЩАЯ ЦЕЛЬ',sideX+16,132,sideW-32,22,'center');

    b.font='bold 17px Georgia';b.textColor='#4c2c19';
    var qLines=this.wrapText(questTitle,Math.max(16,Math.floor(sideW/10)));
    var qy=171;
    for(var i=0;i<qLines.length;i++){ b.drawText(qLines[i],sideX+16,qy,sideW-32,22,'center'); qy+=22; }

    line(b,sideX+18,qy+9,sideX+sideW-18,qy+9,1,'#9b7047',.75);
    qy+=29;
    b.font='bold 13px Georgia';b.textColor='#765033';
    b.drawText('ШАГ',sideX+16,qy,sideW-32,20,'center');
    qy+=25;
    b.font='15px Georgia';b.textColor='#4d3423';
    var sLines=this.wrapText(stepText,Math.max(16,Math.floor(sideW/9)));
    for(i=0;i<sLines.length && qy<mapLocalY+260;i++){ b.drawText(sLines[i],sideX+16,qy,sideW-32,21,'center'); qy+=21; }

    line(b,sideX+18,mapLocalY+300,sideX+sideW-18,mapLocalY+300,1,'#9b7047',.75);
    b.font='13px Georgia';b.textColor='#765033';
    b.drawText('Обозначения',sideX+16,mapLocalY+320,sideW-32,20,'center');
    b.font='bold 13px Georgia';
    b.textColor='#5d3b1e';
    b.drawText('● ВЫ',sideX+28,mapLocalY+352,sideW-56,20,'left');
    b.textColor='#7d3f23';
    b.drawText('● ЦЕЛЬ',sideX+28,mapLocalY+378,sideW-56,20,'left');
    b.textColor='#89622d';
    b.drawText('━ МАРШРУТ',sideX+28,mapLocalY+404,sideW-56,20,'left');

    b.font='12px Georgia';b.textColor='#725238';
    b.drawText('Карта не показывает',sideX+16,mapLocalY+mapLocalH-66,sideW-32,18,'center');
    b.drawText('скрытые события мира.',sideX+16,mapLocalY+mapLocalH-46,sideW-32,18,'center');

    // Нижняя подпись.
    b.font='italic 13px Georgia';b.textColor='#785337';
    b.drawText('Щёлкни по ✕, чтобы вернуться в игру',40,h-43,w-80,22,'center');
};

Scene_BFMap.prototype.wrapText=function(text,maxChars){
    var words=String(text||'').split(/\s+/),out=[],line='';
    for(var i=0;i<words.length;i++){
        var word=words[i];
        var next=line ? line+' '+word : word;
        if(next.length>maxChars && line){ out.push(line); line=word; }
        else line=next;
    }
    if(line) out.push(line);
    return out;
};

Scene_BFMap.prototype.drawCloseButton=function(b,cx,cy){
    var c=b.context;
    // тень
    c.save();
    c.globalAlpha=.18;
    c.fillStyle='#3b2212';
    c.beginPath();c.arc(cx+3,cy+4,28,0,Math.PI*2);c.fill();
    c.restore();

    c.save();
    c.fillStyle='#b56b4d';
    c.beginPath();c.arc(cx,cy,26,0,Math.PI*2);c.fill();
    c.strokeStyle='#6f3e29';c.lineWidth=2;c.stroke();
    c.fillStyle='#f6dfb5';
    c.beginPath();c.arc(cx,cy,20,0,Math.PI*2);c.fill();
    c.strokeStyle='#9a6b42';c.lineWidth=1;c.stroke();
    c.restore();

    b.font='bold 27px Georgia';
    b.textColor='#5b321e';
    b.drawText('×',cx-18,cy-17,36,34,'center');
    b.font='11px Georgia';
    b.textColor='#6a4224';
    b.drawText('ВЫХОД',cx-40,cy+31,80,18,'center');
};

Scene_BFMap.prototype.drawTerrain=function(b,areaX,areaY,areaW,areaH){
    var mw=$gameMap.width(), mh=$gameMap.height();
    if(!mw || !mh) return;

    var scale=Math.min(areaW/mw,areaH/mh);
    var mapW=mw*scale,mapH=mh*scale;
    var ox=areaX+(areaW-mapW)/2,oy=areaY+(areaH-mapH)/2;

    // Основной пергамент.
    b.fillRect(areaX,areaY,areaW,areaH,'#ead7a8');

    // Водные участки и крупные пятна рельефа.
    for(var y=0;y<mh;y++){
        for(var x=0;x<mw;x++){
            var info=terrainInfo(x,y);
            var px=ox+x*scale, py=oy+y*scale;

            if(info.tag===1){
                b.paintOpacity=150;
                b.fillRect(px,py,Math.ceil(scale)+1,Math.ceil(scale)+1,'#6f9baa');
                b.paintOpacity=255;
            }else if(info.tag>=2){
                b.paintOpacity=85;
                b.fillRect(px,py,Math.ceil(scale)+1,Math.ceil(scale)+1,'#73885e');
                b.paintOpacity=255;
            }else if(!info.pass){
                // Стена/скала: плотный коричневый цвет без клетчатой сетки.
                b.paintOpacity=170;
                b.fillRect(px,py,Math.ceil(scale)+1,Math.ceil(scale)+1,'#756149');
                b.paintOpacity=255;
            }
        }
    }

    // Мягкая текстура: лесные кусты, камни и контуры. Рисуем только на самой карте,
    // не извлекая и не показывая события.
    var step=Math.max(3,Math.floor(7/Math.max(.35,scale)));
    var c=b.context;
    c.save();
    c.globalAlpha=.32;
    for(y=0;y<mh;y+=step){
        for(x=0;x<mw;x+=step){
            var inf=terrainInfo(x,y);
            var px2=ox+x*scale+scale*.5, py2=oy+y*scale+scale*.5;
            if(inf.tag>=2 && inf.pass){
                c.fillStyle='#557044';
                c.beginPath();c.arc(px2,py2,Math.max(2,scale*.22),0,Math.PI*2);c.fill();
                c.beginPath();c.arc(px2-scale*.20,py2+scale*.12,Math.max(1.5,scale*.15),0,Math.PI*2);c.fill();
                c.beginPath();c.arc(px2+scale*.20,py2+scale*.10,Math.max(1.5,scale*.15),0,Math.PI*2);c.fill();
            }else if(!inf.pass){
                c.strokeStyle='#4a382a';c.lineWidth=Math.max(1,scale*.10);
                c.beginPath();
                c.moveTo(px2-scale*.28,py2+scale*.18);
                c.lineTo(px2,py2-scale*.18);
                c.lineTo(px2+scale*.28,py2+scale*.18);
                c.stroke();
            }else if(hash(x,y)>.86 && scale>4){
                c.fillStyle='#9b8059';
                c.beginPath();c.arc(px2,py2,Math.max(1,scale*.08),0,Math.PI*2);c.fill();
            }
        }
    }
    c.restore();

    // Контурные линии по крупным блокам непроходимой местности.
    c.save();
    c.globalAlpha=.18;
    c.strokeStyle='#5f4831';c.lineWidth=1;
    var block=Math.max(3,Math.floor(5/Math.max(.5,scale)));
    for(y=block;y<mh;y+=block){
        for(x=block;x<mw;x+=block){
            if(!passable(x,y) && passable(x-1,y)){
                var xx=ox+x*scale;
                c.beginPath();c.moveTo(xx,oy+y*scale);c.lineTo(xx,oy+(y+1)*scale);c.stroke();
            }
        }
    }
    c.restore();

    // Маршрут — только от текущего игрока к явно указанной цели.
    var target=M.currentTarget(),resolved=M.resolve(target&&target.data),path=[];
    if(resolved && resolved.mapId===$gameMap.mapId()){
        path=route($gamePlayer.x,$gamePlayer.y,resolved.x,resolved.y);

        if(path.length){
            for(var i=1;i<path.length;i++){
                var a=path[i-1],d=path[i];
                var ax=ox+a.x*scale+scale/2, ay=oy+a.y*scale+scale/2;
                var dx=ox+d.x*scale+scale/2, dy=oy+d.y*scale+scale/2;
                line(b,ax,ay,dx,dy,Math.max(3,scale*.30),'#9a6b2f',.72);
            }
            // светлый внутренний штрих
            for(i=1;i<path.length;i++){
                a=path[i-1];d=path[i];
                ax=ox+a.x*scale+scale/2; ay=oy+a.y*scale+scale/2;
                dx=ox+d.x*scale+scale/2; dy=oy+d.y*scale+scale/2;
                line(b,ax,ay,dx,dy,Math.max(1,scale*.10),'#f2d28d',.9);
            }
        }

        var tx=ox+resolved.x*scale+scale/2, ty=oy+resolved.y*scale+scale/2;
        b.drawCircle(tx,ty,Math.max(7,Math.min(14,scale*.75)),'#7d3f23');
        b.drawCircle(tx,ty,Math.max(3,Math.min(7,scale*.38)),'#f5ddb0');
        b.font='bold 13px Georgia';b.textColor='#6e361f';
        b.drawText('ЦЕЛЬ',tx+12,ty-10,90,22,'left');
    }

    var pX=ox+$gamePlayer.x*scale+scale/2,pY=oy+$gamePlayer.y*scale+scale/2;
    b.drawCircle(pX,pY,Math.max(7,Math.min(13,scale*.70)),'#4c7b9a');
    b.drawCircle(pX,pY,Math.max(3,Math.min(6,scale*.32)),'#f4e0b8');
    b.font='bold 13px Georgia';b.textColor='#3b6179';
    b.drawText('ВЫ',pX+11,pY-10,60,22,'left');

    if(target && !resolved){
        b.font='13px Georgia';b.textColor='#6f5131';
        b.drawText('Цель находится в другой локации',areaX+10,areaY+areaH-27,areaW-20,20,'center');
    }else if(resolved && !path.length){
        b.font='12px Georgia';b.textColor='#6f5131';
        b.drawText('Маршрут не найден',areaX+10,areaY+areaH-27,areaW-20,20,'center');
    }
};

Scene_BFMap.prototype.update=function(){
    Scene_Base.prototype.update.call(this);

    if(Input.isTriggered('cancel') || TouchInput.isCancelled()){
        SceneManager.pop();
        return;
    }

    if(TouchInput.isTriggered()){
        var x=TouchInput.x,y=TouchInput.y;
        var px=this._panel.x,py=this._panel.y;
        var closeX=px+this._panel.bitmap.width-92;
        var closeY=py+56;
        if(Math.sqrt(Math.pow(x-closeX,2)+Math.pow(y-closeY,2))<=40){
            SoundManager.playCancel();
            SceneManager.pop();
        }
    }
};

window.Scene_BFMap=Scene_BFMap;

})();
