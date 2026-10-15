/*:
 * @plugindesc Bitz Fantasy — событийная система ледяного лазера и зеркал
 * @author ASTROLIT GAMES
 *
 * @help
 * Работает на Map040, когда forest_city активен на шаге 4 журнала
 * (внутренний q.step === 3).
 *
 * ВАЖНО: все объекты создаются обычными событиями на карте. Координат
 * объектов в коде нет — плагин читает теги из поля Note каждого события.
 *
 * СОЗДАТЬ СОБЫТИЕ-ЛАЗЕР:
 *   Note: <BF_ICE_LASER dir=6>
 *   dir: 2 вниз, 4 влево, 6 вправо, 8 вверх.
 *   Лазер использует одну неподвижную картинку; направление меняется только
 *   в логике луча, поэтому спрайт не переключается на другую строку.
 *
 * СОЗДАТЬ СОБЫТИЕ-ЗЕРКАЛО:
 *   Note: <BF_ICE_MIRROR dir=2>
 *   dir: начальное положение — 2/4/6/8.
 *   Для визуального поворота назначьте $BF_Mirror.png. У листа четыре ряда:
 *   вниз, влево, вправо, вверх, как ожидает RPG Maker MV.
 *
 * ЛЕДЯНОЙ БЛОК:
 *   Note: <BF_ICE_MELT frames=120>
 *   После накопления указанного количества кадров луча включается Self Switch A.
 *   Сделайте вторую страницу с Self Switch A ON (например, без изображения).
 *
 * ЦЕЛЬ:
 *   Note: <BF_ICE_TARGET>
 *   Все цели на карте должны быть освещены лучами, а все ледяные блоки растаяны.
 *
 * КРИСТАЛЛ-НАГРАДА (ОТДЕЛЬНО ОТ ЛЕДЯНОГО БЛОКА):
 *   Создайте отдельное событие с Note: <BF_ICE_CRYSTAL>.
 *   Назначьте ему графику !Crystal (лист персонажа, индекс 3).
 *   Плагин скрывает кристалл до решения головоломки, затем делает его видимым
 *   и непроходимым. Подбор — отдельным нажатием Enter/Z или экранной кнопкой.
 *   Команды: BF_IceCrystal show | hide | status.
 *
 * УПРАВЛЕНИЕ:
 *   Подойдите к объекту, посмотрите на него и нажмите Enter или Z.
 *   Одно новое нажатие Enter/Z = один поворот. Удержание клавиши не прокручивает положения.
 *   Лазер визуально остаётся неизменным, направление показывает луч.
 *   Зеркало меняет графический ряд на каждом шаге поворота.
 *
 * Команда события для сброса пазла при тестировании:
 *   BF_IceLaser reset
 */
