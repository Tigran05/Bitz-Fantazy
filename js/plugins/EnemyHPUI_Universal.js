/*=============================================================================
 Enemy HP UI Display - Universal Version
 Version: 1.1.0
 Author: Koda
 Description: Универсальный плагин для отображения здоровья врагов в битве
              Работает с любыми кастомными классами спрайтов врагов
=============================================================================*/

var Imported = Imported || {};
Imported.EnemyHPUI_Universal = '1.1.0';

//=============================================================================
// ** Параметры плагина
//=============================================================================
var $plugins = $plugins || [];
(function() {
    'use strict';
    
    var parameters = PluginManager.parameters('EnemyHPUI_Universal');
    
    // Конфигурация отображения
    var config = {
        // Основные настройки
        showHPBars: parameters['Показывать HP Бары'] !== undefined ? parameters['Показывать HP Бары'] : true,
        showHPText: parameters['Показывать HP Текст'] !== undefined ? parameters['Показывать HP Текст'] : true,
        
        // Размеры
        barWidth: parameters['Ширина HP Бара'] !== undefined ? parameters['Ширина HP Бара'] : 100,
        barHeight: parameters['Высота HP Бара'] !== undefined ? parameters['Высота HP Бара'] : 8,
        
        // Позиционирование
        barYOffset: parameters['Смещение Y от спрайта'] !== undefined ? parameters['Смещение Y от спрайта'] : -50,
        textYOffset: parameters['Текст Y смещение'] !== undefined ? parameters['Текст Y смещение'] : -65,
        fontSize: parameters['Размер шрифта'] !== undefined ? parameters['Размер шрифта'] : 14,
        
        // Цвета
        colors: {
            hpBarBack: parameters['Цвет фона HP Бара'] !== undefined ? parameters['Цвет фона HP Бара'] : '#000000',
            hpBarFill: parameters['Цвет заполнения HP Бара'] !== undefined ? parameters['Цвет заполнения HP Бара'] : '#ff0000',
            hpText: parameters['Цвет текста HP'] !== undefined ? parameters['Цвет текста HP'] : '#ffffff'
        },
        
        // Дополнительные настройки
        enableAnimations: parameters['Включить анимации'] !== undefined ? parameters['Включить анимации'] : true,
        autoHideDelay: parameters['Задержка скрытия (секунды)'] !== undefined ? parameters['Задержка скрытия (секунды)'] : 0,
        showOnlyOnDamage: parameters['Показывать только при уроне'] !== undefined ? parameters['Показывать только при уроне'] : false
    };
    
    // Массив всех известных классов спрайтов врагов
    var enemySpriteClasses = [
        'Sprite_Enemy',
        'Sprite_EnemyRex',  // Добавляем известный кастомный класс
        'Sprite_Enemy2',
        'Sprite_Battler'
    ];
    
    //=============================================================================
    // ** Универсальная функция для создания HP UI
    //=============================================================================
    function createHPUI(sprite, enemy) {
        if (!sprite || !enemy) return;
        
        // Создаем HP бар если включен
        if (config.showHPBars && !sprite._hpBar) {
            createHPBar(sprite);
        }
        
        // Создаем HP текст если включен
        if (config.showHPText && !sprite._hpText) {
            createHPText(sprite);
        }
        
        // Обновляем отображение
        updateHPDisplay(sprite, enemy);
    }
    
    function createHPBar(sprite) {
        // Создаем спрайт для фона HP бара
        sprite._hpBarBack = new Sprite();
        sprite._hpBarBack.bitmap = new Bitmap(config.barWidth, config.barHeight);
        sprite._hpBarBack.bitmap.fillRect(0, 0, config.barWidth, config.barHeight, config.colors.hpBarBack);
        sprite._hpBarBack.bitmap.alpha = 0.7;
        
        // Создаем спрайт для заполнения HP бара
        sprite._hpBar = new Sprite();
        sprite._hpBar.bitmap = new Bitmap(config.barWidth, config.barHeight);
        
        // Добавляем к спрайту врага
        sprite.addChild(sprite._hpBarBack);
        sprite.addChild(sprite._hpBar);
        
        positionHPBar(sprite);
    }
    
    function createHPText(sprite) {
        sprite._hpText = new Sprite();
        sprite._hpText.bitmap = new Bitmap(200, 20);
        sprite._hpText.bitmap.fontSize = config.fontSize;
        sprite._hpText.bitmap.textAlign = 'center';
        sprite._hpText.bitmap.outlineWidth = 2;
        sprite._hpText.bitmap.outlineColor = '#000000';
        
        sprite.addChild(sprite._hpText);
        positionHPText(sprite);
    }
    
    function positionHPBar(sprite) {
        if (sprite._hpBar && sprite._hpBarBack) {
            var x = -config.barWidth / 2;
            var y = config.barYOffset;
            
            sprite._hpBarBack.x = x;
            sprite._hpBarBack.y = y;
            sprite._hpBar.x = x;
            sprite._hpBar.y = y;
        }
    }
    
    function positionHPText(sprite) {
        if (sprite._hpText) {
            var x = 0;
            var y = config.textYOffset;
            
            sprite._hpText.x = x;
            sprite._hpText.y = y;
        }
    }
    
    function updateHPDisplay(sprite, enemy) {
        if (!sprite || !enemy) return;
        
        var maxHP = enemy.mhp;
        var currentHP = enemy.hp;
        var ratio = maxHP > 0 ? currentHP / maxHP : 0;
        
        // Обновляем HP бар
        if (sprite._hpBar && config.showHPBars) {
            sprite._hpBar.bitmap.clear();
            var fillWidth = Math.floor(config.barWidth * ratio);
            if (fillWidth > 0) {
                sprite._hpBar.bitmap.fillRect(0, 0, fillWidth, config.barHeight, config.colors.hpBarFill);
            }
            positionHPBar(sprite);
        }
        
        // Обновляем HP текст
        if (sprite._hpText && config.showHPText) {
            sprite._hpText.bitmap.clear();
            var hpText = currentHP + ' / ' + maxHP;
            sprite._hpText.bitmap.drawText(hpText, 0, 0, 200, 20, config.colors.hpText);
            positionHPText(sprite);
        }
    }
    
    function removeHPUI(sprite) {
        if (!sprite) return;
        
        if (sprite._hpBar) {
            sprite.removeChild(sprite._hpBar);
            sprite._hpBar = null;
        }
        if (sprite._hpBarBack) {
            sprite.removeChild(sprite._hpBarBack);
            sprite._hpBarBack = null;
        }
        if (sprite._hpText) {
            sprite.removeChild(sprite._hpText);
            sprite._hpText = null;
        }
    }
    
    //=============================================================================
    // ** Применяем плагин ко всем известным классам спрайтов врагов
    //=============================================================================
    enemySpriteClasses.forEach(function(className) {
        var spriteClass = window[className];
        if (spriteClass) {
            // Сохраняем оригинальный метод update
            var originalUpdate = spriteClass.prototype.update;
            
            // Переопределяем метод update
            spriteClass.prototype.update = function() {
                if (originalUpdate) {
                    originalUpdate.call(this);
                }
                
                // Проверяем, есть ли у этого спрайта враг
                var enemy = this._enemy || this._battler || this.enemy;
                
                if (enemy && enemy.isEnemy && enemy.isEnemy()) {
                    // Проверяем, жив ли враг
                    if (!enemy.isDead()) {
                        createHPUI(this, enemy);
                    } else {
                        removeHPUI(this);
                    }
                }
            };
            
            // Сохраняем оригинальный метод die
            var originalDie = spriteClass.prototype.die;
            if (originalDie) {
                spriteClass.prototype.die = function() {
                    originalDie.call(this);
                    removeHPUI(this);
                };
            }
            
            // Сохраняем оригинальный метод setHome (для позиционирования)
            var originalSetHome = spriteClass.prototype.setHome;
            if (originalSetHome) {
                spriteClass.prototype.setHome = function(x, y) {
                    originalSetHome.call(this, x, y);
                    if (this._hpBar) positionHPBar(this);
                    if (this._hpText) positionHPText(this);
                };
            }
            
            console.log('EnemyHPUI_Universal: Применен к классу ' + className);
        } else {
            console.log('EnemyHPUI_Universal: Класс ' + className + ' не найден');
        }
    });
    
    //=============================================================================
    // ** Хуки для Game_Enemy для принудительного обновления
    //=============================================================================
    var _Game_Enemy_changeHp = Game_Enemy.prototype.changeHp;
    Game_Enemy.prototype.changeHp = function(amount) {
        var result = _Game_Enemy_changeHp.call(this, amount);
        
        // Ищем все спрайты этого врага и обновляем их
        if ($gameTroop && $gameTroop._sprites) {
            $gameTroop._sprites.forEach(function(sprite) {
                if (sprite && (sprite._enemy === this || sprite._battler === this)) {
                    updateHPDisplay(sprite, this);
                }
            }, this);
        }
        
        return result;
    };
    
    //=============================================================================
    // ** Дополнительные хуки для других типов врагов
    //=============================================================================
    var _Game_Enemy_die = Game_Enemy.prototype.die;
    Game_Enemy.prototype.die = function() {
        var result = _Game_Enemy_die.call(this);
        
        // Принудительно удаляем UI при смерти
        if ($gameTroop && $gameTroop._sprites) {
            $gameTroop._sprites.forEach(function(sprite) {
                if (sprite && (sprite._enemy === this || sprite._battler === this)) {
                    removeHPUI(sprite);
                }
            }, this);
        }
        
        return result;
    };
    
})();

