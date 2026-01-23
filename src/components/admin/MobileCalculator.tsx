import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Delete, RotateCcw, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { getMarkupForPrice, getMarkupRules } from '@/database/markup';
import { getCategories } from '@/database/categories';
import { cn } from '@/lib/utils';

export function MobileCalculator() {
  const { toast } = useToast();
  const [display, setDisplay] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__');

  const categories = useMemo(() => getCategories(), []);
  const markupRules = useMemo(() => getMarkupRules(), []);

  const cost = parseFloat(display) || 0;

  // Get markup from rules
  const markup = useMemo(() => {
    if (cost <= 0) return null;
    const categoryId = selectedCategory === '__all__' ? null : selectedCategory;
    return getMarkupForPrice(cost, categoryId);
  }, [cost, selectedCategory]);

  const retailMarkup = markup?.retailPercent || 0;
  const wholesaleMarkup = markup?.wholesalePercent || 0;
  const retailPrice = cost + (cost * retailMarkup / 100);
  const wholesalePrice = cost + (cost * wholesaleMarkup / 100);

  // Find applied rule
  const appliedRule = useMemo(() => {
    if (!markup || cost <= 0) return null;
    const categoryId = selectedCategory === '__all__' ? null : selectedCategory;
    
    for (const rule of markupRules) {
      if (categoryId && rule.categoryId === categoryId) {
        const minMatch = cost >= rule.minPrice;
        const maxMatch = rule.maxPrice === null || cost <= rule.maxPrice;
        if (minMatch && maxMatch) {
          const category = categories.find(c => c.id === rule.categoryId);
          return { ...rule, categoryName: category?.name };
        }
      }
    }
    
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

  const handleNumber = (num: string) => {
    setDisplay(prev => {
      if (prev === '0') return num;
      if (prev.length >= 15) return prev;
      return prev + num;
    });
  };

  const handleClear = () => setDisplay('0');

  const handleBackspace = () => {
    setDisplay(prev => {
      if (prev.length === 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleTripleZero = () => {
    setDisplay(prev => {
      if (prev === '0') return prev;
      if (prev.length >= 12) return prev;
      return prev + '000';
    });
  };

  const copyToClipboard = (value: number, label: string) => {
    navigator.clipboard.writeText(Math.round(value).toString());
    toast({
      title: 'Disalin!',
      description: `${label}: ${formatCurrency(value)}`,
    });
  };

  const handleDoubleZero = () => {
    setDisplay(prev => {
      if (prev === '0') return prev;
      if (prev.length >= 13) return prev;
      return prev + '00';
    });
  };

  const numpadButtons = [
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: <Delete className="w-5 h-5" />, action: handleBackspace, variant: 'secondary' as const },
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: 'C', action: handleClear, variant: 'secondary' as const },
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '000', action: handleTripleZero, variant: 'outline' as const },
    { label: '0', action: () => handleNumber('0') },
    { label: '00', action: handleDoubleZero, variant: 'outline' as const },
    { label: <RotateCcw className="w-5 h-5" />, action: () => { handleClear(); setSelectedCategory('__all__'); }, variant: 'destructive' as const, span: 2 },
  ];

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-3.5rem)]">
      {/* Display Section */}
      <div className="bg-card border-b border-border p-4 space-y-3">
        {/* Category Selector */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Kategori" />
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

        {/* Cost Display */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Harga Modal</div>
          <div className="text-2xl font-bold font-mono text-right truncate">
            {formatCurrency(cost)}
          </div>
        </div>

        {/* Applied Rule Info */}
        {cost > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Info className="w-3 h-3 shrink-0" />
            {appliedRule ? (
              <span className="truncate">
                Markup: {appliedRule.retailMarkupPercent}% / {appliedRule.wholesaleMarkupPercent}%
                {appliedRule.categoryName && ` (${appliedRule.categoryName})`}
              </span>
            ) : (
              <Link to="/admin/pricing" className="text-destructive underline">
                Tidak ada aturan markup
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-background">
        {/* Retail */}
        <button
          onClick={() => markup && copyToClipboard(retailPrice, 'Eceran')}
          disabled={!markup || cost <= 0}
          className={cn(
            "p-3 rounded-lg text-left transition-colors",
            "bg-primary/10 hover:bg-primary/20 active:bg-primary/30",
            (!markup || cost <= 0) && "opacity-50"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Eceran</span>
            <Copy className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="text-lg font-bold text-primary truncate">
            {formatCurrency(retailPrice)}
          </div>
          <div className="text-xs text-muted-foreground">
            +{retailMarkup}%
          </div>
        </button>

        {/* Wholesale */}
        <button
          onClick={() => markup && copyToClipboard(wholesalePrice, 'Grosir')}
          disabled={!markup || cost <= 0}
          className={cn(
            "p-3 rounded-lg text-left transition-colors",
            "bg-secondary/50 hover:bg-secondary/70 active:bg-secondary",
            (!markup || cost <= 0) && "opacity-50"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Grosir</span>
            <Copy className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="text-lg font-bold truncate">
            {formatCurrency(wholesalePrice)}
          </div>
          <div className="text-xs text-muted-foreground">
            +{wholesaleMarkup}%
          </div>
        </button>
      </div>

      {/* Numpad */}
      <div className="flex-1 p-3 pt-0">
        <div className="grid grid-cols-4 gap-2 h-full">
          {numpadButtons.map((btn, idx) => (
            <Button
              key={idx}
              variant={btn.variant || 'outline'}
              onClick={btn.action}
              className={cn(
                "text-xl font-semibold h-full min-h-[3.5rem]",
                btn.span === 2 && "col-span-2"
              )}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
