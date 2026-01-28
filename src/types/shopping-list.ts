export type ShoppingUnit = "pcs" | "lusin" | "pack" | "dus" | "karung" | "kg";

export const SHOPPING_UNITS: { value: ShoppingUnit; label: string }[] = [
  { value: "pcs", label: "Pcs" },
  { value: "lusin", label: "Lusin" },
  { value: "pack", label: "Pack" },
  { value: "dus", label: "Dus" },
  { value: "karung", label: "Karung" },
  { value: "kg", label: "Kg" },
];

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
  unit: ShoppingUnit;
  isPurchased: boolean;
  createdAt: string;
}
