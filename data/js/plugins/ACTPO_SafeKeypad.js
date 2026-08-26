/*:
 * @plugindesc [v1.0] Визуальный ввод кода для сейфов (специально для Bitz)
 * @author ACTPOJIuT
 *
 * @help
 * Использование в команде "Скрипт" (Script):
 * 
 * SceneManager.push(Scene_SafeKeypad);
 * SceneManager.prepareNextScene(correctCode, successVariableId);
 * 
 * Пример:
 * SceneManager.push(Scene_SafeKeypad);
 * SceneManager.prepareNextScene("123", 15);
 * // Если игрок введет 123, переменная 15 станет равна 1.
 */

function Scene_SafeKeypad() {
    this.initialize.apply(this, arguments);
}

Scene_SafeKeypad.prototype = Object.create(Scene_MenuBase.prototype);
Scene_SafeKeypad.prototype.constructor = Scene_SafeKeypad;

Scene_SafeKeypad.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
    this._correctCode = "";
    this._successVar = 0;
    this._currentInput = "";
};

Scene_SafeKeypad.prototype.prepare = function (code, varId) {
    this._correctCode = String(code);
    this._successVar = varId;
    $gameVariables.setValue(this._successVar, 0); // Reset early
};

Scene_SafeKeypad.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.createBackground();
    this.createWindowLayer();
    this.createKeypadWindow();
};

Scene_SafeKeypad.prototype.createBackground = function () {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._backgroundSprite.colorTone = [-100, -100, -100, 0];
    this.addChild(this._backgroundSprite);
};

Scene_SafeKeypad.prototype.createKeypadWindow = function () {
    var ww = 400;
    var wh = 500;
    var wx = (Graphics.boxWidth - ww) / 2;
    var wy = (Graphics.boxHeight - wh) / 2;
    this._keypadWindow = new Window_SafeKeypad(wx, wy, ww, wh);
    this._keypadWindow.setHandler('ok', this.onInputOk.bind(this));
    this._keypadWindow.setHandler('cancel', this.onInputCancel.bind(this));
    this.addWindow(this._keypadWindow);
};

Scene_SafeKeypad.prototype.onInputCancel = function () {
    $gameVariables.setValue(this._successVar, 2); // 2 = Fail/Close
    this.popScene();
};

Scene_SafeKeypad.prototype.onInputOk = function () {
    var input = this._keypadWindow.inputText();
    if (input === this._correctCode) {
        $gameVariables.setValue(this._successVar, 1);
        SoundManager.playOk();
        this.popScene();
    } else {
        SoundManager.playBuzzer();
        this._keypadWindow.resetInput();
    }
};

// --- Window_SafeKeypad ---

function Window_SafeKeypad() {
    this.initialize.apply(this, arguments);
}

Window_SafeKeypad.prototype = Object.create(Window_Selectable.prototype);
Window_SafeKeypad.prototype.constructor = Window_SafeKeypad;

Window_SafeKeypad.prototype.initialize = function (x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._input = "";
    this._maxDigits = 6;
    this.refresh();
    this.activate();
    this.select(0);
};

Window_SafeKeypad.prototype.maxItems = function () { return 12; };
Window_SafeKeypad.prototype.maxCols = function () { return 3; };

Window_SafeKeypad.prototype.inputText = function () { return this._input; };

Window_SafeKeypad.prototype.resetInput = function () {
    this._input = "";
    this.refresh();
};

Window_SafeKeypad.prototype.drawItem = function (index) {
    var rect = this.itemRect(index);
    var text = "";
    if (index < 9) text = String(index + 1);
    if (index === 9) text = "C";
    if (index === 10) text = "0";
    if (index === 11) text = "OK";

    this.drawText(text, rect.x, rect.y, rect.width, 'center');
};

Window_SafeKeypad.prototype.refresh = function () {
    this.contents.clear();
    this.drawText("ВВЕДИТЕ КОД", 0, 0, this.contentsWidth(), 'center');

    var display = this._input;
    while (display.length < this._maxDigits) display += "_";

    this.changeTextColor(this.systemColor());
    this.drawText(display, 0, 60, this.contentsWidth(), 'center');
    this.resetTextColor();

    for (var i = 0; i < this.maxItems(); i++) {
        this.drawItem(i);
    }
};

Window_SafeKeypad.prototype.processOk = function () {
    var index = this.index();
    if (index < 9) this.addDigit(index + 1);
    if (index === 9) this.resetInput();
    if (index === 10) this.addDigit(0);
    if (index === 11) {
        if (this._input.length > 0) {
            this.callOkHandler();
        } else {
            SoundManager.playBuzzer();
        }
    }
};

Window_SafeKeypad.prototype.addDigit = function (n) {
    if (this._input.length < this._maxDigits) {
        this._input += String(n);
        SoundManager.playCursor();
        this.refresh();
    } else {
        SoundManager.playBuzzer();
    }
};

Window_SafeKeypad.prototype.itemRect = function (index) {
    var rect = Window_Selectable.prototype.itemRect.call(this, index);
    rect.y += 150; // Shift below display
    return rect;
};
