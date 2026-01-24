import { getCategoryNames } from "@/database/categories";

export interface CSVProduct {
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  stock: number;
  unit: string;
}

const UNITS = ["pcs", "kg", "liter", "pack", "dus", "sachet"];

export function generateCSVTemplate(): string {
  const headers = [
    "name",
    "sku",
    "category",
    "costPrice",
    "retailPrice",
    "wholesalePrice",
    "wholesaleMinQty",
    "stock",
    "unit",
  ];
  const exampleRows = [
    [
      "Indomie Goreng",
      "MKN0001",
      "Makanan",
      "2500",
      "3500",
      "3200",
      "12",
      "100",
      "pcs",
    ],
    [
      "Teh Botol Sosro",
      "MNM0001",
      "Minuman",
      "3500",
      "5000",
      "4500",
      "24",
      "50",
      "pcs",
    ],
    [
      "Beras Premium 5kg",
      "SMB0001",
      "Sembako",
      "60000",
      "75000",
      "70000",
      "10",
      "20",
      "pcs",
    ],
  ];

  const csvContent = [
    headers.join(","),
    ...exampleRows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

export function parseCSV(content: string): {
  products: CSVProduct[];
  errors: string[];
} {
  const lines = content.trim().split("\n");
  const products: CSVProduct[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    errors.push("File CSV harus memiliki header dan minimal 1 baris data");
    return { products, errors };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredHeaders = [
    "name",
    "sku",
    "category",
    "retailprice",
    "stock",
    "unit",
  ];

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      errors.push(`Header "${required}" tidak ditemukan`);
    }
  }

  if (errors.length > 0) {
    return { products, errors };
  }

  const nameIdx = headers.indexOf("name");
  const skuIdx = headers.indexOf("sku");
  const categoryIdx = headers.indexOf("category");
  const costPriceIdx = headers.indexOf("costprice");
  const retailPriceIdx = headers.indexOf("retailprice");
  const wholesalePriceIdx = headers.indexOf("wholesaleprice");
  const wholesaleMinQtyIdx = headers.indexOf("wholesaleminqty");
  const stockIdx = headers.indexOf("stock");
  const unitIdx = headers.indexOf("unit");

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const rowNum = i + 1;

    const name = values[nameIdx]?.trim();
    const sku = values[skuIdx]?.trim();
    const category = values[categoryIdx]?.trim();
    const retailPriceStr = values[retailPriceIdx]?.trim();
    const stockStr = values[stockIdx]?.trim();
    const unit = values[unitIdx]?.trim();

    if (!name) {
      errors.push(`Baris ${rowNum}: Nama produk wajib diisi`);
      continue;
    }

    if (!sku) {
      errors.push(`Baris ${rowNum}: SKU wajib diisi`);
      continue;
    }

    const validCategories = getCategoryNames();
    if (!category || !validCategories.includes(category)) {
      errors.push(
        `Baris ${rowNum}: Kategori tidak valid (gunakan: ${validCategories.join(", ")})`,
      );
      continue;
    }

    const retailPrice = parseFloat(retailPriceStr || "0");
    if (isNaN(retailPrice) || retailPrice < 0) {
      errors.push(`Baris ${rowNum}: Harga satuan tidak valid`);
      continue;
    }

    const stock = parseInt(stockStr || "0");
    if (isNaN(stock) || stock < 0) {
      errors.push(`Baris ${rowNum}: Stok tidak valid`);
      continue;
    }

    if (!unit || !UNITS.includes(unit)) {
      errors.push(
        `Baris ${rowNum}: Satuan tidak valid (gunakan: ${UNITS.join(", ")})`,
      );
      continue;
    }

    const costPrice = parseFloat(values[costPriceIdx]?.trim() || "0") || 0;
    const wholesalePrice =
      parseFloat(values[wholesalePriceIdx]?.trim() || "0") || 0;
    const wholesaleMinQty =
      parseInt(values[wholesaleMinQtyIdx]?.trim() || "0") || 0;

    products.push({
      name,
      sku,
      category,
      costPrice,
      retailPrice,
      wholesalePrice,
      wholesaleMinQty,
      stock,
      unit,
    });
  }

  return { products, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
