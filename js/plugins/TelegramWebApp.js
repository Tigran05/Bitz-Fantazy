/*:
 * @plugindesc Bitz Fantasy - Telegram WebApp
 * @author Bitz Fantasy
 */

(function () {
    'use strict';

    var tg = null;

    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
    }

    // Не даём RPG Maker менять renderer при resize Telegram.
    if (typeof Graphics !== 'undefined') {
        Graphics._onWindowResize = function () {
            // ничего не делаем
        };
    }

    // Telegram
    if (tg) {

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

        // Fullscreen
        try {
            if (tg.requestFullscreen) {
                tg.requestFullscreen();
            }
        } catch (e) {
            console.log('Fullscreen:', e);
        }

        // Сохраняем Telegram API для игры
        window.BitzTelegram = tg;
    }

})();