/**
 * Модуль для работы с API OKX
 */

const BaseExchange = require('./baseExchange');

class OKXExchange extends BaseExchange {
    constructor() {
        super('okx');
        this.symbols = {
            BTC: ['BTC-USDT'],
            ETH: ['ETH-USDT'],
            TRX: ['TRX-USDT'],
            TON: ['TON-USDT'],
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
        const url = `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`;
        const json = await this.makeRequest(url);
        
        const data = json?.data?.[0];
        if (!data) throw new Error('no-data');
        
        const last = parseFloat(data.last);
        const open = data.open24h ? parseFloat(data.open24h) : null;
        
        return {
            price: last,
            changePct24h: open ? ((last - open) / open) * 100 : null,
            high24h: data.high24h ? parseFloat(data.high24h) : null,
            low24h: data.low24h ? parseFloat(data.low24h) : null,
            volume24h: data.vol24h ? parseFloat(data.vol24h) : null,
        };
    }
}

module.exports = OKXExchange;