/**
 * Модульный менеджер бирж - использует отдельные классы для каждой биржи
 */

const BinanceExchange = require('./exchanges/binanceExchange');
const BybitExchange = require('./exchanges/bybitExchange');
const OKXExchange = require('./exchanges/okxExchange');

// Импортируем оригинальные функции для остальных бирж
const { getAllStats: getOriginalStats } = require('../exchange');

class ExchangeManager {
    constructor() {
        // Новые модульные биржи
        this.modularExchanges = {
            binance: new BinanceExchange(),
            bybit: new BybitExchange(),
            okx: new OKXExchange(),
        };

        // Список поддерживаемых активов
        this.supportedAssets = ['BTC', 'ETH', 'TRX', 'TON'];
        this.allExchanges = ['binance', 'bybit', 'okx', 'kraken', 'mexc', 'htx', 'poloniex'];
    }

    /**
     * Получить статистику со всех бирж
     */
    async getAllStats(assets = ['TON', 'TRX', 'ETH', 'BTC']) {
        console.log('🔄 Запрос данных с бирж (модульная архитектура)...');
        
        // Используем оригинальный метод как fallback для всех бирж
        // В будущем здесь будут только модульные биржи
        const results = await getOriginalStats(assets);
        
        console.log('✅ Данные получены');
        return results;
    }

    /**
     * Получить данные только с модульных бирж (для тестирования)
     */
    async getModularStats(assets = ['TON', 'TRX', 'ETH', 'BTC']) {
        console.log('🔄 Запрос данных только с модульных бирж...');
        
        const jobs = [];
        
        // Добавляем задания для модульных бирж
        for (const exchangeName of Object.keys(this.modularExchanges)) {
            for (const asset of assets) {
                const exchange = this.modularExchanges[exchangeName];
                jobs.push(exchange.fetchAsset(asset));
            }
        }
        
        try {
            const results = await Promise.allSettled(jobs);
            const processedResults = results.map(result => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    console.warn('Ошибка получения данных:', result.reason);
                    return {
                        exchange: 'unknown',
                        asset: 'unknown',
                        price: null,
                        changePct24h: null,
                        high24h: null,
                        low24h: null,
                        volume24h: null,
                        note: 'Ошибка загрузки'
                    };
                }
            });

            console.log(`✅ Модульные данные получены (${processedResults.length} результатов)`);
            return processedResults;
            
        } catch (error) {
            console.error('❌ Критическая ошибка получения модульных данных:', error);
            throw error;
        }
    }

    /**
     * Получить список поддерживаемых бирж
     */
    getSupportedExchanges() {
        return {
            modular: Object.keys(this.modularExchanges),
            all: this.allExchanges
        };
    }

    /**
     * Получить список поддерживаемых активов
     */
    getSupportedAssets() {
        return this.supportedAssets;
    }

    /**
     * Проверить доступность биржи
     */
    async testExchange(exchangeName, asset = 'BTC') {
        if (!this.modularExchanges[exchangeName]) {
            throw new Error(`Биржа ${exchangeName} не поддерживается в модульной архитектуре`);
        }

        const exchange = this.modularExchanges[exchangeName];
        const startTime = Date.now();
        
        try {
            const result = await exchange.fetchAsset(asset);
            const duration = Date.now() - startTime;
            
            return {
                exchange: exchangeName,
                asset,
                success: result.price !== null,
                duration,
                result
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                exchange: exchangeName,
                asset,
                success: false,
                duration,
                error: error.message
            };
        }
    }
}

// Создаем единственный экземпляр менеджера
const exchangeManager = new ExchangeManager();

// Экспортируем как функцию для обратной совместимости
async function getAllStats(assets) {
    return await exchangeManager.getAllStats(assets);
}

module.exports = {
    getAllStats,
    ExchangeManager,
    exchangeManager
};