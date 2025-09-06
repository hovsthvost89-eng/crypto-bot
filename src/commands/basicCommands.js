/**
 * Модуль для обработки базовых текстовых команд
 */

const { getAllStats } = require('../../exchange');
const { 
    formatCompactStats, 
    formatTableStats, 
    formatError, 
    formatLoadingMessage,
    getHelpMessage,
    getWelcomeWithMenu,
    getMainMenuKeyboard
} = require('../../ui');

class BasicCommands {
    constructor(bot) {
        this.bot = bot;
    }

    // Регистрация всех команд
    registerCommands() {
        this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
        this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
        this.bot.onText(/\/compact/, (msg) => this.handleCompact(msg));
        this.bot.onText(/\/table/, (msg) => this.handleTable(msg));
        this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    }

    // Команда /start
    async handleStart(msg) {
        const chatId = msg.chat.id;
        const welcomeMessage = getWelcomeWithMenu();
        const keyboard = getMainMenuKeyboard();
        
        await this.bot.sendMessage(chatId, welcomeMessage, { 
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    // Команда /help
    async handleHelp(msg) {
        const chatId = msg.chat.id;
        const helpMessage = getHelpMessage();
        const keyboard = getMainMenuKeyboard();
        
        await this.bot.sendMessage(chatId, helpMessage, { 
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    // Команда /compact - краткая сводка
    async handleCompact(msg) {
        const chatId = msg.chat.id;
        
        const loadingMsg = await this.bot.sendMessage(chatId, formatLoadingMessage(), { parse_mode: 'Markdown' });
        
        try {
            const data = await getAllStats(['BTC', 'ETH', 'TRX', 'TON', 'USDC', 'BNB', 'SOL', 'XRP', 'ADA']);
            const formattedMessage = formatCompactStats(data);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, formattedMessage, { 
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Ошибка получения краткой статистики:', error);
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const errorMessage = formatError(error?.message ?? 'Неизвестная ошибка');
            await this.bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
        }
    }

    // Команда /table - табличный формат
    async handleTable(msg) {
        const chatId = msg.chat.id;
        
        const loadingMsg = await this.bot.sendMessage(chatId, formatLoadingMessage(), { parse_mode: 'Markdown' });
        
        try {
            const data = await getAllStats(['BTC', 'ETH', 'TRX', 'TON', 'USDC', 'BNB', 'SOL', 'XRP', 'ADA']);
            const formattedMessage = formatTableStats(data);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, formattedMessage, { 
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Ошибка получения табличной статистики:', error);
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const errorMessage = formatError(error?.message ?? 'Неизвестная ошибка');
            await this.bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
        }
    }

    // Команда /status - статус бота
    async handleStatus(msg) {
        const chatId = msg.chat.id;
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 60)} минут ${Math.floor(uptime % 60)} секунд`;
        
        const statusMessage = `✅ *Статус бота: Активен*

⏱️ Время работы: ${uptimeString}
🔄 Режим: Polling
📊 Состояние: Готов к работе

🛠️ *Техническая информация:*
• Node.js: ${process.version}
• Telegram Bot API: Подключен
• Поддержка 7 бирж
• Отслеживание 9 криптовалют`;
        
        const keyboard = getMainMenuKeyboard();
        
        await this.bot.sendMessage(chatId, statusMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    // Обработка произвольных текстовых сообщений
    handleTextMessage(msg) {
        const chatId = msg.chat.id;
        const messageText = msg.text;
        
        // Пропускаем команды, которые мы уже обрабатываем
        if (messageText && messageText.startsWith('/')) {
            return;
        }
        
        // Ответ на обычные сообщения
        if (messageText) {
            const responseMessage = `🤔 Я пока не понимаю обычные сообщения.

Используйте команды:
/start - Начать
/help - Помощь  
/status - Статус

🚧 Функции обработки текста будут добавлены позже для работы с криптовалютами.`;
            
            this.bot.sendMessage(chatId, responseMessage);
        }
    }
}

module.exports = BasicCommands;