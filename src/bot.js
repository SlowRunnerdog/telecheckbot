const TelegramBot = require('node-telegram-bot-api');
const { handleCommand } = require('./commands/index');
const config = require('./config/index');
const ccxt = require('ccxt');
const { checkTracking } = require('./services/telegramService');

// Kiểm tra token trước khi khởi tạo bot
if (!config.TELEGRAM_API_TOKEN) {
    console.error('Lỗi: TELEGRAM_API_TOKEN không tồn tại. Vui lòng kiểm tra file .env.');
    process.exit(1);
}

const bot = new TelegramBot(config.TELEGRAM_API_TOKEN, { polling: true });

bot.on('polling_error', (error) => {
    console.error(`Polling error: ${error.code || error.message || error}`);
});

bot.on('webhook_error', (error) => {
    console.error(`Webhook error: ${error.code || error.message || error}`);
});

// Nhận lệnh bắt buộc phải có ký tự đặc biệt / hoặc ! ở đầu (ví dụ: /BTCUSDT 1h hoặc !BTCUSDT 1h)
bot.onText(/^[\/!]{1}([A-Z0-9]+USDT)\s+([0-9]+[mhdw])$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    // Nếu không match, trả về hướng dẫn nhập đúng
    if (!match) {
        bot.sendMessage(
            chatId,
            '❗ Sai cú pháp. Lệnh phải bắt đầu bằng / hoặc !\nVui lòng nhập theo mẫu: `/COINUSDT khung_thời_gian`\nVí dụ: `/BTCUSDT 1h` hoặc `!BTCUSDT 1h`',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    const symbol = match[1].toUpperCase();
    const timeframe = match[2];

    // Kiểm tra dữ liệu có tồn tại trên Binance không
    const binance = new ccxt.binance();
    try {
        await binance.fetchOHLCV(symbol, timeframe, undefined, 1);
        console.log(`[CHECK] Lấy dữ liệu thành công cho ${symbol} với khung ${timeframe}`);
    } catch (err) {
        console.error(`[CHECK] Không lấy được dữ liệu từ Binance cho ${symbol} với khung ${timeframe}:`, err.message);
        bot.sendMessage(
            chatId,
            `❗ Không lấy được dữ liệu từ Binance cho cặp *${symbol}* với khung *${timeframe}*.\nVui lòng kiểm tra lại tên coin hoặc khung thời gian.`,
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        await handleCommand(`${symbol}/${timeframe}`, chatId, bot);
    } catch (error) {
        console.error('Command error:', error);
        if (
            error &&
            error.message &&
            error.message.includes('Invalid command format')
        ) {
            bot.sendMessage(
                chatId,
                '❗ Sai cú pháp. Lệnh phải bắt đầu bằng / hoặc !\nVui lòng nhập theo mẫu: `/COINUSDT khung_thời_gian`\nVí dụ: `/BTCUSDT 1h` hoặc `!BTCUSDT 1h`',
                { parse_mode: 'Markdown' }
            );
        } else {
            bot.sendMessage(chatId, 'Đã xảy ra lỗi khi xử lý lệnh. Vui lòng thử lại sau.');
        }
    }
});

bot.on('message', (msg) => {
    const text = msg.text || '';
    // Nếu không bắt đầu bằng / hoặc ! thì trả về hướng dẫn
    if (!/^[\/!]/.test(text.trim())) {
        bot.sendMessage(
            msg.chat.id,
            '❗ Lịt moẹ sai cấu trúc rồi bố thêm / hoặc !\n Đề nghị bác thực hiện đúng theo mẫu: `/COINUSDT khung_thời_gian`\nVí dụ: `/BTCUSDT 1h` hoặc `!BTCUSDT 1h`',
            { parse_mode: 'Markdown' }
        );
    }
});

// Thông báo khi bot start thành công
bot.getMe()
    .then((me) => {
        console.log(`🤖 Bot "${me.username}" đã khởi động và sẵn sàng nhận lệnh!`);
    })
    .catch((err) => {
        console.error('Lỗi khi lấy thông tin bot:', err);
    });

setInterval(() => {
    checkTracking(bot);
}, 5 * 60 * 1000); // 5 phút