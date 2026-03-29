//=============================================================================
// ACTPO_QuestJournal.js
//=============================================================================

/*:
 * @plugindesc v2.1 Система журнала квестов со встроенным редактором [ACTPO]
 * @author ACTPOJIuT
 *
 * @param HUD Position X
 * @desc X координата HUD (по умолчанию: Graphics.boxWidth - 320)
 * @default Graphics.boxWidth - 320
 *
 * @param HUD Position Y
 * @desc Y координата HUD
 * @default 10
 *
 * @param HUD Width
 * @desc Ширина HUD
 * @default 300
 *
 * @param Max Visible Quests
 * @desc Максимальное количество квестов в HUD
 * @default 3
 *
 * @param Show HUD by Default
 * @desc Показывать HUD по умолчанию (true/false)
 * @default true
 *
 * @param HUD Background Opacity
 * @desc Прозрачность фона HUD (0-255)
 * @default 200
 *
 * @param HUD Text Color
 * @desc Цвет текста HUD (номер цвета из окна)
 * @default 0
 *
 * @param Quest Complete Color
 * @desc Цвет завершенного квеста
 * @default 3
 *
 * @param Menu Command Name
 * @desc Название команды в меню
 * @default Квесты
 *
 * @param Quests
 * @text Список квестов
 * @desc Создайте квесты прямо здесь!
 * @type struct<Quest>[]
 * @default []
 *
 * @help
 * ============================================================================
 * Описание
 * ============================================================================
 * 
 * Плагин добавляет систему квестов со встроенным редактором.
 * Квесты создаются прямо в параметрах плагина!
 *
 * ============================================================================
 * Как создать квест
 * ============================================================================
 * 
 * 1. Откройте Plugin Manager (F9)
 * 2. Найдите ACTPO_QuestJournal
 * 3. Откройте параметры плагина
 * 4. Найдите параметр "Список квестов"
 * 5. Нажмите "..." → "Add" (Добавить)
 * 6. Заполните поля:
 *    - ID квеста (например: quest_test)
 *    - Название квеста
 *    - Описание
 *    - Шаги квеста (Add → заполнить название и описание)
 *    - Награды (золото, опыт)
 * 7. Нажмите OK
 *
 * Квест сразу доступен в игре!
 *
 * ============================================================================
 * НОВОЕ: Автоматические счетчики
 * ============================================================================
 *
 * Теперь не нужно создавать переменные вручную! Плагин автоматически
 * отслеживает прогресс для следующих типов шагов:
 *
 * --- СОБРАТЬ ПРЕДМЕТЫ (collect_items) ---
 * 
 * При создании шага квеста:
 * 1. Тип шага: "Собрать предметы"
 * 2. ID предмета: выберите предмет из базы данных
 * 3. Требуемое количество: например, 5
 *
 * Плагин автоматически:
 * - Считает предметы в инвентаре
 * - Показывает прогресс в HUD: "Собрано: 3/5"
 * - Переходит к следующему шагу при достижении цели
 *
 * Вам НЕ НУЖНО:
 * - Создавать переменные
 * - Писать условия
 * - Вызывать nextStep вручную
 *
 * --- УБИТЬ ВРАГОВ (kill_enemies) ---
 *
 * При создании шага квеста:
 * 1. Тип шага: "Убить врагов"
 * 2. ID врага: выберите врага из базы данных
 * 3. Требуемое количество: например, 10
 *
 * Плагин автоматически:
 * - Считает убитых врагов после каждого боя
 * - Показывает прогресс: "Убито: 7/10"
 * - Переходит к следующему шагу при достижении цели
 *
 * Вам НЕ НУЖНО:
 * - Настраивать Battle Events
 * - Создавать переменные
 * - Писать скрипты
 *
 * --- ОБЫЧНЫЙ ШАГ (simple) ---
 *
 * Для других типов задач используйте обычный шаг:
 * - Поговорить с NPC
 * - Дойти до локации
 * - Любые другие действия
 *
 * Для таких шагов используйте команду nextStep вручную.
 *
 * ============================================================================
 * Plugin Commands
 * ============================================================================
 *
 * ACTPO_Quest start questId
 *   Начать квест (добавить + активировать одной командой)
 *
 * ACTPO_Quest finish questId
 *   Завершить квест (завершить + выдать награды одной командой)
 *
 * ACTPO_Quest add questId
 *   Добавить квест в журнал
 *
 * ACTPO_Quest activate questId
 *   Активировать квест (показать в HUD)
 *
 * ACTPO_Quest setStep questId stepNumber
 *   Установить текущий шаг квеста
 *
 * ACTPO_Quest nextStep questId
 *   Перейти к следующему шагу квеста (для обычных шагов)
 *
 * ACTPO_Quest complete questId
 *   Завершить квест
 *
 * ACTPO_Quest giveRewards questId
 *   Выдать награды за квест
 *
 * ============================================================================
 * Примеры использования
 * ============================================================================
 *
 * --- ПРИМЕР 1: Квест "Собрать 5 зелий" ---
 *
 * Настройка в плагине:
 *   ID: quest_potions
 *   Шаг 1:
 *     Тип: Собрать предметы
 *     ID предмета: 1 (Зелье)
 *     Количество: 5
 *
 * В событии NPC:
 *   ◆ Команда плагина: ACTPO_Quest start quest_potions
 *   ◆ Показать текст: Собери 5 зелий!
 *
 * Всё! Плагин автоматически отслеживает зелья в инвентаре.
 *
 * --- ПРИМЕР 2: Квест "Убить 10 слаймов" ---
 *
 * Настройка в плагине:
 *   ID: quest_slimes
 *   Шаг 1:
 *     Тип: Убить врагов
 *     ID врага: 1 (Слайм)
 *     Количество: 10
 *
 * В событии NPC:
 *   ◆ Команда плагина: ACTPO_Quest start quest_slimes
 *   ◆ Показать текст: Убей 10 слаймов!
 *
 * Плагин автоматически считает убитых слаймов!
 *
 * ============================================================================
 * Советы
 * ============================================================================
 *
 * 1. Используйте автоматические счетчики для типичных задач
 * 2. Используйте обычные шаги для уникальных задач
 * 3. Комбинируйте разные типы шагов в одном квесте
 * 4. Используйте упрощенные команды start и finish
 *
 */

/*~struct~Quest:
 * @param questId
 * @text ID квеста
 * @desc Уникальный ID квеста (например: quest_find_sword)
 * @type text
 * @default quest_
 *
 * @param title
 * @text Название
 * @desc Название квеста
 * @type text
 * @default Новый квест
 *
 * @param description
 * @text Описание
 * @desc Описание квеста
 * @type note
 * @default "Описание квеста"
 *
 * @param variableId
 * @text ID Переменной
 * @desc Укажите ID переменной, которая будет хранить номер этапа этого квеста (для условий в событиях)
 * @type variable
 * @default 0
 *
 * @param category
 * @text Категория
 * @desc Категория квеста
 * @type select
 * @option Основной
 * @value main
 * @option Побочный
 * @value side
 * @option Скрытый
 * @value hidden
 * @default main
 *
 * @param questNpcId
 * @text ID события NPC
 * @desc ID события на карте, которое управляет квестом (0 = без автоNPC)
 * @type number
 * @min 0
 * @default 0
 *
 * @param requiredSwitchId
 * @text Требуемый Переключатель
 * @desc ID переключателя, который должен быть ВКЛ для доступа к квесту (0 = нет требований)
 * @type switch
 * @default 0
 *
 * @param questNpcMapId
 * @text ID Карты NPC
 * @desc ID карты, где находится NPC (0 = любая/текущая)
 * @type number
 * @min 0
 * @default 0
 *
 *
 * @param reqEventId
 * @text Требуемое Событие (ID)
 * @desc ID события, которое должно пройти (0 = нет)
 * @type number
 * @min 0
 * @default 0
 *
 * @param reqMapId
 * @text Требуемое Событие (Карта)
 * @desc ID карты того события
 * @type number
 * @min 0
 * @default 0
 *
 * @param reqSelfSwitch
 * @text Требуемый Self Switch
 * @desc Какой переключатель должен быть ВКЛ на том событии?
 * @type select
 * @option A
 * @value A
 * @option B
 * @value B
 * @option C
 * @value C
 * @option D
 * @value D
 * @default A
 *
 *
 * @param steps
 * @text Шаги квеста
 * @desc Список шагов квеста
 * @type struct<QuestStep>[]
 * @default []
 *
 * @param dialogReward
 * @text Диалог награды
 * @desc Что говорит NPC при выдаче награды
 * @type struct<DialogMessage>[]
 * @default []
 *
 * @param rewardGold
 * @text Награда: Золото
 * @desc Количество золота за квест
 * @type number
 * @min 0
 * @default 100
 *
 * @param rewardExp
 * @text Награда: Опыт
 * @desc Количество опыта за квест
 * @type number
 * @min 0
 * @default 50
 *
 * @param rewardItems
 * @text Награда: Предметы
 * @desc Список предметов в награду
 * @type struct<RewardItem>[]
 * @default []
 *
 * @param npcFaceName
 * @text Лицо NPC (Файл)
 * @desc Файл лица NPC по умолчанию для этого квеста
 * @type file
 * @dir img/faces
 * @default
 *
 * @param npcFaceIndex
 * @text Лицо NPC (Индекс)
 * @desc Индекс лица (0-7)
 * @type number
 * @min 0
 * @max 7
 * @default 0
 */

