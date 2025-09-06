require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

console.log('🔍 Проверяю токен...');
console.log('Токен найден:', token ? 'ДА' : 'НЕТ');

if (!token) {
    console.error('❌ BOT_TOKEN не найден в .env файле!');
    process.exit(1);
}

console.log('🔗 Токен:', token.substring(0, 15) + '...');

// Создаем бота без polling для проверки токена
const bot = new TelegramBot(token, { polling: false });

console.log('🤖 Проверяю подключение к Telegram API...');

bot.getMe()
    .then((botInfo) => {
        console.log('✅ Бот успешно подключен!');
        console.log('📋 Информация о боте:');
        console.log('   - Имя:', botInfo.first_name);
        console.log('   - Username:', '@' + botInfo.username);
        console.log('   - ID:', botInfo.id);
        console.log('   - Поддержка групп:', botInfo.can_join_groups ? 'ДА' : 'НЕТ');
        
        console.log('🚀 Включаю polling...');
        bot.startPolling();
        
        // Тестовый обработчик команды /start
        bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            console.log('📨 Получена команда /start от пользователя:', msg.from.first_name);
            bot.sendMessage(chatId, '✅ Бот работает! Тест успешен.');
        });
        
        console.log('✅ Бот готов к работе!');
        console.log('💡 Отправьте команду /start в Telegram для проверки');
        
    })
    .catch((error) => {
        console.error('❌ Ошибка при подключении к Telegram API:');
        console.error('   Код ошибки:', error.code);
        console.error('   Сообщение:', error.message);
        
        if (error.code === 401) {
            console.error('🔑 Проблема с токеном! Проверьте правильность BOT_TOKEN');
        } else if (error.code === 'ETIMEOUT') {
            console.error('⏱️ Тайм-аут подключения. Проверьте интернет-соединение');
        }
        
        process.exit(1);
    });

// Обработка ошибок polling
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Останавливаю бота...');
    bot.stopPolling();
    process.exit(0);
});