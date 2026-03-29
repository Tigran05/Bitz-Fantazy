//=============================================================================
// ACTPO_LostLands.js
//=============================================================================

/*:
 * @plugindesc [ACTPO] Мини-игра "Затерянные земли" - поиск сокровищ на сетке
 * @author ACTPOJIuT
 *
 * @help
 * ============================================================================
 * ACTPO Lost Lands Mini Game v1.0.0
 * ============================================================================
 * Автор: ACTPOJIuT
 * Серия плагинов: ACTPO
 * 
 * Описание:
 * Мини-игра "Затерянные земли" для поиска сокровищ на сетке. Игрок должен
 * найти все скрытые сокровища за ограниченное количество ходов.
 * 
 * ============================================================================
 * Команды плагина (Plugin Commands):
 * ============================================================================
 * ACTPO_LostLandsStart           - Запустить мини-игру
 * 
 * ============================================================================
 * Параметры плагина:
 * ============================================================================
 * 
 * @param GridRows
 * @text Количество строк сетки
 * @desc Определяет количество строк в игровой сетке
 * @type number
 * @default 5
 * @min 3
 * @max 10
 *
 * @param GridCols
 * @text Количество столбцов сетки
 * @desc Определяет количество столбцов в игровой сетке
 * @type number
 * @default 5
 * @min 3
 * @max 10
 *
 * @param TreasureCount
 * @text Количество сокровищ
 * @desc Количество скрытых сокровищ на карте
 * @type number
 * @default 3
 * @min 1
 * @max 10
 *
 * @param MaxMoves
 * @text Лимит ходов
 * @desc Максимальное количество ходов для поиска сокровищ
 * @type number
 * @default 8
 * @min 3
 * @max 20
 *
 * @param TrapChance
 * @text Шанс ловушки (%)
 * @desc Процент ячеек с ловушками от общего количества
 * @type number
 * @default 10
 * @min 0
 * @max 30
 *
 * @param ResultVariable
 * @text Переменная результата
 * @desc ID переменной для сохранения результата (1=победа, 0=поражение)
 * @type variable
 * @default 1
 *
 * @param TreasuresFoundVariable
 * @text Переменная найденных сокровищ
 * @desc ID переменной для сохранения количества найденных сокровищ
 * @type variable
 * @default 2
 *
 * @param WindowWidth
 * @text Ширина окна
 * @desc Ширина окна мини-игры в пикселях
 * @type number
 * @default 500
 * @min 300
 * @max 816
 *
 * @param WindowHeight
 * @text Высота окна
 * @desc Высота окна мини-игры в пикселях
 * @type number
 * @default 450
 * @min 300
 * @max 624
 *
 * @param ShowTraps
 * @text Показывать ловушки при проигрыше
 * @desc Показывать расположение всех ловушек при завершении игры
 * @type boolean
 * @default true
 *
 * ============================================================================
 * Инструкция по использованию:
 * ============================================================================
 * 
 * 1. Установите плагин в папку js/plugins/
 * 2. Включите плагин в Plugin Manager
 * 3. Настройте параметры по необходимости
 * 4. В событии используйте команду Plugin Command:
 *    ACTPO_LostLandsStart
 * 5. После завершения проверьте переменные результата:
 *    - Переменная результата: 1 = победа, 0 = поражение
 *    - Переменная найденных сокровищ: количество найденных предметов
 * 
 * ============================================================================
 * Механика игры:
 * ============================================================================
 * - Навигация: Стрелки для перемещения, Enter/Space для выбора ячейки
 * - Зеленые ячейки: Неисследованные области
 * - Серые ячейки: Пустые исследованные области
 * - Золотые ячейки (💎): Найденные сокровища
 * - Красные ячейки (💀): Ловушки (не влияют на результат)
 * 
 * ============================================================================
 * История версий:
 * ============================================================================
 * v1.0.0 - Первая версия плагина
 * 
 * ============================================================================
 * Лицензия:
 * ============================================================================
 * Данный плагин является частью серии плагинов ACTPO.
 * Использование и модификация разрешены с указанием автора.
 * 
 * ============================================================================
 */

