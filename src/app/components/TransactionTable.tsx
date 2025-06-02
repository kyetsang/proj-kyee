'use client';

import React, { useState, useEffect } from 'react';
import { getTransactions, Transaction } from '../../lib/firebase';
import { useTransactionContext } from '../contexts/TransactionContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 定义排序类型
type SortField = 'date' | 'type' | 'amount' | 'price';
type SortOrder = 'asc' | 'desc';

// 每页显示的记录数
const PAGE_SIZE = 10;

// 格式化日期
function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function TransactionTable() {
  const { refreshTrigger } = useTransactionContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // 加载交易记录
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await getTransactions();
        setTransactions(data);
        setError(null);
      } catch (err) {
        setError('加载交易记录失败');
        console.error('加载交易记录错误:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [refreshTrigger]);

  // 处理排序
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 排序函数
  const sortTransactions = (a: Transaction, b: Transaction) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'date':
        return (a.date.getTime() - b.date.getTime()) * multiplier;
      case 'type':
        return a.type.localeCompare(b.type) * multiplier;
      case 'amount':
        return (a.amount - b.amount) * multiplier;
      case 'price':
        return (a.price - b.price) * multiplier;
      default:
        return 0;
    }
  };

  // 获取当前页的交易记录
  const paginatedTransactions = transactions
    .sort(sortTransactions)
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 计算总页数
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);

  // 渲染排序图标
  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-5">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">交易明细</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('date')}
              >
                日期 {renderSortIcon('date')}
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('type')}
              >
                类型 {renderSortIcon('type')}
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                数量 {renderSortIcon('amount')}
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('price')}
              >
                价格 {renderSortIcon('price')}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                总值
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((tx, index) => (
              <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(tx.date)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.type === 'buy' ? '买入' : '卖出'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {tx.amount.toFixed(4)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  ${tx.price.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  ${(tx.amount * tx.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200 mt-4">
          <div>
            <p className="text-xs text-gray-700">
              第 <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> 到{' '}
              <span className="font-medium">
                {Math.min(currentPage * PAGE_SIZE, transactions.length)}
              </span>{' '}
              条，共{' '}
              <span className="font-medium">{transactions.length}</span> 条
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                首页
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                上一页
              </button>
              <span className="relative inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                下一页
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                末页
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
} 