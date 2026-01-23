import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Percent, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MarkupRule, MarkupType } from '@/types/markup';
import { 
  getMarkupRules, 
  addMarkupRule, 
  updateMarkupRule, 
  deleteMarkupRule,
  calculateSellingPrices,
} from '@/database/markup';
import { getProducts, updateProduct, waitForProducts } from '@/database';
import { getCategories, Category } from '@/database/categories';
import { formatCurrency, roundToThousand } from '@/lib/format';
import { toast } from 'sonner';

export function PricingPage() {
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingRule, setEditingRule] = useState<MarkupRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  
  // Form state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [markupType, setMarkupType] = useState<MarkupType>('percent');
  const [retailMarkup, setRetailMarkup] = useState('');
  const [wholesaleMarkup, setWholesaleMarkup] = useState('');
  const [retailMarkupFixed, setRetailMarkupFixed] = useState('');
  const [wholesaleMarkupFixed, setWholesaleMarkupFixed] = useState('');
  const [noMaxLimit, setNoMaxLimit] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  useEffect(() => {
    loadRules();
    setCategories(getCategories());
  }, []);

  const loadRules = () => {
    setRules(getMarkupRules());
  };

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Semua Produk';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Kategori tidak ditemukan';
  };

  const resetForm = () => {
    setMinPrice('');
    setMaxPrice('');
    setMarkupType('percent');
    setRetailMarkup('');
    setWholesaleMarkup('');
    setRetailMarkupFixed('');
    setWholesaleMarkupFixed('');
    setNoMaxLimit(false);
    setSelectedCategoryId('all');
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: MarkupRule) => {
    if (rule) {
      setEditingRule(rule);
      setMinPrice(rule.minPrice.toString());
      setMaxPrice(rule.maxPrice?.toString() || '');
      setMarkupType(rule.markupType || 'percent');
      setRetailMarkup(rule.retailMarkupPercent.toString());
      setWholesaleMarkup(rule.wholesaleMarkupPercent.toString());
      setRetailMarkupFixed((rule.retailMarkupFixed || 0).toString());
      setWholesaleMarkupFixed((rule.wholesaleMarkupFixed || 0).toString());
      setNoMaxLimit(rule.maxPrice === null);
      setSelectedCategoryId(rule.categoryId || 'all');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const min = parseInt(minPrice) || 0;
    const max = noMaxLimit ? null : (parseInt(maxPrice) || null);
    const retail = parseFloat(retailMarkup) || 0;
    const wholesale = parseFloat(wholesaleMarkup) || 0;
    const retailFixed = parseInt(retailMarkupFixed) || 0;
    const wholesaleFixed = parseInt(wholesaleMarkupFixed) || 0;

    // Validation
    if (min < 0) {
      toast.error('Harga minimum tidak boleh negatif');
      return;
    }
    if (max !== null && max <= min) {
      toast.error('Harga maksimum harus lebih besar dari harga minimum');
      return;
    }
    if (markupType === 'percent' && (retail < 0 || wholesale < 0)) {
      toast.error('Persentase markup tidak boleh negatif');
      return;
    }
    if (markupType === 'fixed' && (retailFixed < 0 || wholesaleFixed < 0)) {
      toast.error('Markup rupiah tidak boleh negatif');
      return;
    }

    const data = {
      minPrice: min,
      maxPrice: max,
      markupType,
      retailMarkupPercent: retail,
      wholesaleMarkupPercent: wholesale,
      retailMarkupFixed: retailFixed,
      wholesaleMarkupFixed: wholesaleFixed,
      categoryId: selectedCategoryId === 'all' ? null : selectedCategoryId,
    };

    if (editingRule) {
      updateMarkupRule(editingRule.id, data);
      toast.success('Aturan markup berhasil diperbarui');
    } else {
      addMarkupRule(data);
      toast.success('Aturan markup berhasil ditambahkan');
    }

    loadRules();
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (deletingRuleId) {
      deleteMarkupRule(deletingRuleId);
      toast.success('Aturan markup berhasil dihapus');
      loadRules();
    }
    setDeleteDialogOpen(false);
    setDeletingRuleId(null);
  };

  const confirmDelete = (id: string) => {
    setDeletingRuleId(id);
    setDeleteDialogOpen(true);
  };

  const handleBulkUpdate = async () => {
    setIsUpdating(true);
    try {
      await waitForProducts();
      const products = getProducts();
      const allCategories = getCategories();
      let updatedCount = 0;
      let skippedCount = 0;

      for (const product of products) {
        if (product.costPrice > 0) {
          // Find category ID by name
          const category = allCategories.find(c => c.name === product.category);
          const categoryId = category?.id || null;
          
          // Calculate prices with category priority
          const prices = calculateSellingPrices(product.costPrice, categoryId);
          if (prices) {
            updateProduct(product.id, {
              retailPrice: prices.retailPrice,
              wholesalePrice: prices.wholesalePrice,
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      if (updatedCount > 0) {
        toast.success(`Berhasil update harga ${updatedCount} produk`);
      }
      if (skippedCount > 0) {
        toast.info(`${skippedCount} produk dilewati (tidak ada harga modal atau aturan markup)`);
      }
    } catch (error) {
      toast.error('Gagal update harga massal');
    } finally {
      setIsUpdating(false);
      setBulkUpdateDialogOpen(false);
    }
  };

  const formatPriceRange = (min: number, max: number | null) => {
    if (max === null) {
      return `${formatCurrency(min)} ke atas`;
    }
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const formatMarkupDisplay = (rule: MarkupRule) => {
    if (rule.markupType === 'fixed') {
      return {
        retail: formatCurrency(rule.retailMarkupFixed || 0),
        wholesale: formatCurrency(rule.wholesaleMarkupFixed || 0),
        isFixed: true,
      };
    }
    return {
      retail: `+${rule.retailMarkupPercent}%`,
      wholesale: `+${rule.wholesaleMarkupPercent}%`,
      isFixed: false,
    };
  };

  const calculatePreview = () => {
    const costPrice = parseInt(minPrice) || 0;
    if (costPrice === 0) return null;
    
    if (markupType === 'fixed') {
      const retailFixed = parseInt(retailMarkupFixed) || 0;
      const wholesaleFixed = parseInt(wholesaleMarkupFixed) || 0;
      return {
        retail: roundToThousand(costPrice + retailFixed),
        wholesale: roundToThousand(costPrice + wholesaleFixed),
      };
    }
    
    const retail = parseFloat(retailMarkup) || 0;
    const wholesale = parseFloat(wholesaleMarkup) || 0;
    return {
      retail: roundToThousand(costPrice * (1 + retail / 100)),
      wholesale: roundToThousand(costPrice * (1 + wholesale / 100)),
    };
  };

  const preview = calculatePreview();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pengaturan Harga Jual</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Atur markup otomatis berdasarkan rentang harga modal
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setBulkUpdateDialogOpen(true)} 
            className="gap-2"
            disabled={rules.length === 0}
          >
            <RefreshCw className="w-4 h-4" />
            Update Harga Massal
          </Button>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Aturan
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Sistem akan otomatis menghitung harga jual berdasarkan harga modal dan markup (persen atau rupiah).
          <strong> Aturan per kategori memiliki prioritas lebih tinggi</strong> dari aturan umum (Semua Produk).
        </AlertDescription>
      </Alert>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Aturan Markup</CardTitle>
          <CardDescription>
            Aturan diurutkan berdasarkan harga minimum terendah
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Percent className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada aturan markup</p>
              <p className="text-sm mt-1">Klik "Tambah Aturan" untuk membuat aturan pertama</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Rentang Harga Modal</TableHead>
                    <TableHead className="text-center">Tipe</TableHead>
                    <TableHead className="text-center">Markup Satuan</TableHead>
                    <TableHead className="text-center">Markup Grosir</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    const markup = formatMarkupDisplay(rule);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Badge variant={rule.categoryId ? "default" : "secondary"}>
                            {getCategoryName(rule.categoryId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPriceRange(rule.minPrice, rule.maxPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {rule.markupType === 'fixed' ? 'Rupiah' : 'Persen'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                            markup.isFixed 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {markup.isFixed ? '+' : ''}{markup.retail}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                            markup.isFixed 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {markup.isFixed ? '+' : ''}{markup.wholesale}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenDialog(rule)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete(rule.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Aturan Markup' : 'Tambah Aturan Markup'}
            </DialogTitle>
            <DialogDescription>
              Tentukan rentang harga modal dan markup (persen atau rupiah)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Berlaku Untuk</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Produk</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aturan per kategori akan diprioritaskan dari aturan "Semua Produk"
                </p>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Harga Minimum</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Harga Maksimum</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min="0"
                    placeholder="Tidak terbatas"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    disabled={noMaxLimit}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="noMaxLimit"
                  checked={noMaxLimit}
                  onChange={(e) => {
                    setNoMaxLimit(e.target.checked);
                    if (e.target.checked) setMaxPrice('');
                  }}
                  className="rounded border-input"
                />
                <Label htmlFor="noMaxLimit" className="text-sm font-normal cursor-pointer">
                  Tidak ada batas maksimum (ke atas)
                </Label>
              </div>

              {/* Markup Type Selection */}
              <div className="space-y-2">
                <Label>Tipe Markup</Label>
                <Select value={markupType} onValueChange={(v) => setMarkupType(v as MarkupType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Rupiah Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Markup Values - Conditional based on type */}
              {markupType === 'percent' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="retailMarkup">Markup Satuan (%)</Label>
                    <Input
                      id="retailMarkup"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="100"
                      value={retailMarkup}
                      onChange={(e) => setRetailMarkup(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wholesaleMarkup">Markup Grosir (%)</Label>
                    <Input
                      id="wholesaleMarkup"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="50"
                      value={wholesaleMarkup}
                      onChange={(e) => setWholesaleMarkup(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="retailMarkupFixed">Markup Satuan (Rp)</Label>
                    <Input
                      id="retailMarkupFixed"
                      type="number"
                      min="0"
                      placeholder="5000"
                      value={retailMarkupFixed}
                      onChange={(e) => setRetailMarkupFixed(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wholesaleMarkupFixed">Markup Grosir (Rp)</Label>
                    <Input
                      id="wholesaleMarkupFixed"
                      type="number"
                      min="0"
                      placeholder="3000"
                      value={wholesaleMarkupFixed}
                      onChange={(e) => setWholesaleMarkupFixed(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Contoh Kalkulasi:</p>
                  <p className="text-muted-foreground">
                    Harga modal {formatCurrency(parseInt(minPrice) || 0)} → 
                    Harga satuan {formatCurrency(preview.retail)} | 
                    Harga grosir {formatCurrency(preview.wholesale)}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit">
                {editingRule ? 'Simpan Perubahan' : 'Tambah Aturan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Aturan Markup?</AlertDialogTitle>
            <AlertDialogDescription>
              Aturan ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Confirmation */}
      <AlertDialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Harga Jual Massal?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua produk yang memiliki harga modal akan diupdate harga jualnya berdasarkan aturan markup yang berlaku.
              <br /><br />
              <strong>Catatan:</strong> Harga jual yang sudah ada akan ditimpa dengan perhitungan baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Update Semua'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
