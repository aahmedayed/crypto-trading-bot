export interface CryptoCurrency {
    symbol: string;
    timeFrame: string;
    since?: number;
    limit: number;
    inPosition: boolean;
}