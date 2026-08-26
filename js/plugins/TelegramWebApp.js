/*:
 * @plugindesc Telegram WebApp basic integration
 * @author Bitz Fantasy
 */

(function() {

    'use strict';

    if (!window.Telegram || !window.Telegram.WebApp) {
        return;
    }

    var tg = window.Telegram.WebApp;

    try {
        tg.ready();
    } catch (e) {
        console.log(e);
    }

    try {
        tg.expand();
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