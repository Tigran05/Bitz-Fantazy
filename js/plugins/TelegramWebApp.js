/*:
 * @plugindesc Telegram Web App Integration
 * @author Bitz Fantasy
 *
 * @help
 * Telegram Web App integration for RPG Maker MV.
 * Handles portrait/landscape mode without stopping
 * or resizing the RPG Maker game manually.
 */

(function () {
    'use strict';

    // Telegram compatibility
    if (!window.TelegramGameProxy) {
        window.TelegramGameProxy = {
            receiveEvent: function () {}
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

        if (typeof $gameTemp !== 'undefined') {
            $gameTemp.tg = tg;
        }

        // Expand Telegram WebApp
        try {
            if (typeof tg.expand === 'function') {
                tg.expand();
            }
        } catch (e) {
            console.warn('Telegram expand error:', e);
        }

        // Disable vertical swipes
        try {
            if (typeof tg.disableVerticalSwipes === 'function') {
                tg.disableVerticalSwipes();
            }
        } catch (e) {
            console.warn('Telegram swipe error:', e);
        }

        // Colors
        try {
            if (typeof tg.setHeaderColor === 'function') {
                tg.setHeaderColor('#000000');
            }

            if (typeof tg.setBackgroundColor === 'function') {
                tg.setBackgroundColor('#000000');
            }
        } catch (e) {
            console.warn('Telegram color error:', e);
        }

        // Create orientation screen
        this.createOrientationOverlay();

        // Initial check
        this.updateOrientation();

        // Browser resize
        window.addEventListener('resize', function () {
            setTimeout(function () {
                Scene_Boot.prototype.updateOrientation();
            }, 100);
        });

        // Device rotation
        window.addEventListener('orientationchange', function () {
            setTimeout(function () {
                Scene_Boot.prototype.updateOrientation();
            }, 300);
        });

        // Telegram viewport
        try {
            if (typeof tg.onEvent === 'function') {

                tg.onEvent('viewportChanged', function () {

                    setTimeout(function () {
                        Scene_Boot.prototype.updateOrientation();
                    }, 150);

                });

            }
        } catch (e) {
            console.warn('Telegram viewport event error:', e);
        }

        // Telegram ready
        try {
            if (typeof tg.ready === 'function') {
                tg.ready();
            }
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

        overlay.style.width = '100%';
        overlay.style.height = '100%';

        overlay.style.background = '#000000';

        overlay.style.zIndex = '999999';

        overlay.style.display = 'none';

        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        overlay.style.color = '#ffffff';

        overlay.style.fontFamily =
            'Arial, sans-serif';

        overlay.style.textAlign = 'center';

        overlay.style.boxSizing = 'border-box';

        overlay.style.padding = '20px';

        // Rotation icon
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

    Scene_Boot.prototype.updateOrientation = function () {

        try {

            var overlay =
                document.getElementById(
                    'orientation-overlay'
                );

            if (!overlay) {
                return;
            }

            var width = window.innerWidth;
            var height = window.innerHeight;

            // Telegram viewport can temporarily report
            // strange dimensions during rotation.
            // Ignore invalid values.

            if (
                !width ||
                !height ||
                width < 100 ||
                height < 100
            ) {
                return;
            }

            if (height > width) {

                // Portrait
                overlay.style.display = 'flex';

            } else {

                // Landscape
                overlay.style.display = 'none';

            }

        } catch (e) {

            console.error(
                'Orientation error:',
                e
            );

        }
    };

})();