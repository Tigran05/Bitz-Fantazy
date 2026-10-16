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
    // The quest system historically calls the third story stone "fire";
    // this plugin and older saves call it "lava". Treat both as one stone.
    var TYPES = ['ice', 'curse', 'lava'];

    BF.elementalStones = BF.elementalStones || {};

    function noteHas(notes, words) {
        return Object.keys(notes || {}).some(function(key) {
            var value = String(notes[key] || '').toLowerCase();
            return value.indexOf('кристалл') >= 0 && words.some(function(word) {
                return value.indexOf(word) >= 0;
            });
        });
    }

    function normalize(game) {
        if (!game) return null;
        if (!game._elementalStones || typeof game._elementalStones !== 'object' || Array.isArray(game._elementalStones)) {
            game._elementalStones = {};
        }
        var s = game._elementalStones;
        s.ice = s.ice === true;
        s.curse = s.curse === true;
        // Migrate both historical spellings without asking the player to recollect.
        s.fire = s.fire === true || s.lava === true;
        s.lava = s.fire;

        var notes = game._notes || {};
        if (!s.ice && noteHas(notes, ['ледян'])) s.ice = true;
        if (!s.curse && noteHas(notes, ['проклят'])) s.curse = true;
        if (!s.fire && noteHas(notes, ['огнен', 'лавов'])) s.fire = true;
        s.lava = s.fire;
        return s;
    }

    function syncQuest(game) {
        if (typeof BF.syncElementalStones === 'function') BF.syncElementalStones(game);
        var q = game && game.get ? game.get('forest_city') : null;
        var s = game && game._elementalStones;
        if (s && s.ice && s.curse && (s.fire || s.lava)) {
            game._notes = game._notes || {};
            game._notes.elemental_stones = 'Все три волшебных камня собраны. Нужно принести их старцу Лесного города.';
            // Keep quest progression in sync even if an older save had the flags
            // but the automatic migration did not advance the step yet.
            if (q && q.status === 'active' && Number(q.step) === 3 && typeof game.nextStep === 'function') {
                game.nextStep('forest_city');
            }
        }
    }

    BF.elementalStones.get = function() {
        return normalize(BF.game());
    };

    BF.elementalStones.has = function(id) {
        id = String(id || '').toLowerCase();
        if (id === 'fire') id = 'lava';
        if (TYPES.indexOf(id) < 0) return false;
        return !!BF.elementalStones.get()[id];
    };

    BF.elementalStones.count = function() {
        var s = BF.elementalStones.get();
        return (s.ice ? 1 : 0) + (s.curse ? 1 : 0) + ((s.fire || s.lava) ? 1 : 0);
    };

    BF.elementalStones.collect = function(id) {
        id = String(id || '').toLowerCase();
        if (id === 'fire') id = 'lava';
        if (TYPES.indexOf(id) < 0) return false;
        var game = BF.game();
        if (!game) return false;
        var s = normalize(game);
        var canonical = id === 'lava' ? 'fire' : id;
        if (id === 'lava') {
            if (s.fire || s.lava) {
                game._notes = game._notes || {};
                if (!game._notes.elemental_stone_fire && !game._notes.elemental_stone_lava) {
                    game._notes.elemental_stone_lava = 'Получен: Кристалл лавовой пещеры.';
                }
                syncQuest(game);
                return false;
            }
            s.fire = true;
            s.lava = true;
        } else {
            if (s[id]) {
                game._notes = game._notes || {};
                var existingNames = { ice: 'Ледяной кристалл', curse: 'Кристалл проклятой пещеры' };
                if (!game._notes['elemental_stone_' + id]) game._notes['elemental_stone_' + id] = 'Получен: ' + existingNames[id] + '.';
                syncQuest(game);
                return false;
            }
            s[id] = true;
        }
        game._notes = game._notes || {};
        var noteId = canonical === 'fire' ? 'elemental_stone_fire' : 'elemental_stone_' + id;
        var stoneNames = { ice: 'Ледяной кристалл', curse: 'Кристалл проклятой пещеры', fire: 'Кристалл лавовой пещеры' };
        game._notes[noteId] = 'Получен: ' + stoneNames[canonical] + '.';
        if (canonical === 'fire') game._notes.elemental_stone_lava = game._notes[noteId];
        syncQuest(game);
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
