# 📖 Пошаговая инструкция для деплоя на Railway

## 🎯 Шаг 1: Создание репозитория на GitHub

### 1.1 Регистрация/Вход в GitHub
1. Перейдите на [github.com](https://github.com)
2. Войдите в свой аккаунт или зарегистрируйтесь

### 1.2 Создание нового репозитория
1. Нажмите зеленую кнопку **"New"** или значок **"+"** в правом верхнем углу
2. Выберите **"New repository"**
3. Заполните данные:
   - **Repository name**: `crypto-bot` (или любое другое название)
   - **Description**: `Telegram bot for cryptocurrency tracking`
   - ✅ Поставьте галочку **"Public"** (для бесплатного деплоя)
   - ✅ Поставьте галочку **"Add a README file"**
   - ✅ Поставьте галочку **"Add .gitignore"** → выберите **"Node"**
4. Нажмите **"Create repository"**

### 1.3 Получение ссылки на репозиторий
После создания скопируйте ссылку, она будет выглядеть так:
```
https://github.com/ВАШ_USERNAME/crypto-bot.git
```

## 🚀 Шаг 2: Загрузка кода

### 2.1 Через веб-интерфейс GitHub (Простой способ)

1. **Откройте ваш новый репозиторий на GitHub**
2. **Нажмите "uploading an existing file"** или кнопку **"+"** → **"Upload files"**
3. **Перетащите или выберите ВСЕ файлы проекта**, КРОМЕ:
   - ❌ `.env` (НЕ загружайте!)
   - ❌ `node_modules/` (если есть)
4. **В поле commit добавьте**: `Initial commit - Crypto bot`
5. **Нажмите "Commit changes"**

### 2.2 Список файлов для загрузки ✅

Загрузите ВСЕ эти файлы:
- ✅ `bot.js`
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `railway.json`
- ✅ `start.sh`
- ✅ `ui.js`
- ✅ `exchange.js`
- ✅ `test-bot.js`
- ✅ `test-listings.js`
- ✅ `test-services.js`
- ✅ `.gitignore`
- ✅ `.env.example`
- ✅ `README.md`
- ✅ `DEPLOYMENT.md`
- ✅ `FREE_HOSTING.md`
- ✅ `MODULAR_ARCHITECTURE.md`
- ✅ Папка `src/` со всем содержимым

### 2.3 НЕ загружайте ❌

- ❌ `.env` (содержит секретный токен!)
- ❌ `node_modules/` (генерируется автоматически)

## 🛤️ Шаг 3: Деплой на Railway

### 3.1 Создание аккаунта Railway
1. Перейдите на [railway.app](https://railway.app)
2. Нажмите **"Start a New Project"**
3. Выберите **"Login with GitHub"**
4. Разрешите доступ Railway к вашему GitHub

### 3.2 Деплой проекта
1. После входа нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Найдите и выберите ваш репозиторий `crypto-bot`
4. Railway автоматически начнет деплой

### 3.3 Настройка переменных окружения
1. **Откройте ваш проект в Railway**
2. **Перейдите в раздел "Variables"** (или "Settings" → "Environment")
3. **Добавьте переменную:**
   - **Name**: `BOT_TOKEN`
   - **Value**: `8377698818:AAEyxS4NRVoPnaZpRcep6uHroY428YDTBl4`
4. **Нажмите "Add"** или "Save"

### 3.4 Перезапуск сервиса
1. **Перейдите в раздел "Deployments"**
2. **Нажмите "Redeploy"** для применения переменных окружения
3. **Дождитесь завершения деплоя** (зеленый статус)

## ✅ Шаг 4: Проверка работы

### 4.1 Проверка логов
1. В Railway откройте раздел **"Logs"**
2. Найдите сообщения:
   ```
   ✅ Bot token найден: 8377698818...
   ✅ Бот успешно подключен: Cryptohvost @Cryptohvost_bot
   ✅ Modular Bot is ready! Use /start to begin.
   ```

### 4.2 Тестирование бота
1. **Откройте Telegram**
2. **Найдите @Cryptohvost_bot**
3. **Отправьте команду `/start`**
4. **Бот должен ответить приветственным сообщением**

## 🎉 Готово!

Ваш бот теперь работает онлайн 24/7 на Railway!

### Полезные ссылки:
- **Ваш бот в Telegram**: [@Cryptohvost_bot](https://t.me/Cryptohvost_bot)
- **Railway Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)
- **GitHub Repository**: `https://github.com/ВАШ_USERNAME/crypto-bot`

### Примечания:
- 🕒 Railway предоставляет **500 бесплатных часов в месяц**
- 🔄 Бот **автоматически перезапускается** при сбоях
- 📊 Следите за использованием ресурсов в Railway Dashboard
- 🔧 Для обновления кода просто загрузите новые файлы в GitHub