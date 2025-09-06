require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Импортируем модульные компоненты
const CallbackHandler = require('./src/handlers/callbackHandler');
const BasicCommands = require('./src/commands/basicCommands');
const { getWelcomeWithMenu, getMainMenuKeyboard, getHelpMessage } = require('./ui');

// Bot token from environment variables
const token = process.env.BOT_TOKEN;

// Проверяем наличие токена
if (!token) {
    console.error('❌ Ошибка: BOT_TOKEN не найден в .env файле!');
    process.exit(1);
}

console.log('🔑 Bot token найден:', token.substring(0, 10) + '...');

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот создан, начинаю polling...');

// Инициализируем модульные обработчики
const callbackHandler = new CallbackHandler(bot);
const basicCommands = new BasicCommands(bot);

// Регистрируем команды
basicCommands.registerCommands();

// Bot info
console.log('🚀 Crypto Tracker Bot starting (modular architecture)...');

// Error handling
bot.on('polling_error', (error) => {
    if (error.message.includes('query is too old') || error.message.includes('query ID is invalid')) {
        console.log('⚠️ Игнорируем старый callback query в polling:', error.message);
    } else {
        console.error('❌ Polling error:', error.message);
        console.error('Full error:', error);
    }
});

// Проверяем соединение с Telegram API
bot.getMe().then((botInfo) => {
    console.log('✅ Бот успешно подключен:', botInfo.first_name, '@' + botInfo.username);
}).catch((error) => {
    console.error('❌ Ошибка при подключении к Telegram:', error.message);
    process.exit(1);
});

// Basic commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = getWelcomeWithMenu();
    const keyboard = getMainMenuKeyboard();
    
    bot.sendMessage(chatId, welcomeMessage, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = getHelpMessage();
    const keyboard = getMainMenuKeyboard();
    
    bot.sendMessage(chatId, helpMessage, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Обработчик callback queries (используем модульный CallbackHandler)
bot.on('callback_query', async (callbackQuery) => {
    try {
        await callbackHandler.handleCallback(callbackQuery);
    } catch (error) {
        if (error.message.includes('query is too old') || error.message.includes('query ID is invalid')) {
            console.log('⚠️ Игнорируем старый callback query:', error.message);
            // Отвечаем на callback query чтобы убрать loading индикатор
            try {
                await bot.answerCallbackQuery(callbackQuery.id);
            } catch (answerError) {
                // Игнорируем ошибки при ответе на старые queries
            }
        } else {
            console.error('❌ Ошибка в callback handler:', error);
        }
    }
});

// Обработка произвольных текстовых сообщений (используем модульный обработчик)
bot.on('message', (msg) => {
    // Пропускаем callback queries и команды
    if (msg.text && !msg.text.startsWith('/')) {
        basicCommands.handleTextMessage(msg);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping bot...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping bot...');
    bot.stopPolling();
    process.exit(0);
});

console.log('✅ Modular Bot is ready! Use /start to begin.');