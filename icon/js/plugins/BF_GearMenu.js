/*:
 * @plugindesc Bitz Fantasy - Полная замена стандартного меню на меню-шестерёнку.
 * @author OpenAI
 *
 * @help
 * Стандартное меню RPG Maker MV полностью блокируется.
 *
 * На карте:
 *   ⚙ = единственная кнопка меню
 *
 * В меню:
 *   Сохранение
 *   Настройки
 *   Выйти
 *
 * Клавиша Esc НЕ открывает стандартное меню.
 * При открытии нашего меню Esc/ПКМ закрывает его.
 *
 * Установка:
 * 1. Поместить BF_GearMenu.js в js/plugins/
 * 2. Включить плагин в Plugin Manager.
 */

(function() {
    "use strict";

    var SIZE = 54;
    var RIGHT = 12;
    var TOP = 12;

    // ============================================================
    // ШЕСТЕРЁНКА
    // ============================================================

    function Sprite_BFGear() {
        this.initialize.apply(this, arguments);
    }

    Sprite_BFGear.prototype = Object.create(Sprite.prototype);
    Sprite_BFGear.prototype.constructor = Sprite_BFGear;

    Sprite_BFGear.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, ImageManager.loadPicture('BF_UI/gear'));
        this.x = Graphics.width - RIGHT;
        this.y = TOP;
        this.anchor.x = 1;
        this.anchor.y = 0;
        this._pressed = false;
    };

    Sprite_BFGear.prototype.containsPoint = function(x, y) {
        var left = Graphics.width - RIGHT - SIZE;
        var right = Graphics.width - RIGHT;

        return x >= left &&
               x <= right &&
               y >= TOP &&
               y <= TOP + SIZE;
    };

    Sprite_BFGear.prototype.update = function() {
        Sprite.prototype.update.call(this);

        var inside = this.containsPoint(TouchInput.x, TouchInput.y);

        if (inside && TouchInput.isTriggered()) {
            this._pressed = true;
            this.opacity = 150;
        }

        if (this._pressed && TouchInput.isReleased()) {
            this._pressed = false;
            this.opacity = 255;

            if (inside) {
                SoundManager.playOk();
                SceneManager.push(Scene_BFGearMenu);
            }
        }

        if (!inside && TouchInput.isReleased()) {
            this._pressed = false;
            this.opacity = 255;
        }
    };


    // ============================================================
    // ПОЛНОСТЬЮ УБИРАЕМ СТАНДАРТНУЮ КНОПКУ МЕНЮ
    // ============================================================

    Scene_Map.prototype.createMenuButton = function() {
        // намеренно пусто
    };


    // ============================================================
    // ДОБАВЛЯЕМ ШЕСТЕРЁНКУ НА КАРТУ
    // ============================================================

    var _Scene_Map_createAllWindows =
        Scene_Map.prototype.createAllWindows;

    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);

        this._bfGear = new Sprite_BFGear();
        this.addChild(this._bfGear);
    };


    // ============================================================
    // БЛОКИРУЕМ КЛАВИШУ ESC НА КАРТЕ
    //
    // Стандартный Scene_Map обычно открывает Scene_Menu.
    // Мы оставляем обработку карты, но не позволяем открыть
    // стандартное меню.
    // ============================================================

    var _Scene_Map_updateCallMenu =
        Scene_Map.prototype.updateCallMenu;

    Scene_Map.prototype.updateCallMenu = function() {
        // Ничего не делаем.
        // Поэтому Esc больше НЕ открывает стандартное меню.
    };


    // ============================================================
    // БЛОКИРУЕМ СТАНДАРТНЫЙ Scene_Menu
    // ============================================================

    var _Scene_Menu_initialize =
        Scene_Menu.prototype.initialize;

    Scene_Menu.prototype.initialize = function() {
        _Scene_Menu_initialize.call(this);
    };


    // ============================================================
    // НЕ ДАЁМ КЛИКУ ПО ШЕСТЕРЁНКЕ КЛИКАТЬ ПО КАРТЕ
    // ============================================================

    var _Scene_Map_processMapTouch =
        Scene_Map.prototype.processMapTouch;

    Scene_Map.prototype.processMapTouch = function() {

        if (this._bfGear &&
            this._bfGear.containsPoint(TouchInput.x, TouchInput.y)) {
            return;
        }

        _Scene_Map_processMapTouch.call(this);
    };


    // ============================================================
    // ОКНО НАШЕГО МЕНЮ
    // ============================================================

    function Window_BFGearMenu() {
        this.initialize.apply(this, arguments);
    }

    Window_BFGearMenu.prototype =
        Object.create(Window_Command.prototype);

    Window_BFGearMenu.prototype.constructor =
        Window_BFGearMenu;

    Window_BFGearMenu.prototype.initialize = function() {
        Window_Command.prototype.initialize.call(this, 0, 0);

        this.width = 360;
        this.height = this.fittingHeight(4);

        this.x =
            Math.floor((Graphics.boxWidth - this.width) / 2);

        this.y =
            Math.floor((Graphics.boxHeight - this.height) / 2);

        this.refresh();
        this.select(0);
        this.activate();
    };

    Window_BFGearMenu.prototype.makeCommandList = function() {
        this.addCommand("Сохранение", "save");
        this.addCommand("Настройки", "options");
        this.addCommand("Выйти", "exit");
        this.addCommand("Закрыть", "close");
    };


    // ============================================================
    // СЦЕНА МЕНЮ
    // ============================================================

    function Scene_BFGearMenu() {
        this.initialize.apply(this, arguments);
    }

    Scene_BFGearMenu.prototype =
        Object.create(Scene_MenuBase.prototype);

    Scene_BFGearMenu.prototype.constructor =
        Scene_BFGearMenu;

    Scene_BFGearMenu.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_BFGearMenu.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);

        this._gearWindow =
            new Window_BFGearMenu();

        this._gearWindow.setHandler(
            "save",
            this.commandSave.bind(this)
        );

        this._gearWindow.setHandler(
            "options",
            this.commandOptions.bind(this)
        );

        this._gearWindow.setHandler(
            "exit",
            this.commandExit.bind(this)
        );

        this._gearWindow.setHandler(
            "close",
            this.popScene.bind(this)
        );

        this._gearWindow.setHandler(
            "cancel",
            this.popScene.bind(this)
        );

        this.addWindow(this._gearWindow);
    };

    Scene_BFGearMenu.prototype.commandSave = function() {
        SoundManager.playOk();
        SceneManager.push(Scene_Save);
    };

    Scene_BFGearMenu.prototype.commandOptions = function() {
        SoundManager.playOk();
        SceneManager.push(Scene_Options);
    };

    Scene_BFGearMenu.prototype.commandExit = function() {
        SoundManager.playOk();
        SceneManager.push(Scene_GameEnd);
    };

    window.Scene_BFGearMenu = Scene_BFGearMenu;

})();
