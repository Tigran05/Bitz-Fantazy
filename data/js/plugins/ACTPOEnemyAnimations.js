//=============================================================================
// ACTPOEnemyAnimations.js
// Version: 1.0.0 - ACTPO Полная система анимации врагов
//=============================================================================

var Imported = Imported || {};
Imported.ACTPOEnemyAnimations = true;
Imported.AnimatedSVEnemies = true; // Для совместимости

var ACTPO = ACTPO || {};
ACTPO.EA = ACTPO.EA || {};

/*:
 * @plugindesc v1.0.0 - ACTPO Система анимации врагов (SV спрайты + эффекты)
 * @author ACTPO
 *
 * @param Debug
 * @text Режим отладки
 * @type boolean
 * @desc Выводить информацию в консоль (F8)
 * @default false
 * 
 * @param No Movement
 * @text Отключить движение
 * @type boolean
 * @desc Враги не двигаются при атаке
 * @default false
 * 
 * @param Enemies Celebrate
 * @text Враги празднуют победу
 * @type boolean
 * @desc Враги празднуют при победе
 * @default true
 * 
 * @param SV Enemies Collapse
 * @text SV враги исчезают
 * @type boolean
 * @desc SV враги исчезают после смерти
 * @default true
 *
 * @help
 * ============================================================================
 * ACTPO СИСТЕМА АНИМАЦИИ ВРАГОВ v1.0.0
 * ============================================================================
 * 
 * ПРОСТО НАПИШИТЕ <sv animated> И ВСЁ ЗАРАБОТАЕТ!
 * 
 * ============================================================================
 * БАЗОВОЕ ИСПОЛЬЗОВАНИЕ
 * ============================================================================
 * 
 * <sv animated>
 *   - Враг использует SV спрайт (анимированный)
 *   - Файл: img/sv_actors/ИмяВрага.png
 *   - АВТОМАТИЧЕСКИ: тень, появление, смерть, все анимации!
 * 
 * Это ВСЁ что нужно! Враг будет:
 * - Ходить, атаковать, получать урон
 * - Иметь тень
 * - Плавно появляться
 * - Красиво умирать
 * 
 * ============================================================================
 * ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ (опционально)
 * ============================================================================
 * 
 * <sv motion: название>
 *   - Анимация атаки: swing (меч), thrust (копье), missile (лук), spell (магия)
 * 
 * <sv weapon: ID>
 *   - Добавить оружие
 * 
 * <boss aura>
 *   - Аура для босса
 * 
 * <shadow>
 *   - Тень (уже включена автоматически для SV)
 * 
 * ============================================================================
 * ПРИМЕРЫ
 * ============================================================================
 * 
 * Минимум (всё работает автоматически):
 * <sv animated>
 * 
 * С оружием:
 * <sv animated>
 * <sv weapon: 1>
 * 
 * Босс:
 * <sv animated>
 * <boss aura>
 * 
 * ============================================================================
 */

//=============================================================================
// Параметры
//=============================================================================

ACTPO.EA.Parameters = PluginManager.parameters('ACTPOEnemyAnimations');
ACTPO.EA.Debug = String(ACTPO.EA.Parameters['Debug']) === 'true';
ACTPO.EA.NoMovement = String(ACTPO.EA.Parameters['No Movement']) === 'true';
ACTPO.EA.Celebration = String(ACTPO.EA.Parameters['Enemies Celebrate']) === 'true';
ACTPO.EA.DoCollapse = String(ACTPO.EA.Parameters['SV Enemies Collapse']) === 'true';

ACTPO.EA.log = function (message) {
    if (ACTPO.EA.Debug) {
        console.log('[ACTPO-EA] ' + message);
    }
};

//=============================================================================
// Game_Enemy
//=============================================================================

