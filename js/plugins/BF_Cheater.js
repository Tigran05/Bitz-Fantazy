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
    var suspectBitmap = null;
    function suspectImage() { if (!suspectBitmap) suspectBitmap = ImageManager.loadPicture('BF_Cheater/BF_Cheater_Suspect'); return suspectBitmap; }

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

    // UI labels are translated through the existing ASTROLIT language system.
    // Local fallback keeps the minigame bilingual even if the language plugin is loaded later.
    var CHEATER_TEXT_EN = {
        'BITZ  •  КАЗИНО': 'BITZ  •  CASINO',
        'НАБЛЮДЕНИЕ': 'OBSERVATION',
        'РАЗОБЛАЧЕНИЕ': 'EXPOSED',
        'ОСМОТР': 'INSPECTION',
        'АВТОМАТ 1': 'SLOT 1',
        'АВТОМАТ 2': 'SLOT 2',
        'АВТОМАТ 3': 'SLOT 3',
        'Наблюдайте за игрой': 'Watch the game',
        'Следите за шулером': 'Watch the cheat',
        'Устройство найдено. Жулик разоблачён.': 'Device found. The cheat is exposed.',
        'Наблюдение 1 / 3': 'Observation 1 / 3',
        'Наблюдение 2 / 3': 'Observation 2 / 3',
        'Наблюдение 3 / 3': 'Observation 3 / 3'
    };

    function localizeText(value) {
        var source = String(value == null ? '' : value);
        var isEnglish = window.ConfigManager && ConfigManager.bfLanguage === 'en';
        if (!isEnglish) return source;
        if (Object.prototype.hasOwnProperty.call(CHEATER_TEXT_EN, source)) return CHEATER_TEXT_EN[source];
        var lang = window.BF_Language;
        if (lang && lang.dictionary) {
            // Register this plugin's exact labels into the existing dictionary without
            // modifying ASTROLIT_Language.js on disk.
            Object.keys(CHEATER_TEXT_EN).forEach(function(key) {
                if (!Object.prototype.hasOwnProperty.call(lang.dictionary, key)) {
                    lang.dictionary[key] = CHEATER_TEXT_EN[key];
                }
            });
            if (typeof lang.translateUI === 'function') return lang.translateUI(source);
        }
        var observation = source.match(/^Наблюдение (\d+) \/ 3$/);
        if (observation) return 'Observation ' + observation[1] + ' / 3';
        return source;
    }

    function text(b, str, x, y, w, h, size, color, align, bold) {
        b.fontFace = 'Arial';
        b.fontSize = size || 22;
        b.textColor = color || '#fff';
        b.outlineWidth = 0;
        b.fontBold = !!bold;
        b.drawText(localizeText(str), x, y, w, h, align || 'left');
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

    function line(b, x1, y1, x2, y2, color, width) {
        var c = b._context;
        if (!c) return;
        c.save(); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
        c.strokeStyle = color; c.lineWidth = width || 2; c.stroke(); c.restore();
        if (b._setDirty) b._setDirty();
    }

    function gradientRect(b, x, y, w, h, top, bottom) {
        var c = b._context; if (!c) return;
        c.save(); var g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, top); g.addColorStop(1, bottom);
        c.fillStyle = g; c.fillRect(x, y, w, h); c.restore();
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
        this._vibStart = 20;
        this._vibEnd = 105;
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
        fillRoundRect(b, 16, 4, b.width - 32, 44, 8, '#24120e', '#c59a4a', 2);
        text(b, msg, 26, 12, b.width - 52, 28, 19, '#f4dfb3', 'center', false);
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
        gradientRect(b, 0, 0, W, H, '#21130f', '#08090b');
        // Warm casino wall panels and dark polished floor.
        gradientRect(b, 0, 0, W, H * 0.72, '#4a211c', '#211313');
        for (var px = 18; px < W; px += 96) {
            fillRoundRect(b, px, 88, 76, Math.max(80, H * 0.47), 4, 'rgba(18,9,8,.22)', 'rgba(214,164,83,.17)', 1);
            line(b, px + 8, 100, px + 68, 100, 'rgba(236,193,115,.18)', 1);
        }
        gradientRect(b, 0, H * 0.70, W, H * 0.30, '#39251b', '#100c0a');
        line(b, 0, H * 0.70, W, H * 0.70, '#b27b3e', 3);
        line(b, 0, H * 0.715, W, H * 0.715, 'rgba(255,213,137,.35)', 1);
        // Header plaque in the established Bitz Fantasy burgundy/gold palette.
        gradientRect(b, 0, 0, W, 76, '#170d0d', '#321513');
        line(b, 0, 75, W, 75, '#c59a4a', 2);
        text(b, 'BITZ  •  КАЗИНО', 28, 15, Math.min(390, W * .48), 42, 29, '#e8c77b', 'left', true);
        text(b, this._phase === 'observe' ? 'НАБЛЮДЕНИЕ' : (this._phase === 'success' ? 'РАЗОБЛАЧЕНИЕ' : 'ОСМОТР'), W * .55, 20, W * .41, 32, 21, '#f0dfbd', 'right', true);
        // Decorative corner rivets.
        circle(b, 13, 13, 3, '#e0b45f', '#6f4827', 1);
        circle(b, W - 13, 13, 3, '#e0b45f', '#6f4827', 1);
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
        // Real slot-machine artwork cropped from the user's SF_Inside_B RPG Maker tileset.
        fillRoundRect(b, x + 3, y + 5, w, h, 12, 'rgba(0,0,0,.48)', null, 0);
        fillRoundRect(b, x, y, w, h, 11, '#1b100d', '#d2a85b', 3);
        fillRoundRect(b, x + 5, y + 5, w - 10, h - 10, 8, '#3b2017', '#744b2b', 2);
        gradientRect(b, x + 8, y + 8, w - 16, 34, active ? '#d7a34b' : '#76502d', '#4b2418');
        text(b, 'BITZ', x + 8, y + 9, w - 16, 29, Math.max(15, Math.min(23, w * .10)), '#fff0bd', 'center', true);
        text(b, 'АВТОМАТ ' + (index + 1), x + 6, y + 39, w - 12, 27, Math.max(14, Math.min(20, w * .085)), '#f3dfb4', 'center', true);
        var wx=x+12, wy=y+69, ww=w-24, wh=h-83;
        fillRoundRect(b, wx, wy, ww, wh, 7, '#090909', '#d0a15a', 2);
        var symbols = !active ? ['EMPTY','EMPTY','EMPTY'] : (jackpot ? ['7','7','7'] : (index===0 ? ['CHERRY','BELL','BAR'] : ['STAR','CHERRY','BELL']));
        var reelW=(ww-14)/3;
        for (var i=0;i<3;i++) {
            var rx=wx+5+i*reelW;
            gradientRect(b,rx,wy+5,reelW-3,wh-10,'#f0e4c6','#b9a27c');
            if (symbols[i]==='EMPTY') text(b,'◆',rx,wy+wh/2-18,reelW-3,35,22,'#78684f','center',false);
            else this.drawSlotSymbol(b,symbols[i],rx+(reelW-3)/2,wy+wh/2-2,Math.min(.9,reelW/62));
            if(i<2) line(b,rx+reelW-2,wy+6,rx+reelW-2,wy+wh-6,'#6e5438',2);
        }
        if (jackpot && active) {
            fillRoundRect(b,wx+8,wy+wh-25,ww-16,20,4,'#3c1c12','#f1ce71',1);
            text(b,'777',wx+8,wy+wh-25,ww-16,20,19,'#ffdf75','center',true);
        }
        // No extra slot-machine picture badge: keep the cabinet clean and consistent.
        line(b,x+w-8,y+h*.53,x+w-1,y+h*.53-22,'#d8b36c',4);
        circle(b,x+w-1,y+h*.53-24,5,'#a72f24','#f0c36b',2);
        if(active) fillRoundRect(b,x-2,y-2,w+4,h+4,12,'rgba(0,0,0,0)','#f0ce78',2);
    };

    Scene_CheaterMini.prototype.drawCharacter = function(b, cx, baseY, scale, inspecting) {
        // Use the user's actual 3x4 RPG Maker character sheet. Keep the body still:
        // only the ankle/device area gets a vibration effect during the third observation.
        var s = (scale || 1) * 3.25;
        var sprite = suspectImage();
        var fw = 48, fh = 48;
        var sw = fw * s, sh = fh * s;
        var drawX = cx - sw / 2;
        var drawY = baseY - sh;
        var observationIndex = Math.min(2, Math.floor(this._timer / this._segmentLength));
        var segmentTime = this._timer - observationIndex * this._segmentLength;
        var vibrating = !inspecting && observationIndex === 2 &&
            segmentTime >= this._vibStart && segmentTime <= this._vibEnd;

        if (sprite && sprite.isReady && sprite.isReady()) {
            var ctx = b._context;
            if (ctx) { ctx.save(); ctx.imageSmoothingEnabled = false; }
            // Frame 1 in row 0 is the centered/front-facing idle frame. Never cycle walk frames.
            b.blt(sprite, fw, 0, fw, fh, drawX, drawY, sw, sh);
            if (ctx) ctx.restore();
            if (b._setDirty) b._setDirty();
        } else {
            text(b, '…', cx - 20, drawY, 40, 40, 24, '#e8c77b', 'center', true);
        }

        // Approximate right ankle location on the front-facing 48x48 character frame.
        // The device is shown only during the 777 clue, and after the player finds it.
        var ankleX = cx + sw * 0.105;
        var ankleY = baseY - sh * 0.105;
        var deviceW = Math.max(9, sw * 0.105);
        var deviceH = Math.max(5, sh * 0.055);

        if (vibrating) {
            var pulse = (this._anim % 8) / 8;
            var j = Math.sin(this._anim * 2.6) * Math.max(1.5, sw * 0.018);
            // Dark ankle strap and a small warm indicator make the clue readable at game scale.
            fillRoundRect(b, ankleX - deviceW / 2 + j, ankleY - deviceH / 2,
                deviceW, deviceH, 2, '#1c2028', '#e5c16b', 1.5);
            circle(b, ankleX + j, ankleY, Math.max(1.8, sw * 0.012), '#ffcf55', '#fff0b0', 1);
            // Bright paired vibration marks, localized at the ankle; torso/head stay still.
            var mark = Math.max(7, sw * 0.075);
            var spread = Math.max(3, sw * 0.035);
            var c = b._context;
            if (c) {
                c.save();
                c.lineCap = 'round';
                c.lineJoin = 'round';
                c.strokeStyle = pulse < 0.5 ? '#ffe07a' : '#f3a64c';
                c.lineWidth = Math.max(2.5, sw * 0.018);
                c.beginPath();
                c.moveTo(ankleX - deviceW * 0.8 - spread, ankleY - mark);
                c.lineTo(ankleX - deviceW * 0.8 - spread * 1.7, ankleY - mark * 0.45);
                c.lineTo(ankleX - deviceW * 0.8 - spread, ankleY);
                c.lineTo(ankleX - deviceW * 0.8 - spread * 1.7, ankleY + mark * 0.45);
                c.lineTo(ankleX - deviceW * 0.8 - spread, ankleY + mark);
                c.moveTo(ankleX + deviceW * 0.8 + spread, ankleY - mark);
                c.lineTo(ankleX + deviceW * 0.8 + spread * 1.7, ankleY - mark * 0.45);
                c.lineTo(ankleX + deviceW * 0.8 + spread, ankleY);
                c.lineTo(ankleX + deviceW * 0.8 + spread * 1.7, ankleY + mark * 0.45);
                c.lineTo(ankleX + deviceW * 0.8 + spread, ankleY + mark);
                c.stroke();
                c.restore();
                if (b._setDirty) b._setDirty();
            }
        }

        if (inspecting && this._phase === 'success') {
            fillRoundRect(b, ankleX - deviceW / 2, ankleY - deviceH / 2,
                deviceW, deviceH, 2, '#1c2028', '#e5c16b', 1.5);
            circle(b, ankleX, ankleY, Math.max(1.8, sw * 0.012), '#e95b45', '#ffdb9a', 1);
        }

        // Search target covers the lower-right leg/ankle, not the armpit or torso.
        return {
            head: { x: cx - sw * 0.34, y: drawY, w: sw * 0.68, h: sh * 0.32 },
            arms: { x: cx - sw * 0.43, y: drawY + sh * 0.30, w: sw * 0.86, h: sh * 0.30 },
            body: { x: cx - sw * 0.30, y: drawY + sh * 0.30, w: sw * 0.60, h: sh * 0.34 },
            leftLeg: { x: cx - sw * 0.30, y: drawY + sh * 0.63, w: sw * 0.25, h: sh * 0.34 },
            rightLeg: { x: cx + sw * 0.035, y: drawY + sh * 0.63, w: sw * 0.28, h: sh * 0.35 }
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
                this.drawMachine(b, x, y, cardW, cardH, i, i === segment, i === 2);
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
            text(b, segment === 2 ? 'Следите за шулером' : 'Наблюдайте за игрой', 0, y + cardH + 42, W, 28, 17, '#c8a978', 'center', false);

            this.drawCharacter(b, charX, H * 0.955, Math.min(W / 820, H / 720) * 0.82, false);
        } else if (this._phase === 'inspect' || this._phase === 'success') {
            // Inspection stage uses a quiet spotlight so the whole figure is easy to read.
            var c = b._context;
            if (c) {
                c.save();
                var glow = c.createRadialGradient(W / 2, H * .53, 20, W / 2, H * .53, Math.max(W, H) * .48);
                glow.addColorStop(0, 'rgba(230,174,82,.15)');
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = glow; c.fillRect(0, 76, W, H - 76); c.restore();
                if (b._setDirty) b._setDirty();
            }
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
        } else if (this._phase === 'inspect') {
            this._anim += 1;
            if (this._anim % 6 === 0) this.redraw();
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
