/*:
 * @plugindesc v1.0 Кастомизация интерфейса [ACTPO UI]
 * @author ACTPOJIuT
 *
 * @param ---Main Menu---
 * @default
 *
 * @param Show Item
 * @text Показать: Предметы
 * @type boolean
 * @default true
 *
 * @param Show Skill
 * @text Показать: Навыки
 * @type boolean
 * @default true
 *
 * @param Show Equip
 * @text Показать: Экипировка
 * @type boolean
 * @default true
 *
 * @param Show Status
 * @text Показать: Статус
 * @type boolean
 * @default true
 *
 * @param Show Formation
 * @text Показать: Формирование
 * @type boolean
 * @default true
 *
 * @param Show Options
 * @text Показать: Опции
 * @type boolean
 * @default true
 *
 * @param Show Save
 * @text Показать: Сохранение
 * @type boolean
 * @default true
 *
 * @param Show GameEnd
 * @text Показать: Конец игры
 * @type boolean
 * @default true
 *
 * @param ---Title Screen---
 * @default
 *
 * @param Title Command X
 * @text Позиция X (Титул)
 * @desc X координата окна команд (можно использовать формулы, например: Graphics.boxWidth / 2 - width / 2)
 * @type text
 * @default
 *
 * @param Title Command Y
 * @text Позиция Y (Титул)
 * @desc Y координата окна команд
 * @type text
 * @default
 *
 * @param Title Transparent
 * @text Прозрачное окно (Титул)
 * @desc Сделать окно команд прозрачным?
 * @type boolean
 * @default false
 *
 * @param ---Battle---
 * @default
 *
 * @param Hide Enemy Window
 * @text Скрыть выбор врагов
 * @desc Скрывает окно с именами врагов при атаке (остается только выбор кликом/курсором по врагу)
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Описание
 * ============================================================================
 *
 * Плагин для настройки интерфейса.
 *
 * Возможности:
 * 1. Включение/Отключение стандартных команд в Главном Меню.
 * 2. Скрытие окна выбора врага в бою (для более "чистого" интерфейса).
 *
 * Настройка:
 * Просто переключите нужные параметры в менеджере плагинов.
 *
 */