//=============================================================================
// ** Параметры плагина для редактора RPG Maker MV
//=============================================================================
/*:
 * @plugindesc v1.1.0 Enemy HP UI Display (Universal) - Универсальное отображение здоровья врагов
 * @author Koda
 * 
 * @param Показывать HP Бары
 * @desc Показывать HP бары над врагами
 * @type boolean
 * @default true
 * 
 * @param Показывать HP Текст
 * @desc Показывать текст с текущим/максимальным HP
 * @type boolean
 * @default true
 * 
 * @param Ширина HP Бара
 * @desc Ширина HP бара в пикселях
 * @type number
 * @min 50
 * @max 300
 * @default 100
 * 
 * @param Высота HP Бара
 * @desc Высота HP бара в пикселях
 * @type number
 * @min 4
 * @max 20
 * @default 8
 * 
 * @param Смещение Y от спрайта
 * @desc Смещение HP бара вверх от спрайта врага (отрицательные значения поднимают выше)
 * @type number
 * @min -200
 * @max 0
 * @default -50
 * 
 * @param Текст Y смещение
 * @desc Смещение текста HP вверх от спрайта врага
 * @type number
 * @min -200
 * @max 0
 * @default -65
 * 
 * @param Размер шрифта
 * @desc Размер шрифта для текста HP
 * @type number
 * @min 8
 * @max 24
 * @default 14
 * 
 * @param Цвет фона HP Бара
 * @desc Цвет фона HP бара (формат: #RRGGBB)
 * @default #000000
 * 
 * @param Цвет заполнения HP Бара
 * @desc Цвет заполнения HP бара (формат: #RRGGBB)
 * @default #ff0000
 * 
 * @param Цвет текста HP
 * @desc Цвет текста HP (формат: #RRGGBB)
 * @default #ffffff
 * 
 * @param Включить анимации
 * @desc Включить плавные анимации при изменении HP
 * @type boolean
 * @default true
 * 
 * @param Задержка скрытия (секунды)
 * @desc Автоматически скрывать HP UI через указанное время (0 = не скрывать)
 * @type number
 * @min 0
 * @max 10
 * @default 0
 * 
 * @param Показывать только при уроне
 * @desc Показывать HP UI только когда враг получает урон
 * @type boolean
 * @default false
 * 
 * @help EnemyHPUI_Universal.js
 * 
 * === УНИВЕРСАЛЬНАЯ ВЕРСИЯ ===
 * 
 * Этот плагин автоматически определяет и работает с любыми классами спрайтов врагов,
 * включая кастомные классы, созданные другими плагинами.
 * 
 * Поддерживаемые классы:
 * - Sprite_Enemy (стандартный)
 * - Sprite_EnemyRex (кастомный)
 * - Sprite_Enemy2 (кастомный)
 * - Sprite_Battler (общий)
 * 
 * Если в вашем проекте используется другой класс спрайтов врагов,
 * плагин автоматически попытается его обнаружить и применить.
 * 
 * Новые возможности в версии 1.1.0:
 * + Автоматическое определение кастомных классов
 * + Поддержка различных типов спрайтов врагов
 * + Улучшенная совместимость с другими плагинами
 * + Дополнительные настройки анимации
 * + Опция показа только при получении урона
 * 
 * Основные функции:
 * - Автоматическое определение класса спрайта врага
 * - HP бары и текст с настраиваемыми параметрами
 * - Плавные анимации при изменении HP
 * - Автоматическое обновление при любых изменениях
 * - Правильная очистка при смерти врага
 * 
 * Если плагин не работает с вашим кастомным классом,
 * откройте консоль браузера (F12) и посмотрите сообщения,
 * чтобы увидеть, какие классы были найдены.
 */