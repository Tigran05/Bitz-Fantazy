// RPG Maker MV - Telegram Cloud Storage Plugin
// Интеграция облачного хранилища Telegram с системой сохранений RPG Maker MV

(function () {
    'use strict';

    // Переопределяем методы сохранения/загрузки для использования Telegram Cloud Storage

    if (window.TelegramCloudStorage) {

        // Сохраняем оригинальные методы
        const _StorageManager_save = StorageManager.save;
        const _StorageManager_load = StorageManager.load;
        const _StorageManager_remove = StorageManager.remove;

        // Префикс для ключей сохранений
        const SAVE_PREFIX = 'rpgmv_save_';
        const CONFIG_KEY = 'rpgmv_config';
        const GLOBAL_KEY = 'rpgmv_global';

        // Флаг для отслеживания синхронизации
        let isSyncing = false;

        // Переопределяем метод сохранения
        StorageManager.save = function (savefileId, json) {
            // Сначала сохраняем локально (оригинальный метод)
            _StorageManager_save.call(this, savefileId, json);

            // Затем синхронизируем с облаком
            if (!isSyncing) {
                const key = SAVE_PREFIX + savefileId;
                window.TelegramCloudStorage.save(key, json, function (success, error) {
                    if (success) {
                        console.log('Game saved to Telegram Cloud:', savefileId);
                    } else {
                        console.error('Failed to save to Telegram Cloud:', error);
                    }
                });
            }
        };

        // Переопределяем метод загрузки
        StorageManager.load = function (savefileId) {
            const key = SAVE_PREFIX + savefileId;

            // Пытаемся загрузить из облака
            window.TelegramCloudStorage.load(key, function (cloudData, error) {
                if (cloudData && !error) {
                    console.log('Game loaded from Telegram Cloud:', savefileId);
                    isSyncing = true;
                    // Сохраняем облачные данные локально
                    _StorageManager_save.call(StorageManager, savefileId, cloudData);
                    isSyncing = false;
                } else {
                    console.log('Loading from local storage:', savefileId);
                }
            });

            // Возвращаем локальные данные (они будут обновлены асинхронно, если есть облачные)
            return _StorageManager_load.call(this, savefileId);
        };

        // Переопределяем метод удаления
        StorageManager.remove = function (savefileId) {
            // Удаляем локально
            _StorageManager_remove.call(this, savefileId);

            // Удаляем из облака
            const key = SAVE_PREFIX + savefileId;
            window.TelegramCloudStorage.remove(key, function (success, error) {
                if (success) {
                    console.log('Save deleted from Telegram Cloud:', savefileId);
                } else {
                    console.error('Failed to delete from Telegram Cloud:', error);
                }
            });
        };

        // Сохранение конфигурации в облако
        const _ConfigManager_save = ConfigManager.save;
        ConfigManager.save = function () {
            _ConfigManager_save.call(this);

            const config = this.makeData();
            window.TelegramCloudStorage.save(CONFIG_KEY, config, function (success) {
                if (success) {
                    console.log('Config saved to Telegram Cloud');
                }
            });
        };

        // Загрузка конфигурации из облака
        const _ConfigManager_load = ConfigManager.load;
        ConfigManager.load = function () {
            window.TelegramCloudStorage.load(CONFIG_KEY, function (cloudConfig) {
                if (cloudConfig) {
                    console.log('Config loaded from Telegram Cloud');
                    ConfigManager.applyData(cloudConfig);
                }
            });

            _ConfigManager_load.call(this);
        };

        // Синхронизация глобальной информации
        const _DataManager_saveGlobalInfo = DataManager.saveGlobalInfo;
        DataManager.saveGlobalInfo = function (info) {
            _DataManager_saveGlobalInfo.call(this, info);

            window.TelegramCloudStorage.save(GLOBAL_KEY, info, function (success) {
                if (success) {
                    console.log('Global info saved to Telegram Cloud');
                }
            });
        };

        const _DataManager_loadGlobalInfo = DataManager.loadGlobalInfo;
        DataManager.loadGlobalInfo = function () {
            const localInfo = _DataManager_loadGlobalInfo.call(this);

            window.TelegramCloudStorage.load(GLOBAL_KEY, function (cloudInfo) {
                if (cloudInfo) {
                    console.log('Global info loaded from Telegram Cloud');
                    // Объединяем облачную и локальную информацию
                    // Приоритет у более свежих данных
                    for (let i = 0; i < cloudInfo.length; i++) {
                        if (cloudInfo[i] && (!localInfo[i] || cloudInfo[i].timestamp > localInfo[i].timestamp)) {
                            localInfo[i] = cloudInfo[i];
                        }
                    }
                }
            });

            return localInfo;
        };

        console.log('Telegram Cloud Storage integration enabled for RPG Maker MV');

        // Добавляем информацию о пользователе Telegram в игру
        if (window.TelegramUser && window.TelegramUser.id) {
            // Можно использовать ID пользователя для уникальных сохранений
            console.log('Telegram User ID:', window.TelegramUser.id);

            // Опционально: показать имя пользователя в игре
            if (window.TelegramUser.firstName) {
                console.log('Welcome,', window.TelegramUser.firstName);
            }
        }
    } else {
        console.warn('Telegram Cloud Storage not available - using local storage only');
    }

})();
