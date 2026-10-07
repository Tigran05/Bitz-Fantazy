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
        this._createLayout();
        this._createPlayer();
        this._createParticles();
        this._showMessage('Плывите через затопленный туннель', 100);
        this._redraw();
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

        this._showMessage('Плывите!', 45);
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
                this._currentType < 0 ? 'Течение тянет вниз' : 'Течение поднимает',
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
            this._lose('Воздух закончился.');
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
            this._lose('Вы потеряли слишком много воздуха.');
        } else {
            this._air = Math.max(0, this._air - 18);
            this._player.vy = -3.2;
            this._showMessage('Удар! Воздух повреждён.', 55);
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
        this._message = 'Вы выбрались из туннеля!';
        this._messageTimer = 9999;
        SoundManager.playOk();
        this._redraw();

        var self = this;

        setTimeout(function() {
            if (window.BF_QuestSystem && BF_QuestSystem.game()) {
                BF_QuestSystem.game().minigameResult('SUCCESS');
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

        // Diving helmet.
        b.fillRect(p.x - 2, p.y - 2, p.width + 4, p.height + 4, '#c7d4dd');
        b.fillRect(p.x + 7, p.y + 3, 20, 13, '#55727f');
        b.fillRect(p.x + 12, p.y + 5, 12, 8, '#b9e4ef');

        // Body.
        b.fillRect(p.x + 2, p.y + 8, 9, 13, '#d2a14d');
        b.fillRect(p.x + 11, p.y + 10, 18, 8, '#777f89');

        // Fins.
        b.fillRect(p.x - 8, p.y + 11, 8, 5, '#7896a4');
    };

    Scene_BFUnderwaterTunnel.prototype._drawObstacle = function(b, o) {
        b.fillRect(o.x, o.y, o.width, o.height, '#38444c');

        if (o.height > 18) {
            var detailY = o.side === 'top' ? o.y + o.height - 14 : o.y + 8;
            b.fillRect(o.x + 8, detailY, o.width - 16, 6, '#697983');
        }

        b.fillRect(o.x + 4, o.y, 5, o.height, '#20292f');
        b.fillRect(o.x + o.width - 9, o.y, 5, o.height, '#20292f');
    };

    Scene_BFUnderwaterTunnel.prototype._redraw = function() {
        var b = this._bitmap;
        var w = Graphics.boxWidth;
        var h = Graphics.boxHeight;

        b.clear();

        // Water background.
        b.fillRect(0, 0, w, h, '#102f3c');

        // Water bands.
        for (var y = 0; y < h; y += 44) {
            b.fillRect(0, y, w, 2, 'rgba(112,190,207,0.12)');
        }

        // Header.
        b.fillRect(22, 14, w - 44, 54, '#172028');
        b.fillRect(22, 68, w - 44, 2, '#536873');

        b.fontSize = 25;
        b.textColor = '#ffffff';
        b.drawText('ЗАТОПЛЕННЫЙ ТУННЕЛЬ', 38, 25, w - 190, 30, 'left');

        // Exit button.
        b.fillRect(this._exitRect.x, this._exitRect.y, this._exitRect.width, this._exitRect.height, '#303a43');
        b.fontSize = 18;
        b.textColor = '#ffffff';
        b.drawText('ВЫХОД', this._exitRect.x, this._exitRect.y + 9, this._exitRect.width, 22, 'center');

        // Play area.
        b.fillRect(this._play.x, this._play.y, this._play.width, this._play.height, '#0a222c');
        b.fillRect(this._play.x, this._play.y, this._play.width, 5, '#344f59');
        b.fillRect(this._play.x, this._play.y + this._play.height - 5, this._play.width, 5, '#344f59');

        // Bubbles / particles.
        for (var i = 0; i < this._particles.length; i++) {
            var p = this._particles[i];
            b.fillRect(p.x, p.y, p.size, p.size, 'rgba(174,225,235,0.5)');
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
        b.drawText('ВОЗДУХ', 38, 76, 80, 22, 'left');

        b.fillRect(112, 80, 190, 14, '#263941');
        b.fillRect(112, 80, 190 * (this._air / 100), 14, '#76b8c6');

        b.drawText('ПУТЬ', 320, 76, 50, 22, 'left');
        var progress = Math.min(100, Math.floor(this._distance / this._targetDistance * 100));
        b.drawText(progress + '%', 370, 76, 50, 22, 'left');

        b.drawText('УДАРЫ', 438, 76, 60, 22, 'left');
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
                this._currentType < 0 ? 'ТЕЧЕНИЕ ↓' : 'ТЕЧЕНИЕ ↑',
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
            b.drawText('ТУННЕЛЬ НЕ ПРОЙДЕН', w / 2 - 210, h / 2 - 45, 420, 34, 'center');

            b.fontSize = 17;
            b.textColor = '#d6e1e5';
            b.drawText(this._message, w / 2 - 190, h / 2 - 5, 380, 25, 'center');

            b.fillRect(this._restartRect.x, this._restartRect.y, this._restartRect.width, this._restartRect.height, '#3d5862');
            b.fontSize = 18;
            b.textColor = '#ffffff';
            b.drawText('ПОПРОБОВАТЬ СНОВА', this._restartRect.x, this._restartRect.y + 10, this._restartRect.width, 24, 'center');
        }

        if (this._finished) {
            b.fillRect(w / 2 - 220, h / 2 - 65, 440, 125, 'rgba(5,10,14,0.92)');
            b.fontSize = 28;
            b.textColor = '#ffffff';
            b.drawText('ТУННЕЛЬ ПРОЙДЕН!', w / 2 - 210, h / 2 - 25, 420, 34, 'center');
            b.fontSize = 17;
            b.drawText('Вы добрались до территории казино.', w / 2 - 190, h / 2 + 20, 380, 25, 'center');
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
