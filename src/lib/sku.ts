import { getProducts, getCategoryPrefixes } from "@/database";

export function generateSKU(category: string): string {
  const categoryPrefixes = getCategoryPrefixes();
  const prefix = categoryPrefixes[category] || "PRD";
  const products = getProducts();

  const existingSkus = products
    .filter((p) => p.sku.startsWith(prefix))
    .map((p) => {
      const num = parseInt(p.sku.replace(prefix, ""), 10);
      return isNaN(num) ? 0 : num;
    });

  const maxNum = existingSkus.length > 0 ? Math.max(...existingSkus) : 0;
  const nextNum = (maxNum + 1).toString().padStart(4, "0");

  return `${prefix}${nextNum}`;
}

export function generateSKUWithExisting(
  category: string,
  existingSKUs: string[],
): string {
  const categoryPrefixes = getCategoryPrefixes();
  const prefix = categoryPrefixes[category] || "PRD";
  const products = getProducts();

  const allSkus = [
    ...products.filter((p) => p.sku.startsWith(prefix)).map((p) => p.sku),
    ...existingSKUs.filter((sku) => sku.startsWith(prefix)),
  ];

  const existingNums = allSkus.map((sku) => {
    const num = parseInt(sku.replace(prefix, ""), 10);
    return isNaN(num) ? 0 : num;
  });

  const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
  const nextNum = (maxNum + 1).toString().padStart(4, "0");

  return `${prefix}${nextNum}`;
}
