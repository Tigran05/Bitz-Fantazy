/*:
 * @plugindesc Bitz Fantasy — Sokoban puzzle: pushable crates, target tiles, crystal reward, and reset switch.
 * @author ASTROLIT GAMES
 *
 * @help
 * BF_CratePuzzle.js — RPG Maker MV
 *
 * EVENT TAGS (put in Note OR as a comment on the event page):
 *   <BF_CRATE>          Pushable crate. Its starting position is remembered.
 *   <BF_CRATE_TARGET>   Target tile. Keep its event graphic visible as a floor mark.
 *   <BF_CRATE_CRYSTAL>  Crystal reward. Hidden until every target is occupied.
 *   <BF_CRATE_RESET>    Reset switch. Interact with it to return all crates to start.
 *
 * HOW TO USE:
 * 1. Create one event per crate, target, crystal, and reset switch.
 * 2. Add the matching Note tag to each event.
 * 3. Set crate events to Through = ON and Priority = Same as Characters (recommended).
 *    The plugin handles crate movement and prevents moving into blocked tiles.
 * 4. Place target events on the exact cells where crates must end up.
 * 5. Set the crystal event's graphic on its page; the plugin hides it until solved.
 * 6. Add this plugin in Plugin Manager and enable it.
 *
 * CONTROLS:
 * - Stand next to a crate and press OK/Z/Enter while facing it. The crate moves
 *   exactly one tile away from the player (in the direction the player faces).
 * - If a crate is pushed into a wall, another crate, or a blocking event, it won't move.
 * - When every target has a crate, the crystal appears.
 * - Face and interact with the reset switch to reset all crates and the puzzle.
 *
 * PLUGIN COMMANDS:
 *   BF_CratePuzzle reset   — reset puzzle on the current map
 *   BF_CratePuzzle status  — print puzzle state to console
 *
 * NOTES:
 * - Use a separate puzzle map or ensure only one crate puzzle is active per map.
 * - Puzzle state is saved with the game. Starting positions are captured when the map loads.
 */
