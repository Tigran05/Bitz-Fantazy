/*:
 * @plugindesc Bitz Fantasy — golden question-mark hints for clue events across maps
 * @author ASTROLIT GAMES
 * @help
 * Shows golden pulsing question-mark icons above selected clue/puzzle events:
 * Map014: events 3, 4, 5, 6, 7
 * Map018: event 8
 * Map019: event 4
 * Map024: event 2
 * Map029: events 10, 11
 * Map030: events 12, 13, 14, 15
 * Map031: events 3, 4, 5, 6, 7
 * Map009: event 1
 *
 * Visual-only: does not modify map data, event commands, triggers, switches,
 * variables, or puzzle logic. Replace the existing BF_Map014Hints.js with this
 * cumulative version under the same name, then keep it enabled in Plugin Manager.
 */
(function() {
    'use strict';

    var TARGETS = {
        9: [1],
        14: [3, 4, 5, 6, 7],
        18: [8],
        19: [4],
        24: [2],
        29: [10, 11],
        30: [12, 13, 14, 15],
        31: [3, 4, 5, 6, 7]
    };

    function makeHintBitmap() {
        var b = new Bitmap(32, 36);
        b.paintOpacity = 75;
        b.fillRect(4, 0, 24, 3, '#fff0ad');
        b.fillRect(1, 4, 30, 19, '#fff0ad');
        b.fillRect(5, 23, 16, 3, '#fff0ad');
        b.fillRect(8, 26, 6, 4, '#fff0ad');
        b.paintOpacity = 100;
        b.fillRect(5, 2, 22, 3, '#4a3215');
        b.fillRect(2, 5, 28, 17, '#4a3215');
        b.fillRect(5, 22, 16, 3, '#4a3215');
        b.fillRect(8, 25, 6, 3, '#4a3215');
        b.fillRect(6, 4, 20, 2, '#fff0ad');
        b.fillRect(4, 7, 24, 13, '#f8d66f');
        b.fillRect(7, 20, 13, 2, '#f8d66f');
        b.fillRect(9, 22, 4, 2, '#f8d66f');
        b.fontFace = 'GameFont';
        b.fontSize = 23;
        b.textColor = '#3d2808';
        b.outlineColor = 'rgba(255,255,220,0.9)';
        b.outlineWidth = 1;
        b.drawText('?', 4, 3, 24, 23, 'center');
        return b;
    }

    var _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._bfHintMarkers = [];
        if (!$gameMap) return;
        var ids = TARGETS[$gameMap.mapId()];
        if (!ids) return;

        var self = this;
        var bitmap = makeHintBitmap();
        ids.forEach(function(id) {
            var ev = $gameMap.event(id);
            if (!ev || ev._erased) return;
            var sprite = new Sprite(bitmap);
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 1;
            sprite.z = 7;
            sprite._bfHintEvent = ev;
            self._tilemap.addChild(sprite);
            self._bfHintMarkers.push(sprite);
        });
    };

    var _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (!$gameMap || !this._bfHintMarkers) return;
        var ids = TARGETS[$gameMap.mapId()];
        if (!ids) return;
        var frame = Graphics.frameCount || 0;
        this._bfHintMarkers.forEach(function(sprite) {
            var ev = sprite._bfHintEvent;
            if (!ev || ev._erased) {
                sprite.visible = false;
                return;
            }
            sprite.visible = true;
            sprite.x = ev.screenX();
            sprite.y = ev.screenY() - 36;
            var pulse = (Math.sin(frame / 36 + ev.eventId()) + 1) / 2;
            sprite.opacity = 220 + Math.round(pulse * 35);
            sprite.scale.x = sprite.scale.y = 0.98 + pulse * 0.10;
        });
    };
})();
