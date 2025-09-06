const TelegramBot = require('node-telegram-bot-api');

// Импортируем модульные компоненты
const CallbackHandler = require('../src/handlers/callbackHandler');
const BasicCommands = require('../src/commands/basicCommands');
const { getWelcomeWithMenu, getMainMenuKeyboard, getHelpMessage } = require('../ui');

// Bot token from environment variables
const token = process.env.BOT_TOKEN;

if (!token) {
    throw new Error('BOT_TOKEN не найден в переменных окружения!');
}

// Создаем экземпляр бота без polling для webhook
const bot = new TelegramBot(token);

// Обработчик для webhook
module.exports = async (req, res) => {
    // Импортируем модули внутри функции для Vercel
    try {
        const CallbackHandler = require('../src/handlers/callbackHandler');
        const BasicCommands = require('../src/commands/basicCommands');
        const { getWelcomeWithMenu, getMainMenuKeyboard, getHelpMessage } = require('../ui');
        
        // Инициализируем модульные обработчики
        const callbackHandler = new CallbackHandler(bot);
        const basicCommands = new BasicCommands(bot);
        
        // Регистрируем команды
        basicCommands.registerCommands();

        if (req.method === 'POST') {
            const update = req.body;
            
            // Обрабатываем обновление
            if (update.message) {
                const msg = update.message;
                
                // Команда /start
                if (msg.text === '/start') {
                    const chatId = msg.chat.id;
                    const welcomeMessage = getWelcomeWithMenu();
                    const keyboard = getMainMenuKeyboard();
                    
                    await bot.sendMessage(chatId, welcomeMessage, { 
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                }
                // Команда /help
                else if (msg.text === '/help') {
                    const chatId = msg.chat.id;
                    const helpMessage = getHelpMessage();
                    const keyboard = getMainMenuKeyboard();
                    
                    await bot.sendMessage(chatId, helpMessage, { 
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                }
                // Другие текстовые сообщения
                else if (msg.text && !msg.text.startsWith('/')) {
                    await basicCommands.handleTextMessage(msg);
                }
            }
            
            // Обрабатываем callback queries
            if (update.callback_query) {
                try {
                    await callbackHandler.handleCallback(update.callback_query);
                } catch (error) {
                    if (error.message.includes('query is too old') || error.message.includes('query ID is invalid')) {
                        console.log('⚠️ Игнорируем старый callback query:', error.message);
                        try {
                            await bot.answerCallbackQuery(update.callback_query.id);
                        } catch (answerError) {
                            // Игнорируем ошибки при ответе на старые queries
                        }
                    } else {
                        console.error('❌ Ошибка в callback handler:', error);
                    }
                }
            }
            
            res.status(200).json({ ok: true });
        } else {
            // GET запрос для проверки работоспособности
            res.status(200).json({ 
                status: 'Crypto Tracker Bot is running',
                timestamp: new Date().toISOString(),
                mode: 'Basic functions only'
            });
        }
    } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
>>>>>>> b56a6a8a684d32fad04d646bd79b414efdc9c0e1
};
=======
};
>>>>>>> b56a6a8a684d32fad04d646bd79b414efdc9c0e1
