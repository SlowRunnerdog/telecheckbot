require('dotenv').config();

module.exports = {
    TELEGRAM_API_TOKEN: process.env.TELEGRAM_API_TOKEN,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY,
    BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
    DEFAULT_COIN: 'USDT',
    DEFAULT_TIMEFRAME: '1h',
    ANALYSIS_SETTINGS: {
        EMA_PERIOD: 14,
        RSI_PERIOD: 14,
        SUPPORT_RESISTANCE_LEVELS: 3
    }
};