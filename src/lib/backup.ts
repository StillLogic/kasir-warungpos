import { getDB } from "@/database/db";
import { ProductRecord, TransactionRecord } from "@/database/types";
import { gzip, gunzip } from "fflate";
import { encrypt, decrypt } from "./encryption";

export interface BackupData {
  version: number;
  createdAt: string;
  appVersion: string;
  data: {
    products: unknown[];
    transactions: unknown[];
    categories: unknown[];
    units: unknown[];
    customers: unknown[];
    debts: unknown[];
    debtPayments: unknown[];
    employees: unknown[];
    employeeEarnings: unknown[];
    employeeDebts: unknown[];
    employeeDebtPayments: unknown[];
    employeeSettlements: unknown[];
    shoppingCategories: unknown[];
    shoppingItems: unknown[];
    shoppingArchive: unknown[];
    shoppingLastCheckDate: string | null;
    markupRules: unknown[];
    storeSettings: unknown;
  };
}

const BACKUP_VERSION = 2;
const APP_VERSION = "1.1.0";

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

export async function exportBackup(): Promise<Blob> {
  const db = await getDB();

  const products = await db.getAll("products");
  const transactions = await db.getAll("transactions");

  const categories = JSON.parse(localStorage.getItem("db_categories") || "[]");
  const units = JSON.parse(localStorage.getItem("db_units") || "[]");

  const customers = JSON.parse(localStorage.getItem("db_customers") || "[]");
  const debts = JSON.parse(localStorage.getItem("db_debts") || "[]");
  const debtPayments = JSON.parse(
    localStorage.getItem("db_debt_payments") || "[]",
  );

  const employees = JSON.parse(localStorage.getItem("db_employees") || "[]");
  const employeeEarnings = JSON.parse(
    localStorage.getItem("db_employee_earnings") || "[]",
  );
  const employeeDebts = JSON.parse(
    localStorage.getItem("db_employee_debts") || "[]",
  );
  const employeeDebtPayments = JSON.parse(
    localStorage.getItem("db_employee_debt_payments") || "[]",
  );
  const employeeSettlements = JSON.parse(
    localStorage.getItem("db_employee_settlements") || "[]",
  );

  const shoppingCategories = JSON.parse(
    localStorage.getItem("db_shopping_categories") || "[]",
  );
  const shoppingItems = JSON.parse(
    localStorage.getItem("db_shopping_items") || "[]",
  );
  const shoppingArchive = JSON.parse(
    localStorage.getItem("db_shopping_archive") || "[]",
  );
  const shoppingLastCheckDate = localStorage.getItem(
    "db_shopping_last_check_date",
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
      units,
      customers,
      debts,
      debtPayments,
      employees,
      employeeEarnings,
      employeeDebts,
      employeeDebtPayments,
      employeeSettlements,
      shoppingCategories,
      shoppingItems,
      shoppingArchive,
      shoppingLastCheckDate,
      markupRules,
      storeSettings,
    },
  };

  const jsonString = JSON.stringify(backup);

  const compressed = await new Promise<Uint8Array>((resolve, reject) => {
    gzip(stringToUint8Array(jsonString), { level: 9 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const base64Compressed = uint8ArrayToBase64(compressed);
  const encrypted = encrypt(base64Compressed);

  return new Blob([encrypted], { type: "application/octet-stream" });
}

export async function downloadBackup(): Promise<void> {
  const blob = await exportBackup();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const date = new Date().toISOString().split("T")[0];
  link.download = `warungpos-backup-${date}.wbak`;
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

export async function importBackup(file: File): Promise<{
  success: boolean;
  message: string;
  itemCounts?: Record<string, number>;
}> {
  try {
    let data: BackupData;

    if (file.name.endsWith(".wbak")) {
      const encryptedText = await file.text();
      const decryptedBase64 = decrypt(encryptedText);
      const compressed = base64ToUint8Array(decryptedBase64);

      const decompressed = await new Promise<Uint8Array>((resolve, reject) => {
        gunzip(compressed, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const jsonString = uint8ArrayToString(decompressed);
      data = JSON.parse(jsonString);
    } else {
      const text = await file.text();
      data = JSON.parse(text);
    }

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

    if (data.data.units) {
      localStorage.setItem("db_units", JSON.stringify(data.data.units));
      itemCounts.units = (data.data.units as unknown[]).length;
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

    if (data.data.employees) {
      localStorage.setItem("db_employees", JSON.stringify(data.data.employees));
      itemCounts.employees = (data.data.employees as unknown[]).length;
    }

    if (data.data.employeeEarnings) {
      localStorage.setItem(
        "db_employee_earnings",
        JSON.stringify(data.data.employeeEarnings),
      );
      itemCounts.employeeEarnings = (
        data.data.employeeEarnings as unknown[]
      ).length;
    }

    if (data.data.employeeDebts) {
      localStorage.setItem(
        "db_employee_debts",
        JSON.stringify(data.data.employeeDebts),
      );
      itemCounts.employeeDebts = (data.data.employeeDebts as unknown[]).length;
    }

    if (data.data.employeeDebtPayments) {
      localStorage.setItem(
        "db_employee_debt_payments",
        JSON.stringify(data.data.employeeDebtPayments),
      );
      itemCounts.employeeDebtPayments = (
        data.data.employeeDebtPayments as unknown[]
      ).length;
    }

    if (data.data.employeeSettlements) {
      localStorage.setItem(
        "db_employee_settlements",
        JSON.stringify(data.data.employeeSettlements),
      );
      itemCounts.employeeSettlements = (
        data.data.employeeSettlements as unknown[]
      ).length;
    }

    if (data.data.shoppingCategories) {
      localStorage.setItem(
        "db_shopping_categories",
        JSON.stringify(data.data.shoppingCategories),
      );
      itemCounts.shoppingCategories = (
        data.data.shoppingCategories as unknown[]
      ).length;
    }

    if (data.data.shoppingItems) {
      localStorage.setItem(
        "db_shopping_items",
        JSON.stringify(data.data.shoppingItems),
      );
      itemCounts.shoppingItems = (data.data.shoppingItems as unknown[]).length;
    }

    if (data.data.shoppingArchive) {
      localStorage.setItem(
        "db_shopping_archive",
        JSON.stringify(data.data.shoppingArchive),
      );
      itemCounts.shoppingArchive = (
        data.data.shoppingArchive as unknown[]
      ).length;
    }

    if (data.data.shoppingLastCheckDate !== undefined) {
      if (data.data.shoppingLastCheckDate) {
        localStorage.setItem(
          "db_shopping_last_check_date",
          data.data.shoppingLastCheckDate as string,
        );
      } else {
        localStorage.removeItem("db_shopping_last_check_date");
      }
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
  units: number;
  customers: number;
  debts: number;
  employees: number;
  shoppingItems: number;
}> {
  const db = await getDB();

  const products = await db.count("products");
  const transactions = await db.count("transactions");
  const categories = (
    JSON.parse(localStorage.getItem("db_categories") || "[]") as unknown[]
  ).length;
  const units = (
    JSON.parse(localStorage.getItem("db_units") || "[]") as unknown[]
  ).length;
  const customers = (
    JSON.parse(localStorage.getItem("db_customers") || "[]") as unknown[]
  ).length;
  const debts = (
    JSON.parse(localStorage.getItem("db_debts") || "[]") as unknown[]
  ).length;
  const employees = (
    JSON.parse(localStorage.getItem("db_employees") || "[]") as unknown[]
  ).length;
  const shoppingItems = (
    JSON.parse(localStorage.getItem("db_shopping_items") || "[]") as unknown[]
  ).length;

  return {
    products,
    transactions,
    categories,
    units,
    customers,
    debts,
    employees,
    shoppingItems,
  };
}
