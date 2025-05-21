const { analyzeChartAndBuildImage, addTracking, removeTracking, getTrackingList } = require('../services/telegramService');

async function handleCommand(command, chatId, bot) {
    const cmd = command.trim().toLowerCase();

    // Hiển thị danh sách coin đang theo dõi
    if (cmd === 'list' || cmd === '/list') {
        const list = getTrackingList(chatId);
        if (list.length === 0) {
            await bot.sendMessage(chatId, 'Bạn chưa theo dõi coin nào.');
        } else {
            const msg = list.map(item => `- ${item.coin} / ${item.timeframe}`).join('\n');
            await bot.sendMessage(chatId, `Danh sách coin bạn đang theo dõi:\n${msg}`);
        }
        return;
    }

    // Chuẩn hóa lệnh untrack
    if (cmd.startsWith('untrack ') || cmd.startsWith('/untrack ')) {
        const [coin, timeframe] = command.replace(/\/?untrack\s+/i, '').split('/');
        removeTracking(coin, timeframe, chatId);
        await bot.sendMessage(
            chatId,
            `❌ Bạn đã bỏ theo dõi *${coin}* khung *${timeframe}*.\n\nĐể theo dõi lại, hãy gửi: ${coin}/${timeframe}`,
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Chỉ kiểm tra cú pháp với lệnh dạng coin/timeframe
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
            `👀 Đã bắt đầu theo dõi *${coin}* khung *${timeframe}* cho bạn!\nBot sẽ tự động gửi tín hiệu LONG/SHORT kèm khuyến nghị SL/TP tối ưu khi có cơ hội tốt.\n\nℹ️ Để bỏ theo dõi, gửi: /untrack ${coin}/${timeframe}`,
            { parse_mode: 'Markdown' }
        );

        // Gửi danh sách coin đang theo dõi
        const list = getTrackingList(chatId);
        if (list.length > 0) {
            const msg = list.map(item => `- ${item.coin} / ${item.timeframe}`).join('\n');
            await bot.sendMessage(chatId, `Danh sách coin bạn đang theo dõi:\n${msg}`);
        }
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
    handleCommand,
    addTracking
};