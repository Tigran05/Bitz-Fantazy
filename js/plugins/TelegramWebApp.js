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


    // =========================================================
    // FULLSCREEN GAME SCALE
    // =========================================================

    function scaleGameToScreen() {

        var canvas = document.getElementById('GameCanvas');

        if (!canvas) {
            canvas = document.querySelector('canvas');
        }

        if (!canvas) {
            return;
        }

        var gameWidth = 816;
        var gameHeight = 624;

        var screenWidth = window.innerWidth;
        var screenHeight = window.innerHeight;

        if (window.Telegram &&
            window.Telegram.WebApp) {

            var telegram = window.Telegram.WebApp;

            if (telegram.viewportWidth > 0) {
                screenWidth = telegram.viewportWidth;
            }

            if (telegram.viewportHeight > 0) {
                screenHeight = telegram.viewportHeight;
            }
        }

        var scaleX =
            screenWidth / gameWidth;

        var scaleY =
            screenHeight / gameHeight;

        var scale =
            Math.min(scaleX, scaleY);

        canvas.style.position = 'fixed';

        canvas.style.width =
            Math.round(gameWidth * scale) + 'px';

        canvas.style.height =
            Math.round(gameHeight * scale) + 'px';

        canvas.style.left = '50%';

        canvas.style.top = '50%';

        canvas.style.transform =
            'translate(-50%, -50%)';

        canvas.style.transformOrigin =
            'center center';

        canvas.style.margin = '0';
    }


    // Ждём Canvas RPG Maker
    var scaleTimer = setInterval(function () {

        var canvas =
            document.getElementById('GameCanvas');

        if (canvas) {

            clearInterval(scaleTimer);

            scaleGameToScreen();

            setTimeout(
                scaleGameToScreen,
                300
            );

            setTimeout(
                scaleGameToScreen,
                1000
            );
        }

    }, 100);


    // Resize браузера
    window.addEventListener(
        'resize',
        function () {

            setTimeout(
                scaleGameToScreen,
                100
            );

        },
        false
    );


    // Поворот телефона
    window.addEventListener(
        'orientationchange',
        function () {

            setTimeout(
                scaleGameToScreen,
                300
            );

        },
        false
    );


    // Telegram viewport
    if (
        window.Telegram &&
        window.Telegram.WebApp &&
        window.Telegram.WebApp.onEvent
    ) {

        window.Telegram.WebApp.onEvent(
            'viewportChanged',
            function () {

                setTimeout(
                    scaleGameToScreen,
                    200
                );

            }
        );

        window.Telegram.WebApp.onEvent(
            'fullscreenChanged',
            function () {

                setTimeout(
                    scaleGameToScreen,
                    200
                );

            }
        );

    }

})();