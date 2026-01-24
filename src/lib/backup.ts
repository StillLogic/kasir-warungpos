import { getDB } from "@/database/db";
import { ProductRecord, TransactionRecord } from "@/database/types";

export interface BackupData {
  version: number;
  createdAt: string;
  appVersion: string;
  data: {
    products: unknown[];
    transactions: unknown[];
    categories: unknown[];
    customers: unknown[];
    debts: unknown[];
    debtPayments: unknown[];
    markupRules: unknown[];
    storeSettings: unknown;
  };
}

const BACKUP_VERSION = 1;
const APP_VERSION = "1.0.0";

export async function exportBackup(): Promise<Blob> {
  const db = await getDB();

  const products = await db.getAll("products");
  const transactions = await db.getAll("transactions");

  const categories = JSON.parse(localStorage.getItem("db_categories") || "[]");
  const customers = JSON.parse(localStorage.getItem("db_customers") || "[]");
  const debts = JSON.parse(localStorage.getItem("db_debts") || "[]");
  const debtPayments = JSON.parse(
    localStorage.getItem("db_debt_payments") || "[]",
  );
  const markupRules = JSON.parse(
    localStorage.getItem("warungpos_markup_rules") || "[]",
  );
  const storeSettings = JSON.parse(
    localStorage.getItem("store-settings") || "{}",
  );

  const backup: BackupData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    data: {
      products,
      transactions,
      categories,
      customers,
      debts,
      debtPayments,
      markupRules,
      storeSettings,
    },
  };

  const jsonString = JSON.stringify(backup, null, 2);
  return new Blob([jsonString], { type: "application/json" });
}

export async function downloadBackup(): Promise<void> {
  const blob = await exportBackup();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const date = new Date().toISOString().split("T")[0];
  link.download = `warungpos-backup-${date}.json`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;

  const backup = data as BackupData;

  if (typeof backup.version !== "number") return false;
  if (typeof backup.createdAt !== "string") return false;
  if (!backup.data || typeof backup.data !== "object") return false;

  const requiredProps = ["products", "transactions"];
  for (const prop of requiredProps) {
    if (!Array.isArray(backup.data[prop as keyof typeof backup.data])) {
      return false;
    }
  }

  return true;
}

export async function importBackup(
  file: File,
): Promise<{
  success: boolean;
  message: string;
  itemCounts?: Record<string, number>;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!validateBackup(data)) {
      return { success: false, message: "Format file backup tidak valid" };
    }

    const db = await getDB();
    const itemCounts: Record<string, number> = {};

    const productsTx = db.transaction("products", "readwrite");
    await productsTx.store.clear();
    for (const product of data.data.products as ProductRecord[]) {
      await productsTx.store.put(product);
    }
    await productsTx.done;
    itemCounts.products = (data.data.products as ProductRecord[]).length;

    const txsTx = db.transaction("transactions", "readwrite");
    await txsTx.store.clear();
    for (const transaction of data.data.transactions as TransactionRecord[]) {
      await txsTx.store.put(transaction);
    }
    await txsTx.done;
    itemCounts.transactions = (
      data.data.transactions as TransactionRecord[]
    ).length;

    if (data.data.categories) {
      localStorage.setItem(
        "db_categories",
        JSON.stringify(data.data.categories),
      );
      itemCounts.categories = (data.data.categories as unknown[]).length;
    }

    if (data.data.customers) {
      localStorage.setItem("db_customers", JSON.stringify(data.data.customers));
      itemCounts.customers = (data.data.customers as unknown[]).length;
    }

    if (data.data.debts) {
      localStorage.setItem("db_debts", JSON.stringify(data.data.debts));
      itemCounts.debts = (data.data.debts as unknown[]).length;
    }

    if (data.data.debtPayments) {
      localStorage.setItem(
        "db_debt_payments",
        JSON.stringify(data.data.debtPayments),
      );
      itemCounts.debtPayments = (data.data.debtPayments as unknown[]).length;
    }

    if (data.data.markupRules) {
      localStorage.setItem(
        "warungpos_markup_rules",
        JSON.stringify(data.data.markupRules),
      );
      itemCounts.markupRules = (data.data.markupRules as unknown[]).length;
    }

    if (
      data.data.storeSettings &&
      Object.keys(data.data.storeSettings as object).length > 0
    ) {
      localStorage.setItem(
        "store-settings",
        JSON.stringify(data.data.storeSettings),
      );
    }

    return {
      success: true,
      message: "Data berhasil dipulihkan",
      itemCounts,
    };
  } catch {
    return { success: false, message: "Gagal membaca file backup" };
  }
}

export async function getStorageStats(): Promise<{
  products: number;
  transactions: number;
  categories: number;
  customers: number;
  debts: number;
}> {
  const db = await getDB();

  const products = await db.count("products");
  const transactions = await db.count("transactions");
  const categories = (
    JSON.parse(localStorage.getItem("db_categories") || "[]") as unknown[]
  ).length;
  const customers = (
    JSON.parse(localStorage.getItem("db_customers") || "[]") as unknown[]
  ).length;
  const debts = (
    JSON.parse(localStorage.getItem("db_debts") || "[]") as unknown[]
  ).length;

  return { products, transactions, categories, customers, debts };
}