ACTPO.EA.Game_Enemy_setup = Game_Enemy.prototype.setup;
Game_Enemy.prototype.setup = function (enemyId, x, y) {
    ACTPO.EA.Game_Enemy_setup.call(this, enemyId, x, y);
    this.initACTPOAnimations();
};

Game_Enemy.prototype.initACTPOAnimations = function () {
    var enemy = this.enemy();
    var note = enemy.note;

    // Параметры по умолчанию
    this._svAnimated = false;
    this._svMotion = 'thrust';
    this._svWeaponId = 0;
    this._svCollapse = ACTPO.EA.DoCollapse;
    this._svScale = 1.0;
    this._svWeaponScale = 0.0;
    this._svWeaponAnchor = [0.5, 1];
    this._svAnchor = [0.5, 1];
    this._hasShadow = false;
    this._hasAura = false;

    // Проверяем <sv animated>
    if (note.match(/<sv animated>/i)) {
        this._svAnimated = true;
        this._hasShadow = true; // АВТОМАТИЧЕСКИ добавляем тень

        ACTPO.EA.log(enemy.name + ' - SV анимация включена (авто: тень, эффекты)');
    }

    // Дополнительные параметры
    if (note.match(/<sv motion:\s*(\w+)>/i)) {
        this._svMotion = String(RegExp.$1).toLowerCase();
    }

    if (note.match(/<sv weapon:\s*(\d+)>/i)) {
        this._svWeaponId = parseInt(RegExp.$1);
    }

    if (note.match(/<sv weapon scale:\s*([\d.]+)>/i)) {
        this._svWeaponScale = parseFloat(RegExp.$1) - 1;
    }

    if (note.match(/<sv weapon anchor:\s*([\d.]+),\s*([\d.]+)>/i)) {
        this._svWeaponAnchor = [parseFloat(RegExp.$1), parseFloat(RegExp.$2)];
    }

    if (note.match(/<sv anchor:\s*([\d.]+),\s*([\d.]+)>/i)) {
        this._svAnchor = [parseFloat(RegExp.$1), parseFloat(RegExp.$2)];
    }

    if (note.match(/<collapse>/i)) {
        this._svCollapse = true;
    }

    if (note.match(/<no collapse>/i)) {
        this._svCollapse = false;
    }

    if (note.match(/<boss aura>/i) || note.match(/<boss>/i)) {
        this._hasAura = true;
    }

    if (note.match(/<shadow>/i)) {
        this._hasShadow = true;
    }
};

// Методы для SV врагов
Game_Enemy.prototype.weapons = function () {
    if (this._svAnimated && this._svWeaponId) {
        return [$dataWeapons[this._svWeaponId]];
    }
    return [];
};

Game_Enemy.prototype.performAttack = function () {
    if (this._svAnimated) {
        var weapons = this.weapons();
        var wtypeId = weapons[0] ? weapons[0].wtypeId : 0;
        var attackMotion = $dataSystem.attackMotions[wtypeId];
        if (attackMotion) {
            if (attackMotion.type === 0) {
                this.requestMotion('thrust');
            } else if (attackMotion.type === 1) {
                this.requestMotion('swing');
            } else if (attackMotion.type === 2) {
                this.requestMotion('missile');
            }
            this.startWeaponAnimation(attackMotion.weaponImageId);
        }
    }
};

Game_Enemy.prototype.performAction = function (action) {
    if (this._svAnimated) {
        Game_Battler.prototype.performAction.call(this, action);
    }
};

Game_Enemy.prototype.performDamage = function () {
    Game_Battler.prototype.performDamage.call(this);
    if (this._svAnimated) {
        this.requestMotion('damage');
    }
    SoundManager.playEnemyDamage();
    this.requestEffect('blink');
};

Game_Enemy.prototype.performEvasion = function () {
    Game_Battler.prototype.performEvasion.call(this);
    if (this._svAnimated) {
        this.requestMotion('evade');
    }
};

