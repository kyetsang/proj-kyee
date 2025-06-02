'use client';

import React, { useState, useEffect } from 'react';
import { getTransactions, Transaction } from '../../lib/firebase';
import { useEthPrice } from '../../lib/price';
import { useTransactionContext } from '../contexts/TransactionContext';

interface PortfolioStats {
  totalHoldings: number;
  totalValue: number;
  averageCost: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export default function PortfolioOverview() {
  const { price } = useEthPrice();
  const { refreshTrigger } = useTransactionContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PortfolioStats>({
    totalHoldings: 0,
    totalValue: 0,
    averageCost: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
  });

  useEffect(() => {
    const calculatePortfolioStats = async () => {
      try {
        setLoading(true);
        const transactions = await getTransactions();
        
        let totalHoldings = 0;
        let totalCost = 0;
        let totalBuyAmount = 0;
        
        transactions.forEach(tx => {
          if (tx.type === 'buy') {
            totalHoldings += tx.amount;
            totalCost += tx.amount * tx.price;
            totalBuyAmount += tx.amount;
          } else {
            totalHoldings -= tx.amount;
            // 使用当时的卖出价格计算收益
            totalCost -= (totalCost / totalBuyAmount) * tx.amount;
            totalBuyAmount -= tx.amount;
          }
        });

        const currentPrice = price?.usd || 0;
        const totalValue = totalHoldings * currentPrice;
        const averageCost = totalBuyAmount > 0 ? totalCost / totalBuyAmount : 0;
        const profitLoss = totalValue - totalCost;
        const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

        setStats({
          totalHoldings,
          totalValue,
          averageCost,
          profitLoss,
          profitLossPercentage,
        });
        
        setError(null);
      } catch (err) {
        console.error('计算投资组合统计失败:', err);
        setError('无法加载投资组合数据');
      } finally {
        setLoading(false);
      }
    };

    if (price?.usd) {
      calculatePortfolioStats();
    }
  }, [refreshTrigger, price]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">持仓概览</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">当前持仓</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.totalHoldings.toFixed(4)} ETH
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">当前市值</p>
          <p className="text-xl font-bold text-gray-900">
            ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">平均成本</p>
          <p className="text-lg font-semibold text-gray-900">
            ${stats.averageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">未实现盈亏</p>
          <div className={`flex items-center space-x-2 ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <p className="text-lg font-semibold">
              ${Math.abs(stats.profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-medium">
              ({stats.profitLoss >= 0 ? '+' : '-'}{Math.abs(stats.profitLossPercentage).toFixed(2)}%)
            </p>
          </div>
        </div>

        {price && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">ETH 当前价格</p>
            <p className="text-lg font-semibold text-[#8A2BE2]">
              ${price.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 