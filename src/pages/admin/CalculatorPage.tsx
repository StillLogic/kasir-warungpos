import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Copy, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

export function CalculatorPage() {
  const { toast } = useToast();
  const [costPrice, setCostPrice] = useState<string>('');
  const [markupPercent, setMarkupPercent] = useState<string>('');
  const [wholesaleMarkup, setWholesaleMarkup] = useState<string>('');

  const cost = parseFloat(costPrice) || 0;
  const retailMarkup = parseFloat(markupPercent) || 0;
  const wholesaleMarkupPercent = parseFloat(wholesaleMarkup) || 0;

  const retailPrice = cost + (cost * retailMarkup / 100);
  const wholesalePrice = cost + (cost * wholesaleMarkupPercent / 100);
  const retailProfit = retailPrice - cost;
  const wholesaleProfit = wholesalePrice - cost;

  const handleReset = () => {
    setCostPrice('');
    setMarkupPercent('');
    setWholesaleMarkup('');
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
          Hitung harga jual berdasarkan harga modal dan persentase markup
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Input Perhitungan
            </CardTitle>
            <CardDescription>
              Masukkan harga modal dan persentase markup yang diinginkan
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
              <Label htmlFor="markupPercent">Markup Eceran (%)</Label>
              <Input
                id="markupPercent"
                type="number"
                placeholder="Contoh: 20"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesaleMarkup">Markup Grosir (%)</Label>
              <Input
                id="wholesaleMarkup"
                type="number"
                placeholder="Contoh: 10"
                value={wholesaleMarkup}
                onChange={(e) => setWholesaleMarkup(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <Button variant="outline" onClick={handleReset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hasil Perhitungan</CardTitle>
            <CardDescription>
              Klik pada harga untuk menyalin ke clipboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Retail Price */}
            <div className="p-4 rounded-lg bg-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Harga Jual Eceran</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(retailPrice, 'Harga Eceran')}
                  disabled={!cost}
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
                  disabled={!cost}
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
            {cost > 0 && (
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
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Referensi Cepat Markup</CardTitle>
          <CardDescription>
            Contoh perhitungan dengan berbagai persentase markup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cost > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {[5, 10, 15, 20, 25, 30, 40, 50].map((percent) => {
                const price = cost + (cost * percent / 100);
                return (
                  <button
                    key={percent}
                    onClick={() => copyToClipboard(price, `Markup ${percent}%`)}
                    className="p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <p className="text-sm text-muted-foreground">Markup {percent}%</p>
                    <p className="font-semibold">{formatCurrency(price)}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Masukkan harga modal untuk melihat referensi markup
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
