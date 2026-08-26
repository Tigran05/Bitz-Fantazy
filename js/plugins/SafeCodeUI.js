/*:
 * @plugindesc [BitzFantasy] Красивый сенсорный кодовый замок сейфа. RPG Maker MV.
 * @author OpenAI
 *
 * @help
 * Команда плагина:
 *   SAFEUI
 *
 * Использует существующие переменные проекта:
 *   #0016 сейф              - результат: 0 ожидание, 1 успех, 2 ошибка
 *   #0017 цифра бармен       - первая цифра
 *   #0018 цифра инженер      - вторая цифра
 *   #0019 цифра слот менеджер- третья цифра
 *
 * Управление: мышь/тач или клавиатура 0-9, Backspace, Enter, Esc.
 * Никаких новых переменных не требуется.
 *
 * При успехе: #0016 = 1 и Scene возвращается на карту.
 * При неверном коде: #0016 = 2, попытка очищается и можно попробовать снова.
 * При выходе: #0016 = 0.
 */
(function() {
    'use strict';

    var PLUGIN_NAME = 'SafeCodeUI';
    var V_RESULT = 16;
    var V_BARMAN = 17;
    var V_ENGINEER = 18;
    var V_SLOT = 19;

    function pad3(n) {
        n = Number(n || 0);
        return ('00' + n).slice(-3);
    }

    function playOk() {
        try { SoundManager.playOk(); } catch (e) {}
    }
    function playBuzzer() {
        try { SoundManager.playBuzzer(); } catch (e) {}
    }
    function playCursor() {
        try { SoundManager.playCursor(); } catch (e) {}
    }

    function SafeCodeScene() {
        this.initialize.apply(this, arguments);
    }

    SafeCodeScene.prototype = Object.create(Scene_Base.prototype);
    SafeCodeScene.prototype.constructor = SafeCodeScene;

    SafeCodeScene.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._digits = '';
        this._message = 'Три цифры. Введи код, который ты собрал.';
        this._messageTimer = 0;
        this._wrongFlash = 0;
        this._success = false;
        this._touchLock = false;
        this._buttons = [];
    };

    SafeCodeScene.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this.createBackground();
        this.createPanels();
    };

    SafeCodeScene.prototype.createBackground = function() {
        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        var b = this._bg.bitmap;
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        b.fillAll('#080b10');
        // Industrial panels / subtle grid.
        for (var x = 0; x < w; x += 48) b.fillRect(x, 0, 1, h, 'rgba(90,120,150,0.10)');
        for (var y = 0; y < h; y += 48) b.fillRect(0, y, w, 1, 'rgba(90,120,150,0.08)');
        b.fillRect(0, 0, w, 8, '#17202a');
        b.fillRect(0, h - 8, w, 8, '#17202a');
        this.addChild(this._bg);
    };

    SafeCodeScene.prototype.makeText = function(text, x, y, width, height, size, color, align) {
        var s = new Sprite(new Bitmap(width, height));
        s.x = x; s.y = y;
        s.bitmap.fontFace = 'GameFont';
        s.bitmap.fontSize = size || 24;
        s.bitmap.textColor = color || '#ffffff';
        s.bitmap.drawText(text, 0, 0, width, height, align || 'left');
        this.addChild(s);
        return s;
    };

    SafeCodeScene.prototype.panel = function(x, y, w, h, fill, border) {
        var s = new Sprite(new Bitmap(w, h));
        s.x = x; s.y = y;
        var b = s.bitmap;
        b.fillRect(0, 0, w, h, fill || '#101722');
        b.fillRect(0, 0, w, 2, border || '#40556a');
        b.fillRect(0, h - 2, w, 2, border || '#40556a');
        b.fillRect(0, 0, 2, h, border || '#40556a');
        b.fillRect(w - 2, 0, 2, h, border || '#40556a');
        this.addChild(s);
        return s;
    };

    SafeCodeScene.prototype.createPanels = function() {
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        var safeW = Math.min(900, w - 60);
        var safeX = Math.floor((w - safeW) / 2);
        var topY = 34;

        this.panel(safeX, topY, safeW, h - 68, '#111820', '#566879');
        this.makeText('КОДОВЫЙ ЗАМОК', safeX + 24, topY + 18, safeW - 48, 42, 30, '#f3d36a', 'center');
        this.makeText('СЕЙФ БРУННО  •  ТРЁХЗНАЧНЫЙ КОД', safeX + 24, topY + 58, safeW - 48, 28, 16, '#8fa8bd', 'center');

        // Left clue panel.
        var leftW = Math.min(260, Math.floor(safeW * 0.30));
        var leftX = safeX + 18;
        var leftY = topY + 105;
        this.panel(leftX, leftY, leftW, 315, '#0c1219', '#344858');
        this.makeText('СОБРАННЫЕ ЦИФРЫ', leftX + 16, leftY + 16, leftW - 32, 30, 19, '#67c8ff', 'center');
        this.makeText('БАРМЕН', leftX + 28, leftY + 70, leftW - 56, 28, 18, '#dfe8ef', 'left');
        this.makeText('ИНЖЕНЕР', leftX + 28, leftY + 130, leftW - 56, 28, 18, '#dfe8ef', 'left');
        this.makeText('СЛОТ-МЕНЕДЖЕР', leftX + 28, leftY + 190, leftW - 56, 28, 16, '#dfe8ef', 'left');
        this.makeText('✓', leftX + leftW - 52, leftY + 67, 30, 30, 22, '#69e36b', 'center');
        this.makeText('✓', leftX + leftW - 52, leftY + 127, 30, 30, 22, '#69e36b', 'center');
        this.makeText('✓', leftX + leftW - 52, leftY + 187, 30, 30, 22, '#69e36b', 'center');
        this.makeText('Цифры уже получены.\nОсталось собрать их в код.', leftX + 20, leftY + 238, leftW - 40, 56, 15, '#8298aa', 'center');

        // Main lock.
        var mainX = leftX + leftW + 20;
        var mainW = safeX + safeW - mainX - 18;
        var displayY = leftY + 22;
        this.panel(mainX, leftY, mainW, 118, '#080c12', '#3e5569');
        this.makeText('ВВЕДИТЕ КОД', mainX + 10, leftY + 12, mainW - 20, 26, 18, '#f0c85b', 'center');
        this._display = new Sprite(new Bitmap(mainW - 40, 58));
        this._display.x = mainX + 20; this._display.y = displayY + 40;
        this.addChild(this._display);
        this.refreshDisplay();

        // Keypad.
        var keypadY = leftY + 137;
        var cols = 3;
        var gap = 10;
        var bw = Math.floor((mainW - 40 - gap * 2) / 3);
        var bh = 48;
        var nums = ['1','2','3','4','5','6','7','8','9','←','0','✓'];
        for (var i = 0; i < nums.length; i++) {
            var col = i % cols, row = Math.floor(i / cols);
            var bx = mainX + 20 + col * (bw + gap);
            var by = keypadY + row * (bh + gap);
            this.createButton(nums[i], bx, by, bw, bh, i);
        }

        this._status = this.makeText(this._message, mainX + 10, keypadY + 4 * (bh + gap) + 10, mainW - 20, 52, 17, '#a7bac8', 'center');
        this.makeText('Нажми ESC, чтобы выйти', mainX + 10, topY + h - topY - 55, mainW - 20, 28, 14, '#657b8b', 'center');

        this._close = this.makeText('×', safeX + safeW - 52, topY + 16, 30, 34, 28, '#8fa8bd', 'center');
    };

    SafeCodeScene.prototype.createButton = function(label, x, y, w, h, index) {
        var s = new Sprite(new Bitmap(w, h));
        s.x = x; s.y = y;
        s._label = label;
        s._index = index;
        s._normal = '#16222d';
        s._hover = '#243746';
        s._accent = label === '✓' ? '#1c5b42' : (label === '←' ? '#3d2930' : '#16222d');
        this.addChild(s);
        this._buttons.push(s);
        this.drawButton(s, false);
    };

    SafeCodeScene.prototype.drawButton = function(s, hover) {
        var b = s.bitmap, w = b.width, h = b.height;
        b.clear();
        var fill = hover ? '#2a4254' : s._accent;
        b.fillRect(0, 0, w, h, fill);
        b.fillRect(0, 0, w, 2, hover ? '#8bd7ff' : '#536b7d');
        b.fillRect(0, h - 2, w, 2, hover ? '#8bd7ff' : '#536b7d');
        b.fillRect(0, 0, 2, h, hover ? '#8bd7ff' : '#536b7d');
        b.fillRect(w - 2, 0, 2, h, hover ? '#8bd7ff' : '#536b7d');
        b.fontFace = 'GameFont';
        b.fontSize = s._label === '✓' || s._label === '←' ? 27 : 24;
        b.textColor = s._label === '✓' ? '#7cff9a' : '#eaf5ff';
        b.drawText(s._label, 0, 5, w, h - 10, 'center');
    };

    SafeCodeScene.prototype.refreshDisplay = function() {
        if (!this._display) return;
        var b = this._display.bitmap, w = b.width, h = b.height;
        b.clear();
        b.fillRect(0, 0, w, h, '#05080c');
        var slots = [0,1,2];
        for (var i = 0; i < 3; i++) {
            var x = 12 + i * Math.floor((w - 24) / 3);
            var sw = Math.floor((w - 42) / 3);
            b.fillRect(x, 7, sw, h - 14, '#101b24');
            var active = i === this._digits.length;
            b.fillRect(x, h - 5, sw, 3, active ? '#4bd3ff' : '#304657');
            b.fontFace = 'GameFont';
            b.fontSize = 28;
            b.textColor = '#eaf7ff';
            var ch = this._digits.charAt(i) || '•';
            b.drawText(ch, x, 7, sw, h - 14, 'center');
        }
    };

    SafeCodeScene.prototype.setStatus = function(text, color) {
        this._message = text;
        this._messageTimer = 120;
        if (this._status) {
            this._status.bitmap.clear();
            this._status.bitmap.fontFace = 'GameFont';
            this._status.bitmap.fontSize = 17;
            this._status.bitmap.textColor = color || '#a7bac8';
            this._status.bitmap.drawText(text, 0, 0, this._status.bitmap.width, this._status.bitmap.height, 'center');
        }
    };

    SafeCodeScene.prototype.addDigit = function(d) {
        if (this._success) return;
        if (this._digits.length >= 3) return;
        this._digits += String(d);
        playCursor();
        this.refreshDisplay();
        if (this._digits.length === 3) this.submitCode();
    };

    SafeCodeScene.prototype.backspace = function() {
        if (this._success) return;
        if (this._digits.length > 0) {
            this._digits = this._digits.slice(0, -1);
            playCursor();
            this.refreshDisplay();
        }
    };

    SafeCodeScene.prototype.submitCode = function() {
        var target = String($gameVariables.value(V_BARMAN)) +
                     String($gameVariables.value(V_ENGINEER)) +
                     String($gameVariables.value(V_SLOT));
        if (this._digits === target) {
            $gameVariables.setValue(V_RESULT, 1);
            this._success = true;
            playOk();
            this.setStatus('ДОСТУП РАЗРЕШЁН  •  СЕЙФ ОТКРЫТ', '#71ff92');
            this.refreshDisplay();
            this._successTimer = 70;
        } else {
            $gameVariables.setValue(V_RESULT, 2);
            playBuzzer();
            this._wrongFlash = 18;
            this.setStatus('КОД НЕВЕРНЫЙ  •  ПОПРОБУЙ ЕЩЁ РАЗ', '#ff6f6f');
            this._digits = '';
            this.refreshDisplay();
        }
    };

    SafeCodeScene.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        this.updateButtons();
        if (this._messageTimer > 0) this._messageTimer--;
        if (this._wrongFlash > 0) this._wrongFlash--;
        if (this._success) {
            this._successTimer--;
            if (this._successTimer <= 0) this.popScene();
        }
        if (Input.isTriggered('escape')) {
            $gameVariables.setValue(V_RESULT, 0);
            this.popScene();
            return;
        }
        if (Input.isTriggered('ok') && this._digits.length === 3 && !this._success) this.submitCode();
        for (var n = 0; n <= 9; n++) {
            if (Input.isTriggered(String(n))) this.addDigit(n);
        }
        if (Input.isTriggered('backspace')) this.backspace();
    };

    SafeCodeScene.prototype.updateButtons = function() {
        var touch = TouchInput;
        var x = touch.x, y = touch.y;
        for (var i = 0; i < this._buttons.length; i++) {
            var s = this._buttons[i];
            var inside = x >= s.x && x < s.x + s.bitmap.width && y >= s.y && y < s.y + s.bitmap.height;
            this.drawButton(s, inside);
            if (inside && touch.isTriggered()) {
                var l = s._label;
                if (l === '←') this.backspace();
                else if (l === '✓') this.submitCode();
                else this.addDigit(l);
                return;
            }
        }
        if (touch.isTriggered()) {
            var w = Graphics.boxWidth;
            if (x > w - 85 && y < 90) {
                $gameVariables.setValue(V_RESULT, 0);
                this.popScene();
            }
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toUpperCase() === 'SAFEUI') {
            $gameVariables.setValue(V_RESULT, 0);
            SceneManager.push(SafeCodeScene);
        }
    };

    window.SafeCodeScene = SafeCodeScene;
})();
