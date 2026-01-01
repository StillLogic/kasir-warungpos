import { Product, Transaction } from '@/types/pos';

const PRODUCTS_KEY = 'pos_products';
const TRANSACTIONS_KEY = 'pos_transactions';

// Products
export function getProducts(): Product[] {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  products[index] = {
    ...products[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveProducts(products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}

export function updateStock(id: string, quantity: number): boolean {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  products[index].stock += quantity;
  products[index].updatedAt = new Date().toISOString();
  saveProducts(products);
  return true;
}

// Transactions
export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  transactions.unshift(newTransaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  
  // Update stock for each item
  transaction.items.forEach(item => {
    updateStock(item.product.id, -item.quantity);
  });
  
  return newTransaction;
}

export function getTodayTransactions(): Transaction[] {
  const transactions = getTransactions();
  const today = new Date().toDateString();
  return transactions.filter(t => new Date(t.createdAt).toDateString() === today);
}

export function getTodayRevenue(): number {
  return getTodayTransactions().reduce((sum, t) => sum + t.total, 0);
}
