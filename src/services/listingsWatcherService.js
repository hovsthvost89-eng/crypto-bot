/**
 * Сервис для отслеживания новых листингов на биржах
 * Основан на сравнении снимков торговых пар
 */

const https = require('https');

class ListingsWatcherService {
    constructor() {
        this.previousSnapshots = new Map();
        this.newListings = [];
        this.isWatching = false;
        this.watchInterval = null;
        this.updateInterval = 5 * 60 * 1000; // 5 минут
    }

    /**
     * Получить список всех торговых пар с Binance
     */
    async fetchBinanceSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.binance.com/api/v3/exchangeInfo';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const symbols = json.symbols
                            .filter(s => s.status === 'TRADING')
                            .map(s => s.symbol);
                        resolve(new Set(symbols));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить список всех торговых пар с Bybit
     */
    async fetchBybitSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.bybit.com/v5/market/instruments-info?category=spot';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const symbols = json.result.list
                            .filter(x => x.status === 'Trading')
                            .map(x => x.symbol);
                        resolve(new Set(symbols));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить список всех торговых пар с OKX
     */
    async fetchOKXSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://okx.com/api/v5/public/instruments?instType=SPOT';
            
            const req = https.get(url, { timeout: 15000 }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            console.warn(`OKX instruments API вернул статус ${res.statusCode}`);
                            resolve(new Set()); // Возвращаем пустой Set
                            return;
                        }
                        
                        const json = JSON.parse(data);
                        const instruments = json?.data || [];
                        
                        if (!Array.isArray(instruments)) {
                            console.warn('OKX instruments API вернул некорректные данные');
                            resolve(new Set());
                            return;
                        }
                        
