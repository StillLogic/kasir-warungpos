import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Product, ProductFormData } from "@/types/pos";
import { generateSKU, generateSKUWithExisting } from "@/lib/sku";
import { getCategoryNames, getCategories } from "@/database/categories";
import { getMarkupForPrice, calculateSellingPrices } from "@/database/markup";
import { getUnitNames } from "@/database/units";
import { toTitleCase } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySelect } from "@/components/CategorySelect";
import { UnitSelect } from "@/components/UnitSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Info, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface BulkProductInput {
  id: string;
  name: string;
  sku: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  wholesaleMinQty: string;
  stock: string;
  unit: string;
  hasWholesale: boolean;
}

const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  sku: z.string().min(1, "SKU wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  costPrice: z.number().min(0, "Harga tidak boleh negatif"),
  retailPrice: z.number().min(0, "Harga tidak boleh negatif"),
  wholesalePrice: z.number().min(0, "Harga tidak boleh negatif"),
  wholesaleMinQty: z.number().min(1, "Minimal 1"),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
  unit: z.string().min(1, "Satuan wajib diisi"),
});

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  onSubmitBulk?: (data: ProductFormData[]) => void;
  product?: Product | null;
}

export function ProductForm({
  open,
  onClose,
  onSubmit,
  onSubmitBulk,
  product,
}: ProductFormProps) {
  const isEditing = !!product;
  const [markupInfo, setMarkupInfo] = useState<{
    retail: number;
    wholesale: number;
    type?: "percent" | "fixed";
  } | null>(null);

  const [costPriceStr, setCostPriceStr] = useState("");
  const [retailPriceStr, setRetailPriceStr] = useState("");
  const [wholesalePriceStr, setWholesalePriceStr] = useState("");
  const [editHasWholesale, setEditHasWholesale] = useState(false);
  
  // Bulk add state
  const [bulkProducts, setBulkProducts] = useState<BulkProductInput[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  
  const [categories, setCategories] = useState<string[]>(() => getCategoryNames());
  const [units, setUnits] = useState<string[]>(() => getUnitNames());

  const refreshCategories = useCallback(() => {
    setCategories(getCategoryNames());
  }, []);

  const refreshUnits = useCallback(() => {
    setUnits(getUnitNames());
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: "",
      sku: "",
      category: "Lainnya",
      costPrice: 0,
      retailPrice: 0,
      wholesalePrice: 0,
      wholesaleMinQty: 10,
      stock: 0,
      unit: units[0] || "Pcs",
    },
  });

  const category = watch("category");
  const costPrice = watch("costPrice");

  // Initialize bulk products when dialog opens for adding (only on open, not on units/categories refresh)
  useEffect(() => {
    if (open && !isEditing) {
      const defaultCategory = categories[0] || "Lainnya";
      const defaultUnit = units[0] || "Pcs";
      setBulkCategory(defaultCategory);

      const sku = generateSKUWithExisting(defaultCategory, []);
      setBulkProducts([
        {
          id: crypto.randomUUID(),
          name: "",
          sku,
          costPrice: "",
          retailPrice: "",
          wholesalePrice: "",
          wholesaleMinQty: "10",
          stock: "",
          unit: defaultUnit,
          hasWholesale: false,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditing]);

  // Edit mode: reset form with product data
  useEffect(() => {
    if (open && product) {
      reset({
        name: product.name,
        sku: product.sku,
        category: product.category,
        costPrice: product.costPrice,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinQty: product.wholesaleMinQty,
        stock: product.stock,
        unit: product.unit,
      });
      setEditHasWholesale(product.wholesalePrice > 0);
    }
  }, [open, product, reset]);

  useEffect(() => {
    if (open) {
      if (product) {
        setCostPriceStr(product.costPrice > 0 ? String(product.costPrice) : "");
        setRetailPriceStr(product.retailPrice > 0 ? String(product.retailPrice) : "");
        setWholesalePriceStr(product.wholesalePrice > 0 ? String(product.wholesalePrice) : "");
      } else {
        setCostPriceStr("");
        setRetailPriceStr("");
        setWholesalePriceStr("");
      }
    }
  }, [open, product]);

  useEffect(() => {
    setValue("costPrice", parseInt(costPriceStr) || 0);
  }, [costPriceStr, setValue]);

  useEffect(() => {
    setValue("retailPrice", parseInt(retailPriceStr) || 0);
  }, [retailPriceStr, setValue]);

  useEffect(() => {
    setValue("wholesalePrice", parseInt(wholesalePriceStr) || 0);
  }, [wholesalePriceStr, setValue]);

  useEffect(() => {
    if (!isEditing && open) {
      const newSku = generateSKU(category);
      setValue("sku", newSku);
    }
  }, [category, isEditing, open, setValue]);

  useEffect(() => {
    if (costPrice > 0 && category) {
      const allCategories = getCategories();
      const catData = allCategories.find((c) => c.name === category);
      const categoryId = catData?.id || null;

      const markup = getMarkupForPrice(costPrice, categoryId);
      if (markup) {
        if (markup.type === "fixed") {
          setMarkupInfo({ retail: markup.retailFixed, wholesale: markup.wholesaleFixed, type: "fixed" });
        } else {
          setMarkupInfo({ retail: markup.retailPercent, wholesale: markup.wholesalePercent, type: "percent" });
        }
        const prices = calculateSellingPrices(costPrice, categoryId);
        if (prices) {
          setRetailPriceStr(String(prices.retailPrice));
          setWholesalePriceStr(String(prices.wholesalePrice));
        }
      } else {
        setMarkupInfo(null);
      }
    } else {
      setMarkupInfo(null);
    }
  }, [costPrice, category]);

  const handleFormSubmit = (data: ProductFormData) => {
    if (!editHasWholesale) {
      data.wholesalePrice = 0;
      data.wholesaleMinQty = 10;
    }
    onSubmit(data);
    reset();
    setCostPriceStr("");
    setRetailPriceStr("");
    setWholesalePriceStr("");
    onClose();
  };

  const handleClose = () => {
    reset();
    setMarkupInfo(null);
    setCostPriceStr("");
    setRetailPriceStr("");
    setWholesalePriceStr("");
    onClose();
  };

  // Regenerate all SKUs when bulk category changes
  const updateBulkCategorySKUs = (newCategory: string) => {
    setBulkCategory(newCategory);
    setBulkProducts((prev) => {
      const newProducts: BulkProductInput[] = [];
      const existingSKUs: string[] = [];
      for (const p of prev) {
        const sku = generateSKUWithExisting(newCategory, existingSKUs);
        existingSKUs.push(sku);
        newProducts.push({ ...p, sku });
      }
      return newProducts;
    });
  };

  const addBulkProductRow = () => {
    const defaultUnit = units[0] || "Pcs";
    const existingSKUs = bulkProducts.map((p) => p.sku);
    const newSKU = generateSKUWithExisting(bulkCategory, existingSKUs);

    setBulkProducts([
      ...bulkProducts,
      {
        id: crypto.randomUUID(),
        name: "",
        sku: newSKU,
        costPrice: "",
        retailPrice: "",
        wholesalePrice: "",
        wholesaleMinQty: "10",
        stock: "",
        unit: defaultUnit,
        hasWholesale: false,
      },
    ]);
  };

  const removeBulkProductRow = (id: string) => {
    if (bulkProducts.length <= 1) return;
    setBulkProducts(bulkProducts.filter((p) => p.id !== id));
  };

  const updateBulkProduct = (
    id: string,
    field: keyof BulkProductInput,
    value: string | boolean,
  ) => {
    setBulkProducts(
      bulkProducts.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };

          if (field === "costPrice") {
            const cost = parseInt(value as string) || 0;
            if (cost > 0) {
              const allCategories = getCategories();
              const catData = allCategories.find((c) => c.name === bulkCategory);
              const categoryId = catData?.id || null;
              const prices = calculateSellingPrices(cost, categoryId);
              if (prices) {
                updated.retailPrice = String(prices.retailPrice);
                updated.wholesalePrice = String(prices.wholesalePrice);
              }
            }
          }

          return updated;
        }
        return p;
      }),
    );
  };

  const getBulkProductMarkupInfo = (product: BulkProductInput) => {
    const cost = parseInt(product.costPrice) || 0;
    if (cost > 0 && bulkCategory) {
      const allCategories = getCategories();
      const catData = allCategories.find((c) => c.name === bulkCategory);
      const categoryId = catData?.id || null;
      const markup = getMarkupForPrice(cost, categoryId);
      if (markup) {
        if (markup.type === "fixed") {
          return { retail: markup.retailFixed, wholesale: markup.wholesaleFixed, type: "fixed" as const };
        } else {
          return { retail: markup.retailPercent, wholesale: markup.wholesalePercent, type: "percent" as const };
        }
      }
    }
    return null;
  };

  const validBulkCount = bulkProducts.filter((p) => p.name.trim() && (parseInt(p.retailPrice) > 0)).length;

  const handleBulkSubmit = () => {
    const validProducts = bulkProducts.filter(
      (p) => p.name.trim() && (parseInt(p.retailPrice) > 0),
    );

    if (validProducts.length === 0) return;

    const productsData: ProductFormData[] = validProducts.map((p) => ({
      name: p.name.trim(),
      sku: p.sku,
      category: bulkCategory,
      costPrice: parseInt(p.costPrice) || 0,
      retailPrice: parseInt(p.retailPrice) || 0,
      wholesalePrice: p.hasWholesale ? (parseInt(p.wholesalePrice) || 0) : 0,
      wholesaleMinQty: p.hasWholesale ? (parseInt(p.wholesaleMinQty) || 10) : 10,
      stock: parseInt(p.stock) || 0,
      unit: p.unit,
    }));

    if (onSubmitBulk) {
      onSubmitBulk(productsData);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>

        {isEditing && (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Masukkan nama produk"
                onChange={(e) => setValue("name", toTitleCase(e.target.value))}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <CategorySelect
                  value={watch("category")}
                  categories={categories}
                  onValueChange={(value) => setValue("category", value)}
                  onCategoriesChanged={refreshCategories}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Kode</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="Auto-generate"
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Harga Modal (Opsional)
              </Label>
              <PriceInput
                id="costPrice"
                value={costPriceStr}
                onChange={setCostPriceStr}
                placeholder="0"
              />
              {markupInfo && (
                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md text-xs">
                  <Info className="h-3.5 w-3.5 mt-0.5 text-primary" />
                  <span className="text-muted-foreground">
                    {markupInfo.type === "fixed"
                      ? `Markup otomatis: Eceran +${formatCurrency(markupInfo.retail)}, Grosir +${formatCurrency(markupInfo.wholesale)}`
                      : `Markup otomatis: Eceran +${markupInfo.retail}%, Grosir +${markupInfo.wholesale}%`}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="retailPrice">Harga Satuan</Label>
              <PriceInput
                id="retailPrice"
                value={retailPriceStr}
                onChange={setRetailPriceStr}
                placeholder="0"
              />
              {costPrice > 0 && watch("retailPrice") > 0 && (
                <p className="text-xs text-muted-foreground">
                  Margin: {formatCurrency(watch("retailPrice") - costPrice)}
                </p>
              )}
              {errors.retailPrice && (
                <p className="text-sm text-destructive">{errors.retailPrice.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="editHasWholesale"
                checked={editHasWholesale}
                onCheckedChange={(checked) => setEditHasWholesale(!!checked)}
              />
              <Label htmlFor="editHasWholesale" className="cursor-pointer text-sm">
                Harga Grosir
              </Label>
            </div>

            {editHasWholesale && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Harga Grosir</Label>
                  <PriceInput
                    id="wholesalePrice"
                    value={wholesalePriceStr}
                    onChange={setWholesalePriceStr}
                    placeholder="0"
                  />
                  {costPrice > 0 && watch("wholesalePrice") > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Margin: {formatCurrency(watch("wholesalePrice") - costPrice)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesaleMinQty">Min. Qty Grosir</Label>
                  <Input
                    id="wholesaleMinQty"
                    type="number"
                    {...register("wholesaleMinQty", { valueAsNumber: true })}
                    placeholder="10"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Satuan</Label>
                <UnitSelect
                  value={watch("unit")}
                  units={units}
                  onValueChange={(value) => setValue("unit", value)}
                  onUnitsChanged={refreshUnits}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register("stock", { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-sm text-destructive">{errors.stock.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Batal
              </Button>
              <Button type="submit" className="flex-1">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}

        {!isEditing && (
          <div className="space-y-4">
            {/* Top-level category selection */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
              <Label className="text-sm font-medium">Kategori Produk</Label>
              <CategorySelect
                value={bulkCategory}
                categories={categories}
                onValueChange={updateBulkCategorySKUs}
                onCategoriesChanged={refreshCategories}
              />
            </div>

            {bulkProducts.map((product, index) => {
              const markupInfo = getBulkProductMarkupInfo(product);
              const costPrice = parseInt(product.costPrice) || 0;
              const retailPrice = parseInt(product.retailPrice) || 0;
              const wholesalePrice = parseInt(product.wholesalePrice) || 0;

              return (
                <div key={product.id} className="p-3 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Produk {index + 1}
                    </span>
                    {bulkProducts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeBulkProductRow(product.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Nama Produk *</Label>
                      <Input
                        placeholder="Nama produk"
                        value={product.name}
                        onChange={(e) =>
                          updateBulkProduct(product.id, "name", toTitleCase(e.target.value))
                        }
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">SKU / Kode</Label>
                      <Input
                        placeholder="Auto"
                        value={product.sku}
                        readOnly
                        className="bg-muted cursor-not-allowed text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Satuan</Label>
                      <UnitSelect
                        value={product.unit}
                        units={units}
                        onValueChange={(v) => updateBulkProduct(product.id, "unit", v)}
                        onUnitsChanged={refreshUnits}
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Calculator className="h-3 w-3" />
                        Harga Modal (Opsional)
                      </Label>
                      <PriceInput
                        placeholder="0"
                        value={product.costPrice}
                        onChange={(v) => updateBulkProduct(product.id, "costPrice", v)}
                      />
                      {markupInfo && (
                        <div className="flex items-start gap-1 text-[10px] text-muted-foreground">
                          <Info className="h-2.5 w-2.5 mt-0.5 text-primary flex-shrink-0" />
                          <span>
                            {markupInfo.type === "fixed"
                              ? `Markup: Eceran +${formatCurrency(markupInfo.retail)}, Grosir +${formatCurrency(markupInfo.wholesale)}`
                              : `Markup: Eceran +${markupInfo.retail}%, Grosir +${markupInfo.wholesale}%`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Harga Satuan *</Label>
                      <PriceInput
                        placeholder="0"
                        value={product.retailPrice}
                        onChange={(v) => updateBulkProduct(product.id, "retailPrice", v)}
                      />
                      {costPrice > 0 && retailPrice > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Margin: {formatCurrency(retailPrice - costPrice)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Stok</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={product.stock}
                        onChange={(e) => updateBulkProduct(product.id, "stock", e.target.value)}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`wholesale-${product.id}`}
                          checked={product.hasWholesale}
                          onCheckedChange={(checked) =>
                            updateBulkProduct(product.id, "hasWholesale", !!checked)
                          }
                        />
                        <Label htmlFor={`wholesale-${product.id}`} className="cursor-pointer text-xs">
                          Harga Grosir
                        </Label>
                      </div>

                      {product.hasWholesale && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Harga Grosir</Label>
                            <PriceInput
                              placeholder="0"
                              value={product.wholesalePrice}
                              onChange={(v) => updateBulkProduct(product.id, "wholesalePrice", v)}
                            />
                            {costPrice > 0 && wholesalePrice > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                Margin: {formatCurrency(wholesalePrice - costPrice)}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Min Qty Grosir</Label>
                            <Input
                              type="number"
                              min={1}
                              placeholder="10"
                              value={product.wholesaleMinQty}
                              onChange={(e) =>
                                updateBulkProduct(product.id, "wholesaleMinQty", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={addBulkProductRow}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris
            </Button>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleBulkSubmit}
                disabled={validBulkCount === 0}
              >
                Simpan {validBulkCount} Produk
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
