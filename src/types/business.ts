// Types for business entities

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  debt: number; // hutang (positif = pelanggan berhutang)
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  createdAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface CashSession {
  id: string;
  openingAmount: number;
  closingAmount: number;
  expectedAmount: number;
  difference: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

// Common expense categories
export const EXPENSE_CATEGORIES = [
  'Listrik',
  'Air',
  'Internet',
  'Sewa',
  'Gaji',
  'Transportasi',
  'Kebersihan',
  'Peralatan',
  'Lainnya',
] as const;
