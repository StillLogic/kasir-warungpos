import { MarkupRule } from '@/types/markup';
import { roundToThousand } from '@/lib/format';

const STORAGE_KEY = 'warungpos_markup_rules';

// Get all markup rules
export function getMarkupRules(): MarkupRule[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  
  // Migrate old rules without markupType
  const rules = JSON.parse(data) as MarkupRule[];
  return rules.map(rule => ({
    ...rule,
    markupType: rule.markupType || 'percent',
    retailMarkupFixed: rule.retailMarkupFixed || 0,
    wholesaleMarkupFixed: rule.wholesaleMarkupFixed || 0,
  }));
}

// Save all markup rules
export function saveMarkupRules(rules: MarkupRule[]): void {
  // Sort by minPrice ascending
  const sorted = [...rules].sort((a, b) => a.minPrice - b.minPrice);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

// Add a new markup rule
export function addMarkupRule(data: Omit<MarkupRule, 'id' | 'createdAt' | 'updatedAt'>): MarkupRule {
  const rules = getMarkupRules();
  const now = new Date().toISOString();
  
  const newRule: MarkupRule = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  
  rules.push(newRule);
  saveMarkupRules(rules);
  return newRule;
}

// Update an existing markup rule
export function updateMarkupRule(id: string, data: Partial<MarkupRule>): MarkupRule | null {
  const rules = getMarkupRules();
  const index = rules.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  rules[index] = {
    ...rules[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  saveMarkupRules(rules);
  return rules[index];
}

// Delete a markup rule
export function deleteMarkupRule(id: string): boolean {
  const rules = getMarkupRules();
  const filtered = rules.filter(r => r.id !== id);
  
  if (filtered.length === rules.length) return false;
  
  saveMarkupRules(filtered);
  return true;
}

// Get applicable markup for a given cost price and optional category
// Priority: category-specific rules > general rules (categoryId = null)
export function getMarkupForPrice(costPrice: number, categoryId?: string | null): { 
  type: 'percent' | 'fixed';
  retailPercent: number; 
  wholesalePercent: number;
  retailFixed: number;
  wholesaleFixed: number;
} | null {
  const rules = getMarkupRules();
  
  // First, try to find category-specific rule
  if (categoryId) {
    for (const rule of rules) {
      if (rule.categoryId !== categoryId) continue;
      
      const minMatch = costPrice >= rule.minPrice;
      const maxMatch = rule.maxPrice === null || costPrice <= rule.maxPrice;
      
      if (minMatch && maxMatch) {
        return {
          type: rule.markupType || 'percent',
          retailPercent: rule.retailMarkupPercent,
          wholesalePercent: rule.wholesaleMarkupPercent,
          retailFixed: rule.retailMarkupFixed || 0,
          wholesaleFixed: rule.wholesaleMarkupFixed || 0,
        };
      }
    }
  }
  
  // Fallback to general rules (categoryId = null)
  for (const rule of rules) {
    if (rule.categoryId !== null) continue;
    
    const minMatch = costPrice >= rule.minPrice;
    const maxMatch = rule.maxPrice === null || costPrice <= rule.maxPrice;
    
    if (minMatch && maxMatch) {
      return {
        type: rule.markupType || 'percent',
        retailPercent: rule.retailMarkupPercent,
        wholesalePercent: rule.wholesaleMarkupPercent,
        retailFixed: rule.retailMarkupFixed || 0,
        wholesaleFixed: rule.wholesaleMarkupFixed || 0,
      };
    }
  }
  
  return null;
}

// Calculate selling prices from cost price using markup rules
// Priority: category-specific rules > general rules
// Rounds to nearest thousand (e.g., 5800 → 6000, 5400 → 5000)
export function calculateSellingPrices(costPrice: number, categoryId?: string | null): { retailPrice: number; wholesalePrice: number } | null {
  const markup = getMarkupForPrice(costPrice, categoryId);
  
  if (!markup) return null;
  
  let rawRetail: number;
  let rawWholesale: number;
  
  if (markup.type === 'fixed') {
    // Markup dalam rupiah tetap
    rawRetail = costPrice + markup.retailFixed;
    rawWholesale = costPrice + markup.wholesaleFixed;
  } else {
    // Markup dalam persentase
    rawRetail = costPrice * (1 + markup.retailPercent / 100);
    rawWholesale = costPrice * (1 + markup.wholesalePercent / 100);
  }
  
  return {
    retailPrice: roundToThousand(rawRetail),
    wholesalePrice: roundToThousand(rawWholesale),
  };
}
