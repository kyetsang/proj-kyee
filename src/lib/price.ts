import useSWR from 'swr';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// 获取实时 ETH 价格的接口
export interface EthPrice {
  usd: number;
  usd_24h_change: number;
}

// 获取实时 ETH 价格的 fetcher 函数
const ethPriceFetcher = async (): Promise<EthPrice> => {
  const response = await fetch(
    `${COINGECKO_API_URL}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch ETH price');
  }
  
  const data = await response.json();
  return {
    usd: data.ethereum.usd,
    usd_24h_change: data.ethereum.usd_24h_change
  };
};

// 使用 SWR 的 Hook 来获取和缓存价格数据
export function useEthPrice() {
  const { data, error, isLoading } = useSWR<EthPrice>(
    'eth-price',
    ethPriceFetcher,
    {
      refreshInterval: 60000, // 每分钟刷新一次
      revalidateOnFocus: true,
    }
  );

  return {
    price: data,
    isLoading,
    isError: error
  };
}

// 计算当前持仓市值
export function calculateCurrentValue(amount: number, currentPrice: number): number {
  return amount * currentPrice;
}

// 计算盈亏
export function calculatePnL(
  amount: number,
  averageBuyPrice: number,
  currentPrice: number
): {
  absolutePnL: number;
  percentagePnL: number;
} {
  const invested = amount * averageBuyPrice;
  const current = amount * currentPrice;
  const absolutePnL = current - invested;
  const percentagePnL = ((current - invested) / invested) * 100;

  return {
    absolutePnL,
    percentagePnL
  };
} 