(function() {
    'use strict';

    var TAG_CRATE = /<BF_CRATE\s*>/i;
    var TAG_TARGET = /<BF_CRATE_TARGET\s*>/i;
    var TAG_CRYSTAL = /<BF_CRATE_CRYSTAL\s*>/i;
    var TAG_RESET = /<BF_CRATE_RESET\s*>/i;

    // Accept tags in the event Note field OR in event-page comments.
    // This is friendlier for RPG Maker MV users who put tags into page commands.
    function noteHas(event, regex) {
        if (!event || !event.event) return false;
        var data = event.event();
        if (regex.test(data.note || '') || regex.test(data.name || '')) return true;
        // Search comments on every event page, not only the currently active page.
        // This avoids losing the crate tag when a switch changes the active page.
        var pages = data.pages || [];
        for (var p = 0; p < pages.length; p++) {
            var list = pages[p] && pages[p].list ? pages[p].list : [];
            var text = '';
            for (var i = 0; i < list.length; i++) {
                var command = list[i];
                if (command && (command.code === 108 || command.code === 408) && command.parameters) {
                    text += String(command.parameters[0] || '') + '\n';
                }
            }
            if (regex.test(text)) return true;
        }
        return false;
    }
    function isCrate(event) { return noteHas(event, TAG_CRATE); }
    function isTarget(event) { return noteHas(event, TAG_TARGET); }
    function isCrystal(event) { return noteHas(event, TAG_CRYSTAL); }
    function isReset(event) { return noteHas(event, TAG_RESET); }

    function mapKey() { return String($gameMap.mapId()); }
    function stateForMap() {
        if (!$gameSystem._bfCratePuzzleStates) $gameSystem._bfCratePuzzleStates = {};
        var key = mapKey();
        if (!$gameSystem._bfCratePuzzleStates[key]) {
            $gameSystem._bfCratePuzzleStates[key] = { solved: false, collected: false, starts: {}, initialized: false };
        }
        return $gameSystem._bfCratePuzzleStates[key];
    }
    function puzzleEvents() {
        var events = $gameMap.events();
        return {
            crates: events.filter(isCrate),
            targets: events.filter(isTarget),
            crystals: events.filter(isCrystal),
            resets: events.filter(isReset)
        };
    }
    function isOccupiedByCrate(x, y, exceptEvent) {
        return puzzleEvents().crates.some(function(crate) {
            return crate !== exceptEvent && crate.x === x && crate.y === y;
        });
    }
    function targetOccupied(target, crates) {
        return crates.some(function(crate) { return crate.x === target.x && crate.y === target.y; });
    }
    function allTargetsFilled() {
        var objs = puzzleEvents();
        if (!objs.targets.length || !objs.crates.length) return false;
        return objs.targets.every(function(target) { return targetOccupied(target, objs.crates); });
    }
    function refreshCrystalVisibility() {
        var s = stateForMap();
        puzzleEvents().crystals.forEach(function(crystal) {
            crystal.setTransparent(!s.solved || s.collected);
            crystal.setThrough(true);
            crystal.setPriorityType(0);
        });
    }
    function setPuzzleSolved() {
        var s = stateForMap();
        if (s.solved || !allTargetsFilled()) return;
        s.solved = true;
        s.collected = false;
        refreshCrystalVisibility();
        if (window.SoundManager && SoundManager.playRecovery) SoundManager.playRecovery();
        // RPG Maker MV compatibility: some projects replace $gameTemp or omit requestAnimation.
        // Never let a cosmetic animation crash puzzle completion.
        if (window.$gameTemp && typeof $gameTemp.requestAnimation === 'function') {
            $gameTemp.requestAnimation(puzzleEvents().crystals.map(function(e) { return e.eventId(); }), 0);
        } else if (window.$gameScreen && typeof $gameScreen.startFlash === 'function') {
            $gameScreen.startFlash([255, 235, 160, 120], 24);
        }
        if (window.$gameMessage && !$gameMessage.isBusy()) {
            $gameMessage.add('Раздался гул древнего механизма. На алтаре появился кристалл!');
        }
    }
    function initializePuzzle() {
        var s = stateForMap();
        var objs = puzzleEvents();
        if (!s.initialized) {
            s.starts = {};
            objs.crates.forEach(function(crate) {
                s.starts[String(crate.eventId())] = { x: crate.x, y: crate.y };
            });
            s.initialized = true;
        }
        // Crates must physically block the player; the plugin intercepts OK to push them.
        objs.crates.forEach(function(crate) {
            crate.setThrough(false);
            crate.setPriorityType(1);
        });
        // Targets and the reset switch are floor/interact objects, not blockers.
        objs.targets.forEach(function(target) { target.setThrough(true); target.setPriorityType(0); });
        objs.resets.forEach(function(reset) { reset.setThrough(true); reset.setPriorityType(0); });
        objs.crystals.forEach(function(crystal) { crystal.setThrough(true); crystal.setPriorityType(0); });
        refreshCrystalVisibility();
        if (!objs.crates.length || !objs.targets.length || !objs.crystals.length || !objs.resets.length) {
            console.warn('[BF_CratePuzzle] Проверь теги объектов на карте ' + $gameMap.mapId() +
                ': ящики=' + objs.crates.length + ', точки=' + objs.targets.length +
                ', кристаллы=' + objs.crystals.length + ', рубильники=' + objs.resets.length +
                '. Теги можно писать в Note или в комментарии события.');
        }
        if (allTargetsFilled()) setPuzzleSolved();
    }
    function canPush(crate, direction) {
        var x = $gameMap.roundXWithDirection(crate.x, direction);
        var y = $gameMap.roundYWithDirection(crate.y, direction);
        if (!$gameMap.isValid(x, y)) return false;
        if (!$gameMap.isPassable(crate.x, crate.y, direction)) return false;
        var reverse = 10 - direction;
        if (!$gameMap.isPassable(x, y, reverse)) return false;
        if (isOccupiedByCrate(x, y, crate)) return false;
        var blocked = $gameMap.eventsXyNt(x, y).some(function(event) {
            if (event === crate || isTarget(event) || isReset(event) || isCrystal(event)) return false;
            if (isCrate(event)) return true;
            return event.isNormalPriority();
        });
        if (blocked) return false;
        if ($gamePlayer.x === x && $gamePlayer.y === y) return false;
        return { x: x, y: y };
    }
    function pushCrate(crate, direction) {
        var s = stateForMap();
        if (s.solved) return false;
        var dest = canPush(crate, direction);
        if (!dest) {
            if (window.SoundManager && SoundManager.playBuzzer) SoundManager.playBuzzer();
            return true;
        }
        crate.locate(dest.x, dest.y);
        crate.setDirection(direction);
        crate.straighten();
        if (window.SoundManager && SoundManager.playCursor) SoundManager.playCursor();
        if (allTargetsFilled()) setPuzzleSolved();
        return true;
    }
    function resetPuzzle() {
        var s = stateForMap();
        var objs = puzzleEvents();
        objs.crates.forEach(function(crate) {
            var start = s.starts[String(crate.eventId())];
            if (start) crate.locate(start.x, start.y);
        });
        s.solved = false;
        s.collected = false;
        refreshCrystalVisibility();
        if (window.SoundManager && SoundManager.playRecovery) SoundManager.playRecovery();
    }
    var lastResetFrame = -9999;
    function eventInFront() {
        var direction = $gamePlayer.direction();
        var x = $gameMap.roundXWithDirection($gamePlayer.x, direction);
        var y = $gameMap.roundYWithDirection($gamePlayer.y, direction);
        return $gameMap.eventsXy(x, y);
    }

    var _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        // Map setup has loaded event data, but defer object capture until first update.
        this._bfCratePuzzleNeedsInit = true;
    };

    var _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (this._bfCratePuzzleNeedsInit && !$gameMessage.isBusy()) {
            this._bfCratePuzzleNeedsInit = false;
            initializePuzzle();
        } else if (!$gameMessage.isBusy()) {
            // Keep the reward hidden even if an event page changes transparency.
            refreshCrystalVisibility();
        }
    };

    var _Game_Player_triggerAction = Game_Player.prototype.triggerAction;
    Game_Player.prototype.triggerAction = function() {
        // Input.isTriggered fires once per key press. Do not maintain a second
        // lock here: triggerAction is not guaranteed to run on the release frame,
        // which could leave a lock stuck and make every crate immovable.
        if (this.canMove() && !$gameMessage.isBusy()) {
            var events = eventInFront();
            var crate = events.filter(isCrate)[0];
            if (crate) {
                if (!(window.BF_InteractionButton ? window.BF_InteractionButton.consumeAction() : Input.isTriggered('ok'))) return true;
                return pushCrate(crate, this.direction());
            }
            var reset = events.filter(isReset)[0];
            if (reset) {
                if (!(window.BF_InteractionButton ? window.BF_InteractionButton.consumeAction() : Input.isTriggered('ok'))) return true;
                var frame = Graphics.frameCount || 0;
                if (frame - lastResetFrame < 30) return true;
                lastResetFrame = frame;
                resetPuzzle();
                $gameMessage.add('Ящики возвращены на исходные места.');
                return true;
            }
            var crystal = events.filter(isCrystal)[0];
            var s = stateForMap();
            if (crystal && s.solved && !s.collected) {
                if (!(window.BF_InteractionButton ? window.BF_InteractionButton.consumeAction() : Input.isTriggered('ok'))) return true;
                s.collected = true;
                refreshCrystalVisibility();
                var recorded = false;
                var BF = window.BF_QuestSystem;
                if (BF && BF.elementalStones && typeof BF.elementalStones.collect === 'function') {
                    recorded = BF.elementalStones.collect('curse');
                } else if (BF && typeof BF.elementalCollect === 'function') {
                    recorded = BF.elementalCollect('curse');
                }
                // The crate reward on map 041 is the cursed-cave crystal. Keep
                // its journal entry even if the shared quest plugin is missing.
                if (!recorded && BF && typeof BF.game === 'function') {
                    var game = BF.game();
                    if (game) {
                        game._notes = game._notes || {};
                        if (!game._notes.elemental_stone_curse) {
                            game._notes.elemental_stone_curse = 'Получен: Кристалл проклятой пещеры.';
                        }
                    }
                }
                if (window.SoundManager && SoundManager.playRecovery) SoundManager.playRecovery();
                $gameMessage.add('Ты получил Кристалл проклятой пещеры!');
                return true;
            }
        }
        return _Game_Player_triggerAction.call(this);
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() !== 'bf_cratepuzzle') return;
        var action = String((args || [])[0] || '').toLowerCase();
        if (action === 'reset') {
            if (!stateForMap().initialized) initializePuzzle();
            resetPuzzle();
        }
        if (action === 'status') {
            var objs = puzzleEvents();
            var s = stateForMap();
            console.log('[BF_CratePuzzle]', { mapId: $gameMap.mapId(), crates: objs.crates.length, targets: objs.targets.length, solved: s.solved, collected: s.collected });
        }
    };
})();
