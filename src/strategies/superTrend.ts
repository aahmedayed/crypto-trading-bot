import { Exchange } from "ccxt";
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
  param: ISuperTrendParam;
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

      ohlcv.pop();
      const newStudyATR = new Indicator(new Supertrend());
      let param: ISuperTrendParam = { period: 7, multiplier: 3 };
      if (this.param) {
        param = this.param;
      }
      const atrs = newStudyATR.calculate(ohlcv, param);
      await this.checkBuySellSignals(atrs);
    } catch (error) {
      console.log(error);
    }
  }
  private async checkBuySellSignals(atrs: any) {
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
        console.log(`Free Balance is: ${freeBalance} USDT`);
        if (
          !this.cryptoCurrency.frameOptions.inPosition &&
          freeBalance >= 250
        ) {
          const quoteOrderQty = freeBalance > 600 ? 600 : freeBalance;
          const params = {
            quoteOrderQty,
          };
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
      if (this.cryptoCurrency.frameOptions.inPosition) {
        try {
          const freeBalance = (await this.exchange.fetchFreeBalance())[
            this.cryptoCurrency.market.base
          ];
          console.log(
            `The amount available for ${this.cryptoCurrency.market.symbol} is ${freeBalance}`
          );
          const amountWithFee =
            freeBalance - this.cryptoCurrency.market.taker * freeBalance;

          const order = await this.exchange.createOrder(
            this.cryptoCurrency.market.symbol,
            "market",
            "sell",
            amountWithFee
          );
          console.log("order Sold");
          console.log(order);
          this.cryptoCurrency.frameOptions.inPosition = false;
        } catch (error) {
          console.log(error.message);
          this.cryptoCurrency.frameOptions.inPosition = true;
        }
      }
    }
  }
}
