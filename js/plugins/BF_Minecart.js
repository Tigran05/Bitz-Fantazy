/*:
 * @plugindesc Bitz Fantasy — Вагонетка через пещеры: ускорение, торможение, прыжки и камнепад. ПК + браузер + мобильные.
 * @author ACTPOJIuT
 *
 * Plugin Command:
 *   BF_Minecart start
 *
 * ПК:
 *   ↑ — ускорение
 *   ↓ — торможение
 *   SPACE / ENTER — прыжок
 *   ESC — выход
 *
 * Телефон:
 *   ТОРМОЗ / УСКОРЕНИЕ — удержание
 *   ПРЫЖОК — нажатие
 *
 * Механика камнепада:
 *   1) сверху появляется пыль/тень — предупреждение;
 *   2) камень отмечает место падения;
 *   3) через короткую задержку камень падает;
 *   4) игрок может затормозить, чтобы камень упал впереди,
 *      либо ускориться и проскочить до падения;
 *   5) крупные валуны требуют правильного выбора скорости;
 *   6) разрывы рельсов требуют прыжка.
 */

(function() {
    'use strict';

    var pluginName = 'BF_Minecart';

    function questGame() {
        return window.BF_QuestSystem && typeof window.BF_QuestSystem.game === 'function'
            ? window.BF_QuestSystem.game() : null;
    }

    function startQuestContext() {
        var q = questGame();
        if (q && typeof q.minigameStart === 'function') {
            q.minigameStart(pluginName, 'iron_cliff');
        }
    }

    function finishQuest(scene) {
        var q = questGame();
        if (q && typeof q.minigameResult === 'function') {
            q.minigameResult('SUCCESS');
        }

        if (scene && scene._sourceMapId && scene._sourceEventId &&
            window.$gameSelfSwitches) {
            $gameSelfSwitches.setValue(
                [scene._sourceMapId, scene._sourceEventId, 'A'], true
            );
        }

        // EV006, страница 2: после успешной поездки сразу переносим
        // игрока в Мир 1 на координаты 31,30.
        // Явно возвращаемся в Scene_Map, чтобы reserveTransfer гарантированно
        // обработался после закрытия мини-игры.
        if (window.$gamePlayer) {
            $gamePlayer.reserveTransfer(1, 31, 30, 2, 0);
        }

        if (window.Scene_Map && window.SceneManager) {
            SceneManager.goto(Scene_Map);
        }
    }

    function cancelQuest() {
        var q = questGame();
        if (q && typeof q.minigameResult === 'function') {
            q.minigameResult('CANCEL');
        }
    }

    function Scene_BFMinecart() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFMinecart.prototype = Object.create(Scene_Base.prototype);
    Scene_BFMinecart.prototype.constructor = Scene_BFMinecart;

    Scene_BFMinecart.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);

        this._sourceMapId = 0;
        this._sourceEventId = 0;

        this._distance = 0;
        this._finishDistance = 20000;

        this._speed = 5.0;
        this._targetSpeed = 5.0;
        this._minSpeed = 2.0;
        this._maxSpeed = 9.2;

        this._cartY = 0;
        this._cartVY = 0;
        this._jumping = false;
        this._jumpLock = false;

        this._hits = 3;
        this._rocks = [];
        this._gaps = [];
        this._dust = [];
        this._warningTimer = 0;

        // Трасса строится готовыми секциями: камни и ямы больше не
        // генерируются независимо и не могут случайно появиться по обе
        // стороны одной ямы.
        this._segments = [];
        this._segmentIndex = 0;
        this._segmentProgress = 0;
        this._section = 0;
        this._segmentDistance = 0;
        this.buildTrack();
        this._finished = false;

        this._control = 0;
        this._touch = { brake:false, boost:false, jump:false };
        this._touchDevice = false;

        this._message = 'Слушайте камнепад: пыль сверху предупреждает о падении.';
        this._messageTimer = 220;
        this._cameraShake = 0;
        this._rockPulse = 0;
    };

    Scene_BFMinecart.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        this._sourceMapId = Scene_BFMinecart._sourceMapId || 0;
        this._sourceEventId = Scene_BFMinecart._sourceEventId || 0;
        Scene_BFMinecart._sourceMapId = 0;
        Scene_BFMinecart._sourceEventId = 0;

        // Настоящие графические слои шахты вместо примитивов Canvas.
        this._background = new Sprite(ImageManager.loadPicture('BF_Minecart_BG'));
        this._background.x = 0;
        this._background.y = 0;
        this.addChild(this._background);

        this._background2 = new Sprite(ImageManager.loadPicture('BF_Minecart_BG'));
        this._background2.x = 1632;
        this._background2.y = 0;
        this.addChild(this._background2);

        this._world = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.addChild(this._world);

        this._cartSprite = new Sprite(ImageManager.loadPicture('BF_Minecart_Cart'));
        this._cartSprite.anchor.x = 0;
        this._cartSprite.anchor.y = 0;
        this.addChild(this._cartSprite);

        this._foreground = new Sprite(ImageManager.loadPicture('BF_Minecart_FG'));
        this._foreground.x = 0;
        this._foreground.y = 0;
        this.addChild(this._foreground);

        this._foreground2 = new Sprite(ImageManager.loadPicture('BF_Minecart_FG'));
        this._foreground2.x = 1632;
        this._foreground2.y = 0;
        this.addChild(this._foreground2);

        this._ui = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.addChild(this._ui);

        this._touchDevice = ('ontouchstart' in window) ||
            (navigator && navigator.maxTouchPoints > 0);

        this.drawAll();
        startQuestContext();
    };

    Scene_BFMinecart.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (this._finished) return;

        this.processTouch();
        this.updateControls();
        this.updatePhysics();
        this.updateObjects();
        this.checkCollisions();
        if (this._cameraShake > 0) {
            this._cameraShake *= 0.82;
            if (this._cameraShake < 0.25) this._cameraShake = 0;
        }
        this._rockPulse += 0.12;
        this.drawAll();

        if (this._distance >= this._finishDistance) {
            this.success();
        }
    };

    Scene_BFMinecart.prototype.updateControls = function() {
        var accelerate = Input.isPressed('up') || this._touch.boost;
        var brake = Input.isPressed('down') || this._touch.brake;

        this._control = accelerate ? 1 : (brake ? -1 : 0);

        if (accelerate) {
            this._targetSpeed = Math.min(this._maxSpeed, this._targetSpeed + 0.075);
            this._message = 'УСКОРЕНИЕ — можно проскочить опасную зону';
            this._messageTimer = 6;
        } else if (brake) {
            this._targetSpeed = Math.max(this._minSpeed, this._targetSpeed - 0.14);
            this._message = 'ТОРМОЖЕНИЕ — камень скоро упадёт';
            this._messageTimer = 6;
        } else {
            this._targetSpeed += (5.0 - this._targetSpeed) * 0.008;
        }

        this._speed += (this._targetSpeed - this._speed) * 0.09;

        if ((Input.isTriggered('ok') || this._touch.jump) && !this._jumpLock) {
            this.jump();
            this._jumpLock = true;
        }

        if (!Input.isPressed('ok') && !this._touch.jump) {
            this._jumpLock = false;
        }

        if (Input.isTriggered('cancel')) {
            cancelQuest();
            SceneManager.pop();
        }

        this._touch.jump = false;
    };

    Scene_BFMinecart.prototype.jump = function() {
        if (!this._jumping) {
            this._jumping = true;
            // Скорость влияет на дальность: ускорение полезно для длинных разрывов.
            this._cartVY = -14.2 - Math.max(0, this._speed - 5) * 0.8;
            SoundManager.playCursor();
        }
    };

    Scene_BFMinecart.prototype.updatePhysics = function() {
        if (this._jumping) {
            this._cartY += this._cartVY;
            this._cartVY += 0.72;

            if (this._cartY >= 0) {
                this._cartY = 0;
                this._cartVY = 0;
                this._jumping = false;
            }
        }

        this._distance += this._speed;
        this._segmentDistance -= this._speed;

        if (this._segmentDistance <= 0) {
            this.startNextSegment();
        }
    };

    Scene_BFMinecart.prototype.buildTrack = function() {
        // Типы:
        // safe      — спокойный участок
        // rocks     — камнепад
        // gap       — одна яма
        // rock_gap  — камень перед ямой: нужно ускориться и прыгнуть
        // gap_rocks — яма, затем камни после приземления
        // big_rocks — большой камнепад
        this._segments = [
            {type:'safe',       length:1100},
            {type:'rocks',     length:1350},
            {type:'safe',      length:700},
            {type:'gap',       length:1150, gapAt:720, gapWidth:150},
            {type:'safe',       length:850},
            {type:'rock_gap',  length:1500, rockAt:560, gapAt:910, gapWidth:185},
            {type:'safe',      length:800},
            {type:'big_rocks', length:1500},
            {type:'safe',      length:750},
            {type:'gap_rocks', length:1650, gapAt:620, gapWidth:175, rockAt:1020},
            {type:'safe',      length:850},
            {type:'rock_gap',  length:1750, rockAt:650, gapAt:1060, gapWidth:205},
            {type:'big_rocks', length:1700},
            {type:'gap',       length:1250, gapAt:780, gapWidth:215},
            {type:'rocks',     length:1500},
            {type:'rock_gap',  length:1900, rockAt:700, gapAt:1150, gapWidth:220},
            {type:'big_rocks', length:1800}
        ];

        this._finishDistance = 0;
        for (var i = 0; i < this._segments.length; i++) {
            this._finishDistance += this._segments[i].length;
        }
    };

    Scene_BFMinecart.prototype.startNextSegment = function() {
        if (this._segmentIndex >= this._segments.length) {
            return;
        }

        var seg = this._segments[this._segmentIndex++];
        this._segmentProgress = 0;
        this._segmentDistance = seg.length;
        this._section = Math.floor(this._segmentIndex / 4);

        this._rocks = [];
        this._gaps = [];

        this.spawnSegmentObjects(seg);
    };

    Scene_BFMinecart.prototype.spawnSegmentObjects = function(seg) {
        var startX = Graphics.boxWidth + 120;

        if (seg.type === 'rocks') {
            this.spawnRockWave(startX, 3, 220);
            this.spawnRockWave(startX + 620, 2, 260);
            this._message = 'КАМНЕПАД! Следите за тенями сверху.';
            this._messageTimer = 110;
        }

        if (seg.type === 'big_rocks') {
            this.spawnBigRockWave(startX, 2, 340);
            this.spawnBigRockWave(startX + 760, 2, 420);
            this._message = 'БОЛЬШОЙ ОБВАЛ! Управляйте скоростью.';
            this._messageTimer = 120;
        }

        if (seg.type === 'gap') {
            this.addGapAtDistance(startX, seg.gapAt, seg.gapWidth);
            this._message = 'РАЗРЫВ РЕЛЬСОВ — РАЗГОН И ПРЫЖОК!';
            this._messageTimer = 120;
        }

        if (seg.type === 'rock_gap') {
            // ВАЖНО: камни находятся только ПЕРЕД ямой.
            // Никаких камней с другой стороны ямы.
            this.spawnRockWave(startX + seg.rockAt, 2, 230);
            this.addGapAtDistance(startX, seg.gapAt, seg.gapWidth);
            this._message = 'КАМНИ → РАЗГОН → ПРЫЖОК ЧЕРЕЗ ЯМУ!';
            this._messageTimer = 150;
        }

        if (seg.type === 'gap_rocks') {
            // Яма сначала, камни только ПОСЛЕ приземления.
            this.addGapAtDistance(startX, seg.gapAt, seg.gapWidth);
            this.spawnRockWave(startX + seg.rockAt, 3, 250);
            this._message = 'ПРЫЖОК ЧЕРЕЗ ЯМУ — ПОСЛЕ НЕЁ КАМНЕПАД!';
            this._messageTimer = 150;
        }
    };

    Scene_BFMinecart.prototype.spawnRockWave = function(x, count, spacing) {
        for (var i = 0; i < count; i++) {
            this._rocks.push({
                state: 'warning',
                x: x + i * spacing,
                y: 105,
                size: 22 + Math.random() * 18,
                timer: 55 + i * 16 + Math.random() * 20,
                fall: 5.5 + Math.random() * 2.5,
                big: false
            });
        }
    };

    Scene_BFMinecart.prototype.spawnBigRockWave = function(x, count, spacing) {
        for (var i = 0; i < count; i++) {
            this._rocks.push({
                state: 'warning',
                x: x + i * spacing,
                y: 100,
                size: 43 + Math.random() * 15,
                timer: 75 + i * 24 + Math.random() * 25,
                fall: 4.0 + Math.random() * 1.5,
                big: true
            });
        }
    };

    Scene_BFMinecart.prototype.addGapAtDistance = function(startX, distance, width) {
        this._gaps.push({
            x: startX + distance,
            width: width,
            warning: true
        });
    };

    Scene_BFMinecart.prototype.updateObjects = function() {
        for (var i = this._rocks.length - 1; i >= 0; i--) {
            var r = this._rocks[i];

            if (r.state === 'warning') {
                r.x -= this._speed;
                r.timer -= 1;

                if (r.timer <= 0) {
                    r.state = 'falling';
                    r.targetY = Graphics.boxHeight - 330;
                    r.y = 105;
                    r.shadow = true;
                }
            } else {
                r.x -= this._speed;
                r.y += r.fall;
            }

            if (r.x < -120 || r.y > Graphics.boxHeight - 150) {
                this._rocks.splice(i, 1);
            }
        }

        for (var g = this._gaps.length - 1; g >= 0; g--) {
            this._gaps[g].x -= this._speed;
            // Яма не исчезает, пока не прошла вагонетку.
            // Это важно: если игрок прыгает над ямой, она остаётся под ним
            // до момента безопасного приземления.
            var cartXForGap = Graphics.boxWidth * 0.23;
            if (this._gaps[g].x + this._gaps[g].width < cartXForGap - 90) {
                this._gaps.splice(g, 1);
            }
        }

        for (var d = this._dust.length - 1; d >= 0; d--) {
            this._dust[d].x -= this._speed * 0.6;
            this._dust[d].life -= 1;
            if (this._dust[d].life <= 0) this._dust.splice(d, 1);
        }
    };

    Scene_BFMinecart.prototype.checkCollisions = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        var cartX = w * 0.23;
        var cartW = 120;
        var groundY = h - 225;
        var cartCenterY = groundY + this._cartY - 50;

        // Камни: маленькие можно перепрыгнуть.
        for (var i = this._rocks.length - 1; i >= 0; i--) {
            var r = this._rocks[i];

            if (r.state !== 'falling') continue;

            var vertical = Math.abs(r.y - cartCenterY);
            var horizontal = Math.abs(r.x - (cartX + cartW * 0.5));

            if (horizontal < r.size + 48 && vertical < r.size + 42) {
                // Большой валун при высокой скорости особенно опасен.
                this.hit(r.big);
                this._rocks.splice(i, 1);
                return;
            }
        }

        // Разрыв рельсов.
        // В прыжке яма не должна наносить урон, пока вагонетка действительно
        // находится над ней. Но как только игрок опускается к уровню рельсов,
        // попадание фиксируется. Раньше проверка полностью отключалась на
        // время прыжка — из-за этого можно было упасть в яму без потери жизни.
        var wheelX = cartX + cartW * 0.52;
        var landingClearance = -this._cartY;
        var lowEnoughToHit = !this._jumping || landingClearance < 34;

        if (lowEnoughToHit) {
            for (var g = 0; g < this._gaps.length; g++) {
                var gap = this._gaps[g];
                var wheelInside = wheelX > gap.x && wheelX < gap.x + gap.width;

                if (wheelInside) {
                    this.hit(false, true);
                    this._gaps.splice(g, 1);
                    return;
                }
            }
        }
    };

    Scene_BFMinecart.prototype.hit = function(bigRock, gap) {
        this._hits--;
        this._cameraShake = bigRock ? 10 : 6;

        if (gap) {
            this._message = 'ВАГОНЕТКА ПОПАЛА В РАЗРЫВ!';
        } else if (bigRock) {
            this._message = 'БОЛЬШОЙ ВАЛУН! Нужно было выбрать скорость!';
        } else {
            this._message = 'КАМЕНЬ УДАРИЛ ВАГОНЕТКУ!';
        }

        this._targetSpeed = Math.max(this._minSpeed, this._targetSpeed - 1.8);
        this._speed = this._targetSpeed;
        this._messageTimer = 100;

        if (this._hits <= 0) {
            // Не полный рестарт: возвращаемся к началу текущего участка.
            this._hits = 3;
            // Перезапускаем текущую секцию с её правильной комбинацией препятствий.
            var current = Math.max(0, this._segmentIndex - 1);
            this._distance = Math.max(0, this._distance - 1400);
            this._segmentIndex = current;
            this._segmentDistance = 0;
            this._rocks = [];
            this._gaps = [];
            this._message = 'ВАГОНЕТКА ОСТАНОВИЛАСЬ! Этот участок начнём заново.';
            this._messageTimer = 140;
        }

        SoundManager.playBuzzer();
    };

    Scene_BFMinecart.prototype.drawAll = function() {
        this.drawBackground();
        this.drawWorld();
        this.drawUI();
    };

    Scene_BFMinecart.prototype.drawBackground = function() {
        // Два экземпляра каждого слоя идут встык. Поэтому при переходе
        // через край текстуры нет скачка на следующий цикл параллакса.
        var width = 1632;

        var bgOffset = (this._distance * 0.16) % width;
        var fgOffset = (this._distance * 0.34) % width;

        this._background.x = -bgOffset;
        this._background2.x = width - bgOffset;

        this._foreground.x = -fgOffset;
        this._foreground2.x = width - fgOffset;
    };

    Scene_BFMinecart.prototype.drawWorld = function() {
        var b = this._world.bitmap;
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        b.clear();

        var groundY = h - 225;
        var railY = groundY + 122;
        var cartX = w * 0.23;

        // Шахтная земля.
        b.fillRect(0, groundY, w, 190, '#29231e');
        b.fillRect(0, groundY + 10, w, 18, '#403229');
        b.fillRect(0, groundY + 30, w, 120, '#211d1a');

        // Каменные полосы на поверхности.
        for (var sx = -20; sx < w + 60; sx += 120) {
            var ox = ((sx - this._distance * 0.35) % 120);
            b.fillRect(ox, groundY + 38, 74, 9, '#342d28');
            b.fillRect(ox + 30, groundY + 61, 48, 7, '#3d332c');
            b.fillRect(ox + 10, groundY + 95, 92, 8, '#302722');
        }

        // Провал под рельсами.
        for (var g = 0; g < this._gaps.length; g++) {
            var gap = this._gaps[g];
            b.fillRect(gap.x - 10, groundY - 8, gap.width + 20, 190, '#05080a');
            b.fillRect(gap.x - 20, groundY + 18, gap.width + 40, 12, '#10171b');

            // Края породы.
            b.fillRect(gap.x - 8, groundY - 12, 8, 45, '#5d4938');
            b.fillRect(gap.x + gap.width, groundY - 12, 8, 45, '#5d4938');

            // Яркая линия разлома — яму должно быть видно ещё издалека.
            b.fillRect(gap.x - 18, groundY - 6, gap.width + 36, 5, '#b36a2d');
            b.fillRect(gap.x - 13, groundY - 15, 5, 12, '#d58b38');
            b.fillRect(gap.x + gap.width + 8, groundY - 15, 5, 12, '#d58b38');

            // Предупреждающие фонари.
            b.fillRect(gap.x - 3, groundY - 40, 7, 28, '#8b4d24');
            b.fillRect(gap.x + gap.width - 4, groundY - 40, 7, 28, '#8b4d24');
            b.fillRect(gap.x - 9, groundY - 45, 19, 9, '#e09a38');
            b.fillRect(gap.x + gap.width - 10, groundY - 45, 19, 9, '#e09a38');
        }

        // Рельсы поверх земли.
        b.fillRect(0, railY, w, 8, '#d0c6b4');
        b.fillRect(0, railY + 45, w, 8, '#b2a795');

        for (var x = -20; x < w + 50; x += 48) {
            var rx = ((x - this._distance * 0.75) % 48);
            b.fillRect(rx, railY - 2, 8, 57, '#705f4d');
            b.fillRect(rx + 2, railY, 4, 51, '#9a8368');
        }

        // Повторно прорезаем ямы поверх рельсов и шпал.
        // Поэтому визуально рельсы действительно обрываются в пустоту.
        for (var gg = 0; gg < this._gaps.length; gg++) {
            var hole = this._gaps[gg];
            b.fillRect(hole.x - 10, groundY - 8,
                       hole.width + 20, 190, '#05080a');
            b.fillRect(hole.x - 14, railY - 8,
                       hole.width + 28, 68, '#05080a');

            b.fillRect(hole.x - 9, groundY - 13, 9, 48, '#5d4938');
            b.fillRect(hole.x + hole.width, groundY - 13, 9, 48, '#5d4938');

            // Нижняя глубина пропасти.
            b.fillRect(hole.x + 10, groundY + 75,
                       Math.max(1, hole.width - 20), 95, '#030506');
            b.fillRect(hole.x + 25, groundY + 130,
                       Math.max(1, hole.width - 50), 18, '#11171a');
        }

        // Падающие камни и предупреждения.
        for (var i = 0; i < this._rocks.length; i++) {
            var r = this._rocks[i];

            if (r.state === 'warning') {
                // Светлая пыль и тень точно над местом падения.
                b.fillRect(r.x - r.size, railY - 5, r.size * 2, 9, '#8d6c4f');
                b.fillRect(r.x - r.size * 0.55, railY - 17, r.size * 1.1, 5, '#b08a62');
                b.fillRect(r.x - 20, 116, 40, 6, '#5b6664');
                b.fillRect(r.x - 10, 122, 20, 8, '#78817c');

                // Камень висит в трещине потолка.
                b.fillRect(r.x - r.size * 0.55, 85, r.size * 1.1, 24, '#4a4945');
                b.fillRect(r.x - r.size * 0.32, 78, r.size * 0.64, 13, '#68635a');
            } else {
                var rockColor = r.big ? '#514b45' : '#716960';
                b.fillRect(r.x - r.size, r.y - r.size * 0.65,
                           r.size * 2, r.size * 1.3, rockColor);
                b.fillRect(r.x - r.size * 0.62, r.y - r.size * 0.72,
                           r.size * 0.9, r.size * 0.35, '#9b8e7d');
                b.fillRect(r.x + r.size * 0.1, r.y,
                           r.size * 0.45, r.size * 0.28, '#3c3835');
                if (r.y > h - 355) {
                    var dust = 1 + Math.sin(this._rockPulse + i) * 0.25;
                    b.fillRect(r.x - r.size * dust, h - 285, 9, 6, '#76695b');
                    b.fillRect(r.x + r.size * 0.55, h - 292, 6, 5, '#8b7a67');
                }
            }
        }

        // Вагонетка — отдельный PNG-спрайт с нормальной детализацией.
        var cartY = groundY + this._cartY;
        var cartX = w * 0.23;
        var shakeX = this._cameraShake ? (Math.random() - 0.5) * this._cameraShake : 0;
        var shakeY = this._cameraShake ? (Math.random() - 0.5) * this._cameraShake * 0.45 : 0;
        this._cartSprite.x = cartX - 45 + shakeX;
        this._cartSprite.y = cartY - 127 + shakeY;

        var desiredAngle = this._jumping
            ? Math.max(-0.12, Math.min(0.12, this._cartVY * 0.006))
            : 0;
        this._cartSprite.rotation +=
            (desiredAngle - this._cartSprite.rotation) * 0.18;
    };

    Scene_BFMinecart.prototype.drawUI = function() {
        var b = this._ui.bitmap;
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        b.clear();

        b.fillRect(0, 0, w, 58, '#090c10');
        b.fillRect(0, 58, w, 3, '#6f4a2f');

        b.font = '22px Arial';
        b.textColor = '#ffffff';
        b.drawText('ВАГОНЕТКА', 22, 13, 170, 30, 'left');

        b.font = '18px Arial';
        var percent = Math.min(100, Math.floor(
            this._distance / this._finishDistance * 100
        ));
        b.drawText('ПУТЬ ' + percent + '%', 205, 15, 130, 27, 'left');

        b.font = '21px Arial';
        b.drawText('♥ ' + this._hits, w - 92, 14, 70, 28, 'right');

        var barX = 345;
        var barW = Math.max(150, w - 470);
        var ratio = (this._speed - this._minSpeed) /
            (this._maxSpeed - this._minSpeed);

        b.fillRect(barX, 21, barW, 8, '#30363b');
        b.fillRect(
            barX, 21, barW * Math.max(0, Math.min(1, ratio)), 8, '#c06c32'
        );

        b.font = '14px Arial';
        b.drawText('СКОРОСТЬ', barX, 35, 90, 18, 'left');
        b.drawText(
            Math.round(this._speed * 10) / 10 + 'x',
            barX + barW - 40, 35, 40, 18, 'right'
        );

        if (this._messageTimer > 0) {
            var msgW = Math.min(520, w - 40);
            var msgX = (w - msgW) / 2;
            b.fillRect(msgX, 70, msgW, 34, '#171c20');
            b.fillRect(msgX, 70, 4, 34, '#d58b38');
            b.font = '16px Arial';
            b.textColor = '#f2eadc';
            b.drawText(this._message, msgX + 14, 77, msgW - 24, 20, 'center');
        }

        if (this._touchDevice) {
            this.drawTouchControls(b, w, h);
        }
    };

    Scene_BFMinecart.prototype.drawTouchControls = function(b, w, h) {
        var y = h - 92;

        b.fillRect(20, y, 180, 68, '#15171b');
        b.fillRect(220, y, 190, 68, '#15171b');
        b.fillRect(w - 205, y - 15, 185, 83, '#15171b');

        b.font = '19px Arial';
        b.textColor = '#ffffff';

        b.drawText('◀ ТОРМОЗ', 20, y + 22, 180, 28, 'center');
        b.drawText('⚡ УСКОРЕНИЕ', 220, y + 22, 190, 28, 'center');

        b.font = '21px Arial';
        b.drawText('⬆ ПРЫЖОК', w - 205, y + 23, 185, 30, 'center');
    };

    Scene_BFMinecart.prototype.touchButtonAt = function(x, y) {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;
        var by = h - 92;

        if (y >= by && y <= h - 15) {
            if (x >= 20 && x < 200) return 'brake';
            if (x >= 220 && x < 410) return 'boost';
            if (x >= w - 205 && x <= w - 10) return 'jump';
        }

        return null;
    };

    Scene_BFMinecart.prototype.processTouch = function() {
        if (!TouchInput.isPressed() && !TouchInput.isTriggered()) {
            this._touch.brake = false;
            this._touch.boost = false;
            return;
        }

        var button = this.touchButtonAt(TouchInput.x, TouchInput.y);

        if (button === 'brake') {
            this._touch.brake = true;
            this._touch.boost = false;
        } else if (button === 'boost') {
            this._touch.boost = true;
            this._touch.brake = false;
        } else if (button === 'jump' && TouchInput.isTriggered()) {
            this._touch.jump = true;
        }
    };

    Scene_BFMinecart.prototype.success = function() {
        if (this._finished) return;

        this._finished = true;
        this._message = 'ПЕЩЕРЫ ПРОЙДЕНЫ! ЖЕЛЕЗНЫЙ УТЁС ВПЕРЕДИ.';
        SoundManager.playOk();
        this.drawAll();

        var scene = this;

        setTimeout(function() {
            finishQuest(scene);
            SceneManager.pop();
        }, 1000);
    };

    window.Scene_BFMinecart = Scene_BFMinecart;

    window.BF_Minecart_start = function() {
        Scene_BFMinecart._sourceMapId = $gameMap.mapId();
        Scene_BFMinecart._sourceEventId =
            (this && this._eventId) ? this._eventId : 0;

        SceneManager.push(Scene_BFMinecart);
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);

        if (String(command || '').toUpperCase() === 'BF_MINECART' &&
            String(args && args[0] || '').toLowerCase() === 'start') {
            window.BF_Minecart_start.call(this);
        }
    };

})();
