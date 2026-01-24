import { getProducts, getCategoryPrefixes } from '@/database';

export function generateSKU(category: string): string {
  const categoryPrefixes = getCategoryPrefixes();
  const prefix = categoryPrefixes[category] || 'PRD';
  const products = getProducts();
  
  
  const existingSkus = products
    .filter(p => p.sku.startsWith(prefix))
    .map(p => {
      const num = parseInt(p.sku.replace(prefix, ''), 10);
      return isNaN(num) ? 0 : num;
    });
  
  
  const maxNum = existingSkus.length > 0 ? Math.max(...existingSkus) : 0;
  const nextNum = (maxNum + 1).toString().padStart(4, '0');
  
  return `${prefix}${nextNum}`;
}
