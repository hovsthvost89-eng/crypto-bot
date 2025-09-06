/**
 * Модуль пользовательского интерфейса для Telegram-бота
 * Форматирование сообщений с данными о криптовалютах
 */

// Форматирование чисел как в оригинальном React коде
function fmt(n, digits = 4) {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: digits });
}

// Компактный формат для быстрого обзора
function formatCompactStats(rows) {
  if (!rows || rows.length === 0) {
    return '🚧 Нет данных';
  }

  let message = '📈 *Краткая сводка*\n\n';
  
  // Группируем по активам
  const groupedByAsset = {};
  rows.forEach(row => {
    if (!groupedByAsset[row.asset]) {
      groupedByAsset[row.asset] = [];
    }
    groupedByAsset[row.asset].push(row);
  });

  Object.keys(groupedByAsset).forEach(asset => {
    const assetRows = groupedByAsset[asset].filter(row => row.price !== null);
    if (assetRows.length === 0) return;
    
    const emoji = getAssetEmoji(asset);
    const avgPrice = assetRows.reduce((sum, row) => sum + row.price, 0) / assetRows.length;
    const avgChange = assetRows.reduce((sum, row) => sum + (row.changePct24h || 0), 0) / assetRows.length;
    
    const changeIcon = getChangeIcon(avgChange);
    
    message += `${emoji} *${asset}*: ${fmt(avgPrice, 4)} USDT ${changeIcon}${fmt(avgChange, 2)}%\n`;
  });
  
  return message;
}

// Ошибка загрузки
function formatError(error) {
  return `❌ *Ошибка загрузки данных*\n\n🚨 ${error}`;
}

// Сообщение о загрузке
function formatLoadingMessage() {
  return `⏳ *Загружаю данные...*

🔄 Опрашиваю 7 бирж по 9 криптовалютам
🏢 Binance, Bybit, OKX, Kraken, MEXC, HTX, Poloniex
₿ BTC, 🔷 ETH, 🔴 TRX, 🔵 TON, 🟢 USDC, 🟡 BNB, 🟣 SOL, 🔶 XRP, ❤️ ADA

⏱️ Ожидайте 10-15 секунд...`;
}

// Сообщение о таймауте
function formatTimeoutMessage() {
  return `⏰ *Таймаут загрузки*

⚠️ Некоторые биржи не отвечают
🔄 Попробуйте еще раз через несколько секунд`;
}

// Вспомогательные функции для эмодзи
function getAssetEmoji(asset) {
  const emojis = {
    'BTC': '₿',
    'ETH': '🔷',
    'TRX': '🔴',
    'TON': '🔵',
    'USDC': '🟢',
    'BNB': '🟡',
    'SOL': '🟣',
    'XRP': '🔶',
    'ADA': '❤️'
  };
  return emojis[asset] || '💰';
}

function getExchangeEmoji(exchange) {
  const emojis = {
    'binance': '⚫',
    'bybit': '⚫',
    'okx': '⚫',
    'kraken': '⚫',
    'mexc': '⚫',
    'htx': '⚫',
    'poloniex': '⚫'
  };
  return emojis[exchange] || '⚫';
}

function getChangeIcon(changePct24h) {
  if (changePct24h == null) return '↔️';
  if (changePct24h > 0) return '🟢';
  if (changePct24h < 0) return '🔴';
  return '🟡';
}

// Форматирование таблицы (альтернативный формат)
function formatTableStats(rows) {
  if (!rows || rows.length === 0) {
    return '🚧 Нет данных';
  }

  let message = '📋 *Таблица котировок*\n\n';
  message += '```\n';
  message += 'Биржа     | Актив | Цена      | Дельта 24ч\n';
  message += '─'.repeat(40) + '\n';
  
  rows.forEach(row => {
    const exchange = row.exchange.padEnd(10);
    const asset = row.asset.padEnd(6);
    const price = row.price ? fmt(row.price, 4).padStart(8) : '—'.padStart(8);
    const change = row.changePct24h != null ? 
      `${row.changePct24h >= 0 ? '+' : ''}${fmt(row.changePct24h, 2)}%`.padStart(9) : 
      '—'.padStart(9);
    
    message += `${exchange}| ${asset}| ${price} | ${change}\n`;
  });
  
  message += '```\n';
  message += '🔄 Обновлено: ' + new Date().toLocaleTimeString('ru-RU');
  
  return message;
}

// Главное меню с кнопками для всех команд
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📈 Краткая сводка', callback_data: 'compact' },
        { text: '📋 Таблица', callback_data: 'table' }
      ],
      [
        { text: '⚡ Быстрый тест', callback_data: 'test' },
        { text: '⚙️ Статус', callback_data: 'status' }
      ],
      [
        { text: '🆕 Малоизвестные', callback_data: 'new_coins' },
        { text: '🚀 Моонеры +10%', callback_data: 'mooners' }
      ],
      [
        { text: '🆕 Новые листинги', callback_data: 'new_listings' },
        { text: '❓ Помощь', callback_data: 'help' }
      ],
      [
        { text: '🧹 Очистить чат', callback_data: 'clear' }
      ]
    ]
  };
}

// Приветственное сообщение с меню
function getWelcomeWithMenu() {
  return `🤖 *Добро пожаловать в Cryptohvost Bot!*

💰 Ваш помощник для отслеживания криптовалют

📊 *Доступные функции:*
• Мониторинг цен с 7 бирж
• Отслеживание 9 криптовалют: BTC, ETH, TRX, TON, USDC, BNB, SOL, XRP, ADA
• Различные форматы отображения данных
• Быстрая диагностика соединений

👇 *Выберите действие из меню ниже:*`;
}

// Сообщение для callback запросов
function getMenuMessage() {
  return `📱 *Главное меню Cryptohvost Bot*

🚀 Выберите нужную функцию:

📈 *Краткая сводка* - средние цены по активам
📋 *Таблица* - данные в табличном формате
⚡ *Быстрый тест* - проверка соединения (только BTC)

👇 *Нажмите на кнопку ниже:*`;
}

// Получить полный список команд
function getHelpMessage() {
  return `🤖 *Помощь Cryptohvost Bot*

📊 *Основные функции:*
• Краткая сводка - средние цены по активам
• Таблица - данные в табличном формате
• Быстрый тест - проверка соединения (только BTC)

🆕 *Новые функции:*
• Малоизвестные - перспективные монеты
• Моонеры +10% - монеты с ростом более 10% за день
• Новые листинги - реальное отслеживание новых пар

🔄 *Отслеживаемые криптовалюты:*
₿ BTC, 🔷 ETH, 🔴 TRX, 🔵 TON, 🟢 USDC, 🟡 BNB, 🟣 SOL, 🔶 XRP, ❤️ ADA

🏢 *Поддерживаемые биржи:*
Binance, Bybit, OKX, Kraken, MEXC, HTX, Poloniex

ℹ️ *Особенности работы:*
• Каждый запрос создаёт новое сообщение
• Предыдущие результаты сохраняются
• Используйте "🧹 Очистить чат" для очистки

🛠️ *Команды через текст:*
/start - начать работу | /help - это сообщение | /status - статус`;
}

module.exports = {
  formatCompactStats,
  formatTableStats,
  formatError,
  formatLoadingMessage,
  formatTimeoutMessage,
  getHelpMessage,
  getMainMenuKeyboard,
  getWelcomeWithMenu,
  getMenuMessage,
  getAssetEmoji,
  fmt
};
