import { NextResponse } from 'next/server';

const RSS_URL = 'https://cn.cointelegraph.com/rss';

export async function GET() {
  try {
    const response = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml,application/xml;q=0.9',
      },
      // 禁用 Next.js 的自动缓存
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();
    
    return NextResponse.json({ xml }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  } catch (error) {
    console.error('获取新闻失败:', error);
    return NextResponse.json(
      { error: '获取新闻失败' },
      { status: 500 }
    );
  }
} 