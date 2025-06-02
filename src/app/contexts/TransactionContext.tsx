'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface TransactionContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TransactionContext = createContext<TransactionContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <TransactionContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext() {
  return useContext(TransactionContext);
} 