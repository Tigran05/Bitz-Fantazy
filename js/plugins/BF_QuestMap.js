/*:
 * @plugindesc Bitz Fantasy — BF_QuestMap clean bartender map
 * @author ASTROLIT GAMES
 *
 * @help Shows only terrain, player, explicit quest target and route.
 * No event scanning / no hidden event rendering.
 */
(function(){
'use strict';
var M=window.BF_QuestMap=window.BF_QuestMap||{};M.version='bartender-clean-1.0';
function cfg(id){return window.BF_QuestConfig&&BF_QuestConfig.QUESTS?BF_QuestConfig.QUESTS[id]:null;}
function selected(){
    if(!window.BF_QuestSystem||!BF_QuestSystem.game)return null;
    var g=BF_QuestSystem.game(),id=g.selectedQuest&&g.selectedQuest();if(!id)return null;
    var q=g.get(id);if(!q||q.status!=='active')return null;var c=cfg(id);if(!c)return null;
    var t=(c.mapTargets||{})[String(q.step)];return t?{id:id,step:q.step,data:t}:null;
}
M.currentTarget=selected;
function pass(x,y,d){return $gameMap.isPassable(x,y,d);}
function route(sx,sy,tx,ty){
    var dirs=[[0,-1,8],[1,0,6],[0,1,2],[-1,0,4]],q=[{x:sx,y:sy}],head=0,seen={},prev={},key=function(x,y){return x+','+y;};
    seen[key(sx,sy)]=true;
    while(head<q.length){var n=q[head++];if(n.x===tx&&n.y===ty)break;for(var i=0;i<4;i++){var dx=dirs[i][0],dy=dirs[i][1],d=dirs[i][2],nx=n.x+dx,ny=n.y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=$gameMap.width()||ny>=$gameMap.height()||seen[k])continue;if(!pass(n.x,n.y,d))continue;seen[k]=true;prev[k]={x:n.x,y:n.y};q.push({x:nx,y:ny});}}
    var end=key(tx,ty);if(!seen[end])return [];var out=[],cur={x:tx,y:ty};while(!(cur.x===sx&&cur.y===sy)){out.push(cur);cur=prev[key(cur.x,cur.y)];if(!cur)return [];}out.push({x:sx,y:sy});out.reverse();return out;
}
function line(b,x1,y1,x2,y2,w,col,a){var c=b.context;c.save();c.globalAlpha=a==null?1:a;c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
function round(b,x,y,w,h,r,fill,stroke,sw){var c=b.context;c.save();c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}c.restore();}
function Scene_BFMap(){this.initialize.apply(this,arguments);}Scene_BFMap.prototype=Object.create(Scene_Base.prototype);Scene_BFMap.prototype.constructor=Scene_BFMap;
Scene_BFMap.prototype.create=function(){
    Scene_Base.prototype.create.call(this);this._dim=new Sprite(new Bitmap(Graphics.boxWidth,Graphics.boxHeight));this._dim.bitmap.fillAll('rgba(16,12,8,.72)');this.addChild(this._dim);
    var w=Math.min(Graphics.boxWidth-70,1160),h=Math.min(Graphics.boxHeight-45,670);this._panel=new Sprite(new Bitmap(w,h));this._panel.x=(Graphics.boxWidth-w)/2;this._panel.y=(Graphics.boxHeight-h)/2;this.addChild(this._panel);this.refresh();
};
Scene_BFMap.prototype.refresh=function(){
    var b=this._panel.bitmap,w=b.width,h=b.height;b.clear();b.fillAll('#1f1710');round(b,6,6,w-12,h-12,18,'#ead8aa','#8a5b31',4);round(b,17,17,w-34,h-34,14,'#f0dfb3','#b0804e',2);
    b.font='bold 31px Georgia';b.textColor='#4e2e1b';b.drawText('КАРТА',40,32,250,40,'left');
    var info=$dataMapInfos&&$dataMapInfos[$gameMap.mapId()]?$dataMapInfos[$gameMap.mapId()].name:'';if(info){b.font='italic 17px Georgia';b.textColor='#795436';b.drawText('— '+info+' —',190,39,430,25,'left');}
    var mx=40,my=105,mw=w-330,mh=h-150;round(b,mx,my,mw,mh,8,'#ead7a8','#91643b',3);this.drawTerrain(b,mx+8,my+8,mw-16,mh-16);
    var sideX=mx+mw+20,sideW=w-sideX-24;round(b,sideX,my,sideW,mh,10,'rgba(112,79,45,.10)','#9b7047',2);
    b.font='bold 16px Georgia';b.textColor='#5a361e';b.drawText('ТЕКУЩАЯ ЦЕЛЬ',sideX+10,my+18,sideW-20,24,'center');
    var t=selected(),title='Нет цели',step='Откройте книгу.';if(t){var c=cfg(t.id),g=BF_QuestSystem.game(),q=g.get(t.id);title=c.title;step=(c.steps||[])[q.step]||'';}
    b.font='bold 18px Georgia';b.textColor='#4c2c19';b.drawText(title,sideX+10,my+62,sideW-20,60,'center');line(b,sideX+15,my+130,sideX+sideW-15,my+130,1,'#9b7047',.75);b.font='bold 14px Georgia';b.textColor='#765033';b.drawText('ШАГ',sideX+10,my+145,sideW-20,22,'center');b.font='16px Georgia';b.textColor='#4d3423';b.drawText(step,sideX+12,my+180,sideW-24,120,'center');
    b.font='bold 14px Georgia';b.textColor='#5d3b1e';b.drawText('● ВЫ',sideX+25,my+330,sideW-50,22,'left');b.drawText('● ЦЕЛЬ',sideX+25,my+360,sideW-50,22,'left');b.drawText('━ МАРШРУТ',sideX+25,my+390,sideW-50,22,'left');
    b.font='bold 22px Georgia';b.textColor='#5b321e';b.drawText('×',w-70,28,45,40,'center');this._close={x:w-70,y:48};
};
Scene_BFMap.prototype.drawTerrain=function(b,x,y,w,h){
    var mw=$gameMap.width(),mh=$gameMap.height(),scale=Math.min(w/mw,h/mh),mapW=mw*scale,mapH=mh*scale,ox=x+(w-mapW)/2,oy=y+(h-mapH)/2;
    b.fillRect(x,y,w,h,'#e8d6aa');
    for(var yy=0;yy<mh;yy++)for(var xx=0;xx<mw;xx++){
        var px=ox+xx*scale,py=oy+yy*scale,solid=!(passableAny(xx,yy));
        if(solid){b.paintOpacity=175;b.fillRect(px,py,Math.ceil(scale)+1,Math.ceil(scale)+1,'#756149');b.paintOpacity=255;}
    }
    var t=selected(),resolved=null;if(t&&t.data){var d=t.data;if(Number(d.mapId)===$gameMap.mapId()){if(d.eventId){var e=$gameMap.event(Number(d.eventId));if(e)resolved={x:e.x,y:e.y};}else if(d.x!=null&&d.y!=null)resolved={x:Number(d.x),y:Number(d.y)};}}
    if(resolved){var path=route($gamePlayer.x,$gamePlayer.y,resolved.x,resolved.y);for(var i=1;i<path.length;i++){var a=path[i-1],c=path[i];line(b,ox+a.x*scale+scale/2,oy+a.y*scale+scale/2,ox+c.x*scale+scale/2,oy+c.y*scale+scale/2,Math.max(2,scale*.28),'#9a6b2f',.75);}b.drawCircle(ox+resolved.x*scale+scale/2,oy+resolved.y*scale+scale/2,Math.max(7,scale*.7),'#7d3f23');b.font='bold 13px Georgia';b.textColor='#6e361f';b.drawText('ЦЕЛЬ',ox+resolved.x*scale+scale/2+12,oy+resolved.y*scale+scale/2-10,80,20,'left');}
    if(t&&(!t.data||Number(t.data.mapId)!==$gameMap.mapId())){b.font='13px Georgia';b.textColor='#6f5131';b.drawText('Цель находится в другой локации',x+10,y+h-24,w-20,20,'center');}
    var pxp=ox+$gamePlayer.x*scale+scale/2,pyp=oy+$gamePlayer.y*scale+scale/2;b.drawCircle(pxp,pyp,Math.max(7,scale*.65),'#4c7b9a');b.font='bold 13px Georgia';b.textColor='#3b6179';b.drawText('ВЫ',pxp+11,pyp-10,50,20,'left');
};
function passableAny(x,y){if(x<0||y<0||x>=$gameMap.width()||y>=$gameMap.height())return false;return pass(x,y,8)||pass(x,y,6)||pass(x,y,2)||pass(x,y,4);}
Scene_BFMap.prototype.update=function(){Scene_Base.prototype.update.call(this);if(Input.isTriggered('cancel')||TouchInput.isCancelled()){SceneManager.pop();return;}if(TouchInput.isTriggered()){var x=TouchInput.x,y=TouchInput.y;if(this._close){var cx=this._panel.x+this._close.x,cy=this._panel.y+this._close.y;if(Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy))<50)SceneManager.pop();}}};
window.Scene_BFMap=Scene_BFMap;
})();
