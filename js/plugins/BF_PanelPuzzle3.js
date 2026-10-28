/*:
 * @plugindesc Bitz Fantasy — Пульт 3: код запуска (Premium Redesign)
 * @author ASTROLIT GAMES
 *
 * @help
 * Команда плагина:
 *   BF_PanelPuzzle3 start
 *
 * Головоломка: запомните последовательность из шести импульсов на пяти
 * контактах, затем повторите её. После трёх ошибок последовательность
 * снова показывается. Управление мышью/касанием, Esc — выход.
 *
 * Интеграция квеста сохранена:
 *   BF_Quest minigameresult CANCEL
 *   BF_Quest panel 3
 */
(function() {
    'use strict';

    var C = {
        bg: '#07131d',
        panel: '#102b39',
        panel2: '#0a1d29',
        panel3: '#173847',
        brass: '#b77b3b',
        gold: '#e0a64f',
        cream: '#f5e7c8',
        muted: '#a9bdc7',
        cyan: '#59b7c9',
        green: '#67d49a',
        red: '#d96d59',
        dark: '#061019'
    };

    function Scene_BFPanelPuzzle3() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFPanelPuzzle3.prototype = Object.create(Scene_Base.prototype);
    Scene_BFPanelPuzzle3.prototype.constructor = Scene_BFPanelPuzzle3;

    Scene_BFPanelPuzzle3.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        // Фиксированный код: шесть шагов, пять возможных контактов.
        this._sequence = [2, 5, 1, 4, 3, 2];
        this._input = [];
        this._solved = false;
        this._sourceMapId = 0;
        this._sourceEventId = 0;
        this._phase = 'preview';
        this._phaseTimer = 180; // 3 секунды при 60 FPS
        this._mistakes = 0;
        this._finishTimer = 0;
        this._buttons = [];
        this._lastPressed = -1;
        this._feedback = '';
        this._feedbackColor = C.cream;
    };

    Scene_BFPanelPuzzle3.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sourceMapId = $gameMap ? $gameMap.mapId() : 0;
        this._sourceEventId = $gameMap && $gameMap._interpreter ?
            Number($gameMap._interpreter._eventId || 0) : 0;

        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameStart('BF_PanelPuzzle3', 'iron_cliff');
        }

        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        this._bg = new Sprite(new Bitmap(w, h));
        this.addChild(this._bg);
        this._drawBackground();

        this._title = new Sprite(new Bitmap(w, 78));
        this.addChild(this._title);
        this._drawTitle();

        this._info = new Sprite(new Bitmap(w, 58));
        this.addChild(this._info);
        this._info.y = 84;
        this._drawInfo();

        this._board = new Sprite(new Bitmap(w, h));
        this.addChild(this._board);

        this._hint = new Sprite(new Bitmap(w, 58));
        this.addChild(this._hint);
        this._hint.y = h - 128;

        this._footer = new Sprite(new Bitmap(w, 36));
        this.addChild(this._footer);
        this._footer.y = h - 36;
        this._drawFooter();

        this._layoutButtons();
        this._showSequence();
        this._renderBoard();
        this._setHint('СЛЕДИТЕ ЗА СИГНАЛАМИ. ЗАПОМНИТЕ ПОРЯДОК.', C.gold);
    };

    Scene_BFPanelPuzzle3.prototype._rect = function(b, x, y, w, h, color) {
        b.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), color);
    };

    Scene_BFPanelPuzzle3.prototype._frame = function(b, x, y, w, h, color, thickness) {
        var t = thickness || 2;
        this._rect(b, x, y, w, t, color);
        this._rect(b, x, y + h - t, w, t, color);
        this._rect(b, x, y, t, h, color);
        this._rect(b, x + w - t, y, t, h, color);
    };

    Scene_BFPanelPuzzle3.prototype._drawBackground = function() {
        var b = this._bg.bitmap, w = b.width, h = b.height;
        b.fillAll(C.bg);
        // Технические панели и неброские линии, без внешних изображений.
        for (var y = 0; y < h; y += 42) this._rect(b, 0, y, w, 1, '#0d2230');
        this._rect(b, 0, 0, w, 8, C.brass);
        this._rect(b, 0, h - 5, w, 5, C.brass);
        this._rect(b, 14, 14, w - 28, h - 28, C.panel2);
        this._frame(b, 14, 14, w - 28, h - 28, C.brass, 2);
        this._rect(b, 22, 22, w - 44, h - 44, C.bg);
        // Декоративные контактные дорожки по краям.
        for (var i = 0; i < 6; i++) {
            var yy = 150 + i * 45;
            if (yy < h - 160) {
                this._rect(b, 28, yy, 32, 2, '#244858');
                this._rect(b, w - 60, yy, 32, 2, '#244858');
                this._rect(b, 36, yy - 4, 8, 10, C.brass);
                this._rect(b, w - 44, yy - 4, 8, 10, C.brass);
            }
        }
    };

    Scene_BFPanelPuzzle3.prototype._drawTitle = function() {
        var b = this._title.bitmap, w = b.width;
        b.clear();
        this._rect(b, 18, 5, w - 36, 66, C.panel);
        this._frame(b, 18, 5, w - 36, 66, C.gold, 2);
        this._rect(b, 28, 14, 5, 48, C.cyan);
        b.fontFace = 'GameFont';
        b.fontSize = 29;
        b.textColor = C.cream;
        b.drawText('ПУЛЬТ 3  /  КОД ЗАПУСКА', 44, 13, w - 88, 38, 'left');
        b.fontSize = 15;
        b.textColor = C.gold;
        b.drawText('ASTROLIT • CONTROL SYSTEM', 44, 48, w - 88, 18, 'left');
    };

    Scene_BFPanelPuzzle3.prototype._drawInfo = function() {
        var b = this._info.bitmap, w = b.width;
        b.clear();
        b.fontFace = 'GameFont';
        b.fontSize = 20;
        b.textColor = C.muted;
        var text = this._phase === 'preview' ?
            'ЗАПОМИНАНИЕ КОДА — следите за последовательностью импульсов' :
            'ВВОД КОДА — повторите последовательность по памяти';
        b.drawText(text, 26, 9, w - 52, 32, 'center');
        this._rect(b, 30, 48, w - 60, 2, '#244858');
    };

    Scene_BFPanelPuzzle3.prototype._layoutButtons = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        var count = 5;
        var gap = Math.max(10, Math.min(24, Math.floor(w * 0.022)));
        var bw = Math.min(116, Math.floor((w - 80 - gap * (count - 1)) / count));
        var bh = Math.min(116, bw);
        var total = count * bw + (count - 1) * gap;
        var startX = Math.round((w - total) / 2);
        var y = Math.round(h * 0.38);
        this._buttons = [];
        for (var i = 0; i < count; i++) {
            this._buttons.push({
                id: i + 1,
                x: startX + i * (bw + gap),
                y: y,
                w: bw,
                h: bh
            });
        }
    };

    Scene_BFPanelPuzzle3.prototype._showSequence = function() {
        this._phase = 'preview';
        this._phaseTimer = 180;
        this._input = [];
        this._feedback = 'ПОСЛЕДОВАТЕЛЬНОСТЬ ИМПУЛЬСОВ';
        this._feedbackColor = C.gold;
        this._drawInfo();
    };

    Scene_BFPanelPuzzle3.prototype._renderBoard = function() {
        var b = this._board.bitmap, w = b.width, h = b.height;
        b.clear();
        var cardX = 72, cardY = 158, cardW = w - 144, cardH = Math.max(190, h - 310);
        this._rect(b, cardX, cardY, cardW, cardH, '#0b1c27');
        this._frame(b, cardX, cardY, cardW, cardH, '#315362', 2);

        // Световые дорожки ведут к пяти контактам.
        var centerY = this._buttons[0].y + this._buttons[0].h / 2;
        for (var line = 0; line < this._buttons.length - 1; line++) {
            var a = this._buttons[line], z = this._buttons[line + 1];
            this._rect(b, a.x + a.w, centerY - 2, z.x - (a.x + a.w), 4, '#244858');
        }

        for (var i = 0; i < this._buttons.length; i++) {
            var bt = this._buttons[i];
            var pulseIndex = Math.min(this._sequence.length - 1, Math.floor((180 - this._phaseTimer) / 30));
            var lit = this._phase === 'preview' && this._sequence[pulseIndex] === bt.id;
            var pressed = this._lastPressed === bt.id && this._phase === 'input';
            var fill = lit ? '#5b421f' : (pressed ? '#174a59' : C.panel);
            var edge = lit ? C.gold : (pressed ? C.cyan : C.brass);
            this._rect(b, bt.x - 5, bt.y - 5, bt.w + 10, bt.h + 10, '#061019');
            this._rect(b, bt.x, bt.y, bt.w, bt.h, fill);
            this._frame(b, bt.x, bt.y, bt.w, bt.h, edge, 3);
            this._rect(b, bt.x + 9, bt.y + 9, bt.w - 18, bt.h - 18, '#0b1c27');
            this._frame(b, bt.x + 12, bt.y + 12, bt.w - 24, bt.h - 24, lit ? C.gold : '#315362', 1);
            // Винты на четырёх углах.
            var screw = 5;
            this._rect(b, bt.x + 5, bt.y + 5, screw, screw, C.gold);
            this._rect(b, bt.x + bt.w - 10, bt.y + 5, screw, screw, C.gold);
            this._rect(b, bt.x + 5, bt.y + bt.h - 10, screw, screw, C.gold);
            this._rect(b, bt.x + bt.w - 10, bt.y + bt.h - 10, screw, screw, C.gold);
            b.fontFace = 'GameFont';
            b.fontSize = Math.min(42, Math.floor(bt.w * 0.36));
            b.textColor = lit ? C.cream : C.muted;
            b.drawText(String(bt.id), bt.x, bt.y + Math.round(bt.h * 0.24), bt.w, Math.round(bt.h * 0.48), 'center');
            b.fontSize = 12;
            b.textColor = lit ? C.gold : '#6d8b97';
            b.drawText(lit ? 'SIGNAL' : 'CONTACT', bt.x, bt.y + bt.h - 24, bt.w, 16, 'center');
        }

        var statusY = this._buttons[0].y + this._buttons[0].h + 24;
        b.fontSize = 18;
        b.textColor = C.muted;
        var progress = this._input.length + ' / ' + this._sequence.length;
        b.drawText('ВВЕДЕНО: ' + progress, 20, statusY, w - 40, 28, 'center');

        // Шесть сегментов прогресса.
        var segW = Math.min(44, Math.floor((w - 80) / 8));
        var segGap = 8;
        var allW = segW * this._sequence.length + segGap * (this._sequence.length - 1);
        var sx = Math.round((w - allW) / 2);
        for (var j = 0; j < this._sequence.length; j++) {
            this._rect(b, sx + j * (segW + segGap), statusY + 36, segW, 7,
                j < this._input.length ? C.gold : '#1a3542');
        }

        b.fontSize = 15;
        b.textColor = C.gold;
        b.drawText('ОШИБКИ: ' + this._mistakes + ' / 3', 20, statusY + 52, w - 40, 24, 'center');
    };

    Scene_BFPanelPuzzle3.prototype._setHint = function(text, color) {
        this._hint.bitmap.clear();
        var b = this._hint.bitmap, w = b.width;
        this._rect(b, 24, 2, w - 48, 48, C.panel);
        this._rect(b, 24, 2, 5, 48, color || C.gold);
        this._frame(b, 24, 2, w - 48, 48, '#315362', 1);
        b.fontFace = 'GameFont';
        b.fontSize = 19;
        b.textColor = color || C.cream;
        b.drawText(text, 38, 8, w - 76, 34, 'center');
    };

    Scene_BFPanelPuzzle3.prototype._drawFooter = function() {
        var b = this._footer.bitmap, w = b.width;
        b.clear();
        b.fontFace = 'GameFont';
        b.fontSize = 14;
        b.textColor = '#7e9ba6';
        b.drawText('ESC — ВЫХОД     •     НЕВЕРНЫЙ КОНТАКТ СБРАСЫВАЕТ ВВОД', 20, 4, w - 40, 26, 'center');
    };

    Scene_BFPanelPuzzle3.prototype._success = function() {
        if (this._solved) return;
        this._solved = true;
        this._phase = 'success';
        this._setHint('СИСТЕМА ЗАПУЩЕНА • НАПРЯЖЕНИЕ СТАБИЛЬНО', C.green);
        if (window.SoundManager) SoundManager.playOk();
        this._finishTimer = 36;
        this._drawInfo();
    };

    Scene_BFPanelPuzzle3.prototype._completeSuccess = function() {
        if (window.$gameMap && this._sourceEventId) {
            $gameSelfSwitches.setValue([this._sourceMapId, this._sourceEventId, 'A'], true);
        }
        if (window.$gameMessage) $gameMessage.add('Пульт работает отлично.');
        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameResult('CANCEL');
            BF_QuestSystem.game().panel('3');
            $gameSelfSwitches.setValue([25, 4, 'A'], true);
        }
        SceneManager.pop();
    };

    Scene_BFPanelPuzzle3.prototype._press = function(n) {
        if (this._solved || this._phase !== 'input') return;
        this._lastPressed = n;
        var expected = this._sequence[this._input.length];
        if (n === expected) {
            this._input.push(n);
            if (window.SoundManager) SoundManager.playOk();
            if (this._input.length >= this._sequence.length) {
                this._renderBoard();
                this._success();
                return;
            }
            this._feedback = 'КОНТАКТ ПРИНЯТ. ПРОДОЛЖАЙТЕ.';
            this._feedbackColor = C.green;
            this._setHint(this._feedback, this._feedbackColor);
        } else {
            this._mistakes++;
            this._input = [];
            this._lastPressed = -1;
            if (window.SoundManager) SoundManager.playBuzzer();
            if (this._mistakes >= 3) {
                this._showSequence();
                this._setHint('БЛОКИРОВКА СБРОШЕНА: ЗАПОМНИТЕ КОД ЗАНОВО.', C.red);
            } else {
                this._setHint('ОШИБКА КОДА. ВВОД СБРОШЕН.', C.red);
            }
        }
        this._renderBoard();
    };

    Scene_BFPanelPuzzle3.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            if (window.BF_QuestSystem && BF_QuestSystem.game) {
                BF_QuestSystem.game().minigameResult('CANCEL');
            }
            SceneManager.pop();
            return;
        }

        if (this._solved) {
            if (this._finishTimer > 0) this._finishTimer--;
            if (this._finishTimer <= 0) this._completeSuccess();
            return;
        }

        if (this._phase === 'preview') {
            this._phaseTimer--;
            // Перерисовываем каждый кадр, чтобы импульсы загорались строго по очереди.
            this._renderBoard();
            if (this._phaseTimer <= 0) {
                this._phase = 'input';
                this._lastPressed = -1;
                // После повторного показа кода начинаем новый цикл ошибок с нуля.
                // Иначе _mistakes >= 3 оставался истинным и код раскрывался после каждого промаха.
                this._mistakes = 0;
                this._feedback = 'КОД СТЁРТ. ВВЕДИТЕ ЕГО ПО ПАМЯТИ.';
                this._feedbackColor = C.cyan;
                this._drawInfo();
                this._setHint(this._feedback, this._feedbackColor);
                this._renderBoard();
            }
            return;
        }

        if (!TouchInput.isTriggered()) return;
        var x = TouchInput.x, y = TouchInput.y;
        for (var i = 0; i < this._buttons.length; i++) {
            var bt = this._buttons[i];
            if (x >= bt.x && x <= bt.x + bt.w && y >= bt.y && y <= bt.y + bt.h) {
                this._press(bt.id);
                return;
            }
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() === 'bf_panelpuzzle3' &&
            String(args[0] || '').toLowerCase() === 'start') {
            if (!window.BF_QuestSystem || !BF_QuestSystem.game) return;
            var q = BF_QuestSystem.game().get('iron_cliff');
            var panels = BF_QuestSystem.game().getPanels ? BF_QuestSystem.game().getPanels() : {};
            if (!q || q.status !== 'active' || Number(q.step) !== 4) {
                $gameMessage.add('Пока не время запускать этот пульт.');
                return;
            }
            if (panels['3']) {
                $gameMessage.add('Этот пульт уже активирован.');
                return;
            }
            SceneManager.push(Scene_BFPanelPuzzle3);
        }
    };

    window.Scene_BFPanelPuzzle3 = Scene_BFPanelPuzzle3;
})();
