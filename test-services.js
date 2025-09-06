/**
 * Тестовый скрипт для проверки новых сервисов
 */

const NewCoinsService = require('./src/services/newCoinsService');
const MoonersService = require('./src/services/moonersService');

async function testServices() {
    console.log('🔍 Тестирование новых сервисов...\n');

    // Тест сервиса новых монет
    console.log('📊 Тестирование NewCoinsService...');
    try {
        const newCoinsService = new NewCoinsService();
        const newCoins = await newCoinsService.getNewCoins();
        console.log(`✅ NewCoinsService работает! Найдено ${newCoins.length} новых монет`);
        
        // Показать форматированное сообщение
        const formattedMessage = newCoinsService.formatNewCoinsMessage(newCoins);
        console.log('📝 Пример форматированного сообщения:');
        console.log(formattedMessage.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Ошибка NewCoinsService:', error.message);
    }

    // Тест сервиса моонеров
    console.log('🚀 Тестирование MoonersService...');
    try {
        const moonersService = new MoonersService();
        const mooners = await moonersService.getMooners(10);
        console.log(`✅ MoonersService работает! Найдено ${mooners.length} моонеров`);
        
        // Показать форматированное сообщение
        const formattedMessage = moonersService.formatMoonersMessage(mooners, 10);
        console.log('📝 Пример форматированного сообщения:');
        console.log(formattedMessage.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Ошибка MoonersService:', error.message);
    }

    console.log('✅ Тестирование завершено!');
}

// Запускаем тесты, если скрипт вызван напрямую
if (require.main === module) {
    testServices().catch(console.error);
}

module.exports = testServices;