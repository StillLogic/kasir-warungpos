export type MarkupType = 'percent' | 'fixed';

export interface MarkupRule {
  id: string;
  minPrice: number;
  maxPrice: number | null; // null = unlimited
  markupType: MarkupType; // 'percent' = persentase, 'fixed' = rupiah tetap
  retailMarkupPercent: number; // digunakan jika markupType = 'percent'
  wholesaleMarkupPercent: number; // digunakan jika markupType = 'percent'
  retailMarkupFixed: number; // digunakan jika markupType = 'fixed'
  wholesaleMarkupFixed: number; // digunakan jika markupType = 'fixed'
  categoryId: string | null; // null = berlaku untuk semua produk
  createdAt: string;
  updatedAt: string;
}

export type MarkupRuleFormData = Omit<MarkupRule, 'id' | 'createdAt' | 'updatedAt'>;
