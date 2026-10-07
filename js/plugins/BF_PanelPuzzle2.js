/*:
 * @plugindesc Bitz Fantasy — Пульт 2: синхронизация шестерён
 * @author ASTROLIT GAMES
 *
 * @help
 * Plugin Command:
 *   BF_PanelPuzzle2 start
 *
 * После успеха:
 *   BF_Quest minigameresult CANCEL
 *   BF_Quest panel 2
 */
(function() {
    'use strict';

    function Scene_BFPanelPuzzle2() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFPanelPuzzle2.prototype = Object.create(Scene_Base.prototype);
    Scene_BFPanelPuzzle2.prototype.constructor = Scene_BFPanelPuzzle2;

    Scene_BFPanelPuzzle2.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._values = [0, 0, 0];
        this._target = [2, 1, 3];
        this._solved = false;
        this._sourceMapId = 0;
        this._sourceEventId = 0;
    };

    Scene_BFPanelPuzzle2.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sourceMapId = $gameMap ? $gameMap.mapId() : 0;
        this._sourceEventId = $gameMap && $gameMap._interpreter ?
            Number($gameMap._interpreter._eventId || 0) : 0;

        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameStart('BF_PanelPuzzle2', 'iron_cliff');
        }

        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._bg.bitmap.fillAll('#17120d');
        this.addChild(this._bg);

        this._title = new Sprite(new Bitmap(Graphics.boxWidth, 90));
        this._title.bitmap.fontSize = 32;
        this._title.bitmap.textColor = '#ffffff';
        this._title.bitmap.drawText('ПУЛЬТ 2 — СИНХРОНИЗАЦИЯ ШЕСТЕРЁН', 0, 25, Graphics.boxWidth, 40, 'center');
        this.addChild(this._title);

        this._info = new Sprite(new Bitmap(Graphics.boxWidth, 60));
        this._info.bitmap.fontSize = 22;
        this._info.bitmap.textColor = '#d8d8d8';
        this._info.bitmap.drawText('Настройте три механизма по меткам. Каждый клик поворачивает шестерню.', 0, 8, Graphics.boxWidth, 35, 'center');
        this.addChild(this._info);

        this._board = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight - 150));
        this.addChild(this._board);
        this._hint = new Sprite(new Bitmap(Graphics.boxWidth, 60));
        this._hint.bitmap.fontSize = 24;
        this._hint.bitmap.textColor = '#ffffff';
        this.addChild(this._hint);

        this._draw();
        this._hintText('Три механизма должны совпасть с метками.');
    };

    Scene_BFPanelPuzzle2.prototype._draw = function() {
        var b = this._board.bitmap;
        b.clear();
        var cx = [Graphics.boxWidth / 2 - 240, Graphics.boxWidth / 2, Graphics.boxWidth / 2 + 240];
        var cy = 285;
        for (var i = 0; i < 3; i++) {
            b.fillRect(cx[i] - 72, cy - 72, 144, 144, '#4a3722');
            b.fillRect(cx[i] - 60, cy - 60, 120, 120, '#211a13');
            b.fontSize = 30;
            b.textColor = '#ffffff';
            b.drawText('↻', cx[i] - 45, cy - 42, 90, 70, 'center');
            b.fontSize = 22;
            b.drawText('Текущее: ' + this._values[i], cx[i] - 90, cy + 82, 180, 30, 'center');
            b.drawText('Цель: ' + this._target[i], cx[i] - 90, cy + 112, 180, 30, 'center');
        }
    };

    Scene_BFPanelPuzzle2.prototype._hintText = function(t) {
        this._hint.bitmap.clear();
        this._hint.bitmap.fontSize = 24;
        this._hint.bitmap.textColor = '#ffffff';
        this._hint.bitmap.drawText(t, 0, 8, Graphics.boxWidth, 40, 'center');
    };

    Scene_BFPanelPuzzle2.prototype._success = function() {
        if (this._solved) return;
        this._solved = true;
        this._hintText('МЕХАНИЗМЫ СИНХРОНИЗИРОВАНЫ!');
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
                BF_QuestSystem.game().panel('2');
                $gameSelfSwitches.setValue([25, 3, 'A'], true);
            SceneManager.pop();
        }, 500);
    };

    Scene_BFPanelPuzzle2.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            if (window.BF_QuestSystem && BF_QuestSystem.game) BF_QuestSystem.game().minigameResult('CANCEL');
            SceneManager.pop();
            return;
        }
        if (!TouchInput.isTriggered() || this._solved) return;

        var x = TouchInput.x, y = TouchInput.y;
        var cx = [Graphics.boxWidth / 2 - 240, Graphics.boxWidth / 2, Graphics.boxWidth / 2 + 240];
        for (var i = 0; i < 3; i++) {
            if (x >= cx[i] - 72 && x <= cx[i] + 72 && y >= 213 && y <= 357) {
                this._values[i] = (this._values[i] + 1) % 4;
                this._draw();
                if (this._values[0] === this._target[0] &&
                    this._values[1] === this._target[1] &&
                    this._values[2] === this._target[2]) {
                    this._success();
                } else {
                    this._hintText('Настройте все три механизма.');
                }
                return;
            }
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() === 'bf_panelpuzzle2' &&
            String(args[0] || '').toLowerCase() === 'start') {
            if (!window.BF_QuestSystem || !BF_QuestSystem.game) return;
            var q = BF_QuestSystem.game().get('iron_cliff');
            var panels = BF_QuestSystem.game().getPanels ? BF_QuestSystem.game().getPanels() : {};
            if (!q || q.status !== 'active' || Number(q.step) !== 4) {
                $gameMessage.add('Пока не время отключать этот пульт.');
                return;
            }
            if (panels['2']) {
                $gameMessage.add('Этот пульт уже отключён.');
                return;
            }
            SceneManager.push(Scene_BFPanelPuzzle2);
        }
    };

    window.Scene_BFPanelPuzzle2 = Scene_BFPanelPuzzle2;
})();
