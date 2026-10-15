/*:
 * @plugindesc Bitz Fantasy — contextual action button for touch devices (crates, levers, mirrors, lasers, crystals).
 * @author ASTROLIT GAMES
 *
 * @param Show On Desktop
 * @type boolean
 * @default true
 * @desc Show the contextual action button on desktop too (useful for testing; disable if unwanted).
 *
 * @help
 * Put this plugin BELOW BF_CratePuzzle.js and BF_IceLaserPuzzle.js in Plugin Manager.
 * A round ACTION button appears only when the player faces a supported puzzle object
 * on the tile directly in front of them. Tap it once to perform one action. Keyboard OK/Z/Enter
 * continues to work. A held touch does not repeat the action.
 *
 * Recognized tags include:
 * <BF_CRATE>, <BF_CRATE_RESET>, <BF_CRATE_CRYSTAL>,
 * <BF_ICE_LASER ...>, <BF_ICE_MIRROR ...>, <BF_ICE_MELT ...>.
 * Generic events can opt in with <BF_INTERACT>.
 */
(function() {
    'use strict';
    var params = PluginManager.parameters('BF_InteractionButton');
    var SHOW_DESKTOP = String(params['Show On Desktop'] || 'true') === 'true';
    var TAG = /<\s*(BF_CRATE|BF_CRATE_RESET|BF_CRATE_CRYSTAL|BF_ICE_LASER|BF_ICE_MIRROR|BF_ICE_MELT|BF_ICE_CRYSTAL|BF_INTERACT)(?=[\s>])/i;
    var pending = false;
    var sprite = null;
    var lastTapFrame = -1;

    function eventText(ev) {
        if (!ev || !ev.event) return '';
        var d = ev.event();
        var out = String(d.note || '') + '\n' + String(d.name || '');
        (d.pages || []).forEach(function(page) {
            ((page && page.list) || []).forEach(function(cmd) {
                if (cmd && (cmd.code === 108 || cmd.code === 408) && cmd.parameters) out += '\n' + String(cmd.parameters[0] || '');
            });
        });
        return out;
    }
    function tagged(ev) { return TAG.test(eventText(ev)); }
    function adjacentObject() {
        if (!$gameMap || !$gamePlayer || !$gamePlayer.canMove() || ($gameMessage && $gameMessage.isBusy())) return null;
        // Show the action button ONLY for a tagged object directly in front
        // of the player. No side/back detection: the player must face the target.
        var d = $gamePlayer.direction();
        var x = $gameMap.roundXWithDirection($gamePlayer.x, d);
        var y = $gameMap.roundYWithDirection($gamePlayer.y, d);
        var events = $gameMap.eventsXy(x, y);
        for (var i = 0; i < events.length; i++) {
            if (events[i].isTransparent && events[i].isTransparent()) continue;
            if (tagged(events[i])) return { event: events[i], direction: d };
        }
        return null;
    }
    function frontHasObject() { return !!adjacentObject(); }
    function mobile() {
        return (Utils && Utils.isMobileDevice && Utils.isMobileDevice()) || SHOW_DESKTOP;
    }
    function makeSprite() {
        if (sprite) return;
        sprite = new Sprite(new Bitmap(116, 116));
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        var b = sprite.bitmap;
        var ctx = b._context;
        ctx.save();
        ctx.beginPath(); ctx.arc(58, 48, 39, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20,27,39,0.90)'; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
        ctx.restore();
        b.drawText('A', 19, 15, 78, 62, 'center');
        b.fontFace = 'GameFont';
        b.fontSize = 17;
        b.textColor = '#FFFFFF';
        b.outlineColor = 'rgba(0,0,0,0.8)';
        b.outlineWidth = 3;
        b.drawText('ДЕЙСТВИЕ', 0, 81, 116, 26, 'center');
        b._setDirty();
        sprite.x = Graphics.boxWidth - 88;
        sprite.y = Graphics.boxHeight - 115;
        sprite.visible = false;
    }
    function buttonContains(x, y) {
        if (!sprite || !sprite.visible) return false;
        var dx = x - sprite.x, dy = y - (sprite.y - 8);
        return dx * dx + dy * dy <= 48 * 48;
    }

    // Public API consumed by the puzzle plugins. A button tap is queued until a puzzle consumes it.
    window.BF_InteractionButton = {
        consumeAction: function() {
            // Consume a screen-button press first and exactly once. Do not leave
            // a queued touch press behind when keyboard OK is triggered too.
            if (pending) { pending = false; return true; }
            if (Input && Input.isTriggered && Input.isTriggered('ok')) return true;
            return false;
        },
        hasTarget: frontHasObject,
        isButtonVisible: function() { return !!(sprite && sprite.visible); }
    };

    var _createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _createDisplayObjects.call(this);
        makeSprite();
        if (sprite.parent) sprite.parent.removeChild(sprite);
        this.addChild(sprite);
    };

    // Intercept only taps on the action button, so the player does not walk toward it.
    var _processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (mobile() && TouchInput.isTriggered() && buttonContains(TouchInput.x, TouchInput.y)) {
            var frame = Graphics.frameCount || 0;
            var target = adjacentObject();
            if (frame !== lastTapFrame && target) {
                // Face the chosen adjacent object so the puzzle plugin can use
                // its normal front-event interaction logic.
                if ($gamePlayer && target.direction) $gamePlayer.setDirection(target.direction);
                pending = true;
                lastTapFrame = frame;
                if ($gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
                if (SoundManager && SoundManager.playCursor) SoundManager.playCursor();
            }
            return;
        }
        _processMapTouch.call(this);
    };

    var _sceneUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _sceneUpdate.call(this);
        if (!sprite) makeSprite();
        if (sprite) {
            var show = mobile() && frontHasObject();
            sprite.visible = !!show;
            sprite.x = Graphics.boxWidth - 88;
            sprite.y = Graphics.boxHeight - 115;
            if (!show) pending = false;
        }
    };

    var _sceneTerminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (sprite && sprite.parent) sprite.parent.removeChild(sprite);
        sprite = null;
        pending = false;
        _sceneTerminate.call(this);
    };
})();
