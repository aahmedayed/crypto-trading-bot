import { Exchange } from "ccxt";
import { MarketFrame } from "../models/market-frame.model";
export interface CryptoStrategy {
  exchange: Exchange;
  cryptoCurrency: MarketFrame;
  onStrategyRun(): Promise<void>;
}
