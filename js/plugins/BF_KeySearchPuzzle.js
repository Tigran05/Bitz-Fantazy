/*:
 * @plugindesc Bitz Fantasy — мини-игра поиска потерянных ключей у водосточной решётки
 * @author ACTPOJIuT / OpenAI
 *
 * @help
 * Команда:
 *   BF_KeySearchPuzzle start
 *
 * Мини-игра рассчитана на Vermillion, шаг квеста vermillion === 10.
 * При успехе вызывает BF_QuestSystem.game().minigameResult('SUCCESS'),
 * после чего BF Quest автоматически переводит vermillion на следующий шаг.
 *
 * Никаких внешних ресурсов не требует: графика рисуется через Bitmap.
 */

(function() {
    'use strict';

    var pluginName = 'BF_KeySearchPuzzle';

    function Scene_BFKeySearchPuzzle() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFKeySearchPuzzle.prototype = Object.create(Scene_Base.prototype);
    Scene_BFKeySearchPuzzle.prototype.constructor = Scene_BFKeySearchPuzzle;

    Scene_BFKeySearchPuzzle.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._objects = [];
        this._found = false;
        this._message = '';
        this._messageTimer = 0;
        this._correctIndex = -1;
        this._panel = null;
        this._bitmap = null;
        this._exitRect = null;
    };

    Scene_BFKeySearchPuzzle.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        if (!window.BF_QuestSystem ||
            !BF_QuestSystem.game() ||
            !BF_QuestSystem.game().minigameStart('BF_KeySearchPuzzle', 'vermillion')) {
            SceneManager.pop();
            return;
        }

        this._createBackground();
        this._createLayout();
        this._createObjects();
        this._redraw();
    };

    Scene_BFKeySearchPuzzle.prototype._createBackground = function() {
        this._bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._panel = new Sprite(this._bitmap);
        this.addChild(this._panel);
    };

    Scene_BFKeySearchPuzzle.prototype._createLayout = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        this._exitRect = {
            x: w - 145,
            y: 22,
            width: 112,
            height: 42
        };

        this._area = {
            x: 48,
            y: 150,
            width: w - 96,
            height: h - 205
        };
    };

    Scene_BFKeySearchPuzzle.prototype._createObjects = function() {
        var area = this._area;
        var positions = [
            [area.x + 95,  area.y + 80],
            [area.x + 285, area.y + 65],
            [area.x + 485, area.y + 90],
            [area.x + 670, area.y + 70],
            [area.x + 175, area.y + 250],
            [area.x + 390, area.y + 235],
            [area.x + 610, area.y + 255]
        ];

        var labels = [
            'СТАРЫЙ ЯЩИК',
            'КУСОК МЕТАЛЛА',
            'ТРУБА',
            'КУЧА МУСОРА',
            'КОРОБКА',
            'РЖАВЫЙ ЯЩИК',
            'ОБЛОМКИ'
        ];

        this._correctIndex = Math.floor(Math.random() * positions.length);

        for (var i = 0; i < positions.length; i++) {
            this._objects.push({
                x: positions[i][0],
                y: positions[i][1],
                width: 125,
                height: 82,
                label: labels[i],
                active: true,
                correct: i === this._correctIndex
            });
        }
    };

    Scene_BFKeySearchPuzzle.prototype._redraw = function() {
        var b = this._bitmap;
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        b.clear();

        // Background.
        b.fillRect(0, 0, w, h, 'rgba(0,0,0,0.92)');

        // Header.
        b.fillRect(28, 16, w - 56, 58, '#20242b');
        b.fillRect(28, 74, w - 56, 2, '#6e7885');

        b.fontSize = 28;
        b.textColor = '#ffffff';
        b.drawText('ПОИСК ПОТЕРЯННЫХ КЛЮЧЕЙ', 48, 25, w - 230, 32, 'left');

        // Exit button.
        b.fillRect(this._exitRect.x, this._exitRect.y,
            this._exitRect.width, this._exitRect.height, '#343a42');
        b.fontSize = 20;
        b.textColor = '#ffffff';
        b.drawText('ВЫХОД', this._exitRect.x, this._exitRect.y + 8,
            this._exitRect.width, 24, 'center');

        // Hint.
        b.fontSize = 20;
        b.textColor = '#d7dde5';
        b.drawText('Осмотрите предметы за решёткой.', 48, 105, w - 96, 28, 'left');

        // Search area.
        b.fillRect(this._area.x, this._area.y,
            this._area.width, this._area.height, '#171b20');
        this._drawBorder(b, this._area.x, this._area.y,
            this._area.width, this._area.height, '#59636f', 2);

        for (var i = 0; i < this._objects.length; i++) {
            this._drawObject(this._objects[i], i);
        }

        // Message.
        if (this._messageTimer > 0 && this._message) {
            b.fillRect(150, h - 48, w - 300, 34, '#2b3037');
            b.fontSize = 18;
            b.textColor = '#ffffff';
            b.drawText(this._message, 160, h - 43, w - 320, 24, 'center');
        }
    };

    Scene_BFKeySearchPuzzle.prototype._drawBorder = function(bitmap, x, y, width, height, color, thickness) {
        thickness = thickness || 1;
        bitmap.fillRect(x, y, width, thickness, color);
        bitmap.fillRect(x, y + height - thickness, width, thickness, color);
        bitmap.fillRect(x, y, thickness, height, color);
        bitmap.fillRect(x + width - thickness, y, thickness, height, color);
    };

    Scene_BFKeySearchPuzzle.prototype._drawObject = function(obj, index) {
        var b = this._bitmap;

        if (!obj.active) {
            b.fillRect(obj.x, obj.y, obj.width, obj.height, '#262b31');
            b.fontSize = 16;
            b.textColor = '#777f89';
            b.drawText('ПРОВЕРЕНО', obj.x, obj.y + 29, obj.width, 24, 'center');
            return;
        }

        b.fillRect(obj.x, obj.y, obj.width, obj.height, '#343a41');
        this._drawBorder(b, obj.x, obj.y, obj.width, obj.height, '#788391', 2);

        // Simple built-in silhouettes, no external image files.
        if (index % 3 === 0) {
            b.fillRect(obj.x + 22, obj.y + 18, obj.width - 44, 42, '#59616a');
            b.fillRect(obj.x + 30, obj.y + 10, obj.width - 60, 10, '#69727c');
        } else if (index % 3 === 1) {
            b.fillRect(obj.x + 20, obj.y + 28, obj.width - 40, 20, '#626b74');
            b.fillRect(obj.x + 45, obj.y + 15, 35, 46, '#4e565f');
        } else {
            b.fillRect(obj.x + 45, obj.y + 12, 35, 56, '#59616a');
            b.fillRect(obj.x + 30, obj.y + 35, 65, 10, '#6c7580');
        }

        b.fontSize = 15;
        b.textColor = '#e1e5e9';
        b.drawText(obj.label, obj.x - 10, obj.y + obj.height + 5,
            obj.width + 20, 22, 'center');
    };

    Scene_BFKeySearchPuzzle.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (this._messageTimer > 0) {
            this._messageTimer--;
            if (this._messageTimer === 0) {
                this._message = '';
                this._redraw();
            }
        }

        if (Input.isTriggered('cancel')) {
            this._closeWithoutSuccess();
            return;
        }

        if (TouchInput.isTriggered()) {
            this._onTouch(TouchInput.x, TouchInput.y);
        }
    };

    Scene_BFKeySearchPuzzle.prototype._onTouch = function(x, y) {
        if (this._inside(x, y, this._exitRect)) {
            this._closeWithoutSuccess();
            return;
        }

        for (var i = 0; i < this._objects.length; i++) {
            var obj = this._objects[i];
            if (!obj.active) {
                continue;
            }

            if (this._inside(x, y, obj)) {
                this._checkObject(obj);
                return;
            }
        }
    };

    Scene_BFKeySearchPuzzle.prototype._inside = function(x, y, rect) {
        return x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height;
    };

    Scene_BFKeySearchPuzzle.prototype._checkObject = function(obj) {
        if (obj.correct) {
            this._success();
            return;
        }

        obj.active = false;
        this._message = 'Здесь ничего нет.';
        this._messageTimer = 45;
        SoundManager.playBuzzer();
        this._redraw();
    };

    Scene_BFKeySearchPuzzle.prototype._success = function() {
        if (this._found) {
            return;
        }

        this._found = true;
        this._message = 'Вы нашли ключи!';
        this._messageTimer = 90;
        SoundManager.playOk();
        this._redraw();

        var self = this;

        setTimeout(function() {
            if (window.BF_QuestSystem && BF_QuestSystem.game()) {
                BF_QuestSystem.game().minigameResult('SUCCESS');
            }
            SceneManager.pop();
        }, 700);
    };

    Scene_BFKeySearchPuzzle.prototype._closeWithoutSuccess = function() {
        if (this._found) {
            return;
        }

        if (window.BF_QuestSystem && BF_QuestSystem.game()) {
            BF_QuestSystem.game().minigameResult('CANCEL');
        }

        SceneManager.pop();
    };

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === pluginName && args && args[0] === 'start') {
            SceneManager.push(Scene_BFKeySearchPuzzle);
        }
    };

    window.Scene_BFKeySearchPuzzle = Scene_BFKeySearchPuzzle;

})();
