//=============================================================================
// ACTPO_HackingPuzzle_Simple.js
//=============================================================================

/*:
 * @plugindesc v1.0 "Соедини Трубы" [ACTPO]
 * @author ACTPO
 *
 * @param Grid Size X
 * @default 6
 *
 * @param Grid Size Y
 * @default 4
 *
 * @param Cell Size
 * @default 60
 *
 * @param Enable Timer
 * @default false
 *
 * @help
 * Игра "Соедини Трубы":
 * - Соедините S (старт) с E (финиш)
 * - Кликайте по элементам чтобы повернуть их
 * - Простая головоломка с трубами
 */

function Scene_HackingPuzzle() {
    this.initialize.apply(this, arguments);
}

Scene_HackingPuzzle.prototype = Object.create(Scene_Base.prototype);
Scene_HackingPuzzle.prototype.constructor = Scene_HackingPuzzle;

Scene_HackingPuzzle.prototype.initialize = function () {
    Scene_Base.prototype.initialize.call(this);
};

Scene_HackingPuzzle.prototype.prepare = function (levelId, successVar) {
    this._levelId = levelId;
    this._successVar = successVar;
    this._tileSize = 30;
    this._grid = [];
    this._solved = false;
    this._timeLeft = 999; // Большое время или отключаем таймер
    this._moves = 0;
    this.initGrid();
};

Scene_HackingPuzzle.prototype.initGrid = function () {
    const layouts = {
        1: { // Простой уровень 6x4
            grid: [
                ['S', 'I', 'L', 'E'],
                [' ', ' ', 'T', ' '],
                [' ', 'I', 'L', ' '],
                [' ', ' ', ' ', ' ']
            ],
            time: 999
        },
        2: { // Средний уровень 8x5
            grid: [
                ['S', 'I', 'L', ' ', 'I', 'L', 'I', ' '],
                [' ', ' ', 'T', ' ', 'L', ' ', 'T', ' '],
                [' ', 'I', 'L', 'I', 'L', ' ', 'I', 'E'],
                [' ', ' ', ' ', 'T', 'L', 'I', 'L', ' '],
                [' ', ' ', ' ', ' ', ' ', 'T', 'L', ' ']
            ],
            time: 999
        },
        3: { // Сложный уровень 10x6
            grid: [
                ['S', 'I', 'L', ' ', 'I', 'L', 'I', ' ', 'T', 'E'],
                [' ', 'T', 'L', 'I', 'L', ' ', 'T', ' ', 'L', ' '],
                [' ', 'I', 'L', 'I', 'L', 'I', 'L', 'I', 'L', ' '],
                [' ', 'L', ' ', 'T', 'L', ' ', 'T', ' ', 'L', ' '],
                [' ', 'I', 'L', 'I', 'L', 'I', 'L', 'I', 'L', ' '],
                [' ', ' ', ' ', 'T', 'L', ' ', 'T', ' ', 'L', ' ']
            ],
            time: 999
        }
    };

    const levelData = layouts[this._levelId] || layouts[1];
    this._timeLeft = levelData.time;
    
    const layout = levelData.grid;
    this._gridH = layout.length;
    this._gridW = layout[0].length;

    // Рассчитываем размер плитки под экран (без заголовка)
    const maxWidth = Graphics.width - 60;
    const maxHeight = Graphics.height - 120;
    const sizeByW = Math.floor(maxWidth / this._gridW);
    const sizeByH = Math.floor(maxHeight / this._gridH);
    this._tileSize = Math.min(35, sizeByW, sizeByH);
    // Минимальный размер для читаемости
    this._tileSize = Math.max(25, this._tileSize);

    for (let y = 0; y < this._gridH; y++) {
        this._grid[y] = [];
        for (let x = 0; x < this._gridW; x++) {
            const char = layout[y][x];
            if (char === ' ') {
                this._grid[y][x] = null;
                continue;
            }
            this._grid[y][x] = {
                type: char,
                rotation: Math.floor(Math.random() * 4) * 90,
                connected: false
            };

            if (char === 'S') this._grid[y][x].rotation = 0;
            if (char === 'E') this._grid[y][x].rotation = 0;
        }
    }
    this.checkSolution();
};

Scene_HackingPuzzle.prototype.create = function () {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
    this.createWindowLayer();
    this.createGridWindow();
    this.createInfoWindow();
};

Scene_HackingPuzzle.prototype.createBackground = function () {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this.addChild(this._backgroundSprite);

    this._overlay = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    const bitmap = this._overlay.bitmap;
    bitmap.fillRect(0, 0, Graphics.width, Graphics.height, 'rgba(0, 0, 0, 0.8)');
    this.addChild(this._overlay);
};



