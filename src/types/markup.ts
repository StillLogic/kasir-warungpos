export interface MarkupRule {
  id: string;
  minPrice: number;
  maxPrice: number | null; // null = unlimited
  retailMarkupPercent: number;
  wholesaleMarkupPercent: number;
  createdAt: string;
  updatedAt: string;
}

export type MarkupRuleFormData = Omit<MarkupRule, 'id' | 'createdAt' | 'updatedAt'>;
