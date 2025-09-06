/**
 * Модуль для работы с API Binance
 */

const BaseExchange = require('./baseExchange');

class BinanceExchange extends BaseExchange {
    constructor() {
        super('binance');
        this.symbols = {
            BTC: ['BTCUSDT'],
            ETH: ['ETHUSDT'],
            TRX: ['TRXUSDT'],
            TON: ['TONUSDT'],
        };
    }

    getSymbols(asset) {
        return this.symbols[asset] || [];
    }

    async fetchAsset(asset) {
        const candidates = this.getSymbols(asset);
        const { data, symbol, error } = await this.tryCandidates(candidates, (symbol) => this.fetchSymbol(symbol));
        return this.createResult(asset, data, symbol, error);
    }

    async fetchSymbol(symbol) {
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
        const json = await this.makeRequest(url);
        
        return {
            price: parseFloat(json.lastPrice),
            changePct24h: parseFloat(json.priceChangePercent),
            high24h: parseFloat(json.highPrice),
            low24h: parseFloat(json.lowPrice),
            volume24h: parseFloat(json.volume),
        };
    }
}

module.exports = BinanceExchange;