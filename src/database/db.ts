import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ProductRecord, TransactionRecord } from "./types";

interface EmployeeRecord {
  i: string;
  n: string;
  p: string;
  ph?: string;
  ca: number;
  ua: number;
}

interface IncomeRecord {
  i: string;
  ei: string;
  en: string;
  d: number;
  t: string;
  desc?: string;
  a: number;
  ip: 0 | 1;
  pa?: number;
  ca: number;
  ua: number;
}

interface DebtRecord {
  i: string;
  ei: string;
  en: string;
  d: number;
  desc: string;
  a: number;
  ip: 0 | 1;
  pa?: number;
  pm?: string;
  ca: number;
  ua: number;
}

interface WarungPOSDB extends DBSchema {
  products: {
    key: string;
    value: ProductRecord;
    indexes: { "by-sku": string };
  };
  transactions: {
    key: string;
    value: TransactionRecord;
    indexes: { "by-date": number };
  };
  employees: {
    key: string;
    value: EmployeeRecord;
  };
  employeeIncomes: {
    key: string;
    value: IncomeRecord;
    indexes: { "by-employee": string };
  };
  employeeDebts: {
    key: string;
    value: DebtRecord;
    indexes: { "by-employee": string };
  };
}

const DB_NAME = "warungpos-db";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<WarungPOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<WarungPOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WarungPOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains("products")) {
        const productStore = db.createObjectStore("products", { keyPath: "i" });
        productStore.createIndex("by-sku", "s");
      }

      if (!db.objectStoreNames.contains("transactions")) {
        const txStore = db.createObjectStore("transactions", { keyPath: "i" });
        txStore.createIndex("by-date", "ca");
      }

      // Version 2: Add employee stores
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("employees")) {
          db.createObjectStore("employees", { keyPath: "i" });
        }

        if (!db.objectStoreNames.contains("employeeIncomes")) {
          const incomeStore = db.createObjectStore("employeeIncomes", { keyPath: "i" });
          incomeStore.createIndex("by-employee", "ei");
        }

        if (!db.objectStoreNames.contains("employeeDebts")) {
          const debtStore = db.createObjectStore("employeeDebts", { keyPath: "i" });
          debtStore.createIndex("by-employee", "ei");
        }
      }
    },
  });

  return dbInstance;
}

export async function migrateFromLocalStorage(): Promise<void> {
  const db = await getDB();

  const oldProducts = localStorage.getItem("db_products");
  if (oldProducts) {
    const products: ProductRecord[] = JSON.parse(oldProducts);
    const tx = db.transaction("products", "readwrite");
    for (const product of products) {
      await tx.store.put(product);
    }
    await tx.done;
    localStorage.removeItem("db_products");
  }

  const legacyProducts = localStorage.getItem("pos_products");
  if (legacyProducts) {
    localStorage.removeItem("pos_products");
  }

  const oldTransactions = localStorage.getItem("db_transactions");
  if (oldTransactions) {
    const transactions: TransactionRecord[] = JSON.parse(oldTransactions);
    const tx = db.transaction("transactions", "readwrite");
    for (const transaction of transactions) {
      await tx.store.put(transaction);
    }
    await tx.done;
    localStorage.removeItem("db_transactions");
  }

  const legacyTransactions = localStorage.getItem("pos_transactions");
  if (legacyTransactions) {
    localStorage.removeItem("pos_transactions");
  }
}