Game_Enemy.prototype.performMagicEvasion = function () {
    Game_Battler.prototype.performMagicEvasion.call(this);
    if (this._svAnimated) {
        this.requestMotion('evade');
    }
};

Game_Enemy.prototype.performCounter = function () {
    Game_Battler.prototype.performCounter.call(this);
    if (this._svAnimated) {
        this.performAttack();
    }
};

Game_Enemy.prototype.performVictory = function () {
    if (this._svAnimated && this.canMove()) {
        this.requestMotion('victory');
    }
};

Game_Enemy.prototype.actor = function () {
    return $dataEnemies[this._enemyId];
};

Game_Enemy.prototype.hasNoWeapons = function () {
    return !this._svAnimated || !this._svWeaponId;
};

// Празднование победы
if (ACTPO.EA.Celebration) {
    ACTPO.EA.BattleManager_processDefeat = BattleManager.processDefeat;
    BattleManager.processDefeat = function () {
        $gameTroop.performVictory();
        ACTPO.EA.BattleManager_processDefeat.call(this);
    };
}

Game_Troop.prototype.performVictory = function () {
    this.members().forEach(function (enemy) {
        if (enemy.isAlive()) {
            enemy.performVictory();
        }
    });
};

//=============================================================================
// Sprite_EnemySV - SV спрайт врага
//=============================================================================

function Sprite_EnemySV() {
    this.initialize.apply(this, arguments);
}

Sprite_EnemySV.prototype = Object.create(Sprite_Actor.prototype);
Sprite_EnemySV.prototype.constructor = Sprite_EnemySV;

Sprite_EnemySV.prototype.initialize = function (battler) {
    Sprite_Actor.prototype.initialize.call(this, battler);
};

Sprite_EnemySV.prototype.setBattler = function (battler) {
    Sprite_Battler.prototype.setBattler.call(this, battler);
    var changed = (battler !== this._actor);
    if (changed) {
        this._actor = battler;
        this._enemy = battler;
        if (battler) {
            this.setActorHome(battler.screenX(), battler.screenY());
        }
        this.startEntryMotion();
        this._stateSprite.setup(battler);

        // Создаем тень автоматически
        if (battler._hasShadow) {
            this.createShadow();
        }

        // Создаем ауру для боссов
        if (battler._hasAura) {
            this.createAura();
        }
    }
};

Sprite_EnemySV.prototype.setActorHome = function (x, y) {
    this._homeX = x;
    this._homeY = y;
    this.updatePosition();
};

Sprite_EnemySV.prototype.updateBitmap = function () {
    Sprite_Actor.prototype.updateBitmap.call(this);
    if (this._actor) {
        var name = this._actor.battlerName();
        var hue = this._actor.battlerHue();
        this._mainSprite.bitmap = ImageManager.loadSvActor(name, hue);
        this._mainSprite.scale.x = -this._actor._svScale;
        this._mainSprite.scale.y = this._actor._svScale;
        this._mainSprite.anchor.x = this._actor._svAnchor[0];
        this._mainSprite.anchor.y = this._actor._svAnchor[1];
    }
};

Sprite_EnemySV.prototype.setupWeaponAnimation = function () {
    if (this._weaponSprite) {
        Sprite_Actor.prototype.setupWeaponAnimation.call(this);
        var scale = this._actor._svScale + this._actor._svWeaponScale;
        this._weaponSprite.scale.x = -scale;
        this._weaponSprite.scale.y = scale;
        this._weaponSprite.anchor.x = this._actor._svWeaponAnchor[0];
        this._weaponSprite.anchor.y = this._actor._svWeaponAnchor[1];
    }
};

Sprite_EnemySV.prototype.stepForward = function () {
    if (!ACTPO.EA.NoMovement) {
        this.startMove(48, 0, 12);
    }
};

Sprite_EnemySV.prototype.stepBack = function () {
    if (!ACTPO.EA.NoMovement) {
        this.startMove(0, 0, 12);
    }
};

