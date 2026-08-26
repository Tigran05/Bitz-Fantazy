// Telegram Web App Integration Script
// Инициализация Telegram Web App для RPG Maker MV

(function () {
    'use strict';

    // Проверяем, что скрипт запущен в Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        // Расширяем приложение на весь экран
        tg.expand();

        // Включаем режим закрепления (предотвращает случайное закрытие)
        tg.enableClosingConfirmation();

        // Устанавливаем цвет заголовка - делаем его темным как фон игры
        tg.setHeaderColor('secondary_bg_color');

        // Устанавливаем цвет фона под тему Telegram
        tg.setBackgroundColor('bg_color');

        // Готовим приложение к показу
        tg.ready();

        console.log('Telegram Web App initialized');
        console.log('User ID:', tg.initDataUnsafe?.user?.id);
        console.log('Platform:', tg.platform);

        // Облачное хранилище для сохранений
        window.TelegramCloudStorage = {
            // Сохранить данные в облако Telegram
            save: function (key, value, callback) {
                if (tg.CloudStorage) {
                    const dataStr = typeof value === 'string' ? value : JSON.stringify(value);
                    tg.CloudStorage.setItem(key, dataStr, function (error, success) {
                        if (error) {
                            console.error('Cloud save error:', error);
                            if (callback) callback(false, error);
                        } else {
                            console.log('Cloud save success:', key);
                            if (callback) callback(true);
                        }
                    });
                } else {
                    console.warn('Cloud Storage not available');
                    if (callback) callback(false, 'Cloud Storage not available');
                }
            },

            // Загрузить данные из облака Telegram
            load: function (key, callback) {
                if (tg.CloudStorage) {
                    tg.CloudStorage.getItem(key, function (error, value) {
                        if (error) {
                            console.error('Cloud load error:', error);
                            if (callback) callback(null, error);
                        } else {
                            console.log('Cloud load success:', key);
                            try {
                                const parsed = JSON.parse(value);
                                if (callback) callback(parsed);
                            } catch (e) {
                                if (callback) callback(value);
                            }
                        }
                    });
                } else {
                    console.warn('Cloud Storage not available');
                    if (callback) callback(null, 'Cloud Storage not available');
                }
            },

            // Удалить данные из облака
            remove: function (key, callback) {
                if (tg.CloudStorage) {
                    tg.CloudStorage.removeItem(key, function (error, success) {
                        if (error) {
                            console.error('Cloud remove error:', error);
                            if (callback) callback(false, error);
                        } else {
                            console.log('Cloud remove success:', key);
                            if (callback) callback(true);
                        }
                    });
                } else {
                    console.warn('Cloud Storage not available');
                    if (callback) callback(false, 'Cloud Storage not available');
                }
            },

            // Получить все ключи
            getKeys: function (callback) {
                if (tg.CloudStorage) {
                    tg.CloudStorage.getKeys(function (error, keys) {
                        if (error) {
                            console.error('Cloud getKeys error:', error);
                            if (callback) callback([], error);
                        } else {
                            console.log('Cloud keys:', keys);
                            if (callback) callback(keys || []);
                        }
                    });
                } else {
                    console.warn('Cloud Storage not available');
                    if (callback) callback([], 'Cloud Storage not available');
                }
            }
        };

        // Получаем информацию о пользователе Telegram
        window.TelegramUser = {
            id: tg.initDataUnsafe?.user?.id || null,
            firstName: tg.initDataUnsafe?.user?.first_name || '',
            lastName: tg.initDataUnsafe?.user?.last_name || '',
            username: tg.initDataUnsafe?.user?.username || '',
            languageCode: tg.initDataUnsafe?.user?.language_code || 'en',
            isPremium: tg.initDataUnsafe?.user?.is_premium || false
        };

        // Обработчик события закрытия приложения
        tg.onEvent('viewportChanged', function () {
            console.log('Viewport changed:', tg.viewportHeight, tg.viewportStableHeight);
        });

    } else {
        console.warn('Not running in Telegram Web App');
        // Если не в Telegram, показываем предупреждение
        console.log('This game is optimized for Telegram Web App');
    }
})();
