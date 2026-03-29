/*:
 * @plugindesc v1.0 Миникарта [ACTPO UI]
 * @author ACTPOJIuT
 *
 * @param Map X
 * @desc X координата миникарты
 * @default Graphics.boxWidth - 160
 *
 * @param Map Y
 * @desc Y координата миникарты
 * @default 10
 *
 * @param Map Width
 * @desc Ширина миникарты
 * @default 150
 *
 * @param Map Height
 * @desc Высота миникарты
 * @default 150
 *
 * @param Scale
 * @desc Масштаб (размер точки в пикселях)
 * @default 4
 *
 * @param Opacity
 * @desc Прозрачность фона (0-255)
 * @default 200
 *
 * @param Wall Color
 * @desc Цвет стен (HEX)
 * @default #666666
 *
 * @param Floor Color
 * @desc Цвет пола (HEX)
 * @default #cccccc
 *
 * @param Player Color
 * @desc Цвет игрока (HEX)
 * @default #ff0000
 *
 * @help
 * ============================================================================
 * Описание
 * ============================================================================
 *
 * Простой плагин миникарты с кнопками управления.
 *
 * Управление:
 * [+] - Приблизить
 * [-] - Отдалить
 * [<] - Свернуть/Развернуть
 *
 * Рисует проходимые (пол) и непроходимые (стены) участки.
 * Отображает игрока.
 *
 * Интеграция с ACTPO_QuestJournal:
 * Квестовые события будут отображаться специальными маркерами, если они доступны.
 *
 * Настройки:
 * Вы можете изменить позицию, размер и цвета в параметрах плагина.
 *
 */

