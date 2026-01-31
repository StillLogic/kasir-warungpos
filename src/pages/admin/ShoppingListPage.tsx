import { useState, useMemo } from "react";
import {
  ShoppingCategory,
  ShoppingItem,
} from "@/types/shopping-list";
import {
  getShoppingCategories,
  createShoppingCategory,
  deleteShoppingCategory,
  getShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  toggleShoppingItemPurchased,
  clearPurchasedItems,
} from "@/database/shopping-list";
import { getUnitNames } from "@/database/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FolderPlus, Search, ChevronDown, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleTitleCaseChange } from "@/lib/text";
import { cn } from "@/lib/utils";

export function ShoppingListPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ShoppingCategory[]>(
    getShoppingCategories,
  );
  const [items, setItems] = useState<ShoppingItem[]>(getShoppingItems);
  const [units, setUnits] = useState<string[]>(getUnitNames);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [formData, setFormData] = useState({
    categoryId: "",
    productName: "",
    brand: "",
    quantity: 1,
    unit: units[0] || "Pcs",
  });

  const purchasedItems = items.filter((i) => i.isPurchased).length;

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Pop-up diblokir. Izinkan pop-up untuk mencetak.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let pagesHtml = "";

    categories.forEach((category, idx) => {
      const categoryItems = items.filter((i) => i.categoryId === category.id);
      
      const rowsHtml = categoryItems.length > 0
        ? categoryItems
            .map(
              (item, i) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.productName}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.brand || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity} ${item.unit}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.isPurchased ? "✓" : ""}</td>
              </tr>
            `
            )
            .join("")
        : `<tr><td colspan="5" style="border: 1px solid #ddd; padding: 16px; text-align: center; color: #666;">Tidak ada item</td></tr>`;

      pagesHtml += `
        <div class="page" style="${idx > 0 ? "page-break-before: always;" : ""}">
          <h2 style="margin: 0 0 16px 0; font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 8px;">
            ${category.name}
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 40px;">No</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nama Produk</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Merk</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 100px;">Jumlah</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 60px;">Dibeli</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <p style="margin-top: 12px; font-size: 11px; color: #666;">
            Total: ${categoryItems.length} item
          </p>
        </div>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Belanja - ${now}</title>
        <style>
          @media print {
            .page { page-break-after: always; }
            .page:last-child { page-break-after: avoid; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #333;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 8px 0 0 0;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Daftar Belanja</h1>
          <p>${now}</p>
        </div>
        ${pagesHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const toggleCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Filter items based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const lowerQuery = searchQuery.toLowerCase();
    const matchingCategoryIds = new Set(
      items
        .filter(
          (i) =>
            i.productName.toLowerCase().includes(lowerQuery) ||
            i.brand.toLowerCase().includes(lowerQuery),
        )
        .map((i) => i.categoryId),
    );
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        matchingCategoryIds.has(c.id),
    );
  }, [categories, items, searchQuery]);

  const refreshData = () => {
    setCategories(getShoppingCategories());
    setItems(getShoppingItems());
    setUnits(getUnitNames());
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Nama kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    createShoppingCategory(newCategoryName.trim());
    setNewCategoryName("");
    setCategoryFormOpen(false);
    refreshData();

    toast({ title: "Berhasil", description: "Kategori ditambahkan" });
  };

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    deleteShoppingCategory(categoryToDelete);
    setCategoryToDelete(null);
    setDeleteConfirmOpen(false);
    refreshData();

    toast({ title: "Berhasil", description: "Kategori dihapus" });
  };

  const handleAddItem = () => {
    if (!formData.categoryId) {
      toast({
        title: "Error",
        description: "Pilih kategori terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!formData.productName.trim()) {
      toast({
        title: "Error",
        description: "Nama produk harus diisi",
        variant: "destructive",
      });
      return;
    }

    const category = categories.find((c) => c.id === formData.categoryId);
    if (!category) return;

    createShoppingItem({
      categoryId: formData.categoryId,
      categoryName: category.name,
      productName: formData.productName.trim(),
      brand: formData.brand.trim(),
      quantity: formData.quantity,
      unit: formData.unit,
    });

    setFormData({
      categoryId: formData.categoryId,
      productName: "",
      brand: "",
      quantity: 1,
      unit: units[0] || "Pcs",
    });
    setFormOpen(false);
    refreshData();

    toast({ title: "Berhasil", description: "Item ditambahkan" });
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    deleteShoppingItem(itemToDelete);
    setItemToDelete(null);
    setDeleteConfirmOpen(false);
    refreshData();

    toast({ title: "Berhasil", description: "Item dihapus" });
  };

  const handleTogglePurchased = (id: string) => {
    toggleShoppingItemPurchased(id);
    refreshData();
  };

  const handleClearPurchased = () => {
    clearPurchasedItems();
    setClearConfirmOpen(false);
    refreshData();

    toast({ title: "Berhasil", description: "Item sudah dibeli dihapus" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari item atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            maxLength={50}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {purchasedItems > 0 && (
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Dibeli ({purchasedItems})
            </Button>
          )}
          {categories.length > 0 && (
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          )}
          <Button variant="outline" onClick={() => setCategoryFormOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Kategori
          </Button>
          <Button
            onClick={() => setFormOpen(true)}
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Categories list */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada kategori. Tambahkan kategori terlebih dahulu.
          </CardContent>
        </Card>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Tidak ada item yang cocok
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const categoryItems = items.filter(
              (i) => i.categoryId === category.id,
            );

            // Filter items based on search within category
            const filteredItems = searchQuery
              ? categoryItems.filter(
                  (i) =>
                    i.productName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    i.brand.toLowerCase().includes(searchQuery.toLowerCase()),
                )
              : categoryItems;

            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCollapse(category.id)}
                      className="flex items-center gap-2 text-left hover:opacity-80"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          collapsedCategories.has(category.id) && "-rotate-90",
                        )}
                      />
                      <CardTitle className="text-lg flex items-center gap-2">
                        {category.name}
                        <Badge variant="secondary">
                          {categoryItems.length}
                        </Badge>
                      </CardTitle>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setCategoryToDelete(category.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedCategories.has(category.id) && (
                  <CardContent>
                    {filteredItems.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        {searchQuery
                          ? "Tidak ada item yang cocok"
                          : "Belum ada item"}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="w-10 py-2 px-2"></th>
                              <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                                Nama Produk
                              </th>
                              <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                                Merk
                              </th>
                              <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                                Jumlah
                              </th>
                              <th className="w-10 py-2 px-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map((item) => (
                              <tr
                                key={item.id}
                                className={cn(
                                  "border-b last:border-0",
                                  item.isPurchased &&
                                    "bg-green-50 dark:bg-green-950/30",
                                )}
                              >
                                <td className="py-2 px-2">
                                  <Checkbox
                                    checked={item.isPurchased}
                                    onCheckedChange={() =>
                                      handleTogglePurchased(item.id)
                                    }
                                  />
                                </td>
                                <td
                                  className={cn(
                                    "py-2 px-2 font-medium",
                                    item.isPurchased &&
                                      "line-through text-muted-foreground",
                                  )}
                                >
                                  {item.productName}
                                </td>
                                <td
                                  className={cn(
                                    "py-2 px-2 text-muted-foreground",
                                    item.isPurchased && "line-through",
                                  )}
                                >
                                  {item.brand || "-"}
                                </td>
                                <td
                                  className={cn(
                                    "py-2 px-2 text-right",
                                    item.isPurchased &&
                                      "line-through text-muted-foreground",
                                  )}
                                >
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="py-2 px-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setItemToDelete(item.id);
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input
                placeholder="Contoh: Sembako, Minuman, Snack"
                value={newCategoryName}
                onChange={(e) => handleTitleCaseChange(e, setNewCategoryName)}
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryFormOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleAddCategory}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Item Belanja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nama Produk *</Label>
              <Input
                placeholder="Contoh: Beras, Gula, Minyak"
                value={formData.productName}
                onChange={(e) =>
                  handleTitleCaseChange(e, (value) =>
                    setFormData({ ...formData, productName: value }),
                  )
                }
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Merk</Label>
              <Input
                placeholder="Contoh: Rose Brand, Gulaku"
                value={formData.brand}
                onChange={(e) =>
                  handleTitleCaseChange(e, (value) =>
                    setFormData({ ...formData, brand: value }),
                  )
                }
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddItem}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {categoryToDelete ? "Hapus Kategori?" : "Hapus Item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete
                ? "Kategori dan semua item di dalamnya akan dihapus."
                : "Item ini akan dihapus dari daftar belanja."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCategoryToDelete(null);
                setItemToDelete(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={
                categoryToDelete ? handleDeleteCategory : handleDeleteItem
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Purchased Confirmation Dialog */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item Sudah Dibeli?</AlertDialogTitle>
            <AlertDialogDescription>
              {purchasedItems} item yang sudah dibeli akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearPurchased}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
