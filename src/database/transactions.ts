import { Transaction, CartItem } from '@/types/pos';
import { TransactionRecord, CartItemRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { getDB } from './db';
import { updateStockAsync, getProductsAsync } from './products';

// Konversi CartItem ke format ringan
function itemToRecord(item: CartItem): CartItemRecord {
  return {
    pi: item.product.id,
    pn: item.product.name,
    pp: item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice,
    q: item.quantity,
    pt: item.priceType === 'wholesale' ? 1 : 0,
    sb: item.subtotal,
  };
}

// Konversi format ringan ke CartItem
async function itemFromRecord(r: CartItemRecord): Promise<CartItem> {
  const products = await getProductsAsync();
  const product = products.find(p => p.id === r.pi);

  return {
    product: product || {
      id: r.pi,
      name: r.pn,
      sku: '',
      category: '',
      costPrice: 0,
      retailPrice: r.pt === 0 ? r.pp : 0,
      wholesalePrice: r.pt === 1 ? r.pp : 0,
      wholesaleMinQty: 1,
      stock: 0,
      unit: 'pcs',
      createdAt: '',
      updatedAt: '',
    },
    quantity: r.q,
    priceType: r.pt === 1 ? 'wholesale' : 'retail',
    subtotal: r.sb,
  };
}

// Konversi format ringan ke Transaction
async function fromRecord(r: TransactionRecord): Promise<Transaction> {
  const items = await Promise.all(r.it.map(itemFromRecord));
  return {
    id: r.i,
    items,
    total: r.t,
    payment: r.p,
    change: r.ch,
    createdAt: fromUnix(r.ca),
    customerName: r.cn,
  };
}

// Public API - Async functions
export async function getTransactionsAsync(): Promise<Transaction[]> {
  const db = await getDB();
  const records = await db.getAll('transactions');
  // Sort by date descending
  records.sort((a, b) => b.ca - a.ca);
  return Promise.all(records.map(fromRecord));
}

export async function saveTransactionAsync(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const db = await getDB();
  const now = toUnix(new Date());

  const newRecord: TransactionRecord = {
    i: generateId(),
    it: transaction.items.map(itemToRecord),
    t: transaction.total,
    p: transaction.payment,
    ch: transaction.change,
    ca: now,
    cn: transaction.customerName || undefined,
  };

  await db.put('transactions', newRecord);

  // Update stock for each item
  for (const item of transaction.items) {
    await updateStockAsync(item.product.id, -item.quantity);
  }

  return fromRecord(newRecord);
}

export async function getTodayTransactionsAsync(): Promise<Transaction[]> {
  const transactions = await getTransactionsAsync();
  const today = new Date().toDateString();
  return transactions.filter(t => new Date(t.createdAt).toDateString() === today);
}

export async function getTodayRevenueAsync(): Promise<number> {
  const todayTx = await getTodayTransactionsAsync();
  return todayTx.reduce((sum, t) => sum + t.total, 0);
}

// Synchronous wrappers for backward compatibility
let cachedTransactions: Transaction[] = [];
let txCacheInitialized = false;

async function ensureTxCache() {
  if (!txCacheInitialized) {
    cachedTransactions = await getTransactionsAsync();
    txCacheInitialized = true;
  }
}

export function getTransactions(): Transaction[] {
  ensureTxCache();
  return cachedTransactions;
}

export function saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const now = new Date().toISOString();
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    createdAt: now,
  };
  cachedTransactions.unshift(newTransaction);
  
  // Async save
  saveTransactionAsync(transaction).then(t => {
    const idx = cachedTransactions.findIndex(ct => ct.id === newTransaction.id);
    if (idx !== -1) cachedTransactions[idx] = t;
  });

  return newTransaction;
}

export function getTodayTransactions(): Transaction[] {
  const today = new Date().toDateString();
  return cachedTransactions.filter(t => new Date(t.createdAt).toDateString() === today);
}

export function getTodayRevenue(): number {
  return getTodayTransactions().reduce((sum, t) => sum + t.total, 0);
}

// Initialize cache
ensureTxCache();
