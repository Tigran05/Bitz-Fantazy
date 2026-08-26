/*:
 * @plugindesc Telegram Web App Integration & Orientation Fix
 * @author Bitz Fantasy
 *
 * @help
 * Telegram Web App integration for RPG Maker MV.
 *
 * The game is locked visually to landscape mode.
 * When the device is rotated to portrait, an overlay is shown.
 * The RPG Maker SceneManager is NOT stopped/resumed because this
 * can cause crashes during Telegram viewport changes.
 */

(function () {
    'use strict';

    // ---------------------------------------------------------
    // TelegramGameProxy polyfill
    // ---------------------------------------------------------

    if (!window.TelegramGameProxy) {
        window.TelegramGameProxy = {
            receiveEvent: function () {
                // Compatibility with some Telegram clients
            }
        };
    }

    // ---------------------------------------------------------
    // Telegram initialization
    // ---------------------------------------------------------

    var _Scene_Boot_start = Scene_Boot.prototype.start;

    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        this.initTelegramWebApp();
    };

    Scene_Boot.prototype.initTelegramWebApp = function () {

        if (!window.Telegram || !window.Telegram.WebApp) {
            return;
        }

        var tg = window.Telegram.WebApp;

        $gameTemp.tg = tg;

        // Expand Telegram WebApp
        try {
            if (tg.expand) {
                tg.expand();
            }
        } catch (e) {
            console.warn('Telegram expand error:', e);
        }

        // Prevent accidental closing by vertical swipes
        try {
            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }
        } catch (e) {
            console.warn('Telegram swipe error:', e);
        }

        // Colors
        try {
            if (tg.setHeaderColor) {
                tg.setHeaderColor('#000000');
            }

            if (tg.setBackgroundColor) {
                tg.setBackgroundColor('#000000');
            }
        } catch (e) {
            console.warn('Telegram color error:', e);
        }

        // Create orientation overlay
        this.createOrientationOverlay();

        // Initial orientation check
        this.checkGameOrientation();

        // Window resize
        window.addEventListener('resize', function () {
            Scene_Boot.prototype.checkGameOrientation();
        });

        // Device orientation
        window.addEventListener('orientationchange', function () {
            setTimeout(function () {
                Scene_Boot.prototype.checkGameOrientation();
            }, 250);
        });

        // Telegram viewport
        try {
            tg.onEvent('viewportChanged', function () {

                // Do not immediately resize RPG Maker.
                // Telegram may fire this event several times while
                // the viewport is changing.

                Scene_Boot.prototype.checkGameOrientation();

                Scene_Boot.prototype.scheduleGameResize();
            });

        } catch (e) {
            console.warn('Telegram viewport event error:', e);
        }

        // Telegram ready
        try {
            tg.ready();
        } catch (e) {
            console.warn('Telegram ready error:', e);
        }

        console.log('Telegram Web App initialized');
    };

    // ---------------------------------------------------------
    // Orientation overlay
    // ---------------------------------------------------------

    Scene_Boot.prototype.createOrientationOverlay = function () {

        if (document.getElementById('orientation-overlay')) {
            return;
        }

        var overlay = document.createElement('div');

        overlay.id = 'orientation-overlay';

        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';

        overlay.style.width = '100vw';
        overlay.style.height = '100vh';

        overlay.style.backgroundColor = '#000000';

        overlay.style.zIndex = '999999';

        overlay.style.display = 'none';

        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        overlay.style.color = '#ffffff';

        overlay.style.fontFamily = 'Arial, sans-serif';

        overlay.style.textAlign = 'center';

        overlay.style.padding = '20px';

        overlay.style.boxSizing = 'border-box';

        // Rotate icon
        var icon = document.createElement('div');

        icon.innerHTML = '&#8635;';

        icon.style.fontSize = '60px';
        icon.style.marginBottom = '20px';

        // Text
        var text = document.createElement('div');

        text.innerText =
            'Пожалуйста, поверните устройство\n' +
            'в горизонтальное положение';

        text.style.fontSize = '20px';
        text.style.lineHeight = '1.5';

        text.style.whiteSpace = 'pre-line';

        overlay.appendChild(icon);
        overlay.appendChild(text);

        document.body.appendChild(overlay);
    };

    // ---------------------------------------------------------
    // Orientation check
    // ---------------------------------------------------------

    Scene_Boot.prototype.checkGameOrientation = function () {

        try {

            var overlay =
                document.getElementById('orientation-overlay');

            if (!overlay) {
                return;
            }

            var width =
                window.visualViewport
                    ? window.visualViewport.width
                    : window.innerWidth;

            var height =
                window.visualViewport
                    ? window.visualViewport.height
                    : window.innerHeight;

            var portrait = height > width;

            if (portrait) {

                // Portrait:
                // show overlay only.

                overlay.style.display = 'flex';

            } else {

                // Landscape:
                // hide overlay.

                overlay.style.display = 'none';

            }

        } catch (e) {

            console.error(
                'Orientation check error:',
                e
            );

            if (window.logError) {
                window.logError(
                    'Orientation Error: ' +
                    e.message
                );
            }
        }
    };

    // ---------------------------------------------------------
    // Safe RPG Maker resize
    // ---------------------------------------------------------

    Scene_Boot.prototype.scheduleGameResize = function () {

        if (Scene_Boot.prototype._resizeTimer) {
            clearTimeout(
                Scene_Boot.prototype._resizeTimer
            );
        }

        Scene_Boot.prototype._resizeTimer =
            setTimeout(function () {

                try {

                    var width = window.innerWidth;
                    var height = window.innerHeight;

                    // Do not resize while portrait.
                    if (height > width) {
                        return;
                    }

                    if (
                        typeof Graphics !== 'undefined' &&
                        Graphics._onWindowResize
                    ) {

                        Graphics._onWindowResize();

                    }

                } catch (e) {

                    console.error(
                        'Safe resize error:',
                        e
                    );

                    if (window.logError) {
                        window.logError(
                            'Resize Error: ' +
                            e.message
                        );
                    }

                }

            }, 300);
    };

})();