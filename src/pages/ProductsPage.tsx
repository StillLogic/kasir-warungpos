import { useState, useEffect } from "react";
import { Product, ProductFormData } from "@/types/pos";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  waitForProducts,
} from "@/database";
import { formatCurrency } from "@/lib/format";
import { ProductForm } from "@/components/ProductForm";
import { ImportProductDialog } from "@/components/ImportProductDialog";
import { CategoryManager } from "@/components/CategoryManager";
import { CSVProduct } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "@/hooks/use-toast";
import { useSearchInput } from "@/hooks/use-search-input";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  PackagePlus,
  PackageMinus,
  AlertCircle,
  Loader2,
  Upload,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { sortProducts } from "@/lib/sorting";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [stockAdjust, setStockAdjust] = useState<{
    product: Product;
    type: "add" | "subtract";
  } | null>(null);
  const [stockAmount, setStockAmount] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const {
    searchQuery: search,
    setSearchQuery: setSearch,
    isSearchDisabled,
  } = useSearchInput([
    formOpen,
    deleteTarget !== null,
    stockAdjust !== null,
    bulkDeleteOpen,
    importOpen,
    categoryManagerOpen,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const data = await waitForProducts();
        if (mounted) {
          setProducts(data);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = sortProducts(
    products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.id));
  const someSelected = filteredProducts.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddProduct = (data: ProductFormData) => {
    const newProduct = addProduct(data);
    setProducts((prev) => [...prev, newProduct]);
    toast({
      title: "Produk Ditambahkan",
      description: `${data.name} berhasil ditambahkan`,
    });
  };

  const handleBulkAddProducts = (productsData: ProductFormData[]) => {
    const newProducts = productsData.map((p) => addProduct(p));
    setProducts((prev) => [...prev, ...newProducts]);
    toast({
      title: "Produk Ditambahkan",
      description: `${newProducts.length} produk berhasil ditambahkan`,
    });
  };

  const handleImportProducts = (csvProducts: CSVProduct[]) => {
    const newProducts = csvProducts.map((p) => addProduct(p));
    setProducts((prev) => [...prev, ...newProducts]);
    toast({
      title: "Import Berhasil",
      description: `${newProducts.length} produk berhasil ditambahkan`,
    });
  };

  const handleEditProduct = (data: ProductFormData) => {
    if (!editingProduct) return;
    const updated = updateProduct(editingProduct.id, data);
    if (updated) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updated : p)),
      );
      toast({
        title: "Produk Diperbarui",
        description: `${data.name} berhasil diperbarui`,
      });
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deleteTarget.id);
      return newSet;
    });
    toast({
      title: "Produk Dihapus",
      description: `${deleteTarget.name} berhasil dihapus`,
    });
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => deleteProduct(id));
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    toast({
      title: "Produk Dihapus",
      description: `${count} produk berhasil dihapus`,
    });
  };

  const handleStockAdjust = () => {
    if (!stockAdjust || !stockAmount) return;
    const amount = parseInt(stockAmount);
    if (isNaN(amount) || amount <= 0) return;

    const adjustedAmount = stockAdjust.type === "add" ? amount : -amount;
    updateStock(stockAdjust.product.id, adjustedAmount);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === stockAdjust.product.id
          ? { ...p, stock: p.stock + adjustedAmount }
          : p,
      ),
    );

    toast({
      title: "Stok Diperbarui",
      description: `Stok ${stockAdjust.product.name} ${stockAdjust.type === "add" ? "ditambah" : "dikurangi"} ${amount}`,
    });

    setStockAdjust(null);
    setStockAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk dan stok warung Anda
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setCategoryManagerOpen(true)}
          >
            <Tag className="w-4 h-4 mr-2" />
            Kategori
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk, SKU, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            disabled={isSearchDisabled}
          />
        </div>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus {selectedIds.size} Produk
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga Modal</TableHead>
              <TableHead className="text-right">Harga Satuan</TableHead>
              <TableHead className="text-right">Harga Grosir</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat data produk...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  {products.length === 0
                    ? 'Belum ada produk. Klik "Tambah Produk" untuk memulai.'
                    : "Tidak ditemukan produk yang sesuai."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const lowStock = product.stock <= 5;
                const outOfStock = product.stock === 0;
                const isSelected = selectedIds.has(product.id);
                return (
                  <TableRow
                    key={product.id}
                    className={cn(isSelected && "bg-accent/50")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        aria-label={`Pilih ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {product.costPrice > 0
                        ? formatCurrency(product.costPrice)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.retailPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.wholesalePrice > 0 ? (
                        <div>
                          <p className="font-medium">
                            {formatCurrency(product.wholesalePrice)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            min. {product.wholesaleMinQty} {product.unit}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                          outOfStock
                            ? "bg-destructive/10 text-destructive"
                            : lowStock
                              ? "bg-warning/10 text-warning"
                              : "bg-accent text-accent-foreground",
                        )}
                      >
                        {(lowStock || outOfStock) && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {product.stock} {product.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProduct(product);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Produk
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setStockAdjust({ product, type: "add" })
                            }
                          >
                            <PackagePlus className="w-4 h-4 mr-2" />
                            Tambah Stok
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setStockAdjust({ product, type: "subtract" })
                            }
                          >
                            <PackageMinus className="w-4 h-4 mr-2" />
                            Kurangi Stok
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Produk
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
        onSubmitBulk={handleBulkAddProducts}
        product={editingProduct}
      />

      <ImportProductDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportProducts}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus {deleteTarget?.name}? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!stockAdjust}
        onOpenChange={() => {
          setStockAdjust(null);
          setStockAmount("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {stockAdjust?.type === "add" ? "Tambah" : "Kurangi"} Stok
            </AlertDialogTitle>
            <AlertDialogDescription>
              {stockAdjust?.product.name} - Stok saat ini:{" "}
              {stockAdjust?.product.stock} {stockAdjust?.product.unit}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Masukkan jumlah"
              value={stockAmount}
              onChange={(e) => setStockAmount(e.target.value)}
              min="1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStockAmount("")}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStockAdjust}
              disabled={!stockAmount || parseInt(stockAmount) <= 0}
            >
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedIds.size} Produk?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus {selectedIds.size} produk yang dipilih?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </div>
  );
}
