import { Exchange, OHLCV } from "ccxt";
import { CryptoStrategy } from "../interfaces/cryptoStrategy.interface";
import { MarketFrame } from "../models/market-frame.model";
import { RSI, EMA } from "technicalindicators";

export interface IRSIParam {
  period: number;
}
export class RsiStrategy implements CryptoStrategy {
  exchange: Exchange;
  cryptoCurrency: MarketFrame;
  param: IRSIParam = { period: 14 };
  constructor(
    exchange: Exchange,
    cryptoCurrency: MarketFrame,
    param?: IRSIParam
  ) {
    this.exchange = exchange;
    this.cryptoCurrency = cryptoCurrency;
    if (param) {
      this.param = param;
    }
  }
  async onStrategyRun(): Promise<void> {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(
        this.cryptoCurrency.market.symbol,
        this.cryptoCurrency.frameOptions.timeFrame,
        this.cryptoCurrency.frameOptions.since,
        this.cryptoCurrency.frameOptions.limit
      );

      const currentOHLCV = ohlcv.pop();
      const closesValues = ohlcv.map((ohlcv) => ohlcv[4]);

      
      await this.checkBuySellSignals(closesValues,ohlcv, currentOHLCV[4]);
    } catch (error) {
      console.log(error);
    }
  }
  private async checkBuySellSignals(
    closesValues: number[],
    ohlcv,
    lastPrice: number,
  ) {
    var inputRSI = {
        values: closesValues,
        period: this.param.period,
      };
      var inputEMA200 = {
        values: closesValues,
        period: 200,
      };
      var inputEMA50 = {
        values: closesValues,
        period: 50,
      };
    const rsi = RSI.calculate(inputRSI);
    const ema200 = EMA.calculate(inputEMA200);
    const ema50 = EMA.calculate(inputEMA50);
    const currentRowIndex = rsi.length - 1;
    const previousRowIndex = currentRowIndex - 1;

    const currentRSI = rsi[currentRowIndex];
    const previousRSI = rsi[previousRowIndex];

    const isClosedAboveEMA50 = ohlcv[ohlcv.length - 1][4] > ema50[ema50.length - 1];



    if (
      currentRSI > 50 &&
      previousRSI <= 50 &&
      ema50 > ema200 &&
      isClosedAboveEMA50
      
    ) {
        try {
          const freeBalance = (await this.exchange.fetchFreeBalance())["USDT"];
          const freeCryotoBalance = (await this.exchange.fetchFreeBalance())[
            this.cryptoCurrency.market.base
          ];
          const amountWithFee =
            freeCryotoBalance -
            this.cryptoCurrency.market.taker * freeCryotoBalance;
          const freeCryotoBalancePrice = amountWithFee * lastPrice;
          const minNational = this.cryptoCurrency.market.limits.cost?.min || 10;
          if (freeCryotoBalancePrice <= minNational && freeBalance >= 250) {
            const quoteOrderQty = freeBalance > 600 ? 600 : freeBalance;
            const params = {
              quoteOrderQty,
            };
            console.log(`Free Balance is: ${freeBalance} USDT`);
            const order = await this.exchange.createOrder(
              this.cryptoCurrency.market.symbol,
              "market",
              "buy",
              undefined,
              undefined,
              params
            );
            console.log("order Bought :");
            console.log(order);
            this.cryptoCurrency.frameOptions.inPosition = true;
          }
        } catch (error) {
          console.log(error.message);
          this.cryptoCurrency.frameOptions.inPosition = false;
        }
    }

    if ((previousRSI >= 70 && currentRSI < 70) || currentRSI < 30) {
        try {
          const freeBalance = (await this.exchange.fetchFreeBalance())[
            this.cryptoCurrency.market.base
          ];
          const amountWithFee =
            freeBalance - this.cryptoCurrency.market.taker * freeBalance;
          const price = amountWithFee * lastPrice;
          const minNational = this.cryptoCurrency.market.limits.cost?.min || 10;
          if (
            price > minNational
          ) {
            console.log(
              `The amount available for ${this.cryptoCurrency.market.symbol} is ${freeBalance}`
            );
            const order = await this.exchange.createOrder(
              this.cryptoCurrency.market.symbol,
              "market",
              "sell",
              amountWithFee
            );
            console.log("order Sold");
            console.log(order);
            this.cryptoCurrency.frameOptions.inPosition = false;
          }
        } catch (error) {
          console.log(error.message);
          this.cryptoCurrency.frameOptions.inPosition = true;
        }
    }
  }
}
