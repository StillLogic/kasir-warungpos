import { Supplier, Purchase, PurchaseItem } from '@/types/business';
import { SupplierRecord, PurchaseRecord, PurchaseItemRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { getDB } from './db';
import { updateStockAsync } from './products';

// Supplier functions
function supplierToRecord(supplier: Supplier): SupplierRecord {
  return {
    i: supplier.id,
    n: supplier.name,
    p: supplier.phone,
    a: supplier.address,
    ca: toUnix(new Date(supplier.createdAt)),
    ua: toUnix(new Date(supplier.updatedAt)),
  };
}

function supplierFromRecord(r: SupplierRecord): Supplier {
  return {
    id: r.i,
    name: r.n,
    phone: r.p,
    address: r.a,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  };
}

export async function getSuppliersAsync(): Promise<Supplier[]> {
  const db = await getDB();
  const records = await db.getAll('suppliers');
  return records.map(supplierFromRecord).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSupplierByIdAsync(id: string): Promise<Supplier | null> {
  const db = await getDB();
  const record = await db.get('suppliers', id);
  return record ? supplierFromRecord(record) : null;
}

export async function saveSupplierAsync(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
  const db = await getDB();
  const now = new Date().toISOString();
  
  const supplier: Supplier = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.put('suppliers', supplierToRecord(supplier));
  return supplier;
}

export async function updateSupplierAsync(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
  const db = await getDB();
  const existing = await db.get('suppliers', id);
  
  if (!existing) return null;

  const supplier = supplierFromRecord(existing);
  const updated: Supplier = {
    ...supplier,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  await db.put('suppliers', supplierToRecord(updated));
  return updated;
}

export async function deleteSupplierAsync(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('suppliers', id);
  return true;
}

// Purchase functions
function purchaseItemToRecord(item: PurchaseItem): PurchaseItemRecord {
  return {
    pi: item.productId,
    pn: item.productName,
    q: item.quantity,
    pp: item.pricePerUnit,
    sb: item.subtotal,
  };
}

function purchaseItemFromRecord(r: PurchaseItemRecord): PurchaseItem {
  return {
    productId: r.pi,
    productName: r.pn,
    quantity: r.q,
    pricePerUnit: r.pp,
    subtotal: r.sb,
  };
}

function purchaseToRecord(purchase: Purchase): PurchaseRecord {
  return {
    i: purchase.id,
    si: purchase.supplierId,
    sn: purchase.supplierName,
    it: purchase.items.map(purchaseItemToRecord),
    t: purchase.total,
    ca: toUnix(new Date(purchase.createdAt)),
    nt: purchase.notes,
  };
}

function purchaseFromRecord(r: PurchaseRecord): Purchase {
  return {
    id: r.i,
    supplierId: r.si,
    supplierName: r.sn,
    items: r.it.map(purchaseItemFromRecord),
    total: r.t,
    createdAt: fromUnix(r.ca),
    notes: r.nt,
  };
}

export async function getPurchasesAsync(): Promise<Purchase[]> {
  const db = await getDB();
  const records = await db.getAll('purchases');
  return records.map(purchaseFromRecord).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function savePurchaseAsync(
  data: Omit<Purchase, 'id' | 'createdAt'>,
  updateStock: boolean = true
): Promise<Purchase> {
  const db = await getDB();
  
  const purchase: Purchase = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  await db.put('purchases', purchaseToRecord(purchase));

  // Update stock for each item
  if (updateStock) {
    for (const item of purchase.items) {
      await updateStockAsync(item.productId, item.quantity);
    }
  }

  return purchase;
}

export async function getPurchasesBySupplierAsync(supplierId: string): Promise<Purchase[]> {
  const purchases = await getPurchasesAsync();
  return purchases.filter(p => p.supplierId === supplierId);
}
