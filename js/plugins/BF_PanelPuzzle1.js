/*:
 * @plugindesc Bitz Fantasy — Пульт 1: электрическая разводка
 * @author ASTROLIT GAMES
 *
 * @help
 * Plugin Command:
 *   BF_PanelPuzzle1 start
 *
 * После успеха:
 *   BF_Quest minigameresult CANCEL
 *   BF_Quest panel 1
 *
 * Мини-игра не продвигает основной квест сама.
 */
(function() {
    'use strict';

    function Scene_BFPanelPuzzle1() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFPanelPuzzle1.prototype = Object.create(Scene_Base.prototype);
    Scene_BFPanelPuzzle1.prototype.constructor = Scene_BFPanelPuzzle1;

    Scene_BFPanelPuzzle1.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._selected = -1;
        this._solved = false;
        this._sourceMapId = 0;
        this._sourceEventId = 0;
    };

    Scene_BFPanelPuzzle1.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sourceMapId = $gameMap ? $gameMap.mapId() : 0;
        this._sourceEventId = $gameMap && $gameMap._interpreter ?
            Number($gameMap._interpreter._eventId || 0) : 0;

        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameStart('BF_PanelPuzzle1', 'iron_cliff');
        }

        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._bg.bitmap.fillAll('#10151b');
        this.addChild(this._bg);

        this._title = new Sprite(new Bitmap(Graphics.boxWidth, 90));
        this._title.bitmap.fontSize = 32;
        this._title.bitmap.textColor = '#ffffff';
        this._title.bitmap.drawText('ПУЛЬТ 1 — ЭЛЕКТРИЧЕСКАЯ РАЗВОДКА', 0, 25, Graphics.boxWidth, 40, 'center');
        this.addChild(this._title);

        this._info = new Sprite(new Bitmap(Graphics.boxWidth, 60));
        this._info.bitmap.fontSize = 22;
        this._info.bitmap.textColor = '#d8d8d8';
        this._info.bitmap.drawText('Соедините все контакты. Нажмите на элементы в правильной последовательности.', 0, 8, Graphics.boxWidth, 35, 'center');
        this.addChild(this._info);

        this._board = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight - 150));
        this.addChild(this._board);

        this._order = [2, 4, 1, 5, 3];
        this._progress = 0;
        this._drawBoard();

        this._hint = new Sprite(new Bitmap(Graphics.boxWidth, 60));
        this._hint.bitmap.fontSize = 24;
        this._hint.bitmap.textColor = '#ffffff';
        this.addChild(this._hint);
        this._setHint('Выберите первый контакт.');
    };

    Scene_BFPanelPuzzle1.prototype._drawBoard = function() {
        var b = this._board.bitmap;
        b.clear();
        var startX = Math.round(Graphics.boxWidth / 2 - 330);
        var y = 220;
        for (var i = 0; i < 5; i++) {
            var x = startX + i * 165;
            b.fillRect(x, y, 110, 110, i < this._progress ? '#3b8f5a' : '#26313a');
            b.fillRect(x + 12, y + 12, 86, 86, '#172027');
            b.fontSize = 34;
            b.textColor = '#ffffff';
            b.drawText(String(i + 1), x, y + 30, 110, 45, 'center');
        }
        b.fontSize = 20;
        b.textColor = '#b8c2c8';
        b.drawText('Контакты', startX, y + 125, 770, 30, 'center');
    };

    Scene_BFPanelPuzzle1.prototype._setHint = function(text) {
        this._hint.bitmap.clear();
        this._hint.bitmap.fontSize = 24;
        this._hint.bitmap.textColor = '#ffffff';
        this._hint.bitmap.drawText(text, 0, 8, Graphics.boxWidth, 40, 'center');
    };

    Scene_BFPanelPuzzle1.prototype._success = function() {
        if (this._solved) return;
        this._solved = true;
        this._setHint('НАПРЯЖЕНИЕ ВОССТАНОВЛЕНО!');
        if (window.SoundManager) SoundManager.playOk();
        var self = this;
        setTimeout(function() {
            if (window.$gameMap && self._sourceEventId) {
                $gameSelfSwitches.setValue([self._sourceMapId, self._sourceEventId, 'A'], true);
            }
            if (window.$gameMessage) {
                $gameMessage.add('Пульт работает отлично.');
            }
            if (window.BF_QuestSystem && BF_QuestSystem.game) {
                BF_QuestSystem.game().minigameResult('CANCEL');
                BF_QuestSystem.game().panel('1');
                $gameSelfSwitches.setValue([25, 2, 'A'], true);
            }
            SceneManager.pop();
        }, 500);
    };

    Scene_BFPanelPuzzle1.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            if (window.BF_QuestSystem && BF_QuestSystem.game) BF_QuestSystem.game().minigameResult('CANCEL');
            SceneManager.pop();
            return;
        }
        if (!TouchInput.isTriggered() || this._solved) return;

        var x = TouchInput.x;
        var y = TouchInput.y;
        var startX = Math.round(Graphics.boxWidth / 2 - 330);
        var boardY = 220;
        for (var i = 0; i < 5; i++) {
            var bx = startX + i * 165;
            if (x >= bx && x <= bx + 110 && y >= boardY && y <= boardY + 110) {
                var n = i + 1;
                if (n === this._order[this._progress]) {
                    this._progress++;
                    this._drawBoard();
                    if (this._progress >= this._order.length) this._success();
                    else this._setHint('Верно. Следующий контакт.');
                } else {
                    this._progress = 0;
                    this._drawBoard();
                    if (window.SoundManager) SoundManager.playBuzzer();
                    this._setHint('Ошибка. Схема сброшена.');
                }
                return;
            }
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() === 'bf_panelpuzzle1' &&
            String(args[0] || '').toLowerCase() === 'start') {
            if (!window.BF_QuestSystem || !BF_QuestSystem.game) return;
            var q = BF_QuestSystem.game().get('iron_cliff');
            var panels = BF_QuestSystem.game().getPanels ? BF_QuestSystem.game().getPanels() : {};
            if (!q || q.status !== 'active' || Number(q.step) !== 4) {
                $gameMessage.add('Пока не время отключать этот пульт.');
                return;
            }
            if (panels['1']) {
                $gameMessage.add('Этот пульт уже отключён.');
                return;
            }
            SceneManager.push(Scene_BFPanelPuzzle1);
        }
    };

    window.Scene_BFPanelPuzzle1 = Scene_BFPanelPuzzle1;
})();
