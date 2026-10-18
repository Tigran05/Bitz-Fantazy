/*:
 * @plugindesc Bitz Fantasy — localized ending title screen on a black background.
 * @author ASTROLIT GAMES
 *
 * @help
 * RPG Maker MV plugin.
 *
 * PLUGIN COMMAND:
 *   ShowEndingTitle
 *   ShowEndingTitle 600
 *
 * Shows a black screen with BITZ FANTASY and a localized subtitle.
 * The subtitle follows ConfigManager.bfLanguage ('ru' or 'en') from
 * ASTROLIT_Language.js. The screen stays visible for at least 10 seconds
 * (600 frames at 60 FPS), excluding fade-in/out. The event waits until it ends.
 *
 * Place this plugin below ASTROLIT_Language.js in Plugin Manager.
 * Add the plugin command at the point where the ending title should appear.
 * This plugin does not alter maps, switches, variables, or story progression.
 */
(function() {
    'use strict';

    var MIN_HOLD_FRAMES = 600;
    var FADE_IN_FRAMES = 45;
    var FADE_OUT_FRAMES = 45;
    var activeTitle = null;

    function isEnglish() {
        return typeof ConfigManager !== 'undefined' && ConfigManager.bfLanguage === 'en';
    }

    function makeTextSprite(text, fontSize, italic, y) {
        var bitmap = new Bitmap(Graphics.boxWidth, 100);
        bitmap.fontFace = 'GameFont';
        bitmap.fontSize = fontSize;
        bitmap.textColor = '#FFFFFF';
        bitmap.outlineColor = 'rgba(0,0,0,0)';
        bitmap.outlineWidth = 0;
        bitmap.fontItalic = !!italic;
        bitmap.drawText(text, 0, 0, Graphics.boxWidth, 100, 'center');
        var sprite = new Sprite(bitmap);
        sprite.x = 0;
        sprite.y = y;
        sprite.opacity = 0;
        return sprite;
    }

    function EndingTitleDisplay(scene, holdFrames) {
        this._scene = scene;
        this._holdFrames = Math.max(MIN_HOLD_FRAMES, Number(holdFrames) || MIN_HOLD_FRAMES);
        this._frame = 0;
        this._finished = false;
        this._sprites = [];

        var blackBitmap = new Bitmap(Graphics.width, Graphics.height);
        blackBitmap.fillAll('#000000');
        this._black = new Sprite(blackBitmap);
        this._black.opacity = 255;
        scene.addChild(this._black);

        var titleY = Math.floor(Graphics.boxHeight * 0.42);
        var subtitleY = titleY + 65;
        this._title = makeTextSprite('BITZ FANTASY', 46, true, titleY);
        this._subtitle = makeTextSprite(isEnglish() ? 'The End of Part One' : 'Конец первой части', 34, true, subtitleY);
        scene.addChild(this._title);
        scene.addChild(this._subtitle);
        this._sprites.push(this._title, this._subtitle);
    }

    EndingTitleDisplay.prototype.update = function() {
        if (this._finished) return;
        this._frame++;
        var fadeEnd = FADE_IN_FRAMES + this._holdFrames;
        if (this._frame <= FADE_IN_FRAMES) {
            var opacity = Math.floor(255 * this._frame / FADE_IN_FRAMES);
            this._title.opacity = opacity;
            this._subtitle.opacity = opacity;
        } else if (this._frame <= fadeEnd) {
            this._title.opacity = 255;
            this._subtitle.opacity = 255;
        } else {
            var outFrame = this._frame - fadeEnd;
            var outOpacity = Math.max(0, Math.floor(255 * (1 - outFrame / FADE_OUT_FRAMES)));
            this._title.opacity = outOpacity;
            this._subtitle.opacity = outOpacity;
            this._black.opacity = outOpacity;
            if (outFrame >= FADE_OUT_FRAMES) this.finish();
        }
    };

    EndingTitleDisplay.prototype.finish = function() {
        if (this._finished) return;
        this._finished = true;
        var scene = this._scene;
        [this._title, this._subtitle, this._black].forEach(function(sprite) {
            if (sprite && sprite.parent) sprite.parent.removeChild(sprite);
            if (sprite && sprite.bitmap && sprite.bitmap.destroy) sprite.bitmap.destroy();
        });
        if (activeTitle === this) activeTitle = null;
        if (scene && scene._endingTitleInterpreter) {
            scene._endingTitleInterpreter._waitMode = '';
            scene._endingTitleInterpreter = null;
        }
    };

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (activeTitle && activeTitle._scene === this) activeTitle.update();
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (String(command || '').toLowerCase() !== 'showendingtitle') return;
        if (!$gameMap || !$gameMap.isEventRunning()) return;
        var scene = SceneManager._scene;
        if (!scene || !(scene instanceof Scene_Map)) return;
        if (activeTitle) activeTitle.finish();
        var frames = args && args.length ? Number(args[0]) : MIN_HOLD_FRAMES;
        activeTitle = new EndingTitleDisplay(scene, frames);
        scene._endingTitleInterpreter = this;
        this.setWaitMode('bfEndingTitle');
    };

    var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'bfEndingTitle') return !!activeTitle;
        return _Game_Interpreter_updateWaitMode.call(this);
    };
})();
