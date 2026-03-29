/*:
 * @plugindesc Telegram Web App Integration & Fixes
 * @author Bitz Fantasy
 *
 * @help
 * This plugin integrates Telegram Web App features and fixes common issues.
 * 
 * Features:
 * - Automatically expands the app to full screen.
 * - Disables vertical swipes to prevent accidental closing.
 * - Sets the header and background colors.
 * - Exposes the Telegram Web App object as $gameTemp.tg
 */

(function () {
    // Polyfill for TelegramGameProxy to prevent errors in some Telegram clients
    if (!window.TelegramGameProxy) {
        window.TelegramGameProxy = {
            receiveEvent: function () {
                // console.log('TelegramGameProxy.receiveEvent called (polyfilled)');
            }
        };
    }

    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        this.initTelegramWebApp();
    };

    Scene_Boot.prototype.initTelegramWebApp = function () {
        if (window.Telegram && window.Telegram.WebApp) {
            var tg = window.Telegram.WebApp;
            $gameTemp.tg = tg;

            // Expand to full screen
            tg.expand();

            // Handle rotation/resize events from Telegram
            tg.onEvent('viewportChanged', function () {
                try {
                    // Only resize if we are NOT in portrait mode (width > height)
                    if (window.innerWidth >= window.innerHeight) {
                        if (Graphics && Graphics._onWindowResize) {
                            Graphics._onWindowResize();
                        }
                    }
                } catch (e) {
                    console.error("Telegram viewportChanged error:", e);
                    if (window.logError) window.logError("Viewport Error: " + e.message);
                }
            });

            // Disable vertical swipes
            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }

            // Set colors
            if (tg.setHeaderColor) {
                tg.setHeaderColor('#000000');
            }
            if (tg.setBackgroundColor) {
                tg.setBackgroundColor('#000000');
            }

            // Force Landscape Mode
            this.forceLandscapeMode();

            // Notify Telegram that the app is ready
            tg.ready();

            console.log("Telegram Web App initialized");
        }
    };

    Scene_Boot.prototype.forceLandscapeMode = function () {
        // Create overlay element
        var overlay = document.createElement('div');
        overlay.id = 'orientation-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#000000';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'none'; // Hidden by default
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = '#ffffff';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.textAlign = 'center';

        // Add icon and text
        var icon = document.createElement('div');
        icon.innerHTML = '&#8635;'; // Rotate icon
        icon.style.fontSize = '50px';
        icon.style.marginBottom = '20px';

        var text = document.createElement('div');
        text.innerText = 'Пожалуйста, поверните устройство\nв горизонтальное положение';
        text.style.fontSize = '20px';

        overlay.appendChild(icon);
        overlay.appendChild(text);
        document.body.appendChild(overlay);

        var wasPortrait = false;
        var checkOrientation = function () {
            try {
                // Check if portrait
                if (window.innerHeight > window.innerWidth) {
                    overlay.style.display = 'flex';
                    if (!wasPortrait) {
                        wasPortrait = true;
                        if (SceneManager && SceneManager.stop) {
                            console.log("Pausing game due to portrait mode");
                            SceneManager.stop();
                        }
                        if (AudioManager && AudioManager.stopAll) {
                            AudioManager.stopAll();
                        }
                    }
                } else {
                    overlay.style.display = 'none';
                    if (wasPortrait) {
                        wasPortrait = false;
                        if (SceneManager && SceneManager.resume) {
                            console.log("Resuming game due to landscape mode");
                            SceneManager.resume();
                        }
                    }
                    // Try to lock orientation if supported and in landscape
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(function (err) {
                            // Lock failed (not supported or denied), just ignore
                        });
                    }
                }
            } catch (e) {
                console.error("checkOrientation error:", e);
                if (window.logError) window.logError("Orientation Error: " + e.message);
            }
        };

        // Initial check
        checkOrientation();

        // Listen for resize and orientation changes
        window.addEventListener('resize', function () {
            try {
                checkOrientation();
            } catch (e) {
                if (window.logError) window.logError("Resize Error: " + e.message);
            }
        });
        window.addEventListener('orientationchange', function () {
            try {
                checkOrientation();
            } catch (e) {
                if (window.logError) window.logError("OrientationChange Error: " + e.message);
            }
        });

        // Also listen to Telegram viewport changes
        if ($gameTemp.tg) {
            $gameTemp.tg.onEvent('viewportChanged', function () {
                try {
                    checkOrientation();
                } catch (e) {
                    if (window.logError) window.logError("TG Viewport Error: " + e.message);
                }
            });
        }
    };
})();