                        const symbols = instruments
                            .filter(x => x && x.instId)
                            .map(x => x.instId);
                        resolve(new Set(symbols));
                    } catch (error) {
                        console.warn('OKX instruments ошибка парсинга:', error.message);
                        resolve(new Set());
                    }
                });
            });
            
            req.on('error', (error) => {
                console.warn('OKX instruments ошибка сети:', error.message);
                resolve(new Set());
            });
            
            req.on('timeout', () => {
                console.warn('OKX instruments таймаут');
                req.destroy();
                resolve(new Set());
            });
        });
    }

    /**
     * Получить список всех торговых пар с Kraken
     */
    async fetchKrakenSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.kraken.com/0/public/AssetPairs';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const symbols = Object.keys(json.result);
                        resolve(new Set(symbols));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить список всех торговых пар с MEXC
     */
    async fetchMEXCSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.mexc.com/api/v3/exchangeInfo';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const symbols = json.symbols
                            .filter(s => s.isSpotTradingAllowed)
                            .map(s => s.symbol);
                        resolve(new Set(symbols));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить список всех торговых пар с HTX
     */
    async fetchHTXSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.huobi.pro/v2/settings/common/symbols';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const symbols = (json.data || [])
                            .map(s => s?.symbol)
                            .filter(Boolean);
                        resolve(new Set(symbols));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить список всех торговых пар с Poloniex
     */
    async fetchPoloniexSymbols() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.poloniex.com/markets';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const symbols = json
                            .filter((m, i) => json[i].state === 'NORMAL')
                            .map(m => m.symbol);
                        resolve(new Set(symbols));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Все фетчеры бирж
     */
    getFetchers() {
        return {
            binance: () => this.fetchBinanceSymbols(),
            bybit: () => this.fetchBybitSymbols(),
            okx: () => this.fetchOKXSymbols(),
            kraken: () => this.fetchKrakenSymbols(),
            mexc: () => this.fetchMEXCSymbols(),
            htx: () => this.fetchHTXSymbols(),
            poloniex: () => this.fetchPoloniexSymbols()
        };
    }

    /**
     * Сравнить текущий снимок с предыдущим
     */
    async diffNew(exchange, prevSnapshot) {
        const fetchers = this.getFetchers();
        const now = await fetchers[exchange]();
        const added = [...now].filter(s => !prevSnapshot.has(s));
        return { exchange, added, now };
    }

    /**
     * Проверить является ли символ целевой монетой (BTC/ETH/TRX/TON/USDC/BNB/SOL/XRP/ADA)
     */
    isTargetCoin(symbol) {
        const s = symbol.toUpperCase();
        
        // BTC aliases
        const aliasesBTC = ['BTC', 'XBT', 'XXBT'];
        const hitBTC = aliasesBTC.some(a => s.startsWith(a));
        
        // ETH aliases
        const hitETH = s.startsWith('ETH') || s.startsWith('XETH');
        
        // TRX
        const hitTRX = s.startsWith('TRX');
        
        // TON
        const hitTON = s.startsWith('TON');
        
        // USDC
        const hitUSDC = s.startsWith('USDC');
        
        // BNB
        const hitBNB = s.startsWith('BNB');
        
        // SOL
        const hitSOL = s.startsWith('SOL');
        
        // XRP aliases
        const aliasesXRP = ['XRP', 'XXRP'];
        const hitXRP = aliasesXRP.some(a => s.startsWith(a));
        
        // ADA
        const hitADA = s.startsWith('ADA');
        
        return hitBTC || hitETH || hitTRX || hitTON || hitUSDC || hitBNB || hitSOL || hitXRP || hitADA;
    }

    /**
     * Инициализация - создание первых снимков
     */
    async initialize() {
        console.log('🔍 Инициализация отслеживания листингов...');
        
        const exchanges = ['binance', 'bybit', 'okx', 'kraken', 'mexc', 'htx', 'poloniex'];
        const fetchers = this.getFetchers();
        
        for (const exchange of exchanges) {
            try {
                const snapshot = await fetchers[exchange]();
                this.previousSnapshots.set(exchange, snapshot);
                console.log(`✅ Загружен снимок ${exchange}: ${snapshot.size} пар`);
            } catch (error) {
                console.error(`❌ Ошибка загрузки ${exchange}:`, error.message);
                this.previousSnapshots.set(exchange, new Set());
            }
        }
        
        console.log('🎯 Отслеживание листингов инициализировано');
    }

    /**
     * Запустить периодическое отслеживание
     */
    async startWatching() {
        if (this.isWatching) return;
        
        await this.initialize();
        this.isWatching = true;
        
        this.watchInterval = setInterval(async () => {
            await this.checkForNewListings();
        }, this.updateInterval);
        
        console.log(`🚀 Запущено отслеживание листингов (каждые ${this.updateInterval / 60000} мин)`);
    }

    /**
     * Остановить отслеживание
     */
    stopWatching() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
        this.isWatching = false;
        console.log('⏹️ Отслеживание листингов остановлено');
    }

    /**
     * Проверить новые листинги на всех биржах
     */
    async checkForNewListings() {
        console.log('🔄 Проверяю новые листинги...');
        
        const exchanges = ['binance', 'bybit', 'okx', 'kraken', 'mexc', 'htx', 'poloniex'];
        
        for (const exchange of exchanges) {
            try {
                const prevSnapshot = this.previousSnapshots.get(exchange);
                if (!prevSnapshot) continue;
                
                const { added, now } = await this.diffNew(exchange, prevSnapshot);
                
                // Фильтруем по целевым монетам
                const targetHits = added.filter(symbol => this.isTargetCoin(symbol));
                
                if (targetHits.length > 0) {
                    console.log(`🆕 [${exchange.toUpperCase()}] Новые листинги:`, targetHits);
                    
                    // Добавляем в список новых листингов
                    targetHits.forEach(symbol => {
                        this.newListings.push({
                            exchange,
                            symbol,
                            timestamp: Date.now()
                        });
                    });
                }
                
                // Обновляем снимок
                this.previousSnapshots.set(exchange, now);
                
            } catch (error) {
                console.error(`❌ [${exchange}] Ошибка проверки:`, error.message);
            }
        }
    }

    /**
     * Получить последние новые листинги
     */
    getRecentListings(maxAge = 24 * 60 * 60 * 1000) { // 24 часа по умолчанию
        const cutoff = Date.now() - maxAge;
        return this.newListings
            .filter(listing => listing.timestamp > cutoff)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Очистить старые листинги
     */
    cleanupOldListings(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        this.newListings = this.newListings.filter(listing => listing.timestamp > cutoff);
    }

    /**
     * Форматировать сообщение о новых листингах
     */
    formatListingsMessage() {
        const recent = this.getRecentListings();
        
        if (recent.length === 0) {
            return '🆕 *Новые листинги*\n\n😴 За последние 24 часа новых листингов наших целевых монет не обнаружено.\n\n💡 Система отслеживает листинги в реальном времени.';
        }

        let message = `🆕 *Новые листинги (24ч)*\n\n`;
        message += `🎉 Найдено ${recent.length} новых листингов:\n\n`;

        recent.slice(0, 10).forEach((listing, index) => {
            const timeAgo = this.getTimeAgo(listing.timestamp);
            
            message += `${index + 1}. ⚫ *${listing.symbol}*\n`;
            message += `   🏢 Биржа: ${listing.exchange.toUpperCase()}\n`;
            message += `   ⏰ ${timeAgo}\n\n`;
        });

        if (recent.length > 10) {
            message += `📋 И еще ${recent.length - 10} листингов...\n\n`;
        }

        message += '🔄 *Система отслеживания:*\n';
        message += '• Проверка каждые 5 минут\n';
        message += '• Мониторинг 7 бирж\n';
        message += '• Фокус на BTC/ETH/TRX/TON/USDC/BNB/SOL/XRP/ADA\n\n';
        message += '⚡ Данные обновляются автоматически';

        return message;
    }

    /**
     * Получить время в формате "X минут назад"
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diffMs = now - timestamp;
        
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} дн. назад`;
        } else if (hours > 0) {
            return `${hours} ч. назад`;
        } else if (minutes > 0) {
            return `${minutes} мин. назад`;
        } else {
            return 'только что';
        }
    }
}

module.exports = ListingsWatcherService;