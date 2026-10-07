/*:
 * @plugindesc Bitz Fantasy — Финальная мини-игра Кабанчика: дверь кабинета + побег v1.0
 * @author ACTPOJIuT
 *
 * Plugin Command:
 *   BF_KabanchikFinale start
 *
 * Механика:
 * 1) Кабанчик запирается в кабинете.
 * 2) Нужно открыть три фиксатора двери в правильном порядке.
 * 3) После открытия двери нужно остановить Кабанчика до аварийного рычага.
 * 4) Успех мини-игры НЕ завершает vermillion. После неё игрок должен поговорить с Кабанчиком.
 */

(function() {
    'use strict';

    var PLUGIN_NAME = 'BF_KabanchikFinale';

    function questGame() {
        return window.BF_QuestSystem && window.BF_QuestSystem.game
            ? window.BF_QuestSystem.game()
            : null;
    }

    function finishQuest(scene) {
        var q = questGame();
        // ВАЖНО: Кабинет Кабанчика находится на последнем шаге vermillion.
        // SUCCESS через minigameResult() вызвал бы nextStep(), а тот завершил бы
        // весь квест. Здесь мини-игра только заканчивается; vermillion должен
        // завершиться после отдельного разговора с Кабанчиком.
        if (q && typeof q.minigameResult === 'function') {
            q.minigameResult('CANCEL');
        }

        // Выключаем событие-дверь, которое запустило мини-игру.
        if (scene && scene._sourceMapId && scene._sourceEventId) {
            $gameSelfSwitches.setValue(
                [scene._sourceMapId, scene._sourceEventId, 'A'],
                true
            );
        }
    }

    function Scene_BFKabanchikFinale() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFKabanchikFinale.prototype = Object.create(Scene_Base.prototype);
    Scene_BFKabanchikFinale.prototype.constructor = Scene_BFKabanchikFinale;

    Scene_BFKabanchikFinale.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._phase = 0;
        this._locks = [false, false, false];
        this._order = [];
        this._escapeObjects = [false, false, false];
        this._message = '';
        this._messageTimer = 0;
        this._wrongTimer = 0;
        this._success = false;
        this._lastInput = false;
        this._sourceMapId = Scene_BFKabanchikFinale._sourceMapId || 0;
        this._sourceEventId = Scene_BFKabanchikFinale._sourceEventId || 0;
        Scene_BFKabanchikFinale._sourceMapId = 0;
        Scene_BFKabanchikFinale._sourceEventId = 0;
    };

    Scene_BFKabanchikFinale.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._layout();
        this._createBackground();
        this._createHud();
        this._redraw();
    };

    Scene_BFKabanchikFinale.prototype._layout = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        this._doorRect = {x:w*0.20, y:h*0.24, w:w*0.60, h:h*0.48};
        var dw = this._doorRect.w;
        this._lockRects = [
            {x:this._doorRect.x+dw*0.16, y:this._doorRect.y+this._doorRect.h*0.42, w:90, h:90},
            {x:this._doorRect.x+dw*0.50-45, y:this._doorRect.y+this._doorRect.h*0.42, w:90, h:90},
            {x:this._doorRect.x+dw*0.84-90, y:this._doorRect.y+this._doorRect.h*0.42, w:90, h:90}
        ];
        this._escapeRects = [
            {x:w*0.20, y:h*0.57, w:w*0.17, h:75},
            {x:w*0.415, y:h*0.57, w:w*0.17, h:75},
            {x:w*0.63, y:h*0.57, w:w*0.17, h:75}
        ];
        this._exitRect = {x:w-155, y:h-65, w:125, h:42};
    };

    Scene_BFKabanchikFinale.prototype._createBackground = function() {
        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.addChild(this._bg);
    };

    Scene_BFKabanchikFinale.prototype._createHud = function() {
        this._hud = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.addChild(this._hud);
    };

    Scene_BFKabanchikFinale.prototype._text = function(text, x, y, w, h, size, align) {
        this._hud.bitmap.fontSize = size || 24;
        this._hud.bitmap.drawText(text, x, y, w, h, align || 'center');
    };

    Scene_BFKabanchikFinale.prototype._redraw = function() {
        var b = this._bg.bitmap;
        var h = Graphics.boxHeight;
        var w = Graphics.boxWidth;
        b.clear();
        this._hud.bitmap.clear();

        b.fillRect(0,0,w,h, '#10141b');
        b.fillRect(0,h*0.72,w,h*0.28, '#1b2028');

        if (this._phase === 0) {
            this._text('КАБИНЕТ КАБАНЧИКА', 0, 20, w, 42, 34);
            this._text('«Думаете, я открою вам дверь? Забудьте!»', 0, 68, w, 36, 22);
            b.fillRect(this._doorRect.x,this._doorRect.y,this._doorRect.w,this._doorRect.h,'#303744');
            b.fillRect(this._doorRect.x+15,this._doorRect.y+15,this._doorRect.w-30,this._doorRect.h-30,'#171b22');
            this._text('ЗАПЕРТО', this._doorRect.x, this._doorRect.y+40, this._doorRect.w, 35, 26);
            for (var i=0;i<3;i++) {
                var r=this._lockRects[i];
                b.fillRect(r.x,r.y,r.w,r.h,this._locks[i] ? '#3b7f55' : '#9a5a3a');
                this._text(this._locks[i] ? '✓' : String(i+1), r.x,r.y+20,r.w,45,34);
            }
            this._text('Откройте фиксаторы в правильном порядке.',0,h*0.78,w,34,22);
            this._text('Кабанчик: «Эй! Вы там что делаете?!»',0,h*0.84,w,34,20);
        } else if (this._phase === 1) {
            this._text('ДВЕРЬ ОТКРЫТА',0,25,w,42,34);
            this._text('Кабанчик пытается добраться до аварийного рычага!',0,70,w,34,22);
            b.fillRect(w*0.28,h*0.23,w*0.44,h*0.22,'#303744');
            this._text('КАБИНЕТ',w*0.28,h*0.27,w*0.44,35,26);
            for (var j=0;j<3;j++) {
                var e=this._escapeRects[j];
                b.fillRect(e.x,e.y,e.w,e.h,this._escapeObjects[j] ? '#3b7f55' : '#765a3a');
                this._text(['СТОЛ','ШКАФ','РЫЧАГ'][j],e.x,e.y+20,e.w,35,22);
            }
            this._text('Перекройте путь к рычагу.',0,h*0.78,w,34,22);
            this._text('Кабанчик: «Не трогайте рычаг!»',0,h*0.84,w,34,20);
        } else {
            this._text('КАБАНЧИК ПОЙМАН',0,h*0.30,w,55,42);
            this._text('«Ладно! Ладно! Вы меня поймали!»',0,h*0.42,w,40,26);
            this._text('Нажмите ВЫХОД',0,h*0.62,w,35,22);
        }

        b.fillRect(this._exitRect.x,this._exitRect.y,this._exitRect.w,this._exitRect.h,'#303744');
        this._text('ВЫХОД',this._exitRect.x,this._exitRect.y+8,this._exitRect.w,28,18);

        if (this._messageTimer > 0) {
            this._text(this._message,0,h-105,w,35,22);
        }
    };

    Scene_BFKabanchikFinale.prototype._hit = function(r,x,y) {
        return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h;
    };

    Scene_BFKabanchikFinale.prototype._pointer = function() {
        if (TouchInput.isTriggered()) return {x:TouchInput.x,y:TouchInput.y};
        if (TouchInput.isCancelled()) return {cancel:true};
        return null;
    };

    Scene_BFKabanchikFinale.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (this._messageTimer > 0) {
            this._messageTimer--;
            if (this._messageTimer === 0) this._redraw();
        }

        if (Input.isTriggered('escape')) {
            SceneManager.pop();
            return;
        }

        var p = this._pointer();
        if (!p) return;
        if (p.cancel) {
            SceneManager.pop();
            return;
        }

        if (this._hit(this._exitRect,p.x,p.y)) {
            SceneManager.pop();
            return;
        }

        if (this._success) return;

        if (this._phase === 0) this._clickLock(p.x,p.y);
        else if (this._phase === 1) this._clickEscape(p.x,p.y);
    };

    Scene_BFKabanchikFinale.prototype._clickLock = function(x,y) {
        for (var i=0;i<3;i++) {
            if (this._locks[i] || !this._hit(this._lockRects[i],x,y)) continue;

            var expected = this._order.length;
            if (i !== expected) {
                this._message = 'Щёлк... Нет. Этот фиксатор заблокирован.';
                this._messageTimer = 90;
                this._redraw();
                return;
            }

            this._locks[i] = true;
            this._order.push(i);

            if (this._order.length === 3) {
                this._phase = 1;
                this._message = 'Дверь открылась! Остановите Кабанчика!';
                this._messageTimer = 120;
            } else {
                this._message = 'Фиксатор открыт. Кабанчик нервничает...';
                this._messageTimer = 75;
            }
            this._redraw();
            return;
        }
    };

    Scene_BFKabanchikFinale.prototype._clickEscape = function(x,y) {
        for (var i=0;i<3;i++) {
            if (!this._hit(this._escapeRects[i],x,y)) continue;

            if (i === 2 && this._escapeObjects[0] && this._escapeObjects[1]) {
                this._escapeObjects[2] = true;
                this._success = true;
                this._phase = 2;
                finishQuest(this);
                this._message = 'Кабанчик не успел добраться до рычага.';
                this._messageTimer = 120;
                this._redraw();
                return;
            }

            if (i === 0) {
                this._escapeObjects[0] = true;
                this._message = 'Стол сдвинут. Путь перекрыт!';
            } else if (i === 1 && this._escapeObjects[0]) {
                this._escapeObjects[1] = true;
                this._message = 'Шкаф перекрыл второй путь!';
            } else {
                this._message = 'Сейчас это не поможет.';
            }
            this._messageTimer = 90;
            this._redraw();
            return;
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command,args) {
        _pluginCommand.call(this,command,args);
        if (String(command).toUpperCase() === 'BF_KABANCHIKFINALE' &&
            String(args[0] || '').toLowerCase() === 'start') {
            var q = questGame();
            if (q && typeof q.minigameStart === 'function') {
                q.minigameStart('BF_KabanchikFinale','vermillion');
            }

            Scene_BFKabanchikFinale._sourceMapId = $gameMap.mapId();
            Scene_BFKabanchikFinale._sourceEventId = this._eventId;
            SceneManager.push(Scene_BFKabanchikFinale);
        }
    };

    window.Scene_BFKabanchikFinale = Scene_BFKabanchikFinale;
})();