(function () {
    'use strict';

    var parameters = PluginManager.parameters('ACTPO_UserInterface');
    var showItem = (parameters['Show Item'] !== 'false');
    var showSkill = (parameters['Show Skill'] !== 'false');
    var showEquip = (parameters['Show Equip'] !== 'false');
    var showStatus = (parameters['Show Status'] !== 'false');
    var showFormation = (parameters['Show Formation'] !== 'false');
    var showOptions = (parameters['Show Options'] !== 'false');
    var showSave = (parameters['Show Save'] !== 'false');
    var showGameEnd = (parameters['Show GameEnd'] !== 'false');

    var titleCommandX = parameters['Title Command X'] || '';
    var titleCommandY = parameters['Title Command Y'] || '';
    var titleTransparent = (parameters['Title Transparent'] === 'true');

    var hideEnemyWindow = (parameters['Hide Enemy Window'] !== 'false');

    //=============================================================================
    // Window_TitleCommand - Настройка титульного меню
    //=============================================================================

    var _Window_TitleCommand_updatePlacement = Window_TitleCommand.prototype.updatePlacement;
    Window_TitleCommand.prototype.updatePlacement = function () {
        _Window_TitleCommand_updatePlacement.call(this);

        if (titleCommandX) {
            try {
                // Allow evaluation of formulas using 'width' and 'height' context if needed, 
                // but usually direct eval or number is fine.
                // Binding 'width' to current window width
                var width = this.width;
                var height = this.height;
                this.x = eval(titleCommandX);
            } catch (e) {
                console.error("Title X Eval Error: " + e);
            }
        }

        if (titleCommandY) {
            try {
                var width = this.width;
                var height = this.height;
                this.y = eval(titleCommandY);
            } catch (e) {
                console.error("Title Y Eval Error: " + e);
            }
        }

        if (titleTransparent) {
            this.opacity = 0;
            // this.setBackgroundType(2); // 0: Normal, 1: Dim, 2: Transparent
        }
    };

    // Ensure background type is applied if using opacity isn't enough for text readability 
    // or if we want to force completely clear background.
    // Overriding initialize to set background type if needed? 
    // Usually updatePlacement is called right before showing.

    //=============================================================================
    // Window_MenuCommand - Фильтрация команд меню
    //=============================================================================

    var _Window_MenuCommand_addMainCommands = Window_MenuCommand.prototype.addMainCommands;
    Window_MenuCommand.prototype.addMainCommands = function () {
        if (showItem) this.addCommand(TextManager.item, 'item');
        if (showSkill) this.addCommand(TextManager.skill, 'skill', this.areMainCommandsEnabled());
        if (showEquip) this.addCommand(TextManager.equip, 'equip', this.areMainCommandsEnabled());
        if (showStatus) this.addCommand(TextManager.status, 'status', this.areMainCommandsEnabled());
    };

    var _Window_MenuCommand_addFormationCommand = Window_MenuCommand.prototype.addFormationCommand;
    Window_MenuCommand.prototype.addFormationCommand = function () {
        if (showFormation) _Window_MenuCommand_addFormationCommand.call(this);
    };

    var _Window_MenuCommand_addOptionsCommand = Window_MenuCommand.prototype.addOptionsCommand;
    Window_MenuCommand.prototype.addOptionsCommand = function () {
        if (showOptions) _Window_MenuCommand_addOptionsCommand.call(this);
    };

    var _Window_MenuCommand_addSaveCommand = Window_MenuCommand.prototype.addSaveCommand;
    Window_MenuCommand.prototype.addSaveCommand = function () {
        if (showSave) _Window_MenuCommand_addSaveCommand.call(this);
    };

    var _Window_MenuCommand_addGameEndCommand = Window_MenuCommand.prototype.addGameEndCommand;
    Window_MenuCommand.prototype.addGameEndCommand = function () {
        if (showGameEnd) _Window_MenuCommand_addGameEndCommand.call(this);
    };

    //=============================================================================
    // Window_BattleEnemy - Скрытие окна выбора врагов
    //=============================================================================

    var _Window_BattleEnemy_initialize = Window_BattleEnemy.prototype.initialize;
    Window_BattleEnemy.prototype.initialize = function (x, y) {
        _Window_BattleEnemy_initialize.call(this, x, y);
        if (hideEnemyWindow) {
            // Делаем окно полностью прозрачным
            this.opacity = 0;
            this.contentsOpacity = 0;
            // Не сдвигаем за экран, чтобы тач-инпут (клики) корректно обрабатывались,
            // если движок проверяет active window.
            // Стандартное поведение MV: клик по спрайту врага выбирает его (select).
            // Окно просто отображает имя. Скрываем только визуал.
        }
    };

    // Перехватываем обновление курсора, чтобы он не появлялся, если окно "скрыто"
    // (Хотя contentsOpacity 0 уже скроет текст и курсор имен, 
    // но в бою выделение самого врага (мигание) делает Sprite_Enemy)

    var _Window_BattleEnemy_show = Window_BattleEnemy.prototype.show;
    Window_BattleEnemy.prototype.show = function () {
        _Window_BattleEnemy_show.call(this);
        if (hideEnemyWindow) {
            this.visible = true; // MV требует visible = true для работы ввода
            this.opacity = 0;
            this.contentsOpacity = 0;
        }
    };

    //=============================================================================
    // Scene_Battle - Обработка клика по спрайту врага
    //=============================================================================

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        _Scene_Battle_update.call(this);
        if (hideEnemyWindow && this._enemyWindow.active) {
            this.processEnemyTouchSelection();
        }
    };

    Scene_Battle.prototype.processEnemyTouchSelection = function () {
        if (TouchInput.isTriggered()) {
            var x = TouchInput.x;
            var y = TouchInput.y;
            var sprites = this._spriteset._enemySprites;

            for (var i = 0; i < sprites.length; i++) {
                var sprite = sprites[i];
                if (sprite && sprite.visible && sprite.opacity > 0) {
                    if (this.isTouchInsideSprite(sprite, x, y)) {
                        var enemy = sprite._battler;
                        if (enemy && enemy.isAlive()) {
                            this._enemyWindow.select(enemy.index());
                            this._enemyWindow.processOk();
                            return;
                        }
                    }
                }
            }
        }
    };

    Scene_Battle.prototype.isTouchInsideSprite = function (sprite, x, y) {
        // Determine the actual visual sprite (SV enemies use _mainSprite)
        var visual = sprite._mainSprite ? sprite._mainSprite : sprite;

        if (!visual || !visual.bitmap) return false;

        // Visual dimensions considering Frame
        var w = visual.width;
        var h = visual.height;

        // Scale (accumulate from parent if needed, but usually sprite has scale 1 and mainSprite has scale -1)
        // We really just care about the visual's scale relative to the 'sprite' container position which is the anchor point on map.
        // Actually, sprite location is screenX/Y. visual is at 0,0 inside sprite.
        var scaleX = visual.scale.x;
        var scaleY = visual.scale.y;

        // Effective visual size
        var dw = w * Math.abs(scaleX);
        var dh = h * Math.abs(scaleY);

        var ax = visual.anchor.x;
        var ay = visual.anchor.y;

        // Coordinates
        // The 'sprite' (container) is positioned at the battler's screen X/Y.
        // The 'visual' is visible at that location (centered/anchored).
        var sx = sprite.x - dw * ax;
        var sy = sprite.y - dh * ay;

        return (x >= sx && x < sx + dw && y >= sy && y < sy + dh);
    };

})();
