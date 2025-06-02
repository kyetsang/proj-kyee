'use client';

import React, { useState, useEffect } from 'react';
import { addTransaction } from '../../lib/firebase';
import { useEthPrice } from '../../lib/price';
import { useTransactionContext } from '../contexts/TransactionContext';

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function TransactionForm() {
  const { price, isLoading: isPriceLoading } = useEthPrice();
  const { triggerRefresh } = useTransactionContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    datetime: getCurrentDateTime(),
    amount: '',
    price: '',
    useCurrentPrice: true
  });

  // 当市场价格更新时，如果启用了自动价格，则更新表单价格
  useEffect(() => {
    if (formData.useCurrentPrice && price) {
      setFormData(prev => ({
        ...prev,
        price: price.usd.toString()
      }));
    }
  }, [price, formData.useCurrentPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setError(null);

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // 如果启用自动价格，使用当前市场价格；如果禁用，清空价格字段
        price: checked && price ? price.usd.toString() : ''
      }));
    } else if (name === 'price' && formData.useCurrentPrice) {
      // 如果是价格字段且启用了自动价格，不允许手动修改
      return;
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (type: 'buy' | 'sell') => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.amount || Number(formData.amount) <= 0) {
        throw new Error('请输入有效的 ETH 数量');
      }
      if (!formData.price || Number(formData.price) <= 0) {
        throw new Error('请输入有效的价格');
      }

      const [datePart, timePart] = formData.datetime.split('T');
      if (!datePart || !timePart) {
        throw new Error('请选择有效的日期和时间');
      }

      const [hours, minutes] = timePart.split(':');
      const date = new Date(datePart);
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (isNaN(date.getTime())) {
        throw new Error('无效的日期格式');
      }

      const result = await addTransaction({
        date,
        type,
        amount: parseFloat(formData.amount),
        price: parseFloat(formData.price)
      });

      console.log('Firebase 返回结果:', result);

      setFormData({
        datetime: getCurrentDateTime(),
        amount: '',
        price: price && price.usd ? price.usd.toString() : '',
        useCurrentPrice: true
      });

      // 触发交易列表刷新
      triggerRefresh();

      alert(`${type === 'buy' ? '买入' : '卖出'}交易记录已添加！`);
    } catch (error) {
      console.error('添加交易记录失败:', error);
      setError(error instanceof Error ? error.message : '添加交易记录失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">添加交易记录</h2>
      
      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日期和时间
          </label>
          <input
            type="datetime-local"
            name="datetime"
            value={formData.datetime}
            onChange={handleInputChange}
            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#8A2BE2] focus:ring-[#8A2BE2] text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            数量 (ETH)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.0001"
            min="0"
            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#8A2BE2] focus:ring-[#8A2BE2] text-sm"
            required
          />
        </div>

        <div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="useCurrentPrice"
              checked={formData.useCurrentPrice}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-[#8A2BE2] focus:ring-[#8A2BE2] h-4 w-4"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              使用当前市场价格
              {isPriceLoading ? (
                <span className="ml-1 text-gray-500">(加载中...)</span>
              ) : price ? (
                <span className="ml-1 text-[#8A2BE2]">(${price.usd.toFixed(2)})</span>
              ) : null}
            </label>
          </div>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            disabled={formData.useCurrentPrice}
            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#8A2BE2] focus:ring-[#8A2BE2] text-sm disabled:bg-gray-50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleSubmit('buy')}
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 transition-colors duration-200"
          >
            {isSubmitting ? '提交中...' : '买入'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('sell')}
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-400 transition-colors duration-200"
          >
            {isSubmitting ? '提交中...' : '卖出'}
          </button>
        </div>
      </div>
    </div>
  );
} 