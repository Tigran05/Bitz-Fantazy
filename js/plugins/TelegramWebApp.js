/*:
 * @plugindesc Bitz Fantasy - Telegram Mini App fullscreen/mobile support
 * @author Bitz Fantasy
 *
 * @help
 * Telegram fullscreen support for RPG Maker MV.
 *
 * IMPORTANT:
 * - RPG Maker internal resolution remains 816x624.
 * - Browser/Telegram viewport changes do NOT resize RPG Maker renderer.
 * - Canvas is scaled with CSS to fit the available screen.
 * - Telegram fullscreen and landscape lock are handled by Telegram API.
 */

(function () {
    'use strict';

    var TG = null;

    // =========================================================
    // Telegram
    // =========================================================

    if (window.Telegram && window.Telegram.WebApp) {
        TG = window.Telegram.WebApp;
    }

    // =========================================================
    // RPG Maker resize protection
    // =========================================================

    /*
     * RPG Maker MV automatically installs window.resize handler.
     *
     * Telegram changes the WebView viewport when:
     * - entering fullscreen
     * - leaving fullscreen
     * - rotating the phone
     *
     * We do NOT want RPG Maker/Pixi to recreate/resize
     * its renderer during these operations.
     */

    if (typeof Graphics !== 'undefined') {

        Graphics._onWindowResize = function () {
            // Intentionally disabled.
            //
            // RPG Maker remains internally 816x624.
            // CSS scaling is handled below.
        };

    }

    // =========================================================
    // Fullscreen / mobile CSS
    // =========================================================

    function installMobileCSS() {

        if (document.getElementById('bitz-telegram-style')) {
            return;
        }

        var style = document.createElement('style');

        style.id = 'bitz-telegram-style';

        style.textContent = [

            'html, body {',
            '    width: 100%;',
            '    height: 100%;',
            '    margin: 0;',
            '    padding: 0;',
            '    overflow: hidden;',
            '    background: #000;',
            '    overscroll-behavior: none;',
            '}',

            'body {',
            '    position: fixed;',
            '    inset: 0;',
            '    width: 100vw;',
            '    height: 100vh;',
            '    touch-action: manipulation;',
            '}',

            '#GameCanvas {',
            '    position: fixed !important;',
            '    left: 50% !important;',
            '    top: 50% !important;',
            '    transform: translate(-50%, -50%);',
            '    transform-origin: center center;',
            '    margin: 0 !important;',
            '}',

            'canvas {',
            '    image-rendering: auto;',
            '}',

            '#bitz-loading {',
            '    position: fixed;',
            '    inset: 0;',
            '    z-index: 999999;',
            '    display: flex;',
            '    align-items: center;',
            '    justify-content: center;',
            '    background: #000;',
            '    color: #fff;',
            '    font-family: Arial, sans-serif;',
            '    font-size: 18px;',
            '    text-align: center;',
            '}',

            '#bitz-rotate {',
            '    position: fixed;',
            '    inset: 0;',
            '    z-index: 999998;',
            '    display: none;',
            '    align-items: center;',
            '    justify-content: center;',
            '    flex-direction: column;',
            '    background: #000;',
            '    color: #fff;',
            '    font-family: Arial, sans-serif;',
            '    text-align: center;',
            '}',

            '#bitz-rotate-icon {',
            '    font-size: 64px;',
            '    margin-bottom: 20px;',
            '}',

            '#bitz-rotate-text {',
            '    font-size: 20px;',
            '    line-height: 1.5;',
            '}'

        ].join('\n');

        document.head.appendChild(style);
    }

    installMobileCSS();

    // =========================================================
    // Orientation screen
    // =========================================================

    function createRotateScreen() {

        if (document.getElementById('bitz-rotate')) {
            return;
        }

        var overlay = document.createElement('div');

        overlay.id = 'bitz-rotate';

        var icon = document.createElement('div');

        icon.id = 'bitz-rotate-icon';
        icon.innerHTML = '⟳';

        var text = document.createElement('div');

        text.id = 'bitz-rotate-text';

        text.innerHTML =
            'Поверните устройство<br>' +
            'в горизонтальное положение';

        overlay.appendChild(icon);
        overlay.appendChild(text);

        document.body.appendChild(overlay);
    }

    createRotateScreen();

    // =========================================================
    // Loading screen
    // =========================================================

    function createLoadingScreen() {

        if (document.getElementById('bitz-loading')) {
            return;
        }

        var loading = document.createElement('div');

        loading.id = 'bitz-loading';

        loading.innerHTML = 'Загрузка Bitz Fantasy...';

        document.body.appendChild(loading);
    }

    createLoadingScreen();

    // =========================================================
    // Canvas scaling
    // =========================================================

    function resizeGameCanvas() {

        if (typeof Graphics === 'undefined') {
            return;
        }

        var canvas = document.getElementById('GameCanvas');

        if (!canvas) {
            canvas = document.querySelector('canvas');
        }

        if (!canvas) {
            return;
        }

        /*
         * RPG Maker internal resolution.
         */

        var gameWidth = 816;
        var gameHeight = 624;

        /*
         * Telegram viewport.
         */

        var width = window.innerWidth;
        var height = window.innerHeight;

        if (TG) {

            if (TG.viewportWidth && TG.viewportWidth > 0) {
                width = TG.viewportWidth;
            }

            if (TG.viewportHeight && TG.viewportHeight > 0) {
                height = TG.viewportHeight;
            }
        }

        /*
         * Safe area.
         */

        var safeLeft = 0;
        var safeRight = 0;
        var safeTop = 0;
        var safeBottom = 0;

        if (TG && TG.safeAreaInset) {

            safeLeft =
                Number(TG.safeAreaInset.left) || 0;

            safeRight =
                Number(TG.safeAreaInset.right) || 0;

            safeTop =
                Number(TG.safeAreaInset.top) || 0;

            safeBottom =
                Number(TG.safeAreaInset.bottom) || 0;
        }

        var availableWidth =
            Math.max(
                1,
                width - safeLeft - safeRight
            );

        var availableHeight =
            Math.max(
                1,
                height - safeTop - safeBottom
            );

        /*
         * Keep RPG Maker aspect ratio.
         */

        var scaleX =
            availableWidth / gameWidth;

        var scaleY =
            availableHeight / gameHeight;

        var scale =
            Math.min(scaleX, scaleY);

        /*
         * Prevent invalid scale.
         */

        if (!isFinite(scale) || scale <= 0) {
            scale = 1;
        }

        /*
         * Apply visual scaling only.
         *
         * DO NOT change canvas.width/height.
         * DO NOT call Graphics.resize().
         */

        canvas.style.width =
            Math.round(gameWidth * scale) + 'px';

        canvas.style.height =
            Math.round(gameHeight * scale) + 'px';

        canvas.style.left =
            (
                safeLeft +
                availableWidth / 2
            ) + 'px';

        canvas.style.top =
            (
                safeTop +
                availableHeight / 2
            ) + 'px';

        canvas.style.transform =
            'translate(-50%, -50%)';

        canvas.style.transformOrigin =
            'center center';
    }

    // =========================================================
    // Orientation
    // =========================================================

    function updateOrientation() {

        var overlay =
            document.getElementById('bitz-rotate');

        if (!overlay) {
            return;
        }

        var width = window.innerWidth;
        var height = window.innerHeight;

        if (TG) {

            if (TG.viewportWidth > 0) {
                width = TG.viewportWidth;
            }

            if (TG.viewportHeight > 0) {
                height = TG.viewportHeight;
            }
        }

        /*
         * RPG Maker game is designed for landscape.
         */

        if (height > width) {

            overlay.style.display = 'flex';

        } else {

            overlay.style.display = 'none';

        }

        resizeGameCanvas();
    }

    // =========================================================
    // Telegram fullscreen
    // =========================================================

    function enterTelegramFullscreen() {

        if (!TG) {
            return;
        }

        try {

            if (
                typeof TG.requestFullscreen === 'function' &&
                !TG.isFullscreen
            ) {

                TG.requestFullscreen();

            }

        } catch (error) {

            console.log(
                'Telegram fullscreen unavailable:',
                error
            );

        }
    }

    // =========================================================
    // Telegram orientation
    // =========================================================

    function lockLandscape() {

        if (!TG) {
            return;
        }

        /*
         * Telegram's lockOrientation() locks the CURRENT
         * orientation, not a requested "landscape" value.
         *
         * Therefore we only lock if the app was opened
         * while already in landscape.
         */

        try {

            if (
                typeof TG.lockOrientation === 'function' &&
                window.innerWidth > window.innerHeight
            ) {

                TG.lockOrientation();

            }

        } catch (error) {

            console.log(
                'Telegram orientation lock unavailable:',
                error
            );

        }
    }

    // =========================================================
    // Telegram events
    // =========================================================

    function installTelegramEvents() {

        if (!TG || typeof TG.onEvent !== 'function') {
            return;
        }

        TG.onEvent(
            'fullscreenChanged',
            function () {

                setTimeout(function () {

                    updateOrientation();
                    resizeGameCanvas();

                }, 100);

            }
        );

        TG.onEvent(
            'fullscreenFailed',
            function (event) {

                console.log(
                    'Telegram fullscreen failed:',
                    event
                );

                /*
                 * Fallback:
                 * the Mini App still works in expanded mode.
                 */

                setTimeout(function () {

                    updateOrientation();
                    resizeGameCanvas();

                }, 100);

            }
        );

        TG.onEvent(
            'viewportChanged',
            function (event) {

                /*
                 * IMPORTANT:
                 *
                 * We do NOT call:
                 *
                 * Graphics._onWindowResize()
                 * Graphics.resize()
                 * SceneManager.stop()
                 * SceneManager.resume()
                 *
                 * Only CSS scaling is updated.
                 */

                setTimeout(function () {

                    updateOrientation();

                }, event && event.isStateStable ? 0 : 150);

            }
        );

        TG.onEvent(
            'safeAreaChanged',
            function () {

                resizeGameCanvas();

            }
        );

        TG.onEvent(
            'contentSafeAreaChanged',
            function () {

                resizeGameCanvas();

            }
        );
    }

    // =========================================================
    // Start
    // =========================================================

    function startTelegram() {

        if (!TG) {

            setTimeout(function () {

                var loading =
                    document.getElementById('bitz-loading');

                if (loading) {
                    loading.style.display = 'none';
                }

                updateOrientation();

            }, 1000);

            return;
        }

        /*
         * Store Telegram object for other game scripts.
         */

        if (typeof $gameTemp !== 'undefined') {
            $gameTemp.tg = TG;
        }

        try {
            TG.ready();
        } catch (e) {}

        try {
            TG.expand();
        } catch (e) {}

        try {

            if (TG.disableVerticalSwipes) {
                TG.disableVerticalSwipes();
            }

        } catch (e) {}

        try {

            if (TG.setHeaderColor) {
                TG.setHeaderColor('#000000');
            }

            if (TG.setBackgroundColor) {
                TG.setBackgroundColor('#000000');
            }

        } catch (e) {}

        installTelegramEvents();

        /*
         * First fullscreen request.
         */

        enterTelegramFullscreen();

        /*
         * Only lock if already landscape.
         */

        lockLandscape();

        setTimeout(function () {

            updateOrientation();

        }, 100);

        setTimeout(function () {

            updateOrientation();

        }, 500);

        setTimeout(function () {

            updateOrientation();

            var loading =
                document.getElementById('bitz-loading');

            if (loading) {
                loading.style.display = 'none';
            }

        }, 1200);
    }

    // =========================================================
    // Browser events
    // =========================================================

    window.addEventListener(
        'resize',
        function () {

            /*
             * Do NOT touch RPG Maker renderer.
             * Only update CSS scaling.
             */

            setTimeout(
                resizeGameCanvas,
                100
            );

        },
        false
    );

    window.addEventListener(
        'orientationchange',
        function () {

            setTimeout(
                updateOrientation,
                300
            );

        },
        false
    );

    /*
     * visualViewport is useful on mobile Telegram,
     * but again we only scale CSS.
     */

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            'resize',
            function () {

                setTimeout(
                    resizeGameCanvas,
                    100
                );

            },
            false
        );
    }

    // =========================================================
    // Wait for RPG Maker canvas
    // =========================================================

    var waitCount = 0;

    var waitTimer = setInterval(
        function () {

            var canvas =
                document.getElementById('GameCanvas');

            if (canvas) {

                clearInterval(waitTimer);

                resizeGameCanvas();

                startTelegram();

            }

            waitCount++;

            if (waitCount > 100) {

                clearInterval(waitTimer);

                startTelegram();

            }

        },
        100
    );

})();