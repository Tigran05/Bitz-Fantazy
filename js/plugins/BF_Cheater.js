/*:
 * @plugindesc Bitz Fantasy — мини-игра «Разоблачение шулера».
 * @author ASTROLIT
 *
 * @help
 * Plugin Command:
 *   Cheater start
 *
 * Механика:
 *   1) Игрок наблюдает за тремя игровыми автоматами.
 *   2) У автоматов 1 и 2 — разные комбинации символов.
 *   3) У автомата 3 — 777, и одновременно заметно вибрирует правая нога шулера.
 *   4) После наблюдения появляется полный персонаж для осмотра.
 *   5) Клик по любой части тела, кроме ноги, запускает новое наблюдение.
 *   6) Клик по правильной ноге обнаруживает устройство и завершает мини-игру.
 *
 * Интеграция:
 *   BF_QuestSystem.minigameStart('BF_Cheater','manager')
 *   BF_QuestSystem.minigameResult('SUCCESS')
 *   Variable 10 = 9
 *   Self Switch A запускающего события
 */
(function() {
    'use strict';

    var ORIGIN = { mapId: 0, eventId: 0 };
    var PLUGIN = 'BF_Cheater';

    function fillRoundRect(b, x, y, w, h, r, fill, stroke, lw) {
        var c = b._context;
        if (!c) return;
        c.save();
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
        c.fillStyle = fill;
        c.fill();
        if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = lw || 2;
            c.stroke();
        }
        c.restore();
        if (b._setDirty) b._setDirty();
    }

    function text(b, str, x, y, w, h, size, color, align, bold) {
        b.fontFace = 'Arial';
        b.fontSize = size || 22;
        b.textColor = color || '#fff';
        b.outlineWidth = 0;
        b.fontBold = !!bold;
        b.drawText(str, x, y, w, h, align || 'left');
    }

    function circle(b, x, y, r, fill, stroke, lw) {
        var c = b._context;
        if (!c) return;
        c.save();
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fillStyle = fill;
        c.fill();
        if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = lw || 2;
            c.stroke();
        }
        c.restore();
        if (b._setDirty) b._setDirty();
    }

    function hit(x, y, r) {
        return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }

    function Scene_CheaterMini() {
        this.initialize.apply(this, arguments);
    }

    Scene_CheaterMini.prototype = Object.create(Scene_Base.prototype);
    Scene_CheaterMini.prototype.constructor = Scene_CheaterMini;

    Scene_CheaterMini.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._phase = 'observe';
        this._timer = 0;
        this._anim = 0;
        this._observeLength = 360;
        this._segmentLength = 120;
        this._moveFrames = 18;
        this._vibStart = 35;
        this._vibEnd = 85;
        this._done = false;
        this._deviceShown = false;
        this._closeTimer = 0;
        this._sceneBmp = null;
        this._statusBmp = null;
        this._inspectionZones = null;
        this._machines = [];
    };

    Scene_CheaterMini.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        if (window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameStart === 'function') {
            var allowed = window.BF_QuestSystem.minigameStart(PLUGIN, 'manager');
            if (!allowed) {
                SceneManager.pop();
                return;
            }
        }

        var W = Graphics.boxWidth;
        var H = Graphics.boxHeight;

        this._sceneBmp = new Bitmap(W, H);
        this._scene = new Sprite(this._sceneBmp);
        this.addChild(this._scene);

        this._statusBmp = new Bitmap(W, 54);
        this._status = new Sprite(this._statusBmp);
        this._status.y = H - 60;
        this.addChild(this._status);

        this.startObservation();
    };

    Scene_CheaterMini.prototype.setStatus = function(msg) {
        var b = this._statusBmp;
        if (!b) return;
        b.clear();
        if (!msg) return;
        fillRoundRect(b, 16, 4, b.width - 32, 44, 10, '#081017', '#3a515c', 2);
        text(b, msg, 26, 12, b.width - 52, 28, 19, '#dfe8ed', 'center', false);
    };

    Scene_CheaterMini.prototype.startObservation = function() {
        this._phase = 'observe';
        this._timer = 0;
        this._anim = 0;
        this._inspectionZones = null;
        this._deviceShown = false;
        this.setStatus('');
        this.redraw();
    };

    Scene_CheaterMini.prototype.drawBackground = function(b, W, H) {
        b.clear();
        b.fillRect(0, 0, W, H, '#070c10');
        b.fillRect(0, H * 0.70, W, H * 0.30, '#10171d');
        b.fillRect(0, 0, W, 80, '#05080b');
        text(b, 'КАЗИНО', 34, 18, 280, 42, 34, '#e8c65d', 'left', true);
        text(b, this._phase === 'observe' ? 'НАБЛЮДЕНИЕ' : 'ОСМОТР', W - 290, 22, 250, 34, 24, '#9fb2bc', 'right', true);
    };

    Scene_CheaterMini.prototype.drawSlotSymbol = function(b, kind, cx, cy, scale) {
        var s = scale || 1;
        if (kind === '7') {
            text(b, '7', cx - 22 * s, cy - 25 * s, 44 * s, 50 * s, Math.round(42 * s), '#f0d36e', 'center', true);
        } else if (kind === 'BAR') {
            fillRoundRect(b, cx - 27 * s, cy - 13 * s, 54 * s, 26 * s, 5 * s, '#7b8790', '#c4d0d6', 2);
            text(b, 'BAR', cx - 23 * s, cy - 9 * s, 46 * s, 18 * s, Math.round(15 * s), '#142027', 'center', true);
        } else if (kind === 'BELL') {
            circle(b, cx, cy + 4 * s, 17 * s, '#d4b452', '#f3d87d', 2);
            b._context.save();
            b._context.fillStyle = '#d4b452';
            b._context.beginPath();
            b._context.arc(cx, cy + 2 * s, 15 * s, Math.PI, Math.PI * 2);
            b._context.lineTo(cx + 18 * s, cy + 7 * s);
            b._context.lineTo(cx - 18 * s, cy + 7 * s);
            b._context.closePath();
            b._context.fill();
            b._context.restore();
            if (b._setDirty) b._setDirty();
            circle(b, cx, cy + 14 * s, 4 * s, '#3a2c12', null, 0);
        } else if (kind === 'CHERRY') {
            circle(b, cx - 9 * s, cy + 6 * s, 10 * s, '#b84a47', '#e27976', 2);
            circle(b, cx + 9 * s, cy + 6 * s, 10 * s, '#b84a47', '#e27976', 2);
            b._context.save();
            b._context.strokeStyle = '#6fa368';
            b._context.lineWidth = Math.max(2, 3 * s);
            b._context.beginPath();
            b._context.moveTo(cx - 7 * s, cy - 2 * s);
            b._context.quadraticCurveTo(cx - 3 * s, cy - 17 * s, cx + 6 * s, cy - 8 * s);
            b._context.stroke();
            b._context.restore();
            if (b._setDirty) b._setDirty();
        } else if (kind === 'STAR') {
            var c = b._context;
            c.save();
            c.fillStyle = '#7ec5dc';
            c.beginPath();
            for (var i = 0; i < 10; i++) {
                var a = -Math.PI / 2 + i * Math.PI / 5;
                var rr = (i % 2 === 0 ? 19 : 8) * s;
                var px = cx + Math.cos(a) * rr;
                var py = cy + Math.sin(a) * rr;
                if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
            }
            c.closePath();
            c.fill();
            c.restore();
            if (b._setDirty) b._setDirty();
        }
    };

    Scene_CheaterMini.prototype.drawMachine = function(b, x, y, w, h, index, active, jackpot) {
        fillRoundRect(b, x, y, w, h, 12, active ? '#14232d' : '#0d151b', active ? '#79b6c7' : '#3d535e', active ? 3 : 2);
        text(b, 'АВТОМАТ ' + (index + 1), x, y + 13, w, 34, 24, '#edf2f4', 'center', true);

        var wx = x + 16;
        var wy = y + 54;
        var ww = w - 32;
        var wh = h - 72;
        fillRoundRect(b, wx, wy, ww, wh, 8, '#040709', '#263943', 2);

        var symbols;
        if (!active) {
            symbols = ['EMPTY', 'EMPTY', 'EMPTY'];
        } else if (jackpot) {
            symbols = ['7', '7', '7'];
        } else if (index === 0) {
            symbols = ['CHERRY', 'BELL', 'BAR'];
        } else {
            symbols = ['STAR', 'CHERRY', 'BELL'];
        }

        var sx = wx + ww / 2;
        var spacing = Math.min(ww * 0.30, 75);
        for (var i = 0; i < 3; i++) {
            if (symbols[i] === 'EMPTY') {
                text(b, '—', sx + (i - 1) * spacing - 16, wy + wh / 2 - 18, 32, 35, 28, '#4d626b', 'center', false);
            } else {
                this.drawSlotSymbol(b, symbols[i], sx + (i - 1) * spacing, wy + wh / 2 - 2, 0.9);
            }
        }

        if (jackpot && active) {
            text(b, '777', wx, wy + wh - 34, ww, 24, 20, '#f3d66b', 'center', true);
        }
    };

    Scene_CheaterMini.prototype.drawCharacter = function(b, cx, baseY, scale, inspecting) {
        var s = scale || 1;
        var bodyW = 118 * s;
        var bodyH = 156 * s;
        var legW = 38 * s;
        var legH = 118 * s;
        var headR = 45 * s;
        var headY = baseY - 302 * s;
        var bodyY = baseY - 235 * s;
        var legY = baseY - 91 * s;
        var armY = bodyY + 36 * s;
        var leftLegX = cx - 43 * s;
        var rightLegX = cx + 5 * s;

        var c = b._context;
        c.save();
        c.fillStyle = 'rgba(0,0,0,.48)';
        c.beginPath();
        c.ellipse(cx, baseY + 2 * s, 84 * s, 11 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();

        var observationIndex = Math.min(2, Math.floor(this._timer / this._segmentLength));
        var segmentTime = this._timer - observationIndex * this._segmentLength;
        var vibrating = !inspecting && observationIndex === 1 && segmentTime >= this._vibStart && segmentTime <= this._vibEnd;
        var rightKick = vibrating ? Math.sin(this._anim * 1.65) * 7 * s : 0;

        fillRoundRect(b, leftLegX, legY, legW, legH, 10 * s, '#2d3540', '#596673', 2);
        fillRoundRect(b, rightLegX, legY + rightKick, legW, legH, 10 * s, '#2d3540', '#596673', 2);

        fillRoundRect(b, cx - bodyW / 2, bodyY, bodyW, bodyH, 18 * s, '#422847', '#6a5670', 2);
        fillRoundRect(b, cx - bodyW / 2 - 25 * s, armY, 27 * s, 104 * s, 12 * s, '#422847', '#6a5670', 2);
        fillRoundRect(b, cx + bodyW / 2 - 2 * s, armY, 27 * s, 104 * s, 12 * s, '#422847', '#6a5670', 2);

        c.save();
        c.fillStyle = '#9b684a';
        c.beginPath();
        c.arc(cx, headY, headR, 0, Math.PI * 2);
        c.fill();
        c.restore();
        if (b._setDirty) b._setDirty();

        fillRoundRect(b, cx - 53 * s, headY - 52 * s, 106 * s, 22 * s, 6 * s, '#251b21', '#4f4348', 2);
        fillRoundRect(b, cx - 40 * s, headY - 73 * s, 80 * s, 23 * s, 5 * s, '#251b21', null, 0);

        b.fillRect(cx - 18 * s, headY - 7 * s, 8 * s, 7 * s, '#111');
        b.fillRect(cx + 10 * s, headY - 7 * s, 8 * s, 7 * s, '#111');
        b.fillRect(cx - 11 * s, headY + 19 * s, 22 * s, 4 * s, '#6b4439');

        if (!inspecting && vibrating) {
            var xx = rightLegX + legW / 2;
            var yy = legY + rightKick + legH * 0.38;
            var pulse = 1.5 + Math.sin(this._anim * 2.2) * 2;
            c.save();
            c.strokeStyle = '#d7bd63';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(xx + 12 * s, yy - 10 * s);
            c.lineTo(xx + (21 + pulse) * s, yy);
            c.lineTo(xx + 12 * s, yy + 10 * s);
            c.stroke();
            c.restore();
            if (b._setDirty) b._setDirty();
        }

        if (inspecting && this._deviceShown) {
            var dx = rightLegX + legW / 2;
            var dy = legY + 48 * s;
            fillRoundRect(b, dx - 19 * s, dy - 16 * s, 38 * s, 32 * s, 7 * s, '#253b4c', '#8ed1e5', 2);
            b.fillRect(dx - 6 * s, dy - 5 * s, 12 * s, 10 * s, '#d76d5d');
        }

        return {
            head: { x: cx - 55 * s, y: headY - 55 * s, w: 110 * s, h: 110 * s },
            arms: { x: cx - 88 * s, y: armY - 8 * s, w: 176 * s, h: 120 * s },
            body: { x: cx - 70 * s, y: bodyY, w: 140 * s, h: 158 * s },
            leftLeg: { x: leftLegX - 10 * s, y: legY - 4 * s, w: legW + 20 * s, h: legH + 10 * s },
            rightLeg: { x: rightLegX - 10 * s, y: legY + rightKick - 4 * s, w: legW + 20 * s, h: legH + 10 * s }
        };
    };

    Scene_CheaterMini.prototype.redraw = function() {
        var b = this._sceneBmp;
        var W = Graphics.boxWidth;
        var H = Graphics.boxHeight;
        this._machines = [];
        this.drawBackground(b, W, H);

        if (this._phase === 'observe') {
            var margin = Math.max(30, W * 0.05);
            var gap = Math.max(18, W * 0.025);
            var cardW = (W - margin * 2 - gap * 2) / 3;
            var cardH = Math.min(205, H * 0.30);
            var y = Math.max(96, H * 0.13);
            var segment = Math.min(2, Math.floor(this._timer / this._segmentLength));
            var phaseT = this._timer - segment * this._segmentLength;

            for (var i = 0; i < 3; i++) {
                var x = margin + i * (cardW + gap);
                this.drawMachine(b, x, y, cardW, cardH, i, i === segment, i === 1);
            }

            var targetX = margin + segment * (cardW + gap) + cardW / 2;
            var prevX = margin + (Math.max(0, segment - 1)) * (cardW + gap) + cardW / 2;
            var charX = targetX;
            if (segment > 0 && phaseT < this._moveFrames) {
                var q = phaseT / this._moveFrames;
                q = q * q * (3 - 2 * q);
                charX = prevX + (targetX - prevX) * q;
            }

            text(b, 'Наблюдение ' + (segment + 1) + ' / 3', 0, y + cardH + 12, W, 32, 23, '#b6c5cc', 'center', false);
            text(b, segment === 1 ? '...' : '...', 0, y + cardH + 42, W, 28, 17, '#748791', 'center', false);

            this.drawCharacter(b, charX, H * 0.955, Math.min(W / 820, H / 720) * 0.82, false);
        } else if (this._phase === 'inspect' || this._phase === 'success') {
            this._inspectionZones = this.drawCharacter(b, W / 2, H * 0.92, Math.min(W / 650, H / 665) * 1.05, true);
        }
    };

    Scene_CheaterMini.prototype.updateObservation = function() {
        this._timer += 1;
        this._anim += 1;
        if (this._timer >= this._observeLength) {
            this._phase = 'inspect';
            this._timer = 0;
            this._anim = 0;
            this.redraw();
            this.setStatus('');
        }
    };

    Scene_CheaterMini.prototype.inspectTap = function(x, y) {
        var z = this._inspectionZones;
        if (!z) return;
        if (hit(x, y, z.rightLeg)) {
            this.finishSuccess();
            return;
        }
        this.startObservation();
    };

    Scene_CheaterMini.prototype.finishSuccess = function() {
        if (this._done) return;
        this._done = true;
        this._deviceShown = true;
        this._phase = 'success';
        this.redraw();
        this.setStatus('Устройство найдено. Жулик разоблачён.');

        if (window.$gameVariables) $gameVariables.setValue(10, 9);
        if (window.$gameSelfSwitches && ORIGIN.mapId > 0 && ORIGIN.eventId > 0) {
            $gameSelfSwitches.setValue([ORIGIN.mapId, ORIGIN.eventId, 'A'], true);
        }
        if (window.BF_QuestSystem && typeof window.BF_QuestSystem.minigameResult === 'function') {
            window.BF_QuestSystem.minigameResult('SUCCESS');
        }
        this._closeTimer = 105;
    };

    Scene_CheaterMini.prototype.updateInput = function() {
        if (Input.isTriggered('escape')) {
            SceneManager.pop();
            return;
        }
        if (Input.isTriggered('r')) {
            this._done = false;
            this.startObservation();
            return;
        }
        if (this._phase === 'inspect' && TouchInput.isTriggered()) {
            this.inspectTap(TouchInput.x, TouchInput.y);
        }
        if (this._phase === 'success' && this._closeTimer <= 0 && Input.isTriggered('ok')) {
            SceneManager.pop();
        }
    };

    Scene_CheaterMini.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (this._phase === 'observe') {
            this.updateObservation();
            if (this._timer % 3 === 0) this.redraw();
        } else if (this._phase === 'success' && this._closeTimer > 0) {
            this._closeTimer -= 1;
            if (this._closeTimer <= 0) {
                SceneManager.pop();
                return;
            }
        }

        this.updateInput();
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        var c = String(command || '').toLowerCase();
        var a = args || [];
        if (c === 'cheater' && a.length && String(a[0]).toLowerCase() === 'start') {
            ORIGIN.mapId = this._mapId || ($gameMap ? $gameMap.mapId() : 0);
            ORIGIN.eventId = this._eventId || 0;
            SceneManager.push(Scene_CheaterMini);
        }
    };

    window.Scene_CheaterMini = Scene_CheaterMini;
    window.BF_Cheater = window.BF_Cheater || {};
    window.BF_Cheater.start = function() {
        ORIGIN.mapId = $gameMap ? $gameMap.mapId() : 0;
        ORIGIN.eventId = 0;
        SceneManager.push(Scene_CheaterMini);
    };
})();
