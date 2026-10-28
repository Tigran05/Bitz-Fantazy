/*:
 * @plugindesc Bitz Fantasy — Пульт 2: синхронизация приводов (ASTROLIT Control System)
 * @author ASTROLIT GAMES
 *
 * @help
 * Команда: BF_PanelPuzzle2 start
 * Совместимость: RPG Maker MV, без внешних библиотек.
 */
(function() {
    'use strict';

    function Scene_BFPanelPuzzle2() { this.initialize.apply(this, arguments); }
    Scene_BFPanelPuzzle2.prototype = Object.create(Scene_Base.prototype);
    Scene_BFPanelPuzzle2.prototype.constructor = Scene_BFPanelPuzzle2;

    Scene_BFPanelPuzzle2.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._values = [0, 0, 0, 0];
        // Эталон — достижимая комбинация. Игрок не видит числовые значения цели.
        this._target = [2, 1, 2, 1];
        this._solved = false;
        this._moves = 0;
        this._sourceMapId = 0;
        this._sourceEventId = 0;
        this._message = 'СИНХРОНИЗИРУЙТЕ ЧЕТЫРЕ ПРИВОДА ПО ЭТАЛОННЫМ МЕТКАМ';
        this._messageColor = '#c7d4d9';
    };

    Scene_BFPanelPuzzle2.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sourceMapId = $gameMap ? $gameMap.mapId() : 0;
        this._sourceEventId = $gameMap && $gameMap._interpreter ?
            Number($gameMap._interpreter._eventId || 0) : 0;
        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameStart('BF_PanelPuzzle2', 'iron_cliff');
        }
        this._layout();
        this._draw();
    };

    Scene_BFPanelPuzzle2.prototype._layout = function() {
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        this._bg = new Sprite(new Bitmap(w, h));
        this.addChild(this._bg);
        this._panel = new Sprite(new Bitmap(w, h));
        this.addChild(this._panel);
        this._layoutBitmap = new Bitmap(w, h);
        this._layoutSprite = new Sprite(this._layoutBitmap);
        this.addChild(this._layoutSprite);
        this._drawFrame();
    };

    Scene_BFPanelPuzzle2.prototype._drawFrame = function() {
        var b = this._bg.bitmap, p = this._panel.bitmap, w = Graphics.boxWidth, h = Graphics.boxHeight;
        b.fillAll('#06111a');
        // Тёмная сталь, внутренние контуры и латунные рёбра.
        b.fillRect(0, 0, w, h, '#06111a');
        b.fillRect(12, 12, w - 24, h - 24, '#102936');
        b.fillRect(17, 17, w - 34, h - 34, '#071722');
        b.fillRect(22, 22, w - 44, 56, '#153544');
        b.fillRect(22, 79, w - 44, 3, '#b77b3b');
        b.fillRect(22, 82, w - 44, 1, '#e0a64f');
        b.fillRect(22, h - 75, w - 44, 1, '#b77b3b');
        b.fillRect(22, h - 74, w - 44, 35, '#102b38');
        // Декоративные заклёпки
        for (var i = 0; i < 8; i++) {
            b.fillRect(30 + i * ((w - 75) / 7), 28, 4, 4, '#d39a4d');
            b.fillRect(30 + i * ((w - 75) / 7), h - 34, 4, 4, '#d39a4d');
        }
        p.clear();
        p.fontFace = 'GameFont';
        p.fontSize = 28; p.textColor = '#f5e7c8'; p.outlineColor = '#07131d'; p.outlineWidth = 3;
        p.drawText('ПУЛЬТ 2  /  СИНХРОНИЗАЦИЯ ПРИВОДОВ', 34, 25, w - 210, 38, 'left');
        p.fontSize = 14; p.textColor = '#dca04f'; p.outlineWidth = 2;
        p.drawText('ASTROLIT  •  CONTROL SYSTEM', 36, 53, w - 220, 22, 'left');
        p.fontSize = 16; p.textColor = '#d6e0e2';
        p.drawText('СОГЛАСУЙТЕ ПЕРЕДАЧУ: ПОВОРОТ ОДНОГО ПРИВОДА ВЛИЯЕТ НА СОСЕДНИЕ', 35, 91, w - 70, 30, 'center');
        p.fontSize = 15; p.textColor = '#9eb4bd';
        p.drawText('ХОДЫ: ' + this._moves + '     •     НАЖМИТЕ НА МЕХАНИЗМ, ЧТОБЫ ПОВЕРНУТЬ ЕГО', 35, h - 66, w - 70, 24, 'center');
        p.fontSize = 13; p.textColor = '#8ca4ae';
        p.drawText('ESC — ВЫХОД     •     R — СБРОС НАЧАЛЬНОГО ПОЛОЖЕНИЯ', 35, h - 43, w - 70, 22, 'center');
    };

    Scene_BFPanelPuzzle2.prototype._gearCenters = function() {
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        var gap = Math.min(174, (w - 170) / 3);
        var start = w / 2 - gap * 1.5;
        var cy = Math.max(210, Math.min(h - 185, h * 0.49));
        return [0,1,2,3].map(function(i) { return {x:start + gap*i, y:cy}; });
    };

    Scene_BFPanelPuzzle2.prototype._draw = function() {
        var b = this._layoutBitmap, w = Graphics.boxWidth, h = Graphics.boxHeight;
        b.clear();
        b.fontFace = 'GameFont'; b.outlineColor = '#06111a'; b.outlineWidth = 3;
        var centers = this._gearCenters();
        // Силовые линии между механизмами
        for (var j = 0; j < 3; j++) {
            var mid = (centers[j].x + centers[j+1].x) / 2;
            b.fillRect(centers[j].x + 45, centers[j].y - 5, centers[j+1].x - centers[j].x - 90, 10, '#5d432a');
            b.fillRect(centers[j].x + 45, centers[j].y - 2, centers[j+1].x - centers[j].x - 90, 3, '#d49a4d');
            b.fillRect(mid - 7, centers[j].y - 20, 14, 40, '#293d45');
            b.fillRect(mid - 3, centers[j].y - 15, 6, 30, '#b77b3b');
        }
        for (var i = 0; i < 4; i++) {
            var c = centers[i], val = this._values[i], target = this._target[i];
            var r = Math.min(48, Math.max(35, (w - 130) / 14));
            // Корпус привода и зубчатый венец
            b.fillRect(c.x-r-15, c.y-r-20, (r+15)*2, (r+15)*2, '#0d202b');
            b.fillRect(c.x-r-12, c.y-r-17, (r+12)*2, (r+12)*2, '#b77b3b');
            b.fillRect(c.x-r-8, c.y-r-13, (r+8)*2, (r+8)*2, '#182e39');
            var ctx = b._context;
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.strokeStyle = '#d9a45b'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
            ctx.strokeStyle = '#77502d'; ctx.lineWidth = 11;
            ctx.beginPath(); ctx.arc(0,0,r-8,0,Math.PI*2); ctx.stroke();
            ctx.strokeStyle = '#d5a45c'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0,0,r-17,0,Math.PI*2); ctx.stroke();
            // Четыре зубца и стрелка положения
            for (var t=0;t<12;t++) {
                var a=t*Math.PI/6 + val*Math.PI/2;
                ctx.fillStyle = (t%3===0) ? '#e8b765' : '#77512e';
                ctx.save(); ctx.rotate(a); ctx.fillRect(-4,-r-5,8,13); ctx.restore();
            }
            ctx.rotate(val*Math.PI/2);
            ctx.fillStyle = '#59b7c9';
            ctx.beginPath(); ctx.moveTo(0,-r+5); ctx.lineTo(-8,-r+22); ctx.lineTo(8,-r+22); ctx.closePath(); ctx.fill();
            ctx.restore();
            b._setDirty();
            // Эталонная метка — положение, но без раскрытия числового ответа.
            b.fillRect(c.x-r-13, c.y+r+28, (r+13)*2, 7, '#263d47');
            b.fillRect(c.x-r-13, c.y+r+28, (r+13)*2*(val+1)/4, 7,
                val === target ? '#59b7c9' : '#b77b3b');
            b.fontSize = 17; b.textColor = '#f5e7c8';
            b.drawText('ПРИВОД ' + (i+1), c.x-r-35, c.y-r-58, (r+35)*2, 24, 'center');
            b.fontSize = 14; b.textColor = '#a9bbc2';
            b.drawText('ПОЛОЖЕНИЕ  ' + (val+1) + '/4', c.x-r-40, c.y+r+38, (r+40)*2, 22, 'center');
            // Индикатор соответствия цели
            b.fillRect(c.x-7, c.y-r-42, 14, 14, val === target ? '#59b7c9' : '#6b4a2c');
            b.fillRect(c.x-4, c.y-r-39, 8, 8, val === target ? '#b8f0f0' : '#1b2d36');
        }
        // Подсказка о связанной передаче
        b.fillRect(40, h-125, w-80, 34, '#0b1d27');
        b.fillRect(40, h-125, 4, 34, '#d89b4a');
        b.fontSize = 17; b.textColor = this._messageColor;
        b.drawText(this._message, 54, h-122, w-108, 28, 'center');
    };

    Scene_BFPanelPuzzle2.prototype._setMessage = function(text, color) {
        this._message = text;
        this._messageColor = color || '#c7d4d9';
        this._draw();
    };

    Scene_BFPanelPuzzle2.prototype._rotate = function(i) {
        if (this._solved) return;
        // Связанная передача: выбранный привод и следующий вращаются вперёд,
        // предыдущий — в обратную сторону. Все значения цикличны 0..3.
        this._values[i] = (this._values[i] + 1) % 4;
        this._values[(i + 1) % 4] = (this._values[(i + 1) % 4] + 1) % 4;
        this._values[(i + 3) % 4] = (this._values[(i + 3) % 4] + 3) % 4;
        this._moves++;
        if (this._isSolved()) {
            this._setMessage('СИНХРОНИЗАЦИЯ ДОСТИГНУТА. ПРИВОДЫ ЗАФИКСИРОВАНЫ.', '#8ee6dc');
            this._success();
        } else {
            var aligned = 0;
            for (var k=0;k<4;k++) if (this._values[k] === this._target[k]) aligned++;
            this._setMessage('ПЕРЕДАЧА СМЕЩЕНА. СОВПАДАЮТ ПОЛОЖЕНИЯ: ' + aligned + '/4', '#e0a64f');
            if (window.SoundManager) SoundManager.playCursor();
        }
    };

    Scene_BFPanelPuzzle2.prototype._isSolved = function() {
        for (var i=0;i<4;i++) if (this._values[i] !== this._target[i]) return false;
        return true;
    };

    Scene_BFPanelPuzzle2.prototype._reset = function() {
        if (this._solved) return;
        this._values = [0,0,0,0]; this._moves = 0;
        this._setMessage('НАЧАЛЬНОЕ ПОЛОЖЕНИЕ ВОССТАНОВЛЕНО. НАСТРОЙТЕ ПРИВОДЫ.', '#c7d4d9');
        if (window.SoundManager) SoundManager.playCancel();
    };

    Scene_BFPanelPuzzle2.prototype._success = function() {
        if (this._solved) return;
        this._solved = true;
        if (window.SoundManager) SoundManager.playOk();
        var self = this;
        setTimeout(function() {
            if (window.$gameMap && self._sourceEventId) {
                $gameSelfSwitches.setValue([self._sourceMapId, self._sourceEventId, 'A'], true);
            }
            if (window.$gameMessage) $gameMessage.add('Пульт 2 синхронизирован. Передача восстановлена.');
            if (window.BF_QuestSystem && BF_QuestSystem.game) {
                BF_QuestSystem.game().minigameResult('CANCEL');
                BF_QuestSystem.game().panel('2');
            }
            // Совместимость с прежней схемой событий проекта.
            if (window.$gameSelfSwitches) $gameSelfSwitches.setValue([25, 3, 'A'], true);
            SceneManager.pop();
        }, 650);
    };

    Scene_BFPanelPuzzle2.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            if (window.BF_QuestSystem && BF_QuestSystem.game) BF_QuestSystem.game().minigameResult('CANCEL');
            SceneManager.pop(); return;
        }
        if (Input.isTriggered('r')) { this._reset(); return; }
        if (!TouchInput.isTriggered() || this._solved) return;
        var x = TouchInput.x, y = TouchInput.y, c = this._gearCenters();
        for (var i=0;i<4;i++) {
            var r = Math.min(63, Math.max(50, (Graphics.boxWidth-130)/14)) + 18;
            if (Math.abs(x-c[i].x) <= r && Math.abs(y-c[i].y) <= r+20) {
                this._rotate(i); return;
            }
        }
        // Нижняя полоса состояния кликабельна как сброс.
        if (y >= Graphics.boxHeight-76 && x < Graphics.boxWidth/2) this._reset();
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() !== 'bf_panelpuzzle2' ||
            String(args[0] || '').toLowerCase() !== 'start') return;
        if (!window.BF_QuestSystem || !BF_QuestSystem.game) return;
        var q = BF_QuestSystem.game().get('iron_cliff');
        var panels = BF_QuestSystem.game().getPanels ? BF_QuestSystem.game().getPanels() : {};
        if (!q || q.status !== 'active' || Number(q.step) !== 4) {
            $gameMessage.add('Пока не время отключать этот пульт.'); return;
        }
        if (panels['2']) {
            $gameMessage.add('Этот пульт уже отключён.'); return;
        }
        SceneManager.push(Scene_BFPanelPuzzle2);
    };
    window.Scene_BFPanelPuzzle2 = Scene_BFPanelPuzzle2;
})();
