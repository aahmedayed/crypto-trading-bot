import * as dotenv from "dotenv";
import { binance } from "ccxt";
import { SuperTrendStrategy } from "./strategies/superTrend";
import { CryptoCurrency } from "./interfaces/cryptoCurrency.interface";
import { Bot } from "./models/bot.model";
dotenv.config();


const binanceClient = new binance({
    'apiKey': process.env.API_KEY,
    'secret': process.env.API_SECRET,
    'enableRateLimit': true,
    'options': {
        'createMarketBuyOrderRequiresPrice': false, // switch off
        'adjustForTimeDifference': true
    },
});

const adausdt: CryptoCurrency = {
    symbol: 'ADA/USDT',
    timeFrame: '1h',
    inPosition: true,
    limit: 100
}
const dogeusdt: CryptoCurrency = {
    symbol: 'DOGE/USDT',
    timeFrame: '1h',
    inPosition: false,
    limit: 100
}
const xrpusdt: CryptoCurrency = {
    symbol: 'XRP/USDT',
    timeFrame: '1h',
    inPosition: false,
    limit: 100
}

const adaSuperTrendStrategy = new SuperTrendStrategy(binanceClient, adausdt);
const dogeSuperTrendStrategy = new SuperTrendStrategy(binanceClient, dogeusdt);
const xrpSuperTrendStrategy = new SuperTrendStrategy(binanceClient, xrpusdt);

const bot = new Bot([adaSuperTrendStrategy, dogeSuperTrendStrategy, xrpSuperTrendStrategy]);
bot.run();