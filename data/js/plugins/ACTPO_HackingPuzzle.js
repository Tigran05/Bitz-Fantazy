//=============================================================================
// ACTPO_HackingPuzzle_Enhanced.js
//=============================================================================

/*:
 * @plugindesc v3.0 "Цифровой Взлом" (Enhanced Hard Mode) [ACTPO]
 * @author ACTPOJIuT 
 *
 * @param Grid Size X
 * @default 6
 *
 * @param Grid Size Y
 * @default 4
 *
 * @param Cell Size
 * @default 54
 *
 * @param Enable Timer
 * @default true
 *
 * @param Enable Scoring
 * @default true
 *
 * @help
 * v3.0 Changes:
 * - Добавлено 10 уровней разной сложности
 * - Новые элементы: Контроллеры (C), Порталы (P), Переключатели (W)
 * - Система подсчёта очков
 * - Улучшенная визуализация и анимации
 * - Звуковые эффекты
 * - Блокировки (L) - требуют активации контроллера
 * - Множественные пути и стратегические решения
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
    this._tileSize = 54;
    this._grid = [];
    this._solved = false;
    this._timeLeft = 180;
    this._moves = 0;
    this._startTime = Date.now();
    this.initGrid();
};

Scene_HackingPuzzle.prototype.initGrid = function () {
    const layouts = {
        1: { // Один сложный уровень - 12x12 с множеством элементов
            grid: [
                ['S', 'L', 'L', 'I', 'T', 'I', 'C', 'I', 'L', 'I', 'T', 'E'],
                ['I', 'T', 'I', 'L', 'I', 'P', 'I', 'L', 'I', 'T', 'I', 'I'],
                ['L', 'I', 'C', 'I', 'T', 'I', 'L', 'I', 'C', 'I', 'T', 'I'],
                ['I', 'P', 'I', 'T', 'I', 'L', 'I', 'C', 'I', 'P', 'I', 'L'],
                ['I', 'I', 'L', 'I', 'C', 'I', 'T', 'I', 'L', 'I', 'C', 'I'],
                ['C', 'I', 'T', 'I', 'L', 'I', 'P', 'I', 'T', 'I', 'L', 'I'],
                ['I', 'L', 'I', 'C', 'I', 'T', 'I', 'L', 'I', 'C', 'I', 'T'],
                ['T', 'I', 'P', 'I', 'L', 'I', 'C', 'I', 'T', 'I', 'P', 'I'],
                ['I', 'C', 'I', 'L', 'I', 'T', 'I', 'P', 'I', 'L', 'I', 'C'],
                ['L', 'I', 'T', 'I', 'C', 'I', 'L', 'I', 'T', 'I', 'C', 'I'],
                ['I', 'P', 'I', 'C', 'I', 'L', 'I', 'T', 'I', 'P', 'I', 'L'],
                ['I', 'I', 'L', 'I', 'T', 'I', 'C', 'I', 'L', 'I', 'T', 'I']
            ],
            time: 300,
            description: "СЛОЖНЫЙ ВЗЛОМ",
            endRotation: 180
        }
    };

    const levelData = layouts[this._levelId] || layouts[1];
    this._timeLeft = levelData.time;
    if (!this._timeLeft || isNaN(this._timeLeft)) this._timeLeft = 300;

    this._description = levelData.description;
    const layout = levelData.grid;
    this._gridH = layout.length;
    this._gridW = layout[0].length;

    // Dynamic Tile Size based on grid size
    const maxWidth = Graphics.width - 40;
    const maxHeight = Graphics.height - 100; // Уменьшили, учитывая меньший заголовок
    const sizeByW = Math.floor(maxWidth / this._gridW);
    const sizeByH = Math.floor(maxHeight / this._gridH);
    this._tileSize = Math.min(54, sizeByW, sizeByH);
    if (this._tileSize < 16) this._tileSize = 16; // Уменьшили минимум до 16

    const endRot = (levelData.endRotation !== undefined) ? levelData.endRotation : 0;

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
                connected: false,
                locked: false, // For locked blocks
                activated: false // For controllers and switches
            };

            // Set initial rotations for special elements
            if (char === 'S') this._grid[y][x].rotation = 0;
            if (char === 'E') this._grid[y][x].rotation = endRot;
            if (char === 'B') this._grid[y][x].rotation = 0;
            if (char === 'L') this._grid[y][x].locked = true; // Locked blocks
        }
    }
    
    // Randomize initial rotations for all rotatable elements
    this.randomizeRotations();
    this.checkSolution();
};

Scene_HackingPuzzle.prototype.randomizeRotations = function() {
    // Randomize rotations but ensure puzzle is not already solved
    let attempts = 0;
    do {
        for (let y = 0; y < this._gridH; y++) {
            for (let x = 0; x < this._gridW; x++) {
                const tile = this._grid[y][x];
                if (tile && tile.type !== 'S' && tile.type !== 'E' && tile.type !== 'B') {
                    if (tile.type === 'I' || tile.type === 'L' || tile.type === 'T' || tile.type === 'C' || tile.type === 'P' || tile.type === 'W') {
                        tile.rotation = Math.floor(Math.random() * 4) * 90;
                    }
                }
            }
        }
        this.checkSolution();
        attempts++;
    } while (this._solved && attempts < 10); // Max 10 attempts to avoid infinite loop
};

Scene_HackingPuzzle.prototype.create = function () {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
    this.createWindowLayer();
    this.createTitleWindow();
    this.createGridWindow();
    this.createTimerWindow();
    this.createScoreWindow();
};

Scene_HackingPuzzle.prototype.createBackground = function () {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this.addChild(this._backgroundSprite);

    this._overlay = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    const bitmap = this._overlay.bitmap;
    bitmap.fillRect(0, 0, Graphics.width, Graphics.height, 'rgba(0, 20, 40, 0.95)');
    this.addChild(this._overlay);
};

Scene_HackingPuzzle.prototype.createTitleWindow = function () {
    const w = 400; // Уменьшили ширину
    const h = 60; // Уменьшили высоту
    const x = (Graphics.width - w) / 2;
    this._titleWindow = new Window_Base(x, 10, w, h);
    this._titleWindow.opacity = 0;
    this.addWindow(this._titleWindow);
    this.refreshTitle();
};

Scene_HackingPuzzle.prototype.refreshTitle = function () {
    this._titleWindow.contents.clear();
    this._titleWindow.contents.fontSize = 28;
    this._titleWindow.changeTextColor('#00e5ff');
    this._titleWindow.drawText(this._description, 0, 0, 500, 'center');
    
    this._titleWindow.contents.fontSize = 16;
    this._titleWindow.changeTextColor('#88ff88');
    this._titleWindow.drawText(`Уровень ${this._levelId} | Ходы: ${this._moves}`, 0, 35, 500, 'center');
};

Scene_HackingPuzzle.prototype.createTimerWindow = function () {
    const w = 80;
    const h = 30; // Очень компактный размер
    const x = Graphics.width - w - 5;
    const y = 5; // В самом верху справа
    this._timerWindow = new Window_Base(x, y, w, h);
    this._timerWindow.opacity = 0;
    this.addWindow(this._timerWindow);
    this.refreshTimer();
};

Scene_HackingPuzzle.prototype.createScoreWindow = function () {
    const w = 120;
    const h = 40; // Уменьшили высоту
    const x = 10;
    const y = Graphics.height - h - 10; // Переместили в левый нижний угол
    this._scoreWindow = new Window_Base(x, y, w, h);
    this._scoreWindow.opacity = 0;
    this.addWindow(this._scoreWindow);
    this.refreshScore();
};

Scene_HackingPuzzle.prototype.refreshScore = function () {
    if (!this._scoreWindow) return;
    this._scoreWindow.contents.clear();
    this._scoreWindow.contents.fontSize = 20;
    this._scoreWindow.changeTextColor('#ffaa00');
    this._scoreWindow.drawText("СЧЁТ", 0, 0, 150, 'center');
    
    this._scoreWindow.contents.fontSize = 16;
    this._scoreWindow.changeTextColor('#ffffff');
    const currentScore = this.calculateScore();
    this._scoreWindow.drawText(currentScore.toString(), 0, 25, 150, 'center');
};

Scene_HackingPuzzle.prototype.refreshTimer = function () {
    if (!this._timerWindow) return;
    this._timerWindow.contents.clear();
    this._timerWindow.contents.fontSize = 16; // Еще меньше

    const timeColor = this._timeLeft < 30 ? '#ff4444' : '#44ff44';
    this._timerWindow.changeTextColor(timeColor);

    const m = Math.floor(Math.max(0, this._timeLeft) / 60);
    const s = Math.max(0, this._timeLeft) % 60;
    const timeText = `${m}:${s.toString().padStart(2, '0')}`;

    this._timerWindow.drawText(timeText, 0, 5, 80, 'center'); // Сдвинули и уменьшили область
};

Scene_HackingPuzzle.prototype.createGridWindow = function () {
    const w = this._gridW * this._tileSize + 20; // Уменьшили отступы
    const h = this._gridH * this._tileSize + 20;
    const x = (Graphics.width - w) / 2;
    const y = (Graphics.height - h) / 2 + 10; // Уменьшили смещение

    this._gridWindow = new Window_HackingGrid(x, y, w, h);
    this._gridWindow.setHandler('ok', this.onGridOk.bind(this));
    this._gridWindow.setHandler('cancel', this.onCancel.bind(this));
    this._gridWindow.setup(this._grid, this._tileSize, this); // Pass scene reference
    this.addWindow(this._gridWindow);
};

Scene_HackingPuzzle.prototype.onGridOk = function () {
    this._moves++;
    this.refreshTitle(); // Update move count in title
    this.refreshScore(); // Update score display
    this.checkSolution();
    this._gridWindow.refresh();

    if (this._solved) {
        this.onSolved();
    } else {
        SoundManager.playCursor();
    }
};

Scene_HackingPuzzle.prototype.onSolved = function () {
    const score = this.calculateScore();
    $gameVariables.setValue(this._successVar, score);
    
    // Play success sound and show score
    SoundManager.playOk();
    
    // Show completion message with score
    this.showCompletionMessage(score);
    
    setTimeout(() => this.popScene(), 2000);
};

Scene_HackingPuzzle.prototype.showCompletionMessage = function(score) {
    // Create a completion window
    const w = 500;
    const h = 150;
    const x = (Graphics.width - w) / 2;
    const y = (Graphics.height - h) / 2;
    
    this._completionWindow = new Window_Base(x, y, w, h);
    this._completionWindow.opacity = 0;
    this.addWindow(this._completionWindow);
    
    this._completionWindow.contents.clear();
    this._completionWindow.contents.fontSize = 24;
    this._completionWindow.changeTextColor('#00ff88');
    this._completionWindow.drawText("УРОВЕНЬ ПРОЙДЕН!", 0, 0, 500, 'center');
    
    this._completionWindow.contents.fontSize = 20;
    this._completionWindow.changeTextColor('#00e5ff');
    this._completionWindow.drawText(`Счёт: ${score}`, 0, 40, 500, 'center');
    this._completionWindow.drawText(`Ходы: ${this._moves}`, 0, 70, 500, 'center');
    this._completionWindow.drawText(`Время: ${Math.floor(this._timeLeft / 60)}:${(this._timeLeft % 60).toString().padStart(2, '0')}`, 0, 100, 500, 'center');
};

Scene_HackingPuzzle.prototype.onCancel = function () {
    $gameVariables.setValue(this._successVar, 2);
    this.popScene();
};

Scene_HackingPuzzle.prototype.update = function () {
    Scene_Base.prototype.update.call(this);

    if (this._timeLeft > 0 && !this._solved) {
        if ((Graphics.frameCount % 60) === 0) {
            this._timeLeft--;
            this.refreshTimer();
            this.refreshScore(); // Update score as time decreases
        }
        if (this._timeLeft <= 0) {
            this.onTimeUp();
        }
    }
};

Scene_HackingPuzzle.prototype.onTimeUp = function () {
    SoundManager.playBuzzer();
    $gameVariables.setValue(this._successVar, 3);
    setTimeout(() => this.popScene(), 1000);
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

    // Check if we can pass through locked blocks
    if (tile.type === 'L' && tile.locked) return;

    tile.connected = true;

    if (tile.type === 'E') {
        this._solved = true;
        return;
    }

    // Activate special elements
    if (tile.type === 'C') {
        this.activateController(x, y);
    } else if (tile.type === 'W') {
        this.activateSwitch(x, y);
    } else if (tile.type === 'P') {
        // Teleport through portal
        const portalPos = this.teleportThroughPortal(x, y);
        if (portalPos.x !== x || portalPos.y !== y) {
            this.tracePath(portalPos.x, portalPos.y, visited);
            return;
        }
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

Scene_HackingPuzzle.prototype.calculateScore = function() {
    const timeBonus = Math.max(0, this._timeLeft * 10);
    const movePenalty = this._moves * 5;
    const levelBonus = this._levelId * 100;
    
    // Bonus for using special elements effectively
    let specialBonus = 0;
    for (let y = 0; y < this._gridH; y++) {
        for (let x = 0; x < this._gridW; x++) {
            const tile = this._grid[y][x];
            if (tile && tile.connected) {
                if (tile.type === 'C' && tile.activated) specialBonus += 50;
                if (tile.type === 'W' && tile.activated) specialBonus += 30;
                if (tile.type === 'P') specialBonus += 25;
            }
        }
    }
    
    return Math.max(0, timeBonus + levelBonus + specialBonus - movePenalty);
};

Scene_HackingPuzzle.prototype.activateController = function (x, y) {
    const tile = this._grid[y][x];
    if (!tile || tile.type !== 'C') return;
    
    tile.activated = !tile.activated;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    
    for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this._gridW && ny >= 0 && ny < this._gridH) {
            const neighbor = this._grid[ny][nx];
            if (neighbor && neighbor.type !== 'S' && neighbor.type !== 'E' && neighbor.type !== 'B') {
                // Rotate neighboring elements
                neighbor.rotation = (neighbor.rotation + 90) % 360;
                
                // If it's a locked block, unlock it
                if (neighbor.type === 'L' && neighbor.locked) {
                    neighbor.locked = false;
                }
            }
        }
    }
    SoundManager.playCursor();
};

Scene_HackingPuzzle.prototype.activateSwitch = function (x, y) {
    const tile = this._grid[y][x];
    if (!tile || tile.type !== 'W') return;
    
    tile.activated = !tile.activated;
    
    // Switches affect all elements in the same row and column
    for (let i = 0; i < this._gridW; i++) {
        if (i !== x && this._grid[y][i] && this._grid[y][i].type !== 'S' && this._grid[y][i].type !== 'E' && this._grid[y][i].type !== 'B') {
            this._grid[y][i].rotation = (this._grid[y][i].rotation + 180) % 360; // Reverse rotation
        }
    }
    
    for (let i = 0; i < this._gridH; i++) {
        if (i !== y && this._grid[i][x] && this._grid[i][x].type !== 'S' && this._grid[i][x].type !== 'E' && this._grid[i][x].type !== 'B') {
            this._grid[i][x].rotation = (this._grid[i][x].rotation + 180) % 360; // Reverse rotation
        }
    }
    
    SoundManager.playCursor();
};

Scene_HackingPuzzle.prototype.teleportThroughPortal = function (x, y) {
    const tile = this._grid[y][x];
    if (!tile || tile.type !== 'P') return {x: x, y: y};
    
    // Find the other portal
    for (let py = 0; py < this._gridH; py++) {
        for (let px = 0; px < this._gridW; px++) {
            const otherTile = this._grid[py][px];
            if (otherTile && otherTile.type === 'P' && (px !== x || py !== y)) {
                return {x: px, y: py};
            }
        }
    }
    return {x: x, y: y}; // Return same position if no other portal found
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
        'T': { 0: ['L', 'R', 'D'], 90: ['U', 'D', 'L'], 180: ['L', 'R', 'U'], 270: ['U', 'D', 'R'] },
        'X': { 0: ['U', 'D', 'L', 'R'], 90: ['U', 'D', 'L', 'R'], 180: ['U', 'D', 'L', 'R'], 270: ['U', 'D', 'L', 'R'] },
        'B': { 0: [], 90: [], 180: [], 270: [] },
        'C': { 0: ['U', 'D', 'L', 'R'], 90: ['U', 'D', 'L', 'R'], 180: ['U', 'D', 'L', 'R'], 270: ['U', 'D', 'L', 'R'] },
        'P': { 0: ['L', 'R', 'U', 'D'], 90: ['L', 'R', 'U', 'D'], 180: ['L', 'R', 'U', 'D'], 270: ['L', 'R', 'U', 'D'] },
        'W': { 0: ['U', 'D', 'L', 'R'], 90: ['U', 'D', 'L', 'R'], 180: ['U', 'D', 'L', 'R'], 270: ['U', 'D', 'L', 'R'] },
        'L': { 0: ['U', 'D', 'L', 'R'], 90: ['U', 'D', 'L', 'R'], 180: ['U', 'D', 'L', 'R'], 270: ['U', 'D', 'L', 'R'] }
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
    this._tileSize = 54;
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

    // Draw Background
    if (tile.type === 'B') {
        this.contents.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, '#440000');
    } else if (tile.type === 'L' && tile.locked) {
        // Locked blocks
        this.contents.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, '#660000');
    } else {
        this.contents.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, 'rgba(0, 40, 60, 0.5)');
    }

    // Draw Connection Glow
    if (tile.connected) {
        this.contents.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, 'rgba(0, 229, 255, 0.2)');
    }

    const activeColor = tile.connected ? '#00e5ff' : '#2a5a6a';
    this.drawPipe(rect.x + rect.width / 2, rect.y + rect.height / 2, tile, activeColor, tile.connected);

    // Labels and special indicators
    this.contents.fontSize = 14;
    
    if (tile.type === 'S') {
        this.changeTextColor('#00ffbb');
        this.drawText("S", rect.x, rect.y, rect.width, 'center');
    }
    
    if (tile.type === 'E') {
        this.changeTextColor('#ffffff');
        this.drawText("E", rect.x, rect.y, rect.width, 'center');
    }
    
    if (tile.type === 'B') {
        this.changeTextColor('#ffaa00');
        this.drawText("X", rect.x, rect.y + rect.height / 2 - 6, rect.width, 'center');
    }
    
    if (tile.type === 'L') {
        this.changeTextColor(tile.locked ? '#ff4444' : '#44ff44');
        this.drawText("L", rect.x, rect.y, rect.width, 'center');
    }
    
    if (tile.type === 'C') {
        this.changeTextColor(tile.activated ? '#ffff00' : '#ffaa00');
        this.drawText("C", rect.x, rect.y, rect.width, 'center');
    }
    
    if (tile.type === 'W') {
        this.changeTextColor(tile.activated ? '#00ff00' : '#00aa00');
        this.drawText("W", rect.x, rect.y, rect.width, 'center');
    }
    
    if (tile.type === 'P') {
        this.changeTextColor('#ff00ff');
        this.drawText("P", rect.x, rect.y, rect.width, 'center');
    }
    
    this.resetTextColor();
};

Window_HackingGrid.prototype.drawPipe = function (cx, cy, tile, color, isGlowing) {
    const ctx = this.contents.context;
    const size = this._tileSize / 4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((tile.rotation * Math.PI) / 180);

    if (isGlowing) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, this._tileSize / 8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    switch (tile.type) {
        case 'I':
            ctx.moveTo(-size * 2, 0); ctx.lineTo(size * 2, 0);
            break;
        case 'L':
            ctx.moveTo(size * 2, 0); ctx.lineTo(0, 0); ctx.lineTo(0, size * 2);
            break;
        case 'T':
            ctx.moveTo(-size * 2, 0); ctx.lineTo(size * 2, 0);
            ctx.moveTo(0, 0); ctx.lineTo(0, size * 2);
            break;
        case 'S':
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(size * 2, 0);
            break;
        case 'E':
            // BRIGHT RED END POINT
            ctx.fillStyle = '#ff0044';
            ctx.fillRect(-size * 1.5, -size * 1.5, size * 3, size * 3);

            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-size * 2, 0);
            break;
        case 'X':
            ctx.moveTo(-size * 2, 0); ctx.lineTo(size * 2, 0);
            ctx.moveTo(0, -size * 2); ctx.lineTo(0, size * 2);
            break;
        case 'C':
            ctx.rect(-size, -size, size * 2, size * 2);
            ctx.moveTo(-size * 2, 0); ctx.lineTo(-size, 0);
            ctx.moveTo(size * 2, 0); ctx.lineTo(size, 0);
            ctx.moveTo(0, -size * 2); ctx.lineTo(0, -size);
            ctx.moveTo(0, size * 2); ctx.lineTo(0, size);
            break;
        case 'P':
            // Portal - circular with inner glow
            ctx.fillStyle = tile.connected ? '#ff00ff' : '#660066';
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = tile.connected ? '#ffffff' : '#cccccc';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'W':
            // Switch - square with indicator
            const switchColor = tile.activated ? '#00ff00' : '#00aa00';
            ctx.fillStyle = switchColor;
            ctx.fillRect(-size * 1.2, -size * 1.2, size * 2.4, size * 2.4);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-size * 1.2, -size * 1.2, size * 2.4, size * 2.4);
            
            // Switch indicator
            ctx.fillStyle = tile.activated ? '#ffffff' : '#333333';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'L':
            // Locked block - gray with lock symbol
            ctx.fillStyle = tile.locked ? '#666666' : '#888888';
            ctx.fillRect(-size * 1.5, -size * 1.5, size * 3, size * 3);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-size * 1.5, -size * 1.5, size * 3, size * 3);
            
            // Lock symbol
            ctx.fillStyle = tile.locked ? '#ff4444' : '#44ff44';
            ctx.beginPath();
            ctx.arc(0, -size * 0.5, size * 0.4, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-size * 0.3, -size * 0.1, size * 0.6, size * 0.6);
            break;
    }

    ctx.stroke();
    if (isGlowing) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.restore();
};

Window_HackingGrid.prototype.processOk = function () {
    const index = this.index();
    if (!this._grid) return;
    const x = index % this._gridW;
    const y = Math.floor(index / this._gridW);

    if (this._grid[y] && this._grid[y][x]) {
        const tile = this._grid[y][x];
        
        // Different interaction for different tile types
        if (tile.type === 'C' || tile.type === 'W') {
            // Activate controllers and switches without rotating
            if (tile.type === 'C') {
                this._scene.activateController(x, y);
            } else if (tile.type === 'W') {
                this._scene.activateSwitch(x, y);
            }
        } else if (tile.type !== 'S' && tile.type !== 'E' && tile.type !== 'B' && tile.type !== 'L') {
            // Rotate regular pipe elements
            if (!tile.locked) {
                tile.rotation = (tile.rotation + 90) % 360;
            }
        }
        
        this.updateInputData();
        this.callOkHandler();
    }
};

Window_HackingGrid.prototype.initialize = function (x, y, w, h) {
    Window_Selectable.prototype.initialize.call(this, x, y, w, h);
    this._grid = [];
    this._tileSize = 54;
    this._scene = null; // Reference to the scene
    this.activate();
};

Window_HackingGrid.prototype.setup = function (grid, tileSize, scene) {
    this._grid = grid;
    this._tileSize = tileSize;
    this._scene = scene; // Store scene reference
    this._gridW = grid[0].length;
    this._gridH = grid.length;
    this.refresh();
};

const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'ACTPO_Hacking') {
        if (args[0] === 'start') {
            const levelId = Number(args[1] || 1);
            const varId = Number(args[2] || 0);
            SceneManager.push(Scene_HackingPuzzle);
            SceneManager.prepareNextScene(levelId, varId);
        }
    }
};

// Override prepareNextScene to properly set up the scene
const _SceneManager_prepareNextScene = SceneManager.prepareNextScene;
SceneManager.prepareNextScene = function(sceneClass, args) {
    if (sceneClass === Scene_HackingPuzzle) {
        this._nextScene = new Scene_HackingPuzzle();
        this._nextScene.prepare.apply(this._nextScene, args);
    } else {
        _SceneManager_prepareNextScene.call(this, sceneClass, args);
    }
};
