/*:
 * @plugindesc v3.0 Бесшовное автосохранение и возрождение в гостинице (MMO Style)
 * @author ACTPOJIuT
 *
 * @param ---Main---
 * @default
 *
 * @param AutoSaveSlot
 * @text Слот Автосохранения
 * @parent ---Main---
 * @desc Номер слота для автосохранения.
 * @type number
 * @default 1
 *
 * @param ShowVisualIndicator
 * @text Визуальный Индикатор
 * @parent ---Main---
 * @desc Показывать надпись "Сохранение..." в углу экрана?
 * @type boolean
 * @default true
 *
 * @param SaveInterval
 * @text Интервал (сек)
 * @parent ---Main---
 * @desc Как часто сохранять игру автоматически (0 - выкл).
 * @type number
 * @default 60
 *
 * @param ---Respawn---
 * @default
 *
 * @param CityConfig
 * @text Настройка Городов
 * @parent ---Respawn---
 * @desc Настройка связей Город->Гостиница. Формат: IDГорода:IDГостиницы:X:Y
 * @type text[]
 * @default []
 *
 * @param GoldLossPercent
 * @text Штраф Золота (%)
 * @parent ---Respawn---
 * @desc Сколько процентов золота теряется при смерти.
 * @type number
 * @min 0
 * @max 100
 * @default 10
 *
 * @param ExpLossPercent
 * @text Штраф Опыта (%)
 * @parent ---Respawn---
 * @desc Сколько процентов опыта текущего уровня теряется при смерти.
 * @type number
 * @min 0
 * @max 100
 * @default 5
 *
 * @help
 * ============================================================================
 * ACTPO AutoSave v3.0
 * ============================================================================
 * Плагин для автоматического сохранения и системы возрождения как в MMO.
 *
 * ----------------------------------------------------------------------------
 * КАК НАСТРОИТЬ ГОРОДА И ГОСТИНИЦЫ
 * ----------------------------------------------------------------------------
 * В параметре "Настройка Городов" добавьте строки в формате:
 *    TownMapID:InnMapID:X:Y
 *
 * Где:
 * - TownMapID: ID карты города. Когда игрок заходит сюда, плагин запоминает,
 *              что это "Последний посещенный город".
 * - InnMapID:  ID карты, куда игрок попадет после смерти (Гостиница).
 * - X, Y:      Координаты клетки, куда телепортируется игрок.
 *
 * ПРИМЕР:
 * 2:5:10:8
 * (Если игрок был в Городе 2, то после смерти он окажется на Карте 5 в клетке 10,8)
 *
 * ----------------------------------------------------------------------------
 * КАК РАБОТАЕТ ВОЗРОЖДЕНИЕ
 * ----------------------------------------------------------------------------
 * 1. Когда вся команда погибает, экран Game Over НЕ показывается.
 * 2. Вместо этого рассчитываются штрафы (Золото и Опыт).
 * 3. Команда полностью исцеляется.
 * 4. Игрок переносится в последнюю запомненную гостиницу.
 *    (Если городов еще не было, перенос на точку Старта Игры).
 * 5. Игра автоматически сохраняется.
 *
 * ----------------------------------------------------------------------------
 * УПРАВЛЕНИЕ
 * ----------------------------------------------------------------------------
 * Плагин работает автоматически.
 * Автосохранение происходит:
 * - При смене карты
 * - После битвы
 * - При закрытии меню
 * - По таймеру
 */

