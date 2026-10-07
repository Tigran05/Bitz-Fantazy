/*:
 * @plugindesc Bitz Fantasy — камеры и охрана для стелс-участков
 * @author ASTROLIT GAMES
 *
 * @param Return Map
 * @type number
 * @default 29
 *
 * @param Return X
 * @type number
 * @default 20
 *
 * @param Return Y
 * @type number
 * @default 34
 *
 * @param Alert SE
 * @default Buzzer1
 *
 * @help
 * BF_CameraSecurity
 *
 * КАМЕРА:
 * <BF_CAMERA range=6 angle=0 sweep=45 speed=30>
 *
 * ОХРАННИК:
 * <BF_GUARD range=5 fov=60 speed=3 patrol=4 dir=horizontal>
 *
 * ВАЖНО: для камеры/охранника используется обычная картинка события
 * RPG Maker MV из поля «Изображение». Плагин сам двигает это событие.
 *
 * Камера имеет настоящий сектор обзора и показывает его на карте.
 * Охранник двигается автоматически по патрулю, если указан BF_GUARD.
 *
 * Направления для камеры: 0 = вправо, 90 = вниз, 180 = влево, 270 = вверх.
 * sweep = половина диапазона поворота камеры.
 * patrol = радиус патруля в клетках от стартовой точки.
 * dir = horizontal или vertical.
 *
 * Камеры и охранники работают на любой карте, где на событии есть соответствующий тег.
 * Привязки к квесту или конкретному этажу нет.
 * При обнаружении: тревога -> красная вспышка -> возврат на Map029 X20 Y34.
 *
 * Плагин не изменяет BF_QuestSystem и не меняет шаг квеста.
 */
