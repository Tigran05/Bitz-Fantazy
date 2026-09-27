/*:
 * @plugindesc Bitz Fantasy — дела сети казино: семь детективных глав.
 * @author Bitz Fantasy
 *
 * @help
 * Adds «Дела сети» to the main menu. Each chapter is a self-contained
 * investigation with its own evidence puzzle. Complete a case to unlock the
 * next one; its city variable (20, 30, ... 70) is marked complete.
 */
(function() {
    'use strict';

    var CASES = [
        { city: 'Битцленд', title: 'Дело Брунно', variableId: 10,
          intro: 'Серверы казино майнят криптовалюту, игрокам навязывают кредиты, а крупье прикрывает шулеров.',
          game: 'Соберите цепочку: серверы → устройство шулера → бухгалтерия.',
          clues: ['Серверы добывали криптовалюту', 'Устройство подменяло выигрыши', 'Книга связывает все платежи'], answer: [0, 1, 2] },
        { city: 'Вермилион', title: 'Контрабандный маршрут', variableId: 20,
          intro: 'Под вывеской «Морского Дьявола» в порт приходят незаявленные контейнеры с оборудованием.',
          game: 'Восстановите маршрут по обрывкам манифеста: порт → маяк → затопленный склад.',
          clues: ['Маяк передаёт код разгрузки', 'Портовый журнал фиксирует прибытие', 'Затопленный склад скрывает груз'], answer: [1, 0, 2] },
        { city: 'Железный Утёс', title: 'Долговая жила', variableId: 30,
          intro: 'Шахтёрам приписывают займы и заставляют отрабатывать фиктивные долги в подпольном казино.',
          game: 'Сверьте документы: печать → дата выдачи → запись в книге.',
          clues: ['Запись в книге не совпадает с суммой', 'Печать изготовлена после даты договора', 'Дата выдачи подделана'], answer: [1, 2, 0] },
        { city: 'Фростсити', title: 'Холодный расчёт', variableId: 40,
          intro: 'Казино шантажирует город отключением тепла и продаёт жителям «страховку от мороза».',
          game: 'Стабилизируйте сеть: датчик → резервный контур → журнал отключений.',
          clues: ['Журнал показывает намеренные отключения', 'Датчик подтверждает перегрузку', 'Резервный контур возвращает тепло'], answer: [1, 2, 0] },
        { city: 'Порт-Ройял', title: 'Чужие пломбы', variableId: 50,
          intro: 'Деньги казино исчезают в морских перевозках, а номера контейнеров меняют прямо в доке.',
          game: 'Найдите подмену: манифест → пломба → настоящий контейнер.',
          clues: ['Настоящий контейнер стоит у старого дока', 'Манифест содержит неверный вес', 'Пломба не совпадает с реестром'], answer: [1, 2, 0] },
        { city: 'Сильван', title: 'Зелёный фасад', variableId: 60,
          intro: 'Экофонд финансирует лесные проекты только на бумаге: деньги уходят на скрытую серверную ферму.',
          game: 'Восстановите удалённый журнал: резервная копия → IP-адрес → перевод фонда.',
          clues: ['Перевод фонда оплатил оборудование', 'Резервная копия сохранила записи', 'IP-адрес ведёт в центральную сеть'], answer: [1, 2, 0] },
        { city: 'Башня', title: 'Архитектор сети', variableId: 70,
          intro: 'Все дела сходятся в центральном архиве. Осталось назвать организатора и передать доказательства.',
          game: 'Свяжите мотив, доступ и денежный след в единую картину.',
          clues: ['Денежный след объединяет филиалы', 'Мотив — контроль городов через долги', 'Доступ к архиву был только у Архитектора'], answer: [1, 2, 0] }
    ];

    function caseState() {
        if (!$gameSystem._bfCasesCompleted) $gameSystem._bfCasesCompleted = [];
        return $gameSystem._bfCasesCompleted;
    }
    function completed(index) {
        var c = CASES[index];
        return $gameVariables.value(c.variableId) >= 10 || caseState()[index];
    }
    function unlocked(index) {
        return index === 0 || completed(index - 1);
    }
    function markComplete(index) {
        var c = CASES[index];
        caseState()[index] = true;
        if ($gameVariables.value(c.variableId) < 10) $gameVariables.setValue(c.variableId, 10);
    }

    var _systemInitialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _systemInitialize.call(this);
        this._bfCasesCompleted = this._bfCasesCompleted || [];
    };

    var _menuAddOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _menuAddOriginalCommands.call(this);
        this.addCommand('Дела сети', 'bfCaseFiles', true);
    };
    var _menuCreateCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _menuCreateCommandWindow.call(this);
        this._commandWindow.setHandler('bfCaseFiles', function() {
            SceneManager.push(Scene_BFCaseFiles);
        });
    };

    function Scene_BFCaseFiles() { this.initialize.apply(this, arguments); }
    Scene_BFCaseFiles.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_BFCaseFiles.prototype.constructor = Scene_BFCaseFiles;
    Scene_BFCaseFiles.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._caseIndex = 0;
        this._step = 0;
        this._mode = 'list';
        this._message = '';
    };
    Scene_BFCaseFiles.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this._window = new Window_BFCaseFiles(0, 0, Graphics.boxWidth, Graphics.boxHeight, this);
        this.addWindow(this._window);
        this._window.activate();
        this._window.select(0);
    };
    Scene_BFCaseFiles.prototype.openCase = function(index) {
        if (!unlocked(index)) {
            SoundManager.playBuzzer();
            this._message = 'Сначала завершите предыдущее расследование.';
            this._window.refresh();
            return;
        }
        SoundManager.playOk();
        this._caseIndex = index;
        this._step = 0;
        this._mode = 'case';
        this._message = '';
        this._window.select(0);
        this._window.refresh();
    };
    Scene_BFCaseFiles.prototype.choose = function(index) {
        var c = CASES[this._caseIndex];
        if (index !== c.answer[this._step]) {
            SoundManager.playBuzzer();
            this._message = 'Эта улика не подходит к текущему этапу. Проверьте факты.';
            this._window.refresh();
            return;
        }
        SoundManager.playOk();
        this._step++;
        if (this._step >= c.answer.length) {
            markComplete(this._caseIndex);
            this._mode = 'complete';
            this._message = 'Дело раскрыто. Следующая нить ведёт дальше по сети «Битц».';
        } else {
            this._message = 'Улика подтверждена. Найдите следующую часть схемы.';
        }
        this._window.select(0);
        this._window.refresh();
    };
    Scene_BFCaseFiles.prototype.backToList = function() {
        SoundManager.playCancel();
        this._mode = 'list';
        this._message = '';
        this._window.select(this._caseIndex);
        this._window.refresh();
    };

    function Window_BFCaseFiles() { this.initialize.apply(this, arguments); }
    Window_BFCaseFiles.prototype = Object.create(Window_Selectable.prototype);
    Window_BFCaseFiles.prototype.constructor = Window_BFCaseFiles;
    Window_BFCaseFiles.prototype.initialize = function(x, y, width, height, scene) {
        this._scene = scene;
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.opacity = 0;
        this.refresh();
    };
    Window_BFCaseFiles.prototype.maxItems = function() {
        return this._scene._mode === 'list' ? CASES.length : 3;
    };
    Window_BFCaseFiles.prototype.itemHeight = function() { return 48; };
    Window_BFCaseFiles.prototype.refresh = function() {
        this.contents.clear();
        if (this._scene._mode === 'list') this.drawList();
        else this.drawCase();
    };
    Window_BFCaseFiles.prototype.drawList = function() {
        var w = this.contentsWidth();
        this.contents.fontSize = 28;
        this.changeTextColor('#f0c84b');
        this.drawText('ДЕЛА СЕТИ «БИТЦ»', 0, 12, w, 'center');
        this.contents.fontSize = 15;
        this.changeTextColor('#c9d2dc');
        this.drawText('Раскройте дела по порядку. В каждом городе — новая улика и своя механика.', 0, 52, w, 'center');
        for (var i = 0; i < CASES.length; i++) {
            var c = CASES[i], y = 95 + i * this.itemHeight();
            var state = completed(i) ? 'РАСКРЫТО' : (unlocked(i) ? 'ДОСТУПНО' : 'ЗАКРЫТО');
            this.changePaintOpacity(unlocked(i));
            this.changeTextColor(completed(i) ? '#7be35e' : '#ffffff');
            this.drawText((i + 1) + '. ' + c.city + ' — ' + c.title, 34, y, w - 190, 'left');
            this.changeTextColor(completed(i) ? '#7be35e' : '#aeb6c0');
            this.drawText(state, w - 155, y, 120, 'right');
            this.changePaintOpacity(true);
        }
        this.changeTextColor('#8793a0');
        this.contents.fontSize = 13;
        this.drawText('↑↓ выбор • Enter открыть • Esc назад', 0, 475, w, 'center');
        if (this._scene._message) this.drawText(this._scene._message, 0, 510, w, 'center');
    };
    Window_BFCaseFiles.prototype.drawCase = function() {
        var s = this._scene, c = CASES[s._caseIndex], w = this.contentsWidth();
        this.contents.fontSize = 26;
        this.changeTextColor('#f0c84b');
        this.drawText((s._caseIndex + 1) + '. ' + c.city + ': ' + c.title, 0, 12, w, 'center');
        this.contents.fontSize = 17;
        this.changeTextColor('#ffffff');
        this.drawWrapped(c.intro, 46, 65, w - 92, 23, 3);
        this.changeTextColor('#8ed3ff');
        this.contents.fontSize = 15;
        this.drawWrapped(c.game, 46, 145, w - 92, 20, 2);
        if (s._mode === 'complete') {
            this.changeTextColor('#7be35e');
            this.contents.fontSize = 28;
            this.drawText('ДЕЛО РАСКРЫТО', 0, 245, w, 'center');
            this.contents.fontSize = 16;
            this.changeTextColor('#d7e9d2');
            this.drawWrapped(s._message, 100, 300, w - 200, 22, 3);
            this.changeTextColor('#8793a0');
            this.drawText('Enter / Esc — к списку дел', 0, 470, w, 'center');
            return;
        }
        this.changeTextColor('#f0c84b');
        this.drawText('ЭТАП ' + (s._step + 1) + ' ИЗ 3: ВЫБЕРИТЕ НУЖНУЮ УЛИКУ', 0, 205, w, 'center');
        for (var i = 0; i < c.clues.length; i++) {
            var y = 250 + i * 68, selected = this.index() === i;
            this.contents.fillRect(45, y, w - 90, 52, selected ? '#3d341c' : '#1a2028');
            this.changeTextColor(selected ? '#fff0ad' : '#f3f4f5');
            this.contents.fontSize = 17;
            this.drawText(c.clues[i], 60, y + 14, w - 120, 'left');
        }
        this.changeTextColor('#e6bb68');
        this.contents.fontSize = 14;
        this.drawText(s._message, 0, 470, w, 'center');
        this.changeTextColor('#8793a0');
        this.drawText('↑↓ выбор • Enter предъявить • Esc к списку', 0, 510, w, 'center');
    };
    Window_BFCaseFiles.prototype.drawWrapped = function(text, x, y, width, lineHeight, maxLines) {
        var words = String(text).split(' '), line = '', lineNo = 0;
        for (var i = 0; i < words.length && lineNo < maxLines; i++) {
            var test = line ? line + ' ' + words[i] : words[i];
            if (this.textWidth(test) > width && line) {
                this.drawText(line, x, y + lineNo * lineHeight, width, 'left');
                line = words[i]; lineNo++;
            } else line = test;
        }
        if (line && lineNo < maxLines) this.drawText(line, x, y + lineNo * lineHeight, width, 'left');
    };
    Window_BFCaseFiles.prototype.processOk = function() {
        var s = this._scene;
        if (s._mode === 'list') s.openCase(this.index());
        else if (s._mode === 'complete') s.backToList();
        else s.choose(this.index());
    };
    Window_BFCaseFiles.prototype.processCancel = function() {
        if (this._scene._mode === 'list') SceneManager.pop();
        else this._scene.backToList();
    };

    window.Scene_BFCaseFiles = Scene_BFCaseFiles;
})();
