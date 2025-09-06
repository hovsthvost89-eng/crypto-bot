# 🚀 Деплой на Vercel - Пошаговая инструкция

## 🎯 Преимущества Vercel:
- ✅ **Полностью бесплатный** для личных проектов
- ✅ **Автоматический деплой** из GitHub
- ✅ **Безлимитные запросы** на бесплатном плане
- ✅ **Быстрый CDN** по всему миру
- ✅ **Простая настройка** переменных окружения

## 📋 Шаг 1: Подготовка GitHub репозитория

### 1.1 Создание репозитория
1. Перейдите на [github.com](https://github.com)
2. Нажмите **"New repository"**
3. Название: `crypto-bot-vercel`
4. Выберите **"Public"**
5. Нажмите **"Create repository"**

### 1.2 Загрузка файлов
Загрузите ВСЕ файлы проекта в GitHub, **КРОМЕ**:
- ❌ `.env` (секретный!)
- ❌ `node_modules/`

**✅ Обязательно загрузите:**
- `api/webhook.js` (новый файл для Vercel)
- `vercel.json` (конфигурация)
- `setup-webhook.js` (скрипт настройки)
- Все остальные файлы проекта

## 🚀 Шаг 2: Деплой на Vercel

### 2.1 Создание аккаунта
1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **"Sign Up"**
3. Выберите **"Continue with GitHub"**
4. Разрешите доступ Vercel к GitHub

### 2.2 Импорт проекта
1. На главной странице Vercel нажмите **"New Project"**
2. Найдите ваш репозиторий `crypto-bot-vercel`
3. Нажмите **"Import"**
4. **Framework Preset**: оставьте "Other"
5. Нажмите **"Deploy"**

### 2.3 Настройка переменных окружения
1. После деплоя перейдите в **"Settings"** → **"Environment Variables"**
2. Добавьте переменную:
   - **Name**: `BOT_TOKEN`
   - **Value**: `8377698818:AAEyxS4NRVoPnaZpRcep6uHroY428YDTBl4`
   - **Environments**: выберите все (Production, Preview, Development)
3. Нажмите **"Save"**

### 2.4 Получение URL
После деплоя вы получите URL вашего приложения:
```
https://crypto-bot-vercel-username.vercel.app
```
**Скопируйте этот URL!** Он понадобится для настройки webhook.

## ⚙️ Шаг 3: Настройка Webhook

### 3.1 Локальная настройка (ОДИН РАЗ)
1. **Откройте терминал на вашем компьютере**
2. **Перейдите в папку проекта:**
   ```bash
   cd /Users/rbkuser/Desktop/bot
   ```
3. **Создайте файл .env.vercel:**
   ```bash
   echo "BOT_TOKEN=8377698818:AAEyxS4NRVoPnaZpRcep6uHroY428YDTBl4" > .env.vercel
   echo "WEBHOOK_URL=https://ВАШ-URL.vercel.app/api/webhook" >> .env.vercel
   ```
   **Замените `ВАШ-URL` на реальный URL!**

4. **Установите webhook:**
   ```bash
   node setup-webhook.js set
   ```

### 3.2 Проверка webhook
```bash
node setup-webhook.js info
```

Вы должны увидеть:
```
📊 Информация о webhook:
URL: https://ваш-url.vercel.app/api/webhook
Ожидает обновлений: 0
```

## ✅ Шаг 4: Тестирование

### 4.1 Проверка работы
1. **Откройте браузер** и перейдите по адресу:
   ```
   https://ваш-url.vercel.app/api/webhook
   ```
2. **Вы должны увидеть:**
   ```json
   {
     "status": "Crypto Tracker Bot is running",
     "timestamp": "2025-08-27T..."
   }
   ```

### 4.2 Тестирование бота
1. **Откройте Telegram**
2. **Найдите @Cryptohvost_bot**
3. **Отправьте `/start`**
4. **Бот должен ответить!**

## 🔧 Устранение неполадок

### Проблема: Бот не отвечает
**Решение:**
1. Проверьте логи в Vercel Dashboard → Functions
2. Убедитесь, что webhook установлен правильно:
   ```bash
   node setup-webhook.js info
   ```

### Проблема: Ошибка webhook
**Решение:**
1. Перейдите в Vercel Dashboard
2. Скопируйте точный URL вашего приложения
3. Переустановите webhook с правильным URL

### Проблема: Переменные окружения
**Решение:**
1. Проверьте Settings → Environment Variables в Vercel
2. Убедитесь, что `BOT_TOKEN` добавлен для всех environments
3. После изменения переменных сделайте Redeploy

## 🎉 Готово!

Ваш бот теперь работает на Vercel:
- 🌍 **Доступен глобально** через CDN
- 🆓 **Полностью бесплатный**
- ⚡ **Быстрые ответы** благодаря serverless архитектуре
- 🔄 **Автоматические обновления** при изменении кода в GitHub

### Полезные ссылки:
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Ваш бот**: [@Cryptohvost_bot](https://t.me/Cryptohvost_bot)
- **Документация Vercel**: [vercel.com/docs](https://vercel.com/docs)

### Важные заметки:
- 🔄 Для обновления бота просто загрузите новый код в GitHub
- 📊 Следите за использованием в Vercel Dashboard
- 🔧 Логи функций доступны в реальном времени
- 🚫 Не забывайте, что это serverless - каждый запрос "холодный старт"