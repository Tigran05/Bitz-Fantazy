//=============================================================================
// ACTPO_MultiLanguage.js
// Мультиязычная система для RPG Maker MV/MZ
// Версия: 1.0.0
//=============================================================================

/*:
 * @plugindesc Система мультиязычности для игры "Охотники за Казино"
 * @author ACTPO Team
 *
 * @param Default Language
 * @desc Язык по умолчанию (ru, en, de, es, fr, ja, zh)
 * @type select
 * @option Русский
 * @value ru
 * @option English
 * @value en
 * @option Deutsch
 * @value de
 * @option Español
 * @value es
 * @option Français
 * @value fr
 * @option 日本語
 * @value ja
 * @option 中文
 * @value zh
 * @default ru
 *
 * @param Show Language Button
 * @desc Показывать кнопку смены языка в меню
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * ОПИСАНИЕ
 * ============================================================================
 * 
 * Этот плагин добавляет поддержку нескольких языков в игру.
 * 
 * ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ:
 * - ru: Русский
 * - en: English
 * - de: Deutsch (Немецкий)
 * - es: Español (Испанский)
 * - fr: Français (Французский)
 * - ja: 日本語 (Японский)
 * - zh: 中文 (Китайский)
 * 
 * КАК ИСПОЛЬЗОВАТЬ:
 * 
 * 1. В диалогах используйте специальные коды:
 *    \lang[ru]Текст на русском\lang[en]English text
 * 
 * 2. Для перевода квестов редактируйте объект ACTPO_Translations
 * 
 * 3. Команды плагина:
 *    - ChangeLanguage ru  (сменить на русский)
 *    - ChangeLanguage en  (сменить на английский)
 * 
 * ============================================================================
 */

