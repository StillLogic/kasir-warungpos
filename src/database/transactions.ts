import { Transaction, CartItem } from '@/types/pos';
import { TransactionRecord, CartItemRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { updateStock, getProducts } from './products';

const TRANSACTIONS_KEY = 'db_transactions';

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

// Konversi format ringan ke CartItem (partial - untuk display)
function itemFromRecord(r: CartItemRecord): CartItem {
  // Cari produk untuk data lengkap, atau gunakan data minimal
  const products = getProducts();
  const product = products.find(p => p.id === r.pi);
  
  return {
    product: product || {
      id: r.pi,
      name: r.pn,
      sku: '',
      category: '',
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

// Konversi Transaction ke format ringan
function toRecord(t: Transaction): TransactionRecord {
  return {
    i: t.id,
    it: t.items.map(itemToRecord),
    t: t.total,
    p: t.payment,
    ch: t.change,
    ca: toUnix(t.createdAt),
    cn: t.customerName || undefined,
  };
}

// Konversi format ringan ke Transaction
function fromRecord(r: TransactionRecord): Transaction {
  return {
    id: r.i,
    items: r.it.map(itemFromRecord),
    total: r.t,
    payment: r.p,
    change: r.ch,
    createdAt: fromUnix(r.ca),
    customerName: r.cn,
  };
}

function getRecords(): TransactionRecord[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveRecords(records: TransactionRecord[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(records));
}

// Public API
export function getTransactions(): Transaction[] {
  return getRecords().map(fromRecord);
}

export function saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const records = getRecords();
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
  
  records.unshift(newRecord);
  saveRecords(records);
  
  // Update stock for each item
  transaction.items.forEach(item => {
    updateStock(item.product.id, -item.quantity);
  });
  
  return fromRecord(newRecord);
}

export function getTodayTransactions(): Transaction[] {
  const transactions = getTransactions();
  const today = new Date().toDateString();
  return transactions.filter(t => new Date(t.createdAt).toDateString() === today);
}

export function getTodayRevenue(): number {
  return getTodayTransactions().reduce((sum, t) => sum + t.total, 0);
}
