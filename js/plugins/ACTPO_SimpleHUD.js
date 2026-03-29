/*:
 * @plugindesc v1.0 Ultra-Simple Quest HUD [ACTPO]
 * @author ACTPOJIuT
 *
 * @param HUD X
 * @desc X position of the HUD
 * @default Graphics.boxWidth - 320
 *
 * @param HUD Y
 * @desc Y position of the HUD
 * @default 10
 *
 * @param HUD Width
 * @desc Width of the HUD
 * @default 450
 *
 * @param Font Size
 * @desc Font size for the quest tasks
 * @default 22
 *
 * @help
 * ============================================================================
 * 📔 ИНСТРУКЦИЯ ПО ГЛОБАЛЬНОЙ СИСТЕМЕ КВЕСТОВ (v2.2)
 * ============================================================================
 * Этот плагин — часть "Ultra-Simple" системы квестов. 
 * Он не использует сложные JSON-файлы, а работает напрямую с переменными.
 *
 * 🛠️ ГЛАВНЫЙ ПРИНЦИП:
 * 1. Одна Переменная = Одна Глава игры.
 * 2. Номер шага (значение переменной) определяет текущую задачу на экране.
 * 3. Если переменная = 0, HUD скрывается (квест завершен).
 *
 * 🏙️ СПИСОК ПЕРЕМЕННЫХ И ГЛАВ:
 * ----------------------------------------------------------------------------
 * [Var 10] - Глава 1: Битцленд (Майк, Крысы, Брунно)
 * [Var 20] - Глава 2: Аридис (Пустыня)
 * [Var 30] - Глава 3: Технополис (Хакинг)
 * [Var 40] - Глава 4: Фростсити (Лед)
 * [Var 50] - Глава 5: Порт-Ройял (Пираты)
 * [Var 60] - Глава 6: Сильван (Лес)
 * [Var 70] - Глава 7: Финал (Башня)
 *
 * 📝 ПРИМЕР НАСТРОЙКИ СОБЫТИЯ:
 * ----------------------------------------------------------------------------
 * 1. Игрок берет квест у Майка:
 *    ► Команда: Control Variables [0010: Глава 1] = 1
 *    (На экране появится: "Поговори детектив Майк в баре")
 *
 * 2. Майк отправляет в подвал (Шаг 2):
 *    ► Команда: Control Variables [0010: Глава 1] = 2
 *    (На экране: "Убей крыс в подвале баре (0/3)")
 *
 * 🛠️ НАСТРОЙКА ТЕКСТОВ:
 * Все тексты и соответствия переменным находятся в файле:
 * js/plugins/ACTPO_QuestConfig.js
 * Вы можете менять их там вручную обычным блокнотом.
 *
 * ============================================================================
 */

(function () {
    'use strict';

    var parameters = PluginManager.parameters('ACTPO_SimpleHUD');
    var hudX = String(parameters['HUD X'] || 'Graphics.boxWidth - 320');
    var hudY = Number(parameters['HUD Y'] || 10);
    var hudWidth = Number(parameters['HUD Width'] || 300);
    var hudFontSize = Number(parameters['Font Size'] || 22);

    //=============================================================================
    // Window_SimpleQuestHUD
    //=============================================================================

    function Window_SimpleQuestHUD() {
        this.initialize.apply(this, arguments);
    }

    Window_SimpleQuestHUD.prototype = Object.create(Window_Base.prototype);
    Window_SimpleQuestHUD.prototype.constructor = Window_SimpleQuestHUD;

    Window_SimpleQuestHUD.prototype.initialize = function () {
        var x = eval(hudX);
        var y = hudY;
        var w = hudWidth;
        var h = 200; // Will be adjusted or clipped
        Window_Base.prototype.initialize.call(this, x, y, w, h);
        this.opacity = 180;
        this.refresh();
    };

    Window_SimpleQuestHUD.prototype.standardFontSize = function () {
        return hudFontSize;
    };

    Window_SimpleQuestHUD.prototype.lineHeight = function () {
        return hudFontSize + 8;
    };

    Window_SimpleQuestHUD.prototype.refresh = function () {
        this.contents.clear();
        this.resetFontSettings();
        if (!window.ACTPO_Quests) return;

        var y = 0;
        var count = 0;
        var debugTags = [];

        for (var varIdStr in window.ACTPO_Quests) {
            var varId = Number(varIdStr);
            var val = $gameVariables.value(varId);
            if (val <= 0) continue;

            var quest = window.ACTPO_Quests[varId];
            if (!quest) continue;

            var stepText = quest[val];

            if (stepText) {
                if (count === 0) {
                    this.changeTextColor(this.systemColor());
                    this.drawText("Текущие задачи:", 0, y, this.contentsWidth(), 'center');
                    this.resetTextColor();
                    y += this.lineHeight();
                }

                // Store tag for top display
                debugTags.push("[ID " + varId + ": v" + val + "]");

                // Draw bullet and text
                this.drawText("• ", 0, y, 25);
                this.drawTextEx(stepText, 25, y);
                y += this.lineHeight();
                count++;
            }
        }

        // Draw all debug tags in one place (top right)
        if (debugTags.length > 0) {
            this.changePaintOpacity(120);
            this.contents.fontSize = 12;
            var debugStr = debugTags.join(" ");
            this.drawText(debugStr, 0, 0, this.contentsWidth() - 5, 'right');
            this.resetFontSettings();
            this.changePaintOpacity(255);
        }

        // Adjust window height based on content
        var newH = count > 0 ? (y + this.standardPadding() * 2 + 10) : 0;
        if (this.height !== newH) {
            this.height = newH;
        }
        this.visible = (count > 0);
    };

    Window_SimpleQuestHUD.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        // Refresh every 20 frames or on variable change detection
        if (Graphics.frameCount % 20 === 0) {
            this.refresh();
        }
    };

    //=============================================================================
    // Scene_Map
    //=============================================================================

    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function () {
        _Scene_Map_createAllWindows.call(this);
        this.createSimpleQuestHUD();
    };

    Scene_Map.prototype.createSimpleQuestHUD = function () {
        this._simpleQuestHUD = new Window_SimpleQuestHUD();
        this.addWindow(this._simpleQuestHUD);
    };

})();
