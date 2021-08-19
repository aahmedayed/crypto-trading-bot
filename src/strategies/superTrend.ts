import { Exchange } from "ccxt";
import { Indicator } from 'stock-technical-indicators';
import { Supertrend } from "stock-technical-indicators/study/Supertrend";
import { CryptoCurrency } from "../interfaces/cryptoCurrency.interface";
import { CryptoStrategy } from "../interfaces/cryptoStrategy.interface";

export class SuperTrendStrategy implements CryptoStrategy {
    exchange: Exchange;
    cryptoCurrency: CryptoCurrency;
    constructor(exchange: Exchange, cryptoCurrency: CryptoCurrency) {
        this.exchange = exchange;
        this.cryptoCurrency = cryptoCurrency;
    }
    async onStrategyRun(): Promise<void> {

        const ohlcv = await this.exchange
            .fetchOHLCV(this.cryptoCurrency.symbol, this.cryptoCurrency.timeFrame,
                this.cryptoCurrency.since, this.cryptoCurrency.limit);

        const newStudyATR = new Indicator(new Supertrend());
        const atrs = newStudyATR.calculate(ohlcv, { period: 7, multiplier: 3 });
        this.checkBuySellSignals(atrs);

    }
    private async checkBuySellSignals(atrs: any) {
        const freeBalance = (await this.exchange.fetchBalance()).free['USDT'];
        console.log(`Free Balance is: ${freeBalance} USDT`);
        const currentRowIndex = atrs.length - 1;
        const previousRowIndex = currentRowIndex - 1;
        const currentSuperTrendDirection = atrs[currentRowIndex].Supertrend.Direction;
        const previousSuperTrendDirection = atrs[previousRowIndex].Supertrend.Direction;
        console.log(`current Super Trend Direction for ${this.cryptoCurrency.symbol}`, currentSuperTrendDirection);
        console.log(`previous Super Trend Direction for ${this.cryptoCurrency.symbol}`, previousSuperTrendDirection);

        const params = {
            quoteOrderQty: freeBalance > 500 ? freeBalance / 2 : freeBalance,
        }

        if (currentSuperTrendDirection === 1 && previousSuperTrendDirection === -1) {
            if (!this.cryptoCurrency.inPosition && freeBalance > 50) {
                this.cryptoCurrency.inPosition = true;
                const order = await this.exchange
                    .createOrder(this.cryptoCurrency.symbol, 'market', 'buy', undefined, undefined, params);
                console.log('order Bought :');
                console.log(order);
            }
            else {
                console.log(params);
            }

        }

        if (currentSuperTrendDirection === -1 && previousSuperTrendDirection === 1) {
            if (this.cryptoCurrency.inPosition) {
                this.cryptoCurrency.inPosition = false;
                const order = await this.exchange
                    .createOrder(this.cryptoCurrency.symbol, 'market', 'sell', undefined, undefined, params);
                console.log('order Sold');
                console.log(order);
            } else {
                console.log('there is no order to sell');
            }
        }
    }
}