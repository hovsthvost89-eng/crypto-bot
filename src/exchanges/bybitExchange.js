/**
 * Модуль для работы с API Bybit
 */

const BaseExchange = require('./baseExchange');

class BybitExchange extends BaseExchange {
    constructor() {
        super('bybit');
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
        const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
        const json = await this.makeRequest(url);
        
        const data = json?.result?.list?.[0];
        if (!data) throw new Error('no-data');
        
        return {
            price: parseFloat(data.lastPrice),
            changePct24h: data.price24hPcnt !== undefined ? parseFloat(data.price24hPcnt) * 100 : null,
            high24h: data.highPrice24h ? parseFloat(data.highPrice24h) : null,
            low24h: data.lowPrice24h ? parseFloat(data.lowPrice24h) : null,
            volume24h: data.volume24h ? parseFloat(data.volume24h) : null,
        };
    }
}

module.exports = BybitExchange;