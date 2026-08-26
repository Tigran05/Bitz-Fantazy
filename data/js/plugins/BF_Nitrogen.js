/*:
 * @plugindesc BitzFantasy — Мини-игра жидкого азота. RPG Maker MV.
 * @help
 * Файлы:
 *   img/pictures/NitrogenMini/nitrogen_background.png
 *   img/system/NitrogenMini/nitro_tank.png
 *   img/system/NitrogenMini/valve.png
 *   img/system/NitrogenMini/gauge.png
 *   img/system/NitrogenMini/canister.png
 *   img/system/NitrogenMini/steam.png
 *   img/system/NitrogenMini/success.png
 *   img/system/NitrogenMini/fail.png
 *
 * Запуск:
 *   Plugin Command: Nitrogen start
 *
 * По умолчанию используется переменная 12 (азот).
 * После успеха: переменная 12 увеличивается на 1.
 * Также включается Self Switch A события, из которого запущена мини-игра.
 *
 * Enter не нужен. Управление мышью/сенсором.
 */

(function() {
    "use strict";

    var Nitrogen = { mapId: 0, eventId: 0 };

    var _pc = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pc.call(this, command, args);
        if (String(command).toLowerCase() !== "nitrogen") return;
        var sub = args && args.length ? String(args[0]).toLowerCase() : "";
        if (sub === "start") {
            Nitrogen.mapId = $gameMap.mapId();
            Nitrogen.eventId = this._eventId;
            SceneManager.push(Scene_NitrogenMini);
        }
    };


    function drawOutline(bitmap, x, y, w, h, color, thickness) {
        thickness = thickness || 2;
        bitmap.fillRect(x, y, w, thickness, color);
        bitmap.fillRect(x, y + h - thickness, w, thickness, color);
        bitmap.fillRect(x, y, thickness, h, color);
        bitmap.fillRect(x + w - thickness, y, thickness, h, color);
    }

    function Scene_NitrogenMini() { this.initialize.apply(this, arguments); }
    Scene_NitrogenMini.prototype = Object.create(Scene_Base.prototype);
    Scene_NitrogenMini.prototype.constructor = Scene_NitrogenMini;

    Scene_NitrogenMini.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._step = 0;
        this._sequence = [];
        this._progress = 0;
        this._mistake = 0;
        this._timer = 0;
        this._messageTimer = 0;
        this._flash = 0;
        this._locked = false;
    };

    Scene_NitrogenMini.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this.createBackground();
        this.createTitle();
        this.createTank();
        this.createControls();
        this.createStatus();
        this.startSequence();
    };

    Scene_NitrogenMini.prototype.createBackground = function() {
        var bmp = ImageManager.loadPicture("NitrogenMini/nitrogen_background");
        this._bg = new Sprite(bmp);
        this._bg.scale.x = Graphics.boxWidth / 816;
        this._bg.scale.y = Graphics.boxHeight / 624;
        this.addChild(this._bg);
    };

    Scene_NitrogenMini.prototype.createTitle = function() {
        var b = new Bitmap(Graphics.boxWidth, 70);
        b.fillRect(0,0,Graphics.boxWidth,70,"rgba(0,0,0,0.72)");
        b.fontSize = 30;
        b.textColor = "#d9f4ff";
        b.drawText("ДОБЫЧА ЖИДКОГО АЗОТА",0,8,Graphics.boxWidth,36,"center");
        b.fontSize = 17;
        b.textColor = "#ffffff";
        b.drawText("Выполни действия в правильной последовательности",0,43,Graphics.boxWidth,25,"center");
        this.addChild(new Sprite(b));
    };

    Scene_NitrogenMini.prototype.createTank = function() {
        var s = new Sprite(ImageManager.loadSystem("NitrogenMini/nitro_tank"));
        s.x = 250; s.y = 205; s.scale.x = 1.15; s.scale.y = 1.15;
        this._tank = s;
        this.addChild(s);

        var steam = new Sprite(ImageManager.loadSystem("NitrogenMini/steam"));
        steam.x = 280; steam.y = 120; steam.opacity = 150;
        this._steam = steam;
        this.addChild(steam);
    };

    Scene_NitrogenMini.prototype.createControls = function() {
        this._buttons = [];
        var names = ["ВЕНТИЛЬ","ДАВЛЕНИЕ","ЗАБОР АЗОТА"];
        var files = ["valve","gauge","canister"];
        var xs = [90, 330, 570];

        for (var i=0;i<3;i++) {
            var spr = new Sprite(ImageManager.loadSystem("NitrogenMini/" + files[i]));
            spr.anchor.x = 0.5; spr.anchor.y = 0.5;
            spr.x = xs[i]; spr.y = 385;
            spr.scale.x = 0.72; spr.scale.y = 0.72;
            spr._nitrogenIndex = i;
            this.addChild(spr);

            var panel = new Sprite(new Bitmap(200,58));
            panel.x = xs[i]-100; panel.y = 445;
            panel._nitrogenIndex = i;
            panel.bitmap.fillRect(3,3,194,52,"rgba(4,18,35,0.92)");
            drawOutline(panel.bitmap, 3, 3, 194, 52, "#59bfff", 2);
            panel.bitmap.fontSize = 20;
            panel.bitmap.textColor = "#ffffff";
            panel.bitmap.drawText(names[i],0,14,200,28,"center");
            this.addChild(panel);

            this._buttons.push(spr);
            this._buttons.push(panel);
        }
    };

    Scene_NitrogenMini.prototype.createStatus = function() {
        this._status = new Sprite(new Bitmap(Graphics.boxWidth, 110));
        this._status.y = 505;
        this.addChild(this._status);
        this._hint = new Sprite(new Bitmap(Graphics.boxWidth, 50));
        this._hint.y = 120;
        this.addChild(this._hint);
        this.updateStatus("Подготовьте контейнер.");
    };

    Scene_NitrogenMini.prototype.startSequence = function() {
        var a = [0,1,2];
        for (var i=a.length-1;i>0;i--) {
            var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t;
        }
        this._sequence = a;
        this._progress = 0;
        this._mistake = 0;
        this.updateStatus(this.actionText());
    };

    Scene_NitrogenMini.prototype.actionText = function() {
        var idx = this._sequence[this._progress];
        if (idx === 0) return "Шаг 1: откройте вентиль.";
        if (idx === 1) return "Шаг 2: стабилизируйте давление.";
        return "Шаг 3: заберите азот.";
    };

    Scene_NitrogenMini.prototype.updateStatus = function(text) {
        this._status.bitmap.clear();
        this._status.bitmap.fillRect(70,0,Graphics.boxWidth-140,96,"rgba(3,13,25,0.88)");
        drawOutline(this._status.bitmap, 70, 0, Graphics.boxWidth-140, 96, "#4db9ff", 2);
        this._status.bitmap.fontSize = 25;
        this._status.bitmap.textColor = "#e8f7ff";
        this._status.bitmap.drawText(text,80,12,Graphics.boxWidth-160,36,"center");
        this._status.bitmap.fontSize = 19;
        this._status.bitmap.textColor = "#f4d36b";
        this._status.bitmap.drawText("Прогресс: "+this._progress+" / 3",80,50,Graphics.boxWidth-160,28,"center");
    };

    Scene_NitrogenMini.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (this._locked) return;

        this._timer++;
        if (this._flash>0) this._flash--;

        this.updateSteam();
        this.updateTouch();

        if (this._messageTimer>0) {
            this._messageTimer--;
            if (this._messageTimer===0) this._hint.bitmap.clear();
        }

        if (this._timer>2700) this.failRound();
    };

    Scene_NitrogenMini.prototype.updateSteam = function() {
        if (!this._steam) return;
        this._steam.opacity = 125 + Math.sin(Graphics.frameCount/10)*35;
        this._steam.x = 280 + Math.sin(Graphics.frameCount/20)*5;
    };

    Scene_NitrogenMini.prototype.updateTouch = function() {
        if (!TouchInput.isTriggered()) return;

        var x=TouchInput.x, y=TouchInput.y;
        var idx=this.hitButton(x,y);

        if (idx<0) return;

        var need=this._sequence[this._progress];
        if (idx===need) {
            this._progress++;
            this.pulseButton(idx);
            if (this._progress>=3) {
                this.successRound();
            } else {
                this.updateStatus(this.actionText());
                this.showHint("Верно!");
            }
        } else {
            this._mistake++;
            this._flash=18;
            this.showHint("Ошибка! Действие не по порядку.");
            this.shakeTank();
        }
    };

    Scene_NitrogenMini.prototype.hitButton = function(x,y) {
        for (var i=0;i<3;i++) {
            var b=this._buttons[i*2];
            if (!b) continue;
            var dx=x-b.x, dy=y-b.y;
            if (dx*dx+dy*dy <= 80*80) return i;
        }
        for (var k=0;k<3;k++) {
            var p=this._buttons[k*2+1];
            if (!p) continue;
            if (x>=p.x && x<=p.x+200 && y>=p.y && y<=p.y+58) return k;
        }
        return -1;
    };

    Scene_NitrogenMini.prototype.pulseButton = function(idx) {
        var b=this._buttons[idx*2];
        if (!b) return;
        b.scale.x=0.86; b.scale.y=0.86;
        setTimeout(function(){ if (b) { b.scale.x=0.72; b.scale.y=0.72; } },120);
    };

    Scene_NitrogenMini.prototype.shakeTank = function() {
        var baseX=250, tank=this._tank, n=0;
        var id=setInterval(function(){
            if (!tank) { clearInterval(id); return; }
            tank.x=baseX+(n%2===0?8:-8); n++;
            if(n>7){tank.x=baseX;clearInterval(id);}
        },30);
    };

    Scene_NitrogenMini.prototype.showHint = function(text) {
        this._messageTimer=45;
        this._hint.bitmap.clear();
        this._hint.bitmap.fontSize=23;
        this._hint.bitmap.textColor="#ffffff";
        this._hint.bitmap.drawText(text,0,0,Graphics.boxWidth,42,"center");
    };

    Scene_NitrogenMini.prototype.successRound = function() {
        this._locked=true;
        var v=Number($gameVariables.value(12)||0)+1;
        $gameVariables.setValue(12,v);

        if (Nitrogen.mapId===$gameMap.mapId() && Nitrogen.eventId>0) {
            $gameSelfSwitches.setValue([$gameMap.mapId(),Nitrogen.eventId,"A"],true);
        }

        this._status.bitmap.clear();
        this._status.bitmap.fillRect(70,0,Graphics.boxWidth-140,96,"rgba(10,50,20,0.94)");
        drawOutline(this._status.bitmap, 70, 0, Graphics.boxWidth-140, 96, "#70e27c", 2);
        this._status.bitmap.fontSize=30;
        this._status.bitmap.textColor="#9cff9c";
        this._status.bitmap.drawText("АЗОТ УСПЕШНО ИЗВЛЕЧЁН!",80,12,Graphics.boxWidth-160,40,"center");
        this._status.bitmap.fontSize=19;
        this._status.bitmap.textColor="#ffffff";
        this._status.bitmap.drawText("Контейнер готов к транспортировке.",80,52,Graphics.boxWidth-160,28,"center");

        setTimeout(function(){ SceneManager.pop(); },1000);
    };

    Scene_NitrogenMini.prototype.failRound = function() {
        this._timer=0;
        this._mistake=0;
        this.showHint("Давление нестабильно! Попробуйте ещё раз.");
        this.startSequence();
    };

    window.Scene_NitrogenMini=Scene_NitrogenMini;
})();
