/*:
 * @plugindesc Bitz Fantasy — Пульт 1: энергосеть ASTROLIT Control System (логическая разводка)
 * @author ASTROLIT GAMES
 *
 * @help
 * Команда:
 *   BF_PanelPuzzle1 start
 *
 * Игрок поворачивает сегменты трубопроводов/проводников на 90 градусов,
 * чтобы соединить источник питания слева с тремя выходными узлами справа.
 * Успех засчитывается только тогда, когда все три выхода реально достижимы
 * по взаимно соединённым контактам.
 *
 * Сохранена интеграция с iron_cliff и BF_QuestSystem:
 *   BF_Quest minigameresult CANCEL
 *   BF_Quest panel 1
 *
 * Установка:
 * 1. Сделайте копию старого BF_PanelPuzzle1.js.
 * 2. Замените его этим файлом (имя оставьте BF_PanelPuzzle1.js).
 * 3. Не меняйте команды события, если в них уже используется
 *    BF_PanelPuzzle1 start.
 */
(function() {
    'use strict';

    var C = {
        bg: '#06121c',
        panel: '#0b1d29',
        panel2: '#102b39',
        panel3: '#153747',
        brass: '#b77b3b',
        gold: '#e0a64f',
        text: '#f5e7c8',
        muted: '#9db3bd',
        cyan: '#59b7c9',
        green: '#63d5a0',
        red: '#e36d55',
        wireOff: '#304653',
        cell: '#0a1923',
        cellInner: '#102633'
    };

    // Направления: север, восток, юг, запад.
    var DIRS = [
        { x: 0, y: -1, opposite: 2 },
        { x: 1, y: 0, opposite: 3 },
        { x: 0, y: 1, opposite: 0 },
        { x: -1, y: 0, opposite: 1 }
    ];

    function cloneConnections(a) { return a.slice(); }

    function Scene_BFPanelPuzzle1() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFPanelPuzzle1.prototype = Object.create(Scene_Base.prototype);
    Scene_BFPanelPuzzle1.prototype.constructor = Scene_BFPanelPuzzle1;

    Scene_BFPanelPuzzle1.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._solved = false;
        this._moves = 0;
        this._sourceMapId = 0;
        this._sourceEventId = 0;
        this._cells = [];
        this._tileRects = [];
        this._layout = {};
        this._message = 'ПОВЕРНИТЕ СЕГМЕНТЫ И ПОДАЙТЕ ПИТАНИЕ НА ВСЕ 3 УЗЛА.';
        this._messageColor = C.muted;
        this._flash = 0;
    };

    Scene_BFPanelPuzzle1.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._sourceMapId = $gameMap ? $gameMap.mapId() : 0;
        this._sourceEventId = $gameMap && $gameMap._interpreter ?
            Number($gameMap._interpreter._eventId || 0) : 0;

        if (window.BF_QuestSystem && BF_QuestSystem.game) {
            BF_QuestSystem.game().minigameStart('BF_PanelPuzzle1', 'iron_cliff');
        }

        this._createPuzzle();
        this._createSprites();
        this._drawAll();
    };

    // Карта решения фиксированная; начальные повороты перемешиваются.
    // Условие победы проверяется по реальным соединениям, а не по паролю.
    Scene_BFPanelPuzzle1.prototype._createPuzzle = function() {
        var defs = [
            // Основная линия от источника к центральному узлу.
            {x:0,y:3,type:'straight',sol:1},
            {x:1,y:3,type:'relay',sol:1},
            {x:2,y:3,type:'tee',sol:0},
            {x:3,y:3,type:'tee',sol:2},
            {x:4,y:3,type:'relay',sol:1},
            {x:5,y:3,type:'straight',sol:1},
            {x:6,y:3,type:'end',sol:0}, // выход B
            // Верхняя ветка к выходу A.
            {x:2,y:2,type:'straight',sol:0},
            {x:2,y:1,type:'elbow',sol:1},
            {x:3,y:1,type:'straight',sol:1},
            {x:4,y:1,type:'straight',sol:1},
            {x:5,y:1,type:'elbow',sol:3},
            {x:5,y:0,type:'elbow',sol:1},
            {x:6,y:0,type:'end',sol:0}, // выход A
            // Нижняя ветка к выходу C.
            {x:3,y:4,type:'straight',sol:0},
            {x:3,y:5,type:'elbow',sol:0},
            {x:4,y:5,type:'straight',sol:1},
            {x:5,y:5,type:'straight',sol:1},
            {x:6,y:5,type:'elbow',sol:2},
            {x:6,y:6,type:'end',sol:1}, // выход C
            // Ложные ответвления: добавляют варианты маршрутизации.
            {x:0,y:0,type:'elbow',sol:1},
            {x:1,y:0,type:'straight',sol:1},
            {x:1,y:1,type:'elbow',sol:2},
            {x:0,y:5,type:'elbow',sol:3},
            {x:1,y:5,type:'straight',sol:0},
            {x:1,y:6,type:'elbow',sol:0},
            {x:4,y:6,type:'straight',sol:1},
            {x:4,y:0,type:'elbow',sol:2},
            {x:6,y:2,type:'elbow',sol:2},
            {x:5,y:6,type:'elbow',sol:3}
        ];
        this._cells = [];
        for (var y = 0; y < 7; y++) {
            this._cells[y] = [];
            for (var x = 0; x < 7; x++) this._cells[y][x] = null;
        }
        for (var i = 0; i < defs.length; i++) {
            var d = defs[i];
            var rot = Math.floor(Math.random() * 4);
            if (d.type === 'straight') rot = Math.floor(Math.random() * 2);
            // Не используем случайный поворот, совпавший с решением.
            if (rot === d.sol) rot = (rot + 1) % 4;
            this._cells[d.y][d.x] = {
                x:d.x, y:d.y, type:d.type, rot:rot, solution:d.sol,
                powered:false,
                output:(d.x === 6 && (d.y === 0 || d.y === 3 || d.y === 6)),
                relay:(d.type === 'relay'),
                relayReady:false
            };
        }
        this._defs = defs;
        this._recalculatePower();
        // Защита от редкого случайного стартового состояния, уже решённого связями.
        if (this._allOutputsPowered()) {
            for (var j = 0; j < defs.length; j++) {
                var c = this._cells[defs[j].y][defs[j].x];
                c.rot = (c.rot + 1) % 4;
            }
            this._recalculatePower();
        }
    };

    Scene_BFPanelPuzzle1.prototype._createSprites = function() {
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        this._background = new Sprite(new Bitmap(w, h));
        this.addChild(this._background);

        this._frame = new Sprite(new Bitmap(w, h));
        this.addChild(this._frame);

        this._boardSprite = new Sprite(new Bitmap(w, h));
        this.addChild(this._boardSprite);

        this._hud = new Sprite(new Bitmap(w, h));
        this.addChild(this._hud);

        this._layout = this._calculateLayout();
    };

    Scene_BFPanelPuzzle1.prototype._calculateLayout = function() {
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        // Reserve fixed space for the header and bottom status/help bars.
        // The 7x7 board must never extend underneath the HUD.
        var gap = 5;
        var maxBoardHeight = Math.max(7 * 30 + gap * 6, h - 265);
        var maxBoardWidth = Math.max(7 * 30 + gap * 6, w - 170);
        var cell = Math.floor(Math.min(58, (maxBoardHeight - gap * 6) / 7,
                                      (maxBoardWidth - gap * 6) / 7));
        cell = Math.max(30, cell);
        gap = Math.max(4, Math.floor(cell * 0.09));
        var total = cell * 7 + gap * 6;
        var boardTop = 132;
        // If the window is short, shrink tiles further rather than overlap the HUD.
        var bottomLimit = h - 142;
        if (boardTop + total > bottomLimit) {
            cell = Math.max(26, Math.floor((bottomLimit - boardTop - gap * 6) / 7));
            gap = Math.max(3, Math.floor(cell * 0.08));
            total = cell * 7 + gap * 6;
        }
        return {
            w:w, h:h, cell:cell, gap:gap, total:total,
            x:Math.floor((w-total)/2),
            y:boardTop,
            titleH:74
        };
    };

    Scene_BFPanelPuzzle1.prototype._drawAll = function() {
        this._drawBackground();
        this._drawFrame();
        this._drawBoard();
        this._drawHud();
    };

    Scene_BFPanelPuzzle1.prototype._drawBackground = function() {
        var b = this._background.bitmap, w = b.width, h = b.height;
        b.clear();
        b.gradientFillRect(0, 0, w, h, '#06111b', '#0d2c43', true);
        // Тонкие линии печатной платы на фоне.
        for (var x = 20; x < w; x += 48) {
            b.fillRect(x, 90, 1, h - 115, '#0e2633');
        }
        for (var y = 110; y < h; y += 48) {
            b.fillRect(0, y, w, 1, '#0b2330');
        }
        b.paintOpacity = 100;
    };

    Scene_BFPanelPuzzle1.prototype._drawFrame = function() {
        var b = this._frame.bitmap, w = b.width, h = b.height;
        b.clear();
        b.fillRect(8, 8, w - 16, 66, C.panel);
        b.fillRect(8, 8, w - 16, 2, C.gold);
        b.fillRect(8, 72, w - 16, 2, C.brass);
        b.fillRect(18, 18, 4, 46, C.cyan);
        b.fillRect(26, 82, w - 52, 1, C.brass);
        b.fillRect(20, h - 45, w - 40, 1, C.brass);
        // Угловые крепёжные элементы.
        var corners = [[18,18],[w-28,18],[18,h-28],[w-28,h-28]];
        for (var i = 0; i < corners.length; i++) {
            b.fillRect(corners[i][0], corners[i][1], 8, 8, C.brass);
            b.fillRect(corners[i][0]+2, corners[i][1]+2, 4, 4, C.gold);
        }
    };

    Scene_BFPanelPuzzle1.prototype._drawBoard = function() {
        var b = this._boardSprite.bitmap, l = this._layout;
        b.clear();
        var cell = l.cell, gap = l.gap;
        var boardW = l.total + 78;
        var boardX = Math.floor((l.w - boardW) / 2);
        var boardY = l.y - 22;
        b.fillRect(boardX, boardY, boardW, l.total + 48, '#071721');
        b.fillRect(boardX, boardY, boardW, 2, C.brass);
        b.fillRect(boardX, boardY + l.total + 46, boardW, 2, C.brass);

        // Подписи входа и трёх выходов.
        b.fontFace = 'GameFont';
        b.fontSize = 14;
        b.textColor = C.cyan;
        b.drawText('ИСТОЧНИК', boardX + 2, l.y + cell * 3 + gap * 3 + 18, 72, 20, 'center');
        b.textColor = C.gold;
        b.drawText('УЗЕЛ A', l.x + cell * 7 + gap * 6 + 4, l.y - 2, 66, 18, 'center');
        b.drawText('УЗЕЛ B', l.x + cell * 7 + gap * 6 + 4, l.y + 3 * (cell + gap), 66, 18, 'center');
        b.drawText('УЗЕЛ C', l.x + cell * 7 + gap * 6 + 4, l.y + 6 * (cell + gap), 66, 18, 'center');

        this._tileRects = [];
        for (var y = 0; y < 7; y++) {
            for (var x = 0; x < 7; x++) {
                var px = l.x + x * (cell + gap);
                var py = l.y + y * (cell + gap);
                var c = this._cells[y][x];
                this._tileRects.push({x:px,y:py,w:cell,h:cell,cell:c});
                b.fillRect(px, py, cell, cell, '#1b3947');
                b.fillRect(px + 2, py + 2, cell - 4, cell - 4, c ? C.cellInner : '#08141d');
                b.fillRect(px, py, cell, 2, c && c.powered ? C.cyan : '#34505d');
                b.fillRect(px, py + cell - 2, cell, 2, '#02080d');
                if (c) this._drawPipe(b, c, px, py, cell);
            }
        }
    };

    Scene_BFPanelPuzzle1.prototype._drawPipe = function(b, c, x, y, s) {
        var cx = x + Math.floor(s / 2), cy = y + Math.floor(s / 2);
        var dirs = this._connections(c);
        var reach = Math.floor(s * 0.37);
        var thick = Math.max(7, Math.floor(s * 0.13));
        var outer = c.powered ? C.cyan : '#526774';
        var inner = c.powered ? '#a9f2f4' : '#b77b3b';
        // Рисуем обводку проводника и внутреннюю латунную жилу.
        for (var i = 0; i < dirs.length; i++) {
            var d = DIRS[dirs[i]];
            var ex = cx + d.x * reach, ey = cy + d.y * reach;
            this._lineRect(b, cx, cy, ex, ey, thick + 5, '#020a10');
            this._lineRect(b, cx, cy, ex, ey, thick, outer);
            this._lineRect(b, cx, cy, ex, ey, Math.max(3, thick - 4), inner);
        }
        b.fillRect(cx - thick, cy - thick, thick * 2, thick * 2, outer);
        b.fillRect(cx - Math.max(3, thick-4), cy - Math.max(3, thick-4),
            Math.max(6, thick*2-8), Math.max(6, thick*2-8), inner);

        if (c.type === 'end') {
            var d0 = DIRS[dirs[0]];
            var ex0 = cx + d0.x * reach, ey0 = cy + d0.y * reach;
            b.fillRect(ex0 - 5, ey0 - 5, 10, 10, c.powered ? C.green : C.gold);
        }
        if (c.relay) {
            // Реле: латунный корпус и центральный индикатор блокировки.
            b.fillRect(x + 7, y + 7, s - 14, s - 14, '#07121b');
            b.fillRect(x + 9, y + 9, s - 18, s - 18, c.powered && c.rot === c.solution ? C.green : C.brass);
            b.fillRect(cx - 3, cy - 3, 6, 6, c.powered && c.rot === c.solution ? '#e8fff4' : '#402b17');
        }
        if (c.output) {
            b.fillRect(x + 5, y + 5, 7, 7, c.powered ? C.green : C.red);
        }
    };

    Scene_BFPanelPuzzle1.prototype._lineRect = function(b, x1, y1, x2, y2, thick, color) {
        if (x1 === x2) {
            b.fillRect(x1 - Math.floor(thick/2), Math.min(y1,y2), thick, Math.abs(y2-y1), color);
        } else {
            b.fillRect(Math.min(x1,x2), y1 - Math.floor(thick/2), Math.abs(x2-x1), thick, color);
        }
    };

    Scene_BFPanelPuzzle1.prototype._drawHud = function() {
        var b = this._hud.bitmap, w = b.width, h = b.height, l = this._layout;
        b.clear();
        b.fontFace = 'GameFont';
        b.fontSize = 26;
        b.textColor = C.text;
        b.drawText('ПУЛЬТ 1  /  ЭНЕРГОСЕТЬ', 34, 19, Math.floor(w*0.58), 38, 'left');
        b.fontSize = 14;
        b.textColor = C.gold;
        b.drawText('ASTROLIT  •  CONTROL SYSTEM', 36, 48, Math.floor(w*0.5), 20, 'left');

        // Кнопка выхода.
        var ex = w - 116;
        b.fillRect(ex, 20, 92, 34, C.brass);
        b.fillRect(ex + 2, 22, 88, 30, C.panel2);
        b.fontSize = 18;
        b.textColor = C.text;
        b.drawText('ВЫХОД', ex + 2, 23, 88, 28, 'center');

        b.fontSize = 16;
        b.textColor = C.muted;
        b.drawText('ПОВОРАЧИВАЙТЕ СЕГМЕНТЫ • ПИТАНИЕ 3 УЗЛОВ + 2 РЕЛЕ', 20, 88, w - 40, 26, 'center');

        // Индикатор сети и счётчик ходов.
        var powered = 0;
        if (this._cells[0][6] && this._cells[0][6].powered) powered++;
        if (this._cells[3][6] && this._cells[3][6].powered) powered++;
        if (this._cells[6][6] && this._cells[6][6].powered) powered++;
        var statusY = h - 116;
        b.fillRect(30, statusY, w - 60, 34, '#081923');
        b.fillRect(30, statusY, 4, 34, this._allOutputsPowered() ? C.green : C.brass);
        b.fontSize = 18;
        b.textColor = this._allOutputsPowered() ? C.green : C.gold;
        var relaysOn = 0;
        for (var ry = 0; ry < 7; ry++) for (var rx = 0; rx < 7; rx++) {
            var rc = this._cells[ry][rx];
            if (rc && rc.type === 'relay' && rc.powered && rc.rot === rc.solution) relaysOn++;
        }
        b.drawText('УЗЛЫ: ' + powered + '/3   РЕЛЕ: ' + relaysOn + '/2', 44, statusY + 3, Math.floor(w*0.54), 28, 'left');
        b.textColor = C.muted;
        b.drawText('ПОВОРОТОВ: ' + this._moves, Math.floor(w*0.60), statusY + 3, Math.floor(w*0.33), 28, 'right');

        b.fontSize = 14;
        b.textColor = C.muted;
        b.drawText('ENTER — проверить сеть    •    ESC — отмена', 20, h - 37, w - 40, 24, 'center');

        // Сообщение состояния.
        b.fillRect(30, h - 75, w - 60, 28, '#0b202c');
        b.fillRect(30, h - 75, 3, 28, this._messageColor);
        b.fontSize = 16;
        b.textColor = this._messageColor;
        b.drawText(this._message, 42, h - 73, w - 84, 24, 'center');
    };

    Scene_BFPanelPuzzle1.prototype._connections = function(c) {
        var base;
        if (c.type === 'straight') base = [0,2];
        else if (c.type === 'elbow') base = [0,1];
        else if (c.type === 'tee') base = [0,1,3];
        else if (c.type === 'relay') base = [0,2];
        else base = [3];
        var result = [];
        for (var i = 0; i < base.length; i++) result.push((base[i] + c.rot) % 4);
        return result;
    };

    Scene_BFPanelPuzzle1.prototype._recalculatePower = function() {
        for (var y = 0; y < 7; y++) {
            for (var x = 0; x < 7; x++) {
                if (this._cells[y][x]) this._cells[y][x].powered = false;
            }
        }
        var start = this._cells[3][0];
        if (!start) return;
        var queue = [{x:0,y:3}];
        start.powered = true;
        while (queue.length) {
            var p = queue.shift();
            var cur = this._cells[p.y][p.x];
            var dirs = this._connections(cur);
            for (var i = 0; i < dirs.length; i++) {
                var d = DIRS[dirs[i]];
                var nx = p.x + d.x, ny = p.y + d.y;
                if (nx < 0 || nx >= 7 || ny < 0 || ny >= 7) continue;
                var next = this._cells[ny][nx];
                if (!next || next.powered) continue;
                // Реле работает только в правильном положении: это не декоративная плитка.
                if (next.type === 'relay' && next.rot !== next.solution) continue;
                if (cur.type === 'relay' && cur.rot !== cur.solution) continue;
                var ndirs = this._connections(next);
                if (ndirs.indexOf(d.opposite) >= 0) {
                    next.powered = true;
                    queue.push({x:nx,y:ny});
                }
            }
        }
    };

    Scene_BFPanelPuzzle1.prototype._allOutputsPowered = function() {
        var outputs = !!(this._cells[0][6] && this._cells[0][6].powered &&
                         this._cells[3][6] && this._cells[3][6].powered &&
                         this._cells[6][6] && this._cells[6][6].powered);
        var relays = true;
        for (var y = 0; y < 7; y++) {
            for (var x = 0; x < 7; x++) {
                var c = this._cells[y][x];
                if (c && c.type === 'relay' && (!c.powered || c.rot !== c.solution)) relays = false;
            }
        }
        return outputs && relays;
    };

    Scene_BFPanelPuzzle1.prototype._rotateAt = function(x, y) {
        if (this._solved) return;
        for (var i = 0; i < this._tileRects.length; i++) {
            var r = this._tileRects[i];
            if (r.cell && x >= r.x && x <= r.x+r.w && y >= r.y && y <= r.y+r.h) {
                r.cell.rot = (r.cell.rot + 1) % 4;
                this._moves++;
                this._recalculatePower();
                if (window.SoundManager) SoundManager.playCursor();
                if (this._allOutputsPowered()) {
                    this._message = 'ВСЕ УЗЛЫ ПОЛУЧИЛИ ПИТАНИЕ. СЕТЬ СТАБИЛЬНА.';
                    this._messageColor = C.green;
                    this._drawBoard();
                    this._drawHud();
                    this._success();
                } else {
                    var count = 0;
                    if (this._cells[0][6].powered) count++;
                    if (this._cells[3][6].powered) count++;
                    if (this._cells[6][6].powered) count++;
                    this._message = count > 0 ? 'ЧАСТЬ СЕТИ ЗАПИТАНА. НАЙДИТЕ ОБА РАБОЧИХ РЕЛЕ.' :
                        'ЦЕПЬ РАЗОРВАНА ИЛИ РЕЛЕ ЗАБЛОКИРОВАНО.';
                    this._messageColor = count > 0 ? C.cyan : C.muted;
                    this._drawBoard();
                    this._drawHud();
                }
                return;
            }
        }
    };

    Scene_BFPanelPuzzle1.prototype._success = function() {
        if (this._solved) return;
        this._solved = true;
        this._message = 'ЭНЕРГОСЕТЬ ВОССТАНОВЛЕНА!';
        this._messageColor = C.green;
        this._drawHud();
        if (window.SoundManager) SoundManager.playOk();
        var self = this;
        setTimeout(function() {
            if (window.$gameMap && self._sourceEventId) {
                $gameSelfSwitches.setValue([self._sourceMapId, self._sourceEventId, 'A'], true);
            }
            if (window.$gameMessage) $gameMessage.add('Энергосеть восстановлена. Пульт отключён.');
            if (window.BF_QuestSystem && BF_QuestSystem.game) {
                BF_QuestSystem.game().minigameResult('CANCEL');
                BF_QuestSystem.game().panel('1');
                // Сохраняем существующую привязку проекта.
                $gameSelfSwitches.setValue([25, 2, 'A'], true);
            }
            SceneManager.pop();
        }, 650);
    };

    Scene_BFPanelPuzzle1.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            if (window.BF_QuestSystem && BF_QuestSystem.game) {
                BF_QuestSystem.game().minigameResult('CANCEL');
            }
            SceneManager.pop();
            return;
        }
        if (this._solved) return;

        if (Input.isTriggered('ok')) {
            if (this._allOutputsPowered()) this._success();
            else {
                this._message = 'НУЖНЫ 3 УЗЛА И 2 РЕЛЕ. ПРОВЕРЬТЕ ЦЕПЬ.';
                this._messageColor = C.red;
                if (window.SoundManager) SoundManager.playBuzzer();
                this._drawHud();
            }
        }

        if (TouchInput.isTriggered()) {
            var x = TouchInput.x, y = TouchInput.y;
            var exitX = Graphics.boxWidth - 116;
            if (x >= exitX && x <= exitX + 92 && y >= 20 && y <= 54) {
                if (window.SoundManager) SoundManager.playCancel();
                if (window.BF_QuestSystem && BF_QuestSystem.game) {
                    BF_QuestSystem.game().minigameResult('CANCEL');
                }
                SceneManager.pop();
                return;
            }
            this._rotateAt(x, y);
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() === 'bf_panelpuzzle1' &&
            String(args[0] || '').toLowerCase() === 'start') {
            if (!window.BF_QuestSystem || !BF_QuestSystem.game) return;
            var q = BF_QuestSystem.game().get('iron_cliff');
            var panels = BF_QuestSystem.game().getPanels ?
                BF_QuestSystem.game().getPanels() : {};
            if (!q || q.status !== 'active' || Number(q.step) !== 4) {
                $gameMessage.add('Пока не время отключать этот пульт.');
                return;
            }
            if (panels['1']) {
                $gameMessage.add('Этот пульт уже отключён.');
                return;
            }
            SceneManager.push(Scene_BFPanelPuzzle1);
        }
    };

    window.Scene_BFPanelPuzzle1 = Scene_BFPanelPuzzle1;
})();
