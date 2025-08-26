/**
 * Модуль для работы с API криптобирж
 * Поддерживает получение данных с множественных бирж
 */

const https = require('https');
const http = require('http');

// Поддерживаемые активы и биржи
const ASSETS = ['BTC', 'ETH', 'TRX', 'TON', 'USDC', 'BNB', 'SOL', 'XRP', 'ADA'];
const EXCHANGES = ['binance', 'bybit', 'okx', 'kraken', 'mexc', 'htx', 'poloniex'];

// Символы для каждой биржи
const SYMBOLS = {
  BTC: {
    binance: ['BTCUSDT'],
    bybit: ['BTCUSDT'],
    okx: ['BTC-USDT'],
    kraken: ['XBTUSDT', 'XBTUSD', 'XXBTZUSD'],
    mexc: ['BTCUSDT'],
    htx: ['btcusdt'],
    poloniex: ['BTC_USDT'],
  },
  ETH: {
    binance: ['ETHUSDT'],
    bybit: ['ETHUSDT'],
    okx: ['ETH-USDT'],
    kraken: ['ETHUSDT', 'ETHUSD', 'XETHZUSD'],
    mexc: ['ETHUSDT'],
    htx: ['ethusdt'],
    poloniex: ['ETH_USDT'],
  },
  TRX: {
    binance: ['TRXUSDT'],
    bybit: ['TRXUSDT'],
    okx: ['TRX-USDT'],
    kraken: ['TRXUSDT', 'TRXUSD'],
    mexc: ['TRXUSDT'],
    htx: ['trxusdt'],
    poloniex: ['TRX_USDT'],
  },
  TON: {
    binance: ['TONUSDT'],
    bybit: ['TONUSDT'],
    okx: ['TON-USDT'],
    kraken: [],
    mexc: ['TONUSDT'],
    htx: ['tonusdt'],
    poloniex: ['TON_USDT'],
  },
  USDC: {
    binance: ['USDCUSDT'],
    bybit: ['USDCUSDT'],
    okx: ['USDC-USDT'],
    kraken: ['USDCUSD', 'USDCUSDT'],
    mexc: ['USDCUSDT'],
    htx: ['usdcusdt'],
    poloniex: ['USDC_USDT'],
  },
  BNB: {
    binance: ['BNBUSDT'],
    bybit: ['BNBUSDT'],
    okx: ['BNB-USDT'],
    kraken: ['BNBUSD', 'BNBUSDT'],
    mexc: ['BNBUSDT'],
    htx: ['bnbusdt'],
    poloniex: ['BNB_USDT'],
  },
  SOL: {
    binance: ['SOLUSDT'],
    bybit: ['SOLUSDT'],
    okx: ['SOL-USDT'],
    kraken: ['SOLUSD', 'SOLUSDT'],
    mexc: ['SOLUSDT'],
    htx: ['solusdt'],
    poloniex: ['SOL_USDT'],
  },
  XRP: {
    binance: ['XRPUSDT'],
    bybit: ['XRPUSDT'],
    okx: ['XRP-USDT'],
    kraken: ['XRPUSD', 'XRPUSDT', 'XXRPZUSD'],
    mexc: ['XRPUSDT'],
    htx: ['xrpusdt'],
    poloniex: ['XRP_USDT'],
  },
  ADA: {
    binance: ['ADAUSDT'],
    bybit: ['ADAUSDT'],
    okx: ['ADA-USDT'],
    kraken: ['ADAUSD', 'ADAUSDT'],
    mexc: ['ADAUSDT'],
    htx: ['adausdt'],
    poloniex: ['ADA_USDT'],
  },
};

// Вспомогательная функция - перебирает кандидатов-символов
async function tryCandidates(candidates, fn) {
  if (!candidates || candidates.length === 0) return { error: 'no-symbol' };
  
  for (const symbol of candidates) {
    try {
      const data = await fn(symbol);
      return { data, symbol };
    } catch (e) {
      // пробуем следующий кандидат
      continue;
    }
  }
  return { error: 'all-candidates-failed' };
}

