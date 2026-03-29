# 🔧 ПОДРОБНЫЕ ИСПРАВЛЕНИЯ ДЛЯ ТОРГОВЦА В ЗАКУСОЧНОЙ

## 📍 РАСПОЛОЖЕНИЕ
**Файл**: `data/Map012.json`  
**Событие**: EV008 (Торговец)  
**Позиция**: x:12, y:7

---

## ❌ ТЕКУЩИЕ ПРОБЛЕМЫ

### Проблема 1: Неправильное значение переменной
**Строка 91 в коде события**:
```javascript
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 5);"]},
```

**Проблема**: Устанавливает переменную 20 в значение 5, но по логике квеста должно быть:
- **20 = 1**: Начало квеста (первый разговор)
- **20 = 2**: Этап сбора ракушек
- **20 = 3**: Возврат за баллоном

### Проблема 2: Нет проверки этапов квеста
Текущий код не проверяет, на каком этапе находится игрок, и всегда выполняет один и тот же диалог.

### Проблема 3: Нет инициализации счетчика ракушек
Переменная 21 (счетчик ракушек) не инициализируется.

---

## ✅ ПРАВИЛЬНАЯ ЛОГИКА КВЕСТА

### Этап 1: Начало квеста (20 = 1)
- Игрок первый раз говорит с торговцем
- Торговец объясняет задание: "Соберите 5 ракушек"
- Устанавливаем: **20 = 2** (переходим к сбору)
- Инициализируем: **21 = 0** (обнуляем счетчик)

### Этап 2: Сбор ракушек (20 = 2)
- Игрок возвращается к торговцу с ракушками
- Проверяем: **21 >= 5?**
- Если ДА: выдаем баллон, **20 = 3**
- Если НЕТ: говорим, сколько еще нужно

### Этап 3: Получение баллона (20 = 3)
- Торговец отдает баллон
- Переходим к следующему этапу: **20 = 4**

---

## 🔧 КОНКРЕТНЫЕ ИСПРАВЛЕНИЯ

### ШАГ 1: Изменить первое событие

**ЗАМЕНИТЬ строку 91:**
```javascript
// БЫЛО:
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 5);"]},

// ДОЛЖНО БЫТЬ:
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 1);"]},
```

### ШАГ 2: Добавить проверку этапов квеста

**ДОБАВИТЬ после строки с установкой переменной:**
```javascript
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 1);"]},
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(21, 0);"]},
{"code":123,"indent":0,"parameters":["A",0]},
```

### ШАГ 3: Создать вторую страницу события для проверки этапов

**Добавить вторую страницу с условием:**
```javascript
{
  "conditions": {
    "actorId": 1,
    "actorValid": false,
    "itemId": 1,
    "itemValid": false,
    "selfSwitchCh": "A",
    "selfSwitchValid": true,
    "switch1Id": 1,
    "switch1Valid": false,
    "switch2Id": 1,
    "switch2Valid": false,
    "variableId": 20,
    "variableValid": true,
    "variableValue": 1
  }
}
```

### ШАГ 4: Добавить логику проверки в новую страницу

**В новой странице добавить код:**
```javascript
{"code":111,"indent":0,"parameters":[1,20,0,1,0]}, // Если 20 = 1
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 2);"]}, // Устанавливаем 2
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(21, 0);"]}, // Обнуляем счетчик
{"code":123,"indent":0,"parameters":["B",0]}, // Устанавливаем switch B
{"code":0,"indent":0,"parameters":[]},
{"code":411,"indent":0,"parameters":[]}, // Иначе если 20 = 2
{"code":111,"indent":0,"parameters":[1,21,0,5,1]}, // Если 21 >= 5
{"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 3);"]}, // Устанавливаем 3
{"code":123,"indent":0,"parameters":["C",0]}, // Устанавливаем switch C
{"code":0,"indent":0,"parameters":[]},
{"code":411,"indent":0,"parameters":[]}, // Иначе
{"code":101,"indent":0,"parameters":["Торговец",0,0,2]},
{"code":401,"indent":0,"parameters":["Еще нужно ракушек: "]},
{"code":401,"indent":0,"parameters":["Собрано: \\v[21]/5"]},
{"code":0,"indent":0,"parameters":[]},
{"code":412,"indent":0,"parameters":[]},
{"code":412,"indent":0,"parameters":[]}
```

---

## 📝 ПОЛНЫЙ КОД ИСПРАВЛЕННОГО СОБЫТИЯ

### Страница 1 (Начало квеста):
```javascript
{
  "id": 8,
  "name": "EV008",
  "pages": [
    {
      "conditions": {
        "actorId": 1,
        "actorValid": false,
        "itemId": 1,
        "itemValid": false,
        "selfSwitchCh": "A",
        "selfSwitchValid": false,
        "switch1Id": 1,
        "switch1Valid": false,
        "switch2Id": 1,
        "switch2Valid": false,
        "variableId": 1,
        "variableValid": false,
        "variableValue": 0
      },
      "directionFix": false,
      "image": {
        "tileId": 0,
        "characterName": "Торговец",
        "direction": 4,
        "pattern": 0,
        "characterIndex": 0
      },
      "list": [
        // ... существующий диалог до конца ...
        {"code":355,"indent":0,"parameters":["$gameVariables.setValue(20, 1);"]},
        {"code":655,"indent":0,"parameters":["SoundManager.playOk();"]},
        {"code":123,"indent":0,"parameters":["A",0]},
        {"code":0,"indent":0,"parameters":[]}
      ],
      "moveFrequency": 3,
      "moveRoute": {"list": [{"code":0,"parameters":[]}],"repeat": true,"skippable": false,"wait": false},
      "moveSpeed": 3,
      "moveType": 0,
      "priorityType": 1,
      "stepAnime": false,
      "through": false,
      "trigger": 0,
      "walkAnime": true
    }
  ],
  "x": 12,
  "y": 7
}
```

---

## 🎯 РЕЗУЛЬТАТ ПОСЛЕ ИСПРАВЛЕНИЙ

1. **Первый разговор**: Устанавливает 20 = 1, инициализирует счетчик
2. **Повторный разговор**: Проверяет этап квеста и действует соответственно
3. **При 20 = 2**: Проверяет количество ракушек, выдает баллон при достаточном количестве
4. **При 20 = 3**: Переходит к следующему этапу квеста

Это создаст правильную логику квеста, соответствующую системе, описанной в `ACTPO_QuestConfig.js`.