export interface NewsItem {
  title: string;
  url: string;
  publishDate: string;
}

const CACHE_KEY = 'eth_news_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
const API_URL = '/api/news';
const RETRY_DELAY = 60 * 60 * 1000; // 1小时重试延迟

// 检查标题是否包含相关关键词
const hasRelevantKeywords = (title: string): boolean => {
  // 必须包含的主要关键词
  const mainKeywords = ['以太坊', 'ETH', 'Ethereum'];
  const normalizedTitle = title.toLowerCase();
  
  // 标题必须包含主要关键词之一
  return mainKeywords.some(keyword => 
    normalizedTitle.includes(keyword.toLowerCase())
  );
};

// 从缓存获取新闻
const getNewsFromCache = (): NewsItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('使用缓存的新闻数据，数量:', data.length);
        return data.slice(0, 5); // 只返回最新的5条
      }
    }
  } catch (error) {
    console.error('读取缓存失败:', error);
  }
  return [];
};

// 保存新闻到缓存
const saveNewsToCache = (news: NewsItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: news,
      timestamp: Date.now()
    }));
    console.log('新闻数据已缓存，数量:', news.length);
  } catch (error) {
    console.error('保存缓存失败:', error);
  }
};

// 解析 RSS XML
const parseRSS = (xml: string): NewsItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item');
  const newsItems: NewsItem[] = [];

  items.forEach(item => {
    const title = item.querySelector('title')?.textContent || '';
    const url = item.querySelector('link')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    
    if (title && url && hasRelevantKeywords(title)) {
      try {
        const date = new Date(pubDate);
        newsItems.push({
          title: title.trim(),
          url: url.trim(),
          publishDate: date.toLocaleString('zh-CN')
        });
      } catch (e) {
        console.error('日期解析失败:', e);
      }
    }
  });

  // 只返回最新的5条新闻
  return newsItems.slice(0, 5);
};

export const fetchEthNews = async (): Promise<NewsItem[]> => {
  try {
    // 首先检查缓存
    const cachedNews = getNewsFromCache();
    if (cachedNews.length > 0) {
      return cachedNews;
    }

    console.log('开始获取新闻...');
    
    // 使用本地 API 路由获取新闻
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { xml } = await response.json();
    if (!xml) {
      throw new Error('未获取到 RSS 内容');
    }

    console.log('成功获取 RSS 内容');
    
    // 解析 RSS 内容
    const newsItems = parseRSS(xml);
    console.log(`找到 ${newsItems.length} 条以太坊相关新闻`);
    if (newsItems.length > 0) {
      console.log('最新新闻:', newsItems[0].title);
    }

    // 保存到缓存
    saveNewsToCache(newsItems);
    return newsItems;

  } catch (error) {
    console.error('获取新闻失败:', error);
    
    // 设置重试
    if (typeof window !== 'undefined') {
      setTimeout(() => fetchEthNews(), RETRY_DELAY);
    }
    
    // 返回缓存的新闻（如果有）
    return getNewsFromCache();
  }
}; 