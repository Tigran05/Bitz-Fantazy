/*:
 * @plugindesc Bitz Fantasy — BF_QuestConfig (clean bartender stage)
 * @author ASTROLIT GAMES
 *
 * @help
 * Сейчас настроен только первый самостоятельный квест бармена.
 * Остальные города и работники будут подключаться по очереди, без изменения
 * сюжетных событий, когда дойдём до них.
 */
(function(){
'use strict';
window.BF_QuestConfig = window.BF_QuestConfig || {};
window.BF_QuestConfig.QUESTS = {
    intro: {
        title: 'Расспросить работников казино',
        category: 'Сюжет',
        description: 'Эйп попросил разобраться в том, что происходит в казино. Нужно поговорить с барменом, инженером и слот-менеджером.',
        steps: [],
        note: 'Эйп попросил расспросить работников казино.'
    },
    bartender: {
        title: 'Проблема бармена',
        category: 'Дело',
        description: 'Помочь бармену избавиться от крыс в подвале казино.',
        steps: [
            'Поймать крыс',
            'Вернуться к бармену'
        ],
        minigameByStep: { '0': 'BF_RatCatch' },
        // После успеха мини-игры переключаем конкретное сюжетное событие бармена
        // на страницу «вернуться к бармену». Никаких глобальных переменных.
        successSwitchByStep: {
            '0': { mapId: 7, eventId: 8, selfSwitch: 'A' }
        },
        digitMode: 'random',
        digitNote: 'Первая цифра сейфа Брунно: {digit}',
        mapTargets: {
            '0': { mapId: 11, eventId: 3 },
            '1': { mapId: 7, eventId: 8 }
        },
        note: 'Майк обещал назвать первую цифру после того, как крысы будут пойманы.'
    }
};
window.BF_QuestConfig.NOTES = {
    ape: 'Эйп попросил Катю, Алеко и Личи разобраться в конфликте с Брунно.',
    bartender: 'Майк знает первую цифру сейфа Брунно, но сначала просит избавиться от крыс в подвале.'
};
})();
