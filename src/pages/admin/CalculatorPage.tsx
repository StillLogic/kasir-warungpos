import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Copy, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { getMarkupForPrice, getMarkupRules } from '@/database/markup';
import { getCategories } from '@/database/categories';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCalculator } from '@/components/admin/MobileCalculator';

export function CalculatorPage() {
  const isMobile = useIsMobile();
  
  // Show mobile calculator on mobile devices
  if (isMobile) {
    return <MobileCalculator />;
  }

  return <DesktopCalculator />;
}

function DesktopCalculator() {
  const { toast } = useToast();
  const [costPrice, setCostPrice] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__');

  const categories = useMemo(() => getCategories(), []);
  const markupRules = useMemo(() => getMarkupRules(), []);

  const cost = parseFloat(costPrice) || 0;
  
  // Get markup from rules based on cost price and category
  const markup = useMemo(() => {
    if (cost <= 0) return null;
    const categoryId = selectedCategory === '__all__' ? null : selectedCategory;
    return getMarkupForPrice(cost, categoryId);
  }, [cost, selectedCategory]);

  const retailMarkup = markup?.retailPercent || 0;
  const wholesaleMarkupPercent = markup?.wholesalePercent || 0;

  const retailPrice = cost + (cost * retailMarkup / 100);
  const wholesalePrice = cost + (cost * wholesaleMarkupPercent / 100);
  const retailProfit = retailPrice - cost;
  const wholesaleProfit = wholesalePrice - cost;

  // Find which rule is being applied
  const appliedRule = useMemo(() => {
    if (!markup || cost <= 0) return null;
    const categoryId = selectedCategory === '__all__' ? null : selectedCategory;
    
    // Find matching rule
    for (const rule of markupRules) {
      // Check category-specific first
      if (categoryId && rule.categoryId === categoryId) {
        const minMatch = cost >= rule.minPrice;
        const maxMatch = rule.maxPrice === null || cost <= rule.maxPrice;
        if (minMatch && maxMatch) {
          const category = categories.find(c => c.id === rule.categoryId);
          return { ...rule, categoryName: category?.name };
        }
      }
    }
    
    // Fallback to general rules
    for (const rule of markupRules) {
      if (rule.categoryId !== null) continue;
      const minMatch = cost >= rule.minPrice;
      const maxMatch = rule.maxPrice === null || cost <= rule.maxPrice;
      if (minMatch && maxMatch) {
        return { ...rule, categoryName: null };
      }
    }
    
    return null;
  }, [cost, selectedCategory, markupRules, categories, markup]);

  const handleReset = () => {
    setCostPrice('');
    setSelectedCategory('__all__');
  };

  const copyToClipboard = (value: number, label: string) => {
    navigator.clipboard.writeText(Math.round(value).toString());
    toast({
      title: 'Disalin!',
      description: `${label}: ${formatCurrency(value)} telah disalin ke clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kalkulator Harga Jual</h2>
        <p className="text-muted-foreground">
          Hitung harga jual otomatis berdasarkan aturan markup yang sudah dibuat
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Result Section - Now First */}
        <Card>
          <CardHeader>
            <CardTitle>Hasil Perhitungan</CardTitle>
            <CardDescription>
              Klik pada harga untuk menyalin ke clipboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!markup && cost > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tidak ada aturan markup yang cocok.{' '}
                  <Link to="/admin/pricing" className="underline font-medium">
                    Tambah aturan markup
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {/* Retail Price */}
            <div className="p-4 rounded-lg bg-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Harga Jual Eceran</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(retailPrice, 'Harga Eceran')}
                  disabled={!cost || !markup}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(retailPrice)}
              </p>
              <p className="text-sm text-muted-foreground">
                Profit: {formatCurrency(retailProfit)} ({retailMarkup}%)
              </p>
            </div>

            {/* Wholesale Price */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Harga Jual Grosir</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wholesalePrice, 'Harga Grosir')}
                  disabled={!cost || !markup}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(wholesalePrice)}
              </p>
              <p className="text-sm text-muted-foreground">
                Profit: {formatCurrency(wholesaleProfit)} ({wholesaleMarkupPercent}%)
              </p>
            </div>

            {/* Summary */}
            {cost > 0 && markup && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium">Ringkasan</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Harga Modal:</span>
                  <span className="font-medium text-right">{formatCurrency(cost)}</span>
                  
                  <span className="text-muted-foreground">Selisih Eceran-Grosir:</span>
                  <span className="font-medium text-right">{formatCurrency(retailPrice - wholesalePrice)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Section - Now Second */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Input Perhitungan
            </CardTitle>
            <CardDescription>
              Masukkan harga modal, markup akan otomatis diambil dari aturan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Harga Modal (Rp)</Label>
              <Input
                id="costPrice"
                type="number"
                placeholder="Contoh: 10000"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori (Opsional)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pilih kategori untuk menggunakan aturan markup khusus kategori
              </p>
            </div>

            {/* Applied Rule Info */}
            {cost > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="w-4 h-4" />
                  Aturan yang Diterapkan
                </div>
                {appliedRule ? (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Rentang: {formatCurrency(appliedRule.minPrice)} - {appliedRule.maxPrice ? formatCurrency(appliedRule.maxPrice) : '∞'}
                    </p>
                    <p>
                      Eceran: {appliedRule.retailMarkupPercent}% | Grosir: {appliedRule.wholesaleMarkupPercent}%
                    </p>
                    {appliedRule.categoryName && (
                      <p className="text-primary">Kategori: {appliedRule.categoryName}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    Tidak ada aturan yang cocok untuk harga ini
                  </p>
                )}
              </div>
            )}

            <Button variant="outline" onClick={handleReset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Markup Rules Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Aturan Markup</CardTitle>
          <CardDescription>
            Aturan markup yang tersedia dari menu Harga Jual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {markupRules.length > 0 ? (
            <div className="space-y-2">
              {markupRules.map((rule) => {
                const category = categories.find(c => c.id === rule.categoryId);
                return (
                  <div
                    key={rule.id}
                    className="p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(rule.minPrice)} - {rule.maxPrice ? formatCurrency(rule.maxPrice) : '∞'}
                      </p>
                      {category && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {category.name}
                        </span>
                      )}
                      {!rule.categoryId && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Semua Kategori
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p>Eceran: <span className="font-medium">{rule.retailMarkupPercent}%</span></p>
                      <p>Grosir: <span className="font-medium">{rule.wholesaleMarkupPercent}%</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">Belum ada aturan markup</p>
              <Button asChild variant="outline">
                <Link to="/admin/pricing">Buat Aturan Markup</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
