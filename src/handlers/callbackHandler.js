/**
 * Модуль для обработки callback queries (нажатий на inline кнопки)
 */

const { getAllStats } = require('../../exchange');
const NewCoinsService = require('../services/newCoinsService');
const MoonersService = require('../services/moonersService');
const ListingsWatcherService = require('../services/listingsWatcherService');
const { 
    formatCompactStats, 
    formatTableStats, 
    formatError, 
    getHelpMessage,
    getWelcomeWithMenu,
    getMenuMessage,
    getMainMenuKeyboard
} = require('../../ui');

class CallbackHandler {
    constructor(bot) {
        this.bot = bot;
        this.newCoinsService = new NewCoinsService();
        this.moonersService = new MoonersService();
        this.listingsWatcher = new ListingsWatcherService();
        
        // Запускаем отслеживание листингов
        this.listingsWatcher.startWatching();
    }

    // Основной обработчик callback queries
    async handleCallback(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const data = callbackQuery.data;
        
        // Отвечаем на callback query чтобы убрать loading
        await this.bot.answerCallbackQuery(callbackQuery.id);
        
        try {
            switch (data) {
                case 'compact':
                    await this.handleCompact(chatId);
                    break;
                case 'table':
                    await this.handleTable(chatId);
                    break;
                case 'test':
                    await this.handleTest(chatId);
                    break;
                case 'help':
                    await this.handleHelp(chatId);
                    break;
                case 'status':
                    await this.handleStatus(chatId);
                    break;
                case 'new_coins':
                    await this.handleNewCoins(chatId);
                    break;
                case 'new_listings':
                    await this.handleNewListings(chatId);
                    break;
                case 'mooners':
                    await this.handleMooners(chatId);
                    break;
                case 'clear':
                case 'menu':
                    await this.handleClearChat(chatId, messageId);
                    break;
                default:
                    console.log('Неизвестный callback:', data);
            }
        } catch (error) {
            console.error('Ошибка обработки callback query:', error);
            
            try {
                await this.bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте еще раз.', {
                    reply_markup: getMainMenuKeyboard()
                });
            } catch (e) {
                console.error('Ошибка отправки сообщения об ошибке:', e);
            }
        }
    }

    // Краткая сводка
    async handleCompact(chatId) {
        const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Загружаю краткую сводку...', { parse_mode: 'Markdown' });
        
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
            console.error('Ошибка краткой статистики:', error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const errorMessage = formatError(error?.message ?? 'Неизвестная ошибка');
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.sendMessage(chatId, errorMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // Табличный формат
    async handleTable(chatId) {
        const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Загружаю таблицу...', { parse_mode: 'Markdown' });
        
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
            console.error('Ошибка табличной статистики:', error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const errorMessage = formatError(error?.message ?? 'Неизвестная ошибка');
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.sendMessage(chatId, errorMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // Быстрый тест
    async handleTest(chatId) {
        const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Тестирую соединение...', { parse_mode: 'Markdown' });
        
        try {
            const startTime = Date.now();
            const testData = await getAllStats(['BTC']);
            const duration = Date.now() - startTime;
            
            const workingExchanges = testData.filter(item => item.price !== null);
            
            let message = `📊 *Тест соединения завершен*\n\n`;
            message += `⏱️ Время: ${(duration/1000).toFixed(1)}s\n`;
            message += `✅ Работают: ${workingExchanges.length}/7 бирж\n\n`;
            
            workingExchanges.forEach(item => {
                const emoji = '⚫'; // Черный кружок для всех работающих бирж
                message += `${emoji} ${item.exchange.toUpperCase()}: $${Number(item.price).toLocaleString()}\n`;
            });
            
            const failedExchanges = testData.filter(item => item.price === null);
            if (failedExchanges.length > 0) {
                message += `\n❌ Не отвечают: ${failedExchanges.map(e => e.exchange).join(', ')}`;
            }
            
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        } catch (error) {
            console.error('Ошибка теста:', error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.sendMessage(chatId, `❌ *Ошибка теста*\n\n${error.message}`, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // Помощь
    async handleHelp(chatId) {
        const helpMessage = getHelpMessage();
        const keyboard = getMainMenuKeyboard();
        
        await this.bot.sendMessage(chatId, helpMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    // Статус
    async handleStatus(chatId) {
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 60)} минут ${Math.floor(uptime % 60)} секунд`;
        
        const statusMessage = `✅ *Статус бота: Активен*\n\n⏱️ Время работы: ${uptimeString}\n🔄 Режим: Polling\n📊 Состояние: Готов к работе\n\n🛠️ *Техническая информация:*\n• Node.js: ${process.version}\n• Поддержка 7 бирж\n• Отслеживание 9 криптовалют`;
        const keyboard = getMainMenuKeyboard();
        
        await this.bot.sendMessage(chatId, statusMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    // Новые монеты за последний час
    async handleNewCoins(chatId) {
        const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Поиск перспективных монет...', { parse_mode: 'Markdown' });
        
        try {
            const newCoins = await this.newCoinsService.getNewCoins();
            const formattedMessage = this.newCoinsService.formatNewCoinsMessage(newCoins);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        } catch (error) {
            console.error('Ошибка получения новых монет:', error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.sendMessage(chatId, `❌ *Ошибка получения новых монет*\n\n${error.message}`, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // Новые листинги - реальное отслеживание
    async handleNewListings(chatId) {
        const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Проверяю новые листинги...', { parse_mode: 'Markdown' });
        
        try {
            // Получаем последние листинги
            const formattedMessage = this.listingsWatcher.formatListingsMessage();
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        } catch (error) {
            console.error('Ошибка получения листингов:', error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.sendMessage(chatId, `❌ *Ошибка получения листингов*\n\n${error.message}`, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // Моонеры - монеты с ростом >10% за день
    async handleMooners(chatId) {
        const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Поиск моонеров (+10% за день)...', { parse_mode: 'Markdown' });
        
        try {
            const mooners = await this.moonersService.getMooners(10);
            const formattedMessage = this.moonersService.formatMoonersMessage(mooners, 10);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            await this.bot.sendMessage(chatId, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        } catch (error) {
            console.error('Ошибка получения моонеров:', error);
            await this.bot.deleteMessage(chatId, loadingMsg.message_id);
            const keyboard = getMainMenuKeyboard();
            
            await this.bot.sendMessage(chatId, `❌ *Ошибка получения моонеров*\n\n${error.message}`, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // Очистка чата
    async handleClearChat(chatId, messageId) {
        try {
            // Пытаемся удалить последние 30 сообщений
            const currentMessageId = messageId;
            const messagesToDelete = [];
            
            for (let i = 0; i < 30; i++) {
                messagesToDelete.push(currentMessageId - i);
            }
            
            // Удаляем сообщения
            for (const msgId of messagesToDelete) {
                try {
                    await this.bot.deleteMessage(chatId, msgId);
                } catch (e) {
                    // Игнорируем ошибки удаления (сообщение может не существовать)
                }
            }
        } catch (e) {
            console.warn('Не удалось очистить чат полностью:', e.message);
        }
        
        // Отправляем приветственное сообщение заново
        const welcomeMessage = getWelcomeWithMenu();
        const keyboard = getMainMenuKeyboard();
        
        await this.bot.sendMessage(chatId, welcomeMessage, { 
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }
}

module.exports = CallbackHandler;