Sprite_EnemySV.prototype.startEffect = function (effectType) {
    this._effectType = effectType;
    switch (this._effectType) {
        case 'appear':
            this.startAppear();
            break;
        case 'disappear':
            this.startDisappear();
            break;
        case 'whiten':
            this.startWhiten();
            break;
        case 'blink':
            this.startBlink();
            break;
        case 'collapse':
            if (this._actor._svCollapse) this.startCollapse();
            break;
        case 'bossCollapse':
            this.startBossCollapse();
            break;
        case 'instantCollapse':
            this.startInstantCollapse();
            break;
    }
    this.revertToNormal();
};

// Тень
Sprite_EnemySV.prototype.createShadow = function () {
    if (this._shadowSprite) return;

    this._shadowSprite = new Sprite();
    this._shadowSprite.bitmap = new Bitmap(80, 24);
    this._shadowSprite.anchor.x = 0.5;
    this._shadowSprite.anchor.y = 0.5;
    this._shadowSprite.opacity = 100;
    this._shadowSprite.y = 40;

    var bitmap = this._shadowSprite.bitmap;
    var context = bitmap._context;
    var gradient = context.createRadialGradient(40, 12, 0, 40, 12, 40);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 80, 24);
    bitmap._setDirty();

    this.addChild(this._shadowSprite);
};

// Аура
Sprite_EnemySV.prototype.createAura = function () {
    if (this._auraSprite) return;

    this._auraSprite = new Sprite();
    this._auraSprite.bitmap = new Bitmap(240, 240);
    this._auraSprite.anchor.x = 0.5;
    this._auraSprite.anchor.y = 0.5;
    this._auraSprite.blendMode = 1;
    this._auraSprite.opacity = 120;

    var bitmap = this._auraSprite.bitmap;
    var centerX = 120;
    var centerY = 120;
    var color = [255, 50, 50]; // Красный

    for (var i = 0; i < 3; i++) {
        var radius = 100 - i * 20;
        for (var r = radius; r > 0; r -= 3) {
            var alpha = (1 - r / radius) * 0.2;
            var colorStr = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha + ')';
            bitmap.drawCircle(centerX, centerY, r, colorStr);
        }
    }

    this.addChild(this._auraSprite);
    this._auraFrame = 0;
};

ACTPO.EA.Sprite_EnemySV_update = Sprite_EnemySV.prototype.update;
Sprite_EnemySV.prototype.update = function () {
    Sprite_Actor.prototype.update.call(this);

    // Анимация ауры
    if (this._auraSprite) {
        this._auraFrame = (this._auraFrame || 0) + 1;
        var pulse = 1 + Math.sin(this._auraFrame / 25) * 0.15;
        this._auraSprite.scale.x = pulse;
        this._auraSprite.scale.y = pulse;
        this._auraSprite.rotation += 0.015;
    }
};

//=============================================================================
// Spriteset_Battle
//=============================================================================

ACTPO.EA.Spriteset_Battle_createEnemies = Spriteset_Battle.prototype.createEnemies;
Spriteset_Battle.prototype.createEnemies = function () {
    var enemies = $gameTroop.members();
    var sprites = [];

    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];

        if (enemy._svAnimated) {
            sprites[i] = new Sprite_EnemySV(enemy);
        } else {
            sprites[i] = new Sprite_Enemy(enemy);
        }
    }

    sprites.sort(this.compareEnemySprite.bind(this));
    for (var j = 0; j < sprites.length; j++) {
        this._battleField.addChild(sprites[j]);
    }
    this._enemySprites = sprites;
};

//=============================================================================
// Совместимость
//=============================================================================

// Алиас для совместимости с другими плагинами
var Sprite_EnemyRex = Sprite_EnemySV;

ACTPO.EA.log('ACTPO Enemy Animations v1.0.0 загружен!');
ACTPO.EA.log('Просто напишите <sv animated> и всё заработает!');
