import { useState, useEffect } from 'react';
import { Product, ProductFormData } from '@/types/pos';
import { getProducts, addProduct, updateProduct, deleteProduct, updateStock } from '@/database';
import { formatCurrency } from '@/lib/format';
import { ProductForm } from '@/components/ProductForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, MoreVertical, Pencil, Trash2, PackagePlus, PackageMinus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [stockAdjust, setStockAdjust] = useState<{ product: Product; type: 'add' | 'subtract' } | null>(null);
  const [stockAmount, setStockAmount] = useState('');

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProduct = (data: ProductFormData) => {
    const newProduct = addProduct(data);
    setProducts(prev => [...prev, newProduct]);
    toast({
      title: 'Produk Ditambahkan',
      description: `${data.name} berhasil ditambahkan`,
    });
  };

  const handleEditProduct = (data: ProductFormData) => {
    if (!editingProduct) return;
    const updated = updateProduct(editingProduct.id, data);
    if (updated) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      toast({
        title: 'Produk Diperbarui',
        description: `${data.name} berhasil diperbarui`,
      });
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
    toast({
      title: 'Produk Dihapus',
      description: `${deleteTarget.name} berhasil dihapus`,
    });
    setDeleteTarget(null);
  };

  const handleStockAdjust = () => {
    if (!stockAdjust || !stockAmount) return;
    const amount = parseInt(stockAmount);
    if (isNaN(amount) || amount <= 0) return;

    const adjustedAmount = stockAdjust.type === 'add' ? amount : -amount;
    updateStock(stockAdjust.product.id, adjustedAmount);
    setProducts(prev => prev.map(p => 
      p.id === stockAdjust.product.id 
        ? { ...p, stock: p.stock + adjustedAmount }
        : p
    ));

    toast({
      title: 'Stok Diperbarui',
      description: `Stok ${stockAdjust.product.name} ${stockAdjust.type === 'add' ? 'ditambah' : 'dikurangi'} ${amount}`,
    });

    setStockAdjust(null);
    setStockAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Produk</h1>
          <p className="text-muted-foreground">Kelola produk dan stok warung Anda</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk, SKU, atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga Satuan</TableHead>
              <TableHead className="text-right">Harga Grosir</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {products.length === 0 
                    ? 'Belum ada produk. Klik "Tambah Produk" untuk memulai.'
                    : 'Tidak ditemukan produk yang sesuai.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const lowStock = product.stock <= 5;
                const outOfStock = product.stock === 0;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.retailPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.wholesalePrice > 0 ? (
                        <div>
                          <p className="font-medium">{formatCurrency(product.wholesalePrice)}</p>
                          <p className="text-xs text-muted-foreground">
                            min. {product.wholesaleMinQty} {product.unit}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
                        outOfStock 
                          ? 'bg-destructive/10 text-destructive'
                          : lowStock 
                            ? 'bg-warning/10 text-warning'
                            : 'bg-accent text-accent-foreground'
                      )}>
                        {(lowStock || outOfStock) && <AlertCircle className="w-3 h-3" />}
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
                          <DropdownMenuItem onClick={() => {
                            setEditingProduct(product);
                            setFormOpen(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Produk
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStockAdjust({ product, type: 'add' })}>
                            <PackagePlus className="w-4 h-4 mr-2" />
                            Tambah Stok
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStockAdjust({ product, type: 'subtract' })}>
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

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
        product={editingProduct}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus {deleteTarget?.name}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Adjustment Dialog */}
      <AlertDialog open={!!stockAdjust} onOpenChange={() => { setStockAdjust(null); setStockAmount(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {stockAdjust?.type === 'add' ? 'Tambah' : 'Kurangi'} Stok
            </AlertDialogTitle>
            <AlertDialogDescription>
              {stockAdjust?.product.name} - Stok saat ini: {stockAdjust?.product.stock} {stockAdjust?.product.unit}
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
            <AlertDialogCancel onClick={() => setStockAmount('')}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleStockAdjust} disabled={!stockAmount || parseInt(stockAmount) <= 0}>
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
