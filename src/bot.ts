import * as dotenv from "dotenv";
import { binance } from "ccxt";
import { SuperTrendStrategy } from "./strategies/superTrend";
import { Bot } from "./models/bot.model";
import { MarketFrame } from "./models/market-frame.model";
import { RsiStrategy } from "./strategies/rsiStrategy";
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
    const xrpusdt: MarketFrame = new MarketFrame(
      binanceClient.market("XRP/USDT")
    );
    const solusdt: MarketFrame = new MarketFrame(
      binanceClient.market("SOL/USDT")
    );

    // const adaSuperTrendStrategy1H = new SuperTrendStrategy(
    //   binanceClient,
    //   adausdt
    // );
    // const solSuperTrendStrategy1H = new SuperTrendStrategy(
    //   binanceClient,
    //   solusdt
    // );
    // const xrpSuperTrendStrategy1H = new SuperTrendStrategy(
    //   binanceClient,
    //   xrpusdt,
    //   { period: 7, multiplier: 3 }
    // );

    const solRsitrategy1H = new RsiStrategy(binanceClient, solusdt);

    const adaRsitrategy1H = new RsiStrategy(binanceClient, adausdt);
    const bot = new Bot([
      solRsitrategy1H,
      adaRsitrategy1H,
      //   adaSuperTrendStrategy1H,
      //   solSuperTrendStrategy1H,
      //   xrpSuperTrendStrategy1H,
    ]);
    bot.run();
  })
  .catch((err) => {
    console.log(err);
  });
