const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ccxt = require('ccxt');

const width = 800;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

const trackingList = [];

function calculateEMA(closes, period = 14) {
    const k = 2 / (period + 1);
    let emaArray = [];
    let ema = closes[0];
    for (let i = 0; i < closes.length; i++) {
        if (i === 0) {
            emaArray.push(ema);
            continue;
        }
        ema = (closes[i] - ema) * k + ema;
        emaArray.push(ema);
    }
    return emaArray;
}

function calculateRSI(closes, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    gains /= period;
    losses /= period;
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function calculateSupportResistance(data) {
    const highs = data.map(candle => candle[2]);
    const lows = data.map(candle => candle[3]);
    return {
        support: Math.min(...lows),
        resistance: Math.max(...highs)
    };
}

async function analyzeChartAndBuildImage(coin, timeframe) {
    const binance = new ccxt.binance();
    let ohlcv;
    try {
        // Lấy 100 nến gần nhất
        ohlcv = await binance.fetchOHLCV(coin, timeframe, undefined, 100);
    } catch (error) {
        throw new Error('Không lấy được dữ liệu từ Binance.');
    }

    // Dữ liệu nến: [timestamp, open, high, low, close, volume]
    const closes = ohlcv.map(c => c[4]);
    const labels = ohlcv.map(c => {
        const d = new Date(c[0]);
        return `${d.getHours()}:${d.getMinutes()}`;
    });

    // Tính toán EMA, RSI, hỗ trợ/kháng cự
    const ema34 = calculateEMA(closes, 34);
    const ema89 = calculateEMA(closes, 89);
    const rsi14 = calculateRSI(closes, 14);
    const { support, resistance } = calculateSupportResistance(ohlcv.slice(-50));

    // Vẽ chart
    const configuration = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Giá đóng cửa',
                    data: closes,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: 'EMA 34',
                    data: ema34,
                    borderColor: 'yellow',
                    borderWidth: 1,
                    fill: false,
                },
                {
                    label: 'EMA 89',
                    data: ema89,
                    borderColor: 'red',
                    borderWidth: 1,
                    fill: false,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: { display: false },
                y: { display: true }
            }
        }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration, 'image/png');

    // Dự đoán đơn giản dựa vào EMA
    let prediction = 'Không xác định';
    if (ema34[ema34.length - 1] > ema89[ema89.length - 1]) prediction = 'Uptrend';
    else if (ema34[ema34.length - 1] < ema89[ema89.length - 1]) prediction = 'Downtrend';

    const summary = `EMA34: ${ema34[ema34.length - 1].toFixed(2)}, EMA89: ${ema89[ema89.length - 1].toFixed(2)}\nRSI14: ${rsi14.toFixed(2)}\nHỗ trợ: ${support.toFixed(2)}, Kháng cự: ${resistance.toFixed(2)}`;

    return {
        prediction,
        imageBuffer,
        summary
    };
}

async function checkTracking(bot) {
    for (const item of trackingList) {
        try {
            const { prediction, imageBuffer, summary } = await analyzeChartAndBuildImage(item.coin, item.timeframe);

            // Điều kiện ví dụ: LONG khi EMA34 > EMA89 và RSI > 55, SHORT khi EMA34 < EMA89 và RSI < 45
            let signal = null, sl = null, tp = null;
            if (prediction === 'Uptrend') {
                signal = 'LONG';
                sl = 'Dưới hỗ trợ gần nhất';
                tp = 'Kháng cự gần nhất';
            } else if (prediction === 'Downtrend') {
                signal = 'SHORT';
                sl = 'Trên kháng cự gần nhất';
                tp = 'Hỗ trợ gần nhất';
            }

            if (signal) {
                await bot.sendPhoto(item.chatId, imageBuffer, {
                    caption: `🔔 *Tín hiệu ${signal} cho ${item.coin} ${item.timeframe}*\n${summary}\n\n*Khuyến nghị:*\n- SL: ${sl}\n- TP: ${tp}`,
                    parse_mode: 'Markdown'
                });
                // Có thể xóa khỏi trackingList nếu chỉ muốn báo 1 lần
            }
        } catch (e) {
            // Bỏ qua lỗi từng coin
        }
    }
}

function addTracking(coin, timeframe, chatId) {
    // Kiểm tra đã theo dõi chưa
    if (!trackingList.some(item => item.coin === coin && item.timeframe === timeframe && item.chatId === chatId)) {
        trackingList.push({ coin, timeframe, chatId });
    }
}

module.exports = {
    analyzeChartAndBuildImage
};