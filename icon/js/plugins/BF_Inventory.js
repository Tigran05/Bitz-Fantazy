/*:
 * @plugindesc Bitz Fantasy — единые кнопки Книга / Мешочек в стиле Gear Menu v3
 * @author ASTROLIT GAMES
 *
 * @help
 * BF_Inventory
 *
 * На карте справа:
 *   Книга -> существующий BF_QuestSystem journal
 *   Мешочек -> отдельный инвентарь
 *   Шестерёнка -> существующий Gear Menu
 *
 * Этот плагин НЕ изменяет RatCatch и не содержит мини-игр.
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
    BFInv.version = '5.0';

    function Game_BFInventory() { this.initialize.apply(this, arguments); }
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

    function inv() {
        if (!window.$gameBFInventory) window.$gameBFInventory = new Game_BFInventory();
        return window.$gameBFInventory;
    }
    BFInv.game = inv;

    DataManager._bfInvCreate = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        DataManager._bfInvCreate.call(this);
        window.$gameBFInventory = new Game_BFInventory();
    };

    DataManager._bfInvSave = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var c = DataManager._bfInvSave.call(this);
        c.bfInventory = window.$gameBFInventory;
        return c;
    };

    DataManager._bfInvLoad = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(c) {
        DataManager._bfInvLoad.call(this, c);
        window.$gameBFInventory = c.bfInventory || new Game_BFInventory();
    };

    function openInventory() { SceneManager.push(Scene_BFInventory); }

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
    // Top-right buttons: one compact, unified style.
    // Order from left to right: Book -> Bag -> Map -> Gear.
    // Gear itself is supplied by BF_GearMenu and uses the same 54x54 style.
    // ------------------------------------------------------------
    function Sprite_BFTopButton(file, action) {
        this.initialize.apply(this, arguments);
    }
    Sprite_BFTopButton.prototype = Object.create(Sprite.prototype);
    Sprite_BFTopButton.prototype.constructor = Sprite_BFTopButton;

    Sprite_BFTopButton.prototype.initialize = function(file, action) {
        Sprite.prototype.initialize.call(this, ImageManager.loadPicture(file));
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.scale.x = 1.0;
        this.scale.y = 1.0;
        this.y = 39;
        this._file = file;
        this._action = action;
    };

    Sprite_BFTopButton.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!TouchInput.isTriggered() || !this.bitmap || !this.bitmap.isReady()) return;
        var w = this.bitmap.width * this.scale.x;
        var h = this.bitmap.height * this.scale.y;
        if (TouchInput.x >= this.x-w/2 && TouchInput.x <= this.x+w/2 &&
            TouchInput.y >= this.y-h/2 && TouchInput.y <= this.y+h/2) {
            if (this._action === 'book') {
                if (window.Scene_BFJournal) SceneManager.push(Scene_BFJournal);
            } else if (this._action === 'bag') {
                SceneManager.push(Scene_BFInventory);
            } else if (this._action === 'map') {
                if (window.Scene_BFMap) SceneManager.push(Scene_BFMap);
            }
        }
    };

    var _createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _createAllWindows.call(this);

        // Remove the old left-side journal icon from BF_QuestSystem.
        if (this._bfBookIcon) {
            this.removeChild(this._bfBookIcon);
            this._bfBookIcon = null;
        }

        // Keep the four controls compact and immediately beside the gear.
        // Gear: right edge = boxWidth - 12. Its 54px center is boxWidth - 39.
        // Book, bag and map are placed 58px apart, leaving a 4px gap.
        var gearCenter = Graphics.boxWidth - 39;
        this._bfTopBook = new Sprite_BFTopButton('BF_UI/book', 'book');
        this._bfTopBag  = new Sprite_BFTopButton('BF_UI/bag',  'bag');
        this._bfTopMap  = new Sprite_BFTopButton('BF_UI/map',  'map');
        this._bfTopBook.x = gearCenter - 174;
        this._bfTopBag.x  = gearCenter - 116;
        this._bfTopMap.x  = gearCenter - 58;

        this.addChild(this._bfTopBook);
        this.addChild(this._bfTopBag);
        this.addChild(this._bfTopMap);
    };

    // ------------------------------------------------------------
    // Inventory scene
    // ------------------------------------------------------------
    function Scene_BFInventory() { this.initialize.apply(this, arguments); }
    Scene_BFInventory.prototype = Object.create(Scene_Base.prototype);
    Scene_BFInventory.prototype.constructor = Scene_BFInventory;

    Scene_BFInventory.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        var dim = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        dim.bitmap.fillAll('rgba(0,0,0,0.45)');
        this.addChild(dim);

        this._window = new Window_BFInventory(
            70, 55, Graphics.boxWidth - 140, Graphics.boxHeight - 110
        );
        this.addChild(this._window);
    };

    Scene_BFInventory.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) SceneManager.pop();
    };

    function Window_BFInventory() { this.initialize.apply(this, arguments); }
    Window_BFInventory.prototype = Object.create(Window_Base.prototype);
    Window_BFInventory.prototype.constructor = Window_BFInventory;

    Window_BFInventory.prototype.initialize = function(x,y,w,h) {
        Window_Base.prototype.initialize.call(this,x,y,w,h);
        this.opacity = 0;
        this.backOpacity = 0;
        this.refresh();
    };

    Window_BFInventory.prototype.refresh = function() {
        this.contents.clear();

        this.contents.fontFace = 'Georgia, "Times New Roman", serif';
        this.contents.fontBold = true;
        this.contents.fontSize = 30;
        this.changeTextColor('#f0d49a');
        this.drawText('МЕШОЧЕК',0,12,this.contentsWidth(),'center');

        this.contents.fontBold = false;
        this.contents.fontSize = 18;
        this.changeTextColor('#ead9bd');
        this.drawText('Предметы, которые Катя уже получила',0,55,this.contentsWidth(),'center');

        var list = inv().items();
        if (!list.length) {
            this.contents.fontSize = 20;
            this.changeTextColor('#c8b69b');
            this.drawText('Пока здесь ничего нет.',0,150,this.contentsWidth(),'center');
            return;
        }

        var y=110, self=this;
        list.forEach(function(entry) {
            self.contents.fontSize=21;
            self.contents.fontBold=true;
            self.changeTextColor('#f3dfb6');
            self.drawText(self.itemName(entry.id),40,y,420,'left');

            self.contents.fontBold=false;
            self.contents.fontSize=20;
            self.changeTextColor('#d8c3a3');
            self.drawText('× '+entry.amount,470,y,120,'right');

            self.contents.paintOpacity=90;
            self.contents.fillRect(40,y+34,self.contentsWidth()-80,1,'#b49363');
            self.contents.paintOpacity=255;
            y+=62;
        });
    };

    Window_BFInventory.prototype.itemName = function(id) {
        var names = {
            coin:'Монетка', token:'Фишка', key:'Ключ',
            evidence:'Улика', nitrogen:'Жидкий азот', cheese:'Сыр'
        };
        return names[id] || id;
    };

    window.Scene_BFInventory = Scene_BFInventory;
})();
