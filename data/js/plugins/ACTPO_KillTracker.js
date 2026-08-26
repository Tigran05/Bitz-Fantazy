/*:
 * @plugindesc v1.0 Simple Kill Tracker [ACTPO]
 * @author ACTPOJIuT
 *
 * @help
 * ============================================================================
 * Описание
 * ============================================================================
 * Плагин для простого отслеживания убийств врагов.
 * При смерти врага прибавляет +1 к указанной переменной.
 * 
 * Настройка в файле ACTPO_QuestConfig.js в объекте window.ACTPO_KillTargets.
 * 
 * Пример:
 * window.ACTPO_KillTargets = {
 *    10: 11 // Враг ID 10 (Крыса) прибавляет +1 к Переменной ID 11
 * };
 */

(function () {
    'use strict';

    var _Game_Enemy_die = Game_Enemy.prototype.die;
    Game_Enemy.prototype.die = function () {
        _Game_Enemy_die.call(this);

        if (window.ACTPO_KillTargets) {
            var varId = window.ACTPO_KillTargets[this.enemyId()];
            if (varId > 0) {
                var currentVal = $gameVariables.value(varId);
                $gameVariables.setValue(varId, currentVal + 1);
                console.log("ACTPO KillTracker: Enemy " + this.enemyId() + " killed. Var " + varId + " = " + (currentVal + 1));
            }
        }
    };

})();
