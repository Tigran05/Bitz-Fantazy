/*:
 * @plugindesc Bitz Fantasy — отдельный инвентарь «Мешочек» v8.0
 * @author ASTROLIT GAMES
 *
 * @help
 * Отдельный экран инвентаря, открываемый кнопкой-мешочком.
 * Стиль согласован с картой и журналом: кожа, бронза, пергамент,
 * декоративная рамка и встроенная кнопка X.
 *
 * Команды:
 *   BF_Inventory open
 *   BF_Inventory add coin 1
 *   BF_Inventory remove coin 1
 *   BF_Inventory has coin
 */
(function() {
    'use strict';

    var BFInv = window.BF_Inventory = window.BF_Inventory || {};
    BFInv.version = '8.0';

    // ------------------------------------------------------------
    // Data
    // ------------------------------------------------------------
    function Game_BFInventory() { this.initialize.apply(this, arguments); }
    window.Game_BFInventory = Game_BFInventory;
    Game_BFInventory.prototype.initialize = function() { this._items = {}; };
    Game_BFInventory.prototype.amount = function(id) {
        return Number(this._items[String(id)] || 0);
    };
    Game_BFInventory.prototype.add = function(id, amount) {
        id = String(id); amount = Number(amount || 1);
        if (amount > 0) this._items[id] = this.amount(id) + amount;
    };
    Game_BFInventory.prototype.remove = function(id, amount) {
        id = String(id); amount = Number(amount || 1);
        if (amount > 0) {
            this._items[id] = Math.max(0, this.amount(id) - amount);
            if (!this._items[id]) delete this._items[id];
        }
    };
    Game_BFInventory.prototype.has = function(id, amount) {
        return this.amount(id) >= Number(amount || 1);
    };
    Game_BFInventory.prototype.items = function() {
        var self = this;
        return Object.keys(this._items).filter(function(id) {
            return self.amount(id) > 0;
        }).map(function(id) {
            return { id:id, amount:self.amount(id) };
        });
    };

    function normalizeGameBFInventory(inventory) {
        if (!inventory || typeof inventory !== 'object') return new Game_BFInventory();
        if (!(inventory instanceof Game_BFInventory)) {
            if (Object.setPrototypeOf) {
                Object.setPrototypeOf(inventory, Game_BFInventory.prototype);
            } else if ('__proto__' in inventory) {
                inventory.__proto__ = Game_BFInventory.prototype;
            }
        }
        if (!inventory._items || typeof inventory._items !== 'object' || Array.isArray(inventory._items)) {
            inventory._items = {};
        }
        return inventory;
    }

    function inv() {
        window.$gameBFInventory = normalizeGameBFInventory(window.$gameBFInventory);
        return window.$gameBFInventory;
    }
    BFInv.game = inv;

    DataManager._bfInvCreate = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        DataManager._bfInvCreate.call(this);
        window.$gameBFInventory = normalizeGameBFInventory(window.$gameBFInventory);
    };

    DataManager._bfInvSetupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        DataManager._bfInvSetupNewGame.call(this);
        window.$gameBFInventory = new Game_BFInventory();
    };

    DataManager._bfInvSave = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var c = DataManager._bfInvSave.call(this);
        window.$gameBFInventory = normalizeGameBFInventory(window.$gameBFInventory);
        c.bfInventory = window.$gameBFInventory;
        return c;
    };

    DataManager._bfInvLoad = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(c) {
        DataManager._bfInvLoad.call(this, c);
        window.$gameBFInventory = normalizeGameBFInventory(c.bfInventory);
    };

    function openInventory() {
        SceneManager.push(Scene_BFInventory);
    }

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() !== 'bf_inventory') return;

        var action = String(args[0] || '').toLowerCase();
        var id = String(args[1] || '');
        var n = Number(args[2] || 1);

        if (action === 'open') openInventory();
        else if (action === 'add') inv().add(id, n);
        else if (action === 'remove') inv().remove(id, n);
        else if (action === 'has') console.log('BF Inventory:', id, inv().has(id, n));
    };

    // ------------------------------------------------------------
    // Top-right buttons on map
    // ------------------------------------------------------------
    function Sprite_BFTopButton(file, x) {
        this.initialize.apply(this, arguments);
    }
    Sprite_BFTopButton.prototype = Object.create(Sprite.prototype);
    Sprite_BFTopButton.prototype.constructor = Sprite_BFTopButton;

    Sprite_BFTopButton.prototype.initialize = function(file, x) {
        Sprite.prototype.initialize.call(this, ImageManager.loadPicture(file));
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        // Приводим каждую иконку к одному визуальному размеру 54x54.
        // У разных PNG исходные размеры отличаются, поэтому масштаб рассчитывается
        // от реального bitmap, а не задаётся одинаковым scale=1.
        this._targetSize = 54;
        this.scale.x = 1.0;
        this.scale.y = 1.0;
        this.x = x;
        this.y = 42;
        this._file = file;
    };

    Sprite_BFTopButton.prototype.update = function() {
        Sprite.prototype.update.call(this);

        // После загрузки картинки один раз нормализуем размер до 54x54.
        if (!this._normalized && this.bitmap && this.bitmap.isReady() && this.bitmap.width > 0 && this.bitmap.height > 0) {
            var sx = this._targetSize / this.bitmap.width;
            var sy = this._targetSize / this.bitmap.height;
            this.scale.x = sx;
            this.scale.y = sy;
            this._normalized = true;
        }
        if (!TouchInput.isTriggered() || !this.bitmap || !this.bitmap.isReady()) return;
        var w = this.bitmap.width * this.scale.x;
        var h = this.bitmap.height * this.scale.y;
        if (TouchInput.x >= this.x-w/2 && TouchInput.x <= this.x+w/2 &&
            TouchInput.y >= this.y-h/2 && TouchInput.y <= this.y+h/2) {
            if (this._file === 'BF_UI/book') {
                if (window.Scene_BFJournal) SceneManager.push(Scene_BFJournal);
            } else if (this._file === 'BF_UI/map') {
                if (window.Scene_BFMap) SceneManager.push(Scene_BFMap);
            } else if (this._file === 'BF_UI/bag') {
                SceneManager.push(Scene_BFInventory);
            }
        }
    };

    var _createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _createAllWindows.call(this);

        if (this._bfBookIcon) {
            this.removeChild(this._bfBookIcon);
            this._bfBookIcon = null;
        }

        // Четыре кнопки стоят строго одной линией с одинаковым шагом.
        // Шестерёнку рисует BF_GearMenu; её центр остаётся на прежнем месте.
        var gearCenter = Graphics.boxWidth - 39;
        var step = 58;
        this._bfTopBook = new Sprite_BFTopButton('BF_UI/book', gearCenter - step * 3);
        this._bfTopBag  = new Sprite_BFTopButton('BF_UI/bag',  gearCenter - step * 2);
        this._bfTopMap  = new Sprite_BFTopButton('BF_UI/map',  gearCenter - step);
        this._bfTopBook.y = 40;
        this._bfTopBag.y  = 40;
        this._bfTopMap.y  = 40;

        this.addChild(this._bfTopBook);
        this.addChild(this._bfTopBag);
        this.addChild(this._bfTopMap);
    };

    // ------------------------------------------------------------
    // Decorative inventory scene
    // ------------------------------------------------------------
    function Scene_BFInventory() { this.initialize.apply(this, arguments); }
    Scene_BFInventory.prototype = Object.create(Scene_Base.prototype);
    Scene_BFInventory.prototype.constructor = Scene_BFInventory;

    Scene_BFInventory.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        this._dim = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._dim.bitmap.fillAll('rgba(0,0,0,0.56)');
        this.addChild(this._dim);

        this._frame = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.drawFrame(this._frame.bitmap);
        this.addChild(this._frame);

        this._window = new Window_BFInventory(54, 48, Graphics.boxWidth - 108, Graphics.boxHeight - 92);
        this.addChild(this._window);

        this._close = this.createCloseButton();
        this.addChild(this._close);
    };

    Scene_BFInventory.prototype.drawFrame = function(bitmap) {
        var w = Graphics.boxWidth, h = Graphics.boxHeight;
        var b = bitmap;

        // Darkened game world behind the bag.
        b.fillRect(14, 14, w - 28, h - 28, '#24150f');
        b.fillRect(20, 20, w - 40, h - 40, '#55331f');
        b.fillRect(25, 25, w - 50, h - 50, '#9a6b36');
        b.fillRect(30, 30, w - 60, h - 60, '#2f1d15');

        // Brass rails.
        b.fillRect(36, 36, w - 72, 3, '#d6ae6b');
        b.fillRect(36, h - 39, w - 72, 3, '#d6ae6b');
        b.fillRect(36, 36, 3, h - 72, '#d6ae6b');
        b.fillRect(w - 39, 36, 3, h - 72, '#d6ae6b');

        // Main parchment.
        b.fillRect(43, 43, w - 86, h - 86, '#d7bd88');
        b.fillRect(48, 48, w - 96, h - 96, '#f1dfb5');
        b.fillRect(53, 53, w - 106, h - 106, '#ebd8ab');

        // Header strip and subtle paper shadows.
        b.fillRect(53, 111, w - 106, 2, 'rgba(92,55,28,0.20)');
        b.fillRect(53, 113, w - 106, 1, 'rgba(255,246,215,0.72)');
        b.fillRect(53, 178, w - 106, 1, 'rgba(118,78,40,0.12)');

        // Decorative parchment corners.
        var col = '#9a6b35', t = 3, L = 28;
        b.fillRect(66, 66, L, t, col); b.fillRect(66, 66, t, L, col);
        b.fillRect(w-66-L, 66, L, t, col); b.fillRect(w-69, 66, t, L, col);
        b.fillRect(66, h-66-t, L, t, col); b.fillRect(66, h-94, t, L, col);
        b.fillRect(w-66-L, h-66-t, L, t, col); b.fillRect(w-69, h-94, t, L, col);

        b._setDirty();
    };

    Scene_BFInventory.prototype.createCloseButton = function() {
        var s = new Sprite(new Bitmap(66, 66));
        s.x = Graphics.boxWidth - 92;
        s.y = 18;
        var b = s.bitmap, c = b.context;
        b.fillRect(0,0,66,66,'#6f2b1f');
        b.fillRect(3,3,60,60,'#bc8b46');
        b.fillRect(6,6,54,54,'#5d241b');
        c.save();
        c.strokeStyle = '#f1cf82';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(18,18); c.lineTo(48,48);
        c.moveTo(48,18); c.lineTo(18,48);
        c.stroke();
        c.restore();
        b._setDirty();
        s._hitW = 66; s._hitH = 66;
        return s;
    };

    Scene_BFInventory.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            SceneManager.pop();
            return;
        }

        if (TouchInput.isTriggered()) {
            var x = TouchInput.x;
            var y = TouchInput.y;
            if (x >= this._close.x && x <= this._close.x + 66 &&
                y >= this._close.y && y <= this._close.y + 66) {
                SceneManager.pop();
                return;
            }

            var lx = x - this._window.x;
            var ly = y - this._window.y;
            if (this._window.selectAt(lx, ly)) return;
        }
    };

    // ------------------------------------------------------------
    // Window
    // ------------------------------------------------------------
    function Window_BFInventory() { this.initialize.apply(this, arguments); }
    Window_BFInventory.prototype = Object.create(Window_Base.prototype);
    Window_BFInventory.prototype.constructor = Window_BFInventory;

    Window_BFInventory.prototype.initialize = function(x,y,w,h) {
        Window_Base.prototype.initialize.call(this,x,y,w,h);
        this.opacity = 0;
        this.backOpacity = 0;
        this._selectedId = null;
        this._list = [];
        this.refresh();
    };

    Window_BFInventory.prototype.itemName = function(id) {
        var names = {
            coin:'Монетка', token:'Фишка Bitz', key:'Ключ',
            evidence:'Улика', nitrogen:'Жидкий азот', cheese:'Сыр'
        };
        return names[id] || id;
    };

    Window_BFInventory.prototype.itemDescription = function(id) {
        var desc = {
            coin:'Обычная монетка казино Bitz.',
            token:'Подозрительная фишка с эмблемой Bitz. Возможно, она ещё пригодится.',
            key:'Старый ключ. Назначение пока неизвестно.',
            evidence:'Найденный в ходе расследования предмет, который может стать доказательством.',
            nitrogen:'Ёмкость с жидким азотом для технических работ.',
            cheese:'Приманка для крыс. Иногда самые простые вещи оказываются полезными.'
        };
        return desc[id] || 'Описание предмета пока отсутствует.';
    };

    Window_BFInventory.prototype.refresh = function() {
        this.contents.clear();
        this._list = inv().items();

        this.drawHeader();
        this.drawGrid();
        this.drawDetails();
    };

    Window_BFInventory.prototype.drawHeader = function() {
        var bw = this.contentsWidth();
        this.contents.fontFace = 'Georgia, "Times New Roman", serif';
        this.contents.fontBold = true;
        this.contents.fontSize = 30;
        this.changeTextColor('#5a3a25');
        this.drawText('МЕШОЧЕК', 0, 6, bw, 'center');

        this.contents.fontBold = false;
        this.contents.fontSize = 16;
        this.changeTextColor('#7b5a34');
        this.drawText('Личные вещи и найденные предметы Кати', 0, 42, bw, 'center');

        // Header ornaments matching the journal/map styling.
        var b = this.contents;
        var c = b.context, cy = 72, cx = bw/2;
        c.save();
        c.fillStyle = '#9a6b35';
        c.fillRect(84, cy, Math.max(20, cx-104), 2);
        c.fillRect(cx+104, cy, Math.max(20, bw-84-(cx+104)), 2);
        c.beginPath(); c.moveTo(cx-6, cy); c.lineTo(cx, cy-6); c.lineTo(cx+6, cy); c.lineTo(cx, cy+6); c.closePath();
        c.fill();
        c.restore();
        b._setDirty();
    };

    Window_BFInventory.prototype.drawGrid = function() {
        var bw = this.contentsWidth();
        var leftW = Math.floor(bw * 0.54);
        var top = 92;
        var cols = 3;
        var rows = 3;
        var slot = Math.min(92, Math.floor((leftW - 44 - 2*12) / 3));
        var gap = 12;
        var gridW = cols * slot + (cols - 1) * gap;
        var startX = 18;

        // Soft inset panel behind the item grid.
        this.contents.fillRect(startX - 10, top - 10, gridW + 20,
            rows * slot + (rows - 1) * gap + 20, 'rgba(91,56,30,0.08)');

        for (var r=0; r<rows; r++) {
            for (var c=0; c<cols; c++) {
                var x = startX + c * (slot + gap);
                var y = top + r * (slot + gap);
                this.drawSlot(x, y, slot, null, false);
            }
        }

        for (var i=0; i<this._list.length && i<rows*cols; i++) {
            var ix = startX + (i % cols) * (slot + gap);
            var iy = top + Math.floor(i / cols) * (slot + gap);
            this.drawSlot(ix, iy, slot, this._list[i], this._list[i].id === this._selectedId);
        }

        this.contents.fontBold = true;
        this.contents.fontSize = 14;
        this.changeTextColor('#745333');
        this.drawText('ПРЕДМЕТЫ', startX, top + rows * slot + (rows-1)*gap + 26, leftW - 28, 'left');
    };

    Window_BFInventory.prototype.drawSlot = function(x, y, s, entry, selected) {
        var b = this.contents;
        b.fillRect(x, y, s, s, '#8e663b');
        b.fillRect(x+3, y+3, s-6, s-6, '#d2aa6d');
        b.fillRect(x+6, y+6, s-12, s-12, '#f0dfb6');
        b.fillRect(x+10, y+10, s-20, 2, 'rgba(255,250,228,0.65)');
        b.fillRect(x+10, y+s-12, s-20, 2, 'rgba(112,75,38,0.18)');

        if (selected) {
            b.fillRect(x, y, s, 4, '#b33d2d');
            b.fillRect(x, y+s-4, s, 4, '#b33d2d');
            b.fillRect(x, y, 4, s, '#b33d2d');
            b.fillRect(x+s-4, y, 4, s, '#b33d2d');
        }

        if (!entry) return;

        this.drawItemIcon(x + s/2, y + s/2, entry.id, 42);
        this.contents.fontBold = true;
        this.contents.fontSize = 14;
        this.changeTextColor('#5c3f27');
        this.drawText('×' + entry.amount, x+s-34, y+s-27, 27, 'right');
    };

    Window_BFInventory.prototype.drawItemIcon = function(cx, cy, id, size) {
        var c = this.contents.context;
        var b = this.contents;
        c.save();

        if (id === 'coin' || id === 'token') {
            c.beginPath(); c.arc(cx,cy,24,0,Math.PI*2); c.fillStyle='#b67b21'; c.fill();
            c.lineWidth=3; c.strokeStyle='#6e481f'; c.stroke();
            c.beginPath(); c.arc(cx,cy,18,0,Math.PI*2); c.strokeStyle='#e2c478'; c.lineWidth=2; c.stroke();
            if (id === 'token') {
                c.beginPath();
                for (var k=0;k<5;k++) {
                    var a = -Math.PI/2 + k*Math.PI*2/5;
                    var rr = k===0 ? 13 : 13;
                }
                c.fillStyle='#f0d07b';
                c.font='bold 22px Georgia'; c.textAlign='center'; c.textBaseline='middle';
                c.fillText('★',cx,cy+1);
            } else {
                c.fillStyle='#f4e5aa';
                c.font='bold 20px Georgia'; c.textAlign='center'; c.textBaseline='middle';
                c.fillText('B',cx,cy+1);
            }
        } else if (id === 'cheese') {
            c.fillStyle='#d99427';
            c.beginPath(); c.moveTo(cx-23,cy+17); c.lineTo(cx+24,cy+8); c.lineTo(cx+2,cy-18); c.closePath(); c.fill();
            c.fillStyle='#f0ba45';
            c.beginPath(); c.moveTo(cx-18,cy+11); c.lineTo(cx+19,cy+4); c.lineTo(cx+2,cy-13); c.closePath(); c.fill();
            c.fillStyle='#b47b22';
            c.beginPath(); c.arc(cx-2,cy-3,4,0,Math.PI*2); c.fill();
            c.beginPath(); c.arc(cx+9,cy+4,3,0,Math.PI*2); c.fill();
        } else if (id === 'key') {
            c.strokeStyle='#7a6a57'; c.lineWidth=5;
            c.beginPath(); c.arc(cx-12,cy-5,9,0,Math.PI*2); c.stroke();
            c.beginPath(); c.moveTo(cx-4,cy+1); c.lineTo(cx+23,cy+20); c.lineTo(cx+28,cy+15); c.moveTo(cx+12,cy+12); c.lineTo(cx+17,cy+7); c.stroke();
        } else if (id === 'evidence') {
            c.fillStyle='#e2cfa4'; c.strokeStyle='#7e6240'; c.lineWidth=2;
            c.beginPath(); c.moveTo(cx-18,cy-20); c.lineTo(cx+12,cy-20); c.lineTo(cx+20,cy-12); c.lineTo(cx+20,cy+21); c.lineTo(cx-18,cy+21); c.closePath(); c.fill(); c.stroke();
            c.strokeStyle='#a88a61'; c.lineWidth=2;
            c.beginPath(); c.moveTo(cx-9,cy-3); c.lineTo(cx+10,cy-3); c.moveTo(cx-9,cy+5); c.lineTo(cx+12,cy+5); c.moveTo(cx-9,cy+13); c.lineTo(cx+6,cy+13); c.stroke();
        } else if (id === 'nitrogen') {
            c.fillStyle='#7d8fa0'; c.fillRect(cx-10,cy-18,20,34);
            c.fillStyle='#b8c9d2'; c.fillRect(cx-7,cy-23,14,7);
            c.strokeStyle='#526676'; c.lineWidth=2; c.strokeRect(cx-10,cy-18,20,34);
            c.fillStyle='#4c7890'; c.fillRect(cx-5,cy-1,10,7);
        } else {
            c.fillStyle='#7e6950'; c.fillRect(cx-18,cy-18,36,36);
            c.strokeStyle='#4d3a2a'; c.lineWidth=3; c.strokeRect(cx-18,cy-18,36,36);
        }

        c.restore();
        b._setDirty();
    };

    Window_BFInventory.prototype.drawDetails = function() {
        var bw = this.contentsWidth();
        var bh = this.contentsHeight();

        // Keep the details card comfortably inside the parchment/page area.
        // The previous layout stretched the card almost to the outer frame.
        var x = Math.floor(bw * 0.60);
        var top = 96;
        var w = Math.floor(bw * 0.33);
        var h = Math.min(390, Math.max(300, bh - top - 18));

        // Safety clamp for smaller resolutions.
        if (x + w > bw - 12) w = Math.max(220, bw - x - 12);

        // Selected-item parchment card.
        this.contents.fillRect(x, top, w, h, '#aa7d48');
        this.contents.fillRect(x+3, top+3, w-6, h-6, '#d4b476');
        this.contents.fillRect(x+7, top+7, w-14, h-14, '#f1dfb7');
        this.contents.fillRect(x+11, top+11, w-22, h-22, '#ead6aa');

        this.contents.fontFace = 'Georgia, "Times New Roman", serif';
        this.contents.fontBold = true;
        this.contents.fontSize = 18;
        this.changeTextColor('#68472d');
        this.drawText('ПРЕДМЕТ', x, top+16, w, 'center');

        if (!this._selectedId) {
            this.contents.fontBold = false;
            this.contents.fontSize = 16;
            this.changeTextColor('#8a6c48');
            this.drawText('Выберите находку', x+10, top+142, w-20, 'center');
            this.drawText('в мешочке.', x+10, top+166, w-20, 'center');
            return;
        }

        var entry = null;
        for (var i=0; i<this._list.length; i++) {
            if (this._list[i].id === this._selectedId) { entry=this._list[i]; break; }
        }
        if (!entry) return;

        this.drawItemIcon(x+w/2, top+92, entry.id, 58);
        this.contents.fontBold = true;
        this.contents.fontSize = 23;
        this.changeTextColor('#5b3b26');
        this.drawText(this.itemName(entry.id), x+10, top+148, w-20, 'center');

        this.contents.fillRect(x+18, top+184, w-36, 2, '#a47a43');
        this.contents.fontBold = true;
        this.contents.fontSize = 15;
        this.changeTextColor('#6b492d');
        this.drawText('Количество: ×' + entry.amount, x+18, top+202, w-36, 'left');

        this.contents.fontBold = false;
        this.contents.fontSize = 15;
        var text = this.itemDescription(entry.id);
        var lines = this.wrapText(text, Math.max(17, Math.floor((w-36)/8)));
        for (var j=0; j<lines.length && j<5; j++) {
            this.drawText(lines[j], x+18, top+234+j*22, w-36, 'left');
        }
    };

    Window_BFInventory.prototype.wrapText = function(text, max) {
        var words = String(text).split(' ');
        var lines = [], line = '';
        for (var i=0;i<words.length;i++) {
            var test = line ? line + ' ' + words[i] : words[i];
            if (test.length > max && line) {
                lines.push(line);
                line = words[i];
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    };

    Window_BFInventory.prototype.selectAt = function(lx, ly) {
        var bw = this.contentsWidth();
        var leftW = Math.floor(bw * 0.54);
        var top = 92, cols=3, rows=3;
        var slot = Math.min(92, Math.floor((leftW - 44 - 2*12) / 3));
        var gap = 12, startX=18;
        if (lx < startX || ly < top) return false;

        var col = Math.floor((lx - startX) / (slot + gap));
        var row = Math.floor((ly - top) / (slot + gap));
        if (col < 0 || col >= cols || row < 0 || row >= rows) return false;

        var sx = startX + col*(slot+gap), sy = top + row*(slot+gap);
        if (lx > sx+slot || ly > sy+slot) return false;

        var idx = row*cols + col;
        if (idx < this._list.length) this._selectedId = this._list[idx].id;
        else this._selectedId = null;
        this.refresh();
        return true;
    };

    window.Scene_BFInventory = Scene_BFInventory;
})();