(function() {
    // ACTPO Plugin Parameters
    var pluginName = 'ACTPO_LostLands';
    var parameters = PluginManager.parameters(pluginName);
    
    var gridRows = Number(parameters['GridRows'] || 5);
    var gridCols = Number(parameters['GridCols'] || 5);
    var treasureCount = Number(parameters['TreasureCount'] || 3);
    var maxMoves = Number(parameters['MaxMoves'] || 8);
    var trapChance = Number(parameters['TrapChance'] || 10);
    var resultVariable = Number(parameters['ResultVariable'] || 1);
    var treasuresFoundVariable = Number(parameters['TreasuresFoundVariable'] || 2);
    var windowWidth = Number(parameters['WindowWidth'] || 500);
    var windowHeight = Number(parameters['WindowHeight'] || 450);
    var showTraps = String(parameters['ShowTraps'] || 'true') === 'true';
    
    // ACTPO Version
    var ACTPO_VERSION = '1.0.0';

    // ============================================================================
    // Game_LostLands - Логика игры
    // ============================================================================
    function Game_LostLands() {
        this.initialize.apply(this, arguments);
    }

    Game_LostLands.prototype.initialize = function() {
        this._rows = gridRows;
        this._cols = gridCols;
        this._totalTreasures = treasureCount;
        this._maxMoves = maxMoves;
        this._currentMoves = 0;
        this._foundTreasures = 0;
        this._revealedCells = [];
        this._treasurePositions = [];
        this._trapPositions = [];
        this._cursorX = 0;
        this._cursorY = 0;
        this._gameActive = true;
        this._result = 0; // 0 = в процессе, 1 = победа, -1 = поражение
        this._showTrapsOnEnd = showTraps;
        
        this.generateGrid();
    };

    Game_LostLands.prototype.generateGrid = function() {
        // Инициализация сетки
        for (var y = 0; y < this._rows; y++) {
            this._revealedCells[y] = [];
            for (var x = 0; x < this._cols; x++) {
                this._revealedCells[y][x] = false;
            }
        }

        // Размещение сокровищ
        var positions = [];
        for (var y = 0; y < this._rows; y++) {
            for (var x = 0; x < this._cols; x++) {
                positions.push({x: x, y: y});
            }
        }
        
        // Перемешивание позиций (Fisher-Yates shuffle)
        for (var i = positions.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = positions[i];
            positions[i] = positions[j];
            positions[j] = temp;
        }

        // Размещение сокровищ
        this._treasurePositions = positions.slice(0, this._totalTreasures);
        
        // Размещение ловушек на основе процента
        var availableCells = this._rows * this._cols - this._totalTreasures;
        var trapCount = Math.floor(availableCells * (trapChance / 100));
        this._trapPositions = positions.slice(this._totalTreasures, this._totalTreasures + trapCount);
    };

    Game_LostLands.prototype.revealCell = function(x, y) {
        if (!this._gameActive) return;
        if (x < 0 || x >= this._cols || y < 0 || y >= this._rows) return;
        if (this._revealedCells[y][x]) return;

        this._revealedCells[y][x] = true;
        this._currentMoves++;

        // Проверка на сокровище
        for (var i = 0; i < this._treasurePositions.length; i++) {
            if (this._treasurePositions[i].x === x && this._treasurePositions[i].y === y) {
                this._foundTreasures++;
                this._treasurePositions.splice(i, 1);
                break;
            }
        }

        // Проверка условий победы/поражения
        this.checkGameEnd();
    };

    Game_LostLands.prototype.checkGameEnd = function() {
        // Победа: все сокровища найдены
        if (this._foundTreasures >= this._totalTreasures) {
            this._gameActive = false;
            this._result = 1;
            return;
        }

        // Поражение: ходы закончились
        if (this._currentMoves >= this._maxMoves) {
            this._gameActive = false;
            this._result = -1;
        }
    };

    Game_LostLands.prototype.moveCursor = function(dx, dy) {
        if (!this._gameActive) return;
        
        this._cursorX += dx;
        this._cursorY += dy;
        
        this._cursorX = this._cursorX.clamp(0, this._cols - 1);
        this._cursorY = this._cursorY.clamp(0, this._rows - 1);
    };

    Game_LostLands.prototype.isTreasureAt = function(x, y) {
        for (var i = 0; i < this._treasurePositions.length; i++) {
            if (this._treasurePositions[i].x === x && this._treasurePositions[i].y === y) {
                return true;
            }
        }
        return false;
    };

    Game_LostLands.prototype.isTrapAt = function(x, y) {
        for (var i = 0; i < this._trapPositions.length; i++) {
            if (this._trapPositions[i].x === x && this._trapPositions[i].y === y) {
                return true;
            }
        }
        return false;
    };

    Game_LostLands.prototype.isRevealed = function(x, y) {
        return this._revealedCells[y][x];
    };

    Game_LostLands.prototype.isGameOver = function() {
        return !this._gameActive;
    };

    Game_LostLands.prototype.getResult = function() {
        return this._result;
    };

    // ============================================================================
    // Window_LostLandsGrid - Окно с сеткой
    // ============================================================================
    function Window_LostLandsGrid() {
        this.initialize.apply(this, arguments);
    }

    Window_LostLandsGrid.prototype = Object.create(Window_Selectable.prototype);
    Window_LostLandsGrid.prototype.constructor = Window_LostLandsGrid;

    // Вспомогательная функция для преобразования hex цвета в CSS
    Window_LostLandsGrid.hexToColor = function(hex) {
        return hex;
    };

    Window_LostLandsGrid.prototype.initialize = function(game, x, y, width, height) {
        this._game = game;
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this._cellWidth = Math.floor((this.width - this.padding * 2) / this._game._cols);
        this._cellHeight = Math.floor((this.height - this.padding * 2) / this._game._rows);
        this.select(0);
        this.activate();
        this.refresh();
    };

    Window_LostLandsGrid.prototype.maxCols = function() {
        return this._game._cols;
    };

    Window_LostLandsGrid.prototype.maxItems = function() {
        return this._game._rows * this._game._cols;
    };

    Window_LostLandsGrid.prototype.itemHeight = function() {
        return this._cellHeight;
    };

    Window_LostLandsGrid.prototype.itemWidth = function() {
        return this._cellWidth;
    };

    Window_LostLandsGrid.prototype.drawItem = function(index) {
        var rect = this.itemRect(index);
        var x = index % this._game._cols;
        var y = Math.floor(index / this._game._cols);
        
        this.changePaintOpacity(this.isEnabled(index));
        
        var isRevealed = this._game.isRevealed(x, y);
        var showHidden = this._game.isGameOver() && this._game._showTrapsOnEnd;
        
        var bgColor = 'rgb(76, 175, 80)'; // Зеленый по умолчанию
        var symbol = '';
        
        if (isRevealed || (showHidden && (this._game.isTreasureAt(x, y) || this._game.isTrapAt(x, y)))) {
            if (this._game.isTreasureAt(x, y)) {
                bgColor = 'rgb(255, 215, 0)'; // Золотой
                symbol = '💎';
            } else if (this._game.isTrapAt(x, y)) {
                bgColor = 'rgb(255, 107, 107)'; // Красный
                symbol = '💀';
            } else {
                bgColor = 'rgb(204, 204, 204)'; // Серый
            }
        }
        
        // Рисуем фон ячейки
        this.drawBlock(rect.x, rect.y, rect.width, rect.height, bgColor);
        
        // Рисуем символ если есть
        if (symbol) {
            var oldFontSize = this.contents.fontSize;
            this.contents.fontSize = Math.min(rect.width, rect.height) * 0.6;
            this.drawText(symbol, rect.x, rect.y, rect.width, rect.height, 'center');
            this.contents.fontSize = oldFontSize;
        }
        
        // Рисуем рамку для выбранной ячейки
        if (this.index() === index) {
            this.drawCursor(rect);
        }
    };

    Window_LostLandsGrid.prototype.drawCursor = function(rect) {
        var bitmap = this.contents;
        var context = bitmap._context;
        
        if (context) {
            context.save();
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 3;
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
            context.restore();
        }
    };

    Window_LostLandsGrid.prototype.drawBlock = function(x, y, width, height, color) {
        var bitmap = this.contents;
        var context = bitmap._context;
        
        if (context) {
            context.save();
            context.fillStyle = color;
            context.fillRect(x, y, width, height);
            
            // Рисуем рамку
            context.strokeStyle = '#333333';
            context.lineWidth = 2;
            context.strokeRect(x, y, width, height);
            context.restore();
        }
    };

    Window_LostLandsGrid.prototype.updateCursor = function() {
        // Используем стандартный курсор Window_Selectable
        Window_Selectable.prototype.updateCursor.call(this);
    };

    Window_LostLandsGrid.prototype.isEnabled = function(index) {
        return true;
    };

    Window_LostLandsGrid.prototype.isOkEnabled = function() {
        return !this._game.isGameOver();
    };

    Window_LostLandsGrid.prototype.processOk = function() {
        console.log('[ACTPO] processOk called');
        
        if (this._game.isGameOver()) {
            console.log('[ACTPO] Game is over, ignoring input');
            SoundManager.playBuzzer();
            return;
        }
        
        var index = this.index();
        var x = index % this._game._cols;
        var y = Math.floor(index / this._game._cols);
        
        console.log('[ACTPO] Cell selected: ' + x + ', ' + y + ' (index: ' + index + ')');
        
        this._game.revealCell(x, y);
        this.refresh();
        
        SoundManager.playOk();
        
        if (this._game.isGameOver()) {
            console.log('[ACTPO] Game ended, calling gameEnd handler');
            this.callHandler('gameEnd');
        }
    };

    Window_LostLandsGrid.prototype.cursorDown = function(wrap) {
        Window_Selectable.prototype.cursorDown.call(this, wrap);
        this._game.moveCursor(0, 1);
        this.refresh();
    };

    Window_LostLandsGrid.prototype.cursorUp = function(wrap) {
        Window_Selectable.prototype.cursorUp.call(this, wrap);
        this._game.moveCursor(0, -1);
        this.refresh();
    };

    Window_LostLandsGrid.prototype.cursorRight = function(wrap) {
        Window_Selectable.prototype.cursorRight.call(this, wrap);
        this._game.moveCursor(1, 0);
        this.refresh();
    };

    Window_LostLandsGrid.prototype.cursorLeft = function(wrap) {
        Window_Selectable.prototype.cursorLeft.call(this, wrap);
        this._game.moveCursor(-1, 0);
        this.refresh();
    };

    // ============================================================================
    // Window_LostLandsStatus - Окно статуса
    // ============================================================================
    function Window_LostLandsStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_LostLandsStatus.prototype = Object.create(Window_Base.prototype);
    Window_LostLandsStatus.prototype.constructor = Window_LostLandsStatus;

    Window_LostLandsStatus.prototype.initialize = function(game, x, y, width) {
        this._game = game;
        Window_Base.prototype.initialize.call(this, x, y, width, this.fittingHeight(2));
        this.refresh();
    };

    Window_LostLandsStatus.prototype.refresh = function() {
        this.contents.clear();
        
        var x = this.textPadding();
        var y = this.textPadding();
        
        // Заголовок
        this.changeTextColor(this.systemColor());
        this.drawText("Затерянные земли", x, y);
        
        // Статистика
        y += this.lineHeight();
        this.changeTextColor(this.normalColor());
        var statusText = "Сокровища: " + this._game._foundTreasures + "/" + this._game._totalTreasures + 
                        " | Ходы: " + this._game._currentMoves + "/" + this._game._maxMoves;
        this.drawText(statusText, x, y);
    };

    // ============================================================================
    // Window_LostLandsResult - Окно результата
    // ============================================================================
    function Window_LostLandsResult() {
        this.initialize.apply(this, arguments);
    }

    Window_LostLandsResult.prototype = Object.create(Window_Selectable.prototype);
    Window_LostLandsResult.prototype.constructor = Window_LostLandsResult;

    Window_LostLandsResult.prototype.initialize = function(game, x, y, width) {
        this._game = game;
        this._resultText = '';
        Window_Selectable.prototype.initialize.call(this, x, y, width, this.fittingHeight(2));
        this.openness = 0;
    };

    Window_LostLandsResult.prototype.setText = function(text) {
        this._resultText = text;
        this.refresh();
    };

    Window_LostLandsResult.prototype.refresh = function() {
        this.contents.clear();
        console.log('[ACTPO] Result window refresh: ' + this._resultText);
        this.drawText(this._resultText, 0, 0, this.contents.width, this.contents.height, 'center');
    };

    Window_LostLandsResult.prototype.isCursorMovable = function() {
        return false;
    };

    Window_LostLandsResult.prototype.processOk = function() {
        Window_Selectable.prototype.processOk.call(this);
        this.callHandler('ok');
    };

    Window_LostLandsResult.prototype.updateCursor = function() {
        // Не показываем курсор
    };

    // ============================================================================
    // Scene_LostLands - Сцена мини-игры
    // ============================================================================
    function Scene_LostLands() {
        this.initialize.apply(this, arguments);
    }

    Scene_LostLands.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_LostLands.prototype.constructor = Scene_LostLands;

    Scene_LostLands.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._game = new Game_LostLands();
    };

    Scene_LostLands.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        
        // Создание фона (полупрозрачный)
        this.createBackground();
        
        // Расчет позиций окон
        var totalWidth = windowWidth;
        var totalHeight = windowHeight;
        var startX = (Graphics.boxWidth - totalWidth) / 2;
        var startY = (Graphics.boxHeight - totalHeight) / 2;
        
        console.log('[ACTPO] Creating scene with totalWidth=' + totalWidth + ', totalHeight=' + totalHeight);
        console.log('[ACTPO] Start position: x=' + startX + ', y=' + startY);
        
        // Окно статуса
        this._statusWindow = new Window_LostLandsStatus(this._game, startX, startY, totalWidth);
        this.addWindow(this._statusWindow);
        console.log('[ACTPO] Status window created');
        
        // Окно сетки
        var resultWindowHeight = 108; // Высота окна результата
        var gridHeight = totalHeight - this._statusWindow.height - resultWindowHeight;
        this._gridWindow = new Window_LostLandsGrid(
            this._game, 
            startX, 
            startY + this._statusWindow.height, 
            totalWidth, 
            gridHeight
        );
        this._gridWindow.setHandler('ok', this.onGridOk.bind(this));
        this._gridWindow.setHandler('gameEnd', this.onGameEnd.bind(this));
        this._gridWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._gridWindow);
        console.log('[ACTPO] Grid window created');
        
        // Окно результата (изначально закрыто)
        this._resultWindow = new Window_LostLandsResult(this._game, startX + 30, startY + totalHeight - resultWindowHeight, totalWidth - 60);
        this._resultWindow.openness = 0;
        this._resultWindow.deactivate();
        this.addWindow(this._resultWindow);
        console.log('[ACTPO] Result window created');
        
        // Активируем окно сетки
        this._gridWindow.activate();
        this._gridWindow.select(0);
        console.log('[ACTPO] Scene created successfully');
    };

    Scene_LostLands.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._backgroundSprite.bitmap.fillAll('rgba(0, 0, 0, 0.5)');
        this.addChild(this._backgroundSprite);
    };

    Scene_LostLands.prototype.start = function() {
        Scene_MenuBase.prototype.start.call(this);
        this._gridWindow.activate();
        this._gridWindow.select(0);
        console.log('[ACTPO] Scene started, grid window activated');
    };

    Scene_LostLands.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        
        // Отладка: проверяем нажатия клавиш
        if (Input.isTriggered('ok')) {
            console.log('[ACTPO] OK key pressed');
        }
        if (Input.isTriggered('cancel')) {
            console.log('[ACTPO] Cancel key pressed');
        }
        
        // Убеждаемся, что окно сетки активно во время игры
        if (this._gridWindow && !this._game.isGameOver() && this._resultWindow.openness === 0) {
            if (!this._gridWindow.active) {
                console.log('[ACTPO] Reactivating grid window');
                this._gridWindow.activate();
            }
        }
        
        // Обновляем статусное окно
        if (this._statusWindow) {
            this._statusWindow.refresh();
        }
        
        if (this._game.isGameOver() && this._resultWindow.openness === 0) {
            this.showResult();
        }
    };

    Scene_LostLands.prototype.onGridOk = function() {
        console.log('[ACTPO] OK handler called');
        this._gridWindow.processOk();
    };

    Scene_LostLands.prototype.onGameEnd = function() {
        console.log('[ACTPO] Game ended');
        this._gridWindow.deactivate();
        this.showResult();
    };

    Scene_LostLands.prototype.showResult = function() {
        console.log('[ACTPO] showResult called');
        
        var result = this._game.getResult();
        var resultText = "";
        
        console.log('[ACTPO] Game result: ' + result);
        
        if (result === 1) {
            resultText = "Победа! Вы нашли все сокровища!";
            SoundManager.playSave();
        } else {
            resultText = "Поражение! Ходы закончились.";
            SoundManager.playBuzzer();
        }
        
        console.log('[ACTPO] Result text: ' + resultText);
        
        this._resultWindow.setText(resultText);
        this._resultWindow.refresh();
        this._resultWindow.open();
        this._resultWindow.activate();
        this._resultWindow.setHandler('ok', this.onResultOk.bind(this));
        
        console.log('[ACTPO] Result window shown and activated');
    };

    Scene_LostLands.prototype.onResultOk = function() {
        console.log('[ACTPO] Result OK pressed, exiting scene');
        
        // Сохранение результатов в переменные
        $gameVariables.setValue(resultVariable, this._game.getResult() === 1 ? 1 : 0);
        $gameVariables.setValue(treasuresFoundVariable, this._game._foundTreasures);
        
        console.log('[ACTPO] Result saved: var' + resultVariable + '=' + this._game.getResult() + ', var' + treasuresFoundVariable + '=' + this._game._foundTreasures);
        
        // Проверяем стек сцен перед выходом
        var stackLength = SceneManager._sceneStack ? SceneManager._sceneStack.length : 0;
        console.log('[ACTPO] Current scene stack length: ' + stackLength);
        var previousScene = (SceneManager._sceneStack && SceneManager._sceneStack.length > 0) ? 
                           SceneManager._sceneStack[SceneManager._sceneStack.length - 1].constructor.name : 'none';
        console.log('[ACTPO] Previous scene: ' + previousScene);
        
        // Проверяем, есть ли предыдущая сцена в стеке
        if (SceneManager._sceneStack && SceneManager._sceneStack.length > 0) {
            console.log('[ACTPO] Using SceneManager.pop() to return to previous scene');
            SceneManager.pop();
        } else {
            console.log('[ACTPO] Scene stack is empty, going to map scene');
            SceneManager.goto(Scene_Map);
        }
    };

    Scene_LostLands.prototype.stop = function() {
        Scene_MenuBase.prototype.stop.call(this);
        console.log('[ACTPO] Scene stopped');
    };

    // ============================================================================
    // Регистрация Plugin Command
    // ============================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'ACTPO_LostLandsStart') {
            console.log('[ACTPO] Plugin command ACTPO_LostLandsStart called');
            console.log('[ACTPO] Current scene: ' + SceneManager._scene.constructor.name);
            var stackLength = SceneManager._sceneStack ? SceneManager._sceneStack.length : 0;
            console.log('[ACTPO] Scene stack before push: ' + stackLength);
            SceneManager.push(Scene_LostLands);
            stackLength = SceneManager._sceneStack ? SceneManager._sceneStack.length : 0;
            console.log('[ACTPO] Scene stack after push: ' + stackLength);
        }
    };

    // ============================================================================
    // ACTPO Plugin Initialization
    // ============================================================================
    console.log('[ACTPO] Lost Lands Mini Game v' + ACTPO_VERSION + ' loaded successfully');

})();
