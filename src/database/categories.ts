import { generateId } from "./utils";

export interface Category {
  id: string;
  name: string;
  prefix: string;
  createdAt: number;
}

const STORAGE_KEY = "db_categories";

const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt">[] = [
  { name: "Makanan", prefix: "MKN" },
  { name: "Minuman", prefix: "MNM" },
  { name: "Snack", prefix: "SNK" },
  { name: "Rokok", prefix: "RKK" },
  { name: "Kebersihan", prefix: "KBR" },
  { name: "Sembako", prefix: "SMB" },
  { name: "Lainnya", prefix: "LNY" },
];

function initCategories(): Category[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const now = Date.now();
  const categories: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    id: generateId(),
    name: cat.name,
    prefix: cat.prefix,
    createdAt: now + idx,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  return categories;
}

export function getCategories(): Category[] {
  return initCategories().sort((a, b) => a.createdAt - b.createdAt);
}

export function getCategoryNames(): string[] {
  return getCategories().map((c) => c.name);
}

export function getCategoryPrefixes(): Record<string, string> {
  const categories = getCategories();
  const prefixes: Record<string, string> = {};
  for (const cat of categories) {
    prefixes[cat.name] = cat.prefix;
  }
  return prefixes;
}

export function addCategory(name: string, prefix: string): Category | null {
  const categories = getCategories();

  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return null;
  }

  if (categories.some((c) => c.prefix.toUpperCase() === prefix.toUpperCase())) {
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

export function updateCategory(
  id: string,
  name: string,
  prefix: string,
): Category | null {
  const categories = getCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return null;

  if (
    categories.some(
      (c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return null;
  }

  if (
    categories.some(
      (c) => c.id !== id && c.prefix.toUpperCase() === prefix.toUpperCase(),
    )
  ) {
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

export function deleteCategory(id: string): boolean {
  const categories = getCategories();
  const filtered = categories.filter((c) => c.id !== id);

  if (filtered.length === categories.length) return false;

  if (filtered.length === 0) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function isCategoryInUse(categoryName: string): boolean {
  const { getProducts } = require("./products");
  const products = getProducts();
  return products.some((p) => p.category === categoryName);
}
