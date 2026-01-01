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
    b: p.barcode || undefined,
    c: p.category,
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
    barcode: r.b,
    category: r.c,
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
    b: product.barcode || undefined,
    c: product.category,
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
    ...(data.barcode !== undefined && { b: data.barcode || undefined }),
    ...(data.category !== undefined && { c: data.category }),
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

export async function getProductByBarcodeAsync(barcode: string): Promise<Product | null> {
  const db = await getDB();
  const record = await db.getFromIndex('products', 'by-barcode', barcode);
  return record ? fromRecord(record) : null;
}

export async function getProductBySkuAsync(sku: string): Promise<Product | null> {
  const db = await getDB();
  const record = await db.getFromIndex('products', 'by-sku', sku);
  return record ? fromRecord(record) : null;
}

// Synchronous wrappers for backward compatibility (using cached data)
let cachedProducts: Product[] = [];
let cacheInitialized = false;

async function ensureCache() {
  if (!cacheInitialized) {
    cachedProducts = await getProductsAsync();
    cacheInitialized = true;
  }
}

export function getProducts(): Product[] {
  // Start async load
  ensureCache();
  return cachedProducts;
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
  const newProduct: Product = {
    ...product,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  cachedProducts.push(newProduct);
  // Async save
  addProductAsync(product).then(p => {
    const idx = cachedProducts.findIndex(cp => cp.name === product.name && cp.sku === product.sku);
    if (idx !== -1) cachedProducts[idx] = p;
  });
  return newProduct;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const index = cachedProducts.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  cachedProducts[index] = {
    ...cachedProducts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  // Async save
  updateProductAsync(id, data);
  return cachedProducts[index];
}

export function deleteProduct(id: string): boolean {
  const filtered = cachedProducts.filter(p => p.id !== id);
  if (filtered.length === cachedProducts.length) return false;
  cachedProducts = filtered;
  // Async delete
  deleteProductAsync(id);
  return true;
}

export function updateStock(id: string, quantity: number): boolean {
  const index = cachedProducts.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  cachedProducts[index].stock += quantity;
  cachedProducts[index].updatedAt = new Date().toISOString();
  // Async save
  updateStockAsync(id, quantity);
  return true;
}

export function getProductByBarcode(barcode: string): Product | null {
  return cachedProducts.find(p => p.barcode === barcode) || null;
}

export function getProductBySku(sku: string): Product | null {
  return cachedProducts.find(p => p.sku === sku) || null;
}

// Initialize cache on module load
ensureCache();
