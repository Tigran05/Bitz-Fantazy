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
 * 11 — первая цифра (бармен)
 * 12 — вторая цифра (инженер)
 * 13 — третья цифра (менеджер)
 *
 * ВАЖНО: переменные сами по себе НЕ открывают информацию в книге.
 * Цифра появляется только после завершения соответствующего квеста.
 */
(function() {
    'use strict';

    var BF = window.BF_QuestSystem = window.BF_QuestSystem || {};
    BF.version = '3.1';

    // =========================
    // РЕДАКТИРУЕМЫЕ КВЕСТЫ
    // =========================
    BF.QUESTS = (window.BF_QuestConfig && window.BF_QuestConfig.QUESTS) || {};
    BF.NOTES = (window.BF_QuestConfig && window.BF_QuestConfig.NOTES) || {};

    // ВАЖНО: система не должна становиться пустой, если BF_QuestConfig
    // случайно стоит после этого плагина или вообще не включён.
    // В таком случае используем встроенную конфигурацию первого города.
    if (!BF.QUESTS.intro) {
        BF.QUESTS = {
            intro: {title:'Расспросить работников казино', description:'Эйп попросил расспросить работников казино.', steps:[], note:'Эйп попросил расспросить работников казино.'},
            bartender: {title:'Проблема бармена', description:'Помочь бармену разобраться с крысами в подвале казино.', steps:['Избавиться от крыс в подвале','Вернуться к бармену'], digitVariable:11, digit:2, note:'Первая цифра сейфа Бруно: 2'},
            engineer: {title:'Проблема инженера', description:'Помочь инженеру охладить перегревающуюся серверную.', steps:['Найти жидкий азот','Отдать жидкий азот инженеру'], digitVariable:12, digit:7, note:'Вторая цифра сейфа Бруно: 7'},
            manager: {title:'Подозрительный шулер', description:'Помочь слот-менеджеру разоблачить шулера.', steps:['Расследовать действия шулера','Найти доказательство','Вернуться к слот-менеджеру'], digitVariable:13, digit:4, note:'Третья цифра сейфа Бруно: 4'},
            house: {title:'Найти дом Бруно', description:'После получения трёх цифр найти дом Бруно.', steps:['Найти дом Бруно']},
            passage: {title:'Тайный проход', description:'Найти потайной проход в подвал.', steps:['Исследовать дом Бруно','Найти потайной проход в подвал']},
            safe: {title:'Сейф Бруно', description:'Открыть сейф кодом из трёх цифр.', steps:['Найти сейф','Ввести код сейфа','Забрать бухгалтерию']},
            evidence: {title:'Предъявить доказательства Бруно', description:'Вернуться к Бруно и предъявить бухгалтерию.', steps:['Вернуться к Бруно','Предъявить бухгалтерию как доказательство']}
        };
        BF.NOTES = {ape:'Эйп попросил Катю, Алеко и Личи разобраться в конфликте с Бруно.', workers:'Нужно поговорить с барменом, инженером и слот-менеджером.', house:'После получения трёх цифр нужно найти дом Бруно.', accounting:'Бухгалтерия Бруно — главная улика расследования.'};
    }

    function Game_BFQuests() { this.initialize.apply(this, arguments); }
    Game_BFQuests.prototype.initialize = function() {
        this._data = {};
        this._notes = {};
        this._storyFlags = {};
        this._digits = {};
        this._currentQuest = null;
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
            return true;
        }
        if (!this.canStart(id)) return false;
        q.status = 'active';
        q.step = 0;
        q.startedAt = Date.now();
        this._currentQuest = id;
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
        if (cfg.digitVariable && cfg.digit != null) {
            this._digits[id]=cfg.digit;
            $gameVariables.setValue(cfg.digitVariable, cfg.digit);
        }
        if(cfg.note) this._notes['digit_'+id]=cfg.note;
        if(id==='intro' && BF.NOTES.workers) this._notes.workers = BF.NOTES.workers;
        if(id==='house' && BF.NOTES.house) this._notes.house = BF.NOTES.house;
        if(id==='safe' && BF.NOTES.accounting) this._notes.accounting = BF.NOTES.accounting;
        if(id==='intro' && BF.NOTES.ape) this._notes.ape = BF.NOTES.ape;
        if(this.workersComplete() && id!=='house' && !this.isCompleted('house')) this.start('house');
        if(id==='house' && !this.isCompleted('passage')) this.start('passage');
        if(id==='passage' && !this.isCompleted('safe')) this.start('safe');
        if(id==='safe' && !this.isCompleted('evidence')) this.start('evidence');
        if(this._currentQuest===id) this._currentQuest=null;
        return true;
    };
    Game_BFQuests.prototype.setStep = function(id, step) {
        var q=this.get(id); if(!q || q.status!=='active') return false;
        var max=Math.max(0,(BF.QUESTS[id].steps||[]).length-1);
        q.step=Math.max(0,Math.min(Number(step)||0,max)); return true;
    };
    Game_BFQuests.prototype.nextStep = function(id) {
        var q=this.get(id); if(!q || q.status!=='active') return false;
        var max=(BF.QUESTS[id].steps||[]).length-1;
        if(q.step>=max) return this.complete(id);
        q.step++; return true;
    };
    Game_BFQuests.prototype.addNote = function(id) { if(BF.NOTES[id]) this._notes[id]=BF.NOTES[id]; };
    Game_BFQuests.prototype.getActive = function() { var a=[],self=this,workerActive=(this.status('bartender')==='active'||this.status('engineer')==='active'||this.status('manager')==='active'); Object.keys(BF.QUESTS).forEach(function(id){ if(id==='intro' && workerActive) return; if(self.isStarted(id)&&self.status(id)==='active')a.push(id); }); return a; };
    Game_BFQuests.prototype.getCompleted = function() { var a=[],self=this; Object.keys(BF.QUESTS).forEach(function(id){if(self.isCompleted(id))a.push(id);}); return a; };
    Game_BFQuests.prototype.selectQuest = function(id) {
        var q=this.get(id);
        if(!q || q.status!=='active') return false;
        this._currentQuest=id;
        this._selectedQuest=id;
        return true;
    };
    Game_BFQuests.prototype.selectedQuest = function() {
        var id=this._selectedQuest || this._currentQuest;
        if(id && this.get(id) && this.get(id).status==='active') return id;
        var a=this.getActive();
        return a.length ? a[0] : null;
    };
    Game_BFQuests.prototype.getDigits = function() { return this._digits || {}; };

    // Глобальный контейнер. Не зависит от порядка загрузки/старого сохранения.
    // В RPG Maker MV некоторые проекты вызывают plugin command до createGameObjects,
    // поэтому нельзя безусловно обращаться к $gameBFQuests.
    window.$gameBFQuests = window.$gameBFQuests || null;
    BF.game = function() {
        if (!window.$gameBFQuests || typeof window.$gameBFQuests.start !== 'function') {
            window.$gameBFQuests = new Game_BFQuests();
        }
        return window.$gameBFQuests;
    };

    // Save/load integration
    var _createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() { _createGameObjects.call(this); window.$gameBFQuests=new Game_BFQuests(); };
    var _makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() { var c=_makeSaveContents.call(this); c.bfQuests=window.$gameBFQuests; return c; };
    var _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(c) { _extractSaveContents.call(this,c); window.$gameBFQuests=c.bfQuests||new Game_BFQuests(); };

    function pluginCommand(args) {
        var cmd=(args[0]||'').toLowerCase();
        var id=args[1];
        if(cmd==='start') { BF.game().start(id); }
        else if(cmd==='complete') { BF.game().complete(id); }
        else if(cmd==='next') { BF.game().nextStep(id); }
        else if(cmd==='step') { BF.game().setStep(id,Number(args[2]||0)); }
        else if(cmd==='note') { BF.game().addNote(id); }
        else if(cmd==='intro') {
            var startedIntro = BF.game().start('intro');
            if (startedIntro || BF.game().isStarted('intro')) BF.game().addNote('ape');
        }
        else if(cmd==='journal' || cmd==='book') { SceneManager.push(Scene_BFJournal); }
        else if(cmd==='advance' || cmd==='nextstep' || cmd==='done') { BF.game().nextStep(id); }
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

    // Прозрачный слой текста. Само оформление находится в JournalBook.png.
    function Window_BFJournalText() {
        this.initialize.apply(this, arguments);
    }
    Window_BFJournalText.prototype = Object.create(Window_Base.prototype);
    Window_BFJournalText.prototype.constructor = Window_BFJournalText;

    Window_BFJournalText.prototype.initialize = function(x, y, w, h, mode) {
        Window_Base.prototype.initialize.call(this, x, y, w, h);
        this.opacity = 0;
        this.backOpacity = 0;
        this._mode = mode;
        this.refresh();
    };

    Window_BFJournalText.prototype.setMode = function(mode) {
        if (this._mode !== mode) {
            this._mode = mode;
            this.refresh();
        }
    };

    Window_BFJournalText.prototype.wrap = function(text, maxChars) {
        var words = String(text).split(/\s+/);
        var result = [];
        var line = '';
        words.forEach(function(word) {
            var test = line ? line + ' ' + word : word;
            if (test.length > maxChars && line) {
                result.push(line);
                line = word;
            } else {
                line = test;
            }
        });
        if (line) result.push(line);
        return result;
    };

    Window_BFJournalText.prototype.refresh = function() {
        this.contents.clear();
        this.contents.fontFace = 'Georgia, "Times New Roman", serif';
        this.contents.fontBold = false;
        this.contents.outlineWidth = 0;
        var game = BF.game();
        var self = this;

        function heading(win, text, x, y0, width) {
            win.contents.fontSize = 19;
            win.contents.fontBold = true;
            win.changeTextColor('#6b3e1c');
            win.drawText(text, x, y0, width, 'center');
            win.contents.fontBold = false;
        }
        function title(win, text, x, y0, width) {
            win.contents.fontSize = 17;
            win.contents.fontBold = true;
            win.changeTextColor('#4a2814');
            win.drawText(text, x, y0, width, 'left');
            win.contents.fontBold = false;
        }
        function body(win, text, x, y0, width, align) {
            win.contents.fontSize = 14;
            win.contents.fontBold = false;
            win.changeTextColor('#4d301d');
            win.drawText(text, x, y0, width, align || 'left');
        }
        function small(win, text, x, y0, width, align) {
            win.contents.fontSize = 12;
            win.contents.fontBold = false;
            win.changeTextColor('#765337');
            win.drawText(text, x, y0, width, align || 'left');
        }
        function rule(win, x, y0, width) {
            win.contents.paintOpacity = 65;
            win.contents.fillRect(x, y0, width, 1, '#8f6a42');
            win.contents.paintOpacity = 255;
        }
        function drawWrapped(win, text, x, y0, width, maxChars, lineH) {
            var yy = y0;
            win.wrap(text, maxChars).forEach(function(line) {
                body(win, line, x, yy, width, 'left');
                yy += lineH;
            });
            return yy;
        }

        // The actual parchment page area is intentionally kept clear of the
        // leather frame and the center spine.
        var L = 105, LW = 285;
        var R = 445, RW = 285;

        if (this._mode === 'active') {
            heading(this, 'ТЕКУЩИЕ ДЕЛА', L, 112, LW);
            heading(this, 'ЗАПИСЬ РАССЛЕДОВАНИЯ', R, 112, RW);
            rule(this, L, 140, LW);
            rule(this, R, 140, RW);

            var active = game.getActive();
            if (!active.length) {
                title(this, 'Пока нет текущих дел.', L, 180, LW);
                body(this, 'Когда Катя получит новое дело,', L, 220, LW, 'center');
                body(this, 'оно появится здесь.', L, 242, LW, 'center');
            } else {
                var ly = 165;
                active.forEach(function(id) {
                    var cfg = BF.QUESTS[id];
                    var q = game.get(id);
                    title(self, '• ' + cfg.title, L, ly, LW);
                    ly += 28;
                    var step = (cfg.steps || [])[q.step] || '';
                    self.wrap(step, 34).forEach(function(line) {
                        body(self, line, L, ly, LW, 'left');
                        ly += 20;
                    });
                    rule(self, L, ly + 8, LW);
                    ly += 24;
                    if (ly > 555) return;
                });
            }

            var selected = game.selectedQuest();
            if (!selected) {
                title(this, 'Запись появится после получения дела.', R, 180, RW);
                body(this, 'Катя ещё не получила это дело.', R, 220, RW, 'center');
                body(this, 'Новые сведения будут записаны', R, 250, RW, 'center');
                body(this, 'только после того, как она их узнает.', R, 272, RW, 'center');
            } else {
                title(this, BF.QUESTS[selected].title, R, 165, RW);
                var desc = BF.QUESTS[selected].description;
                var ry = drawWrapped(this, desc, R, 205, RW, 34, 20);
                rule(this, R, ry + 8, RW);
                ry += 30;
                if (selected !== 'intro') {
                    title(this, 'Текущий шаг', R, ry, RW);
                    ry += 27;
                    self.wrap((BF.QUESTS[selected].steps || [])[game.get(selected).step] || '', 32).forEach(function(line) {
                        body(self, line, R, ry, RW, 'left'); ry += 20;
                    });
                } else {
                }
            }
        } else if (this._mode === 'notes') {
            heading(this, 'ЛИЧНЫЕ ЗАМЕТКИ', L, 112, LW);
            heading(this, 'НАЙДЕННЫЕ СВЕДЕНИЯ', R, 112, RW);
            rule(this, L, 140, LW);
            rule(this, R, 140, RW);
            var notes = game._notes || {};
            var keys = Object.keys(notes);
            if (!keys.length) {
                title(this, 'Записей пока нет.', L, 180, LW);
                body(this, 'Катя будет записывать сведения', L, 220, LW, 'center');
                body(this, 'по мере их получения.', L, 242, LW, 'center');
            } else {
                var ny = 165;
                keys.forEach(function(k) {
                    ny = drawWrapped(self, notes[k], L, ny, LW, 34, 20) + 10;
                    rule(self, L, ny, LW); ny += 22;
                    if (ny > 555) return;
                });
            }
            body(this, 'Здесь появляются только сведения,', R, 205, RW, 'left');
            body(this, 'которые Катя уже узнала', R, 227, RW, 'left');
            body(this, 'во время расследования.', R, 249, RW, 'left');
        } else {
            heading(this, 'ЗАВЕРШЁННЫЕ ДЕЛА', L, 112, LW);
            heading(this, 'АРХИВ РАССЛЕДОВАНИЯ', R, 112, RW);
            rule(this, L, 140, LW);
            rule(this, R, 140, RW);
            var done = game.getCompleted();
            if (!done.length) {
                title(this, 'Пока ничего не завершено.', L, 180, LW);
            } else {
                var dy = 165;
                done.forEach(function(id) {
                    var cfg = BF.QUESTS[id];
                    title(self, '✓ ' + cfg.title, L, dy, LW);
                    dy += 30;
                    rule(self, L, dy, LW); dy += 22;
                    if (dy > 555) return;
                });
            }
            body(this, 'Завершённые дела остаются', R, 205, RW, 'center');
            body(this, 'в архиве Кати.', R, 227, RW, 'center');
        }
    };

    function Scene_BFJournal() {
        this.initialize.apply(this, arguments);
    }
    Scene_BFJournal.prototype = Object.create(Scene_Base.prototype);
    Scene_BFJournal.prototype.constructor = Scene_BFJournal;

    

Scene_BFJournal.prototype.drawBFTabs = function(bitmap) {
    var c = bitmap.context, labels = ['ДЕЛА','ЗАМЕТКИ','АРХИВ'];
    var ys = [150,245,340];
    c.font = 'bold 15px Georgia';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    labels.forEach(function(t,i){
        c.fillStyle = '#f4d9a0';
        c.shadowColor = 'rgba(0,0,0,.55)';
        c.shadowBlur = 2;
        c.fillText(t, 775, ys[i]+39);
    });
    c.shadowBlur = 0;
    bitmap._setDirty();
};

Scene_BFJournal.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        this._dim = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._dim.bitmap.fillAll('rgba(0,0,0,0.48)');
        this.addChild(this._dim);

        this._book = new Sprite(ImageManager.loadPicture('BFJournal/JournalBook'));
        this._book.anchor.x = 0.5;
        this._book.anchor.y = 0.5;
        var bw = this._book.bitmap.width || 816;
        var bh = this._book.bitmap.height || 624;
        var scale = Math.min(Graphics.boxWidth / bw, Graphics.boxHeight / bh);
        this._book.scale.x = scale;
        this._book.scale.y = scale;
        this._book.x = Graphics.boxWidth / 2;
        this._book.y = Graphics.boxHeight / 2;
        this.addChild(this._book);

        this._bfTabs = new Sprite(new Bitmap(bw, bh));
        this.drawBFTabs(this._bfTabs.bitmap);
        this._bfTabs.scale.x = scale;
        this._bfTabs.scale.y = scale;
        this._bfTabs.x = Graphics.boxWidth / 2 - (bw * scale) / 2;
        this._bfTabs.y = Graphics.boxHeight / 2 - (bh * scale) / 2;
        this.addChild(this._bfTabs);

        this._text = new Window_BFJournalText(0, 0, bw, bh, 'active');
        this._text.opacity = 0;
        this._text.backOpacity = 0;
        this._text.scale.x = scale;
        this._text.scale.y = scale;
        this._text.x = Graphics.boxWidth / 2 - (bw * scale) / 2;
        this._text.y = Graphics.boxHeight / 2 - (bh * scale) / 2;
        this.addChild(this._text);

        this._mode = 'active';
        this._text.refresh();
    };

    Scene_BFJournal.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            SceneManager.pop();
            return;
        }

        if (TouchInput.isTriggered()) {
            var x = TouchInput.x;
            var y = TouchInput.y;

            if (x >= 744 && x <= 810 && y >= 52 && y < 122) {
                SceneManager.pop();
                return;
            }
            if (this._mode === 'active' && x >= 105 && x <= 390 && y >= 165 && y <= 555) {
                var active = BF.game().getActive();
                var rowY = 165;
                for (var i=0; i<active.length; i++) {
                    var id = active[i], cfg = BF.QUESTS[id], q = BF.game().get(id);
                    var stepText = (cfg.steps || [])[q.step] || '';
                    var lines = BF.game().wrap ? BF.game().wrap(stepText,34) : [stepText];
                    var rowH = 28 + Math.max(1, lines.length)*20 + 24;
                    if (y >= rowY && y < rowY + rowH) {
                        BF.game().selectQuest(id);
                        this._text.refresh();
                        break;
                    }
                    rowY += rowH;
                    if (rowY > 555) break;
                }
                return;
            }
            if (x >= 735 && x <= 812) {
                if (y >= 145 && y < 230) this.setMode('active');
                else if (y >= 240 && y < 325) this.setMode('notes');
                else if (y >= 335 && y < 425) this.setMode('done');
            }
        }
    };

    Scene_BFJournal.prototype.setMode = function(mode) {
        this._mode = mode;
        this._text.setMode(mode);
    };

    window.Scene_BFJournal = Scene_BFJournal;

})();