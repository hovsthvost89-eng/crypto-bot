# ✅ ЧЕКЛИСТ ДЛЯ ДЕПЛОЯ НА VERCEL

## 📋 Что нужно сделать:

### 1. 🆕 Создать репозиторий на GitHub
- [ ] Зайти на github.com
- [ ] Нажать "New repository"
- [ ] Назвать репозиторий (например: `crypto-bot-vercel`)
- [ ] Поставить галочки: Public, README, .gitignore (Node)
- [ ] Нажать "Create repository"

### 2. 📤 Загрузить файлы в GitHub
- [ ] Нажать "Upload files" в созданном репозитории
- [ ] Загрузить ВСЕ файлы из папки `/Users/rbkuser/Desktop/bot/`
- [ ] ✅ ОБЯЗАТЕЛЬНО загрузить: `api/webhook.js`, `vercel.json`
- [ ] ❌ НЕ ЗАГРУЖАТЬ файл `.env` (он содержит токен!)
- [ ] ❌ НЕ ЗАГРУЖАТЬ папку `node_modules`
- [ ] Написать commit: "Initial commit for Vercel"
- [ ] Нажать "Commit changes"

### 3. 🚀 Деплой на Vercel
- [ ] Перейти на vercel.com
- [ ] Войти через GitHub
- [ ] Нажать "New Project"
- [ ] Выбрать ваш репозиторий `crypto-bot-vercel`
- [ ] Нажать "Import" → "Deploy"
- [ ] Дождаться завершения деплоя
- [ ] **СКОПИРОВАТЬ URL** приложения (например: `https://crypto-bot-vercel-username.vercel.app`)

### 4. 🔧 Настроить переменные в Vercel
- [ ] В Vercel перейти в "Settings" → "Environment Variables"
- [ ] Добавить переменную:
  - Name: `BOT_TOKEN`
  - Value: `8377698818:AAEyxS4NRVoPnaZpRcep6uHroY428YDTBl4`
  - Environments: выбрать все
- [ ] Нажать "Save"

### 5. ⚙️ Настроить Webhook (ЛОКАЛЬНО НА КОМПЬЮТЕРЕ)
- [ ] Открыть терминал
- [ ] Перейти в папку: `cd /Users/rbkuser/Desktop/bot`
- [ ] Создать файл с webhook URL:
  ```bash
  echo "BOT_TOKEN=8377698818:AAEyxS4NRVoPnaZpRcep6uHroY428YDTBl4" > .env.vercel
  echo "WEBHOOK_URL=https://ВАШ-URL.vercel.app/api/webhook" >> .env.vercel
  ```
  **Замените ВАШ-URL на реальный!**
- [ ] Установить webhook: `node setup-webhook.js set`
- [ ] Проверить: `node setup-webhook.js info`

### 6. ✅ Проверить работу
- [ ] Открыть в браузере: `https://ваш-url.vercel.app/api/webhook`
- [ ] Должен показать: `{"status": "Crypto Tracker Bot is running"}`
- [ ] Открыть Telegram
- [ ] Найти @Cryptohvost_bot
- [ ] Отправить `/start`
- [ ] Убедиться, что бот отвечает

## 🎯 РЕЗУЛЬТАТ:
После выполнения всех шагов ваш бот будет работать на Vercel БЕСПЛАТНО!

## 🔧 Если что-то не работает:
1. Проверьте логи в Vercel Dashboard → Functions
2. Убедитесь, что webhook установлен: `node setup-webhook.js info`
3. Проверьте переменные окружения в Vercel Settings
4. Убедитесь, что все файлы загружены в GitHub

## 🦝 Аватар для бота:
Используйте эмодзи енота 🦝 как аватар для вашего бота в Telegram через @BotFather!

## 🌟 Преимущества Vercel:
- ✅ **100% БЕСПЛАТНО** для личных проектов
- ✅ **Безлимитные запросы**
- ✅ **Быстрый CDN** по всему миру
- ✅ **Автоматические обновления** из GitHub