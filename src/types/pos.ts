export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  stock: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceType: "retail" | "wholesale";
  subtotal: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  payment: number;
  change: number;
  createdAt: string;
  customerName?: string;
  paymentType?: "cash" | "debt";
  customerId?: string;
}

export type ProductFormData = Omit<Product, "id" | "createdAt" | "updatedAt">;
