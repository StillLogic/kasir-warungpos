import { Unit } from "@/types/unit";

const STORAGE_KEY = "db_units";

const DEFAULT_UNITS: string[] = [
  "Pcs",
  "Lusin",
  "Pack",
  "Dus",
  "Karung",
  "Kg",
  "Gram",
  "Liter",
  "Ml",
  "Botol",
  "Bungkus",
  "Sachet",
  "Renteng",
  "Slop",
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function initUnits(): Unit[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const now = Date.now();
  const units: Unit[] = DEFAULT_UNITS.map((name, idx) => ({
    id: generateId(),
    name,
    createdAt: now + idx,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  return units;
}

export function getUnits(): Unit[] {
  return initUnits().sort((a, b) => a.createdAt - b.createdAt);
}

export function getUnitNames(): string[] {
  return getUnits().map((u) => u.name);
}

export function addUnit(name: string): Unit | null {
  const units = getUnits();

  if (units.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
    return null;
  }

  const newUnit: Unit = {
    id: generateId(),
    name: name.trim(),
    createdAt: Date.now(),
  };

  units.push(newUnit);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  return newUnit;
}

export function updateUnit(id: string, name: string): Unit | null {
  const units = getUnits();
  const index = units.findIndex((u) => u.id === id);

  if (index === -1) return null;

  if (
    units.some(
      (u) => u.id !== id && u.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return null;
  }

  units[index] = {
    ...units[index],
    name: name.trim(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
  return units[index];
}

export function deleteUnit(id: string): boolean {
  const units = getUnits();
  const filtered = units.filter((u) => u.id !== id);

  if (filtered.length === units.length) return false;
  if (filtered.length === 0) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function isUnitInUse(unitName: string): boolean {
  // Check in products
  const products = JSON.parse(localStorage.getItem("db_products") || "[]");
  if (products.some((p: { u: string }) => p.u === unitName)) {
    return true;
  }

  // Check in shopping items
  const shoppingItems = JSON.parse(
    localStorage.getItem("db_shopping_items") || "[]",
  );
  if (shoppingItems.some((i: { unit: string }) => i.unit === unitName)) {
    return true;
  }

  return false;
}
