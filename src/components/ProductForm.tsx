import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useMemo } from "react";
import { Product, ProductFormData } from "@/types/pos";
import { generateSKU } from "@/lib/sku";
import { getCategoryNames, getCategories } from "@/database/categories";
import { getMarkupForPrice, calculateSellingPrices } from "@/database/markup";
import { getUnitNames } from "@/database/units";
import { toTitleCase } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PriceInput,
  formatWithThousandSeparator,
  parseThousandSeparator,
} from "@/components/ui/price-input";
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
import { Calculator, Info } from "lucide-react";
import { formatCurrency } from "@/lib/format";

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

export function ProductForm({
  open,
  onClose,
  onSubmit,
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

  const categories = useMemo(() => getCategoryNames(), []);
  const units = useMemo(() => getUnitNames(), []);

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

  useEffect(() => {
    if (open) {
      if (product) {
        setCostPriceStr(product.costPrice > 0 ? String(product.costPrice) : "");
        setRetailPriceStr(
          product.retailPrice > 0 ? String(product.retailPrice) : "",
        );
        setWholesalePriceStr(
          product.wholesalePrice > 0 ? String(product.wholesalePrice) : "",
        );
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
    if (open && !isEditing) {
      const initialSku = generateSKU("Lainnya");
      setValue("sku", initialSku);
    }
  }, [open, isEditing, setValue]);

  useEffect(() => {
    if (costPrice > 0 && category) {
      const allCategories = getCategories();
      const catData = allCategories.find((c) => c.name === category);
      const categoryId = catData?.id || null;

      const markup = getMarkupForPrice(costPrice, categoryId);
      if (markup) {
        if (markup.type === "fixed") {
          setMarkupInfo({
            retail: markup.retailFixed,
            wholesale: markup.wholesaleFixed,
            type: "fixed",
          });
        } else {
          setMarkupInfo({
            retail: markup.retailPercent,
            wholesale: markup.wholesalePercent,
            type: "percent",
          });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>
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
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  Otomatis berdasarkan kategori
                </p>
              )}
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPrice" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Harga Modal
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
            {errors.costPrice && (
              <p className="text-sm text-destructive">
                {errors.costPrice.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                <p className="text-sm text-destructive">
                  {errors.retailPrice.message}
                </p>
              )}
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wholesaleMinQty">Min. Qty Grosir</Label>
              <Input
                id="wholesaleMinQty"
                type="number"
                {...register("wholesaleMinQty", { valueAsNumber: true })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Select
                value={watch("unit")}
                onValueChange={(value) => setValue("unit", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stok Awal</Label>
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {product ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
