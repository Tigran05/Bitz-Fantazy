/*:
 * @plugindesc Bitz Fantasy — квесты первого города + красивая книга Кати v3
 * @author ASTROLIT GAMES
 *
 * @help
 * Полностью самостоятельная система квестов для первого города Битц.
 *
 * ЛОГИКА:
 * Эйп -> Расспросить работников -> 3 независимых квеста.
 * Бармен / Инженер / Слот-менеджер можно брать в любом порядке.
 * После выполнения каждого квеста открывается одна цифра сейфа.
 * После получения всех 3 цифр открывается сюжетная ветка дома Бруно.
 *
 * Команды:
 * BF_Quest start bartender
 * BF_Quest start engineer
 * BF_Quest start manager
 * BF_Quest start house
 * BF_Quest start passage
 * BF_Quest start safe
 * BF_Quest start evidence
 *
 * Завершение:
 * BF_Quest complete bartender
 * BF_Quest complete engineer
 * BF_Quest complete manager
 * BF_Quest complete house
 * BF_Quest complete passage
 * BF_Quest complete safe
 * BF_Quest complete evidence
 *
 * Сюжет:
 * BF_Quest intro
 *
 * Книга:
 * BF_Quest journal
 *
 * Конфигурация квестов теперь находится в BF_QuestConfig.js
 *
 * Для выдачи информации в заметки:
 * BF_Quest note <id>
 *
 * Для проверки:
 * BF_Quest status <id>
 *
 * Цифры сохраняются в переменных:
 * 17 — первая цифра (бармен)
 * 18 — вторая цифра (инженер)
 * 19 — третья цифра (менеджер)
 *
 * ВАЖНО: переменные сами по себе НЕ открывают информацию в книге.
 * Цифра появляется только после завершения соответствующего квеста.
 */