// Универсальная функция для HTTP запросов с таймаутом
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;
    
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);
    
    const req = httpModule.get(url, (res) => {
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
    });
    
    req.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error('Ошибка сети: ' + error.message));
    });
    
    req.on('timeout', () => {
      clearTimeout(timer);
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

// --- ФЕТЧЕРЫ ПО БИРЖАМ ---

async function fetchBinance(asset) {
  return await withTemplate('binance', asset, async (symbol) => {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const j = await makeRequest(url);
    return {
      price: parseFloat(j.lastPrice),
      changePct24h: parseFloat(j.priceChangePercent),
      high24h: parseFloat(j.highPrice),
      low24h: parseFloat(j.lowPrice),
      volume24h: parseFloat(j.volume),
    };
  });
}

async function fetchBybit(asset) {
  return await withTemplate('bybit', asset, async (symbol) => {
    const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
    const j = await makeRequest(url);
    const d = j?.result?.list?.[0];
    if (!d) throw new Error('no-data');
    return {
      price: parseFloat(d.lastPrice),
      changePct24h: d.price24hPcnt !== undefined ? parseFloat(d.price24hPcnt) * 100 : null,
      high24h: d.highPrice24h ? parseFloat(d.highPrice24h) : null,
      low24h: d.lowPrice24h ? parseFloat(d.lowPrice24h) : null,
      volume24h: d.volume24h ? parseFloat(d.volume24h) : null,
    };
  });
}

async function fetchOKX(asset) {
  return await withTemplate('okx', asset, async (symbol) => {
    const url = `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`;
    const j = await makeRequest(url);
    const d = j?.data?.[0];
    if (!d) throw new Error('no-data');
    const last = parseFloat(d.last);
    const open = d.open24h ? parseFloat(d.open24h) : null;
    return {
      price: last,
      changePct24h: open ? ((last - open) / open) * 100 : null,
      high24h: d.high24h ? parseFloat(d.high24h) : null,
      low24h: d.low24h ? parseFloat(d.low24h) : null,
      volume24h: d.vol24h ? parseFloat(d.vol24h) : null,
    };
  });
}

async function fetchKraken(asset) {
  return await withTemplate('kraken', asset, async (symbol) => {
    const url = `https://api.kraken.com/0/public/Ticker?pair=${symbol}`;
    const j = await makeRequest(url);
    const key = Object.keys(j.result || {})[0];
    if (!key) throw new Error('no-data');
    const d = j.result[key];
    const last = d?.c?.[0] ? parseFloat(d.c[0]) : null;
    const open = d?.o ? parseFloat(d.o) : null;
    return {
      price: last,
      changePct24h: last !== null && open ? ((last - open) / open) * 100 : null,
      high24h: d?.h?.[1] ? parseFloat(d.h[1]) : null,
      low24h: d?.l?.[1] ? parseFloat(d.l[1]) : null,
      volume24h: d?.v?.[1] ? parseFloat(d.v[1]) : null,
    };
  });
}

async function fetchMEXC(asset) {
  return await withTemplate('mexc', asset, async (symbol) => {
    const url = `https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const j = await makeRequest(url);
    return {
      price: parseFloat(j.lastPrice),
      changePct24h: parseFloat(j.priceChangePercent),
      high24h: parseFloat(j.highPrice),
      low24h: parseFloat(j.lowPrice),
      volume24h: parseFloat(j.volume),
    };
  });
}

async function fetchHTX(asset) {
  return await withTemplate('htx', asset, async (symbol) => {
    const url = `https://api.huobi.pro/market/detail?symbol=${symbol}`;
    const j = await makeRequest(url);
    const d = j?.tick;
    if (!d) throw new Error('no-data');
    const close = d.close != null ? parseFloat(d.close) : null;
    const open = d.open != null ? parseFloat(d.open) : null;
    return {
      price: close,
      changePct24h: close !== null && open ? ((close - open) / open) * 100 : null,
      high24h: d.high != null ? parseFloat(d.high) : null,
      low24h: d.low != null ? parseFloat(d.low) : null,
      volume24h: d.amount != null ? parseFloat(d.amount) : null,
    };
  });
}

async function fetchPoloniex(asset) {
  return await withTemplate('poloniex', asset, async (symbol) => {
    const url = `https://api.poloniex.com/markets/${symbol}/ticker24h`;
    const j = await makeRequest(url);
    const open = j?.open != null ? parseFloat(j.open) : null;
    const close = j?.close != null ? parseFloat(j.close) : null;
    return {
      price: close,
      changePct24h: open !== null && close !== null ? ((close - open) / open) * 100 : null,
      high24h: j?.high != null ? parseFloat(j.high) : null,
      low24h: j?.low != null ? parseFloat(j.low) : null,
      volume24h: j?.quantity != null ? parseFloat(j.quantity) : null,
    };
  });
}

// Общий шаблон: подставляет реальный символ, ловит ошибки
async function withTemplate(exchange, asset, runner) {
  const { data, symbol, error } = await tryCandidates(SYMBOLS[asset][exchange], runner);
  
  if (!data) {
    return {
      exchange,
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
    exchange,
    asset,
    price: data.price ?? null,
    changePct24h: data.changePct24h ?? null,
    high24h: data.high24h ?? null,
    low24h: data.low24h ?? null,
    volume24h: data.volume24h ?? null,
    symbolUsed: symbol,
  };
}

// Публичная функция: получить сводку по всем биржам и монетам
async function getAllStats(assets = ['BTC', 'ETH', 'TRX', 'TON', 'USDC', 'BNB', 'SOL', 'XRP', 'ADA']) {
  const fetchers = {
    binance: fetchBinance,
    bybit: fetchBybit,
    okx: fetchOKX,
    kraken: fetchKraken,
    mexc: fetchMEXC,
    htx: fetchHTX,
    poloniex: fetchPoloniex,
  };

  const exchanges = Object.keys(fetchers);
  const jobs = [];
  
  for (const exchange of exchanges) {
    for (const asset of assets) {
      jobs.push(fetchers[exchange](asset));
    }
  }
  
  // Используем Promise.allSettled для устойчивости к ошибкам
  const results = await Promise.allSettled(jobs);
  
  const rows = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // В случае ошибки, создаем пустой результат
      const exchangeIndex = Math.floor(index / assets.length);
      const assetIndex = index % assets.length;
      const exchange = exchanges[exchangeIndex];
      const asset = assets[assetIndex];
      
      console.warn(`Ошибка для ${exchange}/${asset}:`, result.reason?.message);
      
      return {
        exchange,
        asset,
        price: null,
        changePct24h: null,
        high24h: null,
        low24h: null,
        volume24h: null,
        symbolUsed: undefined,
        note: 'Ошибка загрузки',
      };
    }
  });
  
  // Сортируем по бирже, потом по активу
  return rows.sort((x, y) => 
    x.exchange === y.exchange 
      ? x.asset.localeCompare(y.asset) 
      : x.exchange.localeCompare(y.exchange)
  );
}

module.exports = {
  getAllStats,
  ASSETS,
  EXCHANGES
};
