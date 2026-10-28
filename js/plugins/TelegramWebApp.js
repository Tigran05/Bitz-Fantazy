/*:
 * @plugindesc Bitz Fantasy - Telegram WebApp Fullscreen + Mobile Touch
 * @author Bitz Fantasy
 */

(function () {
    'use strict';

    // =========================================================
    // TELEGRAM
    // =========================================================

    var tg = null;

    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
    }


    // =========================================================
    // RPG MAKER RESIZE PROTECTION
    // =========================================================

    /*
     * Telegram меняет размер viewport при:
     *
     * - fullscreen
     * - повороте телефона
     * - появлении/скрытии интерфейса
     *
     * Не позволяем RPG Maker пересоздавать renderer.
     */

    if (typeof Graphics !== 'undefined') {

        Graphics._onWindowResize = function () {
            // Ничего не делаем.
            // Размер RPG Maker остаётся 816x624.
        };

    }


    // =========================================================
    // TELEGRAM INITIALIZATION
    // =========================================================

    if (tg) {

        try {
            tg.ready();
        } catch (e) {
            console.log('Telegram ready:', e);
        }


        try {
            tg.expand();
        } catch (e) {
            console.log('Telegram expand:', e);
        }


        try {

            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }

        } catch (e) {
            console.log(
                'Telegram disableVerticalSwipes:',
                e
            );
        }


        // =====================================================
        // FULLSCREEN
        // =====================================================

        try {

            if (
                typeof tg.requestFullscreen === 'function' &&
                !tg.isFullscreen
            ) {

                tg.requestFullscreen();

            }

        } catch (e) {

            console.log(
                'Telegram fullscreen:',
                e
            );

        }


        // Доступ к Telegram API для игры

        window.BitzTelegram = tg;
    }



    // =========================================================
    // LANDSCAPE-ONLY GUARD
    // =========================================================
    // Браузеры/клиенты Telegram не всегда разрешают заблокировать
    // ориентацию программно. Поэтому пробуем lock('landscape'), а
    // если устройство осталось в портретном режиме — перекрываем
    // игру экраном с просьбой повернуть телефон.
    var landscapeOverlay = null;

    function isPortraitViewport() {
        return window.matchMedia
            ? window.matchMedia('(orientation: portrait)').matches
            : window.innerHeight > window.innerWidth;
    }

    function tryLockLandscape() {
        try {
            if (screen.orientation && screen.orientation.lock) {
                var lockResult = screen.orientation.lock('landscape');
                if (lockResult && typeof lockResult.catch === 'function') {
                    lockResult.catch(function () {
                        // Нормальный fallback: показываем экран поворота.
                    });
                }
            }
        } catch (e) {
            // Не все браузеры разрешают блокировку ориентации.
        }
    }

    function createLandscapeOverlay() {
        if (landscapeOverlay || !document.body) return;

        landscapeOverlay = document.createElement('div');
        landscapeOverlay.id = 'BitzLandscapeOnlyOverlay';
        landscapeOverlay.setAttribute('role', 'dialog');
        landscapeOverlay.setAttribute('aria-live', 'polite');
        landscapeOverlay.style.cssText =
            'position:fixed;inset:0;z-index:2147483647;' +
            'display:none;align-items:center;justify-content:center;' +
            'box-sizing:border-box;padding:24px;text-align:center;' +
            'background:#10141d;color:#ffffff;font-family:Arial,sans-serif;' +
            'touch-action:manipulation;';

        var panel = document.createElement('div');
        panel.style.cssText = 'max-width:360px;width:100%;';

        var icon = document.createElement('div');
        icon.textContent = '↻';
        icon.style.cssText = 'font-size:64px;line-height:1.2;margin-bottom:16px;';

        var title = document.createElement('div');
        title.textContent = 'Поверните телефон';
        title.style.cssText = 'font-size:26px;font-weight:700;margin-bottom:12px;';

        var message = document.createElement('div');
        message.textContent = 'Bitz Fantasy работает только в альбомном режиме.';
        message.style.cssText = 'font-size:16px;line-height:1.5;margin-bottom:22px;color:#d7deea;';

        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Перейти в альбомный режим';
        button.style.cssText =
            'border:0;border-radius:10px;padding:14px 18px;' +
            'font-size:16px;font-weight:700;background:#e7bd61;color:#171717;' +
            'cursor:pointer;max-width:100%;';

        button.addEventListener('click', function () {
            tryLockLandscape();
            if (tg && typeof tg.requestFullscreen === 'function') {
                try {
                    var result = tg.requestFullscreen();
                    if (result && typeof result.catch === 'function') result.catch(function () {});
                } catch (e) {}
            }
            updateLandscapeGuard();
        });

        panel.appendChild(icon);
        panel.appendChild(title);
        panel.appendChild(message);
        panel.appendChild(button);
        landscapeOverlay.appendChild(panel);
        document.body.appendChild(landscapeOverlay);
    }

    function updateLandscapeGuard() {
        createLandscapeOverlay();
        if (!landscapeOverlay) return;

        var portrait = isPortraitViewport();
        landscapeOverlay.style.display = portrait ? 'flex' : 'none';

        if (portrait) {
            // Попытка повторить блокировку; при отказе остаётся экран-подсказка.
            tryLockLandscape();
        } else {
            scaleGameToScreen();
        }
    }

    function initLandscapeGuard() {
        createLandscapeOverlay();
        tryLockLandscape();
        updateLandscapeGuard();

        window.addEventListener('resize', function () {
            setTimeout(updateLandscapeGuard, 100);
        }, false);

        window.addEventListener('orientationchange', function () {
            setTimeout(updateLandscapeGuard, 250);
            setTimeout(updateLandscapeGuard, 700);
        }, false);

        if (screen.orientation && screen.orientation.addEventListener) {
            screen.orientation.addEventListener('change', function () {
                setTimeout(updateLandscapeGuard, 100);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLandscapeGuard);
    } else {
        initLandscapeGuard();
    }

    // =========================================================
    // GAME SCALE
    // =========================================================

    function scaleGameToScreen() {

        var canvas =
            document.getElementById('GameCanvas');


        /*
         * Если RPG Maker ещё не создал Canvas,
         * просто ждём следующий вызов.
         */

        if (!canvas) {

            canvas =
                document.querySelector('canvas');

        }


        if (!canvas) {
            return;
        }


        // =====================================================
        // RPG MAKER INTERNAL RESOLUTION
        // =====================================================

        /*
         * ВАЖНО:
         *
         * Эти значения НЕ изменяем.
         *
         * RPG Maker продолжает работать
         * внутри 816x624.
         */

        var gameWidth = 816;
        var gameHeight = 624;


        // =====================================================
        // SCREEN SIZE
        // =====================================================

        var screenWidth =
            window.innerWidth;

        var screenHeight =
            window.innerHeight;


        // =====================================================
        // TELEGRAM VIEWPORT
        // =====================================================

        if (
            window.Telegram &&
            window.Telegram.WebApp
        ) {

            var telegram =
                window.Telegram.WebApp;


            if (
                telegram.viewportWidth &&
                telegram.viewportWidth > 0
            ) {

                screenWidth =
                    telegram.viewportWidth;

            }


            if (
                telegram.viewportHeight &&
                telegram.viewportHeight > 0
            ) {

                screenHeight =
                    telegram.viewportHeight;

            }

        }


        // =====================================================
        // CANVAS POSITION
        // =====================================================

        canvas.style.position = 'fixed';

        canvas.style.left = '0px';

        canvas.style.top = '0px';


        canvas.style.margin = '0';

        canvas.style.padding = '0';


        // =====================================================
        // FULL SCREEN STRETCH
        // =====================================================

        /*
         * Здесь специально НЕ используем Math.min()
         * и НЕ используем Math.max().
         *
         * Canvas растягивается непосредственно
         * до размера экрана.
         *
         * Поэтому:
         *
         * - нет чёрных полос;
         * - нет обрезания;
         * - весь Canvas находится на экране.
         */

        canvas.style.width =
            Math.round(screenWidth) + 'px';


        canvas.style.height =
            Math.round(screenHeight) + 'px';


        canvas.style.transform =
            'none';


        canvas.style.transformOrigin =
            'top left';


        canvas.style.display =
            'block';


        /*
         * Браузер не должен обрабатывать
         * Canvas как перетаскиваемый объект.
         */

        canvas.style.touchAction =
            'none';


        canvas.style.userSelect =
            'none';


        canvas.style.webkitUserSelect =
            'none';


        canvas.style.webkitTouchCallout =
            'none';


        // =====================================================
        // TOUCH COORDINATE FIX
        // =====================================================

        /*
         * RPG Maker внутри думает:
         *
         * Canvas = 816 x 624
         *
         * Но физически Canvas теперь может быть:
         *
         * 1920 x 1080
         *
         * Поэтому преобразуем координаты
         * пальца обратно в 816x624.
         */


        if (
            typeof Graphics !== 'undefined'
        ) {


            Graphics.pageToCanvasX =
                function (pageX) {

                    var rect =
                        canvas.getBoundingClientRect();


                    if (
                        !rect.width ||
                        rect.width <= 0
                    ) {

                        return 0;

                    }


                    var x =
                        (
                            pageX -
                            rect.left
                        ) *
                        (
                            gameWidth /
                            rect.width
                        );


                    /*
                     * Ограничиваем координату
                     * пределами игры.
                     */

                    x =
                        Math.max(
                            0,
                            Math.min(
                                gameWidth,
                                x
                            )
                        );


                    return Math.round(x);

                };


            Graphics.pageToCanvasY =
                function (pageY) {

                    var rect =
                        canvas.getBoundingClientRect();


                    if (
                        !rect.height ||
                        rect.height <= 0
                    ) {

                        return 0;

                    }


                    var y =
                        (
                            pageY -
                            rect.top
                        ) *
                        (
                            gameHeight /
                            rect.height
                        );


                    /*
                     * Ограничиваем координату
                     * пределами игры.
                     */

                    y =
                        Math.max(
                            0,
                            Math.min(
                                gameHeight,
                                y
                            )
                        );


                    return Math.round(y);

                };

        }

    }


    // =========================================================
    // WAIT FOR RPG MAKER CANVAS
    // =========================================================

    var scaleTimer =
        setInterval(
            function () {

                var canvas =
                    document.getElementById(
                        'GameCanvas'
                    );


                if (canvas) {

                    clearInterval(
                        scaleTimer
                    );


                    /*
                     * Первое масштабирование.
                     */

                    scaleGameToScreen();


                    /*
                     * Telegram может ещё
                     * менять viewport после fullscreen.
                     */

                    setTimeout(
                        scaleGameToScreen,
                        300
                    );


                    setTimeout(
                        scaleGameToScreen,
                        800
                    );


                    setTimeout(
                        scaleGameToScreen,
                        1500
                    );

                }

            },
            100
        );


    // =========================================================
    // BROWSER RESIZE
    // =========================================================

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


    // =========================================================
    // PHONE ROTATION
    // =========================================================

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


    // =========================================================
    // TELEGRAM EVENTS
    // =========================================================

    if (
        window.Telegram &&
        window.Telegram.WebApp &&
        typeof window.Telegram.WebApp.onEvent ===
            'function'
    ) {


        // -----------------------------------------------------
        // Viewport changed
        // -----------------------------------------------------

        window.Telegram.WebApp.onEvent(
            'viewportChanged',
            function () {

                /*
                 * НЕ вызываем:
                 *
                 * Graphics.resize()
                 * Graphics._onWindowResize()
                 * SceneManager.stop()
                 * SceneManager.resume()
                 *
                 * Только меняем CSS Canvas.
                 */

                setTimeout(
                    scaleGameToScreen,
                    100
                );


                setTimeout(
                    scaleGameToScreen,
                    300
                );

                setTimeout(updateLandscapeGuard, 350);

            }
        );


        // -----------------------------------------------------
        // Fullscreen changed
        // -----------------------------------------------------

        window.Telegram.WebApp.onEvent(
            'fullscreenChanged',
            function () {

                setTimeout(
                    scaleGameToScreen,
                    100
                );


                setTimeout(
                    scaleGameToScreen,
                    300
                );

            }
        );


        // -----------------------------------------------------
        // Fullscreen failed
        // -----------------------------------------------------

        window.Telegram.WebApp.onEvent(
            'fullscreenFailed',
            function (event) {

                console.log(
                    'Telegram fullscreen failed:',
                    event
                );


                /*
                 * Даже если fullscreen
                 * не разрешён Telegram,
                 * игра продолжает работать.
                 */

                setTimeout(
                    scaleGameToScreen,
                    200
                );

            }
        );

    }


})();