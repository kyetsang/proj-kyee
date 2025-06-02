'use client';

import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../lib/firebase';
import { useTransactionContext } from '../contexts/TransactionContext';
import { useEthPrice } from '../../lib/price';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyStats {
  date: string;
  profitLoss: number;
  holdings: number;
  value: number;
}

export default function ProfitLossChart() {
  const { refreshTrigger } = useTransactionContext();
  const { price } = useEthPrice();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('chart');

  useEffect(() => {
    const calculateDailyStats = async () => {
      try {
        setLoading(true);
        const transactions = await getTransactions();
        
        // 按日期排序交易
        const sortedTransactions = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // 获取日期范围
        if (sortedTransactions.length === 0) {
          setDailyStats([]);
          return;
        }

        const firstDate = new Date(sortedTransactions[0].date);
        const lastDate = new Date();
        const dateRange: string[] = [];
        
        // 生成日期范围数组
        for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
          dateRange.push(d.toISOString().split('T')[0]);
        }

        // 初始化每日统计数据
        const dailyData: { [key: string]: DailyStats } = {};
        dateRange.forEach(date => {
          dailyData[date] = {
            date,
            holdings: 0,
            value: 0,
            profitLoss: 0
          };
        });

        // 计算每日持仓和成本
        let runningHoldings = 0;
        let runningCost = 0;

        sortedTransactions.forEach(tx => {
          const txDate = tx.date.toISOString().split('T')[0];
          
          if (tx.type === 'buy') {
            runningHoldings += tx.amount;
            runningCost += tx.amount * tx.price;
          } else {
            runningHoldings -= tx.amount;
            const costBasis = (runningCost / (runningHoldings + tx.amount)) * tx.amount;
            runningCost -= costBasis;
          }

          // 更新交易日期及之后所有日期的持仓数据
          dateRange
            .filter(date => date >= txDate)
            .forEach(date => {
              dailyData[date].holdings = runningHoldings;
              dailyData[date].value = runningHoldings * (price?.usd || 0);
              dailyData[date].profitLoss = dailyData[date].value - runningCost;
            });
        });

        // 转换为数组并设置状态
        setDailyStats(Object.values(dailyData));
        setError(null);
      } catch (err) {
        console.error('计算每日统计数据失败:', err);
        setError('无法加载盈亏数据');
      } finally {
        setLoading(false);
      }
    };

    if (price?.usd) {
      calculateDailyStats();
    }
  }, [refreshTrigger, price]);

  // 图表配置优化
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 20,
          padding: 10,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('盈亏')) {
                label += '$' + context.parsed.y.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
              } else {
                label += context.parsed.y.toFixed(4) + ' ETH';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          },
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  // 准备图表数据
  const lineChartData = {
    labels: dailyStats.map(stat => stat.date),
    datasets: [
      {
        label: '累计盈亏',
        data: dailyStats.map(stat => stat.profitLoss),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4
      }
    ]
  };

  const barChartData = {
    labels: dailyStats.map(stat => stat.date),
    datasets: [
      {
        label: '持仓量',
        data: dailyStats.map(stat => stat.holdings),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">盈亏分析</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'chart'
                ? 'bg-[#8A2BE2] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            图表
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'table'
                ? 'bg-[#8A2BE2] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            表格
          </button>
        </div>
      </div>

      {activeTab === 'chart' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-medium mb-4 text-gray-600">盈亏趋势</h3>
            <div className="h-[240px]">
              <Line options={{
                ...chartOptions,
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: false
                  }
                }
              }} data={lineChartData} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-medium mb-4 text-gray-600">持仓量变化</h3>
            <div className="h-[240px]">
              <Bar options={{
                ...chartOptions,
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: false
                  }
                }
              }} data={barChartData} />
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">持仓量</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">市值</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">盈亏</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyStats.map((stat, index) => (
                <tr key={stat.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900">{stat.date}</td>
                  <td className="px-4 py-3 text-sm text-right">{stat.holdings.toFixed(4)} ETH</td>
                  <td className="px-4 py-3 text-sm text-right">
                    ${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${stat.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${stat.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 