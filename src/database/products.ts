import { Product } from '@/types/pos';
import { ProductRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { getDB } from './db';

// Konversi Product ke format ringan
function toRecord(p: Product): ProductRecord {
  return {
    i: p.id,
    n: p.name,
    s: p.sku,
    c: p.category,
    cp: p.costPrice || 0,
    rp: p.retailPrice,
    wp: p.wholesalePrice,
    wq: p.wholesaleMinQty,
    st: p.stock,
    u: p.unit,
    ca: typeof p.createdAt === 'string' ? toUnix(p.createdAt) : p.createdAt as unknown as number,
    ua: typeof p.updatedAt === 'string' ? toUnix(p.updatedAt) : p.updatedAt as unknown as number,
  };
}

// Konversi format ringan ke Product
function fromRecord(r: ProductRecord): Product {
  return {
    id: r.i,
    name: r.n,
    sku: r.s,
    category: r.c,
    costPrice: r.cp || 0,
    retailPrice: r.rp,
    wholesalePrice: r.wp,
    wholesaleMinQty: r.wq,
    stock: r.st,
    unit: r.u,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  };
}

// Public API - Async functions for IndexedDB
export async function getProductsAsync(): Promise<Product[]> {
  const db = await getDB();
  const records = await db.getAll('products');
  return records.map(fromRecord);
}

export async function addProductAsync(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const db = await getDB();
  const now = toUnix(new Date());
  const newRecord: ProductRecord = {
    i: generateId(),
    n: product.name,
    s: product.sku,
    c: product.category,
    cp: product.costPrice || 0,
    rp: product.retailPrice,
    wp: product.wholesalePrice,
    wq: product.wholesaleMinQty,
    st: product.stock,
    u: product.unit,
    ca: now,
    ua: now,
  };
  await db.put('products', newRecord);
  return fromRecord(newRecord);
}

export async function updateProductAsync(id: string, data: Partial<Product>): Promise<Product | null> {
  const db = await getDB();
  const record = await db.get('products', id);
  if (!record) return null;

  const updated: ProductRecord = {
    ...record,
    ...(data.name !== undefined && { n: data.name }),
    ...(data.sku !== undefined && { s: data.sku }),
    ...(data.category !== undefined && { c: data.category }),
    ...(data.costPrice !== undefined && { cp: data.costPrice }),
    ...(data.retailPrice !== undefined && { rp: data.retailPrice }),
    ...(data.wholesalePrice !== undefined && { wp: data.wholesalePrice }),
    ...(data.wholesaleMinQty !== undefined && { wq: data.wholesaleMinQty }),
    ...(data.stock !== undefined && { st: data.stock }),
    ...(data.unit !== undefined && { u: data.unit }),
    ua: toUnix(new Date()),
  };

  await db.put('products', updated);
  return fromRecord(updated);
}

export async function deleteProductAsync(id: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get('products', id);
  if (!record) return false;
  await db.delete('products', id);
  return true;
}

export async function updateStockAsync(id: string, quantity: number): Promise<boolean> {
  const db = await getDB();
  const record = await db.get('products', id);
  if (!record) return false;

  record.st += quantity;
  record.ua = toUnix(new Date());
  await db.put('products', record);
  return true;
}

export async function getProductBySkuAsync(sku: string): Promise<Product | null> {
  const db = await getDB();
  const record = await db.getFromIndex('products', 'by-sku', sku);
  return record ? fromRecord(record) : null;
}

// Synchronous wrappers for backward compatibility (using cached data)
let cachedProducts: Product[] = [];
let cacheInitialized = false;
let cachePromise: Promise<void> | null = null;

async function ensureCache(): Promise<void> {
  if (cacheInitialized) return;
  if (cachePromise) return cachePromise;
  
  cachePromise = (async () => {
    cachedProducts = await getProductsAsync();
    cacheInitialized = true;
  })();
  
  return cachePromise;
}

// Wait for cache to be ready
export async function waitForProducts(): Promise<Product[]> {
  await ensureCache();
  return cachedProducts;
}

export function getProducts(): Product[] {
  // If not initialized, return empty and let caller handle async loading
  return cachedProducts;
}

export function isProductsCacheReady(): boolean {
  return cacheInitialized;
}

export function saveProducts(products: Product[]): void {
  cachedProducts = products;
  // Async save
  (async () => {
    const db = await getDB();
    const tx = db.transaction('products', 'readwrite');
    await tx.store.clear();
    for (const product of products) {
      await tx.store.put(toRecord(product));
    }
    await tx.done;
  })();
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const now = new Date().toISOString();
  const id = generateId();
  const newProduct: Product = {
    ...product,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  // Add to cache
  cachedProducts = [...cachedProducts, newProduct];
  
  // Async save to IndexedDB
  (async () => {
    const db = await getDB();
    await db.put('products', toRecord(newProduct));
  })();
  
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const index = cachedProducts.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  const updated = {
    ...cachedProducts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  cachedProducts = cachedProducts.map(p => p.id === id ? updated : p);
  
  // Async save
  updateProductAsync(id, data);
  return updated;
}

export function deleteProduct(id: string): boolean {
  const exists = cachedProducts.some(p => p.id === id);
  if (!exists) return false;
  
  cachedProducts = cachedProducts.filter(p => p.id !== id);
  
  // Async delete
  deleteProductAsync(id);
  return true;
}

export function updateStock(id: string, quantity: number): boolean {
  const index = cachedProducts.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  cachedProducts = cachedProducts.map(p => 
    p.id === id 
      ? { ...p, stock: p.stock + quantity, updatedAt: new Date().toISOString() }
      : p
  );
  
  // Async save
  updateStockAsync(id, quantity);
  return true;
}

export function getProductBySku(sku: string): Product | null {
  return cachedProducts.find(p => p.sku === sku) || null;
}

// Initialize cache on module load
ensureCache();