(function() {
    'use strict';

    var BF = window.BF_QuestSystem = window.BF_QuestSystem || {};
    BF.version = '3.0';

    // =========================
    // РЕДАКТИРУЕМЫЕ КВЕСТЫ
    // =========================
    BF.QUESTS = (window.BF_QuestConfig && window.BF_QuestConfig.QUESTS) || {};
    BF.NOTES = (window.BF_QuestConfig && window.BF_QuestConfig.NOTES) || {};
    BF.configFor = function(id) { return BF.QUESTS[String(id||'').trim()] || null; };
    BF.refreshConfigAliases = function() {
        if(window.BF_QuestConfig) {
            BF.QUESTS = window.BF_QuestConfig.QUESTS || BF.QUESTS || {};
            BF.NOTES = window.BF_QuestConfig.NOTES || BF.NOTES || {};
        }
        return BF;
    };

    // ВАЖНО: система не должна становиться пустой, если BF_QuestConfig
    // случайно стоит после этого плагина или вообще не включён.
    // В таком случае используем встроенную конфигурацию первого города.
    if (!BF.QUESTS.intro) {
        BF.QUESTS = {
            intro: {title:'Расспросить работников казино', description:'Эйп попросил расспросить работников казино.', steps:[], note:'Эйп попросил расспросить работников казино.'},
            bartender: {title:'Проблема бармена', description:'Помочь бармену разобраться с крысами в подвале казино.', steps:['Избавиться от крыс в подвале','Вернуться к бармену'], digitVariable:17, digitMode:'random', note:'Первая цифра сейфа Бруно'},
            engineer: {title:'Проблема инженера', description:'Помочь инженеру охладить перегревающуюся серверную.', steps:['Найти жидкий азот','Отдать жидкий азот инженеру'], digitVariable:18, digit:7, note:'Вторая цифра сейфа Бруно: 7'},
            manager: {title:'Подозрительный шулер', description:'Помочь слот-менеджеру разоблачить шулера.', steps:['Расследовать действия шулера','Найти доказательство','Вернуться к слот-менеджеру'], digitVariable:19, digit:4, note:'Третья цифра сейфа Бруно: 4'},
            house: {title:'Найти дом Бруно', description:'После получения трёх цифр найти дом Бруно.', steps:['Найти дом Бруно']},
            passage: {title:'Тайный проход', description:'Найти потайной проход в подвал.', steps:['Исследовать дом Бруно','Найти потайной проход в подвал']},
            safe: {title:'Сейф Бруно', description:'Открыть сейф кодом из трёх цифр.', steps:['Найти сейф','Ввести код сейфа','Забрать бухгалтерию']},
            evidence: {title:'Предъявить доказательства Бруно', description:'Вернуться к Бруно и предъявить бухгалтерию.', steps:['Вернуться к Бруно','Предъявить бухгалтерию как доказательство']}
        };
        BF.NOTES = {ape:'Эйп попросил Катю, Алеко и Личи разобраться в конфликте с Бруно.', workers:'Нужно поговорить с барменом, инженером и слот-менеджером.', house:'После получения трёх цифр нужно найти дом Бруно.', accounting:'Бухгалтерия Бруно — главная улика расследования.'};
    }

    function Game_BFQuests() { this.initialize.apply(this, arguments); }
    window.Game_BFQuests = Game_BFQuests;
    Game_BFQuests.prototype.initialize = function() {
        this._data = {};
        this._notes = {};
        this._storyFlags = {};
        this._digits = {};
        this._currentQuest = null;
        this._selectedQuest = null;
        this._minigame = null;
    };
    Game_BFQuests.prototype.ensure = function(id) {
        if (!this._data[id]) {
            this._data[id] = { status: 'available', step: 0, startedAt: 0, completedAt: 0 };
        }
        return this._data[id];
    };
    Game_BFQuests.prototype.get = function(id) { return this._data[id] || null; };
    Game_BFQuests.prototype.status = function(id) { return this.get(id) ? this.get(id).status : 'locked'; };
    Game_BFQuests.prototype.isStarted = function(id) { var q=this.get(id); return !!q && (q.status==='active'||q.status==='completed'); };
    Game_BFQuests.prototype.isCompleted = function(id) { var q=this.get(id); return !!q && q.status==='completed'; };
    Game_BFQuests.prototype.workersComplete = function() { return this.isCompleted('bartender') && this.isCompleted('engineer') && this.isCompleted('manager'); };
    Game_BFQuests.prototype.canStart = function(id) {
        var q = BF.QUESTS[id]; if (!q) return false;
        if (id === 'intro') return true;
        if (id === 'bartender' || id === 'engineer' || id === 'manager') return this.isStarted('intro');
        if (id === 'house') return this.workersComplete();
        if (id === 'passage') return this.isCompleted('house');
        if (id === 'safe') return this.isCompleted('passage');
        if (id === 'evidence') return this.isCompleted('safe');
        return true;
    };
    // Start a quest. Independent worker quests can be started in any order.
    Game_BFQuests.prototype.start = function(id) {
        var cfg = BF.QUESTS[id];
        if (!cfg) return false;
        var q = this.ensure(id);
        if (q.status === 'completed') return true;
        if (q.status === 'active') {
            this._currentQuest = id;
            this._selectedQuest = id;
            return true;
        }
        if (!this.canStart(id)) return false;
        q.status = 'active';
        q.step = 0;
        q.startedAt = Date.now();
        this._currentQuest = id;
        this._selectedQuest = id;
        if (id === 'intro' && BF.NOTES.ape) this._notes.ape = BF.NOTES.ape;
        return true;
    };

    Game_BFQuests.prototype.syncIntro = function() {
        var intro=this.get('intro');
        if(!intro || intro.status!=='active') return;
        // ВАЖНО: общий квест не содержит порядковых шагов.
        // Игрок сам выбирает любого из трёх работников.
        intro.step=0;
        if (this.workersComplete()) this.complete('intro');
    };

    Game_BFQuests.prototype.complete = function(id) {
        var cfg=BF.QUESTS[id]; if(!cfg) return false;
        var q=this.ensure(id);
        if(q.status==='completed') return true;
        if(!this.canStart(id) && q.status!=='active') return false;
        q.status='completed'; q.step=Math.max(0,(cfg.steps||[]).length-1); q.completedAt=Date.now();
        // Digit handling: for random NPC rewards, always use the actual value
        // already generated by the RPG Maker event, not a hard-coded fallback.
        if (cfg.digitVariable) {
            var actualDigit = null;
            if (cfg.digitMode === 'random' && typeof $gameVariables !== 'undefined') {
                var vv = Number($gameVariables.value(cfg.digitVariable));
                if (isFinite(vv) && vv >= 0 && vv <= 9) actualDigit = vv;
            }
            if (actualDigit == null && cfg.digit != null) actualDigit = Number(cfg.digit);
            if (actualDigit != null && isFinite(actualDigit)) {
                this._digits[id] = actualDigit;
                $gameVariables.setValue(cfg.digitVariable, actualDigit);
                var digitLabels = { bartender:'Первая цифра сейфа Бруно', engineer:'Вторая цифра сейфа Бруно', manager:'Третья цифра сейфа Бруно' };
                this._notes['digit_'+id] = (digitLabels[id] || 'Цифра сейфа') + ': ' + actualDigit;
            }
        }
        if(cfg.note && !this._notes['digit_'+id]) this._notes['digit_'+id]=cfg.note;
        if(id==='intro' && BF.NOTES.workers) this._notes.workers = BF.NOTES.workers;
        if(id==='house' && BF.NOTES.house) this._notes.house = BF.NOTES.house;
        if(id==='safe' && BF.NOTES.accounting) this._notes.accounting = BF.NOTES.accounting;
        if(id==='intro' && BF.NOTES.ape) this._notes.ape = BF.NOTES.ape;
        if(id==='intro') {
            delete this._notes.ape;
            delete this._notes.digit_intro;
        }
        if(this.workersComplete()) {
            if(!this.isCompleted('intro')) this.complete('intro');
            if(!this.isStarted('house')) this.start('house');
        }
        if(id==='house' && !this.isCompleted('passage')) this.start('passage');
        if(id==='passage' && !this.isCompleted('safe')) this.start('safe');
        if(id==='safe' && !this.isCompleted('evidence')) this.start('evidence');
        if(id==='evidence' && !this.isCompleted('vermillion')) this.start('vermillion');
        if(id==='vermillion' && !this.isCompleted('iron_cliff')) this.start('iron_cliff');
        if(id==='iron_cliff' && !this.isCompleted('vault')) this.start('vault');
        if(id==='vault' && !this.isCompleted('forest_city')) this.start('forest_city');
        if(id==='forest_city' && !this.isCompleted('mansion')) this.start('mansion');
        if(id==='mansion' && !this.isCompleted('empire_tower')) this.start('empire_tower');
        if(this._currentQuest===id) this._currentQuest=null;
        if(this._selectedQuest===id) this._selectedQuest=null;
        this._minigame=null;
        return true;
    };
    Game_BFQuests.prototype.setStep = function(id, step) {
        var q=this.get(id); if(!q || q.status!=='active') return false;
        var requested = Number(step);
        if (!isFinite(requested)) requested = 0;
        // The digit is captured only when the NPC actually completes the quest.
        var max=Math.max(0,(BF.QUESTS[id].steps||[]).length-1);
        q.step=Math.max(0,Math.min(requested,max)); this._currentQuest=id; this._selectedQuest=id; return true;
    };
    Game_BFQuests.prototype.nextStep = function(id) {
        var q=this.get(id); if(!q || q.status!=='active') return false;
        var max=(BF.QUESTS[id].steps||[]).length-1;
        if(q.step>=max) return this.complete(id);
        q.step++; return true;
    };
    // Compatibility / selection API used by the journal and mini-games.
    Game_BFQuests.prototype.selectQuest = function(id) {
        id=String(id||'').trim();
        var q=this.get(id);
        if(!q || q.status!=='active') return false;
        this._currentQuest=id;
        this._selectedQuest=id;
        return true;
    };
    Game_BFQuests.prototype.selectedQuest = function() {
        var id=this._selectedQuest || this._currentQuest;
        var q=id ? this.get(id) : null;
        if(q && q.status==='active') return id;
        var a=this.getActive();
        return a.length ? a[0] : null;
    };
    Game_BFQuests.prototype.minigameStart = function(appId, questId) {
        appId=String(appId||'').trim();
        var id=questId ? String(questId).trim() : this.selectedQuest();
        if(!appId || !id) return false;
        var q=this.get(id);
        if(!q || q.status!=='active') return false;
        this._minigame={appId:appId,questId:id,step:q.step};
        this._selectedQuest=id;
        this._currentQuest=id;
        return true;
    };
    Game_BFQuests.prototype.minigameResult = function(result) {
        var r=String(result||'').toUpperCase();
        var ctx=this._minigame;
        if(!ctx) return false;
        var q=this.get(ctx.questId);
        if(!q || q.status!=='active' || q.step!==ctx.step) { this._minigame=null; return false; }
        if(r!=='SUCCESS') { this._minigame=null; return false; }

        // On successful completion, switch the exact RPG Maker event to its return page.
        // This keeps the story event independent from the quest data and prevents
        // the NPC from repeating the 'go catch rats' dialogue.
        var cfg = BF.QUESTS[ctx.questId];
        var sw = cfg && cfg.successSwitchByStep ? cfg.successSwitchByStep[String(ctx.step)] : null;
        if(sw && window.$gameSelfSwitches) {
            $gameSelfSwitches.setValue([Number(sw.mapId), Number(sw.eventId), String(sw.selfSwitch || 'A')], true);
        }

        this._minigame=null;
        return this.nextStep(ctx.questId);
    };
    Game_BFQuests.prototype.addNote = function(id) { if(BF.NOTES[id]) this._notes[id]=BF.NOTES[id]; };
    Game_BFQuests.prototype.getActive = function() { var a=[],self=this,workerActive=(this.status('bartender')==='active'||this.status('engineer')==='active'||this.status('manager')==='active'); Object.keys(BF.QUESTS).forEach(function(id){ if(id==='intro' && workerActive) return; if(self.isStarted(id)&&self.status(id)==='active')a.push(id); }); return a; };
    Game_BFQuests.prototype.getCompleted = function() { var a=[],self=this; Object.keys(BF.QUESTS).forEach(function(id){if(self.isCompleted(id))a.push(id);}); return a; };
    Game_BFQuests.prototype.captureDigit = function(id, varId) {
        var q = this.get(id);
        if (!q || (q.status !== 'active' && q.status !== 'completed')) return false;
        if (Number(q.step) < 1 || typeof $gameVariables === 'undefined') return false;
        var value = Number($gameVariables.value(Number(varId)));
        if (!isFinite(value) || value < 0 || value > 9 || Math.floor(value) !== value) return false;
        var labels = { bartender:'Первая цифра сейфа Бруно', engineer:'Вторая цифра сейфа Бруно', manager:'Третья цифра сейфа Бруно' };
        this._digits[id] = value;
        this._notes['digit_' + id] = (labels[id] || 'Цифра сейфа') + ': ' + value;
        return true;
    };
    Game_BFQuests.prototype.syncDigitsFromVariables = function() {
        // ВАЖНО: переменные 17/18/19 сами по себе НЕ означают, что цифра получена.
        // Они могут содержать старое значение (в том числе 0) в сохранении.
        // Цифра попадает в журнал только в момент сдачи соответствующего квеста
        // через complete(), когда NPC действительно выдал награду.
        var vars = { bartender:17, engineer:18, manager:19 };
        var self = this;
        Object.keys(vars).forEach(function(id) {
            var q = self.get(id);
            if (q && q.status === 'active') {
                delete self._digits[id];
                delete self._notes['digit_' + id];
            }
        });
        return this._digits || {};
    };
    Game_BFQuests.prototype.getDigits = function() { return this._digits || {}; };

    function normalizeGameBFQuests(game) {
        if (!game || typeof game !== 'object') return new Game_BFQuests();
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(game, Game_BFQuests.prototype);
        } else if ('__proto__' in game) {
            game.__proto__ = Game_BFQuests.prototype;
        }
        ['_data', '_notes', '_storyFlags', '_digits'].forEach(function(key) {
            if (!game[key] || typeof game[key] !== 'object' || Array.isArray(game[key])) game[key] = {};
        });
        if (typeof game._currentQuest === 'undefined') game._currentQuest = null;
        if (typeof game._selectedQuest === 'undefined') game._selectedQuest = null;
        if (typeof game._minigame === 'undefined') game._minigame = null;
        return game;
    }

    // Глобальный контейнер. Не зависит от порядка загрузки/старого сохранения.
    // В RPG Maker MV некоторые проекты вызывают plugin command до createGameObjects,
    // поэтому нельзя безусловно обращаться к $gameBFQuests.
    window.$gameBFQuests = window.$gameBFQuests || null;
    BF.game = function() {
        window.$gameBFQuests = normalizeGameBFQuests(window.$gameBFQuests);
        return window.$gameBFQuests;
    };
    BF.minigameStart = function(appId, questId) { return BF.game().minigameStart(appId, questId); };
    BF.minigameResult = function(result) { return BF.game().minigameResult(result); };

    // Save/load integration
    var _createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() { _createGameObjects.call(this); window.$gameBFQuests=null; };
    var _makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() { var c=_makeSaveContents.call(this); window.$gameBFQuests=normalizeGameBFQuests(window.$gameBFQuests); c.bfQuests=window.$gameBFQuests; return c; };
    var _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(c) { _extractSaveContents.call(this,c); window.$gameBFQuests=normalizeGameBFQuests(c.bfQuests); };

    function pluginCommand(args) {
        var cmd=(args[0]||'').toLowerCase();
        var id=args[1];
        if(cmd==='start') { BF.game().start(id); }
        else if(cmd==='complete') { BF.game().complete(id); }
        else if(cmd==='next') { BF.game().nextStep(id); }
        else if(cmd==='step') { BF.game().setStep(id,Number(args[2]||0)); }
        else if(cmd==='select') { BF.game().selectQuest(id); }
        else if(cmd==='minigamestart') { BF.game().minigameStart(id,args[2]); }
        else if(cmd==='minigameresult') { BF.game().minigameResult(id); }
        else if(cmd==='note') { BF.game().addNote(id); }
        else if(cmd==='intro') {
            var startedIntro = BF.game().start('intro');
            if (startedIntro || BF.game().isStarted('intro')) BF.game().addNote('ape');
        }
        else if(cmd==='journal' || cmd==='book') { SceneManager.push(Scene_BFJournal); }
        else if(cmd==='status') { console.log('BF Quest',id,BF.game().status(id)); }
    }
    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command,args) {
        _pluginCommand.call(this,command,args);
        if(String(command).toLowerCase()==='bf_quest') pluginCommand(args);
    };

    // =========================
    // КРАСИВАЯ КНИГА КАТИ
    // =========================
    // На карте показывается только картинка книги, без текста.
    function Sprite_BFBookIcon() {
        this.initialize.apply(this, arguments);
    }
    Sprite_BFBookIcon.prototype = Object.create(Sprite.prototype);
    Sprite_BFBookIcon.prototype.constructor = Sprite_BFBookIcon;
    Sprite_BFBookIcon.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, ImageManager.loadPicture('BFJournal/BookIcon'));
        this.x = 16;
        this.y = 8;
        this.scale.x = 0.86;
        this.scale.y = 0.86;
    };
    Sprite_BFBookIcon.prototype.update = function() {
        Sprite.prototype.update.call(this);
        var w = this.bitmap ? this.bitmap.width * this.scale.x : 76;
        var h = this.bitmap ? this.bitmap.height * this.scale.y : 76;
        if (TouchInput.x >= this.x && TouchInput.x <= this.x + w &&
            TouchInput.y >= this.y && TouchInput.y <= this.y + h &&
            TouchInput.isTriggered()) {
            SceneManager.push(Scene_BFJournal);
        }
    };

    var _SceneMap_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _SceneMap_createAllWindows.call(this);
        this._bfBookIcon = new Sprite_BFBookIcon();
        this.addChild(this._bfBookIcon);
    };

    // Прозрачный слой текста. Оформление полностью задаётся JournalBook.png.
    // ВАЖНО: макет книги всегда 1280x720. Масштаб считается заранее, поэтому
    // асинхронная загрузка Bitmap больше не сдвигает/обрезает книгу.
    function Window_BFJournalText() {
        this.initialize.apply(this, arguments);
    }
    Window_BFJournalText.prototype = Object.create(Window_Base.prototype);
    Window_BFJournalText.prototype.constructor = Window_BFJournalText;

    Window_BFJournalText.prototype.initialize = function(x, y, w, h, mode) {
        Window_Base.prototype.initialize.call(this, x, y, w, h);
        this.opacity = 0;
        this.backOpacity = 0;
        this.padding = 0;
        this._mode = mode || 'active';
        this._bookX = 0;
        this._bookY = 0;
        this._bookScale = 1;
        this.refresh();
    };

    Window_BFJournalText.prototype.setLayout = function(x, y, scale) {
        this._bookX = Number(x) || 0;
        this._bookY = Number(y) || 0;
        this._bookScale = Number(scale) || 1;
        this.refresh();
    };

    Window_BFJournalText.prototype.setMode = function(mode) {
        if (this._mode !== mode) {
            this._mode = mode;
            this.refresh();
        }
    };

    Window_BFJournalText.prototype.wrapText = function(text, maxWidth, fontSize) {
        var out = [], line = '';
        var words = String(text == null ? '' : text).split(/\s+/);
        this.contents.fontSize = Math.max(12, Math.round(fontSize * (this._bookScale || 1)));
        for (var i = 0; i < words.length; i++) {
            if (!words[i]) continue;
            var test = line ? line + ' ' + words[i] : words[i];
            if (line && this.contents.measureTextWidth(test) > Math.round(maxWidth * (this._bookScale || 1))) {
                out.push(line);
                line = words[i];
            } else {
                line = test;
            }
        }
        if (line) out.push(line);
        return out;
    };

    Window_BFJournalText.prototype.refresh = function() {
        this.contents.clear();
        this.contents.fontFace = 'Georgia, "Times New Roman", serif';
        this.contents.fontBold = false;
        this.contents.outlineColor = '#2b160c';
        this.contents.outlineWidth = 2;

        var game = BF.game(), self = this;
        var scale = this._bookScale || 1;
        var ox = this._bookX || 0;
        var oy = this._bookY || 0;
        function X(v) { return Math.round(ox + v * scale); }
        function Y(v) { return Math.round(oy + v * scale); }
        function W(v) { return Math.round(v * scale); }
        function heading(text, x, y, w) {
            self.contents.fontSize = Math.max(12, Math.round(34 * scale));
            self.contents.fontBold = true;
            self.changeTextColor('#f5dfb7');
            self.contents.outlineColor = '#2b1208';
            self.contents.outlineWidth = Math.max(2, Math.round(4 * scale));
            self.drawText(text, X(x), Y(y), W(w), 'center');
            self.contents.fontBold = false;
        }
        function title(text, x, y, w) {
            self.contents.fontSize = Math.max(12, Math.round(28 * scale));
            self.contents.fontBold = true;
            self.changeTextColor('#4a2814');
            self.contents.outlineColor = '#f1dfbf';
            self.contents.outlineWidth = Math.max(1, Math.round(1.5 * scale));
            self.drawText(text, X(x), Y(y), W(w), 'left');
            self.contents.fontBold = false;
        }
        function body(text, x, y, w, align) {
            self.contents.fontSize = Math.max(12, Math.round(25 * scale));
            self.contents.fontBold = false;
            self.changeTextColor('#4a2814');
            self.contents.outlineColor = '#f1dfbf';
            self.contents.outlineWidth = Math.max(1, Math.round(1.5 * scale));
            self.drawText(text, X(x), Y(y), W(w), align || 'left');
        }
        function wrapped(text, x, y, w, lineH) {
            var yy = y;
            self.wrapText(text, w, 25).forEach(function(line) {
                body(line, x, yy, w, 'left');
                yy += lineH;
            });
            return yy;
        }
        function rule(x, y, w) {
            self.contents.paintOpacity = 80;
            self.contents.fillRect(X(x), Y(y), W(w), Math.max(1, Math.round(scale)), '#8f6a42');
            self.contents.paintOpacity = 255;
        }

        var L = 92, LW = 500;
        var R = 670, RW = 430; // Stop before the built-in right tabs.

        if (this._mode === 'active') {
            heading('ТЕКУЩИЕ ДЕЛА', L, 64, LW);
            heading('ЗАПИСЬ РАССЛЕДОВАНИЯ', R, 64, RW);
            rule(L, 115, LW);
            rule(R, 115, RW);

            var active = game.getActive();
            if (!active.length) {
                title('Пока нет текущих дел.', L, 155, LW);
                body('Когда Катя получит новое дело,', L, 205, LW, 'center');
                body('оно появится здесь.', L, 242, LW, 'center');
            } else {
                var ly = 145;
                active.forEach(function(id) {
                    var cfg = BF.configFor(id), q = game.get(id);
                    if (!cfg || !q) return;
                    title('• ' + cfg.title, L, ly, LW);
                    ly += 40;
                    ly = wrapped((cfg.steps || [])[q.step] || '', L, ly, LW, 30) + 12;
                    if (ly < 640) { rule(L, ly, LW); ly += 18; }
                });
            }

            var selected = game.selectedQuest();
            if (!selected) {
                title('Запись появится после получения дела.', R, 155, RW);
            } else {
                var sc = BF.configFor(selected), sq = game.get(selected);
                if (sc && sq) {
                    title(sc.title, R, 145, RW);
                    var ry = wrapped(sc.description || '', R, 185, RW, 30);
                    rule(R, ry + 4, RW);
                    title('Текущий шаг', R, ry + 34, RW);
                    wrapped((sc.steps || [])[sq.step] || '', R, ry + 73, RW, 30);
                }
            }
        } else if (this._mode === 'notes') {
            heading('ЛИЧНЫЕ ЗАМЕТКИ', L, 64, LW);
            heading('НАЙДЕННЫЕ СВЕДЕНИЯ', R, 64, RW);
            rule(L, 115, LW);
            rule(R, 115, RW);
            if (game.syncDigitsFromVariables) game.syncDigitsFromVariables();
            var notes = game._notes || {}, keys = Object.keys(notes);
            if (!keys.length) {
                title('Записей пока нет.', L, 155, LW);
            } else {
                var ny = 145;
                keys.forEach(function(k) {
                    ny = wrapped(notes[k], L, ny, LW, 30) + 14;
                    if (ny < 640) { rule(L, ny, LW); ny += 18; }
                });
            }
            var digits = game.getDigits ? game.getDigits() : {};
            var foundY = 155;
            if (Object.keys(digits).length) {
                body('Найденные цифры (Битц):', R, foundY, RW, 'left');
                foundY += 42;
                var digitOrder = ['bartender','engineer','manager'];
                var digitNames = { bartender:'Бармен', engineer:'Инженер', manager:'Шулер' };
                digitOrder.forEach(function(k){
                    if (digits[k] == null) return;
                    title(self, digitNames[k] + ': ' + digits[k], R, foundY, RW);
                    foundY += 42;
                });
            } else {
                body('Здесь появляются только сведения,', R, 155, RW, 'left');
                body('которые Катя уже узнала', R, 192, RW, 'left');
                body('во время расследования.', R, 229, RW, 'left');
            }
        } else {
            heading('ЗАВЕРШЁННЫЕ ДЕЛА', L, 64, LW);
            heading('АРХИВ РАССЛЕДОВАНИЯ', R, 64, RW);
            rule(L, 115, LW);
            rule(R, 115, RW);
            var done = game.getCompleted();
            if (!done.length) {
                title('Пока ничего не завершено.', L, 155, LW);
            } else {
                var dy = 145;
                done.forEach(function(id) {
                    var cfg = BF.configFor(id);
                    if (!cfg) return;
                    title('✓ ' + cfg.title, L, dy, LW);
                    dy += 44;
                });
            }
            body('Завершённые дела остаются', R, 180, RW, 'center');
            body('в архиве Кати.', R, 217, RW, 'center');
        }
        this.contents._setDirty && this.contents._setDirty();
    };

    function Scene_BFJournal() { this.initialize.apply(this, arguments); }
    Scene_BFJournal.prototype = Object.create(Scene_Base.prototype);
    Scene_BFJournal.prototype.constructor = Scene_BFJournal;

    Scene_BFJournal.prototype.create = function() {
        BF.refreshConfigAliases();
        Scene_Base.prototype.create.call(this);
        this._mode = 'active';

        this._dim = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._dim.bitmap.fillAll('rgba(0,0,0,0.14)');
        this.addChild(this._dim);

        var BW = 1280, BH = 720;
        var scale = Math.min(Graphics.boxWidth / BW, Graphics.boxHeight / BH);
        this._bookX = Math.round((Graphics.boxWidth - BW * scale) / 2);
        this._bookY = Math.round((Graphics.boxHeight - BH * scale) / 2);
        this._bookScale = scale;

        this._book = new Sprite(ImageManager.loadPicture('BFJournal/JournalBook'));
        this._book.anchor.set(0, 0);
        this._book.x = this._bookX;
        this._book.y = this._bookY;
        this._book.scale.set(scale, scale);
        this.addChild(this._book);

        // Text is a full-screen transparent layer; its coordinates are mapped to the book.
        this._text = new Window_BFJournalText(0, 0, Graphics.boxWidth, Graphics.boxHeight, 'active');
        this._text.setLayout(this._bookX, this._bookY, scale);
        this.addChild(this._text);

        // Labels only. The actual button plates come from JournalBook.png.
        this._tabs = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._drawTabs();
        this.addChild(this._tabs);
    };

    Scene_BFJournal.prototype._drawTabs = function() {
        var b = this._tabs.bitmap, s = this._bookScale, ox = this._bookX, oy = this._bookY;
        b.clear();
        b.fontFace = 'Georgia, "Times New Roman", serif';
        b.fontBold = true;
        b.fontSize = Math.max(16, Math.round(24 * s));
        b.textColor = '#f4dfbd';
        b.outlineColor = '#2b1208';
        b.outlineWidth = Math.max(2, Math.round(4 * s));

        var tabs = [
            {x:1160, y:108, w:108, h:88, label:'ДЕЛА'},
            {x:1160, y:207, w:108, h:88, label:'ЗАМЕТКИ'},
            {x:1160, y:307, w:108, h:88, label:'АРХИВ'}
        ];
        this._tabHit = [];
        for (var i = 0; i < tabs.length; i++) {
            var t = tabs[i];
            b.drawText(t.label, Math.round(ox+t.x*s), Math.round(oy+(t.y+27)*s), Math.round(t.w*s), Math.max(28,Math.round(34*s)), 'center');
            this._tabHit.push({
                x:Math.round(ox+t.x*s), y:Math.round(oy+t.y*s),
                w:Math.round(t.w*s), h:Math.round(t.h*s)
            });
        }
        this._closeHit = {
            x:Math.round(ox+1182*s), y:Math.round(oy+8*s),
            w:Math.round(82*s), h:Math.round(82*s)
        };
    };

    Scene_BFJournal.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            SceneManager.pop();
            return;
        }
        if (!TouchInput.isTriggered()) return;

        var x = TouchInput.x, y = TouchInput.y;
        if (this._closeHit && x >= this._closeHit.x && x <= this._closeHit.x+this._closeHit.w && y >= this._closeHit.y && y <= this._closeHit.y+this._closeHit.h) {
            SceneManager.pop();
            return;
        }
        for (var i=0;i<this._tabHit.length;i++) {
            var t=this._tabHit[i];
            if(x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h){
                this.setMode(i===0?'active':i===1?'notes':'done');
                return;
            }
        }

        if (this._mode === 'active') {
            var active = BF.game().getActive();
            var ly = this._bookY + 135*this._bookScale;
            for (var j=0;j<active.length;j++) {
                var cfg=BF.configFor(active[j]), q=BF.game().get(active[j]);
                if(!cfg||!q) continue;
                var step=String((cfg.steps||[])[q.step]||'');
                var lines=Math.max(1, Math.ceil(step.length/42));
                var hh=Math.max(64, lines*30+46)*this._bookScale;
                if(y>=ly&&y<ly+hh&&x>=this._bookX+70*this._bookScale&&x<=this._bookX+625*this._bookScale){
                    BF.game().selectQuest(active[j]);
                    this._text.refresh();
                    return;
                }
                ly += hh + 16*this._bookScale;
            }
        }
    };

    Scene_BFJournal.prototype.setMode = function(mode) {
        this._mode = mode;
        this._text.setMode(mode);
    };

    window.Scene_BFJournal = Scene_BFJournal;

})();