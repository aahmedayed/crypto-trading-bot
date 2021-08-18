require('dotenv').config();
var StockIndicator = require("stock-technical-indicators").Indicator
const { Supertrend } = require("stock-technical-indicators/study/Supertrend")
const binance = require('ccxt').binance;
let inPosition = true;

const binanceClient = new binance({
    'apiKey': process.env.API_KEY,
    'secret': process.env.API_SECRET,
    'enableRateLimit': true,
    'options': {
        'createMarketBuyOrderRequiresPrice': false, // switch off
        'adjustForTimeDifference': true
    },
});


const tick = async (config) => {
    const { asset, base, spread, allocation } = config;
    binanceClient.checkRequiredCredentials();

    ohlcv = await binanceClient.fetchOHLCV('ADA/USDT', '1h', undefined, 100);
    const newStudyATR = new StockIndicator(new Supertrend());
    atrs = newStudyATR.calculate(ohlcv, { period: 7, multiplier: 3 });
    checkBuySellSignals(atrs, binanceClient);

}

const run = () => {
    const config = {
        asset: 'BTC',
        base: 'USDT',
        allocation: 0.1,
        spread: 0.1,
        tickInterval: 60000
    }

    tick(config);
    setInterval(tick, config.tickInterval, config, binanceClient);
}

const checkBuySellSignals = async (atrs, binanceClient) => {
    currentRowIndex = atrs.length - 1;
    previousRowIndex = currentRowIndex - 1;
    currentSuperTrendDirection = atrs[currentRowIndex].Supertrend.Direction;
    previousSuperTrendDirection = atrs[previousRowIndex].Supertrend.Direction;
    console.log('current Super Trend Direction', currentSuperTrendDirection);
    console.log('previous Super Trend Direction', previousSuperTrendDirection);

    const params = {
        quoteOrderQty: 1000,
    }

    if (currentSuperTrendDirection === 1 && previousSuperTrendDirection === -1) {
        if (!inPosition) {
            inPosition = true;
            order = await binanceClient.createOrder('ADA/USDT', 'market', 'buy', undefined, undefined, params);
            console.log('order Bought :');
            console.log(order);
            console.log('current Super Trend', atrs[currentRowIndex]);
            console.log('previous Super Trend', atrs[previousRowIndex]);
        }

    }

    if (currentSuperTrendDirection === -1 && previousSuperTrendDirection === 1) {
        if (inPosition) {
            inPosition = false;
            order = await binanceClient.createOrder('ADA/USDT', 'market', 'sell', undefined, undefined, params);
            console.log('order Sold');
            console.log(order);
            console.log('current Super Trend', atrs[currentRowIndex]);
            console.log('previous Super Trend', atrs[previousRowIndex]);
        }
    }


}

run();