(function () {
    'use strict';

    var parameters = PluginManager.parameters('ACTPO_Minimap');
    var mapX = String(parameters['Map X'] || 'Graphics.boxWidth - 160');
    var mapY = Number(parameters['Map Y'] || 10);
    var mapWidth = Number(parameters['Map Width'] || 150);
    var mapHeight = Number(parameters['Map Height'] || 150);
    var scale = Number(parameters['Scale'] || 4);
    var opacity = Number(parameters['Opacity'] || 200);

    var colorWall = parameters['Wall Color'] || '#666666';
    var colorFloor = parameters['Floor Color'] || '#cccccc';
    var colorPlayer = parameters['Player Color'] || '#ff0000';

    //=============================================================================
    // Sprite_MinimapButton
    //=============================================================================

    function Sprite_MinimapButton() {
        this.initialize.apply(this, arguments);
    }

    Sprite_MinimapButton.prototype = Object.create(Sprite_Base.prototype);
    Sprite_MinimapButton.prototype.constructor = Sprite_MinimapButton;

    Sprite_MinimapButton.prototype.initialize = function (label, type, callback) {
        Sprite_Base.prototype.initialize.call(this);
        this._label = label;
        this._type = type; // 'zoomIn', 'zoomOut', 'toggle'
        this._callback = callback;
        this.createBitmap();
        this._isTouchTriggered = false;
    };

    Sprite_MinimapButton.prototype.createBitmap = function () {
        this.bitmap = new Bitmap(24, 24);
        this.bitmap.fillAll('rgba(0, 0, 0, 0.6)');
        this.bitmap.fontSize = 18;
        this.bitmap.drawText(this._label, 0, 0, 24, 24, 'center');
    };

    Sprite_MinimapButton.prototype.update = function () {
        Sprite_Base.prototype.update.call(this);
        this.processTouch();
    };

    Sprite_MinimapButton.prototype.processTouch = function () {
        if (this.visible) {
            if (TouchInput.isTriggered() && this.isButtonTouched()) {
                this._isTouchTriggered = true;
            }
            if (this._isTouchTriggered && !TouchInput.isPressed()) {
                if (this.isButtonTouched()) {
                    SoundManager.playCursor();
                    this._callback();
                }
                this._isTouchTriggered = false;
            }
        } else {
            this._isTouchTriggered = false;
        }
    };

    Sprite_MinimapButton.prototype.isButtonTouched = function () {
        var tx = TouchInput.x;
        var ty = TouchInput.y;

        // Convert local sprite coordinates to global
        var node = this;
        var gx = 0;
        var gy = 0;
        while (node) {
            gx += node.x;
            gy += node.y;
            node = node.parent;
        }

        return tx >= gx && tx < gx + this.width && ty >= gy && ty < gy + this.height;
    };

    //=============================================================================
    // Window_Minimap
    //=============================================================================

    function Window_Minimap() {
        this.initialize.apply(this, arguments);
    }

    Window_Minimap.prototype = Object.create(Window_Base.prototype);
    Window_Minimap.prototype.constructor = Window_Minimap;

    Window_Minimap.prototype.initialize = function () {
        var x = eval(mapX);
        var y = mapY;
        Window_Base.prototype.initialize.call(this, x, y, mapWidth, mapHeight);
        this.opacity = opacity;
        this._mapBitmap = null;
        this._lastMapId = 0;
        // Restore state or default to true
        this._isMinimapVisible = ($gameSystem && $gameSystem._minimapExpanded !== undefined) ? $gameSystem._minimapExpanded : true;
        this._originalHeight = mapHeight;

        this.createButtons();
        this.updateLayout();
        this.refresh();
    };

    Window_Minimap.prototype.createButtons = function () {
        var self = this;

        // Zoom In
        this._zoomInBtn = new Sprite_MinimapButton('+', 'zoomIn', function () {
            scale = Math.min(scale + 1, 8);
            self._lastMapId = 0; // Force redraw
            self.refresh();
        });
        this.addChild(this._zoomInBtn);

        // Zoom Out
        this._zoomOutBtn = new Sprite_MinimapButton('-', 'zoomOut', function () {
            scale = Math.max(scale - 1, 1);
            self._lastMapId = 0; // Force redraw
            self.refresh();
        });
        this.addChild(this._zoomOutBtn);

        // Toggle
        this._toggleBtn = new Sprite_MinimapButton('<', 'toggle', function () {
            self.toggleMinimap();
        });
        this.addChild(this._toggleBtn);

        // Adjust positions
        this._zoomInBtn.x = 10;
        this._zoomInBtn.y = 10;
        this._zoomOutBtn.x = 36;
        this._zoomOutBtn.y = 10;
        this._toggleBtn.x = 62;
        this._toggleBtn.y = 10;
    };

    Window_Minimap.prototype.toggleMinimap = function () {
        this._isMinimapVisible = !this._isMinimapVisible;
        if ($gameSystem) {
            $gameSystem._minimapExpanded = this._isMinimapVisible;
        }
        this.updateLayout();
        this.refresh();
    };

    Window_Minimap.prototype.updateLayout = function () {
        if (this._isMinimapVisible) {
            this.height = this._originalHeight;
            if (this._toggleBtn) this._toggleBtn._label = '<';
            if (this._zoomInBtn) this._zoomInBtn.visible = true;
            if (this._zoomOutBtn) this._zoomOutBtn.visible = true;
        } else {
            this.height = 40; // Collapsed height
            if (this._toggleBtn) this._toggleBtn._label = '>';
            if (this._zoomInBtn) this._zoomInBtn.visible = false;
            if (this._zoomOutBtn) this._zoomOutBtn.visible = false;
        }
        if (this._toggleBtn) this._toggleBtn.createBitmap();
    };

    Window_Minimap.prototype.isAnyButtonTouched = function () {
        if (this._toggleBtn && this._toggleBtn.visible && this._toggleBtn.isButtonTouched()) return true;
        if (this._zoomInBtn && this._zoomInBtn.visible && this._zoomInBtn.isButtonTouched()) return true;
        if (this._zoomOutBtn && this._zoomOutBtn.visible && this._zoomOutBtn.isButtonTouched()) return true;
        return false;
    };

    Window_Minimap.prototype.refresh = function () {
        this.contents.clear();

        if (!this._isMinimapVisible) {
            return;
        }

        if (!$gamePlayer || !$dataMap) return;

        // Генерация карты при смене локации
        if (this._lastMapId !== $gameMap.mapId()) {
            this.createMapBitmap();
            this._lastMapId = $gameMap.mapId();
        }

        if (this._mapBitmap) {
            this.drawMap();
            this.drawPlayer();
            this.drawEvents();
        }
    };

    Window_Minimap.prototype.createMapBitmap = function () {
        var mw = $dataMap.width;
        var mh = $dataMap.height;
        this._mapBitmap = new Bitmap(mw * scale, mh * scale);

        for (var x = 0; x < mw; x++) {
            for (var y = 0; y < mh; y++) {
                // Проверяем проходимость
                var isPassable = false;
                if ($gameMap.isPassable(x, y, 2) || $gameMap.isPassable(x, y, 4) || $gameMap.isPassable(x, y, 6) || $gameMap.isPassable(x, y, 8)) {
                    isPassable = true;
                }

                // Fallback check
                if (!isPassable && $gameMap.checkPassage(x, y, 0x0f)) isPassable = true;

                var color = isPassable ? colorFloor : colorWall;
                this._mapBitmap.fillRect(x * scale, y * scale, scale, scale, color);
            }
        }
    };

    Window_Minimap.prototype.drawMap = function () {
        var px = $gamePlayer.x * scale;
        var py = $gamePlayer.y * scale;

        var viewW = this.contentsWidth();
        var viewH = this.contentsHeight();

        var mapW = this._mapBitmap.width;
        var mapH = this._mapBitmap.height;

        // Переменные для отрисовки
        var sourceX = 0;
        var sourceY = 0;
        var sourceW = viewW;
        var sourceH = viewH;
        var destX = 0;
        var destY = 0;

        // Смещение для маркеров (координата карты, соответствующая 0,0 экрана)
        var scrollX = 0;
        var scrollY = 0;

        // Логика по горизонтали
        if (mapW > viewW) {
            // Карта больше окна: скроллинг
            scrollX = px - viewW / 2;
            if (scrollX < 0) scrollX = 0;
            if (scrollX + viewW > mapW) scrollX = mapW - viewW;

            sourceX = scrollX;
            sourceW = viewW;
            destX = 0;
        } else {
            // Карта меньше окна: центрирование
            sourceX = 0;
            sourceW = mapW;
            destX = (viewW - mapW) / 2;
            scrollX = -destX;
        }

        // Логика по вертикали
        if (mapH > viewH) {
            // Карта больше окна: скроллинг
            scrollY = py - viewH / 2;
            if (scrollY < 0) scrollY = 0;
            if (scrollY + viewH > mapH) scrollY = mapH - viewH;

            sourceY = scrollY;
            sourceH = viewH;
            destY = 0;
        } else {
            // Карта меньше окна: центрирование
            sourceY = 0;
            sourceH = mapH;
            destY = (viewH - mapH) / 2;
            scrollY = -destY;
        }

        this.contents.blt(this._mapBitmap, sourceX, sourceY, sourceW, sourceH, destX, destY);

        this._scrollX = scrollX;
        this._scrollY = scrollY;
    };

    Window_Minimap.prototype.drawPlayer = function () {
        var px = $gamePlayer.x * scale;
        var py = $gamePlayer.y * scale;

        var dx = px - (this._scrollX || 0);
        var dy = py - (this._scrollY || 0);

        // Рисуем игрока
        this.contents.fillRect(dx, dy, scale, scale, colorPlayer);
    };

    Window_Minimap.prototype.drawEvents = function () {
        var self = this;
        $gameMap.events().forEach(function (event) {
            if (event._erased) return;

            // Проверка на квестовое событие
            var color = null;

            // Интеграция с ACTPO_QuestJournal (v4.0+ "Без Стресса")
            if (typeof event.questIconIndex === 'function') {
                var iconIndex = event.questIconIndex();
                if (iconIndex === 163) { // Восклицательный знак (Доступен)
                    color = '#00FF00'; // Зеленый для новых квестов
                } else if (iconIndex === 164 || iconIndex === 165) { // Вопросительный знак или точки (Активен)
                    color = '#FFFF00'; // Желтый для текущей цели
                }
            }

            if (color) {
                var ex = event.x * scale;
                var ey = event.y * scale;
                var dx = ex - (self._scrollX || 0);
                var dy = ey - (self._scrollY || 0);

                // Рисуем маркер события (немного больше игрока)
                self.contents.fillRect(dx - 1, dy - 1, scale + 2, scale + 2, color);
            }
        });
    };

    Window_Minimap.prototype.update = function () {
        Window_Base.prototype.update.call(this);

        // Dynamic positioning check
        if (this._lastBoxWidth !== Graphics.boxWidth || this._lastBoxHeight !== Graphics.boxHeight) {
            this._lastBoxWidth = Graphics.boxWidth;
            this._lastBoxHeight = Graphics.boxHeight;

            try {
                var x = eval(mapX);
                var y = mapY; // Usually static, but if it was dynamic it would need eval
                this.move(x, y, this.width, this.height);
            } catch (e) {
                console.error("Minimap position update error:", e);
            }
        }

        // Обновляем миникарту если игрок двигается
        if ($gamePlayer.isMoving()) {
            this.refresh();
            return;
        }

        // Автоматическое обновление каждые 20 кадров
        if (!this._updateTimer) this._updateTimer = 0;
        this._updateTimer++;
        if (this._updateTimer >= 20) {
            this.refresh();
            this._updateTimer = 0;
        }
    };

    //=============================================================================
    // Scene_Map
    //=============================================================================

    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function () {
        _Scene_Map_createAllWindows.call(this);
        this.createMinimap();
    };

    Scene_Map.prototype.createMinimap = function () {
        this._minimapWindow = new Window_Minimap();
        this.addWindow(this._minimapWindow);
    };

    var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function () {
        if (this._minimapWindow && this._minimapWindow.isAnyButtonTouched()) {
            return;
        }
        _Scene_Map_processMapTouch.call(this);
    };

})();
