/*:
 * @plugindesc Bitz Fantasy — отдельное автосохранение, продолжение и подтверждение новой игры.
 * @author ASTROLIT
 * @help
 * RPG Maker MV 1.6.2
 * Автосохранение хранится в слоте 21 и не считается ручным сохранением.
 * Ручные слоты 1-20 не затрагиваются автосохранением.
 * При подтверждённом начале новой игры удаляются сохранения 1-21.
 */
(function() {
    'use strict';

    var AUTOSAVE_SLOT = 21;
    var FIRST_MANUAL_SLOT = 1;
    var LAST_MANUAL_SLOT = 20;
    var AUTOSAVE_INTERVAL_FRAMES = 60 * 60 * 2; // примерно 2 минуты при 60 FPS
    var TRANSFER_DELAY_FRAMES = 120;
    var _framesSinceSave = 0;
    var _framesAfterTransfer = 0;
    var _lastMapId = 0;
    var _saveInProgress = false;
    var _autosavePending = false;
    var _pendingReason = 'изменение прогресса';
    var _pendingRetryFrames = 0;

    function autosaveExists() {
        try {
            return StorageManager.exists(AUTOSAVE_SLOT) &&
                !!DataManager.loadSavefileInfo(AUTOSAVE_SLOT) &&
                DataManager.isThisGameFile(AUTOSAVE_SLOT);
        } catch (e) {
            console.warn('ASTROLIT_AutoSave: не удалось проверить автосохранение.', e);
            return false;
        }
    }

    function anyProgressSaveExists() {
        var i;
        for (i = FIRST_MANUAL_SLOT; i <= LAST_MANUAL_SLOT; i++) {
            try {
                if (StorageManager.exists(i) && DataManager.isThisGameFile(i)) return true;
            } catch (e) {}
        }
        return autosaveExists();
    }

    function isSafeToSave() {
        if (!$gameSystem || !$gameMap || !$gamePlayer || !$gameParty || !$dataSystem) return false;
        if (SceneManager.isSceneChanging()) return false;
        if (!(SceneManager._scene instanceof Scene_Map)) return false;
        if ($gameMessage && $gameMessage.isBusy()) return false;
        if ($gameMap.isEventRunning && $gameMap.isEventRunning()) return false;
        if ($gamePlayer.isTransferring && $gamePlayer.isTransferring()) return false;
        if (_saveInProgress) return false;
        return true;
    }

    function saveAutosave(reason) {
        if (!isSafeToSave()) return false;
        _saveInProgress = true;
        var success = false;
        try {
            // RPG Maker MV snapshots BGM/BGS in onBeforeSave; call it for saves
            // initiated by this plugin (unlike Scene_Save's normal flow).
            if ($gameSystem.onBeforeSave) $gameSystem.onBeforeSave();
            success = DataManager.saveGame(AUTOSAVE_SLOT);
            if (success) {
                _framesSinceSave = 0;
                _framesAfterTransfer = 0;
                _lastMapId = $gameMap.mapId();
                _autosavePending = false;
                _pendingRetryFrames = 0;
            }
        } catch (e) {
            console.error('ASTROLIT_AutoSave: ошибка автосохранения (' + reason + ').', e);
        }
        _saveInProgress = false;
        return success;
    }

    // События прогресса лишь ставят запрос в очередь. Фактическая запись
    // выполняется позже, когда событие/сообщение/переход завершились.
    function requestAutosave(reason) {
        _autosavePending = true;
        _pendingReason = reason || 'изменение прогресса';
    }

    function wrapProgressMethod(object, methodName, reason, changed) {
        if (!object || typeof object[methodName] !== 'function') return;
        var original = object[methodName];
        object[methodName] = function() {
            var before;
            try { before = changed ? changed.call(this, 'before', arguments) : null; } catch (e) {}
            var result = original.apply(this, arguments);
            var after;
            try { after = changed ? changed.call(this, 'after', arguments) : null; } catch (e) {}
            if (changed ? before !== after : result !== false) requestAutosave(reason);
            return result;
        };
    }

    function safeJson(value) {
        try { return JSON.stringify(value); } catch (e) { return ''; }
    }

    // Квесты: автосохранение только при реальном изменении статуса/этапа,
    // а не при простом выборе записи в журнале.
    if (window.Game_BFQuests) {
        var questProto = Game_BFQuests.prototype;
        wrapProgressMethod(questProto, 'start', 'получение нового задания', function(phase, args) {
            var q = this.get && this.get(String(args[0] || ''));
            return phase === 'before' ? (q ? q.status + ':' + q.step : 'none') : (q = this.get && this.get(String(args[0] || ''))) ? q.status + ':' + q.step : 'none';
        });
        wrapProgressMethod(questProto, 'complete', 'завершение задания', function(phase, args) {
            var q = this.get && this.get(String(args[0] || ''));
            return phase === 'before' ? (q ? q.status + ':' + q.step : 'none') : (q = this.get && this.get(String(args[0] || ''))) ? q.status + ':' + q.step : 'none';
        });
        wrapProgressMethod(questProto, 'setStep', 'смена этапа задания', function(phase, args) {
            var q = this.get && this.get(String(args[0] || ''));
            return phase === 'before' ? (q ? q.status + ':' + q.step : 'none') : (q = this.get && this.get(String(args[0] || ''))) ? q.status + ':' + q.step : 'none';
        });
        wrapProgressMethod(questProto, 'nextStep', 'переход к следующему этапу задания', function(phase, args) {
            var q = this.get && this.get(String(args[0] || ''));
            return phase === 'before' ? (q ? q.status + ':' + q.step : 'none') : (q = this.get && this.get(String(args[0] || ''))) ? q.status + ':' + q.step : 'none';
        });
        wrapProgressMethod(questProto, 'panel', 'отключение сюжетного пульта', function(phase, args) {
            return phase === 'before' ? safeJson(this._panels) : safeJson(this._panels);
        });
        wrapProgressMethod(questProto, 'minigameResult', 'успешное завершение мини-игры', function(phase) {
            return phase === 'before' ? safeJson(this._minigame) : safeJson(this._minigame);
        });
    }

    // Сбор волшебных камней — сюжетное изменение, которое также отражается в журнале.
    if (window.BF_QuestSystem && BF_QuestSystem.elementalStones && BF_QuestSystem.elementalStones.collect) {
        var _collectElementalStone = BF_QuestSystem.elementalStones.collect;
        BF_QuestSystem.elementalStones.collect = function(id) {
            var before = this.has ? this.has(id) : false;
            var result = _collectElementalStone.apply(this, arguments);
            if (result && !before) requestAutosave('получение волшебного камня');
            return result;
        };
    }

    // Сюжетные переключатели и переменные часто меняются командами событий.
    // Сравниваем старое и новое значение; повторные установки не создают запрос.
    if (window.Game_Switches && Game_Switches.prototype.setValue) {
        var _switchSetValue = Game_Switches.prototype.setValue;
        Game_Switches.prototype.setValue = function(id, value) {
            var oldValue = this.value(id);
            _switchSetValue.call(this, id, value);
            if (oldValue !== this.value(id)) requestAutosave('изменение сюжетного переключателя');
        };
    }
    if (window.Game_Variables && Game_Variables.prototype.setValue) {
        var _variableSetValue = Game_Variables.prototype.setValue;
        Game_Variables.prototype.setValue = function(id, value) {
            var oldValue = this.value(id);
            _variableSetValue.call(this, id, value);
            if (oldValue !== this.value(id)) requestAutosave('изменение игровой переменной');
        };
    }

    // Стандартные предметы RPG Maker и отдельный BF-инвентарь.
    if (window.Game_Party && Game_Party.prototype.gainItem) {
        var _partyGainItem = Game_Party.prototype.gainItem;
        Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
            var before = item ? this.numItems(item) : 0;
            _partyGainItem.call(this, item, amount, includeEquip);
            var after = item ? this.numItems(item) : 0;
            if (before !== after) requestAutosave('получение или расход предмета');
        };
    }
    if (window.Game_BFInventory && Game_BFInventory.prototype.add) {
        var _bfInvAdd = Game_BFInventory.prototype.add;
        Game_BFInventory.prototype.add = function(id, amount) {
            var before = this.amount(id);
            _bfInvAdd.call(this, id, amount);
            if (before !== this.amount(id)) requestAutosave('изменение инвентаря Bitz Fantasy');
        };
    }
    if (window.Game_BFInventory && Game_BFInventory.prototype.remove) {
        var _bfInvRemove = Game_BFInventory.prototype.remove;
        Game_BFInventory.prototype.remove = function(id, amount) {
            var before = this.amount(id);
            _bfInvRemove.call(this, id, amount);
            if (before !== this.amount(id)) requestAutosave('изменение инвентаря Bitz Fantasy');
        };
    }

    function removeSaveSlot(savefileId) {
        try {
            StorageManager.remove(savefileId);
            if (StorageManager.cleanBackup) StorageManager.cleanBackup(savefileId);
        } catch (e) {
            console.warn('ASTROLIT_AutoSave: не удалось удалить слот ' + savefileId + '.', e);
        }
    }

    function removeAllProgressSaves() {
        var info = DataManager.loadGlobalInfo() || [];
        var i;
        for (i = FIRST_MANUAL_SLOT; i <= AUTOSAVE_SLOT; i++) {
            removeSaveSlot(i);
            if (info[i]) delete info[i];
        }
        DataManager.saveGlobalInfo(info);
    }

    // Кнопка «Продолжить» активна только при наличии отдельного автосохранения.
    if (window.Window_TitleCommand) {
        Window_TitleCommand.prototype.isContinueEnabled = function() {
            return autosaveExists();
        };
    }

    // Не используем стандартный список ручных сохранений для «Продолжить».
    var _Scene_Title_commandContinue = Scene_Title.prototype.commandContinue;
    Scene_Title.prototype.commandContinue = function() {
        if (!autosaveExists()) {
            SoundManager.playBuzzer();
            window.alert('Автосохранение не найдено. Начните новую игру.');
            if (this._commandWindow) this._commandWindow.activate();
            return;
        }

        this._commandWindow.close();
        if (DataManager.loadGame(AUTOSAVE_SLOT)) {
            // Older/partial autosaves may not contain the audio snapshots that
            // Game_System.onAfterLoad expects. Supply silent defaults so the
            // game can still load without AudioManager.playBgm(null) crashing.
            if ($gameSystem) {
                if (!$gameSystem._bgmOnSave) {
                    $gameSystem._bgmOnSave = { name: '', volume: 0, pitch: 100, pan: 0 };
                }
                if (!$gameSystem._bgsOnSave) {
                    $gameSystem._bgsOnSave = { name: '', volume: 0, pitch: 100, pan: 0 };
                }
                if ($gameSystem.onAfterLoad) $gameSystem.onAfterLoad();
            }
            this.fadeOutAll();
            SceneManager.goto(Scene_Map);
        } else {
            SoundManager.playBuzzer();
            window.alert('Не удалось загрузить автосохранение.');
            this._commandWindow.activate();
            this._commandWindow.refresh();
        }
    };

    // Локализованные строки для диалога новой игры.
    // ASTROLIT_Language использует BF_Language.translateUI и ConfigManager.bfLanguage.
    var confirmationText = 'Начало новой игры удалит прежний прогресс и все сохранения. Продолжить?';
    var confirmationTitle = 'Начать новую игру?';
    var confirmationYes = 'Начать заново';
    var confirmationNo = 'Отмена';
    if (window.BF_Language && window.BF_Language.dictionary) {
        window.BF_Language.dictionary[confirmationText] = 'Starting a new game will delete your previous progress and all save files. Continue?';
        window.BF_Language.dictionary[confirmationTitle] = 'Start a new game?';
        window.BF_Language.dictionary[confirmationYes] = 'Start New Game';
        window.BF_Language.dictionary[confirmationNo] = 'Cancel';
        window.BF_Language.dictionary['Автосохранение не найдено. Начните новую игру.'] = 'No autosave found. Start a new game.';
        window.BF_Language.dictionary['Не удалось загрузить автосохранение.'] = 'Failed to load autosave.';
    }

    function uiText(text) {
        if (window.BF_Language && window.BF_Language.translateUI) {
            return window.BF_Language.translateUI(text);
        }
        return (window.ConfigManager && ConfigManager.bfLanguage === 'en') ? text : text;
    }

    // Красивое внутриигровое окно вместо браузерного window.confirm:
    // окно использует тему RPG Maker и сразу отображает выбранный язык.
    function Window_ASTROLITConfirmMessage() {
        this.initialize.apply(this, arguments);
    }
    Window_ASTROLITConfirmMessage.prototype = Object.create(Window_Base.prototype);
    Window_ASTROLITConfirmMessage.prototype.constructor = Window_ASTROLITConfirmMessage;
    Window_ASTROLITConfirmMessage.prototype.initialize = function(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };
    Window_ASTROLITConfirmMessage.prototype.refresh = function() {
        this.contents.clear();
        this.changeTextColor(this.systemColor());
        this.drawText(uiText(confirmationTitle), 0, 0, this.contentsWidth(), 'center');
        this.resetTextColor();
        var message = uiText(confirmationText);
        var words = message.split(/\s+/);
        var lines = [];
        var line = '';
        var maxWidth = this.contentsWidth() - 24;
        for (var i = 0; i < words.length; i++) {
            var candidate = line ? line + ' ' + words[i] : words[i];
            if (line && this.textWidth(candidate) > maxWidth) {
                lines.push(line);
                line = words[i];
            } else {
                line = candidate;
            }
        }
        if (line) lines.push(line);
        var lineHeight = this.lineHeight();
        var startY = Math.max(lineHeight + 4, Math.floor((this.contentsHeight() - lines.length * lineHeight) / 2));
        for (var j = 0; j < lines.length; j++) {
            this.drawText(lines[j], 12, startY + j * lineHeight, maxWidth, 'center');
        }
    };

    function Window_ASTROLITConfirmChoice() {
        this.initialize.apply(this, arguments);
    }
    Window_ASTROLITConfirmChoice.prototype = Object.create(Window_Command.prototype);
    Window_ASTROLITConfirmChoice.prototype.constructor = Window_ASTROLITConfirmChoice;
    Window_ASTROLITConfirmChoice.prototype.initialize = function(x, y) {
        this._astrolitX = x;
        this._astrolitY = y;
        Window_Command.prototype.initialize.call(this, x, y);
        this.select(1); // По умолчанию безопасный выбор — отмена.
        this.activate();
    };
    Window_ASTROLITConfirmChoice.prototype.windowWidth = function() { return 300; };
    Window_ASTROLITConfirmChoice.prototype.numVisibleRows = function() { return 2; };
    Window_ASTROLITConfirmChoice.prototype.makeCommandList = function() {
        this.addCommand(uiText(confirmationYes), 'yes');
        this.addCommand(uiText(confirmationNo), 'no');
    };

    function closeNewGameConfirmation(scene) {
        if (scene._astrolitConfirmChoice) {
            scene._astrolitConfirmChoice.close();
            scene._windowLayer.removeChild(scene._astrolitConfirmChoice);
            scene._astrolitConfirmChoice = null;
        }
        if (scene._astrolitConfirmMessage) {
            scene._windowLayer.removeChild(scene._astrolitConfirmMessage);
            scene._astrolitConfirmMessage = null;
        }
        if (scene._astrolitConfirmDimmer) {
            scene.removeChild(scene._astrolitConfirmDimmer);
            scene._astrolitConfirmDimmer = null;
        }
        if (scene._commandWindow) scene._commandWindow.activate();
    }

    function beginNewGame(scene) {
        closeNewGameConfirmation(scene);
        removeAllProgressSaves();
        _framesSinceSave = 0;
        _framesAfterTransfer = 0;
        _lastMapId = 0;
        _autosavePending = false;
        _pendingRetryFrames = 0;
        DataManager.setupNewGame();
        scene._commandWindow.close();
        scene.fadeOutAll();
        SceneManager.goto(Scene_Map);
    }

    Scene_Title.prototype.commandNewGame = function() {
        var scene = this;
        if (!anyProgressSaveExists()) {
            _framesSinceSave = 0;
            _framesAfterTransfer = 0;
            _lastMapId = 0;
            DataManager.setupNewGame();
            this._commandWindow.close();
            this.fadeOutAll();
            SceneManager.goto(Scene_Map);
            return;
        }

        if (this._commandWindow) this._commandWindow.deactivate();
        var width = Math.min(560, Graphics.boxWidth - 32);
        var messageHeight = 200;
        var choiceHeight = 108;
        var windowGap = 20;
        var totalHeight = messageHeight + windowGap + choiceHeight;
        var left = Math.floor((Graphics.boxWidth - width) / 2);
        var top = Math.floor((Graphics.boxHeight - totalHeight) / 2);

        var dimmerBitmap = new Bitmap(Graphics.width, Graphics.height);
        dimmerBitmap.fillRect(0, 0, Graphics.width, Graphics.height, 'rgba(0,0,0,0.58)');
        this._astrolitConfirmDimmer = new Sprite(dimmerBitmap);
        var windowLayerIndex = this.children.indexOf(this._windowLayer);
        if (windowLayerIndex >= 0) this.addChildAt(this._astrolitConfirmDimmer, windowLayerIndex);
        else this.addChild(this._astrolitConfirmDimmer);

        this._astrolitConfirmMessage = new Window_ASTROLITConfirmMessage(left, top, width, messageHeight);
        this.addWindow(this._astrolitConfirmMessage);
        this._astrolitConfirmChoice = new Window_ASTROLITConfirmChoice(
            Math.floor((Graphics.boxWidth - 300) / 2), top + messageHeight + windowGap
        );
        this._astrolitConfirmChoice.setHandler('yes', function() {
            SoundManager.playOk();
            beginNewGame(scene);
        });
        this._astrolitConfirmChoice.setHandler('no', function() {
            SoundManager.playCancel();
            closeNewGameConfirmation(scene);
        });
        this._astrolitConfirmChoice.setHandler('cancel', function() {
            SoundManager.playCancel();
            closeNewGameConfirmation(scene);
        });
        this.addWindow(this._astrolitConfirmChoice);
    };

    // После перехода ждём, пока карта и события стабилизируются.
    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        var currentMapId = $gameMap ? $gameMap.mapId() : 0;
        if (currentMapId && currentMapId !== _lastMapId) {
            _framesAfterTransfer = 1;
        }
        if (!_lastMapId && currentMapId) _lastMapId = currentMapId;
    };

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!isSafeToSave()) return;

        _framesSinceSave++;
        if (_pendingRetryFrames > 0) _pendingRetryFrames--;
        if (_autosavePending && _pendingRetryFrames <= 0) {
            if (!saveAutosave(_pendingReason)) _pendingRetryFrames = 60;
            return;
        }
        if (_framesAfterTransfer > 0) {
            _framesAfterTransfer++;
            if (_framesAfterTransfer >= TRANSFER_DELAY_FRAMES) {
                saveAutosave('переход между картами');
            }
        }
        if (_framesSinceSave >= AUTOSAVE_INTERVAL_FRAMES) {
            saveAutosave('периодическое');
        }
    };

    // Дополнительная попытка при закрытии страницы/вкладки. Браузер может
    // завершить страницу раньше сохранения; основной механизм — периодический.
    function onPageExit() {
        if (isSafeToSave()) saveAutosave('закрытие страницы');
    }
    if (window.addEventListener) {
        window.addEventListener('pagehide', onPageExit);
        window.addEventListener('beforeunload', onPageExit);
    }

    // Для отладки/интеграции без изменения публичных API движка.
    window.ASTROLIT_AutoSave = {
        slotId: AUTOSAVE_SLOT,
        exists: autosaveExists,
        request: requestAutosave,
        saveNow: function() { return saveAutosave('ручной вызов плагина'); }
    };
})();
