/*:
 * @plugindesc Вращающиеся лазеры для стелс-участка Bitz Fantasy.
 * @author ACTPOJIuT / OpenAI
 *
 * @param Return Map ID
 * @type number
 * @min 1
 * @default 29
 * @desc Карта, куда игрока возвращает тревога.
 *
 * @param Return X
 * @type number
 * @min 0
 * @default 20
 * @desc X точки возврата.
 *
 * @param Return Y
 * @type number
 * @min 0
 * @default 34
 * @desc Y точки возврата.
 *
 * @param Fade Delay
 * @type number
 * @min 0
 * @default 30
 * @desc Количество кадров до переноса после срабатывания (60 кадров = 1 секунда).
 *
 * @param Default Length
 * @type number
 * @decimals 2
 * @min 0.5
 * @default 7
 * @desc Длина луча в клетках, если она не указана в теге события.
 *
 * @param Default Speed
 * @type number
 * @decimals 2
 * @default 60
 * @desc Скорость вращения в градусах в секунду.
 *
 * @param Default Width
 * @type number
 * @min 1
 * @default 5
 * @desc Толщина луча в пикселях.
 *
 * @param Hit Radius
 * @type number
 * @decimals 2
 * @min 0.05
 * @default 0.22
 * @desc Радиус обнаружения игрока вокруг линии луча, в клетках.
 *
 * @param Color
 * @type number
 * @min 0
 * @default 16724787
 * @desc Цвет луча в десятичном формате PIXI. По умолчанию красный.
 *
 * @help
 * BF_LaserSecurity.js
 *
 * Вращающиеся лазерные лучи. Плагин не меняет BF_QuestSystem.
 *
 * На событие-излучатель добавьте в поле «Примечание»:
 *
 * <BF_LASER length=7 speed=60 angle=0>
 *
 * Параметры:
 *   length — длина луча в клетках;
 *   speed  — скорость вращения, градусов в секунду;
 *   angle  — начальный угол в градусах (0 = вправо, 90 = вниз);
 *   width  — толщина в пикселях (необязательно);
 *   hit    — радиус обнаружения в клетках (необязательно).
 *
 * Примеры:
 *   <BF_LASER length=7 speed=60 angle=0>
 *   <BF_LASER length=6 speed=-45 angle=90 width=6>
 *   <BF_LASER length=8 speed=35 angle=180 hit=0.25>
 *
 * Можно поставить несколько событий с BF_LASER на одной карте.
 * Луч рисуется поверх карты, но ниже окон интерфейса.
 * При пересечении луча игроком происходит тревога: красная вспышка,
 * звук ошибки и возврат на Return Map ID / Return X / Return Y.
 *
 * Плагин не требует картинок.
 *
 * Для первой проверки рекомендуется один лазер.
 */
