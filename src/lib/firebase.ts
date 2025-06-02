import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

// Firebase 配置
const firebaseConfig = {
  // 请替换为您的 Firebase 配置
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 初始化 Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// 检查 Firebase 配置
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('Firebase 配置缺失！请检查 .env.local 文件');
}

// 定义交易记录类型
export interface Transaction {
  id?: string;
  amount: number;  // ETH 数量
  price: number;   // 买入价格(USD)
  date: Date;      // 交易日期
  type: 'buy' | 'sell';  // 交易类型
}

// 验证交易数据
function validateTransaction(transaction: any): string | null {
  if (!transaction) return '交易数据为空';
  
  if (!transaction.amount || isNaN(Number(transaction.amount))) {
    return 'ETH 数量无效';
  }
  
  if (!transaction.price || isNaN(Number(transaction.price))) {
    return '价格无效';
  }
  
  if (!transaction.date || !(transaction.date instanceof Date)) {
    return '日期无效';
  }
  
  if (!transaction.type || !['buy', 'sell'].includes(transaction.type)) {
    return '交易类型无效';
  }
  
  return null;
}

// 添加新交易记录
export async function addTransaction(transaction: Omit<Transaction, 'id'>) {
  try {
    console.log('接收到的交易数据:', transaction);
    
    // 验证数据
    const validationError = validateTransaction(transaction);
    if (validationError) {
      console.error('数据验证失败:', validationError);
      throw new Error(validationError);
    }

    // 确保数值类型正确
    const data = {
      amount: Number(transaction.amount),
      price: Number(transaction.price),
      date: Timestamp.fromDate(transaction.date),
      type: transaction.type
    };

    console.log('准备添加到 Firebase 的数据:', data);

    const docRef = await addDoc(collection(db, 'transactions'), data);
    console.log('成功添加文档，ID:', docRef.id);

    return { 
      id: docRef.id,
      ...transaction,
      amount: Number(transaction.amount),
      price: Number(transaction.price)
    };
  } catch (error) {
    console.error('Firebase 添加交易记录错误:', error);
    throw error instanceof Error ? error : new Error('添加交易记录失败');
  }
}

// 获取所有交易记录
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
      amount: Number(doc.data().amount),
      price: Number(doc.data().price)
    })) as Transaction[];
  } catch (error) {
    console.error('获取交易记录失败:', error);
    throw error instanceof Error ? error : new Error('获取交易记录失败');
  }
}

// 计算总持仓量
export function calculateHoldings(transactions: Transaction[]): number {
  return transactions.reduce((total, tx) => {
    return total + (tx.type === 'buy' ? tx.amount : -tx.amount);
  }, 0);
}

// 计算平均买入价格
export function calculateAverageBuyPrice(transactions: Transaction[]): number {
  const buyTxs = transactions.filter(tx => tx.type === 'buy');
  if (buyTxs.length === 0) return 0;
  
  const totalCost = buyTxs.reduce((sum, tx) => sum + (tx.amount * tx.price), 0);
  const totalAmount = buyTxs.reduce((sum, tx) => sum + tx.amount, 0);
  
  return totalCost / totalAmount;
} 