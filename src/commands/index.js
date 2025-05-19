const { analyzeChartAndBuildImage, addTracking } = require('../services/telegramService');

async function handleCommand(command, chatId, bot) {
    const [coin, timeframe] = command.split('/');

    if (!coin || !timeframe) {
        throw new Error('Invalid command format. Use: coinUSDT/timeframe');
    }

    // Thêm vào danh sách theo dõi
    addTracking(coin, timeframe, chatId);

    try {
        const { prediction, imageBuffer, summary } = await analyzeChartAndBuildImage(coin, timeframe);

        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `*Phân tích ${coin} ${timeframe}*\n${summary}\n\n*Dự đoán:* ${prediction}\n\nĐã thêm vào danh sách theo dõi. Bot sẽ thông báo khi có tín hiệu tốt!`,
            parse_mode: 'Markdown'
        });

        // Gửi khuyến nghị follow
        await bot.sendMessage(
            chatId,
            `👀 Đã bắt đầu theo dõi *${coin}* khung *${timeframe}* cho bạn!\nBot sẽ tự động gửi tín hiệu LONG/SHORT kèm khuyến nghị SL/TP tối ưu khi có cơ hội tốt.`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Lỗi phân tích hoặc gửi kết quả:', error);
        await bot.sendMessage(
            chatId,
            '❗ Đã xảy ra lỗi khi phân tích dữ liệu hoặc gửi kết quả. Vui lòng thử lại sau.',
            { parse_mode: 'Markdown' }
        );
    }
}

module.exports = {
    handleCommand
};