(function() {
    'use strict';

    var PUZZLE_MAP_ID = 40;
    var QUEST_ID = 'forest_city';
    var QUEST_STEP = 3;

    var TAG_LASER = 'BF_ICE_LASER';
    var TAG_MIRROR = 'BF_ICE_MIRROR';
    var TAG_MELT = 'BF_ICE_MELT';
    var TAG_TARGET = 'BF_ICE_TARGET';
    var TAG_CRYSTAL = 'BF_ICE_CRYSTAL';

    var DIRS = {
        2: { dx: 0, dy: 1 },
        4: { dx: -1, dy: 0 },
        6: { dx: 1, dy: 0 },
        8: { dx: 0, dy: -1 }
    };

    // Порядок вращения: вниз -> влево -> вверх -> вправо -> вниз.
    function nextDirection(dir) {
        return ({ 2: 4, 4: 8, 8: 6, 6: 2 })[Number(dir)] || 2;
    }

    function questActive() {
        var BF = window.BF_QuestSystem;
        if (!BF || typeof BF.game !== 'function') return false;
        var game = BF.game();
        var q = game && typeof game.get === 'function' ? game.get(QUEST_ID) : null;
        return !!(q && q.status === 'active' && Number(q.step) === QUEST_STEP);
    }

    function noteOf(event) {
        return event && typeof event.event === 'function' && event.event()
            ? String(event.event().note || '') : '';
    }

    function hasTag(event, tag) {
        var re = new RegExp('<\\s*' + tag + '(?=[\\s>])', 'i');
        return re.test(noteOf(event));
    }

    function noteNumber(note, key, fallback) {
        var re = new RegExp('(?:^|\\s)' + key + '\\s*=\\s*(-?\\d+)', 'i');
        var match = String(note || '').match(re);
        return match ? Number(match[1]) : fallback;
    }

    function isPuzzleObject(event) {
        return hasTag(event, TAG_LASER) || hasTag(event, TAG_MIRROR) ||
            hasTag(event, TAG_MELT) || hasTag(event, TAG_TARGET) || hasTag(event, TAG_CRYSTAL);
    }

    // Puzzle objects must never play RPG Maker's 3-frame walking animation.
    // We lock the pattern at frame 1 at the source, not one frame later in Scene_Map.
    var _bfIceBaseUpdatePattern = Game_CharacterBase.prototype.updatePattern;
    Game_Event.prototype.updatePattern = function() {
        if (isPuzzleObject(this)) {
            this._pattern = 1;
            this._animationCount = 0;
            return;
        }
        _bfIceBaseUpdatePattern.call(this);
    };

    // Tagged objects are stationary puzzle mechanisms, even if an event page was
    // accidentally left on Random/Approach movement.
    var _bfIceUpdateSelfMovement = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        if (isPuzzleObject(this)) return;
        _bfIceUpdateSelfMovement.call(this);
    };

    function puzzleEvents() {
        var found = { lasers: [], mirrors: [], melts: [], targets: [], crystals: [] };
        if (!$gameMap || $gameMap.mapId() !== PUZZLE_MAP_ID) return found;

        $gameMap.events().forEach(function(event) {
            if (!event || !event.event()) return;
            var note = noteOf(event);

            if (hasTag(event, TAG_LASER)) {
                found.lasers.push({
                    event: event,
                    initialDir: noteNumber(note, 'dir', event.direction())
                });
            }
            if (hasTag(event, TAG_MIRROR)) {
                found.mirrors.push({
                    event: event,
                    initialDir: noteNumber(note, 'dir', event.direction())
                });
            }
            if (hasTag(event, TAG_MELT)) {
                found.melts.push({
                    event: event,
                    frames: Math.max(1, noteNumber(note, 'frames', 120))
                });
            }
            if (hasTag(event, TAG_TARGET)) found.targets.push({ event: event });
            if (hasTag(event, TAG_CRYSTAL)) found.crystals.push({ event: event });
        });
        return found;
    }

    function puzzleState() {
        if (!$gameSystem) return null;
        if (!$gameSystem._bfIceLaserState || typeof $gameSystem._bfIceLaserState !== 'object') {
            $gameSystem._bfIceLaserState = {};
        }
        var s = $gameSystem._bfIceLaserState;
        if (!s.lasers || typeof s.lasers !== 'object') s.lasers = {};
        if (!s.mirrors || typeof s.mirrors !== 'object') s.mirrors = {};
        if (!s.mirrorVisuals || typeof s.mirrorVisuals !== 'object') s.mirrorVisuals = {};
        if (!s.melt || typeof s.melt !== 'object') s.melt = {};
        if (typeof s.solved !== 'boolean') s.solved = false;
        if (typeof s.crystalCollected !== 'boolean') s.crystalCollected = false;
        if (typeof s.crystalForcedVisible !== 'boolean') s.crystalForcedVisible = false;
        if (!isFinite(Number(s.lastRotateAt))) s.lastRotateAt = 0;
        if (typeof s.actionLatched !== 'boolean') s.actionLatched = false;
        return s;
    }

    function freezeEventAnimation(event) {
        if (!event) return;
        if (event.setWalkAnime) event.setWalkAnime(false);
        if (event.setStepAnime) event.setStepAnime(false);
        event._originalPattern = 1;
        event._pattern = 1;
        event._animationCount = 0;
    }

    function setLockedDirection(event, dir) {
        if (!event || !DIRS[Number(dir)]) return;
        dir = Number(dir);
        // Unlock first: MV's setDirection() does nothing while direction-fix is ON.
        if (event.setDirectionFix) event.setDirectionFix(false);
        if (event.direction() !== dir) event.setDirection(dir);
        // Keep the row explicit as well, so a previously direction-fixed event
        // cannot remain visually stuck on the down row of the character sheet.
        event._direction = dir;
        if (event.setDirectionFix) event.setDirectionFix(true);
        freezeEventAnimation(event);
    }

    function prepareObjects(data) {
        var s = puzzleState();
        if (!s) return;

        data.lasers.forEach(function(item) {
            var id = String(item.event.eventId());
            var dir = Number(s.lasers[id]);
            if (!DIRS[dir]) {
                dir = Number(item.initialDir);
                if (!DIRS[dir]) dir = 6;
                s.lasers[id] = dir;
            }
            item.dir = dir;
            // $BF_Laser.png is a standard 3x4 character sheet:
            // row 0=down(2), row 1=left(4), row 2=right(6), row 3=up(8).
            // Show the matching row while keeping the pattern fixed at the middle frame.
            setLockedDirection(item.event, dir);
        });

        data.mirrors.forEach(function(item) {
            var id = String(item.event.eventId());
            var dir = Number(s.mirrors[id]);
            if (!DIRS[dir]) {
                dir = Number(item.initialDir);
                if (!DIRS[dir]) dir = 2;
                s.mirrors[id] = dir;
            }
            item.dir = dir;
            // The mirror artwork displays the outgoing beam direction, not the
            // physical mirror angle. Output direction -> character-sheet row:
            // up uses row 1, left row 2, right row 3, down row 4.
            var visualDir = Number(s.mirrorVisuals[id]);
            setLockedDirection(item.event, DIRS[visualDir] ? visualDir : dir);
        });

        data.melts.forEach(function(item) {
            if (item.event.setDirectionFix) item.event.setDirectionFix(true);
            freezeEventAnimation(item.event);
        });
        data.targets.forEach(function(item) {
            if (item.event.setDirectionFix) item.event.setDirectionFix(true);
            freezeEventAnimation(item.event);
        });
        data.crystals.forEach(function(item) {
            var event = item.event;
            var available = !!((s.solved || s.crystalForcedVisible) && !s.crystalCollected);
            if (event.setImage && (!event.characterName || event.characterName() !== '!Crystal')) {
                event.setImage('!Crystal', 3);
            }
            if (event.setDirectionFix) event.setDirectionFix(true);
            if (event.setPriorityType) event.setPriorityType(1);
            if (event.setThrough) event.setThrough(!available);
            if (event.setTransparent) event.setTransparent(!available);
            freezeEventAnimation(event);
        });
    }

    function opposite(dir) {
        return ({ 2: 8, 8: 2, 4: 6, 6: 4 })[dir] || 2;
    }

    function canBeamEnter(x, y, dir) {
        var d = DIRS[dir];
        if (!d) return false;
        var nx = x + d.dx;
        var ny = y + d.dy;
        if (!$gameMap.isValid(nx, ny)) return false;
        return $gameMap.isPassable(x, y, dir) && $gameMap.isPassable(nx, ny, opposite(dir));
    }

    function reflect(direction, mirrorDirection) {
        // Ориентации совпадают с 4 строками $BF_Mirror.png в RPG Maker MV:
        // 2 = вертикальная плоскость, 4 = диагональ /, 6 = диагональ \, 8 = горизонтальная.
        // У всех четырёх положений своя физика отражения; не объединяем 4 и 6.
        var map;
        switch (Number(mirrorDirection)) {
            case 2: // вертикальное зеркало: горизонтальный луч отражается назад
                map = { 2: 2, 8: 8, 4: 6, 6: 4 };
                break;
            case 4: // диагональ /
                map = { 6: 8, 8: 6, 4: 2, 2: 4 };
                break;
            case 6: // диагональ \
                map = { 6: 2, 2: 6, 4: 8, 8: 4 };
                break;
            case 8: // горизонтальное зеркало: вертикальный луч отражается назад
                map = { 2: 8, 8: 2, 4: 4, 6: 6 };
                break;
            default:
                return direction;
        }
        return map[direction] || direction;
    }

    function findAt(x, y, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].event.x === x && list[i].event.y === y) return list[i];
        }
        return null;
    }

    function meltAt(x, y, list) {
        for (var i = 0; i < list.length; i++) {
            var event = list[i].event;
            if (!$gameSelfSwitches.value([$gameMap.mapId(), event.eventId(), 'A']) &&
                event.x === x && event.y === y) return list[i];
        }
        return null;
    }

    function traceLaser(laser, data) {
        var result = { segments: [], hits: [], targetHitIds: [] };
        var x = laser.event.x;
        var y = laser.event.y;
        var dir = DIRS[laser.dir] ? laser.dir : 6;
        var visited = {};
        var maxSteps = Math.max(80, $gameMap.width() * $gameMap.height() * 2);

        for (var i = 0; i < maxSteps; i++) {
            var key = x + ',' + y + ',' + dir;
            if (visited[key]) break;
            visited[key] = true;

            if (!canBeamEnter(x, y, dir)) break;
            var d = DIRS[dir];
            x += d.dx;
            y += d.dy;
            result.segments.push({ x1: x - d.dx, y1: y - d.dy, x2: x, y2: y });

            var melt = meltAt(x, y, data.melts);
            if (melt) {
                result.hits.push({ type: 'melt', event: melt.event });
                break;
            }

            var target = findAt(x, y, data.targets);
            if (target) {
                result.targetHitIds.push(target.event.eventId());
                result.hits.push({ type: 'target', event: target.event });
            }

            var mirror = findAt(x, y, data.mirrors);
            if (mirror) {
                dir = reflect(dir, mirror.dir);

                // Select the mirror image from the actual direction the beam
                // travels after reflection. The sprite sheet rows are:
                // 1=up, 2=left, 3=right, 4=down. MV direction values select
                // rows 2,4,6,8 respectively, so map output direction to row-dir.
                var visualRowDirection = ({ 8: 2, 4: 4, 6: 6, 2: 8 })[dir] || mirror.dir;
                var mirrorId = String(mirror.event.eventId());
                var state = puzzleState();
                if (state) state.mirrorVisuals[mirrorId] = visualRowDirection;
                mirror.visualDir = visualRowDirection;
                setLockedDirection(mirror.event, visualRowDirection);
            }
        }
        return result;
    }

    function everyTargetHit(data, traces) {
        if (!data.targets.length) return false;
        var hit = {};
        traces.forEach(function(trace) {
            trace.targetHitIds.forEach(function(id) { hit[String(id)] = true; });
        });
        for (var i = 0; i < data.targets.length; i++) {
            if (!hit[String(data.targets[i].event.eventId())]) return false;
        }
        return true;
    }

    function activeMeltCount(data) {
        var count = 0;
        data.melts.forEach(function(item) {
            if (!$gameSelfSwitches.value([$gameMap.mapId(), item.event.eventId(), 'A'])) count++;
        });
        return count;
    }

    function awardIceStone(data, crystal) {
        var BF = window.BF_QuestSystem;
        var crystalId = crystal && crystal.event ? crystal.event.eventId() : 0;
        var collected = false;
        if (BF && BF.elementalStones && typeof BF.elementalStones.collect === 'function') {
            collected = BF.elementalStones.collect('ice');
        } else if (BF && typeof BF.elementalCollect === 'function') {
            collected = BF.elementalCollect('ice');
        } else {
            // Standalone fallback when the shared elemental-stone plugin is absent.
            if (BF && typeof BF.game === 'function') {
                var game = BF.game();
                if (game) {
                    game._notes = game._notes || {};
                    if (!game._notes.elemental_stone_ice) {
                        game._notes.elemental_stone_ice = 'Получен: Ледяной кристалл.';
                        collected = true;
                    }
                }
            }
            if (!collected && $gameVariables) {
                var count = Number($gameVariables.value(51));
                if (!isFinite(count) || count < 0) count = 0;
                $gameVariables.setValue(51, Math.min(3, count + 1));
                collected = true;
            }
        }
        return collected;
    }

    function screenPoint(x, y) {
        return {
            x: ($gameMap.adjustX(x) + 0.5) * $gameMap.tileWidth(),
            y: ($gameMap.adjustY(y) + 0.5) * $gameMap.tileHeight()
        };
    }

    function drawBeams(graphics, traces) {
        graphics.clear();
        traces.forEach(function(trace) {
            trace.segments.forEach(function(segment) {
                var a = screenPoint(segment.x1, segment.y1);
                var b = screenPoint(segment.x2, segment.y2);
                graphics.lineStyle(15, 0x21aaff, 0.16);
                graphics.moveTo(a.x, a.y);
                graphics.lineTo(b.x, b.y);
                graphics.lineStyle(7, 0x71dcff, 0.42);
                graphics.moveTo(a.x, a.y);
                graphics.lineTo(b.x, b.y);
                graphics.lineStyle(2.5, 0xf3fdff, 0.98);
                graphics.moveTo(a.x, a.y);
                graphics.lineTo(b.x, b.y);
            });
        });
    }

    function playerFrontPosition() {
        var x = $gamePlayer.x;
        var y = $gamePlayer.y;
        if ($gamePlayer.direction() === 2) y++;
        else if ($gamePlayer.direction() === 8) y--;
        else if ($gamePlayer.direction() === 4) x--;
        else if ($gamePlayer.direction() === 6) x++;
        return { x: x, y: y };
    }

    function objectInFront(data) {
        var p = playerFrontPosition();
        var laser = findAt(p.x, p.y, data.lasers);
        if (laser) return { type: 'laser', item: laser };
        var mirror = findAt(p.x, p.y, data.mirrors);
        if (mirror) return { type: 'mirror', item: mirror };
        var s = puzzleState();
        if (s && (s.solved || s.crystalForcedVisible) && !s.crystalCollected) {
            var crystal = findAt(p.x, p.y, data.crystals);
            if (crystal) return { type: 'crystal', item: crystal };
        }
        return null;
    }

    function collectCrystal(item, data) {
        var s = puzzleState();
        if (!s || !item || !item.event || s.crystalCollected) return false;
        s.crystalCollected = true;
        s.crystalForcedVisible = false;
        if (item.event.setTransparent) item.event.setTransparent(true);
        if (item.event.setThrough) item.event.setThrough(true);
        awardIceStone(data, item);
        if (SoundManager && SoundManager.playRecovery) SoundManager.playRecovery();
        if ($gameMessage && !$gameMessage.isBusy()) $gameMessage.add('Ты получил Ледяной кристалл!');
        return true;
    }

    var Controller = {
        graphics: null,
        frame: 0,
        update: function(scene) {
            if (!$gameMap || $gameMap.mapId() !== PUZZLE_MAP_ID || !questActive()) {
                this.clear(scene);
                return;
            }

            var data = puzzleEvents();
            var s = puzzleState();
            if (!s) return;

            // The controller owns interaction input: one edge = one turn. A held key
            // (or a plugin that repeats triggerAction) cannot rotate the mechanism again.
            var actionHeld = Input.isPressed('ok') ||
                (window.BF_InteractionButton && window.BF_InteractionButton.isButtonVisible &&
                 window.BF_InteractionButton.isButtonVisible() && TouchInput && TouchInput.isPressed());
            if (!actionHeld) s.actionLatched = false;
            var actionPressed = false;
            if (window.BF_InteractionButton && typeof window.BF_InteractionButton.consumeAction === 'function') {
                actionPressed = window.BF_InteractionButton.consumeAction();
            } else {
                actionPressed = Input.isTriggered('ok');
            }
            if (actionPressed && !s.actionLatched) {
                var frontObject = objectInFront(data);
                if (frontObject && frontObject.type === 'crystal') {
                    if (collectCrystal(frontObject.item, data)) s.actionLatched = true;
                } else if (rotateObjectInFront(data)) {
                    s.actionLatched = true;
                }
            }

            prepareObjects(data);

            if (!this.graphics && scene && scene._spriteset) {
                this.graphics = new PIXI.Graphics();
                scene._spriteset.addChild(this.graphics);
            }

            this.frame++;
            var traces = data.lasers.map(function(laser) { return traceLaser(laser, data); });

            var hitCounts = {};
            traces.forEach(function(trace) {
                trace.hits.forEach(function(hit) {
                    if (hit.type !== 'melt') return;
                    var id = String(hit.event.eventId());
                    hitCounts[id] = (hitCounts[id] || 0) + 1;
                });
            });

            data.melts.forEach(function(item) {
                var id = String(item.event.eventId());
                if ($gameSelfSwitches.value([$gameMap.mapId(), item.event.eventId(), 'A'])) {
                    delete s.melt[id];
                    return;
                }
                var progress = Number(s.melt[id]) || 0;
                if (hitCounts[id]) progress = Math.min(item.frames, progress + hitCounts[id]);
                else progress = Math.max(0, progress - 2);
                s.melt[id] = progress;
                if (progress >= item.frames) {
                    $gameSelfSwitches.setValue([$gameMap.mapId(), item.event.eventId(), 'A'], true);
                    SoundManager.playRecovery();
                }
            });

            if (data.melts.some(function(item) {
                return $gameSelfSwitches.value([$gameMap.mapId(), item.event.eventId(), 'A']);
            })) {
                traces = data.lasers.map(function(laser) { return traceLaser(laser, data); });
            }

            if (!s.solved && activeMeltCount(data) === 0 && everyTargetHit(data, traces)) {
                s.solved = true;
                s.crystalCollected = false;
                s.crystalForcedVisible = false;
                if ($gameScreen) $gameScreen.startFlash([190, 235, 255, 150], 24);
                if (SoundManager && SoundManager.playOk) SoundManager.playOk();
                if ($gameMessage && !$gameMessage.isBusy()) {
                    $gameMessage.add('Механизмы ледяной пещеры заработали!');
                    $gameMessage.add('На алтаре появился Ледяной кристалл. Подойди к нему и нажми действие, чтобы забрать его.');
                }
            }

            drawBeams(this.graphics, traces);
        },
        clear: function(scene) {
            if (this.graphics) {
                this.graphics.clear();
                if (scene && scene._spriteset) scene._spriteset.removeChild(this.graphics);
                if (this.graphics.destroy) this.graphics.destroy(true);
                this.graphics = null;
            }
            this.frame = 0;
        }
    };

    function rotateObjectInFront(data) {
        if (!$gameMap || $gameMap.mapId() !== PUZZLE_MAP_ID || !questActive()) return false;
        data = data || puzzleEvents();
        var target = objectInFront(data);
        if (!target) return false;

        var s = puzzleState();
        if (!s) return true;

        var now = Date.now();
        var frame = (typeof Graphics !== 'undefined' && isFinite(Graphics.frameCount))
            ? Graphics.frameCount : -1;
        if (frame >= 0 && Number(s.lastRotateFrame) === frame) return true;

        if (target.type === 'laser') {
            var laser = target.item;
            var laserId = String(laser.event.eventId());
            var currentLaserDir = Number(s.lasers[laserId]);
            if (!DIRS[currentLaserDir]) currentLaserDir = Number(laser.initialDir) || 6;
            var laserNext = nextDirection(currentLaserDir);
            s.lasers[laserId] = laserNext;
            laser.dir = laserNext;
            // Update the visible character-sheet row to match the beam direction.
            setLockedDirection(laser.event, laserNext);
        } else {
            var mirror = target.item;
            var mirrorId = String(mirror.event.eventId());
            var currentMirrorDir = Number(s.mirrors[mirrorId]);
            if (!DIRS[currentMirrorDir]) currentMirrorDir = Number(mirror.initialDir) || 2;
            var mirrorNext = nextDirection(currentMirrorDir);
            s.mirrors[mirrorId] = mirrorNext;
            mirror.dir = mirrorNext;
            setLockedDirection(mirror.event, mirrorNext);
        }

        s.lastRotateAt = now;
        if (frame >= 0) s.lastRotateFrame = frame;
        SoundManager.playCursor();
        return true;
    }

    function puzzleObjectInFront() {
        if (!$gameMap || $gameMap.mapId() !== PUZZLE_MAP_ID || !questActive()) return false;
        return !!objectInFront(puzzleEvents());
    }

    window.BF_IceLaserPuzzle = {
        reset: function() {
            if (!$gameSystem) return;
            $gameSystem._bfIceLaserState = {
                lasers: {}, mirrors: {}, mirrorVisuals: {}, melt: {}, solved: false,
                crystalCollected: false, crystalForcedVisible: false,
                lastRotateAt: 0, lastRotateFrame: -1, actionLatched: false
            };
            if ($gameMap && $gameMap.mapId() === PUZZLE_MAP_ID) {
                var data = puzzleEvents();
                data.melts.forEach(function(item) {
                    $gameSelfSwitches.setValue([$gameMap.mapId(), item.event.eventId(), 'A'], false);
                });
            }
        }
    };

    var _triggerAction = Game_Player.prototype.triggerAction;
    if (!_triggerAction.__bfIceLaserPuzzle) {
        var patchedTriggerAction = function() {
            // Stop the tagged event's normal Action Button page from starting. The
            // controller above separately processes one fresh key press and rotates it.
            if (puzzleObjectInFront()) return true;
            return _triggerAction.call(this);
        };
        patchedTriggerAction.__bfIceLaserPuzzle = true;
        Game_Player.prototype.triggerAction = patchedTriggerAction;
    }

    var _sceneCreate = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _sceneCreate.call(this);
        Controller.clear(this);
    };

    var _sceneUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _sceneUpdate.call(this);
        Controller.update(this);
    };

    var _sceneTerminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        Controller.clear(this);
        _sceneTerminate.call(this);
    };

    window.BF_IceCrystal = {
        show: function() {
            var s = puzzleState();
            if (!s) return;
            s.crystalForcedVisible = true;
            s.crystalCollected = false;
        },
        hide: function() {
            var s = puzzleState();
            if (!s) return;
            s.crystalForcedVisible = false;
            s.solved = false;
            s.crystalCollected = false;
        },
        status: function() {
            var s = puzzleState();
            console.log('[BF_IceCrystal]', { solved: !!(s && s.solved), forcedVisible: !!(s && s.crystalForcedVisible), collected: !!(s && s.crystalCollected), events: puzzleEvents().crystals.length });
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        var cmd = String(command || '').toLowerCase();
        var arg = String((args || [])[0] || '').toLowerCase();
        if (cmd === 'bf_icelaser' && arg === 'reset') window.BF_IceLaserPuzzle.reset();
        if (cmd === 'bf_icecrystal') {
            if (arg === 'show') window.BF_IceCrystal.show();
            else if (arg === 'hide' || arg === 'reset') window.BF_IceCrystal.hide();
            else if (arg === 'status') window.BF_IceCrystal.status();
        }
    };
})();
