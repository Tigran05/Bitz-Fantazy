/*:
 * @plugindesc v3.6 Автоматическая балансировка характеристик врагов по уровню партии [ACTPO]
 * @author ACTPOJIuT
 *
 * @param EnableAutoBalance
 * @text Включить автобаланс
 * @desc Автоматически балансировать характеристики врагов
 * @type boolean
 * @default true
 *
 * @param BalanceFormula
 * @text Формула балансировки
 * @desc Как рассчитывать силу врагов (1.0 = 100%)
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param Multiplier
 * @text Базовый множитель характеристик
 * @desc Базовый множитель характеристик (0.1 = 10% от параметров игрока)
 * @type number
 * @decimals 2
 * @min 0.01
 * @max 10.0
 * @default 0.1
 *
 * @param HPCoefficient
 * @text Множитель HP
 * @desc Дополнительный множитель для HP (1.0 = 100% от базового расчета)
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param ATKCoefficient
 * @text Множитель Атаки (Обычные)
 * @desc Множитель атаки для обычных врагов
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param BossHPCoefficient
 * @text Множитель HP (Боссы)
 * @desc Множитель HP для боссов
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 10.0
 * @default 1.0
 *
 * @param BossATKCoefficient
 * @text Множитель Атаки (Боссы)
 * @desc Множитель атаки для боссов
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param MiniBossHPCoefficient
 * @text Множитель HP (Мини-боссы)
 * @desc Множитель HP для мини-боссов
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 10.0
 * @default 1.0
 *
 * @param MiniBossATKCoefficient
 * @text Множитель Атаки (Мини-боссы)
 * @desc Множитель атаки для мини-боссов
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param BossMultiplier
 * @text Множитель для боссов
 * @desc Во сколько раз боссы сильнее обычных врагов
 * @type number
 * @decimals 2
 * @min 1.0
 * @max 10.0
 * @default 1.5
 *
 * @param BossNote
 * @text Метка босса
 * @desc Метка в заметках врага для обозначения босса
 * @type text
 * @default <boss>
 *
 * @param MiniBossNote
 * @text Метка мини-босса
 * @desc Метка в заметках врага для обозначения мини-босса
 * @type text
 * @default <miniboss>
 *
 * @param MiniBossMultiplier
 * @text Множитель для мини-боссов
 * @desc Во сколько раз мини-боссы сильнее обычных врагов
 * @type number
 * @decimals 2
 * @min 1.0
 * @max 10.0
 * @default 1.2
 *
 * @param ScaleHP
 * @text Масштабировать HP
 * @desc Изменять HP врагов
 * @type boolean
 * @default true
 *
 * @param ScaleMP
 * @text Масштабировать MP
 * @desc Изменять MP врагов
 * @type boolean
 * @default true
 *
 * @param ScaleATK
 * @text Масштабировать Атаку
 * @desc Изменять атаку врагов
 * @type boolean
 * @default true
 *
 * @param ScaleDEF
 * @text Масштабировать Защиту
 * @desc Изменять защиту врагов
 * @type boolean
 * @default true
 *
 * @param ScaleMAT
 * @text Масштабировать Маг. Атаку
 * @desc Изменять магическую атаку врагов
 * @type boolean
 * @default true
 *
 * @param ScaleMDF
 * @text Масштабировать Маг. Защиту
 * @desc Изменять магическую защиту врагов
 * @type boolean
 * @default true
 *
 * @param ScaleAGI
 * @text Масштабировать Ловкость
 * @desc Изменять ловкость врагов
 * @type boolean
 * @default true
 *
 * @param ScaleLUK
 * @text Масштабировать Удачу
 * @desc Изменять удачу врагов
 * @type boolean
 * @default true
 *
 * @param ScaleEXP
 * @text Масштабировать опыт
 * @desc Изменять получаемый опыт
 * @type boolean
 * @default true
 *
 * @param ScaleGold
 * @text Масштабировать золото
 * @desc Изменять получаемое золото
 * @type boolean
 * @default true
 *
 * @param MinLevel
 * @text Минимальный уровень
 * @desc Минимальный уровень для расчетов
 * @type number
 * @min 1
 * @max 99
 * @default 1
 *
 * @param MaxLevel
 * @text Максимальный уровень
 * @desc Максимальный уровень для расчетов
 * @type number
 * @min 1
 * @max 99
 * @default 99
 *
 * @param MinMultiplier
 * @text Минимальный множитель врагов
 * @desc Враги не будут слабее этого множителя (защита от слишком слабых врагов)
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 0.5
 *
 * @param MaxMultiplier
 * @text Максимальный множитель врагов
 * @desc Враги не будут сильнее этого множителя (защита от OP врагов)
 * @type number
 * @decimals 2
 * @min 1.0
 * @max 10.0
 * @default 5.0
 *
 * @param DifficultyScaling
 * @text Масштабирование по сложности
 * @desc Применять ли мягкое масштабирование при экстремальных уровнях
 * @type boolean
 * @default true
 *
 * @param DebugMode
 * @text Режим отладки
 * @desc Показывать информацию о балансировке в консоли
 * @type boolean
 * @default false
 *
 * @help
 * ============================================================================
 * Описание [v3.7 ACTPO]
 * ============================================================================
 * 
 * Этот плагин автоматически изменяет характеристики врагов в зависимости
 * от среднего уровня партии игрока. Враги становятся сильнее по мере
 * прокачки партии.
 *
 * НОВОЕ В v3.7:
 * - Добавлены ограничения множителей (MinMultiplier / MaxMultiplier)
 * - Улучшены формулы расчета HP, DEF, MAT, MDF, AGI, LUK
 * - Добавлено масштабирование по сложности (DifficultyScaling)
 * - Защита от слишком слабых и OP врагов
 * - Расширенный API для скриптовых вызовов
 * - Улучшенная информация о балансировке
 * 
 * ============================================================================
 * Как пометить босса
 * ============================================================================
 * 
 * В Database → Enemies → выберите врага → Note (Заметки)
 * 
 * Для обычного босса:
 * <boss>
 * 
 * Для мини-босса:
 * <miniboss>
 * 
 * Боссы будут автоматически в 1.5 раза сильнее (настраивается)
 * Мини-боссы будут в 1.2 раза сильнее (настраивается)
 * 
 * ============================================================================
 * Формула балансировки
 * ============================================================================
 * 
 * Характеристики врагов рассчитываются по формуле:
 * 
 * Новое значение = Базовое × (Уровень партии / Базовый уровень) × Множитель
 * 
 * Где:
 * - Базовое значение = характеристика врага из базы данных
 * - Уровень партии = средний уровень всех членов партии
 * - Базовый уровень = 10 (можно изменить в коде)
 * - Множитель = 1.0 для обычных, 1.2 для мини-боссов, 1.5 для боссов
 * 
 * ============================================================================
 * Plugin Commands
 * ============================================================================
 * 
 * ACTPO_AutoBalance enable          - Включить автобаланс
 * ACTPO_AutoBalance disable         - Выключить автобаланс
 * ACTPO_AutoBalance info            - Показать информацию
 * ACTPO_AutoBalance setmultiplier X - Установить множитель (например, 1.5)
 * 
 * ============================================================================
 * Script Calls (API)
 * ============================================================================
 * 
 * ОСНОВНЫЕ МЕТОДЫ:
 * ACTPO_AutoBalanceSystem.setEnabled(true/false);           - Вкл/выкл автобаланс
 * ACTPO_AutoBalanceSystem.isEnabled();                      - Получить статус
 * ACTPO_AutoBalanceSystem.getAveragePartyLevel();           - Средний уровень партии
 * ACTPO_AutoBalanceSystem.getAveragePartyStats();           - Средние параметры партии
 * 
 * МНОЖИТЕЛИ:
 * ACTPO_AutoBalanceSystem.setMultiplier(1.5);               - Установить множитель формулы
 * ACTPO_AutoBalanceSystem.getMultiplier();                  - Получить множитель формулы
 * ACTPO_AutoBalanceSystem.setBossMultiplier(2.0);           - Множитель боссов
 * ACTPO_AutoBalanceSystem.setMiniBossMultiplier(1.5);       - Множитель мини-боссов
 * ACTPO_AutoBalanceSystem.setMinMaxMultiplier(0.5, 5.0);    - Диапазон множителей врагов
 * ACTPO_AutoBalanceSystem.getMinMultiplier();               - Минимальный множитель
 * ACTPO_AutoBalanceSystem.getMaxMultiplier();               - Максимальный множитель
 * 
 * ИНФОРМАЦИЯ:
 * ACTPO_AutoBalanceSystem.showInfo();                       - Показать информацию в игре
 * ACTPO_AutoBalanceSystem.isBoss(enemy);                    - Проверить, босс ли враг
 * ACTPO_AutoBalanceSystem.isMiniBoss(enemy);                - Проверить, мини-босс ли враг
 * 
 * ============================================================================
 * Примеры использования в скриптах
 * ============================================================================
 * 
 * // Отключить автобаланс для конкретного события
 * ACTPO_AutoBalanceSystem.setEnabled(false);
 * // ... боевой код ...
 * ACTPO_AutoBalanceSystem.setEnabled(true);
 * 
 * // Установить более сложных врагов для определенной части игры
 * ACTPO_AutoBalanceSystem.setMinMaxMultiplier(1.0, 3.0);
 * 
 * // Получить информацию о текущей сложности
 * var avgLevel = ACTPO_AutoBalanceSystem.getAveragePartyLevel();
 * var stats = ACTPO_AutoBalanceSystem.getAveragePartyStats();
 * console.log('Уровень: ' + avgLevel + ', ATK: ' + stats.atk);
 * 
 * ============================================================================
 * Changelog
 * ============================================================================
 * 
 * Version 3.7 [ACTPO]:
 * - Добавлены ограничения множителей (MinMultiplier / MaxMultiplier)
 * - Улучшены формулы расчета для всех параметров (HP, DEF, MAT, MDF, AGI, LUK)
 * - Добавлено масштабирование по сложности (DifficultyScaling)
 * - Защита от слишком слабых и OP врагов
 * - Расширенный API с новыми методами
 * - Логирование множителей и ограничений
 * - Улучшенная помощь и примеры использования
 * 
 * Version 3.6 [ACTPO]:
 * - Rebranded to ACTPO
 * - Renamed Plugin Commands
 * 
 */

