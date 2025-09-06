/**
 * Тестовый скрипт для сервиса отслеживания листингов
 */

const ListingsWatcherService = require('./src/services/listingsWatcherService');

async function testListingsWatcher() {
    console.log('🔍 Тестирование ListingsWatcherService...\n');

    const watcher = new ListingsWatcherService();
    
    try {
        // Тестируем инициализацию
        console.log('📊 Тестирование инициализации...');
        await watcher.initialize();
        
        // Проверяем форматирование сообщения
        console.log('📝 Тестирование форматирования сообщения...');
        const message = watcher.formatListingsMessage();
        console.log('Пример сообщения:');
        console.log(message.substring(0, 300) + '...');
        
        // Проверяем фильтр целевых монет
        console.log('\n🎯 Тестирование фильтра целевых монет:');
        const testSymbols = ['BTCUSDT', 'ETHUSDT', 'TRXUSDT', 'TONUSDT', 'ADAUSDT', 'DOGEUSDT'];
        testSymbols.forEach(symbol => {
            const isTarget = watcher.isTargetCoin(symbol);
            console.log(`${symbol}: ${isTarget ? '✅ Целевая' : '❌ Не целевая'}`);
        });
        
        console.log('\n✅ Тестирование завершено успешно!');
        
        // Не запускаем автоматическое отслеживание в тесте
        console.log('\n💡 Сервис готов к работе. Автоматическое отслеживание будет запущено в боте.');
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

// Запускаем тест
if (require.main === module) {
    testListingsWatcher().catch(console.error);
}