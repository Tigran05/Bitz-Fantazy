/*:
 * @plugindesc Bitz Fantasy — мини-игра «Крючок и потерянные ключи» (Vermillion)
 * @author ACTPOJIuT / OpenAI
 *
 * @help
 * Команда запуска:
 *   BF_KeySearchPuzzle start
 *
 * Управление:
 *   Стрелки — двигать крючок влево/вправо/вверх/вниз.
 *   На экране также есть кнопки-стрелки для мыши/сенсорного экрана.
 *   Esc / X / кнопка ВЫХОД — отменить мини-игру.
 *
 * Цель: собрать 3 ключа, избегая рыб. На глубине патрулирует опасная рыба с фонарём.
 * Все изображения рисуются через Bitmap; внешние ресурсы не нужны.
 *
 * Интеграция сохранена:
 *   minigameStart('BF_KeySearchPuzzle', 'vermillion')
 *   minigameResult('SUCCESS'|'CANCEL')
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
        this._bitmap = null;
        this._panel = null;
        this._area = null;
        this._exitRect = null;
        this._buttons = {};
        this._hook = { x: 0, y: 0, w: 26, h: 34, invulnerable: 0 };
        this._keys = [];
        this._hazards = [];
        this._foundKeys = 0;
        this._requiredKeys = 3;
        this._hooksLeft = 3;
        this._carriedKey = null;
        this._timeLeft = 60 * 60;
        this._frame = 0;
        this._message = '';
        this._messageTimer = 0;
        this._finished = false;
        this._lastDirection = 'down';
        this._language = 'auto';
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
        this._loadSpriteAssets();
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
        this._exitRect = { x: w - 124, y: 18, width: 96, height: 38 };
        this._area = {
            x: 30,
            y: 112,
            width: w - 60,
            height: h - 280
        };
        var bx = 74;
        var by = h - 118;
        var bw = 62, bh = 48, gap = 6;
        this._buttons = {
            up:    { x: bx + bw + gap, y: by,             width: bw, height: bh, label: '▲' },
            left:  { x: bx,            y: by + bh + gap,  width: bw, height: bh, label: '◀' },
            down:  { x: bx + bw + gap, y: by + bh + gap,  width: bw, height: bh, label: '▼' },
            right: { x: bx + (bw + gap) * 2, y: by + bh + gap, width: bw, height: bh, label: '▶' }
        };
        this._hook.x = this._area.x + this._area.width / 2;
        this._hook.y = this._area.y + 24;
    };

    Scene_BFKeySearchPuzzle.prototype._createObjects = function() {
        var a = this._area;
        // Три ключа лежат на дне. Их нужно зацепить и поднять к поверхности.
        var fractions = [0.22, 0.5, 0.78];
        for (var i = 0; i < this._requiredKeys; i++) {
            this._keys.push({
                x: a.x + a.width * fractions[i],
                y: a.y + a.height - 76 - (i % 2) * 4,
                vx: 0,
                vy: 0,
                active: true,
                assetIndex: i + 1,
                phase: Math.random() * 6.28
            });
        }
        // Только рыбы: быстрая маленькая, средняя, крупная и глубоководная с фонарём.
        var fishSpecs = [
            { spriteName: 'fish_small_blue', w: 42, h: 28, lane: 0.25, speed: 1.20 },
            { spriteName: 'fish_medium_red', w: 52, h: 34, lane: 0.43, speed: 1.00 },
            { spriteName: 'fish_big_blue', w: 64, h: 44, lane: 0.61, speed: 0.82 },
            { spriteName: 'fish_angler', w: 76, h: 56, lane: 0.80, speed: 0.65 }
        ];
        for (i = 0; i < fishSpecs.length; i++) {
            var spec = fishSpecs[i];
            this._hazards.push({
                type: 'fish',
                spriteName: spec.spriteName,
                x: a.x + 40 + Math.random() * Math.max(1, a.width - 80),
                y: a.y + a.height * spec.lane,
                vx: (Math.random() < 0.5 ? -1 : 1) * spec.speed,
                vy: (Math.random() - 0.5) * 0.18,
                phase: Math.random() * 6.28,
                w: spec.w,
                h: spec.h
            });
        }
    };

    Scene_BFKeySearchPuzzle.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (this._finished) return;

        this._frame++;
        if (this._messageTimer > 0) {
            this._messageTimer--;
            if (this._messageTimer === 0) this._message = '';
        }

        if (Input.isTriggered('cancel')) {
            this._closeWithoutSuccess();
            return;
        }
        if (TouchInput.isTriggered()) {
            this._onTouch(TouchInput.x, TouchInput.y);
            if (this._finished) return;
        }

        this._moveHook();
        this._moveObjects();
        this._checkCollisions();

        this._timeLeft--;
        if (this._timeLeft <= 0) {
            this._finishFailure(this._t('Время вышло! Ключи остались в воде.', 'Time is up! The keys are still underwater.'));
            return;
        }
        this._redraw();
    };

    Scene_BFKeySearchPuzzle.prototype._loadSpriteAssets = function() {
        this._spriteAssets = {};
        var names = [
            'key_1','key_2','key_3','hook_idle','hook_down','hook_with_key',
            'fish_small_blue_left','fish_small_blue_right','fish_small_red_left','fish_small_red_right',
            'fish_medium_blue_left','fish_medium_blue_right','fish_medium_red_left','fish_medium_red_right',
            'fish_big_blue_left','fish_big_blue_right','fish_big_red_left','fish_big_red_right',
            'fish_angler_left','fish_angler_right',
            'junk_crate','junk_box','junk_barrel','junk_pot','junk_skull','junk_wheel',
            'bg_rocks_left','bg_seabed','bg_rocks_right'
        ];
        for (var i = 0; i < names.length; i++) {
            this._spriteAssets[names[i]] = ImageManager.loadPicture('fishing/' + names[i]);
        }
    };

    Scene_BFKeySearchPuzzle.prototype._bltSprite = function(name, x, y, width, height) {
        if (!this._spriteAssets || !this._spriteAssets[name]) return false;
        var image = this._spriteAssets[name];
        if (!image.isReady() || image.width <= 0 || image.height <= 0) return false;
        var b = this._bitmap;
        b.blt(image, 0, 0, image.width, image.height,
            Math.round(x - width / 2), Math.round(y - height / 2),
            Math.round(width), Math.round(height));
        return true;
    };

    Scene_BFKeySearchPuzzle.prototype._moveHook = function() {
        var speed = 3.2;
        var dx = 0, dy = 0;
        if (Input.isPressed('left'))  { dx -= speed; this._lastDirection = 'left'; }
        if (Input.isPressed('right')) { dx += speed; this._lastDirection = 'right'; }
        if (Input.isPressed('up'))    { dy -= speed; this._lastDirection = 'up'; }
        if (Input.isPressed('down'))  { dy += speed; this._lastDirection = 'down';
        this._language = 'auto'; }
        this._hook.x += dx;
        this._hook.y += dy;

        var a = this._area;
        this._hook.x = Math.max(a.x + 14, Math.min(a.x + a.width - 14, this._hook.x));
        this._hook.y = Math.max(a.y + 42, Math.min(a.y + a.height - 18, this._hook.y));
        if (this._hook.invulnerable > 0) this._hook.invulnerable--;
        if (this._carriedKey) {
            this._carriedKey.x = this._hook.x + 8;
            this._carriedKey.y = this._hook.y + 19;
        }
        // Доставили ключ к поверхности — он успешно вытащен.
        if (this._carriedKey && this._hook.y <= a.y + 48) this._landCarriedKey();
    };

    Scene_BFKeySearchPuzzle.prototype._moveObjects = function() {
        var a = this._area;
        var i, o;
        // Ключи лежат неподвижно на дне до момента, когда крючок их зацепит.
        // Не обновляем их координаты и не применяем к ним течение.
        for (i = 0; i < this._hazards.length; i++) {
            o = this._hazards[i];
            o.x += o.vx;
            o.y += o.vy + Math.sin(this._frame / 13 + o.phase) * 0.5;
            if (o.x < a.x + 24 || o.x > a.x + a.width - 24) o.vx *= -1;
            if (o.y < a.y + 38 || o.y > a.y + a.height - 24) o.vy *= -1;
        }
    };

    Scene_BFKeySearchPuzzle.prototype._checkCollisions = function() {
        var i, o, dx, dy;
        // Ключ подбирается касанием крючка, когда лежит на дне.
        if (!this._carriedKey) {
            for (i = 0; i < this._keys.length; i++) {
                o = this._keys[i];
                if (!o.active) continue;
                dx = this._hook.x - o.x;
                dy = this._hook.y - o.y;
                if (Math.abs(dx) < 31 && Math.abs(dy) < 34) {
                    this._carriedKey = o;
                    o.active = false;
                    o.attached = true;
                    this._message = this._t('Ключ зацеплен! Поднимайте крючок вверх!', 'Key hooked! Pull the hook upward!');
                    this._messageTimer = 90;
                    SoundManager.playOk();
                    break;
                }
            }
        }

        // Любое касание рыбы или мусора расходует один крючок — даже если ключ не зацеплен.
        if (this._hook.invulnerable > 0) return;
        for (i = 0; i < this._hazards.length; i++) {
            o = this._hazards[i];
            dx = this._hook.x - o.x;
            dy = this._hook.y - o.y;
            if (Math.abs(dx) < o.w / 2 + 21 && Math.abs(dy) < o.h / 2 + 22) {
                if (this._carriedKey) {
                    var dropped = this._carriedKey;
                    dropped.active = true;
                    dropped.attached = false;
                    dropped.x = Math.max(this._area.x + 30, Math.min(this._area.x + this._area.width - 30, this._hook.x));
                    dropped.y = this._area.y + this._area.height - 76;
                    this._carriedKey = null;
                }
                this._hooksLeft--;
                this._message = this._t('Крючок сломан! Осталось крючков: ', 'Hook broken! Hooks left: ') + this._hooksLeft;
                this._messageTimer = 100;
                SoundManager.playBuzzer();
                this._hook.invulnerable = 50;
                this._hook.x = Math.max(this._area.x + 25, Math.min(this._area.x + this._area.width - 25, this._hook.x - (o.vx || 0) * 14));
                this._hook.y = Math.min(this._area.y + this._area.height - 45, this._hook.y + 26);
                if (this._hooksLeft <= 0) {
                    this._finishFailure(this._t('Крючки закончились! Не удалось вытащить все ключи.', 'No hooks left! You failed to retrieve all keys.'));
                    return;
                }
                break;
            }
        }
    };

    Scene_BFKeySearchPuzzle.prototype._landCarriedKey = function() {
        if (!this._carriedKey || this._finished) return;
        this._carriedKey.attached = false;
        this._carriedKey = null;
        this._foundKeys++;
        this._hook.y = this._area.y + 52;
        this._message = this._t('Ключ вытащен! ', 'Key retrieved! ') + this._foundKeys + this._t(' из ', ' of ') + this._requiredKeys;
        this._messageTimer = 85;
        SoundManager.playOk();
        if (this._foundKeys >= this._requiredKeys) this._success();
    };

    Scene_BFKeySearchPuzzle.prototype._onTouch = function(x, y) {
        if (this._inside(x, y, this._exitRect)) {
            this._closeWithoutSuccess();
            return;
        }
        var names = ['up', 'left', 'down', 'right'];
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            if (this._inside(x, y, this._buttons[name])) {
                this._tapDirection = name;
                // Короткий импульс управления — повторные касания позволяют точно маневрировать.
                var speed = 28;
                if (name === 'left') this._hook.x -= speed;
                if (name === 'right') this._hook.x += speed;
                if (name === 'up') this._hook.y -= speed;
                if (name === 'down') this._hook.y += speed;
                this._hook.x = Math.max(this._area.x + 14, Math.min(this._area.x + this._area.width - 14, this._hook.x));
                this._hook.y = Math.max(this._area.y + 42, Math.min(this._area.y + this._area.height - 18, this._hook.y));
                return;
            }
        }
    };

    Scene_BFKeySearchPuzzle.prototype._inside = function(x, y, r) {
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
    };

    Scene_BFKeySearchPuzzle.prototype._getLanguage = function() {
        // ASTROLIT_Language.js stores the selected language in ConfigManager.bfLanguage.
        try {
            if (window.ConfigManager && ConfigManager.bfLanguage) {
                return ConfigManager.bfLanguage === 'en' ? 'en' : 'ru';
            }
            if (window.BF_Language && window.BF_Language.translateUI) {
                // Fallback to the same config key used by ASTROLIT_Language.
                return (ConfigManager && ConfigManager.bfLanguage === 'en') ? 'en' : 'ru';
            }
        } catch (e) {}
        return 'ru';
    };

    Scene_BFKeySearchPuzzle.prototype._t = function(ru, en) {
        return this._getLanguage() === 'en' ? en : ru;
    };

    Scene_BFKeySearchPuzzle.prototype._redraw = function() {
        var b = this._bitmap, w = Graphics.boxWidth, h = Graphics.boxHeight, a = this._area;
        b.clear();
        b.fillRect(0, 0, w, h, '#07131d');
        b.fillRect(24, 14, w - 48, 58, '#172a37');
        b.fillRect(24, 72, w - 48, 2, '#4e8293');
        b.fontSize = 27;
        b.textColor = '#f1f7fa';
        b.drawText(this._t('ПОЙМАЙ ПОТЕРЯННЫЕ КЛЮЧИ', 'CATCH THE LOST KEYS'), 42, 24, w - 190, 32, 'left');
        b.fillRect(this._exitRect.x, this._exitRect.y, this._exitRect.width, this._exitRect.height, '#354955');
        b.fontSize = 18;
        b.drawText(this._t('ВЫХОД', 'EXIT'), this._exitRect.x, this._exitRect.y + 6, this._exitRect.width, 25, 'center');

        b.fontSize = 18;
        b.textColor = '#c5e8f1';
        b.drawText(this._t('Три ключа на дне. Рыбы ломают крючок при касании.', 'Three keys on the bottom. Any fish collision breaks a hook.'), 34, 79, w - 68, 26, 'left');

        b.fillRect(a.x, a.y, a.width, a.height, '#08283c');
        b.gradientFillRect(a.x + 3, a.y + 3, a.width - 6, Math.max(20, a.height * 0.24), '#164d68', '#0d3b54', true);
        b.gradientFillRect(a.x + 3, a.y + a.height * 0.58, a.width - 6, a.height * 0.40, '#0b354b', '#041522', true);
        b.fillRect(a.x + 3, a.y + a.height - 15, a.width - 6, 12, '#152e37');
        for (var peb = 0; peb < 18; peb++) {
            var px = a.x + 10 + ((peb * 97) % Math.max(1, a.width - 20));
            b.fillRect(px, a.y + a.height - 11 + (peb % 3), 3 + (peb % 3), 2, '#45606a');
        }
        // Подводные полосы/течение.
        for (var band = 0; band < 7; band++) {
            var yy = a.y + 22 + band * (a.height / 7);
            b.fillRect(a.x + 8, yy, a.width - 16, 1, '#14516a');
            var flowX = a.x + ((this._frame * (1 + band % 3) + band * 71) % Math.max(1, a.width - 50));
            b.fillRect(flowX, yy + 8, 34, 2, '#1c6075');
            b.fillRect(flowX + 18, yy + 13, 18, 1, '#1c6075');
        }
        this._drawBorder(b, a.x, a.y, a.width, a.height, '#4f91a6', 3);

        // Леска и крючок.
        b.fillRect(this._hook.x - 1, a.y + 2, 2, Math.max(1, this._hook.y - a.y), '#c5d4d9');
        if (this._hook.invulnerable <= 0 || Math.floor(this._frame / 5) % 2 === 0) {
            var hookSprite = this._carriedKey ? 'hook_with_key' : 'hook_idle';
            if (!this._bltSprite(hookSprite, this._hook.x, this._hook.y, 44, 64)) {
                b.fillRect(this._hook.x - 3, this._hook.y - 13, 6, 25, '#d9e1e4');
                b.fillRect(this._hook.x - 3, this._hook.y + 8, 14, 4, '#d9e1e4');
                b.fillRect(this._hook.x + 7, this._hook.y + 8, 4, 8, '#d9e1e4');
                b.fillRect(this._hook.x + 7, this._hook.y + 14, 4, 4, '#d9e1e4');
            }
        }

        for (var j = 0; j < this._hazards.length; j++) this._drawHazard(this._hazards[j]);
        for (var i = 0; i < this._keys.length; i++) if (this._keys[i].active) this._drawKey(this._keys[i]);
        if (this._carriedKey) this._drawKey(this._carriedKey);

        b.fillRect(w - 420, h - 100, 386, 34, '#172a37');
        b.fontSize = 19;
        b.textColor = '#ffe59a';
        b.drawText(this._t('КЛЮЧИ: ', 'KEYS: ') + this._foundKeys + ' / ' + this._requiredKeys + '   ' + this._t('КРЮЧКИ: ', 'HOOKS: ') + this._hooksLeft + ' / 3', w - 410, h - 96, 370, 26, 'left');
        b.textColor = '#ffffff';
        b.drawText(this._t('ВРЕМЯ: ', 'TIME: ') + Math.ceil(this._timeLeft / 60) + this._t(' сек.', ' sec.'), w - 240, h - 63, 200, 24, 'right');

        var names = ['up', 'left', 'down', 'right'];
        for (var k = 0; k < names.length; k++) {
            var r = this._buttons[names[k]];
            b.fillRect(r.x, r.y, r.width, r.height, '#294957');
            this._drawBorder(b, r.x, r.y, r.width, r.height, '#80b4c5', 2);
            b.fontSize = 30;
            b.textColor = '#ffffff';
            b.drawText(r.label, r.x, r.y + 2, r.width, r.height - 4, 'center');
        }

        if (this._message) {
            b.fillRect(w / 2 - 210, h - 76, 420, 30, '#203d49');
            b.fontSize = 17;
            b.textColor = '#ffffff';
            b.drawText(this._message, w / 2 - 200, h - 73, 400, 24, 'center');
        }
    };

    Scene_BFKeySearchPuzzle.prototype._drawKey = function(key) {
        var name = 'key_' + (key.assetIndex || 1);
        if (!this._bltSprite(name, key.x, key.y, 66, 66)) {
            var b = this._bitmap, x = key.x, y = key.y;
            b.fillRect(x - 19, y - 10, 39, 20, '#493b18');
            b.fillRect(x - 15, y - 6, 31, 12, '#ffd84d');
            b.fillRect(x - 19, y - 13, 14, 26, '#493b18');
            b.fillRect(x - 16, y - 10, 8, 20, '#ffe98a');
            b.fillRect(x - 5, y - 3, 25, 6, '#ffd84d');
        }
    };

    Scene_BFKeySearchPuzzle.prototype._drawHazard = function(o) {
        var x = o.x, y = o.y;
        var facing = o.vx >= 0 ? 'right' : 'left';
        // У рыбы-удильщика исходные файлы названы наоборот относительно направления взгляда.
        if (o.spriteName === 'fish_angler') facing = o.vx >= 0 ? 'left' : 'right';
        var name = (o.spriteName || 'fish_small_blue') + '_' + facing;
        var size = o.spriteName === 'fish_angler' ? 100 :
                   (String(o.spriteName).indexOf('big') >= 0 ? 78 :
                   (String(o.spriteName).indexOf('medium') >= 0 ? 66 : 54));
        if (this._bltSprite(name, x, y, size, size * 0.72)) return;
        var b = this._bitmap;
        b.fillRect(x - 15, y - 8, 30, 16, '#e77e69');
        b.fillRect(x + (o.vx >= 0 ? 13 : -23), y - 13, 10, 26, '#e77e69');
    };

    Scene_BFKeySearchPuzzle.prototype._drawBorder = function(bitmap, x, y, width, height, color, thickness) {
        bitmap.fillRect(x, y, width, thickness, color);
        bitmap.fillRect(x, y + height - thickness, width, thickness, color);
        bitmap.fillRect(x, y, thickness, height, color);
        bitmap.fillRect(x + width - thickness, y, thickness, height, color);
    };

    Scene_BFKeySearchPuzzle.prototype._success = function() {
        if (this._finished) return;
        this._finished = true;
        this._message = this._t('Все ключи пойманы!', 'All keys retrieved!');
        this._redraw();
        SoundManager.playOk();
        if (window.BF_QuestSystem && BF_QuestSystem.game()) {
            BF_QuestSystem.game().minigameResult('SUCCESS');
        }
        SceneManager.pop();
    };

    Scene_BFKeySearchPuzzle.prototype._finishFailure = function(message) {
        if (this._finished) return;
        this._finished = true;
        this._message = message;
        SoundManager.playBuzzer();
        if (window.BF_QuestSystem && BF_QuestSystem.game()) {
            BF_QuestSystem.game().minigameResult('CANCEL');
        }
        SceneManager.pop();
    };

    Scene_BFKeySearchPuzzle.prototype._closeWithoutSuccess = function() {
        if (this._finished) return;
        this._finished = true;
        if (window.BF_QuestSystem && BF_QuestSystem.game()) {
            BF_QuestSystem.game().minigameResult('CANCEL');
        }
        SceneManager.pop();
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === pluginName && args && args[0] === 'start') {
            SceneManager.push(Scene_BFKeySearchPuzzle);
        }
    };

    window.Scene_BFKeySearchPuzzle = Scene_BFKeySearchPuzzle;
})();
