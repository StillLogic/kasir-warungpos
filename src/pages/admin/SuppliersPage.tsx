import { useState, useEffect, useMemo } from 'react';
import { Supplier, Purchase, PurchaseItem } from '@/types/business';
import { Product } from '@/types/pos';
import { 
  getSuppliersAsync, 
  saveSupplierAsync, 
  updateSupplierAsync, 
  deleteSupplierAsync,
  getPurchasesAsync,
  savePurchaseAsync,
  getProductsAsync
} from '@/database';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Loader2, 
  Truck,
  Edit, 
  Trash2,
  Package,
  ShoppingCart,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [suppliersData, purchasesData, productsData] = await Promise.all([
      getSuppliersAsync(),
      getPurchasesAsync(),
      getProductsAsync()
    ]);
    setSuppliers(suppliersData);
    setPurchases(purchasesData);
    setProducts(productsData);
    setLoading(false);
  };

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const totalPurchases = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.total, 0);
  }, [purchases]);

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else {
      setSelectedSupplier(null);
      setFormData({ name: '', phone: '', address: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Nama supplier harus diisi', variant: 'destructive' });
      return;
    }

    try {
      if (selectedSupplier) {
        await updateSupplierAsync(selectedSupplier.id, formData);
        toast({ title: 'Berhasil', description: 'Supplier diperbarui' });
      } else {
        await saveSupplierAsync(formData);
        toast({ title: 'Berhasil', description: 'Supplier ditambahkan' });
      }
      await loadData();
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan supplier', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    
    await deleteSupplierAsync(selectedSupplier.id);
    toast({ title: 'Berhasil', description: 'Supplier dihapus' });
    await loadData();
    setDeleteDialogOpen(false);
    setSelectedSupplier(null);
  };

  const handleOpenPurchaseDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPurchaseItems([]);
    setPurchaseNotes('');
    setSelectedProductId('');
    setItemQty('1');
    setItemPrice('');
    setPurchaseDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedProductId || !itemPrice) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(itemQty) || 1;
    const price = parseFloat(itemPrice) || 0;
    
    setPurchaseItems([...purchaseItems, {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      pricePerUnit: price,
      subtotal: qty * price,
    }]);

    setSelectedProductId('');
    setItemQty('1');
    setItemPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleSavePurchase = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      toast({ title: 'Error', description: 'Tambahkan minimal 1 item', variant: 'destructive' });
      return;
    }

    try {
      await savePurchaseAsync({
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        items: purchaseItems,
        total: purchaseItems.reduce((sum, i) => sum + i.subtotal, 0),
        notes: purchaseNotes || undefined,
      });
      
      toast({ title: 'Berhasil', description: 'Pembelian dicatat dan stok diperbarui' });
      await loadData();
      setPurchaseDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan pembelian', variant: 'destructive' });
    }
  };

  const purchaseTotal = useMemo(() => {
    return purchaseItems.reduce((sum, i) => sum + i.subtotal, 0);
  }, [purchaseItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Supplier</h1>
          <p className="text-sm text-muted-foreground">Kelola supplier dan pembelian barang</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Total Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{suppliers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{purchases.length}</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nilai Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalPurchases)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Daftar Supplier</TabsTrigger>
          <TabsTrigger value="purchases">Riwayat Pembelian</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {suppliers.length === 0 ? 'Belum ada supplier' : 'Tidak ditemukan'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{supplier.address || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenPurchaseDialog(supplier)}
                            title="Catat Pembelian"
                          >
                            <Package className="w-4 h-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenDialog(supplier)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Belum ada riwayat pembelian
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{new Date(purchase.createdAt).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {purchase.items.map((item, i) => (
                            <div key={i}>{item.productName} x{item.quantity}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(purchase.total)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{purchase.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama supplier"
              />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <Label>Alamat</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Catat Pembelian - {selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add Item */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="Qty"
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="Harga"
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleAddItem} className="w-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Items List */}
            {purchaseItems.length > 0 && (
              <div className="border rounded-lg divide-y">
                {purchaseItems.map((item, i) => (
                  <div key={i} className="p-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.pricePerUnit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(purchaseTotal)}</span>
                </div>
              </div>
            )}

            <div>
              <Label>Catatan</Label>
              <Textarea
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="Catatan pembelian (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSavePurchase} disabled={purchaseItems.length === 0}>
              Simpan & Update Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Supplier "{selectedSupplier?.name}" akan dihapus. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
