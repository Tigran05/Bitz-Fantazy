/*:
 * @plugindesc BitzFantasy — Мини-игра ловли крыс v2. Картинка RatRun.png, без знака $.
 * @author OpenAI
 *
 * @help
 * Файл крысы:
 *   img/characters/RatRun.png
 *
 * Размер RatRun.png:
 *   144 x 192 px
 *   3 кадра по горизонтали x 4 направления по вертикали
 *   каждый кадр 48 x 48 px.
 *
 * Запуск из события крысы:
 *   Plugin Command: RatCatch start
 *
 * Управление: мышь / сенсор. Enter не нужен.
 * После успешной ловли:
 *   переменная 11 увеличивается на 1
 *   Self Switch A вызывающего события включается
 *
 * Важно:
 * Плагин НЕ использует ImageManager.loadCharacter("$RatRun"),
 * поэтому знак $ в имени файла не нужен.
 */

(function() {
    "use strict";

    var RatCatch = {
        eventId: 0,
        mapId: 0
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);

        if (String(command).toLowerCase() !== "ratcatch") return;

        var sub = args && args.length ? String(args[0]).toLowerCase() : "";
        if (sub === "start") {
            RatCatch.eventId = this._eventId;
            RatCatch.mapId = $gameMap.mapId();
            SceneManager.push(Scene_RatCatch);
        }
    };

    function Scene_RatCatch() {
        this.initialize.apply(this, arguments);
    }

    Scene_RatCatch.prototype = Object.create(Scene_Base.prototype);
    Scene_RatCatch.prototype.constructor = Scene_RatCatch;

    Scene_RatCatch.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);

        this._ratBitmap = null;
        this._ratSprite = null;

        this._arena = null;
        this._vx = 0;
        this._vy = 0;

        this._frame = 0;
        this._frameTick = 0;
        this._time = 0;

        this._caught = false;
        this._messageTimer = 0;

        this._caughtCount = Number($gameVariables.value(11) || 0);
    };

    Scene_RatCatch.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        this.createBackground();
        this.createUi();
        this.loadRat();
    };

    Scene_RatCatch.prototype.createBackground = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        this._bg = new Sprite(new Bitmap(w, h));
        this._bg.bitmap.fillRect(0, 0, w, h, "#17120d");
        this._bg.bitmap.fillRect(35, 70, w - 70, h - 120, "#302418");
        this.addChild(this._bg);

        this._arena = {
            x: 55,
            y: 105,
            w: w - 110,
            h: h - 180
        };

        var border = new Bitmap(w, h);
        border.fillRect(this._arena.x, this._arena.y, this._arena.w, 3, "#e4c77a");
        border.fillRect(
            this._arena.x,
            this._arena.y + this._arena.h - 3,
            this._arena.w,
            3,
            "#e4c77a"
        );
        border.fillRect(this._arena.x, this._arena.y, 3, this._arena.h, "#e4c77a");
        border.fillRect(
            this._arena.x + this._arena.w - 3,
            this._arena.y,
            3,
            this._arena.h,
            "#e4c77a"
        );

        this.addChild(new Sprite(border));
    };

    Scene_RatCatch.prototype.createUi = function() {
        var w = Graphics.boxWidth;

        this._title = new Sprite(new Bitmap(w, 48));
        this._title.bitmap.fontSize = 28;
        this._title.bitmap.textColor = "#f5d56a";
        this._title.bitmap.drawText(
            "ПОЙМАТЬ КРЫСУ",
            0, 4, w, 36, "center"
        );
        this.addChild(this._title);

        this._hint = new Sprite(new Bitmap(w, 38));
        this._hint.bitmap.fontSize = 18;
        this._hint.bitmap.textColor = "#ffffff";
        this._hint.bitmap.drawText(
            "Тапни по крысе, когда она окажется под пальцем!",
            0, 0, w, 32, "center"
        );
        this.addChild(this._hint);

        this._counter = new Sprite(new Bitmap(w, 42));
        this.addChild(this._counter);

        this._message = new Sprite(new Bitmap(w, 50));
        this.addChild(this._message);

        this.updateCounter();
    };

    Scene_RatCatch.prototype.updateCounter = function() {
        this._counter.bitmap.clear();
        this._counter.bitmap.fontSize = 22;
        this._counter.bitmap.textColor = "#f5d56a";
        this._counter.bitmap.drawText(
            "ПОЙМАНО: " + this._caughtCount + " / 3",
            0, 3, Graphics.boxWidth, 34, "center"
        );
    };

    Scene_RatCatch.prototype.loadRat = function() {
        // ВАЖНО: без "$".
        this._ratBitmap = ImageManager.loadNormalBitmap(
            "img/characters/RatRun.png",
            0
        );

        this._ratSprite = new Sprite(this._ratBitmap);

        this._ratSprite.anchor.x = 0.5;
        this._ratSprite.anchor.y = 0.5;

        // Увеличиваем крысу, чтобы на телефоне её было легко поймать.
        this._ratSprite.scale.x = 1.55;
        this._ratSprite.scale.y = 1.55;

        this.addChild(this._ratSprite);

        this._ratBitmap.addLoadListener(function() {
            this.resetRat();
            this.updateRatFrame();
        }.bind(this));
    };

    Scene_RatCatch.prototype.resetRat = function() {
        var r = this._arena;

        this._ratSprite.x =
            r.x + 70 + Math.random() * Math.max(1, r.w - 140);

        this._ratSprite.y =
            r.y + 70 + Math.random() * Math.max(1, r.h - 140);

        var angle = Math.random() * Math.PI * 2;
        var speed = 1.15 + Math.random() * 1.1;

        this._vx = Math.cos(angle) * speed;
        this._vy = Math.sin(angle) * speed;

        this._time = 0;
    };

    Scene_RatCatch.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (!this._ratBitmap || !this._ratBitmap.isReady()) return;
        if (this._caught) return;

        this._time++;
        this._frameTick++;

        this.updateRatMovement();
        this.updateRatAnimation();
        this.updateTouch();
        this.updateMessage();

        // Через 30 секунд крыса меняет позицию.
        if (this._time >= 1800) {
            this.showMessage("Крыса убежала!");
            this.resetRat();
        }
    };

    Scene_RatCatch.prototype.updateRatMovement = function() {
        var r = this._arena;

        var x = this._ratSprite.x + this._vx;
        var y = this._ratSprite.y + this._vy;

        // Иногда крыса слегка меняет направление.
        if (Math.random() < 0.012) {
            var angle =
                Math.atan2(this._vy, this._vx) +
                (Math.random() - 0.5) * 1.4;

            var speed = 1.15 + Math.random() * 1.1;

            this._vx = Math.cos(angle) * speed;
            this._vy = Math.sin(angle) * speed;
        }

        var margin = 42;

        var minX = r.x + margin;
        var maxX = r.x + r.w - margin;
        var minY = r.y + margin;
        var maxY = r.y + r.h - margin;

        if (x < minX || x > maxX) {
            this._vx *= -1;
            x = Math.max(minX, Math.min(maxX, x));
        }

        if (y < minY || y > maxY) {
            this._vy *= -1;
            y = Math.max(minY, Math.min(maxY, y));
        }

        this._ratSprite.x = x;
        this._ratSprite.y = y;
    };

    Scene_RatCatch.prototype.updateRatAnimation = function() {
        if (this._frameTick < 10) return;

        this._frameTick = 0;
        this._frame = (this._frame + 1) % 3;

        this.updateRatFrame();
    };

    Scene_RatCatch.prototype.updateRatFrame = function() {
        if (!this._ratSprite || !this._ratBitmap) return;

        var row;

        if (Math.abs(this._vx) >= Math.abs(this._vy)) {
            row = this._vx < 0 ? 1 : 2;
        } else {
            row = this._vy < 0 ? 3 : 0;
        }

        // RatRun.png = 3 x 4 кадров, каждый 48x48.
        this._ratSprite.setFrame(
            this._frame * 48,
            row * 48,
            48,
            48
        );
    };

    Scene_RatCatch.prototype.updateTouch = function() {
        if (!TouchInput.isTriggered()) return;

        var dx = TouchInput.x - this._ratSprite.x;
        var dy = TouchInput.y - this._ratSprite.y;

        // Большая зона попадания для сенсора.
        if (dx * dx + dy * dy <= 52 * 52) {
            this.catchRat();
        } else {
            this.showMessage("Промах!");
        }
    };

    Scene_RatCatch.prototype.catchRat = function() {
        this._caught = true;

        this._caughtCount =
            Number($gameVariables.value(11) || 0) + 1;

        $gameVariables.setValue(11, this._caughtCount);

        this.updateCounter();

        if (this._caughtCount >= 3) {
            this.showMessage("Все крысы пойманы!");
        } else {
            this.showMessage("Поймал! Отлично!");
        }

        // Включаем Self Switch A у конкретной крысы.
        if (RatCatch.mapId === $gameMap.mapId() &&
            RatCatch.eventId > 0) {

            $gameSelfSwitches.setValue(
                [$gameMap.mapId(), RatCatch.eventId, "A"],
                true
            );
        }

        // Без Enter: возвращаемся на карту автоматически.
        setTimeout(function() {
            SceneManager.pop();
        }, 700);
    };

    Scene_RatCatch.prototype.showMessage = function(text) {
        this._messageTimer = 45;

        this._message.bitmap.clear();
        this._message.bitmap.fontSize = 25;
        this._message.bitmap.textColor = "#ffffff";

        this._message.bitmap.drawText(
            text,
            0,
            3,
            Graphics.boxWidth,
            42,
            "center"
        );
    };

    Scene_RatCatch.prototype.updateMessage = function() {
        if (this._messageTimer <= 0) return;

        this._messageTimer--;

        if (this._messageTimer === 0) {
            this._message.bitmap.clear();
        }
    };

    window.Scene_RatCatch = Scene_RatCatch;

})();
