# 🔄 АВТОМАТИЧЕСКАЯ СМЕНА ЗАДАНИЯ ПРИ СБОРЕ 5 РАКУШЕК

## 📍 ГДЕ СОЗДАТЬ: 
**Карта**: Вермилион (Map003)  
**Событие**: Параллельное (Parallel Process)

---

## 🎯 ЛОГИКА РАБОТЫ:

### Условие срабатывания:
- **Переменная 20 = 5** (этап "Собрать ракушки")  
- **Переменная 21 >= 5** (собрано 5 ракушек)
- **Переменная 20 НЕ равна 6** (задание еще не сменилось)

### Действие:
- Установить **20 = 6** (сменить на "Вернуться к торговцу")
- Показать уведомление: "Задание обновлено!"

---

## 🔧 КОД СОБЫТИЯ:

### Создать новое событие "AutoQuestUpdate":

```javascript
{
  "id": 99,
  "name": "AutoQuestUpdate",
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
        "variableId": 20,
        "variableValid": true,
        "variableValue": 5
      },
      "directionFix": false,
      "image": {
        "characterIndex": 0,
        "characterName": "",
        "direction": 2,
        "pattern": 0,
        "tileId": 0
      },
      "list": [
        {"code":111,"indent":0,"parameters":[1,21,0,5,1]},  // Если 21 >= 5
        {"code":111,"indent":1,"parameters":[1,20,0,6,0]},  // И 20 != 6
        {"code":355,"indent":2,"parameters":["$gameVariables.setValue(20, 6);"]},  // Устанавливаем 20 = 6
        {"code":655,"indent":2,"parameters":["SoundManager.playOk();"]},
        {"code":101,"indent":2,"parameters":["",0,0,2]},
        {"code":401,"indent":2,"parameters":["\\I[68] Задание обновлено!"]},
        {"code":401,"indent":2,"parameters":["Вернитесь к торговцу за баллоном."]},
        {"code":123,"indent":2,"parameters":["A",0]},  // Включаем switch для остановки события
        {"code":0,"indent":2,"parameters":[]},
        {"code":412,"indent":1,"parameters":[]},
        {"code":0,"indent":1,"parameters":[]},
        {"code":412,"indent":0,"parameters":[]}
      ],
      "moveFrequency": 3,
      "moveRoute": {"list": [{"code":0,"parameters":[]}],"repeat": true,"skippable": false,"wait": false},
      "moveSpeed": 3,
      "moveType": 0,
      "priorityType": 0,
      "stepAnime": false,
      "through": false,
      "trigger": 4,  // ← ВАЖНО: Parallel Process
      "walkAnime": true
    },
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
        "variableId": 1,
        "variableValid": false,
        "variableValue": 0
      },
      "directionFix": false,
      "image": {
        "characterIndex": 0,
        "characterName": "",
        "direction": 2,
        "pattern": 0,
        "tileId": 0
      },
      "list": [
        {"code":0,"indent":0,"parameters":[]}  // Пустое событие (остановка)
      ],
      "moveFrequency": 3,
      "moveRoute": {"list": [{"code":0,"parameters":[]}],"repeat": true,"skippable": false,"wait": false},
      "moveSpeed": 3,
      "moveType": 0,
      "priorityType": 0,
      "stepAnime": false,
      "through": false,
      "trigger": 0,
      "walkAnime": true
    }
  ],
  "x": 0,
  "y": 0
}
```

---

## 📝 ОБЪЯСНЕНИЕ КОДА:

### Первая страница (активна при 20 = 5):
1. **Проверяет**: 21 >= 5 AND 20 != 6
2. **Устанавливает**: 20 = 6
3. **Показывает**: Уведомление об обновлении задания
4. **Включает**: Switch A (для остановки)

### Вторая страница (активна при Switch A = true):
1. **Останавливает**: Событие больше не выполняется

---

## 🎮 РЕЗУЛЬТАТ:

### До сбора 5 ракушек:
- **Задание**: "Собрать ракушки (\\v[21]/5)"
- **Переменная**: 20 = 5

### После сбора 5 ракушек:
- **Автоматически меняется на**: "Вернуться к торговцу получть балон"  
- **Переменная**: 20 = 6
- **Показывается**: Уведомление "Задание обновлено!"

---

## ⚙️ НАСТРОЙКА В РЕДАКТОРЕ:

### Шаг 1: Создать событие
- Открыть карту Вермилион (Map003)
- Создать новое событие
- Название: "AutoQuestUpdate"
- Позиция: x=0, y=0 (любая, событие невидимое)

### Шаг 2: Настроить триггер
- **Trigger**: Parallel Process (Параллельный процесс)
- **Conditions**: Variable 20 = 5

### Шаг 3: Добавить код
- Скопировать код из блока выше
- Или настроить через интерфейс RPG Maker

---

## 🔄 АЛЬТЕРНАТИВНЫЕ СПОСОБЫ:

### Способ 1: Общий ивент (Common Event)
- Создать общий ивент "CheckQuestProgress"
- Вызывать его при подборе каждой ракушки
- Проверять условие и менять задание

### Способ 2: Скрипт в событии предмета
- В событии подбора ракушки добавить скрипт
- Проверять количество и менять задание

**Рекомендую способ с параллельным событием** - он проще и надежнее!