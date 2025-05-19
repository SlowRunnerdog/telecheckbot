const { analyzeChartAndBuildImage } = require('../services/telegramService');

async function handleCommand(command, chatId, bot) {
    const [coin, timeframe] = command.split('/');

    if (!coin || !timeframe) {
        throw new Error('Invalid command format. Use: coinUSDT/timeframe');
    }

    try {
        // Phân tích dữ liệu và tạo ảnh kết quả
        const { prediction, imageBuffer, summary } = await analyzeChartAndBuildImage(coin, timeframe);

        // Gửi ảnh kèm dự đoán và thông tin phân tích cho người dùng
        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `*Phân tích ${coin} ${timeframe}*\n${summary}\n\n*Dự đoán:* ${prediction}`,
            parse_mode: 'Markdown'
        });
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