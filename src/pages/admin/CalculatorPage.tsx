import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, RotateCcw, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { getMarkupForPrice, getMarkupRules } from '@/database/markup';
import { getCategories } from '@/database/categories';

export function CalculatorPage() {
  const { toast } = useToast();
  const [costPrice, setCostPrice] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__');

  const categories = useMemo(() => getCategories(), []);
  const markupRules = useMemo(() => getMarkupRules(), []);

  const cost = parseFloat(costPrice) || 0;
  
  const markup = useMemo(() => {
    if (cost <= 0) return null;
    const categoryId = selectedCategory === '__all__' ? null : selectedCategory;
    return getMarkupForPrice(cost, categoryId);
  }, [cost, selectedCategory]);

  const retailMarkup = markup?.retailPercent || 0;
  const wholesaleMarkup = markup?.wholesalePercent || 0;
  const retailPrice = Math.round(cost + (cost * retailMarkup / 100));
  const wholesalePrice = Math.round(cost + (cost * wholesaleMarkup / 100));

  const handleReset = () => {
    setCostPrice('');
    setSelectedCategory('__all__');
  };

  const copyToClipboard = (value: number, label: string) => {
    navigator.clipboard.writeText(value.toString());
    toast({ title: 'Disalin!', description: `${label} telah disalin` });
  };

  const handleNumberClick = (num: string) => {
    setCostPrice(prev => prev + num);
  };

  const handleBackspace = () => {
    setCostPrice(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCostPrice('');
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold">Kalkulator Harga</h2>
        <p className="text-sm text-muted-foreground">Otomatis dari aturan markup</p>
      </div>

      {/* Display */}
      <div className="bg-card rounded-xl p-4 border space-y-3">
        {/* Cost Price Display */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Harga Modal</p>
          <Input
            type="text"
            inputMode="numeric"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            className="text-right text-2xl font-mono h-12 border-0 bg-muted/50"
          />
        </div>

        {/* Category Select */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Applied Markup Info */}
        {cost > 0 && markup && (
          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg py-1.5">
            Markup: Eceran {retailMarkup}% | Grosir {wholesaleMarkup}%
          </div>
        )}

        {/* No Rule Warning */}
        {cost > 0 && !markup && (
          <div className="flex items-center justify-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg py-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Tidak ada aturan markup. <Link to="/admin/pricing" className="underline">Tambah</Link></span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => copyToClipboard(retailPrice, 'Harga Eceran')}
          disabled={!markup || cost <= 0}
          className="bg-primary/10 hover:bg-primary/20 disabled:opacity-50 rounded-xl p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Eceran</span>
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold text-primary truncate">
            {formatCurrency(retailPrice)}
          </p>
          <p className="text-xs text-muted-foreground">
            +{formatCurrency(retailPrice - cost)}
          </p>
        </button>

        <button
          onClick={() => copyToClipboard(wholesalePrice, 'Harga Grosir')}
          disabled={!markup || cost <= 0}
          className="bg-secondary/50 hover:bg-secondary/70 disabled:opacity-50 rounded-xl p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Grosir</span>
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold truncate">
            {formatCurrency(wholesalePrice)}
          </p>
          <p className="text-xs text-muted-foreground">
            +{formatCurrency(wholesalePrice - cost)}
          </p>
        </button>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-14 text-xl font-medium"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        <Button
          variant="outline"
          className="h-14 text-xl font-medium"
          onClick={handleClear}
        >
          C
        </Button>
        <Button
          variant="outline"
          className="h-14 text-xl font-medium"
          onClick={() => handleNumberClick('0')}
        >
          0
        </Button>
        <Button
          variant="outline"
          className="h-14 text-xl font-medium"
          onClick={handleBackspace}
        >
          ⌫
        </Button>
      </div>

      {/* Reset */}
      <Button variant="ghost" onClick={handleReset} className="w-full">
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Semua
      </Button>

      {/* Rules Info */}
      {markupRules.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Belum ada aturan markup</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/pricing">Buat Aturan</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
