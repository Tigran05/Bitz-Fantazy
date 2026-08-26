# 🔧 ТОЧНЫЕ ИСПРАВЛЕНИЯ ДЛЯ ТОРГОВЦА

## 📍 ТЕКУЩАЯ СТРУКТУРА СОБЫТИЯ EV008

### ПЕРВАЯ СТРАНИЦА (активируется при первом разговоре):
```javascript
// ... диалог ...
{"code":101,"indent":0,"parameters":["Kate",0,0,2]},
{"code":401,"indent":0,"parameters":["Хорошо мы сделаем это"]},
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 1);"]},
{"code":655,"indent":0,"parameters":["SoundManager.playOk();"]},
{"code":123,"indent":0,"parameters":["A",0]},
{"code":0,"indent":0,"parameters":[]}
```

### ВТОРАЯ СТРАНИЦА (активируется когда switch A = true):
```javascript
{"conditions":{"selfSwitchCh":"A","selfSwitchValid":true}},
{"code":0,"indent":0,"parameters":[]}  // ← ПУСТОЙ КОД
```

---

## ❌ ПРОБЛЕМЫ

1. **Переменная 20 устанавливается в 5** (должно быть 1 для начала квеста)
2. **Вторая страница пустая** (нет логики для повторных разговоров)
3. **Нет проверки этапов квеста** (20 = 1, 20 = 2, 20 = 3)

---

## ✅ РЕШЕНИЕ

### ШАГ 1: Изменить первую строку в первой странице

**ЗАМЕНИТЬ строку:**
```javascript
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 5);"]},
```

**НА:**
```javascript
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 1);"]},
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(21, 0);"]},
```

### ШАГ 2: Заменить вторую страницу на многоэтапную логику

**УДАЛИТЬ текущую вторую страницу:**
```javascript
{"conditions":{"actorId":1,"actorValid":false,"itemId":1,"itemValid":false,"selfSwitchCh":"A","selfSwitchValid":true,"switch1Id":1,"switch1Valid":false,"switch2Id":1,"switch2Valid":false,"variableId":1,"variableValid":false,"variableValue":0},"directionFix":false,"image":{"tileId":0,"characterName":"Торговец","direction":4,"pattern":0,"characterIndex":0},"list":[{"code":0,"indent":0,"parameters":[]}]
```

**ЗАМЕНИТЬ НА:**

```javascript
{"conditions":{"actorId":1,"actorValid":false,"itemId":1,"itemValid":false,"selfSwitchCh":"A","selfSwitchValid":true,"switch1Id":1,"switch1Valid":false,"switch2Id":1,"switch2Valid":false,"variableId":20,"variableValid":true,"variableValue":1},"directionFix":false,"image":{"tileId":0,"characterName":"Торговец","direction":4,"pattern":0,"characterIndex":0},"list":[
  {"code":111,"indent":0,"parameters":[1,20,0,1,0]},
  {"code":101,"indent":1,"parameters":["Торговец",0,0,2]},
  {"code":401,"indent":1,"parameters":["Отлично! Соберите 5 ракушек на берегу."]},
  {"code":401,"indent":1,"parameters":["Вернитесь ко мне, когда соберете их."]},
  {"code":355,"indent":1,"parameters":["$gameVariables.setValue(20, 2);"]},
  {"code":123,"indent":1,"parameters":["B",0]},
  {"code":0,"indent":1,"parameters":[]},
  {"code":411,"indent":0,"parameters":[]},
  {"code":111,"indent":1,"parameters":[1,20,0,2,0]},
  {"code":111,"indent":2,"parameters":[1,21,0,5,1]},
  {"code":101,"indent":3,"parameters":["Торговец",0,0,2]},
  {"code":401,"indent":3,"parameters":["Превосходно! Вот ваш баллон."]},
  {"code":401,"indent":3,"parameters":["Теперь идите к работнику в доках за ластами."]},
  {"code":355,"indent":3,"parameters":["$gameVariables.setValue(20, 3);"]},
  {"code":123,"indent":3,"parameters":["C",0]},
  {"code":0,"indent":3,"parameters":[]},
  {"code":411,"indent":2,"parameters":[]},
  {"code":101,"indent":3,"parameters":["Торговец",0,0,2]},
  {"code":401,"indent":3,"parameters":["Еще нужно ракушек: "]},
  {"code":401,"indent":3,"parameters":["Собрано: \\v[21]/5"]},
  {"code":0,"indent":3,"parameters":[]},
  {"code":412,"indent":2,"parameters":[]},
  {"code":412,"indent":1,"parameters":[]},
  {"code":411,"indent":0,"parameters":[]},
  {"code":111,"indent":1,"parameters":[1,20,0,3,0]},
  {"code":101,"indent":2,"parameters":["Торговец",0,0,2]},
  {"code":401,"indent":2,"parameters":["Идите к работнику в доках."]},
  {"code":0,"indent":2,"parameters":[]},
  {"code":412,"indent":1,"parameters":[]},
  {"code":0,"indent":0,"parameters":[]}
]}
```

---

## 📋 ЛОГИКА ПОСЛЕ ИСПРАВЛЕНИЙ

### Этап 1 (20 = 1): Первый разговор
- Торговец дает задание на сбор ракушек
- Устанавливает: **20 = 2, 21 = 0**
- Включает switch B

### Этап 2 (20 = 2): Возврат с ракушками
- Если **21 >= 5**: Выдает баллон, **20 = 3**, включает switch C
- Если **21 < 5**: Показывает "Собрано: X/5"

### Этап 3 (20 = 3): После получения баллона
- Отправляет к работнику в доках

---

## 🎯 РЕЗУЛЬТАТ

После исправлений торговец будет работать как полноценный NPC с многоэтапным квестом, соответствующим системе в `ACTPO_QuestConfig.js`.