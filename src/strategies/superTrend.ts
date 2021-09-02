import { Exchange, OHLCV } from "ccxt";
import { Indicator } from "stock-technical-indicators";
import { Supertrend } from "stock-technical-indicators/study/Supertrend";
import { CryptoStrategy } from "../interfaces/cryptoStrategy.interface";
import { MarketFrame } from "../models/market-frame.model";

export interface ISuperTrendParam {
  multiplier: number;
  period: number;
}
export class SuperTrendStrategy implements CryptoStrategy {
  exchange: Exchange;
  cryptoCurrency: MarketFrame;
  param: ISuperTrendParam = { period: 10, multiplier: 4 };
  constructor(
    exchange: Exchange,
    cryptoCurrency: MarketFrame,
    param?: ISuperTrendParam
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

      const lastOHLCV = ohlcv.pop();
      const newStudyATR = new Indicator(new Supertrend());
      const atrs = newStudyATR.calculate(ohlcv, this.param);
      await this.checkBuySellSignals(atrs, lastOHLCV);
    } catch (error) {
      console.log(error);
    }
  }
  private async checkBuySellSignals(atrs: any, ohlcv: OHLCV) {
    const currentRowIndex = atrs.length - 1;
    const previousRowIndex = currentRowIndex - 1;

    const currentSuperTrendDirection =
      atrs[currentRowIndex].Supertrend.Direction;
    const previousSuperTrendDirection =
      atrs[previousRowIndex].Supertrend.Direction;

    if (
      currentSuperTrendDirection === 1 &&
      previousSuperTrendDirection === -1
    ) {
      try {
        const freeBalance = (await this.exchange.fetchFreeBalance())["USDT"];
        const freeCryotoBalance = (await this.exchange.fetchFreeBalance())[
          this.cryptoCurrency.market.base
        ];
        const amountWithFee =
          freeCryotoBalance -
          this.cryptoCurrency.market.taker * freeCryotoBalance;
        const freeCryotoBalancePrice = amountWithFee * ohlcv[4];
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

    if (
      currentSuperTrendDirection === -1 &&
      previousSuperTrendDirection === 1
    ) {
      try {
        const freeBalance = (await this.exchange.fetchFreeBalance())[
          this.cryptoCurrency.market.base
        ];
        const amountWithFee =
          freeBalance - this.cryptoCurrency.market.taker * freeBalance;
        const price = amountWithFee * ohlcv[4];
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
