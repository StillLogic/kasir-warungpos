export interface ShoppingCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  categoryId: string;
  categoryName: string;
  productName: string;
  brand: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  createdAt: string;
}
