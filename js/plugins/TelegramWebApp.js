/*:
 * @plugindesc Bitz Fantasy Telegram WebApp
 */

(function() {

    'use strict';

    // ---------------------------------------------------------
    // IMPORTANT:
    // Disable RPG Maker MV resize handling.
    // Telegram changes window size when the phone rotates.
    // RPG Maker MV may crash while resizing the WebGL renderer.
    // ---------------------------------------------------------

    if (typeof Graphics !== 'undefined') {

        Graphics._onWindowResize = function() {
            // Keep fixed RPG Maker resolution.
        };

    }


    // ---------------------------------------------------------
    // Telegram
    // ---------------------------------------------------------

    if (!window.Telegram ||
        !window.Telegram.WebApp) {
        return;
    }

    var tg = window.Telegram.WebApp;

    try {
        if (tg.ready) {
            tg.ready();
        }
    } catch (e) {
        console.log(e);
    }

    try {
        if (tg.expand) {
            tg.expand();
        }
    } catch (e) {
        console.log(e);
    }

    try {
        if (tg.disableVerticalSwipes) {
            tg.disableVerticalSwipes();
        }
    } catch (e) {
        console.log(e);
    }

    try {
        if (tg.setHeaderColor) {
            tg.setHeaderColor('#000000');
        }

        if (tg.setBackgroundColor) {
            tg.setBackgroundColor('#000000');
        }
    } catch (e) {
        console.log(e);
    }

})();