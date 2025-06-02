'use client';

import React from 'react';
import TransactionForm from './components/TransactionForm'
import TransactionTable from './components/TransactionTable'
import PortfolioOverview from './components/PortfolioOverview'
import ProfitLossChart from './components/ProfitLossChart'
import NewsSection from './components/NewsSection'
import { TransactionProvider } from './contexts/TransactionContext'

export default function Home() {
  return (
    <TransactionProvider>
      <main className="min-h-screen bg-[#F5F7FF] py-8">
        <div className="max-w-[1600px] mx-auto px-6">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">ETH 交易追踪</h1>
          
          {/* 新闻部分 */}
          <NewsSection />
          
          <div className="flex flex-row w-full gap-6">
            {/* 左侧栏 - 固定30%宽度 */}
            <div className="w-[30%] flex flex-col gap-6">
              {/* 持仓概览 */}
              <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-[#8A2BE2]">
                <PortfolioOverview />
              </div>
              
              {/* 交易表单 */}
              <div className="w-full sticky top-6">
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <TransactionForm />
                </div>
              </div>
            </div>
            
            {/* 右侧栏 - 固定70%宽度 */}
            <div className="w-[70%] flex flex-col gap-6">
              {/* 盈亏分析 */}
              <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <ProfitLossChart />
              </div>
              
              {/* 交易明细 */}
              <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <TransactionTable />
              </div>
            </div>
          </div>
        </div>
      </main>
    </TransactionProvider>
  )
} 