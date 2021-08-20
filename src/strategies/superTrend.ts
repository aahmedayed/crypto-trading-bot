import { Exchange } from "ccxt";
import { Indicator } from 'stock-technical-indicators';
import { Supertrend } from "stock-technical-indicators/study/Supertrend";
import { CryptoCurrency } from "../interfaces/cryptoCurrency.interface";
import { CryptoStrategy } from "../interfaces/cryptoStrategy.interface";


export interface ISuperTrendParam {
    multiplier: number;
    period: number;
}
export class SuperTrendStrategy implements CryptoStrategy {
    exchange: Exchange;
    cryptoCurrency: CryptoCurrency;
    param: ISuperTrendParam;
    constructor(exchange: Exchange, cryptoCurrency: CryptoCurrency, param?: ISuperTrendParam) {
        this.exchange = exchange;
        this.cryptoCurrency = cryptoCurrency;
        if (param){
            this.param = param;
        }
    }
    async onStrategyRun(): Promise<void> {

        const ohlcv = await this.exchange
            .fetchOHLCV(this.cryptoCurrency.symbol, this.cryptoCurrency.timeFrame,
                this.cryptoCurrency.since, this.cryptoCurrency.limit);

        ohlcv.pop();
        const newStudyATR = new Indicator(new Supertrend());
        let param: ISuperTrendParam = { period: 7, multiplier: 3 };
        if(this.param){
            param = this.param;
        }
        const atrs = newStudyATR.calculate(ohlcv, param);
        this.checkBuySellSignals(atrs);

    }
    private async checkBuySellSignals(atrs: any) {
        const currentRowIndex = atrs.length - 1;
        const previousRowIndex = currentRowIndex - 1;
        const currentSuperTrendDirection = atrs[currentRowIndex].Supertrend.Direction;
        const previousSuperTrendDirection = atrs[previousRowIndex].Supertrend.Direction;
        console.log(`current Super Trend Direction for ${this.cryptoCurrency.symbol}`, currentSuperTrendDirection);
        console.log(`previous Super Trend Direction for ${this.cryptoCurrency.symbol}`, previousSuperTrendDirection);


        if (currentSuperTrendDirection === 1 && previousSuperTrendDirection === -1) {
            const freeBalance = (await this.exchange.fetchBalance()).free['USDT'];
            console.log(`Free Balance is: ${freeBalance} USDT`);
            if (!this.cryptoCurrency.inPosition && freeBalance > 50) {
                try {
                    const params = {
                        quoteOrderQty: freeBalance >= 500 ? freeBalance / 2 : freeBalance,
                    }
                    const order = await this.exchange
                        .createOrder(this.cryptoCurrency.symbol, 'market', 'buy', undefined, undefined, params);
                    console.log('order Bought :');
                    console.log(order);
                    this.cryptoCurrency.inPosition = true;
                }
                catch {
                    this.cryptoCurrency.inPosition = false;
                }

            }
            else {
                console.log('Insufficient Balance (< 50 USDT ) or you are already in position');
            }

        }

        if (currentSuperTrendDirection === -1 && previousSuperTrendDirection === 1) {
            if (this.cryptoCurrency.inPosition) {

                try {
                    const openOrders = await this.exchange.fetchOrders(this.cryptoCurrency.symbol);
                    const amount = openOrders[openOrders.length - 1].amount;
                    console.log(`The amount available for ${this.cryptoCurrency.symbol} is ${amount}`);
                    const amountWithFee = amount - (0.01 * amount);

                    const order = await this.exchange
                        .createOrder(this.cryptoCurrency.symbol, 'market', 'sell', amountWithFee);
                    console.log('order Sold');
                    console.log(order);
                    this.cryptoCurrency.inPosition = false;
                }
                catch {
                    this.cryptoCurrency.inPosition = true;
                }

            } else {
                console.log('there is no order to sell');
            }
        }
    }
}