/*~struct~QuestStep:
 * @param title
 * @text Название шага
 * @desc Название шага квеста
 * @type text
 * @default Новый шаг
 *
 * @param description
 * @text Описание шага
 * @desc Описание шага квеста
 * @type note
 * @default "Описание шага"
 *
 * @param stepType
 * @text Тип шага
 * @desc Тип шага квеста (определяет автоматический подсчет)
 * @type select
 * @option Обычный шаг
 * @value simple
 * @option Собрать предметы
 * @value collect_items
 * @option Убить врагов
 * @value kill_enemies
 * @option Поговорить с NPC
 * @value talk_to_npc
 * @default simple
 *
 * @param targetItemId
 * @text ID предмета
 * @desc ID предмета для сбора (только для типа "Собрать предметы")
 * @type item
 * @default 0
 *
 * @param targetEnemyId
 * @text ID врага
 * @desc ID врага для убийства (только для типа "Убить врагов")
 * @type enemy
 * @default 0
 *
 * @param targetNpcName
 * @text Имя NPC
 * @desc Имя NPC, с которым нужно поговорить (для игрока)
 * @type text
 * @default
 *
 * @param targetCount
 * @text Требуемое количество
 * @desc Сколько предметов собрать или врагов убить
 * @type number
 * @min 1
 * @default 1
 *
 * @default 1
 *
 * @param fightTroopId
 * @text ID Отряда (Битва)
 * @desc ID отряда врагов для сражения после диалога (0 = нет битвы)
 * @type troop
 * @default 0
 *
 * @param dialogStart
 * @text Диалог (начало)
 * @desc Что говорит NPC при начале этого шага
 * @type struct<DialogMessage>[]
 * @default []
 *
 * @param dialogProgress
 * @text Диалог (в процессе)
 * @desc Что говорит NPC пока шаг не выполнен. Используйте {current}/{target} для прогресса
 * @type struct<DialogMessage>[]
 * @default []
 *
 * @param dialogComplete
 * @text Диалог (выполнено)
 * @desc Что говорит NPC когда шаг выполнен
 * @type struct<DialogMessage>[]
 * @default []
 */

/*~struct~RewardItem:
 * @param itemId
 * @text ID предмета
 * @desc ID предмета из базы данных
 * @type item
 * @default 1
 *
 * @param amount
 * @text Количество
 * @desc Количество предметов
 * @type number
 * @min 1
 * @default 1
 */

/*~struct~DialogMessage:
 * @param speaker
 * @text Говорящий
 * @desc Кто говорит (NPC или Игрок)
 * @type select
 * @option NPC (Квестовый)
 * @value npc
 * @option Игрок (Лидер)
 * @value player
 * @option Другое (Custom)
 * @value custom
 * @default npc
 *
 * @param text
 * @text Текст
 * @desc Текст сообщения
 * @type note
 * @default "Привет!"
 *
 * @param faceName
 * @text Лицо (Файл)
 * @desc Файл лица (если выбрано Custom). Оставьте пустым для NPC/Player.
 * @type file
 * @dir img/faces
 * @default
 *
 * @param faceIndex
 * @text Лицо (Индекс)
 * @desc Индекс лица (0-7)
 * @type number
 * @min 0
 * @max 7
 * @default 0
 */

var $dataQuests = null;
var $gameQuests = null;
var $gameQuestEvents = null;

