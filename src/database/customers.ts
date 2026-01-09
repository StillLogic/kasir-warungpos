import { Customer } from '@/types/business';
import { CustomerRecord } from './types';
import { generateId, toUnix, fromUnix } from './utils';
import { getDB } from './db';

function toRecord(customer: Customer): CustomerRecord {
  return {
    i: customer.id,
    n: customer.name,
    p: customer.phone,
    a: customer.address,
    d: customer.debt,
    ca: toUnix(new Date(customer.createdAt)),
    ua: toUnix(new Date(customer.updatedAt)),
  };
}

function fromRecord(r: CustomerRecord): Customer {
  return {
    id: r.i,
    name: r.n,
    phone: r.p,
    address: r.a,
    debt: r.d,
    createdAt: fromUnix(r.ca),
    updatedAt: fromUnix(r.ua),
  };
}

export async function getCustomersAsync(): Promise<Customer[]> {
  const db = await getDB();
  const records = await db.getAll('customers');
  return records.map(fromRecord).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomerByIdAsync(id: string): Promise<Customer | null> {
  const db = await getDB();
  const record = await db.get('customers', id);
  return record ? fromRecord(record) : null;
}

export async function saveCustomerAsync(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const db = await getDB();
  const now = new Date().toISOString();
  
  const customer: Customer = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.put('customers', toRecord(customer));
  return customer;
}

export async function updateCustomerAsync(id: string, data: Partial<Customer>): Promise<Customer | null> {
  const db = await getDB();
  const existing = await db.get('customers', id);
  
  if (!existing) return null;

  const customer = fromRecord(existing);
  const updated: Customer = {
    ...customer,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  await db.put('customers', toRecord(updated));
  return updated;
}

export async function deleteCustomerAsync(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete('customers', id);
  return true;
}

export async function updateCustomerDebtAsync(id: string, amount: number): Promise<Customer | null> {
  const customer = await getCustomerByIdAsync(id);
  if (!customer) return null;
  
  return updateCustomerAsync(id, {
    debt: customer.debt + amount,
  });
}
