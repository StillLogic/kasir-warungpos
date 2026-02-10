import { ShoppingCategory, ShoppingItem, ShoppingArchive } from "@/types/shopping-list";
import { generateId } from "./utils";

const SHOPPING_CATEGORIES_KEY = "db_shopping_categories";
const SHOPPING_ITEMS_KEY = "db_shopping_items";
const SHOPPING_ARCHIVES_KEY = "db_shopping_archives";

// Categories
export function getShoppingCategories(): ShoppingCategory[] {
  try {
    const data = localStorage.getItem(SHOPPING_CATEGORIES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function createShoppingCategory(name: string): ShoppingCategory {
  const categories = getShoppingCategories();
  const newCategory: ShoppingCategory = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };
  categories.push(newCategory);
  localStorage.setItem(SHOPPING_CATEGORIES_KEY, JSON.stringify(categories));
  return newCategory;
}

export function deleteShoppingCategory(id: string): void {
  const categories = getShoppingCategories().filter((c) => c.id !== id);
  localStorage.setItem(SHOPPING_CATEGORIES_KEY, JSON.stringify(categories));
  const items = getShoppingItems().filter((i) => i.categoryId !== id);
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
}

// Items
export function getShoppingItems(): ShoppingItem[] {
  try {
    const data = localStorage.getItem(SHOPPING_ITEMS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function createShoppingItem(
  item: Omit<ShoppingItem, "id" | "createdAt" | "isPurchased">,
): ShoppingItem {
  const items = getShoppingItems();
  const newItem: ShoppingItem = {
    ...item,
    id: generateId(),
    isPurchased: false,
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
  return newItem;
}

export function updateShoppingItem(
  id: string,
  data: Partial<ShoppingItem>,
): void {
  const items = getShoppingItems().map((item) =>
    item.id === id ? { ...item, ...data } : item,
  );
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
}

export function deleteShoppingItem(id: string): void {
  const items = getShoppingItems().filter((i) => i.id !== id);
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
}

export function toggleShoppingItemPurchased(id: string): void {
  const items = getShoppingItems().map((item) =>
    item.id === id ? { ...item, isPurchased: !item.isPurchased } : item,
  );
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
}

export function toggleCategoryItemsPurchased(categoryId: string, purchased: boolean): void {
  const items = getShoppingItems().map((item) =>
    item.categoryId === categoryId ? { ...item, isPurchased: purchased } : item,
  );
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
}

export function clearPurchasedItems(): void {
  const items = getShoppingItems().filter((i) => !i.isPurchased);
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
}

// Archives
export function getShoppingArchives(): ShoppingArchive[] {
  try {
    const data = localStorage.getItem(SHOPPING_ARCHIVES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function archivePurchasedItems(): number {
  const allItems = getShoppingItems();
  const purchased = allItems.filter((i) => i.isPurchased);
  if (purchased.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const archives = getShoppingArchives();

  // Find existing archive for today or create new
  const existingIdx = archives.findIndex((a) => a.date === today);
  if (existingIdx >= 0) {
    archives[existingIdx].items.push(...purchased);
  } else {
    archives.push({
      id: generateId(),
      date: today,
      items: purchased,
      archivedAt: new Date().toISOString(),
    });
  }

  // Sort archives newest first
  archives.sort((a, b) => b.date.localeCompare(a.date));

  localStorage.setItem(SHOPPING_ARCHIVES_KEY, JSON.stringify(archives));

  // Remove purchased items from active list
  const remaining = allItems.filter((i) => !i.isPurchased);
  localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(remaining));

  return purchased.length;
}

export function deleteShoppingArchive(id: string): void {
  const archives = getShoppingArchives().filter((a) => a.id !== id);
  localStorage.setItem(SHOPPING_ARCHIVES_KEY, JSON.stringify(archives));
}