(function () {
    'use strict';

    // --- Parameters Parsing ---
    var parameters = PluginManager.parameters('ACTPO_AutoSave');
    var autoSaveSlot = Number(parameters['AutoSaveSlot'] || 1);
    var showVisualIndicator = String(parameters['ShowVisualIndicator']) === 'true';
    var saveInterval = Number(parameters['SaveInterval'] || 60);

    var rawCityConfig = JSON.parse(parameters['CityConfig'] || '[]');
    var goldLossPercent = Number(parameters['GoldLossPercent'] || 0);
    var expLossPercent = Number(parameters['ExpLossPercent'] || 0);

    // Parse City Config into a usable map: { townId: { mapId, x, y } }
    var cityRespawnMap = {};
    rawCityConfig.forEach(function (line) {
        var parts = line.split(':');
        if (parts.length >= 4) {
            var townId = Number(parts[0]);
            cityRespawnMap[townId] = {
                mapId: Number(parts[1]),
                x: Number(parts[2]),
                y: Number(parts[3])
            };
        }
    });

    // --- Logic: Track Last City ---

    // Alias Game_System to init data
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        _Game_System_initialize.call(this);
        this._actpoLastCityId = 0;
    };

    Game_System.prototype.setLastCityId = function (id) {
        this._actpoLastCityId = id;
    };

    Game_System.prototype.getLastCityId = function () {
        return this._actpoLastCityId || 0;
    };

    // Check for City on Map Transfer + AutoSave Flag
    var _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function () {
        if (this.isTransferring()) {
            var destMapId = this._newMapId;
            // Check if this map ID is a registered Town ID
            if (cityRespawnMap[destMapId]) {
                $gameSystem.setLastCityId(destMapId);
            }
            // Set flag to save after scene transition
            DataManager.actpoShouldAutoSaveTransfer = true;
        }
        _Game_Player_performTransfer.call(this);
    };

    // --- Logic: AutoSave Triggers ---

    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        _Scene_Map_start.call(this);

        // Check for Respawn Message
        if (DataManager.actpoRespawnMessage) {
            $gameMessage.add(DataManager.actpoRespawnMessage);
            DataManager.actpoRespawnMessage = null;
        }

        // Check for Transfer AutoSave
        if (DataManager.actpoShouldAutoSaveTransfer) {
            DataManager.actpoShouldAutoSaveTransfer = false;
            // Delay slightly to ensure map is ready? Usually safe here.
            ACTPO_AutoSaveManager.performAutoSave();
        }
    };

    // Save on Menu Close
    var _Scene_Menu_terminate = Scene_Menu.prototype.terminate;
    Scene_Menu.prototype.terminate = function () {
        _Scene_Menu_terminate.call(this);
        ACTPO_AutoSaveManager.performAutoSave();
    };

    // Save on Battle End
    var _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function (result) {
        _BattleManager_endBattle.call(this, result);
        ACTPO_AutoSaveManager.performAutoSave();
    };

    // Timer Logic
    var _Game_Map_update = Game_Map.prototype.update;
    var _timerTick = 0;
    Game_Map.prototype.update = function (sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (saveInterval > 0 && sceneActive) {
            _timerTick++;
            if (_timerTick >= saveInterval * 60) {
                _timerTick = 0;
                ACTPO_AutoSaveManager.performAutoSave();
            }
        }
    };

    // --- Logic: AutoSave Manager ---

    function ACTPO_AutoSaveManager() { }

    ACTPO_AutoSaveManager.performAutoSave = function () {
        if ($gamePlayer.isMoving()) return; // Don't save while walking

        // Use DataManager directly
        $gameSystem.onBeforeSave();
        if (DataManager.saveGame(autoSaveSlot)) {
            if (showVisualIndicator) {
                ACTPO_AutoSaveManager.showIndicator();
            }
        } else {
            console.warn("ACTPO AutoSave: Failed to save.");
        }
    };

    ACTPO_AutoSaveManager.showIndicator = function () {
        var scene = SceneManager._scene;
        if (!scene) return;

        if (scene._actpoSaveIndicator) {
            scene._actpoSaveIndicator.refresh();
            return;
        }

        var sprite = new Sprite();
        var bitmap = new Bitmap(200, 48);
        bitmap.fontSize = 24;
        bitmap.textColor = '#ffffff';
        bitmap.outlineWidth = 2;
        bitmap.outlineColor = 'rgba(0, 0, 0, 0.8)';
        bitmap.drawText("Сохранение...", 0, 0, 200, 48, 'right');
        sprite.bitmap = bitmap;
        sprite.x = Graphics.boxWidth - 210;
        sprite.y = Graphics.boxHeight - 60;
        sprite.opacity = 0;

        sprite.update = function () {
            if (this._timer > 0) {
                this._timer--;
                if (this.opacity < 255) this.opacity += 25;
            } else {
                if (this.opacity > 0) this.opacity -= 15;
                if (this.opacity <= 0 && this.parent) {
                    this.parent.removeChild(this);
                    scene._actpoSaveIndicator = null;
                }
            }
        };

        sprite.refresh = function () {
            this._timer = 60;
            this.opacity = 255;
        };

        sprite._timer = 60;
        scene.addChild(sprite);
        scene._actpoSaveIndicator = sprite;
    };

    // --- Logic: Respawn System ---

    var _Scene_Map_checkGameover = Scene_Map.prototype.checkGameover;
    Scene_Map.prototype.checkGameover = function () {
        if ($gameParty.isAllDead()) {
            ACTPO_RespawnManager.executeRespawn();
        } else {
            // Call original if not dead (rarely useful for Map, but safe)
            if (_Scene_Map_checkGameover) _Scene_Map_checkGameover.call(this);
        }
    };

    var _Scene_Battle_checkGameover = Scene_Battle.prototype.checkGameover;
    Scene_Battle.prototype.checkGameover = function () {
        if ($gameParty.isAllDead()) {
            ACTPO_RespawnManager.executeRespawn();
        } else {
            if (_Scene_Battle_checkGameover) _Scene_Battle_checkGameover.call(this);
        }
    };

    function ACTPO_RespawnManager() { }

    ACTPO_RespawnManager.executeRespawn = function () {
        // 1. Calculate Penalties
        var goldLost = Math.floor($gameParty.gold() * (goldLossPercent / 100));
        $gameParty.loseGold(goldLost);

        $gameParty.members().forEach(function (actor) {
            var expToLose = Math.floor(actor.currentExp() * (expLossPercent / 100));
            var baseExp = actor.expForLevel(actor.level);
            if (actor.currentExp() - expToLose < baseExp) {
                expToLose = actor.currentExp() - baseExp;
            }
            if (expToLose > 0) {
                actor.changeExp(actor.currentExp() - expToLose, false);
            }
        });

        // 2. Heal
        $gameParty.members().forEach(function (member) {
            member.recoverAll();
        });

        // 3. Determine Destination
        var lastTownId = $gameSystem.getLastCityId();
        var target = cityRespawnMap[lastTownId];

        var destMapId, destX, destY;

        if (target) {
            destMapId = target.mapId;
            destX = target.x;
            destY = target.y;
        } else {
            destMapId = $dataSystem.startMapId;
            destX = $dataSystem.startX;
            destY = $dataSystem.startY;
        }

        // 4. Teleport
        if (SceneManager._scene instanceof Scene_Battle) {
            BattleManager.playVictoryMe = false;
            BattleManager.playDefeatMe = false;
            BattleManager.replayBgmAndBgs();
            BattleManager.endBattle(0);
        }

        $gamePlayer.reserveTransfer(destMapId, destX, destY, 2, 0);
        $gamePlayer.requestMapReload();

        // 5. Setup Message & AutoSave Flag for next Scene_Map.start
        var msg = "Вы потеряли сознание и очнулись в гостинице.\n";
        if (goldLost > 0) msg += "Потеряно золота: " + goldLost + "\n";

        DataManager.actpoRespawnMessage = msg;
        DataManager.actpoShouldAutoSaveTransfer = true;

        SceneManager.goto(Scene_Map);
    };

})();
