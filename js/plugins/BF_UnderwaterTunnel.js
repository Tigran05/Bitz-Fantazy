/*:
 * @plugindesc Bitz Fantasy — затопленный туннель: аркадная мини-игра в стиле Flappy Bird
 * @author ACTPOJIuT / OpenAI
 *
 * @help
 * Команда:
 *   BF_UnderwaterTunnel start
 *
 * Управление:
 *   Space / Enter / ЛКМ / тап — всплыть
 *   Esc — выйти без успеха
 *
 * Механика:
 *   Персонаж постоянно движется вправо.
 *   Нажатие даёт импульс вверх, без нажатий персонаж опускается.
 *   Препятствия движутся справа налево. Проходы чередуются сверху/снизу.
 *   Есть течение, запас воздуха и 3 столкновения.
 *
 * При достижении выхода:
 *   BF_QuestSystem.game().minigameResult('SUCCESS')
 *
 * Графика полностью рисуется через Bitmap, внешние ресурсы не требуются.
 */

(function() {
    'use strict';

    var pluginName = 'BF_UnderwaterTunnel';

    function Scene_BFUnderwaterTunnel() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFUnderwaterTunnel.prototype = Object.create(Scene_Base.prototype);
    Scene_BFUnderwaterTunnel.prototype.constructor = Scene_BFUnderwaterTunnel;

    Scene_BFUnderwaterTunnel.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);

        this._bitmap = null;
        this._sprite = null;

        this._player = null;
        this._obstacles = [];
        this._particles = [];
        this._ambientFish = [];

        this._started = false;
        this._finished = false;
        this._gameOver = false;

        this._distance = 0;
        this._targetDistance = 5200;

        this._air = 100;
        this._hits = 0;
        this._maxHits = 3;

        this._gravity = 0.34;
        this._flapPower = -6.8;
        this._maxFallSpeed = 7.2;
        this._scrollSpeed = 4.1;

        this._obstacleTimer = 0;
        this._obstacleGap = 145;
        this._obstacleWidth = 92;

        this._currentTimer = 0;
        this._currentType = 0;
        this._currentPower = 0;

        this._message = '';
        this._messageTimer = 0;

        this._exitRect = null;
        this._restartRect = null;
    };

    Scene_BFUnderwaterTunnel.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        if (!window.BF_QuestSystem ||
            !BF_QuestSystem.game() ||
            !BF_QuestSystem.game().minigameStart('BF_UnderwaterTunnel', 'vermillion')) {
            SceneManager.pop();
            return;
        }

        this._started = true;

        this._createCanvas();
        this._loadSpriteAssets();
        this._createLayout();
        this._createPlayer();
        this._createParticles();
        this._showMessage(this._t('Плывите через затопленный туннель', 'Swim through the flooded tunnel'), 100);
        this._redraw();
    };

    Scene_BFUnderwaterTunnel.prototype._language = function() {
        // ASTROLIT_Language stores the selected language in ConfigManager.bfLanguage.
        if (window.ConfigManager && ConfigManager.bfLanguage) return String(ConfigManager.bfLanguage).toLowerCase();
        if (window.BF_Language && BF_Language.currentLanguage) return String(BF_Language.currentLanguage).toLowerCase();
        return 'ru';
    };

    Scene_BFUnderwaterTunnel.prototype._t = function(ru, en) {
        var lang = this._language();
        return (lang === 'en' || lang.indexOf('english') >= 0) ? en : ru;
    };

    Scene_BFUnderwaterTunnel.prototype._loadSpriteAssets = function() {
        this._assets = {
            backdrop: ImageManager.loadPicture('underwater_tunnel/ruins_backdrop_tile'),
            diver1: ImageManager.loadPicture('underwater_tunnel/diver_frame_01'),
            diver2: ImageManager.loadPicture('underwater_tunnel/diver_frame_02'),
            diver3: ImageManager.loadPicture('underwater_tunnel/diver_frame_03'),
            diver4: ImageManager.loadPicture('underwater_tunnel/diver_frame_04'),
            diver5: ImageManager.loadPicture('underwater_tunnel/diver_frame_05'),
            stalactite: ImageManager.loadPicture('underwater_tunnel/stalactite_large'),
            stalactite2: ImageManager.loadPicture('underwater_tunnel/stalactite_short'),
            stalactite3: ImageManager.loadPicture('underwater_tunnel/stalactite_mossy'),
            stalactite4: ImageManager.loadPicture('underwater_tunnel/stalactite_long'),
            stalagmite: ImageManager.loadPicture('underwater_tunnel/stalagmite_large'),
            stalagmite2: ImageManager.loadPicture('underwater_tunnel/stalagmite_short'),
            stalagmite3: ImageManager.loadPicture('underwater_tunnel/stalagmite_mossy'),
            bubble: ImageManager.loadPicture('underwater_tunnel/bubble'),
            fishBlue: ImageManager.loadPicture('underwater_tunnel/fish_blue_1'),
            fishBlueMirror: ImageManager.loadPicture('underwater_tunnel/fish_blue_1_mirror'),
            fishRed: ImageManager.loadPicture('underwater_tunnel/fish_red_1'),
            fishRedMirror: ImageManager.loadPicture('underwater_tunnel/fish_red_1_mirror'),
            fishDeep: ImageManager.loadPicture('underwater_tunnel/fish_deep_1'),
            fishDeepMirror: ImageManager.loadPicture('underwater_tunnel/fish_deep_1_mirror'),
            angler: ImageManager.loadPicture('underwater_tunnel/angler_1'),
            anglerMirror: ImageManager.loadPicture('underwater_tunnel/angler_1_mirror'),
            coralPink: ImageManager.loadPicture('underwater_tunnel/coral_pink'),
            coralGreen: ImageManager.loadPicture('underwater_tunnel/coral_green'),
            ruinArch: ImageManager.loadPicture('underwater_tunnel/ruin_arch'),
            ruinRubble: ImageManager.loadPicture('underwater_tunnel/ruin_rubble'),
            rockTile: ImageManager.loadPicture('underwater_tunnel/rock_wall_tile'),
            columnShaft: ImageManager.loadPicture('underwater_tunnel/column_shaft_tile'),
        };
    };

    Scene_BFUnderwaterTunnel.prototype._drawParallaxBackdrop = function(bitmap) {
        var img = this._assets && this._assets.backdrop;
        var area = this._play;
        if (!img || !img.isReady() || !img.width || !img.height) {
            bitmap.fillRect(area.x, area.y, area.width, area.height, '#082b40');
            bitmap.gradientFillRect(area.x, area.y, area.width, area.height,
                'rgba(20,100,130,0.45)', 'rgba(1,10,20,0.8)', true);
            return;
        }

        // Keep the original image proportions; never stretch the panorama into a square.
        var scale = area.height / img.height;
        var tileWidth = img.width * scale;
        // Background moves at 20% of the obstacle speed. The tile's edges are crossfaded.
        var offset = (this._distance * 0.08) % tileWidth;
        var tileX = area.x - offset;
        var rightBound = area.x + area.width;

        while (tileX < rightBound) {
            var clipLeft = Math.max(area.x, tileX);
            var clipRight = Math.min(rightBound, tileX + tileWidth);
            if (clipRight > clipLeft) {
                var sx = (clipLeft - tileX) / scale;
                var sw = (clipRight - clipLeft) / scale;
                sx = Math.max(0, Math.min(img.width - 1, sx));
                sw = Math.max(1, Math.min(img.width - sx, sw));
                bitmap.blt(img, sx, 0, sw, img.height,
                    clipLeft, area.y, clipRight - clipLeft, area.height);
            }
            tileX += tileWidth;
        }
    };

    Scene_BFUnderwaterTunnel.prototype._bltAsset = function(name, x, y, width, height) {
        var img = this._assets && this._assets[name];
        if (!img || !img.isReady() || !img.width || !img.height) return false;
        this._bitmap.blt(img, 0, 0, img.width, img.height,
            Math.round(x), Math.round(y), Math.round(width), Math.round(height));
        return true;
    };

    Scene_BFUnderwaterTunnel.prototype._createCanvas = function() {
        this._bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._sprite = new Sprite(this._bitmap);
        this.addChild(this._sprite);
    };

    Scene_BFUnderwaterTunnel.prototype._createLayout = function() {
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        this._play = {
            x: 28,
            y: 100,
            width: w - 56,
            height: h - 145
        };

        this._exitRect = {
            x: w - 132,
            y: 18,
            width: 102,
            height: 38
        };

        this._restartRect = {
            x: w / 2 - 82,
            y: h / 2 + 58,
            width: 164,
            height: 44
        };
    };

    Scene_BFUnderwaterTunnel.prototype._createPlayer = function() {
        this._player = {
            x: this._play.x + 150,
            y: this._play.y + this._play.height / 2,
            width: 34,
            height: 24,
            vy: 0
        };
    };

    Scene_BFUnderwaterTunnel.prototype._createParticles = function() {
        var w = this._play.width;
        var h = this._play.height;

        for (var i = 0; i < 34; i++) {
            this._particles.push({
                x: this._play.x + Math.random() * w,
                y: this._play.y + Math.random() * h,
                speed: 0.5 + Math.random() * 1.4,
                size: 2 + Math.random() * 3
            });
        }

        // Ambient fish are real moving objects, not modulo-positioned decorations.
        // They leave the viewport before being respawned at the opposite off-screen edge.
        this._ambientFish = [];
        var specs = [
            { left: 'fishBlueMirror', right: 'fishBlue', width: 48, height: 29, lane: 0.24, speed: 0.68, dir: -1 },
            { left: 'fishRed', right: 'fishRedMirror', width: 49, height: 31, lane: 0.43, speed: 0.90, dir: 1 },
            { left: 'fishDeep', right: 'fishDeepMirror', width: 62, height: 39, lane: 0.61, speed: 0.52, dir: -1 },
            { left: 'anglerMirror', right: 'angler', width: 72, height: 48, lane: 0.78, speed: 0.43, dir: 1 }
        ];
        for (var f = 0; f < specs.length; f++) {
            var spec = specs[f];
            this._ambientFish.push({
                leftAsset: spec.left,
                rightAsset: spec.right,
                width: spec.width,
                height: spec.height,
                lane: spec.lane,
                x: this._play.x + w * (f + 0.65) / specs.length,
                y: this._play.y + h * spec.lane,
                speed: spec.speed,
                dir: spec.dir
            });
        }
    };

    Scene_BFUnderwaterTunnel.prototype._resetGame = function() {
        this._obstacles = [];
        this._distance = 0;
        this._air = 100;
        this._hits = 0;
        this._obstacleTimer = 35;
        this._currentTimer = 0;
        this._currentType = 0;
        this._currentPower = 0;
        this._finished = false;
        this._gameOver = false;

        this._player.x = this._play.x + 150;
        this._player.y = this._play.y + this._play.height / 2;
        this._player.vy = 0;
        for (var fi = 0; fi < this._ambientFish.length; fi++) {
            var af = this._ambientFish[fi];
            af.x = this._play.x + this._play.width * (fi + 0.65) / Math.max(1, this._ambientFish.length);
            af.y = this._play.y + this._play.height * af.lane;
        }

        this._showMessage(this._t('Плывите!', 'Swim!'), 45);
        this._redraw();
    };

    Scene_BFUnderwaterTunnel.prototype._flap = function() {
        if (this._finished) {
            return;
        }

        if (this._gameOver) {
            if (this._inside(TouchInput.x, TouchInput.y, this._restartRect)) {
                this._resetGame();
            }
            return;
        }

        this._player.vy = this._flapPower;
        SoundManager.playCursor();
    };

    Scene_BFUnderwaterTunnel.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (!this._started) {
            return;
        }

        this._updateInput();

        if (this._finished) {
            return;
        }

        if (this._gameOver) {
            this._updateParticles();
            this._redraw();
            return;
        }

        this._updateParticles();
        this._updatePhysics();
        this._updateObstacles();
        this._updateAir();
        // Течение уже обновляется внутри _updatePhysics().
        // Отдельный вызов _updateCurrent() отсутствует и вызывал TypeError.
        this._checkBounds();
        this._checkCollisions();
        this._updateMessage();
        this._redraw();
    };

    Scene_BFUnderwaterTunnel.prototype._updateInput = function() {
        if (Input.isTriggered('cancel')) {
            this._closeWithoutSuccess();
            return;
        }

        if (Input.isTriggered('ok') || Input.isTriggered('shift')) {
            this._flap();
        }

        if (TouchInput.isTriggered()) {
            if (this._inside(TouchInput.x, TouchInput.y, this._exitRect)) {
                this._closeWithoutSuccess();
                return;
            }

            this._flap();
        }
    };

    Scene_BFUnderwaterTunnel.prototype._updatePhysics = function() {
        this._player.vy += this._gravity;
        this._player.vy += this._currentPower;
        this._player.vy = Math.max(-9, Math.min(this._maxFallSpeed, this._player.vy));

        this._player.y += this._player.vy;
        this._distance += this._scrollSpeed;

        if (this._currentTimer > 0) {
            this._currentTimer--;
        } else {
            this._chooseCurrent();
        }
    };

    Scene_BFUnderwaterTunnel.prototype._chooseCurrent = function() {
        var roll = Math.random();

        if (roll < 0.18) {
            this._currentType = Math.random() < 0.5 ? -1 : 1;
            this._currentPower = this._currentType * 0.055;
            this._currentTimer = 100 + Math.floor(Math.random() * 80);

            this._showMessage(
                this._currentType < 0 ? this._t('Течение тянет вниз', 'Current pulls down') : this._t('Течение поднимает', 'Current lifts you'),
                55
            );
        } else {
            this._currentType = 0;
            this._currentPower = 0;
            this._currentTimer = 140 + Math.floor(Math.random() * 120);
        }
    };

    Scene_BFUnderwaterTunnel.prototype._updateObstacles = function() {
        this._obstacleTimer--;

        if (this._obstacleTimer <= 0) {
            this._spawnObstaclePair();
            this._obstacleTimer = 95 + Math.floor(Math.random() * 22);
        }

        for (var i = this._obstacles.length - 1; i >= 0; i--) {
            var obstacle = this._obstacles[i];
            obstacle.x -= this._scrollSpeed;

            if (obstacle.x + obstacle.width < this._play.x - 30) {
                this._obstacles.splice(i, 1);
            }
        }
    };

    Scene_BFUnderwaterTunnel.prototype._spawnObstaclePair = function() {
        var top = this._play.y;
        var bottom = this._play.y + this._play.height;

        var minGapTop = top + 55;
        var maxGapTop = bottom - this._obstacleGap - 55;

        var gapTop = minGapTop + Math.random() * Math.max(1, maxGapTop - minGapTop);

        this._obstacles.push({
            x: this._play.x + this._play.width + 20,
            y: top,
            width: this._obstacleWidth,
            height: gapTop - top,
            side: 'top'
        });

        this._obstacles.push({
            x: this._play.x + this._play.width + 20,
            y: gapTop + this._obstacleGap,
            width: this._obstacleWidth,
            height: bottom - (gapTop + this._obstacleGap),
            side: 'bottom'
        });
    };

    Scene_BFUnderwaterTunnel.prototype._updateAir = function() {
        this._air -= 0.018;

        if (this._air <= 0) {
            this._air = 0;
            this._lose(this._t('Воздух закончился.', 'Out of air.'));
        }
    };

    Scene_BFUnderwaterTunnel.prototype._updateParticles = function() {
        for (var i = 0; i < this._particles.length; i++) {
            var p = this._particles[i];
            p.x -= p.speed;
            if (p.x < this._play.x) {
                p.x = this._play.x + this._play.width;
                p.y = this._play.y + Math.random() * this._play.height;
            }
        }

        var leftEdge = this._play.x;
        var rightEdge = this._play.x + this._play.width;
        for (var j = 0; j < this._ambientFish.length; j++) {
            var fish = this._ambientFish[j];
            fish.x += fish.dir * fish.speed;

            // Reposition only after the whole fish has left the visible area.
            if (fish.dir < 0 && fish.x + fish.width / 2 < leftEdge) {
                fish.x = rightEdge + fish.width / 2 + 90 + Math.random() * 210;
                fish.y = this._play.y + this._play.height * (fish.lane + (Math.random() - 0.5) * 0.06);
            } else if (fish.dir > 0 && fish.x - fish.width / 2 > rightEdge) {
                fish.x = leftEdge - fish.width / 2 - 90 - Math.random() * 210;
                fish.y = this._play.y + this._play.height * (fish.lane + (Math.random() - 0.5) * 0.06);
            }
        }
    };

    Scene_BFUnderwaterTunnel.prototype._checkBounds = function() {
        var top = this._play.y;
        var bottom = this._play.y + this._play.height;

        if (this._player.y < top) {
            this._player.y = top;
            this._registerHit();
        }

        if (this._player.y + this._player.height > bottom) {
            this._player.y = bottom - this._player.height;
            this._registerHit();
        }
    };

    Scene_BFUnderwaterTunnel.prototype._checkCollisions = function() {
        var p = this._player;

        for (var i = 0; i < this._obstacles.length; i++) {
            var o = this._obstacles[i];

            if (this._rectsOverlap(p, o)) {
                this._obstacles.splice(i, 1);
                this._registerHit();
                return;
            }
        }

        if (this._distance >= this._targetDistance) {
            this._success();
        }
    };

    Scene_BFUnderwaterTunnel.prototype._registerHit = function() {
        this._hits++;

        SoundManager.playBuzzer();

        if (this._hits >= this._maxHits) {
            this._lose(this._t('Вы потеряли слишком много воздуха.', 'Too many collisions!'));
        } else {
            this._air = Math.max(0, this._air - 18);
            this._player.vy = -3.2;
            this._showMessage(this._t('Удар! Воздух повреждён.', 'Impact! Air supply damaged.'), 55);
        }
    };

    Scene_BFUnderwaterTunnel.prototype._lose = function(text) {
        if (this._gameOver || this._finished) {
            return;
        }

        this._gameOver = true;
        this._message = text;
        this._messageTimer = 9999;
        SoundManager.playBuzzer();
        this._redraw();
    };

    Scene_BFUnderwaterTunnel.prototype._success = function() {
        if (this._finished) {
            return;
        }

        this._finished = true;
        this._message = this._t('Вы выбрались из туннеля!', 'You escaped the tunnel!');
        this._messageTimer = 9999;
        SoundManager.playOk();
        this._redraw();

        var self = this;

        setTimeout(function() {
            if (window.BF_QuestSystem && BF_QuestSystem.game()) {
                var questGame = BF_QuestSystem.game();
                questGame.minigameResult('SUCCESS');
                // Баллон, ласты и маска больше не нужны в заметках после выхода из туннеля.
                if (questGame._notes && typeof questGame._notes === 'object') {
                    Object.keys(questGame._notes).forEach(function(key) {
                        if (/nitrogen|balloon|cylinder|fins|flippers|mask|баллон|ласт|маск|vermillion/i.test(key + ' ' + questGame._notes[key])) {
                            delete questGame._notes[key];
                        }
                    });
                }
            }

            // После успешного прохождения туннеля скрываем охрану.
            // EV004: страница 2 — Self Switch A
            // EV005: страница 4 — Self Switch C (A/B уже заняты сюжетом)
            // EV006: страница 2 — Self Switch A
            if (window.$gameSelfSwitches) {
                $gameSelfSwitches.setValue([13, 4, 'A'], true);
                $gameSelfSwitches.setValue([13, 5, 'C'], true);
                $gameSelfSwitches.setValue([13, 6, 'A'], true);
            }

            // После успешного прохождения выходим из туннеля
            // прямо на территорию казино в порту.
            // Старое событие EV010 использовало: Порт (19,7).
            if ($gamePlayer && $gamePlayer.reserveTransfer) {
                $gamePlayer.reserveTransfer(13, 19, 7, 2, 0);
            }

            SceneManager.pop();
        }, 900);
    };

    Scene_BFUnderwaterTunnel.prototype._closeWithoutSuccess = function() {
        if (this._finished) {
            return;
        }

        if (window.BF_QuestSystem && BF_QuestSystem.game()) {
            BF_QuestSystem.game().minigameResult('CANCEL');
        }

        SceneManager.pop();
    };

    Scene_BFUnderwaterTunnel.prototype._updateMessage = function() {
        if (this._messageTimer > 0 && this._messageTimer < 9999) {
            this._messageTimer--;
            if (this._messageTimer <= 0) {
                this._message = '';
            }
        }
    };

    Scene_BFUnderwaterTunnel.prototype._showMessage = function(text, frames) {
        this._message = text;
        this._messageTimer = frames;
    };

    Scene_BFUnderwaterTunnel.prototype._rectsOverlap = function(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    };

    Scene_BFUnderwaterTunnel.prototype._inside = function(x, y, rect) {
        return x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height;
    };

    Scene_BFUnderwaterTunnel.prototype._drawPlayer = function(b) {
        var p = this._player;
        // Animated diver frames, cycling with distance to simulate swimming.
        var frame = 1 + (Math.floor(this._distance / 18) % 5);
        if (this._bltAsset('diver' + frame, p.x - 32, p.y - 25, 76, 54)) return;
        b.fillRect(p.x - 2, p.y - 2, p.width + 4, p.height + 4, '#c7d4dd');
        b.fillRect(p.x + 7, p.y + 3, 20, 13, '#55727f');
        b.fillRect(p.x + 12, p.y + 5, 12, 8, '#b9e4ef');
        b.fillRect(p.x + 2, p.y + 8, 9, 13, '#d2a14d');
        b.fillRect(p.x + 11, p.y + 10, 18, 8, '#777f89');
        b.fillRect(p.x - 8, p.y + 11, 8, 5, '#7896a4');
    };

    Scene_BFUnderwaterTunnel.prototype._drawObstacle = function(b, o) {
        var left = Math.round(o.x);
        var top = Math.round(o.y);
        var width = Math.max(1, Math.round(o.width));
        var height = Math.max(1, Math.round(o.height));
        var shaft = this._assets && this._assets.columnShaft;
        var cap = this._assets && this._assets.columnCap;

        // Fill obstacle with the repeated shaft texture, keeping its original pixel scale.
        // No stalactites/stalagmites are drawn: these are solid ancient columns only.
        if (shaft && shaft.isReady() && shaft.width > 0 && shaft.height > 0) {
            for (var yy = top; yy < top + height; yy += shaft.height) {
                var sh = Math.min(shaft.height, top + height - yy);
                for (var xx = left; xx < left + width; xx += shaft.width) {
                    var sw = Math.min(shaft.width, left + width - xx);
                    b.blt(shaft, 0, 0, sw, sh, xx, yy, sw, sh);
                }
            }
        } else {
            b.fillRect(left, top, width, height, '#263d49');
            b.fillRect(left + 4, top, Math.max(1, width - 8), height, '#385968');
            for (var lineY = top + 24; lineY < top + height; lineY += 24) {
                b.fillRect(left, lineY, width, 2, '#182f3c');
            }
        }

        // No capital/footing sprites: columns end flat at the tunnel boundary.
        // This removes ledges from both ceiling and floor columns.

        // Thin moss marks on the exterior side; no spikes or pointy tips.
        if (height > 65) {
            var mossX = o.side === 'top' ? left + width - 5 : left + 2;
            for (var my = top + 30; my < top + height - 12; my += 58) {
                b.fillRect(mossX, my, 3, 10, '#2a7d58');
                b.fillRect(mossX - 2, my + 6, 3, 5, '#3c9a67');
            }
        }
    };

    Scene_BFUnderwaterTunnel.prototype._redraw = function() {
        var b = this._bitmap;
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        b.clear();

        // Water background.
        b.fillRect(0, 0, w, h, '#061724');
        b.gradientFillRect(0, 0, w, h, '#0c4964', '#03101d', true);
        // Subtle underwater light shafts.
        for (var ray = 0; ray < 6; ray++) {
            var rx = (ray * 173 + 45 - (this._distance * 0.12) % 173);
            b.fillRect(rx, 70, 22, h - 70, 'rgba(67,190,211,0.035)');
        }

        // Water bands.
        for (var y = 0; y < h; y += 44) {
            b.fillRect(0, y, w, 2, 'rgba(112,190,207,0.12)');
        }

        // Header.
        b.fillRect(22, 14, w - 44, 54, '#172028');
        b.fillRect(22, 68, w - 44, 2, '#536873');

        b.fontSize = 25;
        b.textColor = '#ffffff';
        b.drawText(this._t('ЗАТОПЛЕННЫЙ ТУННЕЛЬ', 'FLOODED TUNNEL'), 38, 25, w - 190, 30, 'left');

        // Exit button.
        b.fillRect(this._exitRect.x, this._exitRect.y, this._exitRect.width, this._exitRect.height, '#303a43');
        b.fontSize = 18;
        b.textColor = '#ffffff';
        b.drawText(this._t('ВЫХОД', 'EXIT'), this._exitRect.x, this._exitRect.y + 9, this._exitRect.width, 22, 'center');

        // Continuous flooded tunnel panorama, preserving aspect ratio and scrolling smoothly.
        this._drawParallaxBackdrop(b);
        b.fillRect(this._play.x, this._play.y, this._play.width, this._play.height, 'rgba(2,20,34,0.28)');
        b.gradientFillRect(this._play.x, this._play.y, this._play.width, this._play.height,
            'rgba(19,126,154,0.10)', 'rgba(0,8,18,0.42)', true);
        b.fillRect(this._play.x, this._play.y, this._play.width, 4, '#56b6ca');
        b.fillRect(this._play.x, this._play.y + this._play.height - 4, this._play.width, 4, '#56b6ca');

        // Background fish travel continuously across the scene and turn naturally with direction.
        for (var af = 0; af < this._ambientFish.length; af++) {
            var fish = this._ambientFish[af];
            var fishAsset = fish.dir < 0 ? fish.leftAsset : fish.rightAsset;
            this._bltAsset(fishAsset, fish.x - fish.width / 2, fish.y - fish.height / 2,
                fish.width, fish.height);
        }

        // Bubbles / particles.
        for (var i = 0; i < this._particles.length; i++) {
            var p = this._particles[i];
            if (!this._bltAsset('bubble', p.x, p.y, p.size + 5, p.size + 5)) b.fillRect(p.x, p.y, p.size, p.size, 'rgba(174,225,235,0.5)');
        }

        for (var j = 0; j < this._obstacles.length; j++) {
            this._drawObstacle(b, this._obstacles[j]);
        }

        if (this._player) {
            this._drawPlayer(b);
        }

        // HUD.
        b.fontSize = 16;
        b.textColor = '#d9e6ea';
        b.drawText(this._t('ВОЗДУХ', 'AIR'), 38, 76, 80, 22, 'left');

        b.fillRect(112, 80, 190, 14, '#263941');
        b.fillRect(112, 80, 190 * (this._air / 100), 14, '#76b8c6');

        b.drawText(this._t('ПУТЬ', 'DISTANCE'), 320, 76, 50, 22, 'left');
        var progress = Math.min(100, Math.floor(this._distance / this._targetDistance * 100));
        b.drawText(progress + '%', 370, 76, 50, 22, 'left');

        b.drawText(this._t('УДАРЫ', 'HITS'), 438, 76, 60, 22, 'left');
        var hitsText = '';
        for (var hidx = 0; hidx < this._maxHits; hidx++) {
            hitsText += hidx < this._hits ? '●' : '○';
        }
        b.drawText(hitsText, 498, 76, 70, 22, 'left');

        // Current indicator.
        if (this._currentType !== 0 && !this._gameOver && !this._finished) {
            b.fontSize = 14;
            b.textColor = '#c9e9ef';
            b.drawText(
                this._currentType < 0 ? this._t('ТЕЧЕНИЕ ↓', 'CURRENT ↓') : this._t('ТЕЧЕНИЕ ↑', 'CURRENT ↑'),
                580, 76, 105, 22, 'center'
            );
        }

        // Message.
        if (this._message) {
            b.fillRect(w / 2 - 190, h - 60, 380, 34, 'rgba(0,0,0,0.65)');
            b.fontSize = 17;
            b.textColor = '#ffffff';
            b.drawText(this._message, w / 2 - 180, h - 53, 360, 24, 'center');
        }

        if (this._gameOver) {
            b.fillRect(w / 2 - 220, h / 2 - 80, 440, 175, 'rgba(5,10,14,0.94)');
            b.fontSize = 28;
            b.textColor = '#ffffff';
            b.drawText(this._t('ТУННЕЛЬ НЕ ПРОЙДЕН', 'TUNNEL FAILED'), w / 2 - 210, h / 2 - 45, 420, 34, 'center');

            b.fontSize = 17;
            b.textColor = '#d6e1e5';
            b.drawText(this._message, w / 2 - 190, h / 2 - 5, 380, 25, 'center');

            b.fillRect(this._restartRect.x, this._restartRect.y, this._restartRect.width, this._restartRect.height, '#3d5862');
            b.fontSize = 18;
            b.textColor = '#ffffff';
            b.drawText(this._t('ПОПРОБОВАТЬ СНОВА', 'TRY AGAIN'), this._restartRect.x, this._restartRect.y + 10, this._restartRect.width, 24, 'center');
        }

        if (this._finished) {
            b.fillRect(w / 2 - 220, h / 2 - 65, 440, 125, 'rgba(5,10,14,0.92)');
            b.fontSize = 28;
            b.textColor = '#ffffff';
            b.drawText(this._t('ТУННЕЛЬ ПРОЙДЕН!', 'TUNNEL CLEARED!'), w / 2 - 210, h / 2 - 25, 420, 34, 'center');
            b.fontSize = 17;
            b.drawText(this._t('Вы добрались до территории казино.', 'You reached the casino grounds.'), w / 2 - 190, h / 2 + 20, 380, 25, 'center');
        }
    };

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === pluginName && args && args[0] === 'start') {
            SceneManager.push(Scene_BFUnderwaterTunnel);
        }
    };

    window.Scene_BFUnderwaterTunnel = Scene_BFUnderwaterTunnel;

})();
