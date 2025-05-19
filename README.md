<<<<<<< HEAD
# telecheckbot
=======
# Telegram Bot Project

This project is a Telegram bot that interacts with the Binance API and CCXT to fetch and analyze cryptocurrency chart data. It provides users with insights based on various technical indicators.

## Features

- Fetches cryptocurrency chart data from Binance.
- Analyzes price action using Exponential Moving Average (EMA), Relative Strength Index (RSI), and support/resistance levels.
- Processes user commands to provide real-time data and analysis.

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd telegram-bot-project
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure the bot:**
   - Create a `.env` file in the root directory and add your Telegram bot token and any other necessary API keys.

4. **Run the bot:**
   ```
   node src/bot.js
   ```

## Usage

- Start a chat with your bot on Telegram.
- Use commands in the format: `/command coinUSDT timeframe`
  - Example: `/analyze BTCUSDT 1h`

## Contributing

Feel free to submit issues or pull requests for improvements and new features.
>>>>>>> ec13570 (Ini lan dau)
