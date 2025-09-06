require('dotenv').config();
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-app-name.vercel.app/api/webhook';

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не найден в .env файле!');
    process.exit(1);
}

if (WEBHOOK_URL.includes('your-app-name')) {
    console.error('❌ Пожалуйста, замените WEBHOOK_URL на реальный URL вашего Vercel приложения!');
    console.log('Пример: https://crypto-bot-username.vercel.app/api/webhook');
    process.exit(1);
}

// Функция для установки webhook
function setWebhook() {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    const data = JSON.stringify({
        url: WEBHOOK_URL
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log(`🔧 Устанавливаем webhook: ${WEBHOOK_URL}`);

    const req = https.request(url, options, (res) => {
        let response = '';
        
        res.on('data', (chunk) => {
            response += chunk;
        });
        
        res.on('end', () => {
            const result = JSON.parse(response);
            if (result.ok) {
                console.log('✅ Webhook успешно установлен!');
                console.log('📋 Описание:', result.description);
            } else {
                console.error('❌ Ошибка установки webhook:', result.description);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Ошибка запроса:', error);
    });

    req.write(data);
    req.end();
}

// Функция для получения информации о webhook
function getWebhookInfo() {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;

    https.get(url, (res) => {
        let response = '';
        
        res.on('data', (chunk) => {
            response += chunk;
        });
        
        res.on('end', () => {
            const result = JSON.parse(response);
            if (result.ok) {
                console.log('📊 Информация о webhook:');
                console.log('URL:', result.result.url || 'Не установлен');
                console.log('Ожидает обновлений:', result.result.pending_update_count);
                if (result.result.last_error_date) {
                    console.log('Последняя ошибка:', new Date(result.result.last_error_date * 1000));
                    console.log('Сообщение ошибки:', result.result.last_error_message);
                }
            }
        });
    });
}

// Проверяем аргументы командной строки
const command = process.argv[2];

if (command === 'set') {
    setWebhook();
} else if (command === 'info') {
    getWebhookInfo();
} else {
    console.log('💡 Использование:');
    console.log('node setup-webhook.js set  - Установить webhook');
    console.log('node setup-webhook.js info - Получить информацию о webhook');
}