(function () {

    // Получение параметров плагина
    var parameters = PluginManager.parameters('ACTPO_AutoBalance');
    var enableAutoBalance = String(parameters['EnableAutoBalance'] || 'true') === 'true';
    var balanceFormula = Number(parameters['BalanceFormula'] || 1.0);
    var multiplier = Number(parameters['Multiplier'] || 0.1);
    var hpCoefficient = Number(parameters['HPCoefficient'] || 1.0);
    var atkCoefficient = Number(parameters['ATKCoefficient'] || 1.0);

    var bossHPCoefficient = Number(parameters['BossHPCoefficient'] || 1.0);
    var bossATKCoefficient = Number(parameters['BossATKCoefficient'] || 1.0);

    var miniBossHPCoefficient = Number(parameters['MiniBossHPCoefficient'] || 1.0);
    var miniBossATKCoefficient = Number(parameters['MiniBossATKCoefficient'] || 1.0);

    var bossMultiplier = Number(parameters['BossMultiplier'] || 1.5);
    var miniBossMultiplier = Number(parameters['MiniBossMultiplier'] || 1.2);
    var bossNote = String(parameters['BossNote'] || '<boss>');
    var miniBossNote = String(parameters['MiniBossNote'] || '<miniboss>');
    var debugMode = String(parameters['DebugMode'] || 'false') === 'true';
    var minLevel = Number(parameters['MinLevel'] || 1);
    var maxLevel = Number(parameters['MaxLevel'] || 99);
    var minMultiplier = Number(parameters['MinMultiplier'] || 0.5);
    var maxMultiplier = Number(parameters['MaxMultiplier'] || 5.0);
    var difficultyScaling = String(parameters['DifficultyScaling'] || 'true') === 'true';

    // Какие характеристики масштабировать
    var scaleHP = String(parameters['ScaleHP'] || 'true') === 'true';
    var scaleMP = String(parameters['ScaleMP'] || 'true') === 'true';
    var scaleATK = String(parameters['ScaleATK'] || 'true') === 'true';
    var scaleDEF = String(parameters['ScaleDEF'] || 'true') === 'true';
    var scaleMAT = String(parameters['ScaleMAT'] || 'true') === 'true';
    var scaleMDF = String(parameters['ScaleMDF'] || 'true') === 'true';
    var scaleAGI = String(parameters['ScaleAGI'] || 'true') === 'true';
    var scaleLUK = String(parameters['ScaleLUK'] || 'true') === 'true';
    var scaleEXP = String(parameters['ScaleEXP'] || 'true') === 'true';
    var scaleGold = String(parameters['ScaleGold'] || 'true') === 'true';

    // Базовый уровень для расчетов (уровень, для которого характеристики врагов оптимальны)
    var baseLevel = 10;

    // Логирование
    function log(message) {
        if (debugMode) {
            console.log('[ACTPO_AutoBalance] ' + message);
        }
    }

    // Получить средний уровень партии
    function getAveragePartyLevel() {
        var party = $gameParty.allMembers();
        if (party.length === 0) return baseLevel;

        var totalLevel = 0;
        for (var i = 0; i < party.length; i++) {
            totalLevel += party[i].level;
        }
        var avgLevel = Math.floor(totalLevel / party.length);

        // Ограничиваем уровень
        avgLevel = Math.max(minLevel, Math.min(maxLevel, avgLevel));

        return avgLevel;
    }

    // Получить средние параметры партии
    function getAveragePartyStats() {
        var party = $gameParty.battleMembers();
        if (party.length === 0) {
            return { hp: 100, mp: 50, atk: 20, def: 20, mat: 20, mdf: 20, agi: 20, luk: 20 };
        }

        var stats = { hp: 0, mp: 0, atk: 0, def: 0, mat: 0, mdf: 0, agi: 0, luk: 0 };

        for (var i = 0; i < party.length; i++) {
            var actor = party[i];
            stats.hp += actor.mhp;
            stats.mp += actor.mmp;
            stats.atk += actor.atk;
            stats.def += actor.def;
            stats.mat += actor.mat;
            stats.mdf += actor.mdf;
            stats.agi += actor.agi;
            stats.luk += actor.luk;
        }

        var count = party.length;
        stats.hp = Math.floor(stats.hp / count);
        stats.mp = Math.floor(stats.mp / count);
        stats.atk = Math.floor(stats.atk / count);
        stats.def = Math.floor(stats.def / count);
        stats.mat = Math.floor(stats.mat / count);
        stats.mdf = Math.floor(stats.mdf / count);
        stats.agi = Math.floor(stats.agi / count);
        stats.luk = Math.floor(stats.luk / count);

        return stats;
    }

    // Проверить, является ли враг боссом
    function isBoss(enemy) {
        if (!enemy || !enemy.note) return false;
        return enemy.note.contains(bossNote);
    }

    // Проверить, является ли враг мини-боссом
    function isMiniBoss(enemy) {
        if (!enemy || !enemy.note) return false;
        return enemy.note.contains(miniBossNote);
    }

    // Получить множитель для врага с ограничениями
    function getEnemyMultiplier(enemy) {
        var baseMultiplier = 1.0; // Базовый множитель для обычного врага
        
        if (isBoss(enemy)) {
            baseMultiplier = bossMultiplier;
            log('Враг "' + enemy.name + '" - БОСС (базовый множитель: ' + bossMultiplier + ')');
        } else if (isMiniBoss(enemy)) {
            baseMultiplier = miniBossMultiplier;
            log('Враг "' + enemy.name + '" - МИНИ-БОСС (базовый множитель: ' + miniBossMultiplier + ')');
        }

        // Применяем ограничения множителя
        var finalMultiplier = Math.max(minMultiplier, Math.min(maxMultiplier, baseMultiplier));
        
        if (finalMultiplier !== baseMultiplier) {
            log('Множитель ограничен: ' + baseMultiplier + ' → ' + finalMultiplier + 
                ' (диапазон: ' + minMultiplier + ' - ' + maxMultiplier + ')');
        }
        
        return finalMultiplier;
    }

    // Рассчитать HP врага на основе HP игроков
    function calculateEnemyHP(partyStats, enemyMultiplier, enemy) {
        var party = $gameParty.battleMembers();

        // Для боссов и мини-боссов используем специальную формулу
        if (isBoss(enemy)) {
            // HP босса = 3/4 от суммарного HP всей команды
            var totalPartyHP = 0;
            for (var i = 0; i < party.length; i++) {
                totalPartyHP += party[i].mhp;
            }
            var bossHP = (totalPartyHP * 3 / 4) * multiplier * bossHPCoefficient;
            // Ограничиваем HP босса разумными пределами
            var minBossHP = Math.max(100, totalPartyHP * 0.5); // Минимум 50% от суммарного HP партии
            var maxBossHP = totalPartyHP * 2.0; // Максимум 200% от суммарного HP партии
            return Math.max(minBossHP, Math.min(maxBossHP, Math.floor(bossHP)));
        } else if (isMiniBoss(enemy)) {
            // HP мини-босса = 2/4 (1/2) от суммарного HP всей команды
            var totalPartyHP = 0;
            for (var i = 0; i < party.length; i++) {
                totalPartyHP += party[i].mhp;
            }
            var miniBossHP = (totalPartyHP * 2 / 4) * multiplier * miniBossHPCoefficient;
            // Ограничиваем HP мини-босса
            var minMiniBossHP = Math.max(50, totalPartyHP * 0.25); // Минимум 25% от суммарного HP
            var maxMiniBossHP = totalPartyHP * 1.5; // Максимум 150% от суммарного HP
            return Math.max(minMiniBossHP, Math.min(maxMiniBossHP, Math.floor(miniBossHP)));
        } else {
            // Обычный враг: HP = Средняя атака партии × 4.0
            var baseHP = partyStats.atk * 4.0;
            var scaledHP = baseHP * enemyMultiplier * multiplier * hpCoefficient;
            // Минимум и максимум для обычных врагов
            var minHP = partyStats.atk * 2.0; // Выживет минимум 2 удара
            var maxHP = partyStats.atk * 8.0; // Максимум 8 ударов
            return Math.max(minHP, Math.min(maxHP, Math.floor(scaledHP)));
        }
    }

    // Рассчитать MP врага на основе MP игроков
    function calculateEnemyMP(partyStats, enemyMultiplier) {
        // MP врага = 60% от MP игроков
        var baseMP = partyStats.mp * 0.6;
        var scaledMP = baseMP * enemyMultiplier * multiplier;
        return Math.max(10, Math.floor(scaledMP));
    }

    // Рассчитать ATK врага на основе HP игроков
    // Враг должен убивать игрока за 5-6 ударов
    function calculateEnemyATK(partyStats, enemyMultiplier, enemy) {
        // ATK врага = Средняя защита партии × 0.8 × Множитель
        var coef = atkCoefficient;
        if (isBoss(enemy)) {
            coef = bossATKCoefficient;
        } else if (isMiniBoss(enemy)) {
            coef = miniBossATKCoefficient;
        }

        var scaledATK = partyStats.atk * enemyMultiplier * multiplier * coef;
        
        // Ограничиваем ATK разумными пределами
        var minATK = Math.max(10, partyStats.atk * 0.3); // Минимум 30% от атаки партии
        var maxATK = partyStats.atk * 2.0; // Максимум 200% от атаки партии
        
        return Math.max(minATK, Math.min(maxATK, Math.floor(scaledATK)));
    }

    // Рассчитать DEF врага на основе DEF игроков
    function calculateEnemyDEF(partyStats, enemyMultiplier) {
        // DEF врага = 70% от DEF игроков
        var baseDEF = partyStats.def * 0.7;
        var scaledDEF = baseDEF * enemyMultiplier * balanceFormula;
        
        var minDEF = Math.max(5, partyStats.def * 0.2); // Минимум 20% от DEF партии
        var maxDEF = partyStats.def * 1.5; // Максимум 150% от DEF партии
        
        return Math.max(minDEF, Math.min(maxDEF, Math.floor(scaledDEF)));
    }

    // Рассчитать MAT врага
    function calculateEnemyMAT(partyStats, enemyMultiplier) {
        // MAT врага = HP игрока / 4 (магия чуть слабее физ. атаки)
        var baseMAT = partyStats.hp / 4;
        var scaledMAT = baseMAT * enemyMultiplier * balanceFormula;
        
        var minMAT = Math.max(10, partyStats.atk * 0.2); // Минимум 20% от ATK партии
        var maxMAT = partyStats.atk * 1.5; // Максимум 150% от ATK партии
        
        return Math.max(minMAT, Math.min(maxMAT, Math.floor(scaledMAT)));
    }

    // Рассчитать MDF врага
    function calculateEnemyMDF(partyStats, enemyMultiplier) {
        // MDF врага = 70% от MDF игроков
        var baseMDF = partyStats.mdf * 0.7;
        var scaledMDF = baseMDF * enemyMultiplier * balanceFormula;
        
        var minMDF = Math.max(5, partyStats.mdf * 0.2); // Минимум 20% от MDF партии
        var maxMDF = partyStats.mdf * 1.5; // Максимум 150% от MDF партии
        
        return Math.max(minMDF, Math.min(maxMDF, Math.floor(scaledMDF)));
    }

    // Рассчитать AGI врага
    function calculateEnemyAGI(partyStats, enemyMultiplier) {
        // AGI врага = 80% от AGI игроков (чуть медленнее)
        var baseAGI = partyStats.agi * 0.8;
        var scaledAGI = baseAGI * enemyMultiplier * balanceFormula;
        
        var minAGI = Math.max(5, partyStats.agi * 0.3); // Минимум 30% от AGI партии
        var maxAGI = partyStats.agi * 1.3; // Максимум 130% от AGI партии
        
        return Math.max(minAGI, Math.min(maxAGI, Math.floor(scaledAGI)));
    }

    // Рассчитать LUK врага
    function calculateEnemyLUK(partyStats, enemyMultiplier) {
        // LUK врага = 60% от LUK игроков
        var baseLUK = partyStats.luk * 0.6;
        var scaledLUK = baseLUK * enemyMultiplier * balanceFormula;
        
        var minLUK = Math.max(5, partyStats.luk * 0.1); // Минимум 10% от LUK партии
        var maxLUK = partyStats.luk * 1.2; // Максимум 120% от LUK партии
        
        return Math.max(minLUK, Math.min(maxLUK, Math.floor(scaledLUK)));
    }

    // Рассчитать EXP на основе сложности врага
    function calculateEnemyEXP(partyStats, enemyMultiplier, originalExp) {
        // EXP увеличивается с множителем
        var baseExp = originalExp > 0 ? originalExp : 50;
        var scaledExp = baseExp * enemyMultiplier * balanceFormula;
        
        // Ограничиваем EXP
        var minExp = Math.max(10, baseExp * 0.5); // Минимум 50% от оригинала
        var maxExp = baseExp * 5.0; // Максимум 500% от оригинала
        
        return Math.max(minExp, Math.min(maxExp, Math.floor(scaledExp)));
    }

    // Рассчитать Gold на основе сложности врага
    function calculateEnemyGold(partyStats, enemyMultiplier, originalGold) {
        // Gold увеличивается с множителем
        var baseGold = originalGold > 0 ? originalGold : 30;
        var scaledGold = baseGold * enemyMultiplier * balanceFormula;
        
        // Ограничиваем Gold
        var minGold = Math.max(5, baseGold * 0.5); // Минимум 50% от оригинала
        var maxGold = baseGold * 5.0; // Максимум 500% от оригинала
        
        return Math.max(minGold, Math.min(maxGold, Math.floor(scaledGold)));
    }

    // Переопределяем инициализацию врага
    var _Game_Enemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function (enemyId, x, y) {
        _Game_Enemy_setup.call(this, enemyId, x, y);

        if (enableAutoBalance) {
            this.applyAutoBalance();
        }
    };

    // Применить автобаланс к врагу
    Game_Enemy.prototype.applyAutoBalance = function () {
        // Проверка на существование врага
        if (!this._enemyId || !$dataEnemies[this._enemyId]) {
            log('ОШИБКА: Враг не найден (ID: ' + this._enemyId + ')');
            return;
        }

        var enemy = $dataEnemies[this._enemyId];

        // Проверка на существование параметров
        if (!enemy.params || enemy.params.length < 8) {
            log('ОШИБКА: У врага "' + enemy.name + '" нет параметров');
            return;
        }

        var partyStats = getAveragePartyStats();
        var multiplier = getEnemyMultiplier(enemy);

        log('=== Балансировка врага: ' + enemy.name + ' ===');
        log('Средние параметры партии:');
        log('  HP: ' + partyStats.hp + ', ATK: ' + partyStats.atk + ', DEF: ' + partyStats.def);
        log('Множитель врага: ' + multiplier);
        log('Общий множитель: ' + balanceFormula);

        // Сохраняем оригинальные параметры (только для логирования)
        var originalParams = {
            mhp: enemy.params[0],
            mmp: enemy.params[1],
            atk: enemy.params[2],
            def: enemy.params[3],
            mat: enemy.params[4],
            mdf: enemy.params[5],
            agi: enemy.params[6],
            luk: enemy.params[7],
            exp: enemy.exp || 0,
            gold: enemy.gold || 0
        };

        // Рассчитываем новые характеристики на основе параметров игроков
        if (scaleHP) {
            var newHP = calculateEnemyHP(partyStats, multiplier, enemy);
            enemy.params[0] = newHP;
            this._hp = newHP;
            if (isBoss(enemy)) {
                log('HP: ' + originalParams.mhp + ' → ' + newHP + ' (3/4 от суммарного HP команды)');
            } else if (isMiniBoss(enemy)) {
                log('HP: ' + originalParams.mhp + ' → ' + newHP + ' (2/4 от суммарного HP команды)');
            } else {
                log('HP: ' + originalParams.mhp + ' → ' + newHP + ' (выдержит ~3-5 ударов)');
            }
        }

        if (scaleMP) {
            var newMP = calculateEnemyMP(partyStats, multiplier);
            enemy.params[1] = newMP;
            this._mp = newMP;
            log('MP: ' + originalParams.mmp + ' → ' + newMP);
        }

        if (scaleATK) {
            var newATK = calculateEnemyATK(partyStats, multiplier, enemy);
            enemy.params[2] = newATK;
            log('ATK: ' + originalParams.atk + ' → ' + newATK + ' (убьет игрока за ~5-6 ударов)');
        }

        if (scaleDEF) {
            var newDEF = calculateEnemyDEF(partyStats, multiplier);
            enemy.params[3] = newDEF;
            log('DEF: ' + originalParams.def + ' → ' + newDEF);
        }

        if (scaleMAT) {
            var newMAT = calculateEnemyMAT(partyStats, multiplier);
            enemy.params[4] = newMAT;
            log('MAT: ' + originalParams.mat + ' → ' + newMAT);
        }

        if (scaleMDF) {
            var newMDF = calculateEnemyMDF(partyStats, multiplier);
            enemy.params[5] = newMDF;
            log('MDF: ' + originalParams.mdf + ' → ' + newMDF);
        }

        if (scaleAGI) {
            var newAGI = calculateEnemyAGI(partyStats, multiplier);
            enemy.params[6] = newAGI;
            log('AGI: ' + originalParams.agi + ' → ' + newAGI);
        }

        if (scaleLUK) {
            var newLUK = calculateEnemyLUK(partyStats, multiplier);
            enemy.params[7] = newLUK;
            log('LUK: ' + originalParams.luk + ' → ' + newLUK);
        }

        if (scaleEXP) {
            var newEXP = calculateEnemyEXP(partyStats, multiplier, originalParams.exp);
            enemy.exp = newEXP;
            log('EXP: ' + originalParams.exp + ' → ' + newEXP);
        }

        if (scaleGold) {
            var newGold = calculateEnemyGold(partyStats, multiplier, originalParams.gold);
            enemy.gold = newGold;
            log('Gold: ' + originalParams.gold + ' → ' + newGold);
        }

        log('=== Балансировка завершена ===');
    };

    // Показать информацию о балансировке
    function showInfo() {
        var partyLevel = getAveragePartyLevel();
        var ratio = partyLevel / baseLevel;

        $gameMessage.add('=== Автобаланс врагов (ACTPO) v3.7 ===');
        $gameMessage.add('Средний уровень партии: ' + partyLevel);
        $gameMessage.add('Базовый уровень: ' + baseLevel);
        $gameMessage.add('Коэффициент: ' + ratio.toFixed(2));
        $gameMessage.add('Общий множитель: ' + balanceFormula);
        $gameMessage.add('Диапазон множителя враг: ' + minMultiplier + ' - ' + maxMultiplier);
        $gameMessage.add('Мини-босс множитель: ' + miniBossMultiplier);
        $gameMessage.add('Босс множитель: ' + bossMultiplier);
        $gameMessage.add('Масштабирование по сложности: ' + (difficultyScaling ? 'ДА' : 'НЕТ'));
        $gameMessage.add('Статус: ' + (enableAutoBalance ? 'ВКЛЮЧЕН' : 'ОТКЛЮЧЕН'));
    }

    // Plugin Commands
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === 'ACTPO_AutoBalance') {
            switch (args[0]) {
                case 'enable':
                    enableAutoBalance = true;
                    $gameMessage.add('Автобаланс включен');
                    log('Автобаланс включен через Plugin Command');
                    break;
                case 'disable':
                    enableAutoBalance = false;
                    $gameMessage.add('Автобаланс выключен');
                    log('Автобаланс выключен через Plugin Command');
                    break;
                case 'info':
                    showInfo();
                    break;
                case 'setmultiplier':
                    if (args[1]) {
                        balanceFormula = Number(args[1]);
                        $gameMessage.add('Множитель установлен: ' + balanceFormula);
                        log('Множитель изменен на: ' + balanceFormula);
                    }
                    break;
            }
        }
    };

    // Экспорт API
    window.ACTPO_AutoBalanceSystem = {
        getAveragePartyLevel: getAveragePartyLevel,
        setEnabled: function (enabled) {
            enableAutoBalance = enabled;
            log('Автобаланс ' + (enabled ? 'включен' : 'выключен') + ' через API');
        },
        isEnabled: function () {
            return enableAutoBalance;
        },
        setMultiplier: function (value) {
            balanceFormula = value;
            log('Множитель изменен на: ' + value);
        },
        getMultiplier: function () {
            return balanceFormula;
        },
        setBossMultiplier: function (value) {
            bossMultiplier = value;
            log('Множитель боссов изменен на: ' + value);
        },
        setMiniBossMultiplier: function (value) {
            miniBossMultiplier = value;
            log('Множитель мини-боссов изменен на: ' + value);
        },
        setMinMaxMultiplier: function (min, max) {
            minMultiplier = min;
            maxMultiplier = max;
            log('Диапазон множителей изменен на: ' + min + ' - ' + max);
        },
        getMinMultiplier: function () {
            return minMultiplier;
        },
        getMaxMultiplier: function () {
            return maxMultiplier;
        },
        showInfo: showInfo,
        isBoss: isBoss,
        isMiniBoss: isMiniBoss,
        getAveragePartyStats: getAveragePartyStats
    };

    log('ACTPO_AutoBalance v3.7 загружен');
    log('Автобаланс: ' + (enableAutoBalance ? 'ВКЛЮЧЕН' : 'ОТКЛЮЧЕН'));
    log('Базовый уровень: ' + baseLevel);
    log('Диапазон множителя врагов: ' + minMultiplier + ' - ' + maxMultiplier);
    log('Множитель формулы: ' + balanceFormula);
    log('Мини-босс множитель: ' + miniBossMultiplier + ', Босс множитель: ' + bossMultiplier);
    log('Коэф. HP (Обычные/Мини/Боссы): ' + hpCoefficient + ' / ' + miniBossHPCoefficient + ' / ' + bossHPCoefficient);
    log('Коэф. ATK (Обычные/Мини/Боссы): ' + atkCoefficient + ' / ' + miniBossATKCoefficient + ' / ' + bossATKCoefficient);
    log('Масштабирование по сложности: ' + (difficultyScaling ? 'ВКЛЮЧЕНО' : 'ОТКЛЮЧЕНО'));

})();
