import { MarkupRule } from '@/types/markup';

const STORAGE_KEY = 'warungpos_markup_rules';

// Get all markup rules
export function getMarkupRules(): MarkupRule[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
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
export function getMarkupForPrice(costPrice: number, categoryId?: string | null): { retailPercent: number; wholesalePercent: number } | null {
  const rules = getMarkupRules();
  
  // First, try to find category-specific rule
  if (categoryId) {
    for (const rule of rules) {
      if (rule.categoryId !== categoryId) continue;
      
      const minMatch = costPrice >= rule.minPrice;
      const maxMatch = rule.maxPrice === null || costPrice <= rule.maxPrice;
      
      if (minMatch && maxMatch) {
        return {
          retailPercent: rule.retailMarkupPercent,
          wholesalePercent: rule.wholesaleMarkupPercent,
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
        retailPercent: rule.retailMarkupPercent,
        wholesalePercent: rule.wholesaleMarkupPercent,
      };
    }
  }
  
  return null;
}

// Calculate selling prices from cost price using markup rules
// Priority: category-specific rules > general rules
export function calculateSellingPrices(costPrice: number, categoryId?: string | null): { retailPrice: number; wholesalePrice: number } | null {
  const markup = getMarkupForPrice(costPrice, categoryId);
  
  if (!markup) return null;
  
  return {
    retailPrice: Math.round(costPrice * (1 + markup.retailPercent / 100)),
    wholesalePrice: Math.round(costPrice * (1 + markup.wholesalePercent / 100)),
  };
}
