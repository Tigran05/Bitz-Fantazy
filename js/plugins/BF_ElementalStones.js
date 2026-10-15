/*:
 * @plugindesc Bitz Fantasy — состояние трёх камней Лесного города
 * @author ASTROLIT GAMES
 *
 * @help
 * Единое состояние трёх камней:
 *   ice   — Ледяная пещера
 *   curse — Проклятая пещера
 *   lava  — Лавовая пещера
 *
 * Сами мини-игры живут в своих плагинах/событиях.
 * Этот плагин только хранит прогресс и связывает его с BF_QuestSystem.
 *
 * Когда собрано 3/3, forest_city переходит с шага 3 на шаг 4.
 */
(function() {
    'use strict';

    var BF = window.BF_QuestSystem = window.BF_QuestSystem || {};
    var TYPES = ['ice', 'curse', 'lava'];

    BF.elementalStones = BF.elementalStones || {};

    function normalize(game) {
        if (!game) return null;
        if (!game._elementalStones || typeof game._elementalStones !== 'object' || Array.isArray(game._elementalStones)) {
            game._elementalStones = {};
        }
        TYPES.forEach(function(id) {
            game._elementalStones[id] = game._elementalStones[id] === true;
        });
        return game._elementalStones;
    }

    BF.elementalStones.get = function() {
        return normalize(BF.game());
    };

    BF.elementalStones.has = function(id) {
        id = String(id || '').toLowerCase();
        if (TYPES.indexOf(id) < 0) return false;
        return !!BF.elementalStones.get()[id];
    };

    BF.elementalStones.count = function() {
        var s = BF.elementalStones.get();
        return TYPES.reduce(function(n, id) { return n + (s[id] ? 1 : 0); }, 0);
    };

    BF.elementalStones.collect = function(id) {
        id = String(id || '').toLowerCase();
        if (TYPES.indexOf(id) < 0) return false;
        var game = BF.game();
        if (!game) return false;
        var s = normalize(game);
        if (s[id]) {
            // Keep the journal repaired for older saves where the flag exists
            // but the note was never written.
            game._notes = game._notes || {};
            var knownNames = { ice: 'Ледяной кристалл', curse: 'Кристалл проклятой пещеры', lava: 'Кристалл лавовой пещеры' };
            if (!game._notes['elemental_stone_' + id]) game._notes['elemental_stone_' + id] = 'Получен: ' + knownNames[id] + '.';
            return false;
        }
        s[id] = true;
        game._notes = game._notes || {};
        var stoneNames = { ice: 'Ледяной кристалл', curse: 'Кристалл проклятой пещеры', lava: 'Кристалл лавовой пещеры' };
        game._notes['elemental_stone_' + id] = 'Получен: ' + stoneNames[id] + '.';
        var q = game.get ? game.get('forest_city') : null;
        if (BF.elementalStones.count() >= 3) {
            game._notes.elemental_stones = 'Собраны все три волшебных кристалла. Нужно отнести их старцу.';
            if (q && q.status === 'active' && Number(q.step) === 3 && game.nextStep) game.nextStep('forest_city');
        }
        return true;
    };

    // Compatibility helper used by the ice puzzle.
    BF.elementalCollect = function(id) {
        return BF.elementalStones.collect(id);
    };

    function installHooks() {
        if (!window.DataManager) return;
        var _create = DataManager.createGameObjects;
        if (!_create.__bfElementalStonesWrapped) {
            var wrappedCreate = function() {
                _create.call(this);
                if (window.$gameBFQuests && BF.game) normalize(BF.game());
            };
            wrappedCreate.__bfElementalStonesWrapped = true;
            DataManager.createGameObjects = wrappedCreate;
        }
        var _extract = DataManager.extractSaveContents;
        if (!_extract.__bfElementalStonesWrapped) {
            var wrappedExtract = function(contents) {
                _extract.call(this, contents);
                if (window.$gameBFQuests && BF.game) normalize(BF.game());
            };
            wrappedExtract.__bfElementalStonesWrapped = true;
            DataManager.extractSaveContents = wrappedExtract;
        }
    }
    installHooks();
})();
