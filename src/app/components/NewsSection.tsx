'use client';

import React, { useEffect, useState } from 'react';
import { fetchEthNews, NewsItem } from '../../lib/news';

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadNews = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);
        
        const newsItems = await fetchEthNews();
        
        if (!mounted) return;
        setNews(newsItems);
      } catch (err) {
        if (!mounted) return;
        setError('获取新闻失败，请稍后重试');
        console.error('新闻加载错误:', err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    loadNews();

    // 设置定时刷新（30分钟）
    const interval = setInterval(loadNews, 30 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 mb-6">
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-[#8A2BE2] hover:text-[#7A1DC5] font-medium"
        >
          点击重试
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">以太坊相关新闻</h2>
      
      {news.length > 0 ? (
        <ul className="space-y-3">
          {news.map((item, index) => (
            <li key={index} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
              >
                <div className="text-[#8A2BE2] hover:text-[#7A1DC5] font-medium">
                  {item.title}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {item.publishDate}
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">暂无相关新闻</p>
      )}
      
      <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
        新闻来源：Cointelegraph 中文
      </div>
    </div>
  );
} 