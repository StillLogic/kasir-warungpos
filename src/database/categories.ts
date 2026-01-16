// Category database management
// Kategori disimpan di localStorage dengan format sederhana

export interface Category {
  id: string;
  name: string;
  prefix: string; // 3 karakter prefix untuk SKU
  createdAt: number;
}

const STORAGE_KEY = 'db_categories';

// Default categories
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Makanan', prefix: 'MKN' },
  { name: 'Minuman', prefix: 'MNM' },
  { name: 'Snack', prefix: 'SNK' },
  { name: 'Rokok', prefix: 'RKK' },
  { name: 'Kebersihan', prefix: 'KBR' },
  { name: 'Sembako', prefix: 'SMB' },
  { name: 'Lainnya', prefix: 'LNY' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Initialize categories if not exists
function initCategories(): Category[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Create default categories
  const now = Date.now();
  const categories: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    id: generateId(),
    name: cat.name,
    prefix: cat.prefix,
    createdAt: now + idx, // Slight offset to maintain order
  }));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  return categories;
}

// Get all categories
export function getCategories(): Category[] {
  return initCategories().sort((a, b) => a.createdAt - b.createdAt);
}

// Get category names only
export function getCategoryNames(): string[] {
  return getCategories().map(c => c.name);
}

// Get category prefix map for SKU generation
export function getCategoryPrefixes(): Record<string, string> {
  const categories = getCategories();
  const prefixes: Record<string, string> = {};
  for (const cat of categories) {
    prefixes[cat.name] = cat.prefix;
  }
  return prefixes;
}

// Add new category
export function addCategory(name: string, prefix: string): Category | null {
  const categories = getCategories();
  
  // Check for duplicate name
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return null;
  }
  
  // Check for duplicate prefix
  if (categories.some(c => c.prefix.toUpperCase() === prefix.toUpperCase())) {
    return null;
  }
  
  const newCategory: Category = {
    id: generateId(),
    name: name.trim(),
    prefix: prefix.toUpperCase().substring(0, 3),
    createdAt: Date.now(),
  };
  
  categories.push(newCategory);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  return newCategory;
}

// Update category
export function updateCategory(id: string, name: string, prefix: string): Category | null {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  // Check for duplicate name (excluding current)
  if (categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
    return null;
  }
  
  // Check for duplicate prefix (excluding current)
  if (categories.some(c => c.id !== id && c.prefix.toUpperCase() === prefix.toUpperCase())) {
    return null;
  }
  
  categories[index] = {
    ...categories[index],
    name: name.trim(),
    prefix: prefix.toUpperCase().substring(0, 3),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  return categories[index];
}

// Delete category
export function deleteCategory(id: string): boolean {
  const categories = getCategories();
  const filtered = categories.filter(c => c.id !== id);
  
  if (filtered.length === categories.length) return false;
  
  // Ensure at least one category remains
  if (filtered.length === 0) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Check if category is used by any product
export function isCategoryInUse(categoryName: string): boolean {
  // Import dynamically to avoid circular dependency
  const products = JSON.parse(localStorage.getItem('db_products') || '[]');
  return products.some((p: { c: string }) => p.c === categoryName);
}
