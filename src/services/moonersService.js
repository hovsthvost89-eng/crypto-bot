/**
 * Модуль для поиска монет с ростом >10% за день (моонеры)
 */

const https = require('https');

class MoonersService {
    constructor() {
        this.cache = new Map();
        this.cacheTime = 180000; // 3 минуты кэширования (данные часто меняются)
    }

    /**
     * Получить монеты с ростом >10% за день
     */
    async getMooners(minGrowth = 10) {
        const cacheKey = `mooners_${minGrowth}`;
        
        // Проверяем кэш
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTime) {
                return cached.data;
            }
        }

        try {
            console.log(`🚀 Поиск моонеров с ростом >${minGrowth}% за день...`);
            
            // Получаем данные с разных бирж параллельно
            const [binanceMooners, bybitMooners, okxMooners] = await Promise.allSettled([
                this.getBinanceMooners(minGrowth),
                this.getBybitMooners(minGrowth), 
                this.getOKXMooners(minGrowth)
            ]);

            const allMooners = [];
            
            // Обрабатываем результаты Binance
            if (binanceMooners.status === 'fulfilled' && binanceMooners.value) {
                allMooners.push(...binanceMooners.value.map(coin => ({
                    ...coin,
                    exchange: 'binance'
                })));
            }
            
            // Обрабатываем результаты Bybit
            if (bybitMooners.status === 'fulfilled' && bybitMooners.value) {
                allMooners.push(...bybitMooners.value.map(coin => ({
                    ...coin,
                    exchange: 'bybit'
                })));
            }
            
            // Обрабатываем результаты OKX
            if (okxMooners.status === 'fulfilled' && okxMooners.value) {
                allMooners.push(...okxMooners.value.map(coin => ({
                    ...coin,
                    exchange: 'okx'
                })));
            }

            // Сортируем по росту (убывание)
            const sortedMooners = allMooners
                .filter(coin => coin.change1h >= minGrowth)
                .sort((a, b) => b.change1h - a.change1h)
                .slice(0, 20); // Топ-20 моонеров

            // Кэшируем результат
            this.cache.set(cacheKey, {
                data: sortedMooners,
                timestamp: Date.now()
            });

            console.log(`✅ Найдено ${sortedMooners.length} моонеров`);
            return sortedMooners;

        } catch (error) {
            console.error('❌ Ошибка получения моонеров:', error);
            throw new Error('Не удалось получить данные о растущих монетах');
        }
    }

    /**
     * Получить моонеры с Binance
     */
    async getBinanceMooners(minGrowth) {
        return new Promise((resolve, reject) => {
            // Binance 24hr ticker statistics
            const url = 'https://api.binance.com/api/v3/ticker/24hr';
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        
                        // Фильтруем USDT пары с ростом >minGrowth%
                        // Примечание: Binance не предоставляет 1h данные в этом эндпоинте,
                        // поэтому используем 24h данные как приближение
                        const mooners = json
                            .filter(ticker => {
                                return ticker.symbol.endsWith('USDT') && 
                                       parseFloat(ticker.priceChangePercent) >= minGrowth &&
                                       parseFloat(ticker.volume) > 100000; // Минимальный объем
                            })
                            .map(ticker => ({
                                symbol: ticker.symbol.replace('USDT', ''),
                                pair: ticker.symbol,
                                price: parseFloat(ticker.lastPrice),
                                change1h: parseFloat(ticker.priceChangePercent), // 24h данные
                                volume: parseFloat(ticker.volume),
                                high: parseFloat(ticker.highPrice),
                                low: parseFloat(ticker.lowPrice)
                            }))
                            .slice(0, 15); // Топ-15 с Binance

                        resolve(mooners);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Получить моонеры с Bybit
     */
    async getBybitMooners(minGrowth) {
        return new Promise((resolve, reject) => {
            // Bybit tickers
            const url = 'https://api.bybit.com/v5/market/tickers?category=spot';
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const tickers = json?.result?.list || [];
                        
                        // Фильтруем USDT пары с ростом
                        const mooners = tickers
                            .filter(ticker => {
                                const change = parseFloat(ticker.price24hPcnt) * 100;
                                return ticker.symbol.endsWith('USDT') && 
                                       change >= minGrowth &&
                                       parseFloat(ticker.volume24h) > 50000; // Минимальный объем
                            })
                            .map(ticker => ({
                                symbol: ticker.symbol.replace('USDT', ''),
                                pair: ticker.symbol,
                                price: parseFloat(ticker.lastPrice),
                                change1h: parseFloat(ticker.price24hPcnt) * 100, // 24h данные
                                volume: parseFloat(ticker.volume24h),
                                high: parseFloat(ticker.highPrice24h),
                                low: parseFloat(ticker.lowPrice24h)
                            }))
                            .slice(0, 15);

                        resolve(mooners);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Получить моонеры с OKX
     */
    async getOKXMooners(minGrowth) {
        return new Promise((resolve, reject) => {
            const url = 'https://okx.com/api/v5/market/tickers?instType=SPOT';
            
            const req = https.get(url, { timeout: 15000 }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            console.warn(`OKX mooners API вернул статус ${res.statusCode}`);
                            resolve([]);
                            return;
                        }
                        
                        const json = JSON.parse(data);
                        const tickers = json?.data || [];
                        
                        if (!Array.isArray(tickers)) {
                            console.warn('OKX mooners API вернул некорректные данные');
                            resolve([]);
                            return;
                        }
                        
                        const mooners = tickers
                            .filter(ticker => {
                                try {
                                    const last = parseFloat(ticker.last) || 0;
                                    const open = parseFloat(ticker.open24h) || 0;
                                    const change = open > 0 ? ((last - open) / open) * 100 : 0;
                                    const volume = parseFloat(ticker.vol24h) || 0;
                                    
                                    return ticker.instId && ticker.instId.endsWith('-USDT') && 
                                           change >= minGrowth &&
                                           volume > 10000;
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
                                        change1h: change,
                                        volume: parseFloat(ticker.vol24h) || 0,
                                        high: parseFloat(ticker.high24h) || 0,
                                        low: parseFloat(ticker.low24h) || 0
                                    };
                                } catch (e) {
                                    return null;
                                }
                            })
                            .filter(coin => coin !== null)
                            .slice(0, 15);

                        resolve(mooners);
                    } catch (error) {
                        console.warn('OKX mooners ошибка парсинга:', error.message);
                        resolve([]);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.warn('OKX mooners ошибка сети:', error.message);
                resolve([]);
            });
            
            req.on('timeout', () => {
                console.warn('OKX mooners таймаут');
                req.destroy();
                resolve([]);
            });
        });
    }

    /**
     * Форматировать результат для отправки в Telegram
     */
    formatMoonersMessage(mooners, minGrowth = 10) {
        if (!mooners || mooners.length === 0) {
            return `🚀 *Моонеры (+${minGrowth}% за день)*\n\n😴 Сейчас нет монет с ростом более ${minGrowth}%.\n\n💡 Попробуйте позже или снизьте порог роста.`;
        }

        let message = `🚀 *Моонеры (+${minGrowth}% за день)*\n\n`;
        message += `🎯 Найдено ${mooners.length} растущих монет:\n\n`;

        mooners.forEach((coin, index) => {
            const exchangeEmoji = this.getExchangeEmoji(coin.exchange);
            const changeEmoji = this.getChangeEmoji(coin.change1h);
            const priceFormatted = this.formatPrice(coin.price);
            
            message += `${index + 1}. ${exchangeEmoji} *${coin.symbol}* ${changeEmoji}\n`;
            message += `   💰 Цена: $${priceFormatted}\n`;
            message += `   📈 Рост за день: +${coin.change1h.toFixed(2)}%\n`;
            
            if (coin.volume > 0) {
                message += `   📊 Объем: ${this.formatVolume(coin.volume)}\n`;
            }
            message += '\n';
        });

        message += '⚠️ *Риски:*\n';
        message += '• Высокая волатильность\n'; 
        message += '• Возможны резкие коррекции\n';
        message += '• Всегда используйте стоп-лоссы\n\n';
        message += '💡 Данные обновляются каждые 3 минуты';

        return message;
    }

    /**
     * Получить эмодзи биржи
     */
    getExchangeEmoji(exchange) {
        const emojis = {
            'binance': '⚫',
            'bybit': '⚫', 
            'okx': '⚫'
        };
        return emojis[exchange] || '⚫';
    }

    /**
     * Получить эмодзи изменения
     */
    getChangeEmoji(change) {
        if (change >= 50) return '🚀🚀🚀';
        if (change >= 30) return '🚀🚀';
        if (change >= 20) return '🚀';
        if (change >= 10) return '📈';
        return '↗️';
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
     * Очистить кэш
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Кэш моонеров очищен');
    }
}

module.exports = MoonersService;