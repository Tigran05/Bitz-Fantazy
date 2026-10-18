/*:
 * @plugindesc Bitz Fantasy — переключение языка RU/EN v1.2 — перенос длинных реплик
 * @author ASTROLIT GAMES
 * @help
 * Добавляет переключатель языка в стандартные настройки и сохраняет выбор.
 * Для перевода текста добавляйте пары в BF_Language.dictionary ниже:
 * 'Русский текст': 'English text'
 * Плагин не меняет игровые ID, переменные, переключатели или логику событий.
 */
(function() {
    'use strict';
    var BF = window.BF_Language = window.BF_Language || {};
    BF.version = '1.2';
    BF.dictionary = BF.dictionary || {
        "какой то рубильник": "Some kind of switch.",
        "Работает.": "It works.",
        "Нужно возвращаться.": "We should head back.",
        "Заберем наши ласты.": "Let’s get our flippers.",

        "И снова я выигрываю.": "And I win again.",
        "Кажется, ваша удача закончилась, друг мой.": "It seems your luck has run out, my friend.",
        "Но... это невозможно! Я считал карты!": "No... this is impossible! I counted the cards!",
        "Ты должен был проиграть!": "You were supposed to lose!",
        "Тише, тише. Не делайте сцен.": "Easy, easy. Let’s not make a scene.",
        "Хотите кредит? Официальный, от заведения.": "Would you like a loan? An official one, from the house.",
        "Всего-то под скромные 500% в неделю.": "At a modest rate of just 500% per week.",
        "500% в неделю?": "500% a week?",
        "Даже для разбойников это слишком.": "That’s too much even for bandits.",
        "Эйп! Не твое дело!": "Ape! This is none of your business!",
        "И я не был замечен в махинациях.": "And no one has ever caught me cheating.",
        "О, я знаю. Ты очень... аккуратен.": "Oh, I know. You’re very... careful.",
        "Но сегодня не твой день.": "But today isn’t your day.",
        "А вы, я смотрю, новые лица.": "And you, I see, are new faces.",
        "И с очень правильным взглядом.": "And you have a very keen eye.",
        "Вам не кажется, что справедливость": "Don’t you think justice",
        "сегодня хромает?": "is a little lame today?",
        "Мы просто наблюдаем.": "We’re just watching.",
        "У тебя к нам дело, незнакомец?": "Do you need something from us, stranger?",
        "Позвольте предложить вам напиток": "Allow me to offer you a drink",
        "за мой счет.": "on me.",
        "В баре. Без лишних ушей.": "At the bar. Somewhere private.",
        "Ладно. Послушаем, что ты предложишь.": "All right. Let’s hear what you have to offer.",
        'Мир 1': 'World 1',
        'Битцленд': 'Bitzland',
        'Вермилион': 'Vermilion',
        'Казино': 'Casino',
        'Дом 1': 'House 1',
        'Дом 2': 'House 2',
        'бар кат сцена': 'Bar Cutscene',
        'Дом брунно': 'Brunno’s House',
        'погреб': 'Cellar',
        'подвал': 'Basement',
        'закусочная': 'Diner',
        'Порт': 'Port',
        'подвал дока': 'Dock Basement',
        'водосток': 'Sewer',
        'Железный Утес': 'Iron Cliff',
        'Особняк': 'Mansion',
        'Деревенский дом (1 этаж)': 'Village House (1st Floor)',
        'Деревенский дом (2 этаж)': 'Village House (2nd Floor)',
        'Заброшенный дом': 'Abandoned House',
        'Гостиница (1 этаж)': 'Inn (1st Floor)',
        'пещера големов': 'Golem Cave',
        'Зал переноса': 'Teleportation Hall',
        'Хранилище': 'Storage',
        '(1 этаж)': '(1st Floor)',
        '(2 этаж)': '(2nd Floor)',
        '(3 этаж)': '(3rd Floor)',
        'сейф ловушка': 'Safe Trap',
        'Лесной город': 'Forest City',
        'Дом старосты': 'Mayor’s House',
        'Харчевня Лили': 'Lily’s Tavern',
        'Ледяная пещера': 'Ice Cave',
        'Проклятая пещера': 'Cursed Cave',
        'Лавовая пещера': 'Lava Cave',
        'Катя': 'Katya',
        'Эйп': 'Ape',
        'Личи': 'Lichi',
        'Алеко': 'Aleko',
        'хилер': 'Healer',
        'Воин': 'Warrior',
        'Маг': 'Mage',
        'ассасин': 'Assassin',
        'Уровень': 'Level',
        'Ур': 'Lv',
        'Опыт': 'EXP',
        'Битва': 'Fight',
        'Побег': 'Escape',
        'Атака': 'Attack',
        'Защита': 'Guard',
        'Предмет': 'Item',
        'Навык': 'Skill',
        'Экипировать': 'Equip',
        'Состояние': 'Status',
        'Построение': 'Formation',
        'Сохранить': 'Save',
        'Завершить игру': 'Game End',
        'Опции': 'Options',
        'Оружие': 'Weapon',
        'Броня': 'Armor',
        'Важный предмет': 'Key Item',
        'Лучшее': 'Optimize',
        'Снять всё': 'Clear',
        'Новая игра': 'New Game',
        'Продолжить': 'Continue',
        'В титульное меню': 'To Title',
        'Отмена': 'Cancel',
        'Купить': 'Buy',
        'Продать': 'Sell',
        'Макс. HP': 'Max HP',
        'Макс. MP': 'Max MP',
        'Маг. атака': 'MAT',
        'М. защита': 'MDF',
        'Ловкость': 'Agility',
        'Удача': 'Luck',
        'Удар': 'Hit',
        'Уклонение': 'Evasion',
        'Кинжал': 'Dagger',
        'Меч': 'Sword',
        'Цеп': 'Chain',
        'Топор': 'Axe',
        'Кнут': 'Whip',
        'Прут': 'Rod',
        'Лук': 'Bow',
        'Арбалет': 'Crossbow',
        'Пушка': 'Gun',
        'Когти': 'Claws',
        'Перчатки': 'Gloves',
        'Копье': 'Spear',
        'Обычная броня': 'Normal Armor',
        'Волшебная броня': 'Magic Armor',
        'Легкая броня': 'Light Armor',
        'Тяжелая броня': 'Heavy Armor',
        'Маленький щит': 'Small Shield',
        'Большой щит': 'Large Shield',
        'Щит': 'Shield',
        'Голова': 'Head',
        'Тело': 'Body',
        'Аксессуар': 'Accessory',
        'Физический': 'Physical',
        'Огонь': 'Fire',
        'Лед': 'Ice',
        'Молния': 'Lightning',
        'Вода': 'Water',
        'Земля': 'Earth',
        'Ветер': 'Wind',
        'Свет': 'Light',
        'Тьма': 'Dark',
        'Магия': 'Magic',
        'Особый': 'Special',
        'Зол.': 'Gold',
        'Не действует на %1!': 'It has no effect on %1!',
        '%1 получает %2 урона!': '%1 takes %2 damage!',
        '%1 поглощает %2 %3!': '%1 absorbs %2 %3!',
        '%1 обретает %2 %3!': '%1 gains %2 %3!',
        '%1 теряет %2 %3!': '%1 loses %2 %3!',
        '%1 не получает повреждений!': '%1 takes no damage!',
        'Промах! %1 не получил(а) повреждений!': 'Miss! %1 took no damage!',
        '%1 восстанавливает %2 %3!': '%1 recovers %2 %3!',
        'Бег всегда': 'Always Dash',
        'Уровень громкости BGM': 'BGM Volume',
        'Уровень громкости BGS': 'BGS Volume',
        '%1 усиливает %2!': '%1 strengthens %2!',
        '%1 %2 снова в норме!': '%1 is no longer %2!',
        'Запомнить команду': 'Remember Command',
        '%1 контратакует!': '%1 counterattacks!',
        'Болезненный удар!': 'Critical hit!',
        'Отличный удар!': 'Great hit!',
        '%1 ослабляет %2!': '%1 weakens %2!',
        '%1 проигрывает.': '%1 is defeated.',
        '%1 появляется!': '%1 appears!',
        'Но сбежать не удалось!': 'But escape failed!',
        '%1 пытается сбежать!': '%1 tries to escape!',
        '%1 уклоняется от атаки!': '%1 evades the attack!',
        'До повышения %1': '%1 to next level',
        'Опыт: %1': 'EXP: %1',
        'Файл': 'File',
        '%1 теперь %2 %3!': '%1 is now %2 %3!',
        'Какой файл загрузить?': 'Which file would you like to load?',
        '%1 нейтрализует магию!': '%1 nullifies the magic!',
        '%1 отражает магию!': '%1 reflects the magic!',
        'Уровень громкости ME': 'ME Volume',
        '%1 %2а получено!': '%1 %2 gained!',
        '%1\\G найдено!': 'Found %1\\G!',
        'Найдено: %1!': 'Obtained: %1!',
        '%1 выучено!': 'Learned %1!',
        '%1 и его партия': '%1 and party',
        'В партии': 'In party',
        '%1 получает превосходство!': '%1 gets the upper hand!',
        'В какой файл сохранить?': 'Which file would you like to save to?',
        'Уровень громкости SE': 'SE Volume',
        '%1 защищает %2!': '%1 protects %2!',
        '%1 удивлён!': '%1 is surprised!',
        '%1 использует %2!': '%1 uses %2!',
        '%1 побеждает!': '%1 wins!',
        'Сохранение':'Save', 'Настройки':'Options', 'Выйти':'Exit', 'Закрыть':'Close',
        'Язык / Language':'Язык / Language', 'Русский':'Russian', 'Английский':'English',
        'Уровень':'Level', 'Ур':'Lv', 'Опыт':'EXP', 'Битва':'Fight', 'Побег':'Escape',
        'Атака':'Attack', 'Защита':'Guard', 'Предмет':'Item', 'Навык':'Skill',
        'Экипировать':'Equip', 'Состояние':'Status', 'Построение':'Formation',
        'Сохранить':'Save', 'Завершить игру':'Game End', 'Опции':'Options',
        'Оружие':'Weapon', 'Броня':'Armor', 'Важный предмет':'Key Item',
        'Лучшее':'Optimize', 'Снять всё':'Clear', 'Новая игра':'New Game',
        'Продолжить':'Continue', 'В титульное меню':'To Title', 'Отмена':'Cancel',
        'Купить':'Buy', 'Продать':'Sell', 'Макс. HP':'Max HP', 'Макс. MP':'Max MP',
        'Атака':'Attack', 'Защита':'Defense', 'Маг. атака':'MAT', 'М. защита':'MDF',
        'Ловкость':'Agility', 'Удача':'Luck', 'Физический':'Physical', 'Огонь':'Fire',
        'Лед':'Ice', 'Молния':'Lightning', 'Вода':'Water', 'Земля':'Earth',
        'Ветер':'Wind', 'Свет':'Light', 'Тьма':'Dark', 'Обычная броня':'Normal Armor',
        'Волшебная броня':'Magic Armor', 'Легкая броня':'Light Armor',
        'Тяжелая броня':'Heavy Armor', 'Маленький щит':'Small Shield', 'Большой щит':'Large Shield',
        'Магия':'Magic', 'Особый':'Special', 'Зол.':'Gold',
        "Но... это невозможно! Я считал карты! Ты должен был проиграть!": "No... this is impossible! I counted the cards! You were supposed to lose!",
        "Но... это невозможно! Я считал карты!": "No... this is impossible! I counted the cards!",
        "Ты должен был проиграть!": "You were supposed to lose!",
        "Нам пока не сюда.": "We should not go this way yet.",
        "Сначала нужно разобраться с делами в Битце.": "First, we need to take care of things in Bitz.",
        "Вам пока рано суда": "It is too early for you to go there.",
        "У нас еще есть дела в железном утесе.": "We still have business to take care of in Iron Cliff.",
        "Нам не нужно суда": "We do not need to go there.",
        "Вам не нужно суда": "You do not need to go there.",
        "Сломаный алтарь перемещения": "The broken teleportation altar",
        "Вот мы и здесь. Казино 'Битц'. ": "Here we are. The Bitz Casino.",
        "Говорят, удача здесь улыбается не всем.": "They say luck does not favor everyone here.",
        "Нам удача не нужна. Нам нужен Мидас от PG.": "We do not need luck. We need Midas from PG.",
        "Будь начеку, Катя.": "Stay alert, Katya.",
        "Ого! Какая яркая вывеска! ": "Whoa! What a flashy sign!",
        "Интересно, у них есть ставки на киберспорт.": "I wonder if they take bets on esports.",
        "Вот он вермилион во всем его величие ": "There it is—Vermilion in all its glory.",
        "Это портовый город здесь много рыбы и икры": "This is a port city. There is plenty of fish and caviar here.",
        "Щас бы бутиков с икоркой": "I could really go for some caviar boutiques right now.",
        "Вы не забыли мы здесь по делу ": "You have not forgotten that we are here on business, have you?",
        "Как раз и разузнаем все ": "We will find out soon enough.",
        "Вот в казино и перекусим канапешками вперед": "Let us grab some canapés at the casino. Come on!",
        "Зайдите позже.": "Come back later.",
        "тонель затоплен без акваланга не пройти": "The tunnel is flooded. You cannot get through without scuba gear.",
        "Я очень занят": "I am very busy.",
        "Привет нас отправил к тебе торговец сказал ": "Hi. The merchant sent us to you. He said ",
        "у тебя есть ласты.": "you have a pair of flippers.",
        "Ай этот старый пройдоха все то он знает.": "Ah, that old rascal. He knows everything.",
        "Да у меня есть ласты": "Yes, I do have flippers.",
        "Не могли бы вы нам их продать?": "Could you sell them to us?",
        "Знаете они мне без надобности но,": "You know, I do not need them, but...",
        "я вам их не продам.": "I will not sell them to you.",
        "Почему?": "Why?",
        "Нам очень нужны ласты.": "We really need those flippers.",
        "Ну, раз очень нужны, ": "Well, if you need them that badly, ",
        "тогда у меня есть заманчивое предложение.": "then I have an offer you might like.",
        "Вам всего-то нужно спуститься в подвал и ": "All you have to do is go down to the basement and ",
        "включить рубильники, а то опять пробки ": "turn on the switches. The fuses have blown again, ",
        "выбило, а без электричества весь док колом.": "and without power the whole dock comes to a standstill.",
        "Так легко здесь какой то подвох?": "That sounds easy. What is the catch?",
        "Нет, какой же может быть подвох? ": "No catch at all. What makes you think there is one? ",
        "Ну максимум — живность всякая. ": "Well, maybe a few critters. ",
        "Ну, вы же не боитесь мышей, ": "You are not afraid of mice, ",
        "крыс или крабов?": "rats, or crabs, are you?",
        "Конечно нет.": "Of course not.",
        "Мы включим вам свет.": "We will turn the power back on for you.",
        "Спасибо ребята вы меня спасли.": "Thank you, guys. You saved me.",
        "Это было легче лёгкого.": "That was a piece of cake.",
        "Простите ребята я очень занят.": "Sorry, guys. I am very busy.",
        "Вот ваши ласты.": "Here are your flippers.",
        "Случайно не знаешь где может быть маска?": "Do you happen to know where we could find a mask?",
        "В порту, возле казино, ": "At the port, near the casino, ",
        "вы найдёте профессора — ": "you will find a professor—",
        "у него точно есть маска.": "he definitely has a mask.",
        "Спасибо.": "Thank you.",
        "Вам спасибо. ": "No, thank you. ",
        "Я вам очень благодарен за помощь. ": "I am very grateful for your help. ",
        "Напряжения до сих пор нет.": "There is still no power.",
        "Извините ребята у меня куча дел.": "Sorry, guys. I have a lot to do.",
        "О вы те самые охотники ": "Oh, you are the casino hunters ",
        "на нелегальные казино": "who go after illegal casinos.",
        "Если бы вы играли честно к ": "If you played fair, ",
        "вам бы не было претензий": "no one would have a problem with you.",
        "Куда еще честнее ведь казино это не место": "How much fairer can it get? A casino is not a place ",
        "для развлечений а заработок": "for entertainment. It is a business ",
        "для меня и я не намерен им делиться ": "for me, and I have no intention of sharing it ",
        "с этими дураками": "with those idiots.",
        "Э дядя так не пойдет люди ": "Hey, mister, that is not how this works. People ",
        "должны выигрывать ": "should be able to win.",
        "Не в моем казино": "Not in my casino.",
        "Тогда мы тебя закрываем": "Then we are shutting you down.",
        "Нет как же так почему какие то проходимцы": "No! How can this be? Why are a bunch of nobodies ",
        "закрывают меня": "shutting me down?",
        "Потому что за нами правда ": "Because the truth is on our side. ",
        "у кого правда тот и сильнее": "The truth makes us stronger.",
        "У вас все равно ни чего не получиться ": "You will never succeed, ",
        "сколько бы вы ни старались и не закрывали ": "no matter how hard you try or how many ",
        "подпольные казино на их месте будут ноывые": "underground casinos you shut down. New ones will take their place.",
        "Это мы еще посмотрим": "We will see about that.",
        "Ну а что касаеться тебя ": "As for you, ",
        "ты этого уже не увидишь": "you will not live to see it.",
        "А он прав мы закрываем одно а открываеться ": "He is right. We shut one down, and ",
        "два так нам ни когда не победить": "two more open. We will never win this way.",
        "До меня тут дошли слухи что у них ": "I heard rumors that they have ",
        "здесь есть не далеко хранилище где они ": "a storage facility nearby where they ",
        "хранят все деньги добытые обманом ": "keep all the money they made by cheating.",
        "Это отличная идея если мы лишим их денег ": "That is a great idea. If we take their money away, ",
        "у них не будет средств на существование": "they will have no means to keep operating ",
        "и они сами будут вынуждены закрыться": "and will be forced to shut down.",
        "Тогда выдвигаемся": "Then let us move out.",
        "к юго востоку есть одно место где они ": "There is a place to the southeast where they ",
        "и расположили свое хранилище": "set up their storage facility.",
        "Снова всю зарплату проиграл": "I lost my entire paycheck again.",
        "как будто здесь нельзя выйграть": "It is like nobody can win here.",
        "Где же теперь взять на додеп": "Where am I supposed to get more money for a deposit?",
        "Что я скажу семье опять врать ": "What am I going to tell my family? Lie again ",
        "что на работе оштрафовали": "and say I got fined at work?",
        "РТП прям 0": "The RTP is practically zero.",
        "Вот мы и в нутри": "We are inside.",
        "Давайте найдем Советника": "Let us find the Advisor.",
        "И наваляем ему": "And teach him a lesson.",
        "Что бы на долго запомнил": "One he will remember for a long time.",

        // Map007 Events 4, 8, 10, 11, 12 — cumulative translations.
        "Вы опять пришли? Убирайтесь отсюда.": "You again? Get out of here.",
        "Нет. На этот раз мы пришли поговорить.": "No. This time, we came to talk.",
        "Мы знаем, чем ты занимаешься.": "We know what you have been up to.",
        "Убирайтесь отсюда, вы мне мешаете.": "Get out of here. You are bothering me.",
        "Нет, вы меня раскрыли.": "No, you have exposed me.",
        "Ты думал, у тебя есть шансы?": "Did you think you stood a chance?",
        "Битцу всё равно придёт конец.": "Bitz will meet its end anyway.",
        "Что ты такое несёшь?": "What are you talking about?",
        "По всему миру открылись ": "Fake branches of Bitz have opened ",
        "фальшивые филиалы «Битц». ": "all over the world. ",
        "То, что там творят с гостями… ": "What they do to their guests there… ",
        "Мои выходки — это невинные шалости.": "My little schemes are harmless pranks compared to that.",
        "Я разберусь с ними. ": "I will deal with them. ",
        "Мы разберёмся. ": "We will deal with them. ",
        "Поможете мне ещё немного, ребята?": "Will you help me a little more, guys?",
        "Из нас вышла хорошая команда.": "We make a good team.",
        "Я за любой кипиш!": "I am always up for some action!",
        "Ну куда же я вас отпущу-то без меня?": "How could I let you go without me?",
        "Вы даже не представляете, ": "You have no idea ",
        "с кем решили связаться.": "who you have crossed.",
        "Раз все согласны, тогда надо подготовиться.": "Since everyone agrees, we need to get ready.",
        "Привет, ты, говорят, много что знаешь.": "Hi. I hear you know a lot of things.",
        "Смотря что вас интересует.": "Depends on what you want to know.",
        "Нам нужен код от сейфа Брунно.": "We need the code to Brunno’s safe.",
        "Я владею такой информацией, ": "I do have that information, ",
        "но сначала помогите мне.": "but you need to help me first.",
        "Чем тебе помочь?": "What do you need help with?",
        "В подвале развелось много крыс, ": "There are too many rats in the basement, ",
        "я не могу спокойно ходить за алкоголем. ": "and I can’t fetch the booze in peace. ",
        "Поймай крыс — и я вам расскажу ": "Catch the rats, and I’ll tell you ",
        "всё, что знаю.": "everything I know.",
        "Легко.": "Easy.",
        "Крысы ещё там.": "The rats are still there.",
        "Вы избавились от крыс.": "You got rid of the rats.",
        "Я знаю только первую цифру — \\v[17]": "I only know the first digit — \\v[17]",
        "Возможно инженер может знать еще что то.": "Maybe the engineer knows something else.",
        "Как хорошо, что вы здесь! ": "Good thing you’re here! ",
        "Мне очень нужна помощь.": "I really need your help.",
        "Что случилось?": "What happened?",
        "Этот жадный упырь Брунно майнит биток ": "That greedy creep Brunno is mining Bitzcoin ",
        "на серверах. Они не выдерживают таких ": "on the servers. They can’t handle such ",
        "температур — их срочно надо охладить.": "high temperatures — they need to be cooled down immediately.",
        "Что нужно делать?": "What do we need to do?",
        "Нужен жидкий азот, он в подвале.": "We need liquid nitrogen. It’s in the basement.",
        "Я немного занят.": "I’m a little busy.",
        "Азот всё ещё нужен. Найдите его в подвале.": "I still need the nitrogen. Find it in the basement.",
        "Спасибо, ребята, сервер спасён!": "Thanks, guys! The server is saved!",
        "Вы же что-то хотели? Не просто же так вы ко мне пришли.": "You wanted something, didn’t you? You didn’t come here for no reason.",
        "Ты случайно не знаешь код от сейфа Брунно?": "Do you happen to know the code to Brunno’s safe?",
        "Весь код я, конечно, не знаю.": "Of course, I don’t know the whole code.",
        "\"вторая цифра — \\v[18]\"": "\"The second digit is — \\v[18]\"",
        "Это ценная информация.": "That’s valuable information.",
        "Слот-менеджер тоже должен что-то знать.": "The slot manager should know something too.",
        "Спасибо за помощь.": "Thanks for your help.",
        "Спасибо за помощь. Сервер снова работает.": "Thanks for your help. The server is running again.",
        "Если Брунно что-то скрывает, ": "If Brunno is hiding something, ",
        "слот-менеджер может знать больше.": "the slot manager may know more.",
        "Эйп, как хорошо что ты здесь! ": "Ape, I’m glad you’re here! ",
        "Вон тот господин — шулер.": "That man over there is a cheat.",
        "Как ты это определил?": "How did you figure that out?",
        "У него на ноге какое-то устройство, ": "He has some kind of device on his leg ",
        "которое вибрирует, и в этот момент ": "that vibrates, and at that moment ",
        "он делает спин — и они всегда выигрышные.": "he spins the slot machine, and the results are always winners.",
        "Наш клиент. Берём!": "Our customer. Let’s get him!",
        "Не отвлекайте меня.": "Don’t distract me.",
        "Спасибо, ребята, один бы я не справился.": "Thanks, guys. I couldn’t have done it alone.",
        "Да, делов-то!": "No big deal!",
        "Ты, кстати, случайно не знаешь код ": "By the way, do you happen to know the code ",
        "от сейфа Брунно?": "to Brunno’s safe?",
        "\"только последнюю цифру — \\v[19]\"": "\"I only know the last digit — \\v[19]\"",
        "Вот спасибо, добрый человек!": "Thank you, kind soul!",
        "Он всё ещё грабит наши слотики.": "He’s still robbing our slot machines.",
        "Так мы молодцы — код у нас есть. ": "Well done, everyone — we have the code. ",
        "Надо пробраться в дом Брунно.": "We need to sneak into Brunno’s house.",
        "Я надеюсь, ты знаешь, где его дом?": "I hope you know where his house is.",
        "Да, он находится в северной части города, ": "Yes, it’s in the northern part of town, ",
        "между сквером и детской площадкой.": "between the square and the playground.",
        "Ну тогда вперёд!": "Then let’s go!",
        "\"все что я знаю — \\v[19]\"": "\"All I know is — \\v[19]\"",
        "Не отвлекайте меня, мне прёт фортуна!": "Don’t distract me! Lady Luck is on my side!",
        "Что-то хотели?": "Did you want something?",
        "Господин, да вы мошенник!": "Sir, you’re a cheat!",
        "Да как вы посмели ": "How dare you ",
        "честного игрока обвинять?!": "accuse an honest player?!",
        "Ага, а на ноге у честного игрока тамагочи, ": "Right, and that honest player has a Tamagotchi on his leg ",
        "которое вибрирует, — видимо, обкакалось!": "that keeps vibrating — it must have pooped itself!",
        "Да чего с ним базарить?": "Why are we even talking to him?",
        "Меня раскрыли.": "I’ve been exposed.",
        "Хватит, я больше так не буду!": "Enough! I won’t do it again!",
        "Ты в чёрном списке с этого момента.": "You’re blacklisted from this moment on.",

        // Map008 Event 1 — Ape and the investigation plan.
        "Прошу прощения за спектакль, ": "Sorry for the scene, ",
        "но иначе нельзя. ": "but there was no other way. ",
        "Меня зовут Эйп. ": "My name is Ape. ",
        "Я заинтересован в честности казино битц.": "I care about keeping the Bitz casino honest.",
        "Переходи к сути.": "Get to the point.",
        "Хорошо. Тот крупье, Брунно не чист на руку.": "All right. That dealer, Brunno, is crooked.",
        "Почему ты его не уволишь?": "Why don’t you fire him?",
        "Уволить? Нужны железные улики.": "Fire him? I need solid evidence.",
        "Помогите мне их найти.": "Help me find it.",
        "Ох, настоящий шпионский заговор!": "Oh, this is a real spy conspiracy!",
        "Ха-ха, почти. ": "Ha-ha, almost. ",
        "Мне нужна группа, ": "I need a team ",
        "которая сможет найти улики.": "that can find the evidence.",
        "Почему мы? Ты нас не знаешь.": "Why us? You don’t even know us.",
        "Я знаю, что вы пришли сюда не для игры. ": "I know you didn’t come here to gamble. ",
        "Я вижу это по вашим глазам. ": "I can see it in your eyes. ",
        "Помогите мне положить конец ": "Help me put an end to ",
        "этой империи обмана.": "this empire of deception.",
        "Хорошо, Эйп. Мы в деле.": "All right, Ape. We’re in.",
        "Ладно. План. Нам нужен детальный план.": "Okay. The plan. We need a detailed plan.",
        "Ура! Команда в сборе! ": "Hooray! The team is assembled! ",
        "Как назовем нашу операцию?": "What should we call our operation?",
        "Отлично! Значит, договорились.": "Excellent! It’s a deal, then.",
        "Операцию назовём «Разоблачение Брунно». ": "We’ll call the operation “Expose Brunno.” ",
        "План таков: у Брунно дома есть сейф, ": "Here’s the plan: there’s a safe in Brunno’s house, ",
        "он там хранит всю чёрную бухгалтерию. ": "where he keeps all his secret accounts. ",
        "Достанем её — и он не отвертится.": "Get them, and he won’t get away with it.",
        "Сейф, наверное, с хорошей защитой.": "The safe is probably well protected.",
        "Да, есть код, но я думаю, ": "Yes, it has a code, but I think ",
        "работники казино что-то да слышали.": "the casino staff may have heard something.",
        "Начнём опрашивать работников.": "Let’s question the staff.",
        "Начнём с бармена: они всегда всё знают.": "Let’s start with the bartender. They always know everything.",

        // Map009 Event 3 — lockpick interaction.
        "Кажется, я нашла.": "I think I found it.",
        "Получилось!": "It worked!",
        "Замок открылся": "The lock is open.",
        "Чёрт! Отмычка сломалась...": "Damn! The lockpick broke...",

        // Map010 Event 2 — Brunno's safe.
        "Перед вами стальной сейф Брунно.": "Before you stands Brunno’s steel safe.",
        "Вы нашли бухгалтерию Брунно!": "You found Brunno’s secret accounts!",
        "«Мне не хватает цифр...»": "“I’m missing some digits...”",

        // Map011 Event 2 — finding the liquid nitrogen.
        "О кажеться оно.": "Oh, there it is.",
        "Какая-то холодная жидкость...": "Some kind of cold liquid...",


        // Journal, inventory, map and shared menu UI (game/minigame plugins remain untouched).
        "ТЕКУЩИЕ ДЕЛА": "CURRENT CASES",
        "ЗАПИСЬ РАССЛЕДОВАНИЯ": "CASE NOTES",
        "Пока нет текущих дел.": "No active cases yet.",
        "Когда Катя получит новое дело,": "When Katya receives a new case,",
        "оно появится здесь.": "it will appear here.",
        "Запись появится после получения дела.": "Case notes appear after a case is received.",
        "Текущий шаг": "Current Step",
        "ЛИЧНЫЕ ЗАМЕТКИ": "PERSONAL NOTES",
        "НАЙДЕННЫЕ СВЕДЕНИЯ": "DISCOVERED CLUES",
        "Записей пока нет.": "No notes yet.",
        "Найденные цифры (Битц):": "Digits found (Bitz):",
        "Бармен": "Bartender",
        "Инженер": "Engineer",
        "Шулер": "Cheater",
        "Здесь появляются только сведения,": "Only information already discovered",
        "которые Катя уже узнала": "by Katya during the investigation",
        "во время расследования.": "appears here.",
        "ЗАВЕРШЁННЫЕ ДЕЛА": "COMPLETED CASES",
        "АРХИВ РАССЛЕДОВАНИЯ": "CASE ARCHIVE",
        "Пока ничего не завершено.": "Nothing completed yet.",
        "Завершённые дела остаются": "Completed cases remain",
        "в архиве Кати.": "in Katya’s archive.",
        "ДЕЛА": "CASES",
        "ЗАМЕТКИ": "NOTES",
        "АРХИВ": "ARCHIVE",
        "Пульты отключены: ": "Panels disabled: ",
        "Монетка": "Coin",
        "Фишка Bitz": "Bitz Token",
        "Ключ": "Key",
        "Улика": "Evidence",
        "Жидкий азот": "Liquid Nitrogen",
        "Сыр": "Cheese",
        "Обычная монетка казино Bitz.": "An ordinary Bitz casino coin.",
        "Подозрительная фишка с эмблемой Bitz. Возможно, она ещё пригодится.": "A suspicious token bearing the Bitz emblem. It may come in handy.",
        "Старый ключ. Назначение пока неизвестно.": "An old key. Its purpose is still unknown.",
        "Найденный в ходе расследования предмет, который может стать доказательством.": "An item found during the investigation that may serve as evidence.",
        "Ёмкость с жидким азотом для технических работ.": "A container of liquid nitrogen for technical work.",
        "Приманка для крыс. Иногда самые простые вещи оказываются полезными.": "Rat bait. Sometimes the simplest things are useful.",
        "Описание предмета пока отсутствует.": "No description is available for this item.",
        "МЕШОЧЕК": "INVENTORY",
        "Личные вещи и найденные предметы Кати": "Katya’s belongings and collected items",
        "ПРЕДМЕТЫ": "ITEMS",
        "ПРЕДМЕТ": "ITEM",
        "Выберите находку": "Select an item",
        "в мешочке.": "from the bag.",
        "Количество: ": "Quantity: ",
        "Сохранение": "Save",
        "Настройки": "Options",
        "Выйти": "Exit",
        "Закрыть": "Close",
        "КАРТА": "MAP",
        "ТЕКУЩАЯ ЦЕЛЬ": "CURRENT OBJECTIVE",
        "Нет цели": "No objective",
        "Откройте книгу.": "Open the journal.",
        "ШАГ": "STEP",
        "● ВЫ": "● YOU",
        "● ЦЕЛЬ": "● TARGET",
        "━ МАРШРУТ": "━ ROUTE",
        "Цель находится в другой локации": "The target is in another location",
        "ЦЕЛЬ": "TARGET",
        "ВЫ": "YOU",
        "Расспросить работников казино": "Question the Casino Staff",
        "Сюжет": "Story",
        "Дело": "Case",
        "Эйп попросил разобраться в том, что происходит в казино. Нужно поговорить с барменом, инженером и слот-менеджером.": "Ape asked us to investigate what is happening at the casino. Talk to the bartender, engineer, and slot manager.",
        "Эйп попросил расспросить работников казино.": "Ape asked us to question the casino staff.",
        "Проблема бармена": "The Bartender’s Problem",
        "Помочь бармену избавиться от крыс в подвале казино.": "Help the bartender get rid of the rats in the casino basement.",
        "Поймать крыс": "Catch the Rats",
        "Вернуться к бармену": "Return to the Bartender",
        "Первая цифра сейфа Брунно: {digit}": "First digit of Brunno’s safe: {digit}",
        "Майк обещал назвать первую цифру после того, как крысы будут пойманы.": "Mike promised to reveal the first digit after the rats are caught.",
        "Проблема инженера": "The Engineer’s Problem",
        "Помочь инженеру охладить перегревающуюся серверную.": "Help the engineer cool down the overheating server room.",
        "Найти жидкий азот": "Find the Liquid Nitrogen",
        "Отдать жидкий азот инженеру": "Give the Liquid Nitrogen to the Engineer",
        "Вторая цифра сейфа Брунно: {digit}": "Second digit of Brunno’s safe: {digit}",
        "Инженер обещал назвать вторую цифру после того, как сервер будет охлаждён.": "The engineer promised to reveal the second digit once the server is cooled.",
        "Подозрительный шулер": "The Suspicious Cheat",
        "Помочь слот-менеджеру разоблачить шулера.": "Help the slot manager expose a cheat.",
        "Расследовать действия шулера": "Investigate the Cheat",
        "Третья цифра сейфа Брунно: {digit}": "Third digit of Brunno’s safe: {digit}",
        "Слот-менеджер знает третью цифру сейфа Брунно.": "The slot manager knows the third digit of Brunno’s safe.",
        "Найти дом Бруно": "Find Bruno’s House",
        "После получения трёх цифр найти дом Бруно.": "Find Bruno’s house after obtaining all three digits.",
        "Тайный проход": "The Secret Passage",
        "Найти потайной проход в подвал.": "Find the secret passage to the basement.",
        "Исследовать дом Бруно": "Explore Bruno’s House",
        "Найти потайной проход в подвал": "Find the Secret Passage to the Basement",
        "Сейф Бруно": "Bruno’s Safe",
        "Открыть сейф кодом из трёх цифр.": "Open the safe using the three-digit code.",
        "Найти сейф": "Find the Safe",
        "Ввести код сейфа": "Enter the Safe Code",
        "Забрать бухгалтерию": "Take the Accounting Ledger",
        "Предъявить доказательства Бруно": "Present the Evidence to Bruno",
        "Вернуться к Бруно": "Return to Bruno",
        "Предъявить бухгалтерию как доказательство": "Present the Ledger as Evidence",
        "Вермилион": "Vermilion",
        "Расследовать дело фальшивого казино в портовом городе Вермилион.": "Investigate a fake casino in the port city of Vermilion.",
        "Идти в город Вермилион на востоке": "Travel to Vermilion in the east",
        "Найти фальшивое казино": "Find the Fake Casino",
        "Найти где перекусить и собрать информацию": "Find a place to eat and gather information",
        "Поговорить с торговцем": "Talk to the Merchant",
        "Собрать цветы": "Collect Flowers",
        "Вернуться к торговцу и получить баллон": "Return to the Merchant and Get the Canister",
        "Поговорить с работником в доках": "Talk to the Dock Worker",
        "Включить рубильник": "Turn On the Switch",
        "Поговорить с работником в доках и забрать ласты": "Talk to the Dock Worker and Get the Flippers",
        "Поговорить с ученым в порту": "Talk to the Scientist at the Port",
        "Отыскать потерянные ключи": "Find the Lost Keys",
        "Поговорить с ученым и получить маску": "Talk to the Scientist and Get the Mask",
        "Попасть на территорию казино по затопленному тунелю": "Reach the Casino through the Flooded Tunnel",
        "Встреча с Хозяином казино": "Meet the Casino Owner",
        "Железный Утёс": "Iron Cliff",
        "Продолжение путешествия в городе Железный Утёс.": "Continue the journey in Iron Cliff.",
        "Добраться до города Железный Утес": "Reach Iron Cliff",
        "Иследовать город": "Explore the City",
        "Исследовать старую шахту": "Explore the Old Mine",
        "Вернуться к старику": "Return to the Old Man",
        "Отключить трёх големов": "Deactivate the Three Golems",
        "Пройти через шахту в казино": "Pass through the Mine to the Casino",
        "Встретиться с советником": "Meet the Advisor",
        "Хранилище": "Vault",
        "Добраться до хранилища и открыть его.": "Reach the vault and open it.",
        "Добраться до хранилища": "Reach the Vault",
        "Попасть внутрь": "Get Inside",
        "Обыскать первый этаж": "Search the First Floor",
        "Обыскать второй этаж": "Search the Second Floor",
        "Обыскать третий этаж": "Search the Third Floor",
        "Открыть хранилище": "Open the Vault",
        "Лесной город": "Forest City",
        "Исследовать лесной город, добыть три волшебных камня и открыть зал переноса.": "Explore Forest City, collect three magic stones, and open the teleportation hall.",
        "Добраться до лесного города на востоке": "Reach Forest City in the east",
        "Поговорить с местными": "Talk to the Locals",
        "Найти старосту": "Find the Mayor",
        "Добыть три волшебных камня": "Collect Three Magic Stones",
        "Принести камни старосте": "Bring the Stones to the Mayor",
        "Идти в зал переноса": "Go to the Teleportation Hall",
        "Особняк": "Mansion",
        "Пробраться в особняк и добраться до финального босса.": "Infiltrate the mansion and reach the final boss.",
        "Пробраться в особняк и обыскать 1 этаж": "Enter the Mansion and Search Floor 1",
        "Обыскать 2 этаж": "Search Floor 2",
        "Обыскать 3 этаж": "Search Floor 3",
        "Победить финального босса": "Defeat the Final Boss",
        "Башня казино «Империя»": "Empire Casino Tower",
        "Пробиться через главную башню казино «Империя» и добраться до Брунно.": "Fight through the main tower of the Empire Casino and reach Brunno.",
        "Войти в главную башню казино \"Империя\"": "Enter the Main Tower of the Empire Casino",
        "Победить 5 стражей башни (\\v[71]/5)": "Defeat 5 Tower Guards (\\v[71]/5)",
        "Подняться на следующий этаж": "Go Up to the Next Floor",
        "Победить 5 элитных охранников (\\v[72]/5)": "Defeat 5 Elite Guards (\\v[72]/5)",
        "Подняться еще выше": "Climb Higher",
        "Победить 3 телохранителей Брунно (\\v[73]/3)": "Defeat 3 of Brunno’s Bodyguards (\\v[73]/3)",
        "Добраться до главного зала казино": "Reach the Casino’s Main Hall",
        "Победить 3 мини-боссов (\\v[74]/3)": "Defeat 3 Mini-Bosses (\\v[74]/3)",
        "Войти в святая святых": "Enter the Inner Sanctum",
        "Собрать улики против всей сети казино (\\v[75]/1)": "Collect Evidence against the Entire Casino Network (\\v[75]/1)",
        "Разрушить центральную систему управления": "Destroy the Central Control System",
        "ФИНАЛЬНАЯ БИТВА С БРУННО - ПОСЛЕДНЕЕ КАЗИНО!": "FINAL BATTLE WITH BRUNNO — THE LAST CASINO!",
        "Эйп попросил Катю, Алеко и Личи разобраться в конфликте с Брунно.": "Ape asked Katya, Aleko, and Lichi to resolve the conflict with Brunno.",
        "Майк знает первую цифру сейфа Брунно, но сначала просит избавиться от крыс в подвале.": "Mike knows the first digit of Brunno’s safe, but first asks you to get rid of the rats in the basement.",
        "Первая цифра сейфа Бруно": "First digit of Bruno’s safe",
        "Вторая цифра сейфа Бруно": "Second digit of Bruno’s safe",
        "Третья цифра сейфа Бруно": "Third digit of Bruno’s safe",
        "Цифра сейфа": "Safe digit",
        "Нужно поговорить с барменом, инженером и слот-менеджером.": "You need to speak with the bartender, engineer, and slot manager.",
        "Бухгалтерия Бруно — главная улика расследования.": "Bruno’s ledger is the key piece of evidence.",
        "Все три волшебных камня собраны. Нужно принести их старосте Лесного города.": "All three magic stones have been collected. Bring them to the mayor of Forest City.",
        "Получен волшебный камень из Ледяной пещеры.": "Magic stone obtained from the Ice Cave.",
        "Получен волшебный камень из Проклятой пещеры.": "Magic stone obtained from the Cursed Cave.",
        "Получен Огненный кристалл из Лавовой пещеры.": "Fire Crystal obtained from the Lava Cave.",
        "Получен Огненный кристалл в Лавовой пещере.": "Fire Crystal obtained in the Lava Cave.",
        "Получен: Кристалл лавовой пещеры.": "Obtained: Lava Cave Crystal.",
        "Получен: Кристалл проклятой пещеры.": "Obtained: Cursed Cave Crystal.",
        "Получен: Ледяной кристалл.": "Obtained: Ice Crystal.",
        "Все три волшебных камня собраны. Нужно принести их старцу Лесного города.": "All three magic stones have been collected. Bring them to the mayor of Forest City.",
        "Раздался гул древнего механизма. На алтаре появился кристалл!": "A deep rumble echoes from the ancient mechanism. A crystal has appeared on the altar!",
        "Ящики возвращены на исходные места.": "The crates have been returned to their starting positions.",
        "Ты получил Кристалл проклятой пещеры!": "You obtained the Cursed Cave Crystal!",
        "Ты получил Ледяной кристалл!": "You obtained the Ice Crystal!",
        "Механизмы ледяной пещеры заработали!": "The mechanisms in the Ice Cave are working!",
        "На алтаре появился Ледяной кристалл. Подойди к нему и нажми действие, чтобы забрать его.": "An Ice Crystal has appeared on the altar. Approach it and press the action button to collect it.",
        "Ловушка! Шипы пронзают проход.": "Trap! Spikes pierce the passage.",
        "Гейзер! Попадание в горячую струю.": "Geyser! You were hit by the hot jet.",
        "Огненная струя! Нужно дождаться безопасного момента.": "A jet of fire! Wait for a safe moment.",
        "Каменная плита обрушилась!": "The stone slab collapsed!",
        "Все кристаллы собраны. Огненный кристалл появился!": "All crystals collected. The Fire Crystal has appeared!",
        "Получен Огненный кристалл!": "Fire Crystal obtained!",
        "Механизм сработал. Ворота открыты!": "The mechanism activates. The gate is open!",
        "Ты прошёл Лавовую пещеру!": "You have completed the Lava Cave!",
        "Выход запечатан. Собери все кристаллы: ": "The exit is sealed. Collect all crystals: ",
        "Нужно собрать все кристаллы: ": "You need to collect all crystals: ",
        "Точка возврата установлена.": "Checkpoint set.",
        "Кристаллы: ": "Crystals: ",
        "Требуется кристаллов: ": "Crystals required: ",
        "Головоломка сброшена.": "Puzzle reset.",
        "Получен кристалл! (": "Crystal obtained! (",
        "Найти доказательство": "Find Evidence",
        "Третья цифра сейфа Бруно: 4": "Third digit of Bruno’s safe: 4",
        "Вторая цифра сейфа Бруно: 7": "Second digit of Bruno’s safe: 7",

        // Map013 Events 9, 12, 14, 4, 5, 6, 11, 8, 10, 7 — cumulative translations.
        "Красивые цветы": "Beautiful flowers",
        "Собрано: \\v[21]/5": "Collected: \\v[21]/5",
        "Это ты ученный про которого ": "Are you the scientist ",
        "нам говорил парень из доков?": "the guy at the docks told us about?",
        "Возможно смотря по какому поводу вы пришли.": "Perhaps. It depends on why you have come.",
        "Он сказал, у вас можно купить ": "He said we could buy ",
        "маску для акваланга.": "a diving mask from you.",
        "Маска у меня, конечно же, ": "Of course I have a mask, ",
        "есть, но я вам её не продам!": "but I will not sell it to you!",
        "Может договоримся дядя?": "Maybe we can make a deal, mister?",
        "Да, а вот договориться мы, конечно, можем. ": "Well, of course we can make a deal. ",
        "Мне как раз нужна помощь.": "I happen to need some help.",
        "Я надеюсь, это не снова какая-нибудь ": "I hope this is not another ",
        "грязная работенка?": "dirty job.",
        "Нет, конечно же нет. Я по рассеянности ": "No, of course not. I accidentally ",
        "уронил ключи от своего склада в эту ": "dropped the keys to my warehouse into this ",
        "водосточную решётку, и без ключей ": "drain grate, and without the keys ",
        "я не могу работать. ": "I cannot work. ",
        "Кстати, на складе и маска, ": "The mask is in the warehouse, too, ",
        "без ключей — никак.": "and I cannot get in without the keys.",
        "Хорошо, мы попробуем вернуть ключи.": "All right, we will try to get the keys back.",
        "Я почти у цели не мешайте мне.": "I am almost there. Do not disturb me.",
        "Вот держи других ключей там не было.": "Here you go. There were no other keys.",
        "Да, это они! Огромное вам спасибо.": "Yes, these are the ones! Thank you so much.",
        "Вот ваша маска, как и обещал.": "Here is your mask, as promised.",
        "Ты же сказал, она на складе?": "You said it was in the warehouse!",
        "Извините, что слукавил, ": "Sorry I was not entirely honest, ",
        "но так я вам дал стимул. ": "but this gave you an incentive. ",
        "Под стимулом люди охотнее работают.": "People work harder when they have an incentive.",
        "Щас я тебе выпишу стимул.": "I will give you an incentive right now.",
        "Не стоит горячиться, всё же прошло удачно.": "No need to get angry. It all worked out.",
        "А вы случайно не знаете, ": "By any chance, do you know ",
        "где тот затопленный проход, ": "where that flooded passage is, ",
        "ведущий на территорию казино?": "the one that leads into the casino grounds?",
        "Конечно, знаю. ": "Of course I do. ",
        "Он на территории маленького склада. ": "It is on the grounds of a small warehouse. ",
        "При выходе в порт на его ": "When you exit into the port, on its ",
        "территории найдёте люк.": "grounds you will find a hatch.",
        "Спасибо.": "Thank you.",
        "У вас нет ключей.": "You do not have the keys.",
        "Мне нужно работать.": "I need to get back to work.",
        "решотка водостока там внизу какое-то помещение": "There is some kind of room down there beneath the drain grate.",
        "Валите!": "Get lost!",
        "Валите отсуда": "Get out of here!",
        "Походу Брунно доложил о наших планах": "Looks like Brunno has been told about our plans.",
        "Да здесь нас точно не пропустят": "They definitely will not let us through here.",
        "Теперь то может перекусим": "Maybe now we can grab a bite.",
        "Ну что делать теперь то можно и перекусить": "Well, what now? We can grab a bite ",
        "и найти план как попасть в это казино": "and figure out how to get into that casino.",
        "Вам здесь не рады валите": "You are not welcome here. Get lost.",
        "Личи эмоции": "Lichi",
        "О боже как же здесь вкусно пахнет": "Oh, my goodness, it smells delicious here!",
        "Да не говори сьел бы щас быка ": "Tell me about it, I could eat a whole bull right now!",
        "Алеко эмоции": "Aleko",
        "Эйп эмоции": "Ape",
        "Ну теперь то можно и заморить червячка": "Now we can finally grab a bite.",
        "Катя эмоции": "Katya",
        "Главное не налегайте на алкоголь": "Just make sure you do not overdo it with the alcohol.",
        "посетитель1": "Visitor 1",
        "Мы продали все товары в местное казино": "We sold all our goods to the local casino.",
        "теперь отдыхаем ": "Now we are taking a break.",
        "посетитель3": "Visitor 3",
        "У нас праздник не мешай": "We are celebrating. Do not bother us.",
        "Торговец": "Merchant",
        "Приветствую вас, путники! Я торговец Аклан. ": "Greetings, travelers! I am Aklan the merchant.",
        "Мы с товарищами отмечаем выгодную сделку.": "My companions and I are celebrating a profitable deal.",
        "Что за сделка?": "What deal?",
        "У нас было оборудование ": "We had some equipment ",
        "из шахтёрского городка. ": "from the mining town. ",
        "Как хорошо, что местное казино всё купило!": "Good thing the local casino bought it all!",
        "Зачем казино шахтерское оборудование?": "Why would a casino need mining equipment?",
        "Я точно не знаю, но, как я понял ": "I do not know for sure, but from what I gathered ",
        "по их разговорам, они хотели затопить ": "from their conversations, they wanted to flood ",
        "какой-то тайный проход возле входа в порт.": "some secret passage near the entrance to the port.",
        "Говорят, через него всякое отребье ": "They say all sorts of riffraff used to sneak ",
        "пролазило в их казино.": "into their casino through it.",
        "Вот это уже интересно. ": "Now that is interesting. ",
        "И как у них получилось?": "And how did they manage that?",
        "Конечно, у меня же оборудование ": "Of course they did. My equipment is ",
        "высочайшего качества!": "of the highest quality!",
        "Теперь там только с аквалангом ": "Now you can only get through there with scuba gear ",
        "можно проплыть.": "and swim through.",
        "И где же взять этот акваланг то?": "And where are we supposed to get scuba gear?",
        "К вашему счастью, у меня есть кислородные ": "Fortunately for you, I have oxygen ",
        "баллоны, и я знаю, у кого есть ласты.": "tanks, and I know someone who has flippers.",
        "Сколько это нам обойдеться?": "How much will this cost us?",
        "Вы меня вообще слышите, молодой человек? ": "Are you even listening to me, young man? ",
        "Мне не интересны деньги — ": "I am not interested in money — ",
        "мы и так хорошо наварились!": "we have already made a good profit!",
        "Что же тогда вам интересно?": "Then what are you interested in?",
        "Видите ли, я обещал дочери привезти цветов ": "You see, I promised to bring my daughter some flowers ",
        "из этого города, но так сильно набрался, ": "from this town, but I have had so much to drink ",
        "что не в состоянии их собирать. ": "that I cannot gather them myself. ",
        "Если вы добудете пять цветков, ": "If you bring me five flowers, ",
        "я обменяю их на баллоны.": "I will trade them for the oxygen tanks.",
        "Хорошо мы сделаем это.": "All right, we will do it.",
        "Мне нужны цветы": "I need flowers.",
        "Вот твои цветы как обещали.": "Here are your flowers, as promised.",
        "Спасибо ребята вы меня просто спасли.": "Thank you, folks. You have really saved me.",
        "Вот, как и обещал, ": "Here, as promised, ",
        "держите баллоны от акваланга.": "take these scuba oxygen tanks.",
        "Ты обещал подсказать где нам найти ласты.": "You promised to tell us where to find flippers.",
        "Ах да, конечно. Идите в доки, там найдёте ": "Oh, right, of course. Go to the docks; you will find ",
        "моего товарища — у него есть ласты.": "my friend there — he has flippers.",
        "Спасибо тебе.": "Thank you.",
        "И вам огромное спасибо ": "And thank you very much, too. ",
        "дочка будет довольна.": "My daughter will be happy.",
        "Гуляем до утра ребята.": "Let us party until morning, folks.",
        "Как вы суда попали?": "How did you get in here?",
        "Твои отморозки сильные, спору нет, ": "Your thugs are strong, I’ll give you that, ",
        "но мозгов от этого у них не прибавилось.": "but that doesn’t mean they have any brains.",
        "Уволю всех, как только разберусь с вами.": "I’ll fire them all as soon as I’m done with you.",
        "Кто с кем ещё разберётся — ": "We’ll see who deals with whom — ",
        "это мы посмотрим.": "we’ll see about that.",
        "Наваляем ему хорошенько, ": "Let’s teach him a proper lesson, ",
        "чтобы не обманывал честных игроков.": "so he stops cheating honest players.",
        "Ещё и битцом прикрываеться.": "And he’s hiding behind Bitz, too.",
        "О нет я вас не дооценил.": "Oh no, I underestimated you.",
        "Закрываем вашу шарагу и передай всем: ": "We’re shutting this dump down. And tell everyone: ",
        "мы идём за ними!": "we’re coming for them!",
        "О нет я снова все проиграл.": "Oh no, I’ve lost everything again.",
        "Здесь не реально выйграть.": "You can’t win here.",
        "Почему у него всегда 21?": "Why does he always get 21?",
        "кабанчик эмоции": "Boar",
        "посетитель2": "Visitor",

        // Map017 — Events 5, 1, 6, 16
        "Вот и Железный Утес. Шахтёрский городок.": "So this is Iron Cliff, a mining town.",
        "Пахнет углём и... опасностью.": "Smells like coal and... danger.",
        "Наконец-то настоящее дело! Где тут казино?": "Finally, a real case! Where is the casino?",
        "Подземное казино. ": "An underground casino. ",
        "Находится в старой заброшенной шахте.": "It is located in an old abandoned mine.",
        "Главный там Старейшина Грэм.": "The one in charge is Elder Graham.",
        "Бывший шахтёрский профсоюзник, ": "A former miners’ union representative, ",
        "теперь владелец подпольного казино.": "now the owner of an underground casino.",
        "Давайте найдем кого нибудь и все узнаем.": "Let’s find someone and learn what we can.",
        "Здравствуйте, а вы случайно не знаете ": "Hello, would you happen to know ",
        "как попасть в казино?": "how to get into the casino?",
        "Казино? Ага, знаем. ": "The casino? Yeah, we know it. ",
        "Советник там теперь царь и бог.": "The advisor is practically king there now.",
        "Вы можете нам помочь найти вход?": "Can you help us find the entrance?",
        "Могу. Но в казино вас всё равно не пустят.": "I can. But they still won’t let you into the casino.",
        "Они никого просто так туда не пропускают.": "They don’t let just anyone in.",
        "Тогда как нам попасть внутрь?": "Then how do we get inside?",
        "Есть старый путь через шахту.": "There’s an old route through the mine.",
        "Через шахту?": "Through the mine?",
        "Да. Старая шахта ведёт в нужную сторону.": "Yes. The old mine leads in the right direction.",
        "Идите туда и осмотрите её.": "Go there and take a look around.",
        "Может быть, найдёте способ пройти дальше.": "You might find a way to get farther in.",
        "Показывай где твоя шахта.": "Show us where your mine is.",
        "На востоке есть подъём,": "There’s a path up to the east, ",
        "там в скале дверь.": "with a door in the rock.",
        "Вот там и находится вход.": "That’s where the entrance is.",
        "Ну что, вы побывали в шахте?": "So, have you been to the mine?",
        "Да. Там три неисправных голема.": "Yes. There are three broken golems in there.",
        "Они полностью перекрывают проход.": "They completely block the passage.",
        "Я так и думал.": "I thought as much.",
        "Когда-то этими големами управляли": "These golems used to be controlled by",
        "специальные пульты.": "special control panels.",
        "Пульты?": "Control panels?",
        "Да. Их должно было остаться три.": "Yes. There should be three left.",
        "Они разбросаны по городу.": "They’re scattered around the town.",
        "Найдите все три пульта и отключите их.": "Find all three panels and deactivate them.",
        "А после этого мы сможем пройти через шахту?": "And then we’ll be able to get through the mine?",
        "Да. Когда големы остановятся,": "Yes. Once the golems stop, ",
        "старый проход снова станет свободным.": "the old passage will be clear again.",
        "  Здесь заперто.": "  It’s locked here.",
        "Нужно сначала поговорить со стариком.": "We need to talk to the old man first.",
        "Закрыто.": "Closed.",
        "Дверь заперта": "The door is locked.",
        "Что здесь происходит?!": "What is going on here?!",
        "Это големы...": "Those are golems...",
        " Их здесь трое. ": " There are three of them. ",
        "Они совсем вышли из-под контроля.": "They are completely out of control.",
        "Теперь понятно, почему старик ": "Now I understand why the old man ",
        "отправил нас сюда.": "sent us here.",
        " Нам нужно вернуться к нему.": " We need to go back to him.",
        "Вот мы и на месте ": "Here we are.",
        "Как будем пробираться внутрь": "How are we going to get inside?",
        "Я предлогаю на пролом": "I say we force our way in.",
        "Поддерживаю": "I agree.",
        "Ну тогда решено": "Then it’s settled.",
        "Кто вы такие вам здесь не место": "Who are you? You don’t belong here.",
        "убирайтесь": "Get out!",
        "Дядя или ты нас пустишь по хорошему ": "Are you going to let us in the easy way,",
        "или придеться по плохому": "or do we have to do this the hard way?",
        "Ах ха ха глупцы это самое охранаемое место ": "Ah ha ha! Fools! This is the most heavily guarded place",
        "в мире вам не пройти": "in the world. You’ll never get through.",
        "Уходите!": "Leave!",
        "вентиляционая решотка": "A ventilation grate.",
        "А это оказалось легче чем я думал": "That was easier than I thought.",
        "Не раслабляемся тут по прежнему еще ": "Stay alert. There are still ",
        "много охраны": "plenty of guards around.",
        "Не страшно мы им все равно наваляем": "No worries. We’ll take them down anyway.",
        "Давайте обыщем этажи нам нужны подсказки ": "Let’s search the floors. We need clues ",
        "где находиться хранилище ": "about where the vault is ",
        "и как туда попасть": "and how to get inside.",
        "Нужно еще осмотреться": "We need to look around some more.",
        "Я устал от всего у меня нет больше сил ": "I’m tired of everything. I can’t go on anymore. ",
        "Я хочу покончить со всем этим ": "I want to put an end to all of this. ",
        "Я видел как старшые прячут ключь от хранилища": "I saw the guards hiding the key to the vault",
        "в библиотек на втором этаже": "in the library on the second floor.",
        "— Доктор, у меня проблема: всё кажется в чёрном цвете.": "“Doctor, I have a problem: everything looks dark.”",
        "— Это депрессия.": "“That’s depression.”",
        "— А вот и нет, это мои очки грязные!": "“No, it’s just that my glasses are dirty!”",
        "— Дорогой, ты помнишь, какой сегодня день?": "“Darling, do you remember what day it is today?”",
        "— Конечно, дорогая! Сегодня тот день, ": "“Of course, darling! Today is the day ",
        "когда я должен угадать, какой сегодня особенный день…": "when I have to guess what special day it is…”",
        "Объявление в зоопарке: «Обезьяны! ": "Zoo announcement: “Monkeys! ",
        "Не бросайте в посетителей ничего, кроме улыбок»": "Don’t throw anything at visitors except smiles.”",
        "А вот и ключ": "Here’s the key.",
        "На третьем этаже есть спальня с камином ": "There’s a bedroom with a fireplace on the third floor. ",
        "этот камин не то чем кажеться": "That fireplace isn’t what it seems.",
        "— Официант, в моём супе муха!": "“Waiter, there’s a fly in my soup!”",
        "— Не беспокойтесь, сэр, она не ест много.": "“Don’t worry, sir. It doesn’t eat much.”",
        "— Но я тоже хотел поесть!": "“But I wanted to eat, too!”",
        "Недавно прошёл чемпионат мира по логичности. ": "The World Logic Championship was held recently. ",
        "Победил победитель, подарили подарок.": "The winner won, and a gift was given.",
        "Бабушка так быстро и сильно мешала борщ, ": "Grandma stirred the borscht so fast and so hard ",
        "что воронка начала засасывать мебель в квартире.": "that a vortex started sucking the furniture into the apartment.",
        "Мы знали что вы придете": "We knew you would come.",
        "Кто здесь": "Who’s there?",
        "Вы глупцы думали умнее всех наш хозяин давно это ": "Fools! You thought you were smarter than everyone. Our master had ",
        "предвидел": "foreseen this long ago.",
        "Может покажетесь для начала": "Why don’t you show yourselves first?",
        "Для покойников это ни к чему": "The dead have no need for that.",
        "Походу наш план провалился ": "Looks like our plan has failed. ",
        "Ну теперь мы знаем что за этим всем стоит ": "Well, now we know there’s one person behind all this: ",
        "один человек": "one person.",
        "судя из записей что мы тут нашли ": "Judging by the records we found here, ",
        "их главарь сидит ": "their leader is hiding ",
        "в лесном замке ": "in the forest castle.",
        "Мы их не дооценили ": "We underestimated them. ",
        "Вот мы и на месте. Все три камня собраны, ": "Here we are. All three stones have been collected. ",
        "теперь осталось запустить их.": "Now we just need to activate them.",
        "И после этого мы сможем воспользоваться ": "And then we’ll be able to use ",
        "залом переноса?": "the teleportation hall?",
        "Да. Когда камни запустяться, ": "Yes. Once the stones are activated, ",
        "круг должен активироваться. ": "the circle should activate. ",
        "По крайней мере, ": "At least, ",
        "так говорят древние записи.": "that’s what the ancient records say.",
        "Должен»? Звучит обнадёживающе…": "“Should”? That sounds reassuring…",
        "Ну, мы же не проделали весь этот путь, ": "Well, we didn’t come all this way ",
        "чтобы теперь испугаться какого-то круга!": "just to be scared of some circle now!",
        "Готово. Теперь всё готово. ": "Done. Everything is ready now. ",
        "Встаньте в центр круга.": "Stand in the center of the circle.",
        "Как же долго вы мне мешали…": "You’ve been in my way for so long…",
        "Кто это сказал?!": "Who said that?!",
        "Здесь кто-то есть?": "Is someone here?",
        "Нет… Этого не может быть. ": "No… This can’t be. ",
        "В записях ничего подобного не было…": "There was nothing like this in the records…",
        "Вы разрушили мои казино, ": "You destroyed my casinos, ",
        "вмешались в мои дела и ": "interfered in my affairs, and ",
        "добрались туда, куда вам не следовало.": "reached places you should never have gone.",
        "Так это ты за всем стоишь?!": "So you’re the one behind all this?!",
        "Вы многое сделали. Но всё это время вы ": "You’ve accomplished a lot. But all this time, you ",
        "видели лишь то, ": "only saw ",
        "что я хотел вам показать.": "what I wanted you to see.",
        "Что происходит с камнями?!": "What’s happening to the stones?!",
        "Фальшивые казино были лишь прикрытием. ": "The fake casinos were only a cover. ",
        "А вы так и не поняли, ": "And you never understood ",
        "чему на самом деле помешали.": "what you were really interfering with.",
        "Нет! Круг теряет силу! Немедленно отсюда!": "No! The circle is losing power! Get out of here, now!",
        "Поздно! Мы не можем выйти!": "It’s too late! We can’t get out!",
        "Нет! Кристаллы разрушаются! ": "No! The crystals are breaking apart! ",
        "Выходите из круга!": "Get out of the circle!",
        "Мы не можем! Нас что-то удерживает!": "We can’t! Something is holding us here!",
        "Что ты с нами сделал?!": "What have you done to us?!",
        "Вы слишком долго стояли у меня на пути. ": "You’ve been in my way for too long. ",
        "Но даже теперь вы не понимаете, ": "But even now, you don’t understand ",
        "что произошло.": "what happened.",
        "Что же вы натворили… ": "What have you done… ",
        "И кто за всем этим стоит?..": "And who is behind all this?..",
        "Ох… Моя голова… Все живы?": "Ugh… My head… Is everyone alive?",
        "Кажется, да… Но где мы?!": "I think so… But where are we?!",
        "Нет… Этого не может быть…": "No… This can’t be…",
        "Эйп? Что случилось?": "Ape? What happened?",
        "Я знаю это место. Это моё казино… ": "I know this place. This is my casino… ",
        "Мы вернулись!": "We’re back!",
        "Погоди, что?! Мы снова в казино?": "Wait, what?! We’re back in the casino?",
        "Да. ": "Yes. ",
        "Я узнаю всё: стойку, столы, автоматы… ": "I recognize everything: the counter, the tables, the machines… ",
        "Ошибки быть не может.": "There’s no mistake.",
        "Подождите… ": "Wait… ",
        "Теперь я тоже начинаю узнавать это место.": "I’m starting to recognize this place too.",
        "Неужели мы вернулись в Битцленд? ": "Could we really be back in Bitzland? ",
        "Туда, откуда всё началось?": "Back where it all began?",
        "Значит, разрушенные кристаллы ": "So the shattered crystals ",
        "перенесли нас обратно?": "brought us back here?",
        "Но зачем именно сюда? ": "But why here, of all places? ",
        "И что на самом деле задумал тот, ": "And what was the person who spoke to us ",
        "кто говорил с нами?": "really planning?",
        "А староста остался там один…": "And the village elder is still there alone…",
        "Мы ничего не могли сделать. ": "There was nothing we could do. ",
        "Но мы ещё узнаем, кто за всем этим стоит.": "But we’ll find out who’s behind all this.",
        "Если это было только прикрытие, значит, ": "If that was only a cover, then ",
        "настоящее дело гораздо серьёзнее, ": "the real operation is much more serious ",
        "чем мы думали.": "than we thought.",
        "И мы пока даже не знаем, ": "And we don’t even know yet ",
        "с чем столкнулись.": "what we’re up against.",
        "Это ещё не конец. ": "This isn’t over yet. ",
        "Мы обязательно докопаемся до правды.": "We’ll get to the bottom of this.",
        "Вот мы и прибыли в лесной город": "We’ve arrived in the forest city.",
        "Как же здесь красиво": "It’s beautiful here.",
        "И воздух такой чистый": "And the air is so fresh.",
        "Даже как то есть захотелось": "I’m even getting hungry.",
        "Согласна пойдем в таверну перекусим заодно": "Agreed. Let’s grab a bite at the tavern, and ",
        "и информацию соберем": "gather some information while we’re there.",
        "Здравствуйте путники я староста этого ": "Greetings, travelers. I’m the elder of this ",
        "города Лили мне говорила что вы должны ": "city. Lily told me that you were supposed to ",
        "ко мне прийти": "come see me.",
        "Так вы нам поможете": "So, will you help us?",
        "Ох эти мошеники убегая забрали все корабли ": "Those swindlers took all the ships with them when they fled, ",
        "и дирижабли поэтому средств перевозки нет": "and the airships too. We have no way to travel now.",
        "так же они разгромили альтарь перемещения": "They also wrecked the teleportation altar,",
        "забрав камни телепортации": "taking the teleportation stones with them.",
        "И что же делать не уж то они теперь не ": "What are we supposed to do? Does that mean they’re ",
        "досягаемы": "out of reach now?",
        "Есть один способ но он очень опасный": "There is one way, but it’s very dangerous.",
        "Говори же не томи": "Tell us already. Don’t keep us waiting.",
        "Сразу за городом есть три пещеры в них ": "There are three caves just outside the city. Inside them ",
        "находяться волшебные камни если вы ": "are magical stones. If you ",
        "добудите все 3 камня то я смогу запустить ": "retrieve all three stones, I’ll be able to activate ",
        "алтарь перемещения ": "the teleportation altar.",
        "Спасибо староста мы все сделаем": "Thank you, Elder. We’ll do it.",
        "Вы их собрали ": "Have you collected them? ",
        "На Юго-востоке находиться алтарь ": "The teleportation altar is to the southeast. ",
        "перемешения идите к нему я как раз все ": "Go there. I’ll get everything ",
        "приготовлю к вашему приходу": "ready before you arrive.",
        "Вы собрали не все камни": "You haven’t collected all the stones.",
        "Вы выглядите как какой то отряд ": "You look like some kind of ",
        "супер героев": "superhero team.",
        "Слышал после появления охотников на казино ": "I heard that after the casino hunters appeared, ",
        "закрыли несколько филиалов нелегальных ": "several branches of illegal casinos were shut down. ",
        "казино то то же местные мошейники убегали ": "No wonder the local crooks were running away ",
        "в ужасе ": "in terror.",
        "Здесь стало на много безопасней когда ": "It became much safer here when ",
        "владельцы нелегального казино сбежали в ": "the owners of the illegal casino fled in ",
        "ужасе узнав про охотников на казино": "terror after hearing about the casino hunters.",
        "Мы отдыхаем здесь с семьей ": "We’re relaxing here with our family. ",
        "Здравствуйте путники советую вам отведать ": "Hello, travelers. I recommend trying their ",
        "кабанчика он у них изумительный": "roast boar. It’s amazing.",
        "Как же здесь стало спокойно": "It’s so peaceful here now.",
        "Здравствуйте я Лили хозяйка этой харчевни": "Hello, I’m Lily, the owner of this inn.",
        "чего желаете": "What would you like?",
        "Нам бы перекусить с долгой дороги": "We’d like something to eat after our long journey.",
        "Это мы мигом сейчас я вам быстро поджарю": "Coming right up! I’ll fry something for you.",
        "Kabanchika": "Roast boar",
        "Нам бы еще узнать кое какую информацию ": "We’d also like to ask you for some information. ",
        "Ну спрашивайте может и помогу ": "Go ahead and ask. Maybe I can help. ",
        "Мы бы хотели знать куда убежали эти ": "We’d like to know where those ",
        "мошеники и как нам их достать": "crooks fled and how we can reach them.",
        "Ох так вы и есть те самые охотники за ": "Oh! So you’re the famous casino hunters! ",
        "казино как же я сразу не догадалась еда за ": "Why didn’t I realize that sooner? Your meal is on ",
        "счет заведения": "the house.",
        "Кто же придумал нам такое название": "Who came up with that name for us?",
        "Вы что вы же знамениты про вас уже сочиняют ": "What? You’re famous! They’re already writing songs about you, ",
        "песни а наши мошеники которые открыли тут ": "and the crooks who opened an illegal casino here ",
        "нелегальное казино и обдирали людей до ": "and robbed people of everything they had ",
        "последней нитки сбежали": "have fled.",
        "Ну так что у вас есть какая нибудь ": "So, do you have any ",
        "информация о их месте нахождения": "information about where they are?",
        "Я боюсь я вам не помогу мое дело готовить ": "I’m afraid I can’t help you. My job is to cook ",
        "еду но я знаю кто может вам помочь наш ": "but I know someone who can help: our ",
        "староста его дом находиться в ": "elder. His house is in the ",
        "северо западном крае нашего города  ": "northwestern part of our city.  ",
        "Приходите еще вам всегда рада": "Come again! You’re always welcome here.",
    };
    // UI-only substring translation for dynamic labels and wrapped descriptions.
    // Dialogue translation remains exact-match-only to avoid mixed-language lines.
    BF.translateUI = function(text) {
        if (text === null || text === undefined) return text;
        if ((ConfigManager.bfLanguage || 'ru') !== 'en') return text;
        var value = String(text);
        if (Object.prototype.hasOwnProperty.call(BF.dictionary, value)) return BF.dictionary[value];
        var keys = Object.keys(BF.dictionary).sort(function(a,b){ return b.length-a.length; });
        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            if (key.length < 3 || value.indexOf(key) < 0) continue;
            value = value.split(key).join(BF.dictionary[key]);
        }
        return value;
    };
    BF.translate = function(text) {
        if (text === null || text === undefined) return text;
        if ((ConfigManager.bfLanguage || 'ru') !== 'en') return text;
        var value = String(text);
        if (Object.prototype.hasOwnProperty.call(BF.dictionary, value)) return BF.dictionary[value];
        // RPG Maker message text is stored per line. Match each complete line only;
        // never replace fragments inside a line, which can create mixed-language dialogue.
        return value.split('\n').map(function(line) {
            if (Object.prototype.hasOwnProperty.call(BF.dictionary, line)) return BF.dictionary[line];
            var trimmed = line.replace(/\s+$/, '');
            if (Object.prototype.hasOwnProperty.call(BF.dictionary, trimmed)) {
                return BF.dictionary[trimmed] + line.slice(trimmed.length);
            }
            // Dynamic crystal counters emitted by the cave plugin.
            var m;
            if ((m = line.match(/^Получен кристалл! \((\d+\/\d+)\)$/))) return 'Crystal obtained! (' + m[1] + ')';
            if ((m = line.match(/^Выход запечатан\. Собери все кристаллы: (\d+\/\d+)\.$/))) return 'The exit is sealed. Collect all crystals: ' + m[1] + '.';
            if ((m = line.match(/^Нужно собрать все кристаллы: (\d+\/\d+)\.$/))) return 'You need to collect all crystals: ' + m[1] + '.';
            if ((m = line.match(/^Кристаллы: (\d+\/\d+)\.$/))) return 'Crystals: ' + m[1] + '.';
            return line;
        }).join('\n');
    };

    var _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        var config = _makeData.call(this);
        config.bfLanguage = this.bfLanguage || 'ru';
        return config;
    };
    var _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _applyData.call(this, config);
        this.bfLanguage = config.bfLanguage === 'en' ? 'en' : 'ru';
    };
    ConfigManager.bfLanguage = ConfigManager.bfLanguage || 'ru';

    // Пункт в стандартном окне настроек. BF_GearMenu открывает эту же сцену.
    var _optionsMakeCommandList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function() {
        _optionsMakeCommandList.call(this);
        this.addCommand('Язык / Language', 'bfLanguage');
    };
    var _optionsStatusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        var symbol = this.commandSymbol(index);
        if (symbol === 'bfLanguage') return ConfigManager.bfLanguage === 'en' ? 'English' : 'Русский';
        return _optionsStatusText.call(this, index);
    };
    var _optionsProcessOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        if (this.commandSymbol(this.index()) === 'bfLanguage') {
            ConfigManager.bfLanguage = ConfigManager.bfLanguage === 'en' ? 'ru' : 'en';
            this.redrawItem(this.index());
            SoundManager.playCursor();
            ConfigManager.save();
            return;
        }
        _optionsProcessOk.call(this);
    };
    var _optionsCursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function(wrap) {
        if (this.commandSymbol(this.index()) === 'bfLanguage') {
            ConfigManager.bfLanguage = 'en';
            this.redrawItem(this.index());
            SoundManager.playCursor(); ConfigManager.save(); return;
        }
        _optionsCursorRight.call(this, wrap);
    };
    var _optionsCursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function(wrap) {
        if (this.commandSymbol(this.index()) === 'bfLanguage') {
            ConfigManager.bfLanguage = 'ru';
            this.redrawItem(this.index());
            SoundManager.playCursor(); ConfigManager.save(); return;
        }
        _optionsCursorLeft.call(this, wrap);
    };

    // Автоматический перенос длинных английских реплик в окне сообщений.
    // Работает только при EN; русские строки и игровые события не меняет.
    if (typeof Window_Message !== 'undefined') {
        var _bfStartMessage = Window_Message.prototype.startMessage;
        Window_Message.prototype.startMessage = function() {
            if ((ConfigManager.bfLanguage || 'ru') === 'en' && window.$gameMessage && Array.isArray($gameMessage._texts)) {
                var faceWidth = $gameMessage.faceName && $gameMessage.faceName() ? 168 : 0;
                var available = Math.max(160, this.contentsWidth() - faceWidth - 12);
                var output = [];
                var self = this;
                $gameMessage._texts.forEach(function(originalLine) {
                    var translated = BF.translate(originalLine);
                    var parts = String(translated).split('\n');
                    parts.forEach(function(part) {
                        if (!part) { output.push(''); return; }
                        var words = part.split(/\s+/);
                        var line = '';
                        words.forEach(function(word) {
                            var candidate = line ? line + ' ' + word : word;
                            // Ignore RPG Maker escape sequences while measuring width.
                            var measurable = candidate.replace(/\\[A-Za-z]+(?:\[[^\]]*\])?/g, '');
                            var width = self.textWidth(measurable);
                            if (line && width > available) {
                                output.push(line);
                                line = word;
                            } else {
                                line = candidate;
                            }
                        });
                        if (line) output.push(line);
                    });
                });
                $gameMessage._texts = output;
            }
            _bfStartMessage.call(this);
        };
    }

    // Переводит строки в сообщениях и стандартных окнах по словарю.
    var _convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    Window_Base.prototype.convertEscapeCharacters = function(text) {
        return _convertEscapeCharacters.call(this, BF.translate(text));
    };
    var _drawText = Window_Base.prototype.drawText;
    Window_Base.prototype.drawText = function(text, x, y, maxWidth, align) {
        return _drawText.call(this, BF.translate(text), x, y, maxWidth, align);
    };
    var _drawTextEx = Window_Base.prototype.drawTextEx;
    Window_Base.prototype.drawTextEx = function(text, x, y) {
        return _drawTextEx.call(this, BF.translate(text), x, y);
    };

    // Названия игровых базовых данных переводятся при отображении в стандартных окнах.
    var _itemName = Window_Base.prototype.drawItemName;
    Window_Base.prototype.drawItemName = function(item, x, y, width) {
        if (!item) return;
        var copy = Object.create(item);
        copy.name = BF.translate(item.name);
        return _itemName.call(this, copy, x, y, width);
    };


})();