(function () {
    'use strict';

    // Параметры плагина
    var parameters = PluginManager.parameters('ACTPO_QuestJournal');
    var hudPosX = String(parameters['HUD Position X'] || 'Graphics.boxWidth - 320');
    var hudPosY = Number(parameters['HUD Position Y'] || 10);
    var hudWidth = Number(parameters['HUD Width'] || 300);
    var maxVisibleQuests = Number(parameters['Max Visible Quests'] || 3);
    var showHUDDefault = String(parameters['Show HUD by Default'] || 'true') === 'true';
    var hudBgOpacity = Number(parameters['HUD Background Opacity'] || 200);
    var hudTextColor = Number(parameters['HUD Text Color'] || 0);
    var questCompleteColor = Number(parameters['Quest Complete Color'] || 3);
    var menuCommandName = String(parameters['Menu Command Name'] || 'Квесты');

    // Парсинг квестов из параметров
    var questsParam = JSON.parse(parameters['Quests'] || '[]');

    //=============================================================================
    // Парсинг данных квестов из параметров
    //=============================================================================

    function parseDialog(rawDialog) {
        if (!rawDialog) return [];
        try {
            // Если это уже массив, не парсим его целиком
            var parsed = (typeof rawDialog === 'string') ? JSON.parse(rawDialog) : rawDialog;

            // Backward compatibility: if it's just a string, wrap it in a default dialog object
            if (typeof parsed === 'string') {
                return [{
                    speaker: 'npc',
                    text: parsed,
                    faceName: '',
                    faceIndex: 0
                }];
            }
            // If it's an array (list of structs or objects)
            if (Array.isArray(parsed)) {
                return parsed.map(function (msgData) {
                    // Если элемент - строка (из RPG Maker), парсим её. Если объект - оставляем как есть.
                    var msg = (typeof msgData === 'string') ? JSON.parse(msgData) : msgData;
                    var text = msg.text;
                    // Если текст внутри тоже JSON-строка (бывает в MV), парсим и его
                    try {
                        if (typeof text === 'string' && (text.startsWith('"') || text.startsWith('{'))) {
                            text = JSON.parse(text);
                        }
                    } catch (e) { }

                    return {
                        speaker: msg.speaker || 'npc',
                        text: text || "",
                        faceName: msg.faceName || '',
                        faceIndex: Number(msg.faceIndex) || 0
                    };
                });
            }
            return [];
        } catch (e) {
            console.error("Failed to parse dialog:", e);
            return [];
        }
    }

    function parseQuestData() {
        var questsData = {};

        questsParam.forEach(function (questStr) {
            var quest = JSON.parse(questStr);
            var questId = quest.questId;

            // Парсим шаги
            var steps = [];
            if (quest.steps) {
                var stepsArray = JSON.parse(quest.steps);
                stepsArray.forEach(function (stepStr, index) {
                    var step = JSON.parse(stepStr);
                    steps.push({
                        number: index + 1,
                        title: step.title,
                        description: JSON.parse(step.description || '""'),
                        type: step.stepType || 'simple',
                        targetItemId: Number(step.targetItemId) || 0,
                        targetEnemyId: Number(step.targetEnemyId) || 0,
                        targetNpcName: step.targetNpcName || '',
                        targetCount: Number(step.targetCount) || 1,
                        fightTroopId: Number(step.fightTroopId) || 0,
                        currentCount: 0,
                        dialogStart: parseDialog(step.dialogStart),
                        dialogProgress: parseDialog(step.dialogProgress || JSON.stringify("Продолжай выполнять задание!")),
                        dialogComplete: parseDialog(step.dialogComplete || JSON.stringify("Отлично! Задание выполнено!")),
                        next_step: index + 1 < stepsArray.length ? index + 2 : 'complete'
                    });
                });
            }

            // Парсим награды
            var rewardItems = [];
            if (quest.rewardItems) {
                var itemsArray = JSON.parse(quest.rewardItems);
                itemsArray.forEach(function (itemStr) {
                    var item = JSON.parse(itemStr);
                    rewardItems.push({
                        id: Number(item.itemId),
                        amount: Number(item.amount) || 1
                    });
                });
            }

            // Создаем объект квеста
            questsData[questId] = {
                id: questId,
                title: quest.title,
                description: JSON.parse(quest.description || '""'),
                category: quest.category || 'main',
                variableId: Number(quest.variableId) || 0,
                questNpcId: Number(quest.questNpcId) || 0,
                questNpcMapId: Number(quest.questNpcMapId) || 0,
                requiredSwitchId: Number(quest.requiredSwitchId) || 0,
                reqEventId: Number(quest.reqEventId) || 0,
                reqMapId: Number(quest.reqMapId) || 0,
                reqSelfSwitch: quest.reqSelfSwitch || 'A',
                dialogReward: parseDialog(quest.dialogReward || JSON.stringify("Спасибо за помощь! Вот награда!")),
                npcFaceName: quest.npcFaceName || '',
                npcFaceIndex: Number(quest.npcFaceIndex) || 0,
                steps: steps,
                rewards: {
                    gold: Number(quest.rewardGold) || 0,
                    exp: Number(quest.rewardExp) || 0,
                    items: rewardItems
                },
                progress: {}
            };
        });

        return questsData;
    }

    //=============================================================================
    // DataManager
    //=============================================================================

    var _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function () {
        _DataManager_createGameObjects.call(this);
        $gameQuests = new Game_Quests();
        $gameQuestEvents = new Game_QuestEventManager();
    };

    var _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function () {
        var contents = _DataManager_makeSaveContents.call(this);
        contents.quests = $gameQuests;
        contents.questEvents = $gameQuestEvents;
        return contents;
    };

    var _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManager_extractSaveContents.call(this, contents);
        $gameQuests = contents.quests || new Game_Quests();
        $gameQuestEvents = contents.questEvents || new Game_QuestEventManager();
    };

    // Глобальный флаг загрузки данных квестов
    DataManager._questDataLoaded = false;

    // Загрузка данных квестов
    DataManager.loadQuestData = function () {
        // 1. Загружаем из параметров плагина (Базовый)
        $dataQuests = parseQuestData();

        // 2. Проверяем упрощенную конфигурацию (ACTPO_QuestConfig.js)
        if (window.ACTPO_SimpleConfig) {
            console.log("ACTPO: Loading Simple Config...");
            for (var qId in window.ACTPO_SimpleConfig) {
                var sQuest = window.ACTPO_SimpleConfig[qId];

                // Авто-генерация шагов
                var fullSteps = [];
                if (Array.isArray(sQuest.steps)) {
                    sQuest.steps.forEach(function (stepData, idx) {
                        if (typeof stepData === 'string') {
                            // Обычная строка - простой шаг
                            fullSteps.push({
                                number: idx + 1,
                                title: "Шаг " + (idx + 1),
                                description: stepData,
                                type: 'simple',
                                currentCount: 0,
                                targetCount: 1,
                                variableId: 0
                            });
                        } else {
                            // Объект - сложный шаг (с диалогами, счетчиками и т.д.)
                            fullSteps.push({
                                number: idx + 1,
                                title: stepData.title || ("Шаг " + (idx + 1)),
                                description: stepData.description || "",
                                type: stepData.type || 'simple',
                                targetItemId: Number(stepData.targetItemId) || 0,
                                targetEnemyId: Number(stepData.targetEnemyId) || 0,
                                targetCount: Number(stepData.targetCount) || 1,
                                dialogStart: parseDialog(stepData.dialogStart),
                                dialogProgress: parseDialog(stepData.dialogProgress),
                                dialogComplete: parseDialog(stepData.dialogComplete),
                                currentCount: 0
                            });
                        }
                    });
                }

                // Создаем полноценный объект квеста
                var fullQuest = {
                    id: qId,
                    title: sQuest.title || "Quest " + qId,
                    description: sQuest.description || "",
                    category: sQuest.category || 'main',
                    variableId: sQuest.variableId || 0,
                    npcFaceName: '', npcFaceIndex: 0,
                    steps: fullSteps,
                    rewards: sQuest.rewards || { gold: 0, exp: 0, items: [] },
                    progress: {}
                };

                // Перезаписываем или добавляем
                $dataQuests[qId] = fullQuest;
            }
        }

        // Помечаем как незагруженные пока идет запрос (для совместимости)
        this._questDataLoaded = false;

        // 3. Также пытаемся загрузить из JSON файла (если есть)
        // Используем fs если мы в NW.js (RPG Maker), чтобы избежать ошибок 404 в консоли
        var externalLoaded = false;
        var useXhr = true;

        if (typeof require === 'function') {
            useXhr = false; // В среде NW.js используем только прямую проверку файлов
            try {
                var fs = require('fs');
                var path = require('path');
                var base = path.dirname(process.mainModule.filename);
                var filePath = path.join(base, 'js/plugins/quests/quests_data.json');

                if (fs.existsSync(filePath)) {
                    var externalQuests = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    Object.assign($dataQuests, externalQuests);
                    externalLoaded = true;
                }
            } catch (e) {
                console.warn("ACTPO: Could not load quests_data.json via fs:", e);
            }
            // В NW.js помечаем как "загружено" сразу, независимо от успеха (так как XHR не будет)
            this._questDataLoaded = true;
        }

        if (useXhr) {
            var xhr = new XMLHttpRequest();
            var url = 'js/plugins/quests/quests_data.json';
            xhr.open('GET', url);
            xhr.overrideMimeType('application/json');

            var self = this;
            xhr.onload = function () {
                if (xhr.status < 400) {
                    try {
                        var externalQuests = JSON.parse(xhr.responseText);
                        Object.assign($dataQuests, externalQuests);
                    } catch (e) {
                        console.error("Failed to parse quests_data.json:", e);
                    }
                }
                self._questDataLoaded = true;
            };
            xhr.onerror = function () {
                self._questDataLoaded = true;
            };
            xhr.send();
        }
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;

        if (!$dataQuests) {
            DataManager.loadQuestData();
            return false;
        }

        // Ждем окончания асинхронной загрузки
        if (!this._questDataLoaded) {
            return false;
        }

        return true;
    };

    //=============================================================================
    // Game_Quests
    //=============================================================================

    function Game_Quests() {
        this.initialize.apply(this, arguments);
    }
    window.Game_Quests = Game_Quests;

    Game_Quests.prototype.initialize = function () {
        this._quests = {};
        this._activeQuests = [];
        this._completedQuests = [];
        this._failedQuests = [];
        this._hudVisible = showHUDDefault;
        this._hudExpanded = true;
    };

    Game_Quests.prototype.addQuest = function (questId) {
        if (!$dataQuests || !$dataQuests[questId]) {
            console.warn('Quest not found: ' + questId);
            return;
        }

        if (!this._quests[questId]) {
            this._quests[questId] = {
                id: questId,
                data: $dataQuests[questId],
                currentStep: 0,
                status: 'available',
                startTime: Date.now()
            };
        }
    };

    Game_Quests.prototype.activateQuest = function (questId) {
        if (this._quests[questId]) {
            this._quests[questId].status = 'active';
            if (!this._activeQuests.includes(questId)) {
                this._activeQuests.push(questId);
            }
            this.setStep(questId, 1);
            if ($gameQuestEvents && $gameMap) {
                $gameQuestEvents.initializeMapEvents();
            }
        }
    };

    Game_Quests.prototype.setStep = function (questId, stepNumber) {
        if (this._quests[questId]) {
            this._quests[questId].currentStep = stepNumber;
            // Auto-update variable
            var varId = this._quests[questId].data.variableId;
            if (varId > 0) {
                $gameVariables.setValue(varId, stepNumber);
            }
        }
    };

    Game_Quests.prototype.nextStep = function (questId) {
        if (this._quests[questId]) {
            var quest = this._quests[questId];
            var maxSteps = quest.data.steps ? quest.data.steps.length : 0;
            if (quest.currentStep < maxSteps) {
                this.setStep(questId, quest.currentStep + 1);
            } else {
                this.completeQuest(questId);
            }
            if ($gameQuestEvents && $gameMap) {
                $gameQuestEvents.initializeMapEvents();
            }
        }
    };

    //=============================================================================
    // Game_Variables Override - Bi-directional Binding
    //=============================================================================

    var _Game_Variables_setValue = Game_Variables.prototype.setValue;
    Game_Variables.prototype.setValue = function (variableId, value) {
        _Game_Variables_setValue.call(this, variableId, value);

        // Check if this variable is linked to any quest
        if ($dataQuests && $gameQuests) {
            for (var questId in $dataQuests) {
                var questData = $dataQuests[questId];
                if (questData.variableId === variableId) {
                    // Variable matches quest! Update quest step.
                    // Only update if quest is active or available (auto-start logic can be added here)
                    var quest = $gameQuests.getQuest(questId);

                    // If quest is not started yet, but variable > 0, maybe we should start it?
                    // For now, adhere to manual start or ensure setStep handles it.

                    if (!quest && value > 0) {
                        // Auto-start quest if variable changes to > 0
                        $gameQuests.addQuest(questId);
                        $gameQuests.activateQuest(questId);
                        quest = $gameQuests.getQuest(questId);
                    }

                    if (quest && quest.status !== 'completed' && quest.status !== 'failed') {
                        // Avoid infinite loop if setStep updates variable again
                        if (quest.currentStep !== value) {
                            $gameQuests.setStep(questId, value);
                        }
                    }
                }
            }
        }
    };

    Game_Quests.prototype.completeQuest = function (questId) {
        if (this._quests[questId]) {
            this._quests[questId].status = 'completed';
            this._quests[questId].completeTime = Date.now();

            var index = this._activeQuests.indexOf(questId);
            if (index > -1) {
                this._activeQuests.splice(index, 1);
            }

            if (!this._completedQuests.includes(questId)) {
                this._completedQuests.push(questId);
            }
        }
    };

    Game_Quests.prototype.failQuest = function (questId) {
        if (this._quests[questId]) {
            this._quests[questId].status = 'failed';

            var index = this._activeQuests.indexOf(questId);
            if (index > -1) {
                this._activeQuests.splice(index, 1);
            }

            if (!this._failedQuests.includes(questId)) {
                this._failedQuests.push(questId);
            }
        }
    };

    Game_Quests.prototype.removeQuest = function (questId) {
        delete this._quests[questId];

        var index = this._activeQuests.indexOf(questId);
        if (index > -1) this._activeQuests.splice(index, 1);

        index = this._completedQuests.indexOf(questId);
        if (index > -1) this._completedQuests.splice(index, 1);

        index = this._failedQuests.indexOf(questId);
        if (index > -1) this._failedQuests.splice(index, 1);
    };

    Game_Quests.prototype.giveRewards = function (questId) {
        if (!this._quests[questId]) return;

        var rewards = this._quests[questId].data.rewards;
        if (!rewards) return;

        if (rewards.gold) {
            $gameParty.gainGold(rewards.gold);
        }

        if (rewards.exp) {
            $gameParty.allMembers().forEach(function (actor) {
                actor.gainExp(rewards.exp);
            });
        }

        if (rewards.items) {
            rewards.items.forEach(function (item) {
                $gameParty.gainItem($dataItems[item.id], item.amount);
            });
        }
    };

    Game_Quests.prototype.getQuest = function (questId) {
        return this._quests[questId];
    };

    Game_Quests.prototype.getActiveQuests = function () {
        return this._activeQuests.map(function (id) {
            return this._quests[id];
        }, this);
    };

    Game_Quests.prototype.getCompletedQuests = function () {
        return this._completedQuests.map(function (id) {
            return this._quests[id];
        }, this);
    };

    Game_Quests.prototype.getFailedQuests = function () {
        return this._failedQuests.map(function (id) {
            return this._quests[id];
        }, this);
    };

    Game_Quests.prototype.isHudVisible = function () {
        return this._hudVisible;
    };

    Game_Quests.prototype.showHud = function () {
        this._hudVisible = true;
    };

    Game_Quests.prototype.hideHud = function () {
        this._hudVisible = false;
    };

    Game_Quests.prototype.toggleHud = function () {
        this._hudVisible = !this._hudVisible;
    };

    //=============================================================================
    // Автоматические счетчики
    //=============================================================================

    Game_Quests.prototype.updateItemProgress = function () {
        // Обновляет прогресс для квестов типа collect_items
        this._activeQuests.forEach(function (questId) {
            var quest = this._quests[questId];
            var questData = $dataQuests[questId];
            if (!quest || !questData || !questData.steps) return;

            var currentStep = questData.steps[quest.currentStep - 1];
            if (!currentStep || currentStep.type !== 'collect_items') return;

            // Проверяем количество предметов в инвентаре
            var itemCount = $gameParty.numItems($dataItems[currentStep.targetItemId]);
            currentStep.currentCount = itemCount;

            // Проверяем достижение цели
            this.checkStepCompletion(questId);
        }, this);
    };

    Game_Quests.prototype.updateEnemyProgress = function (enemyId) {
        // Обновляет прогресс для квестов типа kill_enemies
        this._activeQuests.forEach(function (questId) {
            var quest = this._quests[questId];
            var questData = $dataQuests[questId];
            if (!quest || !questData || !questData.steps) return;

            var currentStep = questData.steps[quest.currentStep - 1];
            if (!currentStep || currentStep.type !== 'kill_enemies') return;

            // Проверяем соответствие врага
            if (currentStep.targetEnemyId === enemyId) {
                currentStep.currentCount = (currentStep.currentCount || 0) + 1;
                // console.log('[QUEST] Засчитано убийство! Враг:', enemyId, 'Прогресс:', currentStep.currentCount, '/', currentStep.targetCount);

                // Проверяем достижение цели
                this.checkStepCompletion(questId);
            }
        }, this);
    };

    Game_Quests.prototype.checkStepCompletion = function (questId) {
        // Проверяет выполнение текущего шага и автоматически переходит к следующему
        var quest = this._quests[questId];
        if (!quest || !quest.data.steps) return;

        var currentStep = quest.data.steps[quest.currentStep - 1];
        if (!currentStep) return;

        var isCompleted = false;

        switch (currentStep.type) {
            case 'collect_items':
            case 'kill_enemies':
                isCompleted = currentStep.currentCount >= currentStep.targetCount;
                break;
            case 'talk_to_npc':
            case 'simple':
                // Эти типы завершаются вручную через nextStep
                return;
        }

        if (isCompleted) {
            this.nextStep(questId);
            // Обновляем HUD после перехода на следующий шаг
            if (SceneManager._scene && SceneManager._scene._questHUD) {
                SceneManager._scene._questHUD.refresh();
            }
        }
    };

    Game_Quests.prototype.getCurrentStepData = function (questId) {
        // Возвращает данные текущего шага
        var quest = this._quests[questId];
        if (!quest || !quest.data.steps || quest.currentStep === 0) return null;

        return quest.data.steps[quest.currentStep - 1];
    };

    Game_Quests.prototype.getQuestByEvent = function (mapId, eventId) {
        // Находит квест по ID NPC и карте
        // Возвращает ID квеста или null
        for (var questId in $dataQuests) {
            var q = $dataQuests[questId];
            if (q.questNpcId === eventId) {
                // Если карта указана (не 0), проверяем совпадение
                if (q.questNpcMapId > 0) {
                    if (q.questNpcMapId === mapId) return questId;
                } else {
                    // Если карта не указана (0), считаем что подходит для любой карты (или текущей)
                    // Лучше использовать 0 как "любая", но для безопасности можно требовать совпадение, 
                    // если игрок хочет уникальных NPC.
                    // Для обратной совместимости: 0 = подходит.
                    return questId;
                }
            }
        }
        return null;
    };

    //=============================================================================
    // Game_QuestEventManager - Управление видимостью событий через комментарии
    //=============================================================================

    function Game_QuestEventManager() {
        this.initialize.apply(this, arguments);
    }
    window.Game_QuestEventManager = Game_QuestEventManager;

    Game_QuestEventManager.prototype.initialize = function () {
        this._hiddenEvents = {};
    };
    Game_QuestEventManager.prototype.isEventHidden = function (mapId, eventId) {
        if (!this._hiddenEvents[mapId]) return false;
        return this._hiddenEvents[mapId][eventId] === true;
    };

    Game_QuestEventManager.prototype.hideEvent = function (mapId, eventId) {
        if (!this._hiddenEvents[mapId]) this._hiddenEvents[mapId] = {};
        this._hiddenEvents[mapId][eventId] = true;
    };

    Game_QuestEventManager.prototype.showEvent = function (mapId, eventId) {
        if (!this._hiddenEvents[mapId]) return;
        delete this._hiddenEvents[mapId][eventId];
    };

    Game_QuestEventManager.prototype.parseEventComment = function (event) {
        if (!event) return null;

        // 1. Проверяем поле "Примечание" (Note)
        if (event.note) {
            var match = event.note.match(/<QuestEvent:\s*([^,]+),\s*(\d+)>/i);
            if (match) {
                return { questId: match[1].trim(), stepNumber: parseInt(match[2]) };
            }
        }

        // 2. Проверяем комментарии на первой странице (для совместимости)
        if (!event.pages || !event.pages[0]) return null;
        var list = event.pages[0].list;
        for (var i = 0; i < list.length; i++) {
            if (list[i].code === 108 || list[i].code === 408) {
                var match = list[i].parameters[0].match(/<QuestEvent:\s*([^,]+),\s*(\d+)>/i);
                if (match) {
                    return { questId: match[1].trim(), stepNumber: parseInt(match[2]) };
                }
            }
        }
        return null;
    };

    Game_QuestEventManager.prototype.initializeMapEvents = function () {
        if (!$gameMap || !$dataMap || !$gameQuests) return;
        var mapId = $gameMap.mapId();
        // console.log('[EVENT MANAGER] Инициализация событий на карте', mapId);
        for (var i = 1; i < $dataMap.events.length; i++) {
            var event = $dataMap.events[i];
            if (!event) continue;
            var tag = this.parseEventComment(event);
            if (tag) {
                // Всегда сначала скрываем
                this.hideEvent(mapId, i);

                var quest = $gameQuests.getQuest(tag.questId);
                var shouldShow = false;

                if (quest) {
                    if (quest.status === 'active' && quest.currentStep === tag.stepNumber) {
                        shouldShow = true;
                    }
                    console.log('[ACTPO QUEST] Событие ID:' + i + ' ждет квест: ' + tag.questId + ' шаг: ' + tag.stepNumber + '. Текущий: ' + quest.status + ', шаг: ' + quest.currentStep + '. Показать: ' + shouldShow);
                } else {
                    console.log('[ACTPO QUEST] Событие ID:' + i + ' ждет квест: ' + tag.questId + ' (КВЕСТ НЕ НАЙДЕН/НЕ ВЗЯТ)');
                }

                if (shouldShow) {
                    this.showEvent(mapId, i);
                }

                var gameEvent = $gameMap.event(i);
                if (gameEvent) {
                    gameEvent.refresh();
                }
            }
        }
        $gameMap.requestRefresh();
    };



    //=============================================================================
    // Game_QuestNPC - Автоматическое управление NPC
    //=============================================================================

    function Game_QuestNPC() {
        this.initialize.apply(this, arguments);
    }
    window.Game_QuestNPC = Game_QuestNPC;

    Game_QuestNPC.prototype.initialize = function (eventId, questId) {
        this._eventId = eventId;
        this._questId = questId;
        this._list = []; // Список команд событий
    };

    Game_QuestNPC.prototype.onTalk = function () {
        var quest = $gameQuests.getQuest(this._questId);
        var questData = $dataQuests[this._questId];

        if (!questData) return;

        // Квест не начат - первый разговор
        if (!quest) {
            $gameQuests.addQuest(this._questId);
            $gameQuests.activateQuest(this._questId);
            var firstStep = questData.steps[0];
            if (firstStep && firstStep.dialogStart) {
                this.generateEventCommands(firstStep.dialogStart);
            }
            this.runEventCommands();
            return; // ВАЖНО: выходим, чтобы не показывать другие диалоги
        }

        // Квест завершен
        if (quest.status === 'completed') {
            this.generateEventCommands([{ speaker: 'npc', text: 'Квест уже завершен!', faceName: '', faceIndex: 0 }]);
            this.runEventCommands();
            return;
        }

        var currentStep = quest.data.steps[quest.currentStep - 1];
        if (!currentStep) return;

        // ВАЖНО: Обновляем прогресс перед проверкой
        if (currentStep.type === 'collect_items') {
            // console.log('[QUEST NPC] Обновляем прогресс предметов для', this._questId);
            $gameQuests.updateItemProgress();
            // Перезагружаем данные шага после обновления
            quest = $gameQuests.getQuest(this._questId);
            currentStep = quest.data.steps[quest.currentStep - 1];
        }

        // console.log('[QUEST NPC] Проверка шага:', currentStep.title, 'Прогресс:', currentStep.currentCount, '/', currentStep.targetCount);

        // Проверяем выполнение шага
        var isComplete = this.isStepComplete(currentStep);

        if (isComplete) {
            // Шаг выполнен
            if (currentStep.dialogComplete) {
                this.generateEventCommands(currentStep.dialogComplete);
            }

            // Проверяем, есть ли еще шаги ПОСЛЕ текущего
            if (quest.currentStep < quest.data.steps.length) {
                // Есть еще шаги - переходим к следующему
                // Добавляем скрипт для перехода на следующий шаг
                this.addPluginCommand('ACTPO_Quest', ['nextStep', this._questId]);

                // Показываем диалог следующего шага
                var nextStep = quest.data.steps[quest.currentStep]; // quest.currentStep уже указывает на следующий (индекс + 1, но массив 0-based)
                // Внимание: nextStep еще не вызван физически, так как это очередь команд.
                // НО! Мы уже знаем структуру.

                // ПРОБЛЕМА: nextStep меняет состояние немедленно, а диалог идет последовательно.
                // РЕШЕНИЕ: Мы генерируем команды. 
                // Сначала диалог завершения текущего шага.
                // Потом команда nextStep.
                // Потом диалог начала следующего шага.

                if (nextStep && nextStep.dialogStart) {
                    this.generateEventCommands(nextStep.dialogStart);
                }
            } else {
                // Это был ПОСЛЕДНИЙ шаг - завершаем квест и выдаем награды
                if (questData.dialogReward) {
                    this.generateEventCommands(questData.dialogReward);
                }
                this.addPluginCommand('ACTPO_Quest', ['finish', this._questId]);
            }
        } else {
            // Шаг не выполнен - показываем прогресс
            // Генерируем временный диалог для прогресса
            var dialogTexts = currentStep.dialogProgress || [{ speaker: 'npc', text: 'Продолжай выполнять задание!', faceName: '', faceIndex: 0 }];

            // Если это массив строк или объектов, обрабатываем замену переменных
            var processedDialog = JSON.parse(JSON.stringify(dialogTexts)); // Clone

            processedDialog.forEach(function (msg) {
                if (msg.text) {
                    msg.text = msg.text.replace('{current}', currentStep.currentCount || 0);
                    msg.text = msg.text.replace('{target}', currentStep.targetCount || 1);
                }
            });

            this.generateEventCommands(processedDialog);

            // Если настроена битва
            if (currentStep.fightTroopId > 0) {
                // Command 301: Battle Processing [TroopID, CanEscape, CanLose]
                this._list.push({ code: 301, indent: 0, parameters: [currentStep.fightTroopId, false, false] });
            }
        }

        this.runEventCommands();
    };

    Game_QuestNPC.prototype.isStepComplete = function (step) {
        switch (step.type) {
            case 'collect_items':
            case 'kill_enemies':
                return (step.currentCount || 0) >= step.targetCount;
            case 'talk_to_npc':
                // Автоматически завершается при разговоре с квестовым NPC
                return true;
            case 'simple':
                return false; // Требует ручного nextStep
            default:
                return false;
        }
    };

    Game_QuestNPC.prototype.generateEventCommands = function (dialogMessages) {
        if (!dialogMessages || !Array.isArray(dialogMessages)) return;

        var questData = $dataQuests[this._questId];
        var defaultNpcFace = questData ? { name: questData.npcFaceName, index: questData.npcFaceIndex } : { name: '', index: 0 };

        for (var i = 0; i < dialogMessages.length; i++) {
            var msg = dialogMessages[i];
            var faceName = msg.faceName;
            var faceIndex = msg.faceIndex;

            // Определяем лицо
            if (msg.speaker === 'npc') {
                faceName = defaultNpcFace.name;
                faceIndex = defaultNpcFace.index;
            } else if (msg.speaker === 'player') {
                faceName = $gameParty.leader().faceName();
                faceIndex = $gameParty.leader().faceIndex();
            }

            // Command 101: Show Text [FaceName, FaceIndex, Background, PositionType]
            this._list.push({ code: 101, indent: 0, parameters: [faceName, faceIndex, 0, 2] });

            // Command 401: Text Data
            this._list.push({ code: 401, indent: 0, parameters: [msg.text] });
        }
    };

    Game_QuestNPC.prototype.addPluginCommand = function (command, args) {
        // Command 356: Plugin Command (MV) or Script
        // Using script for easier argument handling: 
        // Command 355: Script
        // "PluginManager.callCommand(self, 'ACTPO_Quest', args)" - no, simpler to use PluginCommand text
        var argsStr = args.join(' ');
        this._list.push({ code: 356, indent: 0, parameters: [command + ' ' + argsStr] });
    };

    Game_QuestNPC.prototype.runEventCommands = function () {
        if (this._list.length === 0) return;

        // Command 0: End of List
        this._list.push({ code: 0, indent: 0, parameters: [] });

        // Используем главный интерпретатор карты
        // ПРИМЕЧАНИЕ: Это прервет текущие события, если они выполняются, но для диалога это нормально (обычно)
        if ($gameMap && $gameMap._interpreter) {
            $gameMap._interpreter.setup(this._list, this._eventId);
            this._list = [];
        }
    };

    //=============================================================================
    // Game_Interpreter
    //=============================================================================

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'ACTPO_Quest') {
            var action = args[0];
            var questId = args[1];
            switch (action) {
                case 'start':
                    $gameQuests.addQuest(questId);
                    $gameQuests.activateQuest(questId);
                    break;
                case 'finish':
                    $gameQuests.completeQuest(questId);
                    $gameQuests.giveRewards(questId);
                    break;
                case 'add':
                    $gameQuests.addQuest(questId);
                    break;
                case 'activate':
                    $gameQuests.activateQuest(questId);
                    break;
                case 'setStep':
                    var step = Number(args[2]);
                    $gameQuests.setStep(questId, step);
                    break;
                case 'nextStep':
                    $gameQuests.nextStep(questId);
                    break;
                case 'complete':
                    $gameQuests.completeQuest(questId);
                    break;
                case 'giveRewards':
                    $gameQuests.giveRewards(questId);
                    break;
            }
        }
    };

    //=============================================================================

    //=============================================================================
    // Game_Enemy - автоматический подсчет убийств
    //=============================================================================

    var _Game_Enemy_die = Game_Enemy.prototype.die;
    Game_Enemy.prototype.die = function () {
        _Game_Enemy_die.call(this);
        if ($gameQuests && !this._questCounted) {
            $gameQuests.updateEnemyProgress(this.enemyId());
            this._questCounted = true;
        }
    };

    var _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function (item, amount, includeEquip) {
        _Game_Party_gainItem.call(this, item, amount, includeEquip);

        // Обновляем прогресс квестов при изменении инвентаря
        if ($gameQuests && item && DataManager.isItem(item)) {
            $gameQuests.updateItemProgress();
        }
    };

    //=============================================================================
    // BattleManager - автоматический подсчет убийств врагов
    //=============================================================================

    var _BattleManager_processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function () {
        // Подсчитываем убитых врагов для квестов
        if ($gameQuests) {
            $gameTroop.deadMembers().forEach(function (enemy) {
                if (enemy.enemyId) {
                    $gameQuests.updateEnemyProgress(enemy.enemyId());
                }
            });
        }

        _BattleManager_processVictory.call(this);
    };

    //=============================================================================
    // Game_Event - перехват взаимодействия с квестовыми NPC
    //=============================================================================

    var _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function (mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        if ($gameQuestEvents && $dataMap && $dataMap.events[eventId]) {
            var tag = $gameQuestEvents.parseEventComment($dataMap.events[eventId]);
            if (tag) {
                var quest = $gameQuests ? $gameQuests.getQuest(tag.questId) : null;
                if (!quest || quest.status !== 'active' || quest.currentStep !== tag.stepNumber) {
                    this._erased = true;
                }
            }
        }
    };

    var _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function () {
        _Game_Event_refresh.call(this);
        if ($gameQuestEvents && $gameMap && $dataMap && $dataMap.events[this._eventId]) {
            var tag = $gameQuestEvents.parseEventComment($dataMap.events[this._eventId]);
            if (tag) {
                if ($gameQuestEvents.isEventHidden($gameMap.mapId(), this._eventId)) {
                    this._erased = true;
                } else {
                    this._erased = false;
                }
            }
        }
    };

    var _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function () {
        if (!$gameQuests || !$dataQuests) {
            _Game_Event_start.call(this);
            return;
        }

        // Проверяем, является ли это событие квестовым NPC
        var questId = $gameQuests.getQuestByEvent(this._mapId, this._eventId);

        // [NO STRESS] Проверка тега в заметке
        if (!questId && this.event().note) {
            var match = this.event().note.match(/<QuestNPC:\s*([^>]+)>/i);
            if (match) {
                questId = match[1].trim();
            }
        }

        if (questId) {
            // Проверяем требование переключателя
            var questData = $dataQuests[questId];
            if (questData && questData.requiredSwitchId > 0) {
                if (!$gameSwitches.value(questData.requiredSwitchId)) {
                    // Переключатель выключен - квест недоступен
                    _Game_Event_start.call(this);
                    return;
                }
            }

            // Проверяем требование завершения события (Self Switch)
            if (questData && questData.reqEventId > 0) {
                var reqMapId = questData.reqMapId > 0 ? questData.reqMapId : this._mapId;
                var reqKey = [reqMapId, questData.reqEventId, questData.reqSelfSwitch || 'A'];
                if ($gameSelfSwitches.value(reqKey) !== true) {
                    // Self Switch выключен - событие не прошло - квест недоступен
                    _Game_Event_start.call(this);
                    return;
                }
            }

            // Это квестовый NPC - обрабатываем автоматически
            var questNpc = new Game_QuestNPC(this._eventId, questId);
            questNpc.onTalk();
            return; // Не запускаем обычное событие
        }

        // Обычное событие
        _Game_Event_start.call(this);
    };

    // Обновление иконки квеста
    var _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function () {
        _Game_Event_update.call(this);
        this.updateQuestIcon();
    };

    Game_Event.prototype.updateQuestIcon = function () {
        if (!$gameQuests || !$dataQuests) return;

        // Оптимизация: не проверять каждый кадр, а только раз в 60 кадров или при обновлении
        if (Graphics.frameCount % 20 !== 0) return;

        var questId = $gameQuests.getQuestByEvent(this._mapId, this._eventId);
        this._questIconIndex = 0;

        if (questId) {
            var quest = $gameQuests.getQuest(questId);
            var questData = $dataQuests[questId];

            if (!quest) {
                // Квест доступен (еще не взят)
                // Проверяем свитч
                if (questData.requiredSwitchId > 0 && !$gameSwitches.value(questData.requiredSwitchId)) {
                    this._questIconIndex = 0; // Скрываем, если требование не выполнено
                }
                // Проверяем Event Self Switch
                else if (questData.reqEventId > 0) {
                    var reqMapId = questData.reqMapId > 0 ? questData.reqMapId : this._mapId;
                    var reqKey = [reqMapId, questData.reqEventId, questData.reqSelfSwitch || 'A'];
                    if ($gameSelfSwitches.value(reqKey) !== true) {
                        this._questIconIndex = 0;
                    } else {
                        this._questIconIndex = 163; // Exclamation ! (Available)
                    }
                }
                else {
                    this._questIconIndex = 163; // Exclamation ! (Available)
                }
            } else {
                if (quest.status === 'active') {
                    // Квест активен
                    var currentStep = quest.data.steps[quest.currentStep - 1];
                    // Если тип "Поговорить с NPC" и цель этот NPC - показываем ?
                    // (Пока просто покажем ... для всех активных)
                    if (currentStep && currentStep.type === 'talk_to_npc' && currentStep.targetNpcName) {
                        // Если это Тот Самый NPC (сложно проверить, имя не уникально, но если это NPC квеста)
                        // Показуем ? (Question)
                        this._questIconIndex = 164; // Question ? (Active/Talk)
                    } else {
                        this._questIconIndex = 0; // Или 165 (...)
                    }

                    // Если шаг завершен и готов к переходу?
                } else if (quest.status === 'completed') {
                    // Квест завершен
                    this._questIconIndex = 0;
                }
            }

            // Проверка на сдачу квеста
            if (quest && quest.status === 'active') {
                // Последний шаг или проверка условий
                // Логика может быть сложнее
            }
        }
    };

    Game_Event.prototype.questIconIndex = function () {
        return this._questIconIndex || 0;
    };


    //=============================================================================
    // Sprite_Character - Отрисовка иконки квеста
    //=============================================================================

    var _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function () {
        _Sprite_Character_update.call(this);
        this.updateQuestIcon();
    };

    Sprite_Character.prototype.updateQuestIcon = function () {
        if (!this._character || !(this._character instanceof Game_Event)) return;

        var iconIndex = this._character.questIconIndex();

        if (iconIndex > 0) {
            if (!this._questIconSprite) {
                this._questIconSprite = new Sprite();
                this._questIconSprite.anchor.x = 0.5;
                this._questIconSprite.anchor.y = 1;
                this._questIconSprite.y = -this.patternHeight(); // Над головой
                this.addChild(this._questIconSprite);
            }

            // Если иконка изменилась
            if (this._questIconSprite._iconIndex !== iconIndex) {
                this._questIconSprite.bitmap = ImageManager.loadSystem('IconSet');
                var pw = Window_Base._iconWidth;
                var ph = Window_Base._iconHeight;
                var sx = iconIndex % 16 * pw;
                var sy = Math.floor(iconIndex / 16) * ph;
                this._questIconSprite.setFrame(sx, sy, pw, ph);
                this._questIconSprite._iconIndex = iconIndex;
                this._questIconSprite.visible = true;
            }
        } else {
            if (this._questIconSprite) {
                this._questIconSprite.visible = false;
            }
        }
    };

    //=============================================================================
    // Sprite_QuestButton
    //=============================================================================

    function Sprite_QuestButton() {
        this.initialize.apply(this, arguments);
    }

    Sprite_QuestButton.prototype = Object.create(Sprite_Base.prototype);
    Sprite_QuestButton.prototype.constructor = Sprite_QuestButton;

    Sprite_QuestButton.prototype.initialize = function (label, callback) {
        Sprite_Base.prototype.initialize.call(this);
        this._label = label;
        this._callback = callback;
        this.createBitmap();
        this._isTouchTriggered = false;
    };

    Sprite_QuestButton.prototype.createBitmap = function () {
        this.bitmap = new Bitmap(24, 24);
        this.bitmap.fillAll('rgba(0, 0, 0, 0.6)');
        this.bitmap.fontSize = 18;
        this.bitmap.drawText(this._label, 0, 0, 24, 24, 'center');
    };

    Sprite_QuestButton.prototype.update = function () {
        Sprite_Base.prototype.update.call(this);
        this.processTouch();
    };

    Sprite_QuestButton.prototype.processTouch = function () {
        if (this.visible) {
            if (TouchInput.isTriggered() && this.isButtonTouched()) {
                this._isTouchTriggered = true;
            }
            if (this._isTouchTriggered && !TouchInput.isPressed()) {
                if (this.isButtonTouched()) {
                    SoundManager.playCursor();
                    this._callback();
                }
                this._isTouchTriggered = false;
            }
        } else {
            this._isTouchTriggered = false;
        }
    };

    Sprite_QuestButton.prototype.isButtonTouched = function () {
        var tx = TouchInput.x;
        var ty = TouchInput.y;
        var node = this;
        var gx = 0;
        var gy = 0;
        while (node) {
            gx += node.x;
            gy += node.y;
            node = node.parent;
        }
        return tx >= gx && tx < gx + this.width && ty >= gy && ty < gy + this.height;
    };

    //=============================================================================
    // Window_QuestHUD
    //=============================================================================

    function Window_QuestHUD() {
        this.initialize.apply(this, arguments);
    }

    Window_QuestHUD.prototype = Object.create(Window_Base.prototype);
    Window_QuestHUD.prototype.constructor = Window_QuestHUD;

    Window_QuestHUD.prototype.initialize = function () {
        var x = eval(hudPosX);
        var y = hudPosY;
        var width = hudWidth;
        var height = this.fittingHeight(maxVisibleQuests * 3 + 1);
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.opacity = hudBgOpacity;
        // Restore state or default to true
        this._isExpanded = ($gameQuests && $gameQuests._hudExpanded !== undefined) ? $gameQuests._hudExpanded : true;
        this._originalHeight = height;

        this.createButtons();
        this.updateLayout();
        this.refresh();
    };

    Window_QuestHUD.prototype.createButtons = function () {
        var self = this;
        this._toggleBtn = new Sprite_QuestButton('Х', function () {
            self.toggleHUD();
        });
        // Position top-right of the window content
        // Fix position because addChild adds to container, but we want it relative to window
        this._toggleBtn.x = this.width - 36; // Padding
        this._toggleBtn.y = 10;
        this.addChild(this._toggleBtn);
    };

    Window_QuestHUD.prototype.toggleHUD = function () {
        this._isExpanded = !this._isExpanded;
        if ($gameQuests) {
            $gameQuests._hudExpanded = this._isExpanded;
        }
        this.updateLayout();
        this.refresh();
    };

    Window_QuestHUD.prototype.updateLayout = function () {
        if (this._isExpanded) {
            this.height = this._originalHeight;
            this._toggleBtn._label = 'Х'; // Close
            this.opacity = hudBgOpacity;
        } else {
            this.height = this.fittingHeight(1);
            this._toggleBtn._label = 'О'; // Open
            this.opacity = hudBgOpacity;
        }
        this._toggleBtn.createBitmap();
    };

    Window_QuestHUD.prototype.isAnyButtonTouched = function () {
        if (this._toggleBtn && this.visible && this._toggleBtn.isButtonTouched()) return true;
        return false;
    };

    Window_QuestHUD.prototype.standardPadding = function () {
        return 12;
    };

    Window_QuestHUD.prototype.refresh = function () {
        this.contents.clear();

        if (!$gameQuests || !$gameQuests.isHudVisible()) {
            this.visible = false;
            return;
        }
        this.visible = true;

        if (!this._isExpanded) {
            this.drawText('Квесты', 0, 0, this.contentsWidth() - 40);
            return;
        }

        var activeQuests = $gameQuests.getActiveQuests();
        if (activeQuests.length === 0) {
            // HUD visible but empty? 
            // Maybe hide it or show "No active quests"
            return;
        }

        this.drawText('Текущие квесты:', 0, 0, this.contentsWidth());

        var y = this.lineHeight();
        var displayQuests = activeQuests.slice(0, maxVisibleQuests);

        for (var i = 0; i < displayQuests.length; i++) {
            this.drawQuest(displayQuests[i], y);
            y += this.lineHeight() * 3;
        }
    };

    Window_QuestHUD.prototype.drawQuest = function (quest, y) {
        if (!quest || !quest.data) return;

        // Title with Icon (Active Quest Icon)
        this.changeTextColor(this.textColor(hudTextColor));
        this.drawIcon(163, 0, y + 2);
        this.drawText(quest.data.title, 36, y, this.contentsWidth() - 36);

        // Step
        if (quest.data.steps && quest.currentStep > 0) {
            var step = quest.data.steps[quest.currentStep - 1];
            if (step) {
                // Step Title
                this.changeTextColor(this.textColor(6)); // System/Yellowish
                // Small indentation for step
                var stepText = step.title;

                // Counters and NPC Name
                if (step.type === 'collect_items' || step.type === 'kill_enemies') {
                    this.changeTextColor(this.textColor(0)); // White
                    stepText += '  ' + (step.currentCount || 0) + '/' + step.targetCount;
                } else if (step.type === 'talk_to_npc' && step.targetNpcName) {
                    this.changeTextColor(this.textColor(14)); // Yellow for target
                    stepText += ' (Цель: ' + step.targetNpcName + ')';
                }

                this.drawText(stepText, 14, y + this.lineHeight(), this.contentsWidth() - 14);

                // Optional: Condensed Description or just leave it clean
                // Removing description from HUD to keep it cleaner, or making it very subtle
                /*
                if (step.description) {
                    this.changeTextColor(this.textColor(8));
                    this.drawText(step.description, 14, y + this.lineHeight() * 2, this.contentsWidth() - 14);
                }
                */
            }
        }

        this.resetTextColor();
    };

    Window_QuestHUD.prototype.update = function () {
        Window_Base.prototype.update.call(this);

        // Dynamic positioning check (ACTPO Fix)
        if (this._lastBoxWidth !== Graphics.boxWidth || this._lastBoxHeight !== Graphics.boxHeight) {
            this._lastBoxWidth = Graphics.boxWidth;
            this._lastBoxHeight = Graphics.boxHeight;

            try {
                var x = eval(hudPosX);
                var y = hudPosY;
                this.move(x, y, this.width, this.height);

                // Update toggle button position
                if (this._toggleBtn) {
                    this._toggleBtn.x = this.width - 36;
                    this._toggleBtn.y = 10;
                }
            } catch (e) {
                console.error("QuestHUD position update error:", e);
            }
        }

        // Update button visibility based on HUD visibility
        if (this._toggleBtn) {
            this._toggleBtn.visible = this.visible;
        }

        // Обновляем HUD каждые 10 кадров для отображения прогресса
        if (!this._refreshCounter) this._refreshCounter = 0;
        this._refreshCounter++;

        if (this._refreshCounter >= 10) {
            this.refresh();
            this._refreshCounter = 0;
        }
    };

    //=============================================================================
    // Scene_Map
    //=============================================================================

    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function () {
        _Scene_Map_createAllWindows.call(this);
        this.createQuestHUD();
    };

    Scene_Map.prototype.createQuestHUD = function () {
        this._questHUD = new Window_QuestHUD();
        this.addWindow(this._questHUD);
    };

    var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function () {
        if (this._questHUD && this._questHUD.isAnyButtonTouched()) {
            return;
        }
        _Scene_Map_processMapTouch.call(this);
    };

    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function () {
        _Scene_Map_onMapLoaded.call(this);
        if ($gameQuestEvents) {
            $gameQuestEvents.initializeMapEvents();
        }
    };

    //=============================================================================
    // Window_MenuCommand
    //=============================================================================

    var _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function () {
        _Window_MenuCommand_addOriginalCommands.call(this);
        this.addCommand(menuCommandName, 'quest', true);
    };

    //=============================================================================
    // Scene_Menu
    //=============================================================================

    var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function () {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler('quest', this.commandQuest.bind(this));
    };

    Scene_Menu.prototype.commandQuest = function () {
        SceneManager.push(Scene_Quest);
    };

    //=============================================================================
    // Scene_Quest
    //=============================================================================

    function Scene_Quest() {
        this.initialize.apply(this, arguments);
    }

    Scene_Quest.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Quest.prototype.constructor = Scene_Quest;

    Scene_Quest.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_Quest.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createCategoryWindow();
        this.createListWindow();
        this.createDetailsWindow();
    };

    Scene_Quest.prototype.createCategoryWindow = function () {
        this._categoryWindow = new Window_QuestCategory();
        this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._categoryWindow);
    };

    Scene_Quest.prototype.createListWindow = function () {
        var wy = this._categoryWindow.height;
        var wh = Graphics.boxHeight - wy - 200;
        this._listWindow = new Window_QuestList(0, wy, Graphics.boxWidth / 2, wh);
        this._listWindow.setHandler('ok', this.onListOk.bind(this));
        this._listWindow.setHandler('cancel', this.onListCancel.bind(this));
        this._categoryWindow.setListWindow(this._listWindow);
        this.addWindow(this._listWindow);
    };

    Scene_Quest.prototype.createDetailsWindow = function () {
        var wx = Graphics.boxWidth / 2;
        var wy = this._categoryWindow.height;
        var ww = Graphics.boxWidth / 2;
        var wh = Graphics.boxHeight - wy;
        this._detailsWindow = new Window_QuestDetails(wx, wy, ww, wh);
        this._listWindow.setDetailsWindow(this._detailsWindow);
        this.addWindow(this._detailsWindow);
    };

    Scene_Quest.prototype.onCategoryOk = function () {
        this._listWindow.activate();
        this._listWindow.selectLast();
    };

    Scene_Quest.prototype.onListOk = function () {
        this._listWindow.activate();
    };

    Scene_Quest.prototype.onListCancel = function () {
        this._listWindow.deselect();
        this._categoryWindow.activate();
    };

    //=============================================================================
    // Window_QuestCategory
    //=============================================================================

    function Window_QuestCategory() {
        this.initialize.apply(this, arguments);
    }

    Window_QuestCategory.prototype = Object.create(Window_HorzCommand.prototype);
    Window_QuestCategory.prototype.constructor = Window_QuestCategory;

    Window_QuestCategory.prototype.initialize = function () {
        Window_HorzCommand.prototype.initialize.call(this, 0, 0);
    };

    Window_QuestCategory.prototype.windowWidth = function () {
        return Graphics.boxWidth;
    };

    Window_QuestCategory.prototype.maxCols = function () {
        return 4;
    };

    Window_QuestCategory.prototype.makeCommandList = function () {
        this.addCommand('Основные', 'main');
        this.addCommand('Побочные', 'side');
        this.addCommand('Завершенные', 'completed');
        this.addCommand('Проваленные', 'failed');
    };

    Window_QuestCategory.prototype.setListWindow = function (listWindow) {
        this._listWindow = listWindow;
        this.update();
    };

    Window_QuestCategory.prototype.update = function () {
        Window_HorzCommand.prototype.update.call(this);
        if (this._listWindow) {
            this._listWindow.setCategory(this.currentSymbol());
        }
    };

    //=============================================================================
    // Window_QuestList
    //=============================================================================

    function Window_QuestList() {
        this.initialize.apply(this, arguments);
    }

    Window_QuestList.prototype = Object.create(Window_Selectable.prototype);
    Window_QuestList.prototype.constructor = Window_QuestList;

    Window_QuestList.prototype.initialize = function (x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this._category = 'active';
        this._data = [];
        this.refresh();
    };

    Window_QuestList.prototype.setCategory = function (category) {
        if (this._category !== category) {
            this._category = category;
            this.refresh();
            this.resetScroll();
        }
    };

    Window_QuestList.prototype.maxItems = function () {
        return this._data ? this._data.length : 0;
    };

    Window_QuestList.prototype.item = function () {
        return this._data[this.index()];
    };

    Window_QuestList.prototype.makeItemList = function () {
        this._data = [];

        if (!$gameQuests) return;

        switch (this._category) {
            case 'main':
                this._data = $gameQuests.getActiveQuests().filter(function (q) {
                    return !q.data.category || q.data.category === 'main';
                });
                break;
            case 'side':
                this._data = $gameQuests.getActiveQuests().filter(function (q) {
                    return q.data.category === 'side';
                });
                break;
            case 'completed':
                this._data = $gameQuests.getCompletedQuests();
                break;
            case 'failed':
                this._data = $gameQuests.getFailedQuests();
                break;
            default:
                // Fallback for 'active' or others
                this._data = $gameQuests.getActiveQuests();
                break;
        }
    };

    Window_QuestList.prototype.drawItem = function (index) {
        var quest = this._data[index];
        if (quest && quest.data) {
            var rect = this.itemRect(index);
            this.changePaintOpacity(true);

            // Icon handling
            var iconIndex = 0;
            switch (this._category) {
                case 'active': iconIndex = 163; break; // Exclamation
                case 'completed': iconIndex = 87; break; // Check
                case 'failed': iconIndex = 161; break; // Cross
            }
            // Use user-defined icons if available in future

            this.drawIcon(iconIndex, rect.x, rect.y + 2);
            var textX = rect.x + Window_Base._iconWidth + 4;
            this.drawText(quest.data.title, textX, rect.y, rect.width - textX);
        }
    };

    Window_QuestList.prototype.refresh = function () {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    };

    Window_QuestList.prototype.setDetailsWindow = function (detailsWindow) {
        this._detailsWindow = detailsWindow;
        this.update();
    };

    Window_QuestList.prototype.update = function () {
        Window_Selectable.prototype.update.call(this);
        if (this._detailsWindow) {
            this._detailsWindow.setQuest(this.item());
        }
    };

    //=============================================================================
    // Window_QuestDetails
    //=============================================================================

    function Window_QuestDetails() {
        this.initialize.apply(this, arguments);
    }

    Window_QuestDetails.prototype = Object.create(Window_Base.prototype);
    Window_QuestDetails.prototype.constructor = Window_QuestDetails;

    Window_QuestDetails.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this._quest = null;
    };

    Window_QuestDetails.prototype.setQuest = function (quest) {
        if (this._quest !== quest) {
            this._quest = quest;
            this.refresh();
        }
    };

    Window_QuestDetails.prototype.refresh = function () {
        this.contents.clear();

        if (!this._quest || !this._quest.data) {
            return;
        }

        var quest = this._quest;
        var y = 0;
        var width = this.contentsWidth();

        // --- TITLE ---
        this.contents.fontSize += 4;
        this.changeTextColor(this.systemColor());
        this.drawText(quest.data.title, 0, y, width, 'center');
        this.contents.fontSize -= 4;
        y += this.lineHeight();

        // Separator Line
        this.contents.paintOpacity = 128;
        this.contents.fillRect(20, y, width - 40, 2, this.normalColor());
        this.contents.paintOpacity = 255;
        y += 10;

        // --- DESCRIPTION ---
        this.changeTextColor(this.systemColor());
        this.drawText('Описание:', 0, y, width);
        y += this.lineHeight();

        this.resetTextColor();
        var descText = quest.data.description;
        // Use drawTextEx to support control codes like \c[x] \i[x]
        var descHeight = this.drawTextEx(descText, 10, y);
        y += descHeight + 10;

        // separator
        this.contents.paintOpacity = 48;
        this.contents.fillRect(0, y, width, 1, this.normalColor());
        this.contents.paintOpacity = 255;
        y += 10;

        // --- STEPS ---
        if (quest.data.steps && quest.data.steps.length > 0) {
            this.changeTextColor(this.systemColor());
            this.drawText('Задачи:', 0, y, width);
            y += this.lineHeight();

            for (var i = 0; i < quest.data.steps.length; i++) {
                var step = quest.data.steps[i];
                var isCompleted = (i + 1) < quest.currentStep || quest.status === 'completed';
                var isCurrent = (i + 1) === quest.currentStep && quest.status !== 'completed' && quest.status !== 'failed';

                var iconIndex = 16; // Grey circle (default)
                var stepColor = 8; // Grey text

                if (isCompleted) {
                    iconIndex = 87; // Check
                    stepColor = 3; // Green
                } else if (isCurrent) {
                    iconIndex = 163; // Exclamation
                    stepColor = 0; // White
                }

                this.drawIcon(iconIndex, 10, y + 2);

                this.changeTextColor(this.textColor(stepColor));
                var displayTitle = step.title;
                if (step.type === 'talk_to_npc' && step.targetNpcName) {
                    displayTitle += ' (Цель: ' + step.targetNpcName + ')';
                }
                this.drawText(displayTitle, 10 + Window_Base._iconWidth + 4, y, width - 40);

                y += this.lineHeight();

                // Show progress for counters if current
                if (isCurrent && (step.type === 'collect_items' || step.type === 'kill_enemies')) {
                    this.contents.fontSize -= 4;
                    this.changeTextColor(this.textColor(14)); // Yellow-ish
                    var progressText = '   Прогресс: ' + (step.currentCount || 0) + ' / ' + step.targetCount;
                    this.drawText(progressText, 10 + Window_Base._iconWidth + 4, y - 8, width - 40);
                    this.contents.fontSize += 4;
                    y += this.lineHeight() - 8;
                }
            }
        }

        y += 10;

        // --- REWARDS ---
        if (quest.data.rewards && (quest.data.rewards.gold > 0 || quest.data.rewards.exp > 0 || (quest.data.rewards.items && quest.data.rewards.items.length > 0))) {

            // separator
            this.contents.paintOpacity = 48;
            this.contents.fillRect(0, y, width, 1, this.normalColor());
            this.contents.paintOpacity = 255;
            y += 10;

            this.changeTextColor(this.systemColor());
            this.drawText('Награды:', 0, y, width);
            y += this.lineHeight();
            this.resetTextColor();

            // Gold
            if (quest.data.rewards.gold > 0) {
                this.drawIcon(314, 10, y + 2); // Gold icon? Usually 314 or similar. Let's assume user default. Or utilize TextManager.currencyUnit
                this.drawText(quest.data.rewards.gold + ' ' + TextManager.currencyUnit, 10 + 36, y, width);
                y += this.lineHeight();
            }
            // Exp
            if (quest.data.rewards.exp > 0) {
                this.drawText(quest.data.rewards.exp + ' EXP', 10, y, width);
                y += this.lineHeight();
            }
            // Items
            if (quest.data.rewards.items) {
                for (var j = 0; j < quest.data.rewards.items.length; j++) {
                    var rItem = quest.data.rewards.items[j];
                    var dbItem = $dataItems[rItem.id];
                    if (dbItem) {
                        this.drawIcon(dbItem.iconIndex, 10, y + 2);
                        this.drawText(dbItem.name + ' x' + rItem.amount, 10 + 36, y, width);
                        y += this.lineHeight();
                    }
                }
            }
        }

        this.resetTextColor();
    };

    // Инициализация глобальных переменных
    window.$dataQuests = null;
    window.$gameQuests = null;
    window.$gameQuestEvents = null;

    //=============================================================================
    // Quest Debug Overlay (Для разработчика)
    //=============================================================================

    function Scene_QuestDebug() {
        this.initialize.apply(this, arguments);
    }
    window.Scene_QuestDebug = Scene_QuestDebug;

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this);
        if ($gameTemp.isPlaytest() && Input.isTriggered('f6')) {
            this.toggleQuestDebug();
        }
    };

    Scene_Map.prototype.toggleQuestDebug = function () {
        if (!this._questDebugWindow) {
            this._questDebugWindow = new Window_QuestDebug();
            this.addChild(this._questDebugWindow);
        } else {
            this._questDebugWindow.visible = !this._questDebugWindow.visible;
        }
    };

    function Window_QuestDebug() {
        this.initialize.apply(this, arguments);
    }

    Window_QuestDebug.prototype = Object.create(Window_Base.prototype);
    Window_QuestDebug.prototype.constructor = Window_QuestDebug;

    Window_QuestDebug.prototype.initialize = function () {
        var w = 400;
        var h = 300;
        Window_Base.prototype.initialize.call(this, 10, 10, w, h);
        this.refresh();
    };

    Window_QuestDebug.prototype.refresh = function () {
        this.contents.clear();
        this.changeTextColor(this.systemColor());
        this.drawText("DEBUG: Статус Квестов (F6 - скрыть)", 0, 0, this.contentsWidth(), 'center');
        this.changeTextColor(this.normalColor());

        var y = 30;
        var lineHeight = this.lineHeight();

        if (!$dataQuests) return;

        for (var qId in $dataQuests) {
            var qData = $dataQuests[qId];
            if (qData.variableId > 0) {
                var val = $gameVariables.value(qData.variableId);
                var quest = $gameQuests.getQuest(qId);
                var status = quest ? quest.status : "Не запущен";
                this.drawText(qData.title + " (Var " + qData.variableId + "): " + val, 0, y, this.contentsWidth());
                y += lineHeight;
                this.drawText("  Статус: " + status, 0, y, this.contentsWidth());
                y += lineHeight;
            }
        }
    };

    Window_QuestDebug.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        if (Graphics.frameCount % 30 === 0) this.refresh();
    };

    var _BattleManager_makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function () {
        _BattleManager_makeRewards.call(this);
        if ($gameQuests) {
            $gameTroop.deadMembers().forEach(function (enemy) {
                if (!enemy._questCounted) {
                    $gameQuests.updateEnemyProgress(enemy.enemyId());
                    enemy._questCounted = true;
                }
            });
        }
    };

})();
