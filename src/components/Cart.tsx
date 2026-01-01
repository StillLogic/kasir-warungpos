import { CartItem } from '@/types/pos';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  total: number;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, total }: CartProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Keranjang Kosong</p>
        <p className="text-sm">Pilih produk untuk memulai transaksi</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="bg-card border border-border rounded-lg p-3 animate-fade-in"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice)}
                  {' / '}
                  {item.product.unit}
                  {item.priceType === 'wholesale' && (
                    <span className="ml-1 text-primary">(Grosir)</span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemoveItem(item.product.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                  className="w-16 h-8 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="font-semibold text-sm">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total ({items.length} item)</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
        <Button className="w-full h-12 text-lg font-semibold" onClick={onCheckout}>
          Bayar Sekarang
        </Button>
      </div>
    </div>
  );
}
