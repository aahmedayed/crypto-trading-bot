import { CryptoStrategy } from "../interfaces/cryptoStrategy.interface";

const configBot = {
  allocation: 0.1,
  spread: 0.1,
  tickInterval: 2000,
};
export class Bot<T extends CryptoStrategy> {
  private favoritesCryptoStrategy: T[];

  constructor(favoritesCryptoStrategy: T[]) {
    this.favoritesCryptoStrategy = favoritesCryptoStrategy;
  }

  public run() {
    console.log("the bot is running");
    setInterval(() => this.runStratigies(), configBot.tickInterval);
  }

  private async runStratigies() {
    await this.favoritesCryptoStrategy.reduce(
      async (promise, cryptoStrategy) => {
        await promise;
        await cryptoStrategy.onStrategyRun();
      },
      Promise.resolve()
    );
  }
}
