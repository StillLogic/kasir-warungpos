import { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingCategory, ShoppingItem } from "@/types/shopping-list";
import {
  getShoppingCategories,
  createShoppingCategory,
  deleteShoppingCategory,
  getShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  toggleShoppingItemPurchased,
  
  checkAndAutoArchive,
  
  archivePurchasedItems,
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
import { UnitSelect } from "@/components/UnitSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  FolderPlus,
  Search,
  ChevronDown,
  FileDown,
  Pencil,
  CheckSquare,
  XCircle,
  ShoppingCart,
  Archive,
  ArrowRightLeft,
  MoreVertical,
  Camera,
  ImageIcon,
  X,
} from "lucide-react";
import { convertToWebP } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { useSearchInput } from "@/hooks/use-search-input";
import { handleTitleCaseChange } from "@/lib/text";
import { cn } from "@/lib/utils";
import { sortAlpha, sortShoppingItems } from "@/lib/sorting";

interface BulkItemInput {
  id: string;
  productName: string;
  brand: string;
  quantity: string;
  unit: string;
  photo?: string;
}

export function ShoppingListPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ShoppingCategory[]>(
    getShoppingCategories,
  );
  const [items, setItems] = useState<ShoppingItem[]>(getShoppingItems);
  const [units, setUnits] = useState<string[]>(getUnitNames);

  useEffect(() => {
    const archivedCount = checkAndAutoArchive();
    if (archivedCount > 0) {
      toast({
        title: "Arsip Otomatis",
        description: `${archivedCount} item yang sudah dibeli telah diarsipkan`,
      });
      refreshData();
    }
  }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [bulkFormOpen, setBulkFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [moveCategorySourceId, setMoveCategorySourceId] = useState("");
  const [moveCategoryId, setMoveCategoryId] = useState("");
  const [moveNewCategoryName, setMoveNewCategoryName] = useState("");

  const { searchQuery, setSearchQuery, isSearchDisabled } = useSearchInput([
    formOpen,
    bulkFormOpen,
    categoryFormOpen,
    deleteConfirmOpen,
    clearConfirmOpen,
    archiveConfirmOpen,
    moveDialogOpen,
  ]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(getShoppingCategories().map((c) => c.id)),
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formData, setFormData] = useState({
    productName: "",
    brand: "",
    quantity: "",
    unit: units[0] || "Pcs",
  });
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkItemInput[]>([]);

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

      const rowsHtml =
        categoryItems.length > 0
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
            `,
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

  const filteredCategories = useMemo(() => {
    const sorted = sortAlpha(categories, "name");
    if (!searchQuery) return sorted;
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
    return sorted.filter(
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

  const openEditItemDialog = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormCategoryId(item.categoryId);
    setFormData({
      productName: item.productName,
      brand: item.brand,
      quantity: item.quantity.toString(),
      unit: item.unit,
    });
    setFormPhoto(item.photo || null);
    setFormOpen(true);
  };

  const openBulkAddDialog = (categoryId: string) => {
    setBulkCategoryId(categoryId);
    setBulkItems([
      {
        id: crypto.randomUUID(),
        productName: "",
        brand: "",
        quantity: "",
        unit: units[0] || "Pcs",
      },
    ]);
    setBulkFormOpen(true);
  };

  const handleSaveItem = () => {
    if (!formCategoryId) {
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

    const category = categories.find((c) => c.id === formCategoryId);
    if (!category) return;

    const quantity = parseInt(formData.quantity) || 1;

    if (editingItem) {
      updateShoppingItem(editingItem.id, {
        productName: formData.productName.trim(),
        brand: formData.brand.trim(),
        quantity,
        unit: formData.unit,
        photo: formPhoto || undefined,
      });
      toast({ title: "Berhasil", description: "Item diperbarui" });
    } else {
      createShoppingItem({
        categoryId: formCategoryId,
        categoryName: category.name,
        productName: formData.productName.trim(),
        brand: formData.brand.trim(),
        quantity,
        unit: formData.unit,
        photo: formPhoto || undefined,
      });
      toast({ title: "Berhasil", description: "Item ditambahkan" });
    }

    setFormOpen(false);
    setEditingItem(null);
    setFormPhoto(null);
    refreshData();
  };

  const handleBulkAdd = () => {
    const category = categories.find((c) => c.id === bulkCategoryId);
    if (!category) return;

    const validItems = bulkItems.filter((item) => item.productName.trim());
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal isi satu nama produk",
        variant: "destructive",
      });
      return;
    }

    validItems.forEach((item) => {
      createShoppingItem({
        categoryId: bulkCategoryId,
        categoryName: category.name,
        productName: item.productName.trim(),
        brand: item.brand.trim(),
        quantity: parseInt(item.quantity) || 1,
        unit: item.unit,
        photo: item.photo || undefined,
      });
    });

    toast({
      title: "Berhasil",
      description: `${validItems.length} item ditambahkan`,
    });
    setBulkFormOpen(false);
    refreshData();
  };

  const addBulkItemRow = () => {
    setBulkItems([
      ...bulkItems,
      {
        id: crypto.randomUUID(),
        productName: "",
        brand: "",
        quantity: "",
        unit: units[0] || "Pcs",
      },
    ]);
  };

  const updateBulkItem = (
    id: string,
    field: keyof BulkItemInput,
    value: string,
  ) => {
    setBulkItems(
      bulkItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeBulkItemRow = (id: string) => {
    if (bulkItems.length <= 1) return;
    setBulkItems(bulkItems.filter((item) => item.id !== id));
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    deleteShoppingItem(itemToDelete);
    setItemToDelete(null);
    setDeleteConfirmOpen(false);
    refreshData();

    toast({ title: "Berhasil", description: "Item dihapus" });
  };


  const handleToggleAllInCategory = (categoryId: string) => {
    const categoryItems = items.filter((i) => i.categoryId === categoryId);
    const allSelected = categoryItems.length > 0 && categoryItems.every((i) => selectedItems.has(i.id));
    setSelectedItems((prev) => {
      const next = new Set(prev);
      categoryItems.forEach((i) => {
        if (allSelected) next.delete(i.id);
        else next.add(i.id);
      });
      return next;
    });
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const getSelectedInCategory = (categoryId: string) => {
    return items.filter(
      (i) => i.categoryId === categoryId && selectedItems.has(i.id),
    );
  };

  const handleToggleSelectedPurchased = (categoryId: string) => {
    const selected = getSelectedInCategory(categoryId);
    const allPurchased = selected.every((i) => i.isPurchased);
    selected.forEach((item) => {
      if (allPurchased && item.isPurchased) {
        toggleShoppingItemPurchased(item.id);
      } else if (!allPurchased && !item.isPurchased) {
        toggleShoppingItemPurchased(item.id);
      }
    });
    setSelectedItems((prev) => {
      const next = new Set(prev);
      selected.forEach((i) => next.delete(i.id));
      return next;
    });
    refreshData();
    toast({
      title: "Berhasil",
      description: allPurchased
        ? `${selected.length} item dikembalikan ke belum dibeli`
        : `${selected.length} item ditandai sudah dibeli`,
    });
  };

  const handleDeleteSelected = () => {
    const selected = items.filter((i) => selectedItems.has(i.id));
    selected.forEach((item) => deleteShoppingItem(item.id));
    setClearConfirmOpen(false);
    setSelectedItems(new Set());
    refreshData();
    toast({ title: "Berhasil", description: `${selected.length} item dihapus` });
  };

  const handleArchivePurchased = () => {
    const count = archivePurchasedItems();
    setArchiveConfirmOpen(false);
    refreshData();
    toast({ title: "Berhasil", description: `${count} item telah diarsipkan` });
  };

  const openBulkMoveDialog = () => {
    setMoveCategoryId("");
    setMoveNewCategoryName("");
    setMoveDialogOpen(true);
  };

  const handleMoveItems = () => {
    const itemsToMove = items.filter((i) => selectedItems.has(i.id) && i.categoryId === moveCategorySourceId);
    if (itemsToMove.length === 0) return;

    let targetCategoryId = moveCategoryId;
    let targetCategoryName = "";

    if (moveCategoryId === "__new__") {
      if (!moveNewCategoryName.trim()) {
        toast({
          title: "Error",
          description: "Nama kategori baru harus diisi",
          variant: "destructive",
        });
        return;
      }
      const newCat = createShoppingCategory(moveNewCategoryName.trim());
      targetCategoryId = newCat.id;
      targetCategoryName = newCat.name;
    } else {
      const cat = categories.find((c) => c.id === moveCategoryId);
      if (!cat) return;
      targetCategoryName = cat.name;
    }

    itemsToMove.forEach((item) => {
      updateShoppingItem(item.id, {
        categoryId: targetCategoryId,
        categoryName: targetCategoryName,
      });
    });

    setMoveDialogOpen(false);
    setSelectedItems(new Set());
    refreshData();

    toast({
      title: "Berhasil",
      description: `${itemsToMove.length} item dipindahkan ke ${targetCategoryName}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Daftar Belanja
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola daftar belanjaan Anda
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari item atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            maxLength={50}
            disabled={isSearchDisabled}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden shrink-0"
          onClick={() => setCategoryFormOpen(true)}
          title="Tambah Kategori"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden sm:inline-flex"
          onClick={() => setCategoryFormOpen(true)}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Kategori
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {selectedItems.size > 0 && (
              <DropdownMenuItem onClick={() => setClearConfirmOpen(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Dipilih ({selectedItems.size})
              </DropdownMenuItem>
            )}
            {purchasedItems > 0 && (
              <DropdownMenuItem onClick={() => setArchiveConfirmOpen(true)}>
                <Archive className="w-4 h-4 mr-2 text-blue-600" />
                Arsipkan ({purchasedItems})
              </DropdownMenuItem>
            )}
            {categories.length > 0 && (
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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

            const filteredItems = searchQuery
              ? categoryItems.filter(
                  (i) =>
                    i.productName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    i.brand.toLowerCase().includes(searchQuery.toLowerCase()),
                )
              : categoryItems;

            const sortedItems = sortShoppingItems(filteredItems);




            return (
              <Card key={category.id}>
                <CardHeader className="p-3">
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
                    <div className="flex gap-1 items-center">
                      {getSelectedInCategory(category.id).length > 0 && (
                        <>
                          {(() => {
                            const selected = getSelectedInCategory(category.id);
                            const allPurchased = selected.every((i) => i.isPurchased);
                            return (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleSelectedPurchased(category.id)}
                                title={allPurchased ? "Batalkan sudah dibeli" : "Tandai sudah dibeli"}
                              >
                                {allPurchased ? (
                                  <XCircle className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <CheckSquare className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            );
                          })()}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setMoveCategorySourceId(category.id);
                              openBulkMoveDialog();
                            }}
                            title={`Pindah ${getSelectedInCategory(category.id).length} item`}
                          >
                            <ArrowRightLeft className="w-4 h-4 text-primary" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openBulkAddDialog(category.id)}
                        title="Tambah item"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
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
                  </div>
                </CardHeader>
                {!collapsedCategories.has(category.id) && (
                  <CardContent className="p-0">
                    {sortedItems.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4 px-3">
                        {searchQuery
                          ? "Tidak ada item yang cocok"
                          : "Belum ada item"}
                      </p>
                    ) : (
                      <div className="overflow-x-auto flex justify-center">
                        <table
                          className="text-sm table-fixed"
                          style={{ width: "95%" }}
                        >
                          <thead>
                            <tr className="border-b">
                              <th className="w-10 py-1.5 px-2 text-center">
                                <Checkbox
                                  checked={
                                    categoryItems.length > 0 &&
                                    categoryItems.every((i) => selectedItems.has(i.id))
                                  }
                                  onCheckedChange={() =>
                                    handleToggleAllInCategory(category.id)
                                  }
                                />
                              </th>
                              <th className="w-[30%] text-left py-1.5 pr-1 pl-0 font-medium text-muted-foreground">
                                Nama Produk
                              </th>
                              <th className="w-[20%] text-left py-1.5 pr-1 pl-0 font-medium text-muted-foreground">
                                Merk
                              </th>
                              <th className="w-[15%] text-left py-1.5 pr-1 pl-0 font-medium text-muted-foreground">
                                Jumlah
                              </th>
                              <th className="w-20 py-1.5 px-1"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedItems.map((item) => (
                              <tr
                                key={item.id}
                                className={cn(
                                  "border-b last:border-0",
                                  item.isPurchased &&
                                    "bg-green-50 dark:bg-green-950/30",
                                )}
                              >
                                <td className="py-1.5 px-2 text-center">
                                  <Checkbox
                                    checked={selectedItems.has(item.id)}
                                    onCheckedChange={() =>
                                      toggleSelectItem(item.id)
                                    }
                                  />
                                </td>
                                <td
                                  className={cn(
                                    "py-1.5 pr-1 pl-0 font-medium",
                                    item.isPurchased &&
                                      "line-through text-muted-foreground",
                                  )}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {item.photo && (
                                      <img
                                        src={item.photo}
                                        alt=""
                                        className="w-6 h-6 rounded object-cover shrink-0 cursor-pointer"
                                        onClick={() => setViewPhoto(item.photo!)}
                                      />
                                    )}
                                    {item.productName}
                                  </div>
                                </td>
                                <td
                                  className={cn(
                                    "py-1.5 pr-1 pl-0 text-muted-foreground",
                                    item.isPurchased && "line-through",
                                  )}
                                >
                                  {item.brand || "-"}
                                </td>
                                <td
                                  className={cn(
                                    "py-1.5 pr-1 pl-0 text-muted-foreground",
                                    item.isPurchased && "line-through",
                                  )}
                                >
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="py-1.5 px-1">
                                  <div className="flex gap-0.5 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        toggleShoppingItemPurchased(item.id);
                                        refreshData();
                                        toast({
                                          title: item.isPurchased ? "Item dikembalikan" : "Item ditandai dibeli",
                                        });
                                      }}
                                      title={item.isPurchased ? "Batalkan dibeli" : "Tandai dibeli"}
                                    >
                                      {item.isPurchased ? (
                                        <XCircle className="w-3.5 h-3.5 text-orange-500" />
                                      ) : (
                                        <CheckSquare className="w-3.5 h-3.5 text-green-600" />
                                      )}
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEditItemDialog(item)}>
                                          <Pencil className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedItems(new Set([item.id]));
                                            setMoveCategorySourceId(item.categoryId);
                                            openBulkMoveDialog();
                                          }}
                                        >
                                          <ArrowRightLeft className="w-4 h-4 mr-2" />
                                          Pindah Kategori
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => {
                                            setItemToDelete(item.id);
                                            setDeleteConfirmOpen(true);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Hapus
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
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
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCategoryFormOpen(false)}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleAddCategory}>
              Tambah
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormPhoto(null); setEditingItem(null); } setFormOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <UnitSelect
                  value={formData.unit}
                  units={units}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                  onUnitsChanged={refreshData}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto Produk (Opsional)</Label>
              {formPhoto ? (
                <div className="relative inline-block">
                  <img
                    src={formPhoto}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setFormPhoto(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Galeri
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.setAttribute("capture", "environment");
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            const webp = await convertToWebP(file);
                            setFormPhoto(webp);
                          } catch {
                            toast({ title: "Error", description: "Gagal memproses gambar", variant: "destructive" });
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    Kamera
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const webp = await convertToWebP(file);
                      setFormPhoto(webp);
                    } catch {
                      toast({ title: "Error", description: "Gagal memproses gambar", variant: "destructive" });
                    }
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFormOpen(false)}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleSaveItem}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkFormOpen} onOpenChange={setBulkFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Tambah Item -{" "}
              {categories.find((c) => c.id === bulkCategoryId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bulkItems.map((item, index) => (
              <div key={item.id} className="p-3 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item {index + 1}
                  </span>
                  {bulkItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeBulkItemRow(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Produk *</Label>
                    <Input
                      placeholder="Nama produk"
                      value={item.productName}
                      onChange={(e) =>
                        handleTitleCaseChange(e, (value) =>
                          updateBulkItem(item.id, "productName", value),
                        )
                      }
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Merk</Label>
                    <Input
                      placeholder="Merk (opsional)"
                      value={item.brand}
                      onChange={(e) =>
                        handleTitleCaseChange(e, (value) =>
                          updateBulkItem(item.id, "brand", value),
                        )
                      }
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Jumlah</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateBulkItem(item.id, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Satuan</Label>
                    <UnitSelect
                      value={item.unit}
                      units={units}
                      onValueChange={(v) => updateBulkItem(item.id, "unit", v)}
                      onUnitsChanged={refreshData}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Foto (Opsional)</Label>
                  {item.photo ? (
                    <div className="relative inline-block">
                      <img src={item.photo} alt="" className="w-16 h-16 object-cover rounded border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full"
                        onClick={() => updateBulkItem(item.id, "photo", "")}
                      >
                        <X className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            try {
                              const webp = await convertToWebP(file);
                              updateBulkItem(item.id, "photo", webp);
                            } catch { /* ignore */ }
                          }
                        };
                        input.click();
                      }}>
                        <ImageIcon className="w-3 h-3" />
                        Galeri
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.setAttribute("capture", "environment");
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            try {
                              const webp = await convertToWebP(file);
                              updateBulkItem(item.id, "photo", webp);
                            } catch { /* ignore */ }
                          }
                        };
                        input.click();
                      }}>
                        <Camera className="w-3 h-3" />
                        Kamera
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addBulkItemRow}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris
            </Button>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setBulkFormOpen(false)}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleBulkAdd}>
              Simpan {bulkItems.filter((i) => i.productName.trim()).length} Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel
              className="flex-1"
              onClick={() => {
                setCategoryToDelete(null);
                setItemToDelete(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={
                categoryToDelete ? handleDeleteCategory : handleDeleteItem
              }
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedItems.size} Item Dipilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Item yang dipilih akan dihapus dari daftar belanja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSelected}
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan Item Sudah Dibeli?</AlertDialogTitle>
            <AlertDialogDescription>
              {purchasedItems} item yang sudah dibeli akan dipindahkan ke arsip
              dan dapat dilihat di halaman Arsip Belanja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1"
              onClick={handleArchivePurchased}
            >
              Arsipkan
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Pindah Kategori
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const selected = items.filter((i) => selectedItems.has(i.id) && i.categoryId === moveCategorySourceId);
            return (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <span className="font-medium">{selected.length} item dipilih</span>
                  <ul className="mt-1 text-muted-foreground text-xs space-y-0.5">
                    {selected.map((item) => (
                      <li key={item.id}>• {item.productName}{item.brand ? ` — ${item.brand}` : ""}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label>Pindah ke Kategori *</Label>
                  <Select value={moveCategoryId} onValueChange={setMoveCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori tujuan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sortAlpha(
                        categories.filter((c) => !selected.every((s) => s.categoryId === c.id) || selected.some((s) => s.categoryId !== c.id)),
                        "name",
                      ).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__new__"
                        className="text-primary font-medium border-t mt-1 pt-2"
                      >
                        <span className="flex items-center gap-2">
                          <FolderPlus className="w-3 h-3" />
                          Kategori Baru...
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {moveCategoryId === "__new__" && (
                  <div className="space-y-2">
                    <Label>Nama Kategori Baru *</Label>
                    <Input
                      placeholder="Contoh: Minuman, Snack"
                      value={moveNewCategoryName}
                      onChange={(e) => handleTitleCaseChange(e, setMoveNewCategoryName)}
                      maxLength={50}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })()}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setMoveDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleMoveItems}
              disabled={!moveCategoryId}
            >
              Pindahkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="sm:max-w-md p-2">
          <DialogHeader>
            <DialogTitle>Foto Produk</DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <img
              src={viewPhoto}
              alt="Foto produk"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
