/**
 * Модуль для поиска новых монет за последний час
 */

const https = require('https');

class NewCoinsService {
    constructor() {
        this.cache = new Map();
        this.cacheTime = 300000; // 5 минут кэширования
    }

    /**
     * Получить новые монеты за последний час со всех бирж
     */
    async getNewCoins() {
        const cacheKey = 'new_coins_1h';
        
        // Проверяем кэш
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTime) {
                return cached.data;
            }
        }

        try {
            console.log('🔍 Поиск перспективных монет...');
            
            // Получаем данные с разных бирж параллельно
            const [binanceNew, bybitNew, okxNew] = await Promise.allSettled([
                this.getBinanceNewCoins(),
                this.getBybitNewCoins(), 
                this.getOKXNewCoins()
            ]);

            const allNewCoins = [];
            
            // Обрабатываем результаты Binance
            if (binanceNew.status === 'fulfilled' && binanceNew.value) {
                allNewCoins.push(...binanceNew.value.map(coin => ({
                    ...coin,
                    exchange: 'binance'
                })));
            }
            
            // Обрабатываем результаты Bybit
            if (bybitNew.status === 'fulfilled' && bybitNew.value) {
                allNewCoins.push(...bybitNew.value.map(coin => ({
                    ...coin,
                    exchange: 'bybit'
                })));
            }
            
            // Обрабатываем результаты OKX
            if (okxNew.status === 'fulfilled' && okxNew.value) {
                allNewCoins.push(...okxNew.value.map(coin => ({
                    ...coin,
                    exchange: 'okx'
                })));
            }

            // Удаляем дубликаты по символу
            const uniqueCoins = this.removeDuplicates(allNewCoins);
            
            // Кэшируем результат
            this.cache.set(cacheKey, {
                data: uniqueCoins,
                timestamp: Date.now()
            });

            console.log(`✅ Найдено ${uniqueCoins.length} перспективных монет`);
            return uniqueCoins;

        } catch (error) {
            console.error('❌ Ошибка получения новых монет:', error);
            throw new Error('Не удалось получить данные о новых монетах');
        }
    }

    /**
     * Получить малоизвестные монеты с Binance
     */
    async getBinanceNewCoins() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.binance.com/api/v3/ticker/24hr';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        
                        const smallCapCoins = json
                            .filter(ticker => {
                                const volume = parseFloat(ticker.volume);
                                const price = parseFloat(ticker.lastPrice);
                                const symbol = ticker.symbol;
                                // Добавляем новые монеты в фильтр
                                const isTargetPair = symbol.endsWith('USDT') && (
                                    symbol.startsWith('BTC') || symbol.startsWith('ETH') ||
                                    symbol.startsWith('TRX') || symbol.startsWith('TON') ||
                                    symbol.startsWith('USDC') || symbol.startsWith('BNB') ||
                                    symbol.startsWith('SOL') || symbol.startsWith('XRP') ||
                                    symbol.startsWith('ADA')
                                );
                                return isTargetPair && 
                                       volume > 1000 && volume < 500000 &&
                                       price > 0.000001 && price < 100;
                            })
                            .map(ticker => ({
                                symbol: ticker.symbol.replace('USDT', ''),
                                pair: ticker.symbol,
                                price: parseFloat(ticker.lastPrice),
                                change24h: parseFloat(ticker.priceChangePercent),
                                volume24h: parseFloat(ticker.volume),
                                high24h: parseFloat(ticker.highPrice),
                                low24h: parseFloat(ticker.lowPrice)
                            }))
                            .slice(0, 20);

                        resolve(smallCapCoins);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить малоизвестные монеты с Bybit  
     */
    async getBybitNewCoins() {
        return new Promise((resolve, reject) => {
            const url = 'https://api.bybit.com/v5/market/tickers?category=spot';
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const tickers = json?.result?.list || [];
                        
                        const smallCapCoins = tickers
                            .filter(ticker => {
                                const volume = parseFloat(ticker.volume24h);
                                const price = parseFloat(ticker.lastPrice);
                                const symbol = ticker.symbol;
                                // Добавляем новые монеты в фильтр
                                const isTargetPair = symbol.endsWith('USDT') && (
                                    symbol.startsWith('BTC') || symbol.startsWith('ETH') ||
                                    symbol.startsWith('TRX') || symbol.startsWith('TON') ||
                                    symbol.startsWith('USDC') || symbol.startsWith('BNB') ||
                                    symbol.startsWith('SOL') || symbol.startsWith('XRP') ||
                                    symbol.startsWith('ADA')
                                );
                                return isTargetPair && 
                                       volume > 1000 && volume < 300000 &&
                                       price > 0.000001 && price < 100;
                            })
                            .map(ticker => ({
                                symbol: ticker.symbol.replace('USDT', ''),
                                pair: ticker.symbol,
                                price: parseFloat(ticker.lastPrice),
                                change24h: parseFloat(ticker.price24hPcnt) * 100,
                                volume24h: parseFloat(ticker.volume24h),
                                high24h: parseFloat(ticker.highPrice24h),
                                low24h: parseFloat(ticker.lowPrice24h)
                            }))
                            .slice(0, 20);

                        resolve(smallCapCoins);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Получить малоизвестные монеты с OKX
     */
    async getOKXNewCoins() {
        return new Promise((resolve, reject) => {
            // Используем альтернативный endpoint с большим таймаутом
            const url = 'https://okx.com/api/v5/market/tickers?instType=SPOT';
            
            const req = https.get(url, { timeout: 15000 }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            console.warn(`OKX API вернул статус ${res.statusCode}`);
                            resolve([]); // Возвращаем пустой массив вместо ошибки
                            return;
                        }
                        
                        const json = JSON.parse(data);
                        const tickers = json?.data || [];
                        
                        if (!Array.isArray(tickers)) {
                            console.warn('OKX API вернул некорректные данные');
                            resolve([]);
                            return;
                        }
                        
                        const smallCapCoins = tickers
                            .filter(ticker => {
                                try {
                                    const volume = parseFloat(ticker.vol24h) || 0;
                                    const price = parseFloat(ticker.last) || 0;
                                    return ticker.instId && ticker.instId.endsWith('-USDT') && 
                                           volume > 1000 && volume < 200000 &&
                                           price > 0.000001 && price < 100;
                                } catch (e) {
                                    return false;
                                }
                            })
                            .map(ticker => {
                                try {
                                    const last = parseFloat(ticker.last) || 0;
                                    const open = parseFloat(ticker.open24h) || 0;
                                    const change = open > 0 ? ((last - open) / open) * 100 : 0;
                                    
                                    return {
                                        symbol: ticker.instId.replace('-USDT', ''),
                                        pair: ticker.instId,
                                        price: last,
                                        change24h: change,
                                        volume24h: parseFloat(ticker.vol24h) || 0,
                                        high24h: parseFloat(ticker.high24h) || 0,
                                        low24h: parseFloat(ticker.low24h) || 0
                                    };
                                } catch (e) {
                                    return null;
                                }
                            })
                            .filter(coin => coin !== null)
                            .slice(0, 20);

                        resolve(smallCapCoins);
                    } catch (error) {
                        console.warn('OKX ошибка парсинга:', error.message);
                        resolve([]); // Возвращаем пустой массив
                    }
                });
            });
            
            req.on('error', (error) => {
                console.warn('OKX ошибка сети:', error.message);
                resolve([]); // Возвращаем пустой массив вместо ошибки
            });
            
            req.on('timeout', () => {
                console.warn('OKX таймаут');
                req.destroy();
                resolve([]);
            });
        });
    }

    /**
     * Удалить дубликаты по символу монеты
     */
    removeDuplicates(coins) {
        const seen = new Set();
        return coins.filter(coin => {
            if (seen.has(coin.symbol)) {
                return false;
            }
            seen.add(coin.symbol);
            return true;
        });
    }

    /**
     * Форматировать результат для отправки в Telegram
     */
    formatNewCoinsMessage(newCoins) {
        if (!newCoins || newCoins.length === 0) {
            return '🆕 *Малоизвестные монеты*\n\n😴 Сейчас малоизвестных монет не обнаружено.\n\n💡 Попробуйте позже.';
        }

        let message = `🆕 *Малоизвестные монеты*\n\n`;
        message += `🎆 Найдено ${newCoins.length} перспективных монет:\n\n`;

        newCoins.forEach((coin, index) => {
            const exchangeEmoji = this.getExchangeEmoji(coin.exchange);
            const changeEmoji = coin.change24h >= 0 ? '🟢' : '🔴';
            const priceFormatted = this.formatPrice(coin.price);
            
            message += `${index + 1}. ${exchangeEmoji} *${coin.symbol}* ${changeEmoji}\n`;
            message += `   💰 Цена: $${priceFormatted}\n`;
            message += `   📈 Изменение: ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%\n`;
            message += `   📊 Объем: ${this.formatVolume(coin.volume24h)}\n\n`;
        });

        message += '⚠️ *Внимание:* Малоизвестные монеты часто волатильны!\n';
        message += '💡 Всегда изучайте проект перед инвестированием.';

        return message;
    }

    /**
     * Получить эмодзи биржи
     */
    getExchangeEmoji(exchange) {
        return '⚫'; // Черные кружки для всех бирж
    }

    /**
     * Форматировать цену
     */
    formatPrice(price) {
        if (price >= 1) {
            return price.toFixed(4);
        } else {
            return price.toFixed(8);
        }
    }

    /**
     * Форматировать объем
     */
    formatVolume(volume) {
        if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(1)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}K`;
        } else {
            return volume.toFixed(0);
        }
    }

    /**
     * Получить время в формате "X минут назад"
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diffMs = now - timestamp;
        
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours} ч. назад`;
        } else if (minutes > 0) {
            return `${minutes} мин. назад`;
        } else {
            return 'только что';
        }
    }

    /**
     * Очистить кэш
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Кэш новых монет очищен');
    }
}

module.exports = NewCoinsService;