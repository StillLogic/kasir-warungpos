import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy, Delete, Info, Plus, Minus, X, Divide, Equal, RotateCcw } from "lucide-react";
import { formatCurrency, roundToThousand } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { getMarkupForPrice, getMarkupRules } from "@/database/markup";
import { getCategories } from "@/database/categories";
import { cn } from "@/lib/utils";

type Operator = "+" | "-" | "×" | "÷" | null;

export function DesktopCalculator() {
  const { toast } = useToast();
  const [display, setDisplay] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__");

  const categories = useMemo(() => getCategories(), []);
  const markupRules = useMemo(() => getMarkupRules(), []);

  const cost = parseFloat(display) || 0;

  const markup = useMemo(() => {
    if (cost <= 0) return null;
    const categoryId = selectedCategory === "__all__" ? null : selectedCategory;
    return getMarkupForPrice(cost, categoryId);
  }, [cost, selectedCategory]);

  const isFixedMarkup = markup?.type === "fixed";

  let rawRetailPrice: number;
  let rawWholesalePrice: number;

  if (isFixedMarkup) {
    rawRetailPrice = cost + (markup?.retailFixed || 0);
    rawWholesalePrice = cost + (markup?.wholesaleFixed || 0);
  } else {
    rawRetailPrice = cost + (cost * (markup?.retailPercent || 0)) / 100;
    rawWholesalePrice = cost + (cost * (markup?.wholesalePercent || 0)) / 100;
  }

  const retailPrice = roundToThousand(rawRetailPrice);
  const wholesalePrice = roundToThousand(rawWholesalePrice);

  const appliedRule = useMemo(() => {
    if (!markup || cost <= 0) return null;
    const categoryId = selectedCategory === "__all__" ? null : selectedCategory;

    for (const rule of markupRules) {
      if (categoryId && rule.categoryId === categoryId) {
        const minMatch = cost >= rule.minPrice;
        const maxMatch = rule.maxPrice === null || cost <= rule.maxPrice;
        if (minMatch && maxMatch) {
          const category = categories.find((c) => c.id === rule.categoryId);
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
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay((prev) => {
        if (prev === "0") return num;
        if (prev.length >= 15) return prev;
        return prev + num;
      });
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setSelectedCategory("__all__");
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    setDisplay((prev) => {
      if (prev.length === 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const handleTripleZero = () => {
    if (waitingForOperand) {
      setDisplay("0");
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => {
      if (prev === "0") return prev;
      if (prev.length >= 12) return prev;
      return prev + "000";
    });
  };

  const handleDoubleZero = () => {
    if (waitingForOperand) {
      setDisplay("0");
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => {
      if (prev === "0") return prev;
      if (prev.length >= 13) return prev;
      return prev + "00";
    });
  };

  const calculate = (left: number, right: number, op: Operator): number => {
    switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "×":
        return left * right;
      case "÷":
        return right !== 0 ? left / right : 0;
      default:
        return right;
    }
  };

  const handleOperator = (nextOperator: Operator) => {
    const inputValue = parseFloat(display) || 0;

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(Math.round(result)));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    if (operator === null || previousValue === null) return;

    const inputValue = parseFloat(display) || 0;
    const result = calculate(previousValue, inputValue, operator);
    
    setDisplay(String(Math.round(result)));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const copyToClipboard = (value: number, label: string) => {
    navigator.clipboard.writeText(Math.round(value).toString());
    toast({
      title: "Disalin!",
      description: `${label}: ${formatCurrency(value)}`,
    });
  };

  // Expression display for showing pending operation
  const expressionDisplay = previousValue !== null && operator
    ? `${formatCurrency(previousValue)} ${operator}`
    : null;

  const numpadButtons = [
    { label: "7", action: () => handleNumber("7") },
    { label: "8", action: () => handleNumber("8") },
    { label: "9", action: () => handleNumber("9") },
    { label: <Divide className="w-5 h-5" />, action: () => handleOperator("÷"), variant: "secondary" as const },
    { label: "4", action: () => handleNumber("4") },
    { label: "5", action: () => handleNumber("5") },
    { label: "6", action: () => handleNumber("6") },
    { label: <X className="w-5 h-5" />, action: () => handleOperator("×"), variant: "secondary" as const },
    { label: "1", action: () => handleNumber("1") },
    { label: "2", action: () => handleNumber("2") },
    { label: "3", action: () => handleNumber("3") },
    { label: <Minus className="w-5 h-5" />, action: () => handleOperator("-"), variant: "secondary" as const },
    { label: "0", action: () => handleNumber("0") },
    { label: "00", action: handleDoubleZero, variant: "outline" as const },
    { label: "000", action: handleTripleZero, variant: "outline" as const },
    { label: <Plus className="w-5 h-5" />, action: () => handleOperator("+"), variant: "secondary" as const },
    { label: <Delete className="w-5 h-5" />, action: handleBackspace, variant: "outline" as const },
    { label: <RotateCcw className="w-5 h-5" />, action: handleClear, variant: "outline" as const },
    { label: <Equal className="w-5 h-5" />, action: handleEquals, variant: "default" as const, span: 2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Kalkulator Harga Jual
        </h2>
        <p className="text-muted-foreground">
          Hitung harga jual otomatis berdasarkan aturan markup yang sudah dibuat
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Result Section - Left */}
        <div className="space-y-4">
          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            {/* Retail */}
            <button
              onClick={() => markup && copyToClipboard(retailPrice, "Eceran")}
              disabled={!markup || cost <= 0}
              className={cn(
                "p-4 rounded-lg text-left transition-colors",
                "bg-primary/10 hover:bg-primary/20 active:bg-primary/30",
                (!markup || cost <= 0) && "opacity-50",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Eceran
                </span>
                <Copy className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-primary truncate">
                {formatCurrency(retailPrice)}
              </div>
              <div className="text-sm text-muted-foreground">
                Profit: {formatCurrency(retailPrice - cost)}
                {isFixedMarkup
                  ? ` (+${formatCurrency(markup?.retailFixed || 0)})`
                  : ` (+${markup?.retailPercent || 0}%)`}
              </div>
            </button>

            {/* Wholesale */}
            <button
              onClick={() => markup && copyToClipboard(wholesalePrice, "Grosir")}
              disabled={!markup || cost <= 0}
              className={cn(
                "p-4 rounded-lg text-left transition-colors",
                "bg-secondary/50 hover:bg-secondary/70 active:bg-secondary",
                (!markup || cost <= 0) && "opacity-50",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Grosir
                </span>
                <Copy className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold truncate">
                {formatCurrency(wholesalePrice)}
              </div>
              <div className="text-sm text-muted-foreground">
                Profit: {formatCurrency(wholesalePrice - cost)}
                {isFixedMarkup
                  ? ` (+${formatCurrency(markup?.wholesaleFixed || 0)})`
                  : ` (+${markup?.wholesalePercent || 0}%)`}
              </div>
            </button>
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
                    Rentang: {formatCurrency(appliedRule.minPrice)} -{" "}
                    {appliedRule.maxPrice
                      ? formatCurrency(appliedRule.maxPrice)
                      : "∞"}
                  </p>
                  <p>
                    {appliedRule.markupType === "fixed"
                      ? `Eceran: +${formatCurrency(appliedRule.retailMarkupFixed || 0)} | Grosir: +${formatCurrency(appliedRule.wholesaleMarkupFixed || 0)}`
                      : `Eceran: ${appliedRule.retailMarkupPercent}% | Grosir: ${appliedRule.wholesaleMarkupPercent}%`}
                  </p>
                  {appliedRule.categoryName && (
                    <p className="text-primary">
                      Kategori: {appliedRule.categoryName}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  Tidak ada aturan yang cocok.{" "}
                  <Link to="/admin/pricing" className="underline font-medium">
                    Tambah aturan markup
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Markup Rules Reference */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-medium mb-3 text-sm">Daftar Aturan Markup</h4>
            {markupRules.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {markupRules.map((rule) => {
                  const category = categories.find(
                    (c) => c.id === rule.categoryId,
                  );
                  return (
                    <div
                      key={rule.id}
                      className="p-2 rounded-lg bg-muted/50 flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(rule.minPrice)} -{" "}
                          {rule.maxPrice ? formatCurrency(rule.maxPrice) : "∞"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {category ? category.name : "Semua Kategori"}
                        </span>
                      </div>
                      <div className="text-right text-xs">
                        {rule.markupType === "fixed" ? (
                          <p>
                            +{formatCurrency(rule.retailMarkupFixed || 0)} / +{formatCurrency(rule.wholesaleMarkupFixed || 0)}
                          </p>
                        ) : (
                          <p>
                            {rule.retailMarkupPercent}% / {rule.wholesaleMarkupPercent}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-2">
                  Belum ada aturan markup
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/pricing">Buat Aturan Markup</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Input Section - Right */}
        <div className="space-y-4">
          {/* Category Selector */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-10">
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
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Harga Modal</span>
              {expressionDisplay && (
                <span className="text-sm text-muted-foreground font-mono">
                  {expressionDisplay}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold font-mono text-right truncate">
              {formatCurrency(cost)}
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-4 gap-2">
            {numpadButtons.map((btn, idx) => (
              <Button
                key={idx}
                variant={btn.variant || "outline"}
                onClick={btn.action}
                className={cn(
                  "text-xl font-semibold h-14",
                  btn.span === 2 && "col-span-2",
                )}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