// Compact independent RU | EN selector on the title screen.
(function() {
    'use strict';
    if (typeof Scene_Title === 'undefined' || typeof Sprite === 'undefined') return;

    function LanguageSelector() { this.initialize.apply(this, arguments); }
    LanguageSelector.prototype = Object.create(Sprite.prototype);
    LanguageSelector.prototype.constructor = LanguageSelector;
    LanguageSelector.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.bitmap = new Bitmap(120, 42);
        this.x = Math.max(8, Graphics.boxWidth - 132);
        this.y = 12;
        this._lastLanguage = null;
        this.refresh();
    };
    LanguageSelector.prototype.refresh = function() {
        var lang = (window.ConfigManager && ConfigManager.bfLanguage === 'en') ? 'en' : 'ru';
        if (this._lastLanguage === lang) return;
        this._lastLanguage = lang;
        var b = this.bitmap;
        b.clear();
        b.fontFace = 'GameFont';
        b.fontSize = 25;
        b.outlineWidth = 3;
        b.outlineColor = 'rgba(0,0,0,0.8)';
        b.textColor = lang === 'ru' ? '#E7B84F' : '#FFFFFF';
        b.drawText('RU', 0, 0, 42, 38, 'center');
        b.textColor = '#FFFFFF';
        b.drawText('|', 43, 0, 20, 38, 'center');
        b.textColor = lang === 'en' ? '#E7B84F' : '#FFFFFF';
        b.drawText('EN', 64, 0, 42, 38, 'center');
    };
    LanguageSelector.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.refresh();
        if (!this.visible || !TouchInput.isTriggered()) return;
        var px = TouchInput.x;
        var py = TouchInput.y;
        if (px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height) {
            var localX = px - this.x;
            if (localX <= 48) ConfigManager.bfLanguage = 'ru';
            else if (localX >= 60) ConfigManager.bfLanguage = 'en';
            else return;
            if (ConfigManager.save) ConfigManager.save();
            SoundManager.playCursor();
            this._lastLanguage = null;
            this.refresh();
            // Redraw the title command window immediately; its labels are cached
            // when the window is created, so changing the config alone is not enough.
            var scene = SceneManager && SceneManager._scene;
            if (scene && scene._commandWindow) {
                if (scene._commandWindow.refresh) scene._commandWindow.refresh();
                if (scene._commandWindow.updatePlacement) scene._commandWindow.updatePlacement();
            }
            // Refresh any other visible windows on the current scene where possible.
            if (scene && scene.children) {
                scene.children.forEach(function(child) {
                    if (child !== scene._commandWindow && child && child.refresh && child.visible) {
                        try { child.refresh(); } catch (e) {}
                    }
                });
            }
        }
    };

    var _Scene_Title_create = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        _Scene_Title_create.call(this);
        this._astrolitLanguageSelector = new LanguageSelector();
        this.addChild(this._astrolitLanguageSelector);
    };
})();