Scene_HackingPuzzle.prototype.createInfoWindow = function () {
    const w = 320;
    const h = 40;
    const x = Math.max(20, (Graphics.width - w) / 2);
    const y = Graphics.height - 45;
    this._infoWindow = new Window_Base(x, y, w, h);
    this._infoWindow.opacity = 0;
    this.addWindow(this._infoWindow);
    this.refreshInfo();
};

Scene_HackingPuzzle.prototype.refreshInfo = function () {
    this._infoWindow.contents.clear();
    this._infoWindow.contents.fontSize = 14;
    this._infoWindow.changeTextColor('#ffffff');
    this._infoWindow.drawText("Соедините S с E | Кликните по элементам", 0, 0, 320, 'center');
};

Scene_HackingPuzzle.prototype.createGridWindow = function () {
    const w = this._gridW * this._tileSize + 40;
    const h = this._gridH * this._tileSize + 40;
    const x = Math.max(20, (Graphics.width - w) / 2);
    const y = Math.max(30, (Graphics.height - h) / 2 - 10);

    this._gridWindow = new Window_HackingGrid(x, y, w, h);
    this._gridWindow.setHandler('ok', this.onGridOk.bind(this));
    this._gridWindow.setHandler('cancel', this.onCancel.bind(this));
    this._gridWindow.setup(this._grid, this._tileSize);
    this.addWindow(this._gridWindow);
};

Scene_HackingPuzzle.prototype.onGridOk = function () {
    this._moves++;
    this.checkSolution();
    this._gridWindow.refresh();

    if (this._solved) {
        this.onSolved();
    } else {
        SoundManager.playCursor();
    }
};

Scene_HackingPuzzle.prototype.onSolved = function () {
    SoundManager.playOk();
    $gameVariables.setValue(this._successVar, 1);
    setTimeout(() => this.popScene(), 500);
};

Scene_HackingPuzzle.prototype.onCancel = function () {
    $gameVariables.setValue(this._successVar, 2);
    this.popScene();
};

Scene_HackingPuzzle.prototype.update = function () {
    Scene_Base.prototype.update.call(this);
};

Scene_HackingPuzzle.prototype.checkSolution = function () {
    for (let y = 0; y < this._gridH; y++) {
        for (let x = 0; x < this._gridW; x++) {
            if (this._grid[y][x]) this._grid[y][x].connected = false;
        }
    }

    let startX, startY;
    for (let y = 0; y < this._gridH; y++) {
        for (let x = 0; x < this._gridW; x++) {
            if (this._grid[y][x] && this._grid[y][x].type === 'S') {
                startX = x; startY = y;
            }
        }
    }

    const visited = new Set();
    this.tracePath(startX, startY, visited);
};

Scene_HackingPuzzle.prototype.tracePath = function (x, y, visited) {
    const key = `${x},${y}`;
    if (visited.has(key)) return;
    visited.add(key);

    const tile = this._grid[y][x];
    if (!tile) return;
    if (tile.type === 'B') return;

    tile.connected = true;

    if (tile.type === 'E') {
        this._solved = true;
        return;
    }

    const dirs = [[0, -1, 'U'], [0, 1, 'D'], [-1, 0, 'L'], [1, 0, 'R']];
    for (const [dx, dy, dir] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this._gridW && ny >= 0 && ny < this._gridH) {
            if (this.canConnect(x, y, nx, ny, dir)) {
                this.tracePath(nx, ny, visited);
            }
        }
    }
};

Scene_HackingPuzzle.prototype.canConnect = function (x1, y1, x2, y2, dir) {
    const t1 = this._grid[y1][x1];
    const t2 = this._grid[y2][x2];
    if (!t1 || !t2) return false;
    const opDir = { 'U': 'D', 'D': 'U', 'L': 'R', 'R': 'L' }[dir];
    return this.hasOpening(t1, dir) && this.hasOpening(t2, opDir);
};

Scene_HackingPuzzle.prototype.hasOpening = function (tile, dir) {
    const rot = tile.rotation;
    const openings = {
        'S': { 0: ['R'], 90: ['D'], 180: ['L'], 270: ['U'] },
        'E': { 0: ['L'], 90: ['U'], 180: ['R'], 270: ['D'] },
        'I': { 0: ['L', 'R'], 90: ['U', 'D'], 180: ['L', 'R'], 270: ['U', 'D'] },
        'L': { 0: ['R', 'D'], 90: ['D', 'L'], 180: ['L', 'U'], 270: ['U', 'R'] },
        'T': { 0: ['L', 'R', 'D'], 90: ['U', 'D', 'L'], 180: ['L', 'R', 'U'], 270: ['U', 'D', 'R'] }
    };
    return openings[tile.type][rot].includes(dir);
};

