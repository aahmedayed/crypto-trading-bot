import * as dotenv from "dotenv";
import { binance } from "ccxt";
import { SuperTrendStrategy } from "./strategies/superTrend";
import { Bot } from "./models/bot.model";
import { MarketFrame } from "./models/market-frame.model";
// import { RsiStrategy } from "./strategies/rsiStrategy";
dotenv.config();

const binanceClient = new binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
  enableRateLimit: true,
  options: {
    createMarketBuyOrderRequiresPrice: false,
    adjustForTimeDifference: true,
  },
  has: {
    fetchOpenOrders: true,
  },
});

binanceClient
  .loadMarkets()
  .then(() => {
    const adausdt: MarketFrame = new MarketFrame(
      binanceClient.market("ADA/USDT")
    );
    const solusdt: MarketFrame = new MarketFrame(
      binanceClient.market("SOL/USDT")
    );
    // const adaRsitrategy1H = new RsiStrategy(binanceClient, adausdt);
    // const solRsitrategy1H = new RsiStrategy(binanceClient, solusdt);
    const adaRsitrategy1H = new SuperTrendStrategy(binanceClient, adausdt);
    const solRsitrategy1H = new SuperTrendStrategy(binanceClient, solusdt);
    const bot = new Bot([adaRsitrategy1H, solRsitrategy1H]);
    bot.run();
  })
  .catch((err) => {
    console.log(err);
  });
