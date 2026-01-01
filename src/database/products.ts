import { Product } from '@/types/pos';
import { ProductRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';

const PRODUCTS_KEY = 'db_products';

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
    ca: toUnix(p.createdAt),
    ua: toUnix(p.updatedAt),
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

function getRecords(): ProductRecord[] {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveRecords(records: ProductRecord[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(records));
}

// Public API
export function getProducts(): Product[] {
  return getRecords().map(fromRecord);
}

export function saveProducts(products: Product[]): void {
  saveRecords(products.map(toRecord));
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const records = getRecords();
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
  records.push(newRecord);
  saveRecords(records);
  return fromRecord(newRecord);
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const records = getRecords();
  const index = records.findIndex(r => r.i === id);
  if (index === -1) return null;
  
  const updated: ProductRecord = {
    ...records[index],
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
  
  records[index] = updated;
  saveRecords(records);
  return fromRecord(updated);
}

export function deleteProduct(id: string): boolean {
  const records = getRecords();
  const filtered = records.filter(r => r.i !== id);
  if (filtered.length === records.length) return false;
  saveRecords(filtered);
  return true;
}

export function updateStock(id: string, quantity: number): boolean {
  const records = getRecords();
  const index = records.findIndex(r => r.i === id);
  if (index === -1) return false;
  
  records[index].st += quantity;
  records[index].ua = toUnix(new Date());
  saveRecords(records);
  return true;
}

export function getProductByBarcode(barcode: string): Product | null {
  const records = getRecords();
  const record = records.find(r => r.b === barcode);
  return record ? fromRecord(record) : null;
}

export function getProductBySku(sku: string): Product | null {
  const records = getRecords();
  const record = records.find(r => r.s === sku);
  return record ? fromRecord(record) : null;
}