(function() {
    'use strict';

    var pluginName = 'BF_LaserSecurity';
    var params = PluginManager.parameters(pluginName);

    var RETURN_MAP_ID = Number(params['Return Map ID'] || 29);
    var RETURN_X = 20;
    var RETURN_Y = 34;
    var FADE_DELAY = Math.max(0, Number(params['Fade Delay'] || 30));
    var DEFAULT_LENGTH = Math.max(0.5, Number(params['Default Length'] || 7));
    var DEFAULT_SPEED = Number(params['Default Speed'] || 60);
    var DEFAULT_WIDTH = Math.max(1, Number(params['Default Width'] || 5));
    var HIT_RADIUS = Math.max(0.05, Number(params['Hit Radius'] || 0.22));
    var DEFAULT_COLOR = Number(params['Color'] || 16724787);

    function clampNumber(value, fallback) {
        var n = Number(value);
        return isFinite(n) ? n : fallback;
    }

    function parseLaserNote(note) {
        if (!note) return null;

        var m = note.match(/<BF_LASER\s*([^>]*)>/i);
        if (!m) return null;

        var options = {};
        var body = m[1] || '';
        var re = /([a-z]+)\s*[=:]\s*(-?\d+(?:\.\d+)?)/ig;
        var match;
        while ((match = re.exec(body))) {
            options[match[1].toLowerCase()] = Number(match[2]);
        }

        return {
            length: Math.max(0.5, clampNumber(options.length, DEFAULT_LENGTH)),
            speed: clampNumber(options.speed, DEFAULT_SPEED),
            angle: clampNumber(options.angle, 0),
            width: Math.max(1, clampNumber(options.width, DEFAULT_WIDTH)),
            hit: Math.max(0.05, clampNumber(options.hit, HIT_RADIUS)),
            color: Math.max(0, Math.floor(clampNumber(options.color, DEFAULT_COLOR)))
        };
    }

    function distancePointToSegment(px, py, ax, ay, bx, by) {
        var dx = bx - ax;
        var dy = by - ay;
        var lenSq = dx * dx + dy * dy;

        if (lenSq <= 0.000001) {
            dx = px - ax;
            dy = py - ay;
            return Math.sqrt(dx * dx + dy * dy);
        }

        var t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        var cx = ax + t * dx;
        var cy = ay + t * dy;
        var ddx = px - cx;
        var ddy = py - cy;
        return Math.sqrt(ddx * ddx + ddy * ddy);
    }

    function LaserRuntime(event, config) {
        this.event = event;
        this.config = config;
        this.angle = config.angle;
        this.graphics = new PIXI.Graphics();
        this.hitCooldown = 0;
    }

    LaserRuntime.prototype.update = function() {
        if (!this.event) return;

        this.angle += this.config.speed / 60;
        while (this.angle >= 360) this.angle -= 360;
        while (this.angle < 0) this.angle += 360;

        if (this.hitCooldown > 0) this.hitCooldown--;

        this.draw();
    };

    LaserRuntime.prototype.draw = function() {
        if (!this.graphics) return;

        var tileWidth = $gameMap.tileWidth();
        var tileHeight = $gameMap.tileHeight();
        var ox = this.event.screenX();
        var oy = this.event.screenY() - tileHeight / 2;
        var radians = this.angle * Math.PI / 180;
        var endX = ox + Math.cos(radians) * this.config.length * tileWidth;
        var endY = oy + Math.sin(radians) * this.config.length * tileHeight;

        this.graphics.clear();
        this.graphics.lineStyle(this.config.width, this.config.color, 0.95);
        this.graphics.moveTo(ox, oy);
        this.graphics.lineTo(endX, endY);

        // Маленький яркий источник в основании.
        this.graphics.beginFill(0xffffff, 1);
        this.graphics.drawCircle(ox, oy, Math.max(3, this.config.width));
        this.graphics.endFill();
    };

    LaserRuntime.prototype.playerHit = function() {
        if (!$gamePlayer || this.hitCooldown > 0) return false;
        if ($gamePlayer.isTransparent()) return false;
        if ($gameMap.isEventRunning()) return false;

        var px = $gamePlayer.x + 0.5;
        var py = $gamePlayer.y + 0.55;
        var ax = this.event.x + 0.5;
        var ay = this.event.y + 0.5;
        var radians = this.angle * Math.PI / 180;
        var bx = ax + Math.cos(radians) * this.config.length;
        var by = ay + Math.sin(radians) * this.config.length;

        return distancePointToSegment(px, py, ax, ay, bx, by) <= this.config.hit;
    };

    LaserRuntime.prototype.destroy = function() {
        if (this.graphics && this.graphics.parent) {
            this.graphics.parent.removeChild(this.graphics);
        }
        if (this.graphics) this.graphics.destroy();
        this.graphics = null;
    };

    // -------------------------------------------------------------------------
    // Game_Map: поиск лазеров на текущей карте
    // -------------------------------------------------------------------------

    // LaserRuntime содержит PIXI.Graphics и ссылки на Game_Event.
    // Это чисто runtime-состояние и его НЕЛЬЗЯ отдавать RPG Maker MV JsonEx
    // на сохранение: JsonEx начинает обходить PIXI-объект и ломает save.
    function setLaserRuntimeList(gameMap, list) {
        if (Object.prototype.hasOwnProperty.call(gameMap, '_bfLaserSecurity')) {
            try { delete gameMap._bfLaserSecurity; } catch (e) {}
        }
        Object.defineProperty(gameMap, '_bfLaserSecurity', {
            value: list || [],
            writable: true,
            configurable: true,
            enumerable: false
        });
    }

    function buildLaserRuntimeList(gameMap) {
        var list = [];
        var events = gameMap.events ? gameMap.events() : [];
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (!event) continue;

            var config = parseLaserNote(event.event().note || '');
            if (!config) continue;

            list.push(new LaserRuntime(event, config));
        }
        return list;
    }

    function normalizeLaserRuntimeList(gameMap) {
        var desc = Object.getOwnPropertyDescriptor(gameMap, '_bfLaserSecurity');

        // Старые сохранения могли содержать enumerable-версию этого поля.
        // Сбрасываем её и создаём заново как runtime-only.
        if (!desc || desc.enumerable || !Array.isArray(gameMap._bfLaserSecurity)) {
            var oldList = gameMap._bfLaserSecurity;
            if (Array.isArray(oldList)) {
                for (var i = 0; i < oldList.length; i++) {
                    if (oldList[i] && oldList[i].destroy) oldList[i].destroy();
                }
            }
            setLaserRuntimeList(gameMap, buildLaserRuntimeList(gameMap));
        }

        return gameMap._bfLaserSecurity;
    }

    var _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        // Старый runtime (если карта переоткрывается) больше не нужен.
        var oldList = this._bfLaserSecurity;
        if (Array.isArray(oldList)) {
            for (var i = 0; i < oldList.length; i++) {
                if (oldList[i] && oldList[i].destroy) oldList[i].destroy();
            }
        }

        _Game_Map_setup.call(this, mapId);
        setLaserRuntimeList(this, buildLaserRuntimeList(this));
    };

    Game_Map.prototype.bfLaserSecurityList = function() {
        return normalizeLaserRuntimeList(this);
    };

    // -------------------------------------------------------------------------
    // Spriteset_Map: отображение лучей
    // -------------------------------------------------------------------------

    var _Spriteset_Map_createTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        _Spriteset_Map_createTilemap.call(this);
        this._bfLaserContainer = new Sprite();
        this._tilemap.addChild(this._bfLaserContainer);
        this._bfLaserContainer.z = 8;

        var lasers = $gameMap.bfLaserSecurityList();
        for (var i = 0; i < lasers.length; i++) {
            this._bfLaserContainer.addChild(lasers[i].graphics);
        }
    };

    var _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);

        var lasers = $gameMap.bfLaserSecurityList();
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].update();
        }
    };

    var _Spriteset_Map_destroy = Spriteset_Map.prototype.destroy;
    Spriteset_Map.prototype.destroy = function(options) {
        var lasers = $gameMap.bfLaserSecurityList();
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].destroy();
        }
        this._bfLaserContainer = null;
        _Spriteset_Map_destroy.call(this, options);
    };

    // -------------------------------------------------------------------------
    // Game_Player: проверка пересечения с лучами
    // -------------------------------------------------------------------------

    var _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);

        if (this._bfLaserAlarm || !$gameMap || !$gameMap.bfLaserSecurityList) return;
        if ($gameMap.isEventRunning()) return;

        var lasers = $gameMap.bfLaserSecurityList();
        for (var i = 0; i < lasers.length; i++) {
            if (lasers[i].playerHit()) {
                triggerAlarm();
                break;
            }
        }
    };

    function triggerAlarm() {
        if (!$gamePlayer || $gamePlayer._bfLaserAlarm) return;

        $gamePlayer._bfLaserAlarm = true;
        Input.clear();
        TouchInput.clear();

        if (SoundManager && SoundManager.playBuzzer) {
            SoundManager.playBuzzer();
        }

        if ($gameScreen) {
            $gameScreen.startFlash([255, 0, 0, 160], 18);
            $gameScreen.startFadeOut(FADE_DELAY);
        }

        // Перенос делаем штатным reserveTransfer.
        // Затем после фактического переноса performTransfer() запускает fade-in,
        // чтобы экран гарантированно не оставался чёрным.
        var lasers = $gameMap.bfLaserSecurityList();
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].hitCooldown = 999999;
        }

        $gamePlayer.reserveTransfer(RETURN_MAP_ID, RETURN_X, RETURN_Y, 2, 0);
    }

    // На случай, если после загрузки карты игрок всё ещё имеет флаг тревоги.
    var _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        var wasLaserAlarm = !!this._bfLaserAlarm;
        _Game_Player_performTransfer.call(this);
        if (wasLaserAlarm && $gameScreen) {
            $gameScreen.startFadeIn(18);
        }
        this._bfLaserAlarm = false;
    };
})();
