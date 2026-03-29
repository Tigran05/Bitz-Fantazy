# 🌍 Плагин мультиязычности ACTPO_MultiLanguage

## 📋 Описание

Плагин добавляет поддержку 7 языков в игру "Охотники за Казино":
- 🇷🇺 Русский (ru)
- 🇬🇧 English (en)
- 🇩🇪 Deutsch (de)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)
- 🇯🇵 日本語 (ja)
- 🇨🇳 中文 (zh)

---

## 🚀 Установка

1. Скопируй файл `ACTPO_MultiLanguage.js` в папку `js/plugins/`
2. В RPG Maker открой "Plugin Manager" (F10)
3. Добавь плагин `ACTPO_MultiLanguage`
4. Настрой параметры:
   - **Default Language**: ru (по умолчанию)
   - **Show Language Button**: true (показывать в меню)

---

## 📖 Как использовать

### 1. В диалогах (Show Text)

Используй специальные коды в тексте:

```
\lang[ru]Привет, герой!\lang[en]Hello, hero!\lang[end]
```

Или сокращённо:

```
\t[common][yes]  →  "Да" / "Yes"
\t[menu][save]   →  "Сохранить" / "Save"
```

---

### 2. Команды плагина (Plugin Commands)

**Сменить язык:**
```
ChangeLanguage ru   →  Русский
ChangeLanguage en   →  English
ChangeLanguage de   →  Deutsch
```

**Показать меню выбора языка:**
```
ShowLanguageMenu
```

---

### 3. Перевод квестов

Квесты автоматически переводятся через объект `ACTPO_Translations`.

Пример для Главы 1:

```javascript
window.ACTPO_Translations.ru.quests_chapter_1 = {
    1: "Поговорить с Барменом Майком",
    2: "Избавить подвал от крыс (\\v[11]/3)",
    // ...
};

window.ACTPO_Translations.en.quests_chapter_1 = {
    1: "Talk to Bartender Mike",
    2: "Clear the basement of rats (\\v[11]/3)",
    // ...
};
```

---

### 4. Добавление новых переводов

Открой файл `ACTPO_MultiLanguage.js` и добавь в нужный язык:

```javascript
window.ACTPO_Translations.ru = {
    // ...
    
    // Добавь свою категорию
    my_category: {
        key1: "Текст на русском",
        key2: "Другой текст"
    }
};

window.ACTPO_Translations.en = {
    // ...
    
    my_category: {
        key1: "Text in English",
        key2: "Other text"
    }
};
```

Использование в диалоге:
```
\t[my_category][key1]
```

---

## 🎮 Как это работает в игре

### Главное меню

Если `Show Language Button = true`, в меню появится пункт "Язык" / "Language".

При нажатии откроется окно выбора языка.

### Автоматическое сохранение

Выбранный язык сохраняется в `localStorage` браузера и загружается при следующем запуске.

### Fallback

Если перевод не найден для текущего языка, плагин использует русский как резервный.

---

## 📝 Категории переводов

| Категория | Описание |
|-----------|----------|
| `menu` | Пункты меню |
| `common` | Общие фразы (Да/Нет/Отмена) |
| `battle` | Боевая система |
| `quests_chapter_1` | Квесты Главы 1 |
| `quests_chapter_2` | Квесты Главы 2 |
| ... | ... |
| `quests_chapter_7` | Квесты Главы 7 |
| `characters` | Имена персонажей |
| `cities` | Названия городов |
| `casinos` | Названия казино |

---

## 💡 Примеры использования

### Диалог с NPC

```
\lang[ru]
Катя: Вот мы и в Битцленде.
\lang[en]
Kate: Here we are in Bitzland.
\lang[end]
```

### Перевод через ключи

```
\t[characters][kate]: \t[cities][bitzland] — \t[casinos][golden_jackpot]
```

Результат:
- 🇷🇺 Катя: Битцленд — Золотой Джекпот
- 🇬🇧 Kate: Bitzland — Golden Jackpot

### Условный диалог

```
\lang[ru]Добро пожаловать!\lang[en]Welcome!\lang[de]Willkommen!\lang[end]
```

---

## 🔧 Для разработчиков

### API плагина

```javascript
// Получить текущий язык
var lang = ACTPO_LanguageManager.getCurrentLanguage(); // "ru", "en", etc.

// Установить язык
ACTPO_LanguageManager.setCurrentLanguage('en');

// Получить перевод
var text = ACTPO_LanguageManager.translate('menu', 'save'); // "Сохранить" / "Save"

// Получить текст квеста
var quest = ACTPO_LanguageManager.getQuestText(1, 2); // Глава 1, шаг 2
```

### Проверка в условиях

В событиях можно проверять текущий язык:

```javascript
if (ACTPO_LanguageManager.getCurrentLanguage() === 'ru') {
    // Русский текст
} else {
    // Английский текст
}
```

---

## 📁 Структура файлов

```
js/
└── plugins/
    └── ACTPO_MultiLanguage.js   ← Плагин

docs/
└── MULTILANGUAGE_GUIDE.md       ← Эта документация
```

---

## ✅ Чек-лист перед релизом

- [ ] Все диалоги переведены на 7 языков
- [ ] Все квесты переведены
- [ ] Меню и интерфейс переведены
- [ ] Имена персонажей переведены
- [ ] Названия городов и казино переведены
- [ ] Проверена работа на всех языках

---

## 🆘 Частые проблемы

### Проблема: Текст не переводится
**Решение:** Проверь, что используешь правильные коды `\lang[ru]...\lang[end]` или `\t[category][key]`

### Проблема: Кнопка языка не появляется в меню
**Решение:** Установи `Show Language Button = true` в настройках плагина

### Проблема: Язык сбрасывается после перезапуска
**Решение:** Проверь, что браузер поддерживает `localStorage`

---

✨ **Плагин готов к использованию!** ✨