(function() {
    'use strict';

    var pluginName = 'BF_CameraSecurity';
    var params = PluginManager.parameters(pluginName);
    var RETURN_MAP = Number(params['Return Map'] || 29);
    var RETURN_X = Number(params['Return X'] || 20);
    var RETURN_Y = Number(params['Return Y'] || 34);
    var ALERT_SE = String(params['Alert SE'] || 'Buzzer1');

    function num(v, fallback) {
        var n = Number(v);
        return isFinite(n) ? n : fallback;
    }

    function parseTag(note, tag) {
        var re = new RegExp('<' + tag + '(?:\\s+([^>]+))?>', 'i');
        var m = String(note || '').match(re);
        if (!m) return null;
        var attrs = {};
        var raw = m[1] || '';
        raw.replace(/([a-z]+)\s*=\s*(-?\d+(?:\.\d+)?)/gi, function(_, key, value) {
            attrs[key.toLowerCase()] = Number(value);
            return _;
        });
        raw.replace(/([a-z]+)\s*=\s*([a-z_-]+)/gi, function(_, key, value) {
            attrs[key.toLowerCase()] = String(value).toLowerCase();
            return _;
        });
        return attrs;
    }

    function securityEnabled() {
        return true;
    }

    function normalizeAngle(a) {
        a %= 360;
        if (a < 0) a += 360;
        return a;
    }

    function angleDiff(a, b) {
        var d = Math.abs(normalizeAngle(a) - normalizeAngle(b));
        return Math.min(d, 360 - d);
    }

    function eventFacingAngle(event) {
        switch (event.direction()) {
            case 2: return 90;
            case 4: return 180;
            case 6: return 0;
            case 8: return 270;
            default: return 90;
        }
    }

    // Переключаем обычный спрайт события между 4 направлениями,
    // чтобы камера визуально поворачивалась вместе с сектором обзора.
    function setSpriteDirectionFromAngle(event, angleDeg) {
        var a = normalizeAngle(angleDeg);
        var dir;
        if (a >= 45 && a < 135) dir = 2;      // вниз
        else if (a >= 135 && a < 225) dir = 4; // влево
        else if (a >= 225 && a < 315) dir = 8; // вверх
        else dir = 6;                         // вправо
        if (event.direction() !== dir) event.setDirection(dir);
    }

    function hasClearLine(event, range, centerAngle, fov) {
        var dx = $gamePlayer.x - event.x;
        var dy = $gamePlayer.y - event.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 0 || distance > range) return false;

        var targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        targetAngle = normalizeAngle(targetAngle);
        if (angleDiff(targetAngle, centerAngle) > fov / 2) return false;

        // Проверяем клетки между наблюдателем и игроком.
        var steps = Math.max(1, Math.ceil(distance * 4));
        for (var i = 1; i < steps; i++) {
            var t = i / steps;
            var x = event.x + dx * t;
            var y = event.y + dy * t;
            var tx = Math.round(x);
            var ty = Math.round(y);
            if (tx === $gamePlayer.x && ty === $gamePlayer.y) break;
            if (!$gameMap.isPassable(tx, ty, 2) &&
                !$gameMap.isPassable(tx, ty, 4) &&
                !$gameMap.isPassable(tx, ty, 6) &&
                !$gameMap.isPassable(tx, ty, 8)) {
                return false;
            }
        }
        return true;
    }

    function triggerDetection() {
        if ($gameTemp && $gameTemp._bfSecurityDetected) return;
        if ($gameTemp) $gameTemp._bfSecurityDetected = true;

        AudioManager.playSe({name: ALERT_SE, volume: 100, pitch: 100, pan: 0});
        if ($gameScreen && $gameScreen.startFlash) {
            $gameScreen.startFlash([255, 0, 0, 180], 24);
        }

        // Небольшая задержка, чтобы игрок увидел тревогу.
        setTimeout(function() {
            if ($gameTemp) $gameTemp._bfSecurityReturn = true;
        }, 450);
    }

    function performSecurityReturn() {
        if (!$gamePlayer || !$gamePlayer.reserveTransfer) return;
        if ($gameTemp) $gameTemp._bfSecurityReturning = true;
        $gameScreen.startFadeOut(12);
        $gamePlayer.reserveTransfer(RETURN_MAP, RETURN_X, RETURN_Y, 2, 0);
        if ($gamePlayer.clearTransferInfo) {
            // Ничего не очищаем: стандартный MV должен выполнить transfer.
        }
    }

    // Надёжный возврат после обнаружения. Ждём именно фактической загрузки Map029.
    var _SceneMap_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _SceneMap_update.call(this);

        if ($gameTemp && $gameTemp._bfSecurityReturn && !$gameTemp._bfSecurityReturning) {
            $gameTemp._bfSecurityReturn = false;
            performSecurityReturn();
            return;
        }

        if ($gameTemp && $gameTemp._bfSecurityReturning) {
            if ($gameMap && $gameMap.mapId() === RETURN_MAP &&
                $gamePlayer.x === RETURN_X && $gamePlayer.y === RETURN_Y &&
                !$gamePlayer.isTransferring()) {
                $gameScreen.startFadeIn(12);
                $gameTemp._bfSecurityReturning = false;
                $gameTemp._bfSecurityDetected = false;
            }
        }
    };

    // ------------------------------
    // Камера: визуальный сектор
    // ------------------------------
    function SecurityOverlay(event) {
        this.initialize(event);
    }

    SecurityOverlay.prototype = Object.create(Sprite.prototype);
    SecurityOverlay.prototype.constructor = SecurityOverlay;

    SecurityOverlay.prototype.initialize = function(event) {
        Sprite.prototype.initialize.call(this);
        this._event = event;
        this._graphics = new PIXI.Graphics();
        this.addChild(this._graphics);
        this.z = 999;
    };

    SecurityOverlay.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!this._event) return;

        var config = this._event._bfCamera || this._event._bfGuard;
        if (!config) return;

        var isCamera = !!this._event._bfCamera;
        var tw = $gameMap.tileWidth();
        var th = $gameMap.tileHeight();
        var sx = $gameMap.adjustX(this._event.x) * tw + tw / 2;
        var sy = $gameMap.adjustY(this._event.y) * th + th / 2;
        var angleDeg = isCamera ? config.currentAngle : config.angle;
        var angle = normalizeAngle(angleDeg) * Math.PI / 180;
        var fov = isCamera ? 26 : config.fov;
        var radius = config.range * Math.min(tw, th);
        var half = (fov * Math.PI / 180) / 2;

        this.position.set(sx, sy);
        this.visible = securityEnabled();
        this._graphics.clear();
        if (!this.visible) return;

        // Большой полупрозрачный сектор.
        var fill = isCamera ? 0xff2020 : 0xffa500;
        this._graphics.beginFill(fill, 0.22);
        this._graphics.lineStyle(2, fill, 0.70);
        this._graphics.moveTo(0, 0);
        this._graphics.arc(0, 0, radius, angle - half, angle + half);
        this._graphics.lineTo(0, 0);
        this._graphics.endFill();

        // Граница дальности — круг.
        this._graphics.lineStyle(2, fill, 0.35);
        this._graphics.drawCircle(0, 0, radius);

        // Центральный луч — чтобы было сразу видно, куда смотрит.
        this._graphics.lineStyle(4, 0xffffff, 0.75);
        this._graphics.moveTo(0, 0);
        this._graphics.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);

        // Центральную точку специально не рисуем: саму камеру/охранника
        // игрок задаёт обычной картинкой события RPG Maker MV.
    };

    function addOverlaySpriteset(spriteset) {
        if (spriteset._bfSecurityOverlays) return;
        spriteset._bfSecurityOverlays = [];
        if (!spriteset._characterSprites) return;

        for (var i = 0; i < spriteset._characterSprites.length; i++) {
            var cs = spriteset._characterSprites[i];
            var ch = cs && cs._character;
            if (ch && (ch._bfCamera || ch._bfGuard)) {
                var overlay = new SecurityOverlay(ch);
                // Над картой, но независимо от z у картинки события.
                spriteset.addChild(overlay);
                spriteset._bfSecurityOverlays.push(overlay);
            }
        }
    }

    var _SpritesetMap_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _SpritesetMap_createCharacters.call(this);
        addOverlaySpriteset(this);
    };

    var _SpritesetMap_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _SpritesetMap_update.call(this);
        if (!this._bfSecurityOverlays) return;
        for (var i = 0; i < this._bfSecurityOverlays.length; i++) {
            this._bfSecurityOverlays[i].update();
        }
    };

    // ------------------------------
    // События камеры и охраны
    // ------------------------------
    var _GameEvent_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _GameEvent_setupPage.call(this);

        // Runtime-only state: keep camera/guard data out of RPG Maker MV saves.
        // JsonEx serializes enumerable Game_Event properties; these values are
        // rebuilt automatically whenever the event page is set up.
        if (Object.prototype.hasOwnProperty.call(this, '_bfCamera')) {
            delete this._bfCamera;
        }
        if (Object.prototype.hasOwnProperty.call(this, '_bfGuard')) {
            delete this._bfGuard;
        }
        Object.defineProperty(this, '_bfCamera', { value: null, writable: true, configurable: true, enumerable: false });
        Object.defineProperty(this, '_bfGuard', { value: null, writable: true, configurable: true, enumerable: false });

        var note = this.event() && this.event().note ? this.event().note : '';
        var camera = parseTag(note, 'BF_CAMERA');
        var guard = parseTag(note, 'BF_GUARD');

        if (camera) {
            var baseAngle = normalizeAngle(num(camera.angle, 0));
            this._bfCamera = {
                range: Math.max(1, num(camera.range, 6)),
                baseAngle: baseAngle,
                sweep: Math.max(0, num(camera.sweep, 45)),
                speed: num(camera.speed, 30),
                currentAngle: baseAngle,
                direction: 1
            };
            setSpriteDirectionFromAngle(this, baseAngle);
            this.setDirectionFix(false);
        }

        if (guard) {
            var startX = this.x;
            var startY = this.y;
            this._bfGuard = {
                range: Math.max(1, num(guard.range, 5)),
                fov: Math.max(1, Math.min(180, num(guard.fov, 60))),
                angle: eventFacingAngle(this),
                speed: Math.max(1, Math.min(6, num(guard.speed, 3))),
                patrol: Math.max(0, num(guard.patrol, 4)),
                dir: String(guard.dir || 'horizontal').toLowerCase(),
                startX: startX,
                startY: startY,
                patrolDirection: 1,
                moveTimer: 0,
                initialized: false
            };
            this.setMoveSpeed(this._bfGuard.speed);
            this.setMoveFrequency(3);
            this.setDirectionFix(false);
        }
    };

    function updateGuardPatrol(event) {
        var g = event._bfGuard;
        if (!g || g.patrol <= 0 || $gameMap.isEventRunning()) return;
        if (event.isMoving()) return;

        // Движение раз в несколько кадров, чтобы персонаж реально был виден в пути.
        g.moveTimer++;
        if (g.moveTimer < 18) return;
        g.moveTimer = 0;

        if (g.dir === 'vertical') {
            var nextY = event.y + g.patrolDirection;
            if (nextY < g.startY - g.patrol || nextY > g.startY + g.patrol ||
                !$gameMap.isPassable(event.x, nextY, g.patrolDirection > 0 ? 2 : 8)) {
                g.patrolDirection *= -1;
                nextY = event.y + g.patrolDirection;
            }
            if (nextY >= 0 && nextY < $gameMap.height()) {
                event.moveStraight(g.patrolDirection > 0 ? 2 : 8);
            }
        } else {
            var nextX = event.x + g.patrolDirection;
            if (nextX < g.startX - g.patrol || nextX > g.startX + g.patrol ||
                !$gameMap.isPassable(nextX, event.y, g.patrolDirection > 0 ? 6 : 4)) {
                g.patrolDirection *= -1;
            }
            event.moveStraight(g.patrolDirection > 0 ? 6 : 4);
        }
    }

    var _GameEvent_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _GameEvent_update.call(this);
        if (!securityEnabled() || $gameMap.isEventRunning()) return;

        if (this._bfCamera) {
            var c = this._bfCamera;
            var delta = c.speed / 60;
            var offset = normalizeAngle(c.currentAngle - c.baseAngle);
            if (offset > 180) offset -= 360;
            if (Math.abs(offset) >= c.sweep) c.direction *= -1;
            c.currentAngle = c.baseAngle + offset + delta * c.direction;
            setSpriteDirectionFromAngle(this, c.currentAngle);
            if (hasClearLine(this, c.range, c.currentAngle, 26)) {
                triggerDetection();
                return;
            }
        }

        if (this._bfGuard) {
            updateGuardPatrol(this);
            this._bfGuard.angle = eventFacingAngle(this);
            if (hasClearLine(this, this._bfGuard.range, this._bfGuard.angle, this._bfGuard.fov)) {
                triggerDetection();
            }
        }
    };

    // Не теряем флаг возврата между созданием новых Game_Temp в стандартных сценах.
    var _GameTemp_initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function() {
        _GameTemp_initialize.call(this);
        this._bfSecurityDetected = false;
        this._bfSecurityReturn = false;
        this._bfSecurityReturning = false;
    };

})();