(function() {
    'use strict';

    var parameters = PluginManager.parameters('ACTPO_MultiLanguage');
    var defaultLanguage = parameters['Default Language'] || 'ru';
    var showLanguageButton = parameters['Show Language Button'] === 'true';

    // ============================================================================
    // ХРАНИЛИЩЕ ПЕРЕВОДОВ
    // ============================================================================

    window.ACTPO_Translations = window.ACTPO_Translations || {};

    // ============================================================================
    // РУССКИЙ ЯЗЫК (Базовый)
    // ============================================================================

    window.ACTPO_Translations.ru = {
        // Меню
        menu: {
            language: "Язык",
            save: "Сохранить",
            load: "Загрузить",
            options: "Настройки",
            quit: "Выход",
            quest_log: "Журнал квестов",
            inventory: "Инвентарь",
            skills: "Навыки",
            equipment: "Экипировка",
            status: "Статус",
            formation: "Порядок"
        },

        // Общие фразы
        common: {
            yes: "Да",
            no: "Нет",
            cancel: "Отмена",
            confirm: "Подтвердить",
            back: "Назад",
            next: "Далее",
            accept: "Принять",
            decline: "Отклонить",
            reward: "Награда",
            completed: "Выполнено!",
            failed: "Провалено",
            in_progress: "В процессе"
        },

        // Боевая система
        battle: {
            attack: "Атака",
            skill: "Навык",
            guard: "Защита",
            item: "Предмет",
            escape: "Бегство",
            victory: "Победа!",
            defeat: "Поражение...",
            exp: "Опыт",
            gold: "Золото",
            drops: "Добыча"
        },

        // Квесты - Глава 1: Битцленд
        quests_chapter_1: {
            title: "Битцленд",
            1: "Поговорить с Барменом Майком",
            2: "Избавить подвал от крыс (\\v[11]/3)",
            3: "Вернуться к Майку за 1-й цифрой кода",
            4: "Поговорить с Инженером в серверной",
            5: "Найти Жидкий Азот в подвале (\\v[12]/1)",
            6: "Отдать Азот Инженеру за 2-ю цифру",
            7: "Поговорить со слот менеджером",
            8: "Победить Шулера (\\v[13]/1)",
            9: "Вернуться к слот менеджеру",
            10: "Найти потайной ход в доме Брунно (\\v[14]/1)",
            11: "Вскрыть сейф и забрать бухгалтерию",
            12: "ОДОЛЕТЬ БРУННО В ФИНАЛЬНОЙ БИТВЕ"
        },

        // Квесты - Глава 2: Вермилион
        quests_chapter_2: {
            title: "Вермилион",
            1: "Идти в город Вермилион на востоке",
            2: "Найти фальшивое казино",
            3: "Найти где перекусить и собрать информацию",
            4: "Поговорить с торговцем",
            5: "Собрать ракушки (\\v[21]/5)",
            6: "Вернуться к торговцу получить балон",
            7: "Поговорить с работником в доках",
            8: "Включить рубильник",
            9: "Поговорить с работником в доках забрать ласты",
            10: "Поговорить с ученым в порту",
            11: "Отыскать потерянные ключи",
            12: "Поговорить с ученым получить маску",
            13: "Попасть на территорию казино по затопленому тунелю",
            14: "ОДОЛЕТЬ ФИДЕЛЯ В ФИНАЛЬНОЙ БИТВЕ"
        },

        // Квесты - Глава 3: Железный Утес
        quests_chapter_3: {
            title: "Железный Утес",
            1: "Добраться до города Железный Утес",
            2: "Исследовать город",
            3: "Вернуться к Кире с уликами",
            4: "Поговорить с обманутым программистом Максом",
            5: "Взломать главный терминал казино (\\v[32]/1)",
            6: "Получить данные от Макса",
            7: "Поговорить с охранником казино",
            8: "Победить 2 киборгов-охранников (\\v[33]/2)",
            9: "Вернуться к охраннику",
            10: "Отключить систему голографических обманов (\\v[34]/1)",
            11: "Получить улики против Доктора Сина",
            12: "ОДОЛЕТЬ ДОКТОРА СИНА И ЗАКРЫТЬ \"НЕЙРОН\""
        },

        // Квесты - Глава 4: Фростсити
        quests_chapter_4: {
            title: "Фростсити",
            1: "Поговорить с торговцем льдом Иваром",
            2: "Собрать 3 замороженных жалобы жителей (\\v[41]/3)",
            3: "Вернуться к Ивару",
            4: "Поговорить с шаманом Айсой о магическом обмане",
            5: "Найти ледяной кристалл правды в пещере (\\v[42]/1)",
            6: "Отдать кристалл Айсе",
            7: "Поговорить с ледяным стражем",
            8: "Победить 2 ледяных голема (\\v[43]/2)",
            9: "Вернуться к стражу",
            10: "Разрушить магический барьер казино (\\v[44]/1)",
            11: "Получить улики против Королевы Морганы",
            12: "ОДОЛЕТЬ КОРОЛЕВУ МОРГАНУ И ЗАКРЫТЬ \"ЛЕДЯНУЮ КОРОНУ\""
        },

        // Квесты - Глава 5: Порт-Ройял
        quests_chapter_5: {
            title: "Порт-Ройял",
            1: "Поговорить с мэром порта Скарлетт",
            2: "Найти 3 пиратских свидетельства обмана (\\v[51]/3)",
            3: "Вернуться к Скарлетт",
            4: "Поговорить с моряком Крюком о пропавших сокровищах",
            5: "Найти украденные монеты в трюмах (\\v[52]/1)",
            6: "Отдать монеты Крюку",
            7: "Поговорить с боцманом пиратов",
            8: "Победить 3 пиратов-головорезов (\\v[53]/3)",
            9: "Вернуться к боцману",
            10: "Найти тайный проход в казино через док (\\v[54]/1)",
            11: "Получить улики против Капитана Рэда",
            12: "ОДОЛЕТЬ КАПИТАНА РЭДА И ЗАКРЫТЬ \"ПИРАТСКУЮ УДАЧУ\""
        },

        // Квесты - Глава 6: Сильван
        quests_chapter_6: {
            title: "Сильван",
            1: "Поговорить с Хранителем леса Элдрихом",
            2: "Найти 3 природных свидетельства обмана (\\v[61]/3)",
            3: "Вернуться к Элдриху",
            4: "Поговорить с эльфом Лирин о пропавших артефактах",
            5: "Найти древний семенной кристалл в роще (\\v[62]/1)",
            6: "Отдать кристалл Лирин",
            7: "Поговорить с стражем природы",
            8: "Победить 2 защитников природы (\\v[63]/2)",
            9: "Вернуться к стражу",
            10: "Пробудить Древо жизни против казино (\\v[64]/1)",
            11: "Получить улики против Мастера Грэна",
            12: "ОДОЛЕТЬ МАСТЕРА ГРЭНА И ЗАКРЫТЬ \"ДРЕВНИЙ РОСТОК\""
        },

        // Квесты - Глава 7: Башня Брунно
        quests_chapter_7: {
            title: "Башня Брунно",
            1: "Войти в главную башню казино \"Империя\"",
            2: "Победить 5 стражей башни (\\v[71]/5)",
            3: "Подняться на следующий этаж",
            4: "Победить 5 элитных охранников (\\v[72]/5)",
            5: "Подняться еще выше",
            6: "Победить 3 телохранителей Брунно (\\v[73]/3)",
            7: "Добраться до главного зала казино",
            8: "Победить 3 мини-боссов (\\v[74]/3)",
            9: "Войти в святая святых",
            10: "Собрать улики против всей сети казино (\\v[75]/1)",
            11: "Разрушить центральную систему управления",
            12: "ФИНАЛЬНАЯ БИТВА С БРУННО - ПОСЛЕДНЕЕ КАЗИНО!"
        },

        // Диалоги персонажей
        characters: {
            kate: "Катя",
            ape: "Эйп",
            lichi: "Личи",
            aleco: "Алеко",
            bruno: "Брунно",
            fidel: "Фидель",
            grom: "Старейшина Гром",
            morgana: "Королева Моргана",
            red: "Капитан Рэд",
            gren: "Мастер Грэн"
        },

        // Названия городов
        cities: {
            bitzland: "Битцленд",
            vermilion: "Вермилион",
            iron_cliff: "Железный Утес",
            frostcity: "Фростсити",
            port_royal: "Порт-Ройял",
            sylvan: "Сильван",
            bruno_tower: "Башня Брунно"
        },

        // Названия казино
        casinos: {
            golden_jackpot: "Золотой Джекпот",
            sea_devil: "Морской Дьявол",
            diamond_vein: "Алмазная Жила",
            ice_crown: "Ледяная Корона",
            pirate_luck: "Пиратская Удача",
            ancient_sprout: "Древний Росток",
            empire: "Империя"
        }
    };

    // ============================================================================
    // АНГЛИЙСКИЙ ЯЗЫК
    // ============================================================================

    window.ACTPO_Translations.en = {
        menu: {
            language: "Language",
            save: "Save",
            load: "Load",
            options: "Options",
            quit: "Quit",
            quest_log: "Quest Log",
            inventory: "Inventory",
            skills: "Skills",
            equipment: "Equipment",
            status: "Status",
            formation: "Formation"
        },

        common: {
            yes: "Yes",
            no: "No",
            cancel: "Cancel",
            confirm: "Confirm",
            back: "Back",
            next: "Next",
            accept: "Accept",
            decline: "Decline",
            reward: "Reward",
            completed: "Completed!",
            failed: "Failed",
            in_progress: "In Progress"
        },

        battle: {
            attack: "Attack",
            skill: "Skill",
            guard: "Guard",
            item: "Item",
            escape: "Escape",
            victory: "Victory!",
            defeat: "Defeat...",
            exp: "EXP",
            gold: "Gold",
            drops: "Drops"
        },

        quests_chapter_1: {
            title: "Bitzland",
            1: "Talk to Bartender Mike",
            2: "Clear the basement of rats (\\v[11]/3)",
            3: "Return to Mike for the 1st code digit",
            4: "Talk to the Engineer in the server room",
            5: "Find Liquid Nitrogen in the basement (\\v[12]/1)",
            6: "Give Nitrogen to Engineer for 2nd digit",
            7: "Talk to the slot manager",
            8: "Defeat the Cheater (\\v[13]/1)",
            9: "Return to the slot manager",
            10: "Find the secret passage in Bruno's house (\\v[14]/1)",
            11: "Open the safe and take the accounting records",
            12: "DEFEAT BRUNO IN THE FINAL BATTLE"
        },

        quests_chapter_2: {
            title: "Vermilion",
            1: "Go to Vermilion city to the east",
            2: "Find the fake casino",
            3: "Find a place to eat and gather information",
            4: "Talk to the merchant",
            5: "Collect shells (\\v[21]/5)",
            6: "Return to the merchant to get the cylinder",
            7: "Talk to the dock worker",
            8: "Turn on the switch",
            9: "Talk to the dock worker to get the fins",
            10: "Talk to the scientist at the port",
            11: "Find the lost keys",
            12: "Talk to the scientist to get the mask",
            13: "Enter the casino through the flooded tunnel",
            14: "DEFEAT FIDEL IN THE FINAL BATTLE"
        },

        quests_chapter_3: {
            title: "Iron Cliff",
            1: "Reach Iron Cliff city",
            2: "Investigate the city",
            3: "Return to Kira with evidence",
            4: "Talk to deceived programmer Max",
            5: "Hack the casino main terminal (\\v[32]/1)",
            6: "Get data from Max",
            7: "Talk to the casino guard",
            8: "Defeat 2 cyborg guards (\\v[33]/2)",
            9: "Return to the guard",
            10: "Disable the holographic deception system (\\v[34]/1)",
            11: "Get evidence against Dr. Sin",
            12: "DEFEAT DR. SIN AND CLOSE \"NEURON\""
        },

        quests_chapter_4: {
            title: "Frostcity",
            1: "Talk to ice merchant Ivar",
            2: "Collect 3 frozen complaints from residents (\\v[41]/3)",
            3: "Return to Ivar",
            4: "Talk to shaman Aisa about magical deception",
            5: "Find the ice crystal of truth in the cave (\\v[42]/1)",
            6: "Give the crystal to Aisa",
            7: "Talk to the ice guardian",
            8: "Defeat 2 ice golems (\\v[43]/2)",
            9: "Return to the guardian",
            10: "Destroy the casino's magic barrier (\\v[44]/1)",
            11: "Get evidence against Queen Morgana",
            12: "DEFEAT QUEEN MORGANA AND CLOSE \"ICE CROWN\""
        },

        quests_chapter_5: {
            title: "Port Royal",
            1: "Talk to port mayor Scarlett",
            2: "Find 3 pirate evidence of deception (\\v[51]/3)",
            3: "Return to Scarlett",
            4: "Talk to sailor Hook about missing treasures",
            5: "Find stolen coins in the holds (\\v[52]/1)",
            6: "Give the coins to Hook",
            7: "Talk to the pirate boatswain",
            8: "Defeat 3 pirate thugs (\\v[53]/3)",
            9: "Return to the boatswain",
            10: "Find the secret passage to the casino through the dock (\\v[54]/1)",
            11: "Get evidence against Captain Red",
            12: "DEFEAT CAPTAIN RED AND CLOSE \"PIRATE'S LUCK\""
        },

        quests_chapter_6: {
            title: "Sylvan",
            1: "Talk to Forest Keeper Eldrich",
            2: "Find 3 natural evidence of deception (\\v[61]/3)",
            3: "Return to Eldrich",
            4: "Talk to elf Lirin about missing artifacts",
            5: "Find the ancient seed crystal in the grove (\\v[62]/1)",
            6: "Give the crystal to Lirin",
            7: "Talk to the nature guardian",
            8: "Defeat 2 nature defenders (\\v[63]/2)",
            9: "Return to the guardian",
            10: "Awaken the Tree of Life against the casino (\\v[64]/1)",
            11: "Get evidence against Master Gren",
            12: "DEFEAT MASTER GREN AND CLOSE \"ANCIENT SPROUT\""
        },

        quests_chapter_7: {
            title: "Bruno's Tower",
            1: "Enter the main tower of \"Empire\" casino",
            2: "Defeat 5 tower guards (\\v[71]/5)",
            3: "Go up to the next floor",
            4: "Defeat 5 elite guards (\\v[72]/5)",
            5: "Go even higher",
            6: "Defeat 3 Bruno's bodyguards (\\v[73]/3)",
            7: "Reach the main casino hall",
            8: "Defeat 3 mini-bosses (\\v[74]/3)",
            9: "Enter the inner sanctum",
            10: "Collect evidence against the entire casino network (\\v[75]/1)",
            11: "Destroy the central control system",
            12: "FINAL BATTLE WITH BRUNO - THE LAST CASINO!"
        },

        characters: {
            kate: "Kate",
            ape: "Ape",
            lichi: "Lichi",
            aleco: "Aleco",
            bruno: "Bruno",
            fidel: "Fidel",
            grom: "Elder Grom",
            morgana: "Queen Morgana",
            red: "Captain Red",
            gren: "Master Gren"
        },

        cities: {
            bitzland: "Bitzland",
            vermilion: "Vermilion",
            iron_cliff: "Iron Cliff",
            frostcity: "Frostcity",
            port_royal: "Port Royal",
            sylvan: "Sylvan",
            bruno_tower: "Bruno's Tower"
        },

        casinos: {
            golden_jackpot: "Golden Jackpot",
            sea_devil: "Sea Devil",
            diamond_vein: "Diamond Vein",
            ice_crown: "Ice Crown",
            pirate_luck: "Pirate's Luck",
            ancient_sprout: "Ancient Sprout",
            empire: "Empire"
        }
    };

    // ============================================================================
    // НЕМЕЦКИЙ ЯЗЫК
    // ============================================================================

    window.ACTPO_Translations.de = {
        menu: {
            language: "Sprache",
            save: "Speichern",
            load: "Laden",
            options: "Optionen",
            quit: "Beenden",
            quest_log: "Quest-Logbuch",
            inventory: "Inventar",
            skills: "Fähigkeiten",
            equipment: "Ausrüstung",
            status: "Status",
            formation: "Formation"
        },

        common: {
            yes: "Ja",
            no: "Nein",
            cancel: "Abbrechen",
            confirm: "Bestätigen",
            back: "Zurück",
            next: "Weiter",
            accept: "Annehmen",
            decline: "Ablehnen",
            reward: "Belohnung",
            completed: "Abgeschlossen!",
            failed: "Gescheitert",
            in_progress: "In Bearbeitung"
        },

        battle: {
            attack: "Angriff",
            skill: "Fähigkeit",
            guard: "Verteidigen",
            item: "Gegenstand",
            escape: "Flucht",
            victory: "Sieg!",
            defeat: "Niederlage...",
            exp: "EP",
            gold: "Gold",
            drops: "Beute"
        },

        quests_chapter_1: {
            title: "Bitzland",
            1: "Mit Barkeeper Mike sprechen",
            2: "Keller von Ratten befreien (\\v[11]/3)",
            3: "Zu Mike für die 1. Ziffer zurückkehren",
            4: "Mit dem Ingenieur im Serverraum sprechen",
            5: "Flüssigstickstoff im Keller finden (\\v[12]/1)",
            6: "Stickstoff dem Ingenieur für 2. Ziffer geben",
            7: "Mit dem Slot-Manager sprechen",
            8: "Den Schummler besiegen (\\v[13]/1)",
            9: "Zum Slot-Manager zurückkehren",
            10: "Den Geheimgang in Brunos Haus finden (\\v[14]/1)",
            11: "Den Safe öffnen und Buchhaltungsunterlagen nehmen",
            12: "BRUNO IM ENDKAMPF BESIEGEN"
        },

        characters: {
            kate: "Kate",
            ape: "Ape",
            lichi: "Lichi",
            aleco: "Aleco",
            bruno: "Bruno",
            fidel: "Fidel",
            grom: "Ältester Grom",
            morgana: "Königin Morgana",
            red: "Kapitän Red",
            gren: "Meister Gren"
        },

        cities: {
            bitzland: "Bitzland",
            vermilion: "Vermilion",
            iron_cliff: "Eisenklippe",
            frostcity: "Froststadt",
            port_royal: "Port Royal",
            sylvan: "Sylvan",
            bruno_tower: "Brunos Turm"
        },

        casinos: {
            golden_jackpot: "Goldener Jackpot",
            sea_devil: "Meeresteufel",
            diamond_vein: "Diamantader",
            ice_crown: "Eiskrone",
            pirate_luck: "Piratenglück",
            ancient_sprout: "Uralter Spross",
            empire: "Imperium"
        }
    };

    // ============================================================================
    // ИСПАНСКИЙ ЯЗЫК
    // ============================================================================

    window.ACTPO_Translations.es = {
        menu: {
            language: "Idioma",
            save: "Guardar",
            load: "Cargar",
            options: "Opciones",
            quit: "Salir",
            quest_log: "Registro de misiones",
            inventory: "Inventario",
            skills: "Habilidades",
            equipment: "Equipo",
            status: "Estado",
            formation: "Formación"
        },

        common: {
            yes: "Sí",
            no: "No",
            cancel: "Cancelar",
            confirm: "Confirmar",
            back: "Atrás",
            next: "Siguiente",
            accept: "Aceptar",
            decline: "Rechazar",
            reward: "Recompensa",
            completed: "¡Completado!",
            failed: "Fallido",
            in_progress: "En progreso"
        },

        battle: {
            attack: "Atacar",
            skill: "Habilidad",
            guard: "Defender",
            item: "Objeto",
            escape: "Huir",
            victory: "¡Victoria!",
            defeat: "Derrota...",
            exp: "EXP",
            gold: "Oro",
            drops: "Botín"
        },

        quests_chapter_1: {
            title: "Bitzland",
            1: "Hablar con el barman Mike",
            2: "Limpiar el sótano de ratas (\\v[11]/3)",
            3: "Volver con Mike por el 1er dígito",
            4: "Hablar con el Ingeniero en la sala de servidores",
            5: "Encontrar Nitrógeno Líquido en el sótano (\\v[12]/1)",
            6: "Dar Nitrógeno al Ingeniero por el 2do dígito",
            7: "Hablar con el gerente de tragamonedas",
            8: "Derrotar al Tramposo (\\v[13]/1)",
            9: "Volver con el gerente de tragamonedas",
            10: "Encontrar el pasadizo secreto en la casa de Bruno (\\v[14]/1)",
            11: "Abrir la caja fuerte y tomar los registros contables",
            12: "DERROTAR A BRUNO EN LA BATALLA FINAL"
        },

        characters: {
            kate: "Kate",
            ape: "Ape",
            lichi: "Lichi",
            aleco: "Aleco",
            bruno: "Bruno",
            fidel: "Fidel",
            grom: "Anciano Grom",
            morgana: "Reina Morgana",
            red: "Capitán Red",
            gren: "Maestro Gren"
        },

        cities: {
            bitzland: "Bitzland",
            vermilion: "Vermilion",
            iron_cliff: "Acantilado de Hierro",
            frostcity: "Ciudad de Hielo",
            port_royal: "Port Royal",
            sylvan: "Sylvan",
            bruno_tower: "Torre de Bruno"
        },

        casinos: {
            golden_jackpot: "Jackpot Dorado",
            sea_devil: "Diablo del Mar",
            diamond_vein: "Veta de Diamante",
            ice_crown: "Corona de Hielo",
            pirate_luck: "Suerte Pirata",
            ancient_sprout: "Brote Ancestral",
            empire: "Imperio"
        }
    };

    // ============================================================================
    // ФРАНЦУЗСКИЙ ЯЗЫК
    // ============================================================================

    window.ACTPO_Translations.fr = {
        menu: {
            language: "Langue",
            save: "Sauvegarder",
            load: "Charger",
            options: "Options",
            quit: "Quitter",
            quest_log: "Journal des quêtes",
            inventory: "Inventaire",
            skills: "Compétences",
            equipment: "Équipement",
            status: "Statut",
            formation: "Formation"
        },

        common: {
            yes: "Oui",
            no: "Non",
            cancel: "Annuler",
            confirm: "Confirmer",
            back: "Retour",
            next: "Suivant",
            accept: "Accepter",
            decline: "Refuser",
            reward: "Récompense",
            completed: "Terminé !",
            failed: "Échoué",
            in_progress: "En cours"
        },

        battle: {
            attack: "Attaque",
            skill: "Compétence",
            guard: "Défense",
            item: "Objet",
            escape: "Fuite",
            victory: "Victoire !",
            defeat: "Défaite...",
            exp: "EXP",
            gold: "Or",
            drops: "Butin"
        },

        quests_chapter_1: {
            title: "Bitzland",
            1: "Parler au barman Mike",
            2: "Débarrasser la cave des rats (\\v[11]/3)",
            3: "Retourner voir Mike pour le 1er chiffre",
            4: "Parler à l'Ingénieur dans la salle des serveurs",
            5: "Trouver l'Azote Liquide dans la cave (\\v[12]/1)",
            6: "Donner l'Azote à l'Ingénieur pour le 2ème chiffre",
            7: "Parler au gestionnaire de machines à sous",
            8: "Vaincre le Tricheur (\\v[13]/1)",
            9: "Retourner voir le gestionnaire",
            10: "Trouver le passage secret dans la maison de Bruno (\\v[14]/1)",
            11: "Ouvrir le coffre et prendre les documents comptables",
            12: "VAINCRE BRUNO DANS LE COMBAT FINAL"
        },

        characters: {
            kate: "Kate",
            ape: "Ape",
            lichi: "Lichi",
            aleco: "Aleco",
            bruno: "Bruno",
            fidel: "Fidel",
            grom: "Ancien Grom",
            morgana: "Reine Morgana",
            red: "Capitaine Red",
            gren: "Maître Gren"
        },

        cities: {
            bitzland: "Bitzland",
            vermilion: "Vermilion",
            iron_cliff: "Falaise de Fer",
            frostcity: "Cité de Givre",
            port_royal: "Port Royal",
            sylvan: "Sylvan",
            bruno_tower: "Tour de Bruno"
        },

        casinos: {
            golden_jackpot: "Jackpot Doré",
            sea_devil: "Diable des Mers",
            diamond_vein: "Veine de Diamant",
            ice_crown: "Couronne de Glace",
            pirate_luck: "Chance Pirate",
            ancient_sprout: "Pousse Ancienne",
            empire: "Empire"
        }
    };

    // ============================================================================
    // ЯПОНСКИЙ ЯЗЫК
    // ============================================================================

    window.ACTPO_Translations.ja = {
        menu: {
            language: "言語",
            save: "セーブ",
            load: "ロード",
            options: "オプション",
            quit: "終了",
            quest_log: "クエストログ",
            inventory: "アイテム",
            skills: "スキル",
            equipment: "装備",
            status: "ステータス",
            formation: "並び替え"
        },

        common: {
            yes: "はい",
            no: "いいえ",
            cancel: "キャンセル",
            confirm: "確認",
            back: "戻る",
            next: "次へ",
            accept: "受諾",
            decline: "拒否",
            reward: "報酬",
            completed: "完了！",
            failed: "失敗",
            in_progress: "進行中"
        },

        battle: {
            attack: "攻撃",
            skill: "スキル",
            guard: "防御",
            item: "アイテム",
            escape: "逃げる",
            victory: "勝利！",
            defeat: "敗北...",
            exp: "経験値",
            gold: "ゴールド",
            drops: "ドロップ"
        },

        quests_chapter_1: {
            title: "ビッツランド",
            1: "バーテンダーのマイクと話す",
            2: "地下室のネズミを退治する (\\v[11]/3)",
            3: "マイクのところへ戻って最初の数字をもらう",
            4: "サーバー室のエンジニアと話す",
            5: "地下室で液体窒素を見つける (\\v[12]/1)",
            6: "エンジニアに窒素を渡して2番目の数字をもらう",
            7: "スロットマネージャーと話す",
            8: "イカサマ師を倒す (\\v[13]/1)",
            9: "スロットマネージャーのところへ戻る",
            10: "ブルーノの家の隠し通路を見つける (\\v[14]/1)",
            11: "金庫を開けて会計記録を手に入れる",
            12: "最終決戦でブルーノを倒せ"
        },

        characters: {
            kate: "ケイト",
            ape: "エイプ",
            lichi: "リチ",
            aleco: "アレコ",
            bruno: "ブルーノ",
            fidel: "フィデル",
            grom: "長老グロム",
            morgana: "女王モルガナ",
            red: "レッド船長",
            gren: "マスター・グレン"
        },

        cities: {
            bitzland: "ビッツランド",
            vermilion: "ヴァーミリオン",
            iron_cliff: "アイアンクリフ",
            frostcity: "フロストシティ",
            port_royal: "ポートロイヤル",
            sylvan: "シルヴァン",
            bruno_tower: "ブルーノの塔"
        },

        casinos: {
            golden_jackpot: "ゴールデンジャックポット",
            sea_devil: "シーデビル",
            diamond_vein: "ダイヤモンドベイン",
            ice_crown: "アイスクラウン",
            pirate_luck: "パイレーツラック",
            ancient_sprout: "エンシェントスプラウト",
            empire: "エンパイア"
        }
    };

    // ============================================================================
    // КИТАЙСКИЙ ЯЗЫК
    // ============================================================================

    window.ACTPO_Translations.zh = {
        menu: {
            language: "语言",
            save: "保存",
            load: "读取",
            options: "选项",
            quit: "退出",
            quest_log: "任务日志",
            inventory: "物品栏",
            skills: "技能",
            equipment: "装备",
            status: "状态",
            formation: "队形"
        },

        common: {
            yes: "是",
            no: "否",
            cancel: "取消",
            confirm: "确认",
            back: "返回",
            next: "下一步",
            accept: "接受",
            decline: "拒绝",
            reward: "奖励",
            completed: "完成！",
            failed: "失败",
            in_progress: "进行中"
        },

        battle: {
            attack: "攻击",
            skill: "技能",
            guard: "防御",
            item: "物品",
            escape: "逃跑",
            victory: "胜利！",
            defeat: "失败...",
            exp: "经验值",
            gold: "金币",
            drops: "掉落物"
        },

        quests_chapter_1: {
            title: "比特兰",
            1: "与酒保迈克交谈",
            2: "清除地下室的的老鼠 (\\v[11]/3)",
            3: "返回迈克处获取第一个数字",
            4: "与服务器室的工程师交谈",
            5: "在地下室找到液氮 (\\v[12]/1)",
            6: "把液氮交给工程师获取第二个数字",
            7: "与老虎机经理交谈",
            8: "击败作弊者 (\\v[13]/1)",
            9: "返回老虎机经理处",
            10: "在布鲁诺的房子里找到秘密通道 (\\v[14]/1)",
            11: "打开保险箱并拿走账本",
            12: "在最终战斗中击败布鲁诺"
        },

        characters: {
            kate: "凯特",
            ape: "艾普",
            lichi: "莉琪",
            aleco: "阿列科",
            bruno: "布鲁诺",
            fidel: "菲德尔",
            grom: "长老格罗姆",
            morgana: "摩根娜女王",
            red: "雷德船长",
            gren: "格伦大师"
        },

        cities: {
            bitzland: "比特兰",
            vermilion: "朱红城",
            iron_cliff: "铁崖",
            frostcity: "冰霜城",
            port_royal: "皇家港口",
            sylvan: "森林城",
            bruno_tower: "布鲁诺之塔"
        },

        casinos: {
            golden_jackpot: "黄金头奖",
            sea_devil: "海魔",
            diamond_vein: "钻石矿脉",
            ice_crown: "冰冠",
            pirate_luck: "海盗运气",
            ancient_sprout: "古老萌芽",
            empire: "帝国"
        }
    };

    // ============================================================================
    // СИСТЕМА УПРАВЛЕНИЯ ЯЗЫКАМИ
    // ============================================================================

    function LanguageManager() {
        this.initialize.apply(this, arguments);
    }

    LanguageManager.prototype.initialize = function() {
        this._currentLanguage = defaultLanguage;
        this._languages = ['ru', 'en', 'de', 'es', 'fr', 'ja', 'zh'];
        this._languageNames = {
            'ru': 'Русский',
            'en': 'English',
            'de': 'Deutsch',
            'es': 'Español',
            'fr': 'Français',
            'ja': '日本語',
            'zh': '中文'
        };
    };

    LanguageManager.prototype.getCurrentLanguage = function() {
        return this._currentLanguage;
    };

    LanguageManager.prototype.setCurrentLanguage = function(lang) {
        if (this._languages.contains(lang)) {
            this._currentLanguage = lang;
            this.saveLanguage();
            this.refreshAllWindows();
        }
    };

    LanguageManager.prototype.getLanguages = function() {
        return this._languages;
    };

    LanguageManager.prototype.getLanguageName = function(lang) {
        return this._languageNames[lang] || lang;
    };

    LanguageManager.prototype.saveLanguage = function() {
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('ACTPO_Language', this._currentLanguage);
        }
    };

    LanguageManager.prototype.loadLanguage = function() {
        if (typeof Storage !== 'undefined') {
            var saved = localStorage.getItem('ACTPO_Language');
            if (saved && this._languages.contains(saved)) {
                this._currentLanguage = saved;
            }
        }
    };

    LanguageManager.prototype.refreshAllWindows = function() {
        if (SceneManager._scene) {
            // Проверяем наличие метода refresh перед вызовом
            if (typeof SceneManager._scene.refresh === 'function') {
                SceneManager._scene.refresh();
            }
            // Также обновляем все окна на сцене
            if (SceneManager._scene._windowLayer) {
                var windows = SceneManager._scene._windowLayer.children;
                for (var i = 0; i < windows.length; i++) {
                    if (windows[i] && typeof windows[i].refresh === 'function') {
                        windows[i].refresh();
                    }
                }
            }
        }
    };

    LanguageManager.prototype.translate = function(category, key) {
        var lang = this._currentLanguage;
        var translations = window.ACTPO_Translations[lang];
        
        if (translations && translations[category]) {
            if (translations[category][key]) {
                return translations[category][key];
            }
        }
        
        // Fallback to Russian
        if (window.ACTPO_Translations.ru && window.ACTPO_Translations.ru[category]) {
            if (window.ACTPO_Translations.ru[category][key]) {
                return window.ACTPO_Translations.ru[category][key];
            }
        }
        
        return key;
    };

    LanguageManager.prototype.getQuestText = function(chapter, step) {
        var category = 'quests_chapter_' + chapter;
        return this.translate(category, step);
    };

    // Создаём глобальный экземпляр
    var languageManager = new LanguageManager();

    // Загружаем сохранённый язык при запуске
    languageManager.loadLanguage();

    // ============================================================================
    // КОМАНДЫ ПЛАГИНА
    // ============================================================================

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'ChangeLanguage') {
            if (args[0]) {
                languageManager.setCurrentLanguage(args[0]);
            }
        }
        
        if (command === 'ShowLanguageMenu') {
            SceneManager.push(Scene_LanguageSelect);
        }
    };

    // ============================================================================
    // СЦЕНА ВЫБОРА ЯЗЫКА
    // ============================================================================

    function Scene_LanguageSelect() {
        this.initialize.apply(this, arguments);
    }

    Scene_LanguageSelect.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_LanguageSelect.prototype.constructor = Scene_LanguageSelect;

    Scene_LanguageSelect.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_LanguageSelect.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createCommandWindow();
    };

    Scene_LanguageSelect.prototype.createHelpWindow = function() {
        this._helpWindow = new Window_Help(1);
        this._helpWindow.setText('Выберите язык / Select Language');
        this.addWindow(this._helpWindow);
    };

    Scene_LanguageSelect.prototype.createCommandWindow = function() {
        this._commandWindow = new Window_LanguageList(0, this._helpWindow.height);
        this._commandWindow.setHandler('ok', this.onLanguageOk.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    };

    Scene_LanguageSelect.prototype.onLanguageOk = function() {
        var lang = this._commandWindow.currentLanguage();
        languageManager.setCurrentLanguage(lang);
        this.popScene();
    };

    // ============================================================================
    // ОКНО СПИСКА ЯЗЫКОВ
    // ============================================================================

    function Window_LanguageList() {
        this.initialize.apply(this, arguments);
    }

    Window_LanguageList.prototype = Object.create(Window_Command.prototype);
    Window_LanguageList.prototype.constructor = Window_LanguageList;

    Window_LanguageList.prototype.initialize = function(x, y) {
        this._languages = languageManager.getLanguages();
        Window_Command.prototype.initialize.call(this, x, y);
        this.selectLanguage(languageManager.getCurrentLanguage());
    };

    Window_LanguageList.prototype.makeCommandList = function() {
        for (var i = 0; i < this._languages.length; i++) {
            var lang = this._languages[i];
            var name = languageManager.getLanguageName(lang);
            this.addCommand(name, lang);
        }
    };

    Window_LanguageList.prototype.currentLanguage = function() {
        return this._languages[this.index()];
    };

    Window_LanguageList.prototype.selectLanguage = function(lang) {
        var index = this._languages.indexOf(lang);
        if (index >= 0) {
            this.select(index);
        }
    };

    // ============================================================================
    // ДОБАВЛЕНИЕ КНОПКИ ЯЗЫКА В ТИТУЛЬНОЕ МЕНЮ
    // ============================================================================

    // Добавляем команду "Язык" в титульное меню
    var _Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList;
    Window_TitleCommand.prototype.makeCommandList = function() {
        _Window_TitleCommand_makeCommandList.call(this);
        // Добавляем команду языка после "Настройки"
        this.addCommand(languageManager.translate('menu', 'language'), 'language');
    };

    // Добавляем обработчик в Scene_Title
    var _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function() {
        _Scene_Title_createCommandWindow.call(this);
        this._commandWindow.setHandler('language', this.commandLanguage.bind(this));
    };

    Scene_Title.prototype.commandLanguage = function() {
        SceneManager.push(Scene_LanguageSelect);
    };

    // ============================================================================
    // ДОБАВЛЕНИЕ КНОПКИ ЯЗЫКА В ИГРОВЕО МЕНЮ (Опционально)
    // ============================================================================

    if (showLanguageButton) {
        var _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
        Window_MenuCommand.prototype.makeCommandList = function() {
            _Window_MenuCommand_makeCommandList.call(this);
            this.addCommand(languageManager.translate('menu', 'language'), 'language');
        };

        var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
        Scene_Menu.prototype.createCommandWindow = function() {
            _Scene_Menu_createCommandWindow.call(this);
            this._commandWindow.setHandler('language', this.commandLanguage.bind(this));
        };

        Scene_Menu.prototype.commandLanguage = function() {
            SceneManager.push(Scene_LanguageSelect);
        };
    }

    // ============================================================================
    // ПЕРЕВОД КВЕСТОВ
    // ============================================================================

    // Переопределяем получение текста квеста
    window.ACTPO_GetQuestText = function(variableId, step) {
        var chapter = Math.floor(variableId / 10);
        return languageManager.getQuestText(chapter, step);
    };

    // ============================================================================
    // ПЕРЕВОД ДИАЛОГОВ (через коды в тексте)
    // ============================================================================

    var _Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    Window_Base.prototype.convertEscapeCharacters = function(text) {
        text = _Window_Base_convertEscapeCharacters.call(this, text);
        
        // Обработка кодов \t[category][key] для перевода
        text = text.replace(/\\t\[([a-z_0-9]+)\]\[([a-z_0-9]+)\]/gi, function(match, category, key) {
            return languageManager.translate(category, key);
        });
        
        // Обработка кодов \lang[ru]текст\lang[end]
        // Сначала собираем все блоки \lang[...]...\lang[end]
        var currentLang = languageManager.getCurrentLanguage();
        var regex = /\\lang\[([a-z]+)\]([\s\S]*?)(?=\\lang\[|$)/gi;
        var result = '';
        var lastIndex = 0;
        var match;
        
        while ((match = regex.exec(text)) !== null) {
            // Добавляем текст до совпадения
            result += text.substring(lastIndex, match.index);
            lastIndex = regex.lastIndex;
            
            var lang = match[1].toLowerCase();
            var content = match[2];
            
            // Убираем \lang[end] из контента если есть
            content = content.replace(/\\lang\[end\]/gi, '');
            
            // Если язык совпадает с текущим, добавляем контент
            if (lang === currentLang) {
                result += content;
            }
        }
        
        // Добавляем оставшийся текст
        result += text.substring(lastIndex);
        
        // Убираем все оставшиеся коды \lang[...]
        result = result.replace(/\\lang\[[a-z]+\]/gi, '');
        result = result.replace(/\\lang\[end\]/gi, '');
        
        return result;
    };

    // Также применяем к Window_Message для диалогов
    var _Window_Message_convertEscapeCharacters = Window_Message.prototype.convertEscapeCharacters;
    Window_Message.prototype.convertEscapeCharacters = function(text) {
        text = _Window_Message_convertEscapeCharacters.call(this, text);
        
        // Обработка кодов \t[category][key] для перевода
        text = text.replace(/\\t\[([a-z_0-9]+)\]\[([a-z_0-9]+)\]/gi, function(match, category, key) {
            return languageManager.translate(category, key);
        });
        
        // Обработка кодов \lang[ru]текст\lang[end]
        var currentLang = languageManager.getCurrentLanguage();
        var regex = /\\lang\[([a-z]+)\]([\s\S]*?)(?=\\lang\[|$)/gi;
        var result = '';
        var lastIndex = 0;
        var match;
        
        while ((match = regex.exec(text)) !== null) {
            result += text.substring(lastIndex, match.index);
            lastIndex = regex.lastIndex;
            
            var lang = match[1].toLowerCase();
            var content = match[2];
            content = content.replace(/\\lang\[end\]/gi, '');
            
            if (lang === currentLang) {
                result += content;
            }
        }
        
        result += text.substring(lastIndex);
        result = result.replace(/\\lang\[[a-z]+\]/gi, '');
        result = result.replace(/\\lang\[end\]/gi, '');
        
        return result;
    };

    // ============================================================================
    // ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ ПЛАГИНАХ
    // ============================================================================

    window.ACTPO_LanguageManager = languageManager;
    window.ACTPO_Scene_LanguageSelect = Scene_LanguageSelect;
    window.ACTPO_Window_LanguageList = Window_LanguageList;

})();
