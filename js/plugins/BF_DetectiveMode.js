/*:
 * @plugindesc Bitz Fantasy — детективный режим: отключает боевые столкновения.
 * @author Bitz Fantasy
 *
 * @help
 * В кампании расследований конфликт разрешается уликами, а не боем.
 * Плагин отключает случайные встречи и заменяет команду Battle Processing
 * на успешное мирное разрешение. Старые события продолжают выполнять свои
 * ветки успеха, поэтому переходы карт и квестовые переменные не ломаются.
 */
(function() {
    'use strict';

    var _executeEncounter = Game_Player.prototype.executeEncounter;
    Game_Player.prototype.executeEncounter = function() {
        if ($gameSystem && $gameSystem._bfDetectiveMode !== false) return false;
        return _executeEncounter.call(this);
    };

    var _command301 = Game_Interpreter.prototype.command301;
    Game_Interpreter.prototype.command301 = function() {
        if ($gameSystem && $gameSystem._bfDetectiveMode === false) {
            return _command301.call(this);
        }

        // Battle branches use 0 for a win. Preserve legacy event flow while
        // turning the confrontation into a non-violent resolution.
        this._branch[this._indent] = 0;
        if (!$gameMessage.isBusy()) {
            $gameMessage.add('Конфликт разрешён расследованием: улики говорят сами за себя.');
        }
        return true;
    };

    var _initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _initialize.call(this);
        this._bfDetectiveMode = true;
    };
})();