// --- Window_HackingGrid ---

function Window_HackingGrid() {
    this.initialize.apply(this, arguments);
}

Window_HackingGrid.prototype = Object.create(Window_Selectable.prototype);
Window_HackingGrid.prototype.constructor = Window_HackingGrid;

Window_HackingGrid.prototype.initialize = function (x, y, w, h) {
    Window_Selectable.prototype.initialize.call(this, x, y, w, h);
    this._grid = [];
    this._tileSize = 30;
    this.activate();
};

Window_HackingGrid.prototype.setup = function (grid, tileSize) {
    this._grid = grid;
    this._tileSize = tileSize;
    this._gridW = grid[0].length;
    this._gridH = grid.length;
    this.refresh();
};

Window_HackingGrid.prototype.maxCols = function () { return this._gridW || 1; };
Window_HackingGrid.prototype.maxItems = function () { return (this._gridW * this._gridH) || 1; };
Window_HackingGrid.prototype.itemWidth = function () { return this._tileSize; };
Window_HackingGrid.prototype.itemHeight = function () { return this._tileSize; };

Window_HackingGrid.prototype.refresh = function () {
    if (this.contents) {
        this.contents.clear();
        this.drawAllItems();
    }
};

Window_HackingGrid.prototype.drawItem = function (index) {
    const x = index % this._gridW;
    const y = Math.floor(index / this._gridW);
    if (!this._grid || !this._grid[y]) return;
    const tile = this._grid[y][x];
    const rect = this.itemRect(index);

    if (!tile) return;

    // Фон
    this.contents.fillRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2, '#1a1a2e');

    // Подсветка соединённых элементов
    if (tile.connected) {
        this.contents.fillRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2, 'rgba(0, 255, 0, 0.3)');
    }

    const pipeColor = tile.connected ? '#00ff00' : '#ffffff';
    this.drawPipe(rect.x + rect.width / 2, rect.y + rect.height / 2, tile, pipeColor);

    // Метки
    this.contents.fontSize = 16;
    if (tile.type === 'S') {
        this.changeTextColor('#00ffff');
        this.drawText("S", rect.x, rect.y, rect.width, 'center');
    }
    if (tile.type === 'E') {
        this.changeTextColor('#ff0000');
        this.drawText("E", rect.x, rect.y, rect.width, 'center');
    }
    this.resetTextColor();
};

Window_HackingGrid.prototype.drawPipe = function (cx, cy, tile, color) {
    const ctx = this.contents.context;
    const size = this._tileSize / 5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((tile.rotation * Math.PI) / 180);

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, this._tileSize / 12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    switch (tile.type) {
        case 'I':
            ctx.moveTo(-size * 2.5, 0); ctx.lineTo(size * 2.5, 0);
            break;
        case 'L':
            ctx.moveTo(size * 2.5, 0); ctx.lineTo(0, 0); ctx.lineTo(0, size * 2.5);
            break;
        case 'T':
            ctx.moveTo(-size * 2.5, 0); ctx.lineTo(size * 2.5, 0);
            ctx.moveTo(0, 0); ctx.lineTo(0, size * 2.5);
            break;
        case 'S':
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(size * 2.5, 0);
            break;
        case 'E':
            // Увеличиваем размер точки E для лучшей видимости
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-size * 1.2, -size * 1.2, size * 2.4, size * 2.4);
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-size * 2.5, 0);
            break;
    }

    ctx.stroke();
    ctx.restore();
};

Window_HackingGrid.prototype.processOk = function () {
    const index = this.index();
    if (!this._grid) return;
    const x = index % this._gridW;
    const y = Math.floor(index / this._gridW);

    if (this._grid[y] && this._grid[y][x]) {
        const tile = this._grid[y][x];
        if (tile.type !== 'S' && tile.type !== 'E') {
            tile.rotation = (tile.rotation + 90) % 360;
            this.updateInputData();
            this.callOkHandler();
        }
    }
};

const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'ACTPO_Hacking' || command === 'ACTPO_Pipes') {
        if (args[0] === 'start') {
            const levelId = Number(args[1] || 1);
            const varId = Number(args[2] || 0);
            SceneManager.push(Scene_HackingPuzzle);
            SceneManager.prepareNextScene(levelId, varId);
        }
    }
};