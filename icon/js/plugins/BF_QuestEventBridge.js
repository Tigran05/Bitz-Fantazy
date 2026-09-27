/*:
 * @plugindesc Bitz Fantasy — Quest Event Bridge
 * @author ASTROLIT GAMES
 *
 * @help
 * Связывает завершение игровых событий с текущими шагами квестов.
 *
 * 1) RatCatch -> следующий шаг квеста bartender.
 * 2) Получение цифры сейфа через переменные 11/12/13 автоматически
 *    завершает соответствующий квест bar/engineer/manager.
 *
 * ВАЖНО: имя файла и плагина не меняется.
 */
(function(){
'use strict';

// ------------------------------------------------------------
// RatCatch: успешная мини-игра включает Self Switch A.
// ------------------------------------------------------------
var _sceneMapUpdate = Scene_Map.prototype.update;
Scene_Map.prototype.update = function(){
    _sceneMapUpdate.call(this);

    if (!$gameTemp || !$gameBFQuests) return;

    // --- Крысы / бармен ---
    if ($gameTemp._ratCatchEventId) {
        var eid=Number($gameTemp._ratCatchEventId);
        var mapId=$gameMap.mapId();
        var done=$gameSelfSwitches.value([mapId,eid,'A']);

        if(done && !$gameTemp._bfRatQuestApplied) {
            $gameTemp._bfRatQuestApplied=true;
            var game=BF_QuestSystem && BF_QuestSystem.game ? BF_QuestSystem.game() : null;
            if (game && game.status('bartender')==='active') {
                game.nextStep('bartender');
            }
        }

        if(!done) $gameTemp._bfRatQuestApplied=false;
    }

    // --- Цифры сейфа / рабочие квесты ---
    // Переменная становится цифрой только в момент фактической выдачи
    // результата. Это позволяет не зависеть от конкретного события NPC.
    var game2 = (window.BF_QuestSystem && BF_QuestSystem.game) ? BF_QuestSystem.game() : null;
    if (!game2 || !$gameVariables) return;

    var checks = [
        { id:'bartender', variable:11, digit:2 },
        { id:'engineer',  variable:12, digit:7 },
        { id:'manager',   variable:13, digit:4 }
    ];

    $gameTemp._bfQuestDigitSnapshot = $gameTemp._bfQuestDigitSnapshot || {};

    checks.forEach(function(c){
        var value=Number($gameVariables.value(c.variable));
        var key=String(c.variable);
        var previous=$gameTemp._bfQuestDigitSnapshot[key];

        // Первый проход после загрузки/старта только запоминает значение,
        // чтобы старое значение переменной не завершало новый квест.
        if (previous === undefined) {
            $gameTemp._bfQuestDigitSnapshot[key]=value;
            return;
        }

        if (value !== previous) {
            $gameTemp._bfQuestDigitSnapshot[key]=value;
        }

        // Цифра является фактом завершения задания. Не ждём отдельного
        // "изменения" переменной: если активный квест уже видит правильную
        // цифру (в том числе после диалога/NPC), он завершается сразу.
        if (game2.status(c.id)==='active' && value===c.digit) {
            game2.complete(c.id);
        }
    });
};

// Clear the one-shot RatCatch flag whenever a new RatCatch starts.
var _pluginCommand=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){
    _pluginCommand.call(this,command,args);
    if(String(command).toUpperCase()==='RATCATCH' &&
       args && String(args[0]).toLowerCase()==='start'){
        if($gameTemp) $gameTemp._bfRatQuestApplied=false;
    }
};

})();
