/**
 * Базовый класс для работы с API криптобирж
 */

const https = require('https');
const http = require('http');

class BaseExchange {
    constructor(name) {
        this.name = name;
        this.timeout = 10000; // 10 секунд таймаут
    }

    /**
     * Универсальная функция для HTTP запросов с таймаутом
     */
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const isHttps = url.startsWith('https');
            const httpModule = isHttps ? https : http;
            
            const timer = setTimeout(() => {
                reject(new Error(`Timeout after ${this.timeout}ms`));
            }, this.timeout);

            httpModule.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    clearTimeout(timer);
                    try {
                        if (res.statusCode !== 200) {
                            throw new Error(`HTTP ${res.statusCode}: ${data}`);
                        }
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (error) {
                        reject(new Error('Ошибка парсинга JSON: ' + error.message));
                    }
                });
            }).on('error', (error) => {
                clearTimeout(timer);
                reject(new Error('Ошибка сети: ' + error.message));
            });
        });
    }

    /**
     * Попробовать несколько символов-кандидатов
     */
    async tryCandidates(candidates, fetchFn) {
        if (!candidates || candidates.length === 0) {
            return { error: 'no-symbol' };
        }
        
        for (const symbol of candidates) {
            try {
                const data = await fetchFn(symbol);
                return { data, symbol };
            } catch (e) {
                continue; // пробуем следующий кандидат
            }
        }
        return { error: 'all-candidates-failed' };
    }

    /**
     * Создать результат с обработкой ошибок
     */
    createResult(asset, data, symbol, error) {
        if (!data) {
            return {
                exchange: this.name,
                asset,
                price: null,
                changePct24h: null,
                high24h: null,
                low24h: null,
                volume24h: null,
                symbolUsed: undefined,
                note: error === 'no-symbol' 
                    ? 'Пара не поддерживается на этой бирже'
                    : 'Нет данных/ошибка',
            };
        }
        
        return {
            exchange: this.name,
            asset,
            price: data.price ?? null,
            changePct24h: data.changePct24h ?? null,
            high24h: data.high24h ?? null,
            low24h: data.low24h ?? null,
            volume24h: data.volume24h ?? null,
            symbolUsed: symbol,
        };
    }

    /**
     * Основной метод для получения данных (должен быть переопределен в наследниках)
     */
    async fetchAsset(asset) {
        throw new Error(`fetchAsset method must be implemented in ${this.name} exchange`);
    }

    /**
     * Получить символы для актива (должен быть переопределен в наследниках)
     */
    getSymbols(asset) {
        throw new Error(`getSymbols method must be implemented in ${this.name} exchange`);
    }
}

module.exports = BaseExchange;