import { Exchange } from "ccxt";
import { CryptoCurrency } from "./cryptoCurrency.interface";

export interface CryptoStrategy {
    exchange: Exchange;
    cryptoCurrency: CryptoCurrency;
    onStrategyRun(): Promise<void>;
}