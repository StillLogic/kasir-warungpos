import { useState, useMemo } from "react";
import { ProductFormData } from "@/types/pos";
import { generateSKU } from "@/lib/sku";
import { getCategoryNames } from "@/database/categories";
import { getUnitNames } from "@/database/units";
import { getMarkupForPrice, calculateSellingPrices } from "@/database/markup";
import { getCategories } from "@/database/categories";
import { toTitleCase } from "@/lib/text";
import { handleTitleCaseChange } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PriceInput,
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
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkProductRow {
  id: string;
  name: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  stock: string;
}

interface BulkProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (products: ProductFormData[]) => void;
}

export function BulkProductForm({ open, onClose, onSubmit }: BulkProductFormProps) {
  const { toast } = useToast();
  const categories = useMemo(() => getCategoryNames(), []);
  const units = useMemo(() => getUnitNames(), []);

  const [category, setCategory] = useState(categories[0] || "Lainnya");
  const [unit, setUnit] = useState(units[0] || "Pcs");
  const [wholesaleMinQty, setWholesaleMinQty] = useState("10");

  const createEmptyRow = (): BulkProductRow => ({
    id: crypto.randomUUID(),
    name: "",
    costPrice: "",
    retailPrice: "",
    wholesalePrice: "",
    stock: "",
  });

  const [rows, setRows] = useState<BulkProductRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const updateRow = (id: string, field: keyof BulkProductRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleCostPriceChange = (id: string, value: string) => {
    const costPrice = parseInt(value) || 0;
    const allCategories = getCategories();
    const catData = allCategories.find((c) => c.name === category);
    const categoryId = catData?.id || null;

    const prices = costPrice > 0 ? calculateSellingPrices(costPrice, categoryId) : null;

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return {
          ...row,
          costPrice: value,
          ...(prices
            ? {
                retailPrice: String(prices.retailPrice),
                wholesalePrice: String(prices.wholesalePrice),
              }
            : {}),
        };
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = () => {
    const validRows = rows.filter((row) => row.name.trim());
    if (validRows.length === 0) {
      toast({
        title: "Error",
        description: "Minimal isi satu nama produk",
        variant: "destructive",
      });
      return;
    }

    const products: ProductFormData[] = validRows.map((row) => ({
      name: toTitleCase(row.name.trim()),
      sku: generateSKU(category),
      category,
      costPrice: parseInt(row.costPrice) || 0,
      retailPrice: parseInt(row.retailPrice) || 0,
      wholesalePrice: parseInt(row.wholesalePrice) || 0,
      wholesaleMinQty: parseInt(wholesaleMinQty) || 10,
      stock: parseInt(row.stock) || 0,
      unit,
    }));

    onSubmit(products);
    handleClose();
  };

  const handleClose = () => {
    setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    setCategory(categories[0] || "Lainnya");
    setUnit(units[0] || "Pcs");
    setWholesaleMinQty("10");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Produk Massal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shared fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label>Satuan</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Min. Qty Grosir</Label>
              <Input
                type="number"
                value={wholesaleMinQty}
                onChange={(e) => setWholesaleMinQty(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          {/* Product rows */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Daftar Produk</Label>
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_auto] gap-2 p-3 border border-border rounded-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="Nama Produk"
                      value={row.name}
                      onChange={(e) =>
                        handleTitleCaseChange(e, (val) => updateRow(row.id, "name", val))
                      }
                      className="flex-1"
                      maxLength={100}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-7">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="self-center text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Baris
          </Button>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Batal
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Tambah {rows.filter((r) => r.name.trim()).length} Produk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
