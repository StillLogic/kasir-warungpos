import { getProducts } from '@/database';

const categoryPrefixes: Record<string, string> = {
  'Makanan': 'MKN',
  'Minuman': 'MNM',
  'Snack': 'SNK',
  'Rokok': 'RKK',
  'Kebersihan': 'KBR',
  'Lainnya': 'LNY',
};

export function generateSKU(category: string): string {
  const prefix = categoryPrefixes[category] || 'PRD';
  const products = getProducts();
  
  // Find existing SKUs with this prefix
  const existingSkus = products
    .filter(p => p.sku.startsWith(prefix))
    .map(p => {
      const num = parseInt(p.sku.replace(prefix, ''), 10);
      return isNaN(num) ? 0 : num;
    });
  
  // Get next number
  const maxNum = existingSkus.length > 0 ? Math.max(...existingSkus) : 0;
  const nextNum = (maxNum + 1).toString().padStart(4, '0');
  
  return `${prefix}${nextNum}`;
}
