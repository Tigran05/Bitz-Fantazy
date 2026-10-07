/*:
 * @plugindesc Bitz Fantasy — Пульт 3: код запуска
 * @author ASTROLIT GAMES
 *
 * @help
 * Plugin Command:
 *   BF_PanelPuzzle3 start
 *
 * После успеха:
 *   BF_Quest minigameresult CANCEL
 *   BF_Quest panel 3
 */
(function() {
    'use strict';

    function Scene_BFPanelPuzzle3() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFPanelPuzzle3.prototype = Object.create(Scene_Base.prototype);
    Scene_BFPanelPuzzle3.prototype.constructor = Scene_BFPanelPuzzle3;

    Scene_BFPanelPuzzle3.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._sequence = [1, 3, 4, 2];
        this._input = [];
        this._solved = false;
        this._sourceMapId = 0;
        this._sourceEventId = 0;
    };

    Scene_BFPanelPuzzle3.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sourceMapId = $gameMap ? $gameMap.mapId() : 0;
        this._sourceEventId = $gameMap && $gameMap._interpreter ?
            Number($gameMap._interpreter._eventId || 0) : 0;

        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameStart('BF_PanelPuzzle3', 'iron_cliff');
        }

        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._bg.bitmap.fillAll('#111820');
        this.addChild(this._bg);

        this._title = new Sprite(new Bitmap(Graphics.boxWidth, 90));
        this._title.bitmap.fontSize = 32;
        this._title.bitmap.textColor = '#ffffff';
        this._title.bitmap.drawText('ПУЛЬТ 3 — КОД ЗАПУСКА', 0, 25, Graphics.boxWidth, 40, 'center');
        this.addChild(this._title);

        this._info = new Sprite(new Bitmap(Graphics.boxWidth, 70));
        this._info.bitmap.fontSize = 22;
        this._info.bitmap.textColor = '#d8d8d8';
        this._info.bitmap.drawText('Нажмите четыре кнопки в правильном порядке.', 0, 8, Graphics.boxWidth, 35, 'center');
        this.addChild(this._info);

        this._board = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight - 160));
        this.addChild(this._board);
        this._hint = new Sprite(new Bitmap(Graphics.boxWidth, 60));
        this._hint.bitmap.fontSize = 24;
        this._hint.bitmap.textColor = '#ffffff';
        this.addChild(this._hint);

        this._draw();
        this._hintText('Код состоит из четырёх нажатий.');
    };

    Scene_BFPanelPuzzle3.prototype._draw = function() {
        var b = this._board.bitmap;
        b.clear();
        var gap = 35;
        var w = 120;
        var total = w * 4 + gap * 3;
        var startX = Math.round((Graphics.boxWidth - total) / 2);
        var y = 270;
        for (var i = 0; i < 4; i++) {
            var x = startX + i * (w + gap);
            b.fillRect(x, y, w, w, '#2d3944');
            b.fillRect(x + 10, y + 10, w - 20, w - 20, '#182129');
            b.fontSize = 40;
            b.textColor = '#ffffff';
            b.drawText(String(i + 1), x, y + 35, w, 55, 'center');
        }
        b.fontSize = 24;
        b.textColor = '#bfcbd3';
        b.drawText('Введено: ' + (this._input.length ? this._input.join(' → ') : '—'), 0, y + 145, Graphics.boxWidth, 40, 'center');
    };

    Scene_BFPanelPuzzle3.prototype._hintText = function(t) {
        this._hint.bitmap.clear();
        this._hint.bitmap.fontSize = 24;
        this._hint.bitmap.textColor = '#ffffff';
        this._hint.bitmap.drawText(t, 0, 8, Graphics.boxWidth, 40, 'center');
    };

    Scene_BFPanelPuzzle3.prototype._success = function() {
        if (this._solved) return;
        this._solved = true;
        this._hintText('СИСТЕМА ЗАПУЩЕНА!');
        if (window.SoundManager) SoundManager.playOk();
        var self = this;
        setTimeout(function() {
            if (window.$gameMap && self._sourceEventId) {
                $gameSelfSwitches.setValue([self._sourceMapId, self._sourceEventId, 'A'], true);
            }
            if (window.$gameMessage) {
                $gameMessage.add('Пульт работает отлично.');
            }
            if (window.BF_QuestSystem && BF_QuestSystem.game) BF_QuestSystem.game().minigameResult('CANCEL');
                BF_QuestSystem.game().panel('3');
                $gameSelfSwitches.setValue([25, 4, 'A'], true);
            SceneManager.pop();
        }, 500);
    };

    Scene_BFPanelPuzzle3.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            if (window.BF_QuestSystem && BF_QuestSystem.game) BF_QuestSystem.game().minigameResult('CANCEL');
            SceneManager.pop();
            return;
        }
        if (!TouchInput.isTriggered() || this._solved) return;

        var x = TouchInput.x, y = TouchInput.y;
        var gap = 35, w = 120;
        var total = w * 4 + gap * 3;
        var startX = Math.round((Graphics.boxWidth - total) / 2);
        var boardY = 270;

        for (var i = 0; i < 4; i++) {
            var bx = startX + i * (w + gap);
            if (x >= bx && x <= bx + w && y >= boardY && y <= boardY + w) {
                var n = i + 1;
                var expected = this._sequence[this._input.length];

                if (n === expected) {
                    this._input.push(n);
                    this._draw();
                    if (this._input.length >= this._sequence.length) this._success();
                    else this._hintText('Верно. Продолжайте.');
                } else {
                    this._input = [];
                    this._draw();
                    if (window.SoundManager) SoundManager.playBuzzer();
                    this._hintText('Неверная последовательность. Начните заново.');
                }
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
                $gameMessage.add('Пока не время отключать этот пульт.');
                return;
            }
            if (panels['3']) {
                $gameMessage.add('Этот пульт уже отключён.');
                return;
            }
            SceneManager.push(Scene_BFPanelPuzzle3);
        }
    };

    window.Scene_BFPanelPuzzle3 = Scene_BFPanelPuzzle3;
})();
