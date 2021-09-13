import { Market } from "ccxt";

export interface IFrameOptions {
  inPosition?: boolean;
  timeFrame?: string;
  limit?: number;
  since?: number;
}

export class MarketFrame {
  market: Market;
  frameOptions: IFrameOptions = {
    inPosition: false,
    timeFrame: "1h",
    limit: 500,
  };

  constructor(market: Market, frameOptions?: IFrameOptions) {
    this.market = market;
    if (frameOptions) {
      this.frameOptions = { ...this.frameOptions, ...frameOptions };
    }
  }
}
