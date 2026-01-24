import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Percent, AlertCircle, RefreshCw, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PriceInput } from '@/components/ui/price-input';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { cn } from '@/lib/utils';

interface TierInput {
  id: string;
  minPrice: string;
  maxPrice: string;
  noMaxLimit: boolean;
  retailMarkup: string;
  wholesaleMarkup: string;
  retailMarkupFixed: string;
  wholesaleMarkupFixed: string;
}

export function PricingPage() {
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingRule, setEditingRule] = useState<MarkupRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [markupType, setMarkupType] = useState<MarkupType>('percent');
  const [retailMarkup, setRetailMarkup] = useState('');
  const [wholesaleMarkup, setWholesaleMarkup] = useState('');
  const [retailMarkupFixed, setRetailMarkupFixed] = useState('');
  const [wholesaleMarkupFixed, setWholesaleMarkupFixed] = useState('');
  const [noMaxLimit, setNoMaxLimit] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  
  const [batchCategoryId, setBatchCategoryId] = useState<string>('all');
  const [batchMarkupType, setBatchMarkupType] = useState<MarkupType>('percent');
  const [tiers, setTiers] = useState<TierInput[]>([]);

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

  
  const groupedRules = useMemo(() => {
    const groups: { [key: string]: { categoryId: string | null; categoryName: string; rules: MarkupRule[] } } = {};
    
    
    const generalRules = rules.filter(r => r.categoryId === null).sort((a, b) => a.minPrice - b.minPrice);
    if (generalRules.length > 0) {
      groups['__all__'] = {
        categoryId: null,
        categoryName: 'Semua Produk',
        rules: generalRules,
      };
    }
    
    
    for (const rule of rules) {
      if (rule.categoryId) {
        if (!groups[rule.categoryId]) {
          groups[rule.categoryId] = {
            categoryId: rule.categoryId,
            categoryName: getCategoryName(rule.categoryId),
            rules: [],
          };
        }
        groups[rule.categoryId].rules.push(rule);
      }
    }
    
    
    for (const key in groups) {
      groups[key].rules.sort((a, b) => a.minPrice - b.minPrice);
    }
    
    return groups;
  }, [rules, categories]);

  
  const categoriesWithoutRules = useMemo(() => {
    const categoriesWithRules = new Set(rules.filter(r => r.categoryId).map(r => r.categoryId));
    return categories.filter(c => !categoriesWithRules.has(c.id));
  }, [categories, rules]);

  
  const getNextMinPrice = (categoryId: string | null): number => {
    const catKey = categoryId || '__all__';
    const categoryRules = groupedRules[catKey]?.rules || [];
    
    if (categoryRules.length === 0) {
      return 0;
    }
    
    const lastRule = categoryRules[categoryRules.length - 1];
    if (lastRule.maxPrice === null) {
      return lastRule.minPrice + 100000;
    }
    return lastRule.maxPrice + 1;
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

  const handleOpenDialog = (rule?: MarkupRule, categoryId?: string | null) => {
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
      
      if (categoryId !== undefined) {
        setSelectedCategoryId(categoryId || 'all');
      }
      
      const catId = categoryId !== undefined ? categoryId : null;
      const nextMin = getNextMinPrice(catId);
      setMinPrice(nextMin.toString());
    }
    setDialogOpen(true);
  };

  
  const handleOpenBatchDialog = (categoryId?: string | null) => {
    setBatchCategoryId(categoryId || 'all');
    setBatchMarkupType('percent');
    
    
    const initialTiers: TierInput[] = [
      { id: crypto.randomUUID(), minPrice: '0', maxPrice: '50000', noMaxLimit: false, retailMarkup: '', wholesaleMarkup: '', retailMarkupFixed: '', wholesaleMarkupFixed: '' },
      { id: crypto.randomUUID(), minPrice: '50001', maxPrice: '100000', noMaxLimit: false, retailMarkup: '', wholesaleMarkup: '', retailMarkupFixed: '', wholesaleMarkupFixed: '' },
      { id: crypto.randomUUID(), minPrice: '100001', maxPrice: '', noMaxLimit: true, retailMarkup: '', wholesaleMarkup: '', retailMarkupFixed: '', wholesaleMarkupFixed: '' },
    ];
    setTiers(initialTiers);
    setBatchDialogOpen(true);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    let nextMin = '0';
    
    if (lastTier) {
      if (lastTier.noMaxLimit) {
        
        toast.error('Hapus batas "tidak terbatas" pada tier terakhir untuk menambah tier baru');
        return;
      }
      const lastMax = parseInt(lastTier.maxPrice) || 0;
      nextMin = (lastMax + 1).toString();
    }
    
    setTiers([...tiers, {
      id: crypto.randomUUID(),
      minPrice: nextMin,
      maxPrice: '',
      noMaxLimit: true,
      retailMarkup: '',
      wholesaleMarkup: '',
      retailMarkupFixed: '',
      wholesaleMarkupFixed: '',
    }]);
  };

  const removeTier = (id: string) => {
    if (tiers.length <= 1) {
      toast.error('Minimal harus ada 1 tier');
      return;
    }
    setTiers(tiers.filter(t => t.id !== id));
  };

  const updateTier = (id: string, field: keyof TierInput, value: string | boolean) => {
    setTiers(tiers.map(t => {
      if (t.id !== id) return t;
      
      const updated = { ...t, [field]: value };
      
      
      if (field === 'maxPrice' && typeof value === 'string') {
        const tierIndex = tiers.findIndex(tier => tier.id === id);
        if (tierIndex < tiers.length - 1 && value) {
          const nextMin = (parseInt(value) || 0) + 1;
          
          setTimeout(() => {
            setTiers(prev => prev.map((tier, idx) => {
              if (idx === tierIndex + 1) {
                return { ...tier, minPrice: nextMin.toString() };
              }
              return tier;
            }));
          }, 0);
        }
      }
      
      
      if (field === 'noMaxLimit' && value === true) {
        updated.maxPrice = '';
      }
      
      return updated;
    }));
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const min = parseInt(tier.minPrice) || 0;
      const max = tier.noMaxLimit ? null : (parseInt(tier.maxPrice) || null);
      
      if (min < 0) {
        toast.error(`Tier ${i + 1}: Harga minimum tidak boleh negatif`);
        return;
      }
      if (max !== null && max <= min) {
        toast.error(`Tier ${i + 1}: Harga maksimum harus lebih besar dari minimum`);
        return;
      }
      
      if (batchMarkupType === 'percent') {
        const retail = parseFloat(tier.retailMarkup) || 0;
        const wholesale = parseFloat(tier.wholesaleMarkup) || 0;
        if (retail < 0 || wholesale < 0) {
          toast.error(`Tier ${i + 1}: Persentase markup tidak boleh negatif`);
          return;
        }
      } else {
        const retailFixed = parseInt(tier.retailMarkupFixed) || 0;
        const wholesaleFixed = parseInt(tier.wholesaleMarkupFixed) || 0;
        if (retailFixed < 0 || wholesaleFixed < 0) {
          toast.error(`Tier ${i + 1}: Markup rupiah tidak boleh negatif`);
          return;
        }
      }
    }
    
    
    const categoryId = batchCategoryId === 'all' ? null : batchCategoryId;
    
    for (const tier of tiers) {
      const min = parseInt(tier.minPrice) || 0;
      const max = tier.noMaxLimit ? null : (parseInt(tier.maxPrice) || null);
      
      addMarkupRule({
        minPrice: min,
        maxPrice: max,
        markupType: batchMarkupType,
        retailMarkupPercent: parseFloat(tier.retailMarkup) || 0,
        wholesaleMarkupPercent: parseFloat(tier.wholesaleMarkup) || 0,
        retailMarkupFixed: parseInt(tier.retailMarkupFixed) || 0,
        wholesaleMarkupFixed: parseInt(tier.wholesaleMarkupFixed) || 0,
        categoryId,
      });
    }
    
    toast.success(`Berhasil menambahkan ${tiers.length} aturan markup`);
    loadRules();
    setBatchDialogOpen(false);
    
    
    setExpandedCategory(categoryId || '__all__');
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
          const category = allCategories.find(c => c.name === product.category);
          const categoryId = category?.id || null;
          
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pengaturan Harga Jual</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Atur markup otomatis berdasarkan kategori dan rentang harga modal
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
        </div>
      </div>

      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Pilih kategori untuk mengatur aturan markup. <strong>Aturan per kategori memiliki prioritas lebih tinggi</strong> dari aturan "Semua Produk".
        </AlertDescription>
      </Alert>

      
      {(categoriesWithoutRules.length > 0 || !groupedRules['__all__']) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Tambah Aturan Markup
            </CardTitle>
            <CardDescription>
              Pilih kategori untuk membuat aturan markup baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              
              {!groupedRules['__all__'] && (
                <button
                  onClick={() => handleOpenBatchDialog(null)}
                  className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-center group"
                >
                  <Layers className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                  <p className="font-medium text-sm">Semua Produk</p>
                  <p className="text-xs text-muted-foreground mt-1">Aturan default</p>
                </button>
              )}
              
              
              {categoriesWithoutRules.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleOpenBatchDialog(cat.id)}
                  className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-center group"
                >
                  <Percent className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Belum ada aturan</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      
      {Object.keys(groupedRules).length === 0 && categoriesWithoutRules.length === 0 && !categories.length && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Percent className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada kategori produk</p>
              <p className="text-sm mt-1">Buat kategori terlebih dahulu di menu Produk</p>
            </div>
          </CardContent>
        </Card>
      )}

      
      {Object.keys(groupedRules).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Aturan Markup Aktif</h3>
          {Object.entries(groupedRules).map(([key, group]) => (
            <Collapsible
              key={key}
              open={expandedCategory === key}
              onOpenChange={(open) => setExpandedCategory(open ? key : null)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronRight className={cn(
                          "w-5 h-5 transition-transform",
                          expandedCategory === key && "rotate-90"
                        )} />
                        <Badge variant={group.categoryId ? "default" : "secondary"} className="text-sm">
                          {group.categoryName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {group.rules.length} aturan
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rentang Harga Modal</TableHead>
                            <TableHead className="text-center">Tipe</TableHead>
                            <TableHead className="text-center">Markup Satuan</TableHead>
                            <TableHead className="text-center">Markup Grosir</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.rules.map((rule) => {
                            const markup = formatMarkupDisplay(rule);
                            return (
                              <TableRow key={rule.id}>
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
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDialog(undefined, group.categoryId)}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Aturan
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      
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
              </div>

              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Harga Minimum</Label>
                  <PriceInput
                    id="minPrice"
                    value={minPrice}
                    onChange={setMinPrice}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Harga Maksimum</Label>
                  <PriceInput
                    id="maxPrice"
                    value={maxPrice}
                    onChange={setMaxPrice}
                    placeholder="Tidak terbatas"
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
                    <PriceInput
                      id="retailMarkupFixed"
                      value={retailMarkupFixed}
                      onChange={setRetailMarkupFixed}
                      placeholder="5.000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wholesaleMarkupFixed">Markup Grosir (Rp)</Label>
                    <PriceInput
                      id="wholesaleMarkupFixed"
                      value={wholesaleMarkupFixed}
                      onChange={setWholesaleMarkupFixed}
                      placeholder="3.000"
                    />
                  </div>
                </div>
              )}

              
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

      
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Buat Aturan Markup Bertingkat
            </DialogTitle>
            <DialogDescription>
              Buat beberapa aturan markup sekaligus untuk{' '}
              <Badge variant={batchCategoryId === 'all' ? 'secondary' : 'default'}>
                {batchCategoryId === 'all' ? 'Semua Produk' : getCategoryName(batchCategoryId)}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBatchSubmit}>
            <div className="space-y-4 py-4">
              
              <div className="space-y-2">
                <Label>Tipe Markup</Label>
                <Select value={batchMarkupType} onValueChange={(v) => setBatchMarkupType(v as MarkupType)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Rupiah Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              
              <div className="space-y-3">
                <Label>Tingkatan Harga</Label>
                {tiers.map((tier, index) => (
                  <Card key={tier.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Harga Min</Label>
                            <PriceInput
                              value={tier.minPrice}
                              onChange={(v) => updateTier(tier.id, 'minPrice', v)}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Harga Max</Label>
                            <PriceInput
                              value={tier.maxPrice}
                              onChange={(v) => updateTier(tier.id, 'maxPrice', v)}
                              placeholder="Tidak terbatas"
                              disabled={tier.noMaxLimit}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`noLimit-${tier.id}`}
                            checked={tier.noMaxLimit}
                            onChange={(e) => updateTier(tier.id, 'noMaxLimit', e.target.checked)}
                            className="rounded border-input"
                          />
                          <Label htmlFor={`noLimit-${tier.id}`} className="text-xs font-normal cursor-pointer">
                            Tidak terbatas
                          </Label>
                        </div>

                        
                        <div className="grid grid-cols-2 gap-3">
                          {batchMarkupType === 'percent' ? (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Markup Satuan (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="100"
                                  value={tier.retailMarkup}
                                  onChange={(e) => updateTier(tier.id, 'retailMarkup', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Markup Grosir (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="50"
                                  value={tier.wholesaleMarkup}
                                  onChange={(e) => updateTier(tier.id, 'wholesaleMarkup', e.target.value)}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Markup Satuan (Rp)</Label>
                                <PriceInput
                                  value={tier.retailMarkupFixed}
                                  onChange={(v) => updateTier(tier.id, 'retailMarkupFixed', v)}
                                  placeholder="5.000"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Markup Grosir (Rp)</Label>
                                <PriceInput
                                  value={tier.wholesaleMarkupFixed}
                                  onChange={(v) => updateTier(tier.id, 'wholesaleMarkupFixed', v)}
                                  placeholder="3.000"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTier(tier.id)}
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTier}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Tingkatan
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBatchDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Simpan {tiers.length} Aturan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      
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
