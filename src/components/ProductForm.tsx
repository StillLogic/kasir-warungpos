import { useEffect, useState, useMemo } from "react";
import { Product, ProductFormData } from "@/types/pos";
import { generateSKU } from "@/lib/sku";
import { getCategoryNames, getCategories } from "@/database/categories";
import { getMarkupForPrice, calculateSellingPrices } from "@/database/markup";
import { getUnitNames } from "@/database/units";
import { toTitleCase } from "@/lib/text";
import { handleTitleCaseChange } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

// ---- Edit mode: single product form (react-hook-form) ----
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  product?: Product | null;
}

// ---- Bulk row type ----
interface BulkRow {
  id: string;
  name: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  stock: string;
}

function createEmptyRow(): BulkRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    costPrice: "",
    retailPrice: "",
    wholesalePrice: "",
    stock: "",
  };
}

export function ProductForm({ open, onClose, onSubmit, product }: ProductFormProps) {
  const isEditing = !!product;
  const { toast } = useToast();
  const categories = useMemo(() => getCategoryNames(), []);
  const units = useMemo(() => getUnitNames(), []);

  // ---- Shared fields for add mode ----
  const [category, setCategory] = useState(categories[0] || "Lainnya");
  const [unit, setUnit] = useState(units[0] || "Pcs");
  const [wholesaleMinQty, setWholesaleMinQty] = useState("10");
  const [rows, setRows] = useState<BulkRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);

  // ---- Edit mode state ----
  const [markupInfo, setMarkupInfo] = useState<{
    retail: number;
    wholesale: number;
    type?: "percent" | "fixed";
  } | null>(null);
  const [costPriceStr, setCostPriceStr] = useState("");
  const [retailPriceStr, setRetailPriceStr] = useState("");
  const [wholesalePriceStr, setWholesalePriceStr] = useState("");

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

  const editCategory = watch("category");
  const editCostPrice = watch("costPrice");

  // ---- Edit mode effects ----
  useEffect(() => {
    if (open && product) {
      setCostPriceStr(product.costPrice > 0 ? String(product.costPrice) : "");
      setRetailPriceStr(product.retailPrice > 0 ? String(product.retailPrice) : "");
      setWholesalePriceStr(product.wholesalePrice > 0 ? String(product.wholesalePrice) : "");
    }
  }, [open, product]);

  useEffect(() => {
    if (isEditing) setValue("costPrice", parseInt(costPriceStr) || 0);
  }, [costPriceStr, setValue, isEditing]);

  useEffect(() => {
    if (isEditing) setValue("retailPrice", parseInt(retailPriceStr) || 0);
  }, [retailPriceStr, setValue, isEditing]);

  useEffect(() => {
    if (isEditing) setValue("wholesalePrice", parseInt(wholesalePriceStr) || 0);
  }, [wholesalePriceStr, setValue, isEditing]);

  useEffect(() => {
    if (isEditing && open) {
      const newSku = generateSKU(editCategory);
      setValue("sku", newSku);
    }
  }, [editCategory, isEditing, open, setValue]);

  useEffect(() => {
    if (isEditing && editCostPrice > 0 && editCategory) {
      const allCategories = getCategories();
      const catData = allCategories.find((c) => c.name === editCategory);
      const categoryId = catData?.id || null;
      const markup = getMarkupForPrice(editCostPrice, categoryId);
      if (markup) {
        setMarkupInfo(
          markup.type === "fixed"
            ? { retail: markup.retailFixed, wholesale: markup.wholesaleFixed, type: "fixed" }
            : { retail: markup.retailPercent, wholesale: markup.wholesalePercent, type: "percent" }
        );
        const prices = calculateSellingPrices(editCostPrice, categoryId);
        if (prices) {
          setRetailPriceStr(String(prices.retailPrice));
          setWholesalePriceStr(String(prices.wholesalePrice));
        }
      } else {
        setMarkupInfo(null);
      }
    } else if (isEditing) {
      setMarkupInfo(null);
    }
  }, [editCostPrice, editCategory, isEditing]);

  // ---- Reset on open for add mode ----
  useEffect(() => {
    if (open && !isEditing) {
      setCategory(categories[0] || "Lainnya");
      setUnit(units[0] || "Pcs");
      setWholesaleMinQty("10");
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    }
  }, [open, isEditing, categories, units]);

  // ---- Bulk helpers ----
  const updateRow = (id: string, field: keyof BulkRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleCostPriceChange = (id: string, value: string) => {
    const cost = parseInt(value) || 0;
    const allCats = getCategories();
    const catData = allCats.find((c) => c.name === category);
    const categoryId = catData?.id || null;
    const prices = cost > 0 ? calculateSellingPrices(cost, categoryId) : null;

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          costPrice: value,
          ...(prices
            ? { retailPrice: String(prices.retailPrice), wholesalePrice: String(prices.wholesalePrice) }
            : {}),
        };
      })
    );
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ---- Submit handlers ----
  const handleBulkSubmit = () => {
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      toast({ title: "Error", description: "Minimal isi satu nama produk", variant: "destructive" });
      return;
    }

    validRows.forEach((row) => {
      onSubmit({
        name: toTitleCase(row.name.trim()),
        sku: generateSKU(category),
        category,
        costPrice: parseInt(row.costPrice) || 0,
        retailPrice: parseInt(row.retailPrice) || 0,
        wholesalePrice: parseInt(row.wholesalePrice) || 0,
        wholesaleMinQty: parseInt(wholesaleMinQty) || 10,
        stock: parseInt(row.stock) || 0,
        unit,
      });
    });

    toast({
      title: "Produk Ditambahkan",
      description: `${validRows.length} produk berhasil ditambahkan`,
    });
    handleClose();
  };

  const handleEditSubmit = (data: ProductFormData) => {
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

  const validCount = rows.filter((r) => r.name.trim()).length;

  // =============== EDIT MODE ===============
  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Masukkan nama produk"
                onChange={(e) => setValue("name", toTitleCase(e.target.value))}
                maxLength={100}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Kode</Label>
                <Input id="sku" {...register("sku")} placeholder="Auto-generate" />
                {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />Harga Modal
              </Label>
              <PriceInput id="costPrice" value={costPriceStr} onChange={setCostPriceStr} placeholder="0" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga Satuan</Label>
                <PriceInput value={retailPriceStr} onChange={setRetailPriceStr} placeholder="0" />
                {editCostPrice > 0 && watch("retailPrice") > 0 && (
                  <p className="text-xs text-muted-foreground">Margin: {formatCurrency(watch("retailPrice") - editCostPrice)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Harga Grosir</Label>
                <PriceInput value={wholesalePriceStr} onChange={setWholesalePriceStr} placeholder="0" />
                {editCostPrice > 0 && watch("wholesalePrice") > 0 && (
                  <p className="text-xs text-muted-foreground">Margin: {formatCurrency(watch("wholesalePrice") - editCostPrice)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. Qty Grosir</Label>
                <Input type="number" {...register("wholesaleMinQty", { valueAsNumber: true })} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Select value={watch("unit")} onValueChange={(v) => setValue("unit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stok</Label>
              <Input type="number" {...register("stock", { valueAsNumber: true })} placeholder="0" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Batal</Button>
              <Button type="submit" className="flex-1">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // =============== ADD MODE (BULK) ===============
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tambah Produk
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shared settings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Satuan</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min. Qty Grosir</Label>
              <Input type="number" value={wholesaleMinQty} onChange={(e) => setWholesaleMinQty(e.target.value)} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">SKU</Label>
              <Input value="Otomatis" disabled className="bg-muted cursor-not-allowed text-xs" />
            </div>
          </div>

          {/* Product rows */}
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Produk {index + 1}</span>
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Nama Produk *"
                    value={row.name}
                    onChange={(e) => handleTitleCaseChange(e, (val) => updateRow(row.id, "name", val))}
                    maxLength={100}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <PriceInput
                      placeholder="Harga Modal"
                      value={row.costPrice}
                      onChange={(val) => handleCostPriceChange(row.id, val)}
                    />
                    <PriceInput
                      placeholder="Harga Satuan"
                      value={row.retailPrice}
                      onChange={(val) => updateRow(row.id, "retailPrice", val)}
                    />
                    <PriceInput
                      placeholder="Harga Grosir"
                      value={row.wholesalePrice}
                      onChange={(val) => updateRow(row.id, "wholesalePrice", val)}
                    />
                    <Input
                      type="number"
                      placeholder="Stok"
                      value={row.stock}
                      onChange={(e) => updateRow(row.id, "stock", e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Baris
          </Button>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>Batal</Button>
            <Button className="flex-1" onClick={handleBulkSubmit} disabled={validCount === 0}>
              Simpan {validCount > 0 ? `${validCount} Produk` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
