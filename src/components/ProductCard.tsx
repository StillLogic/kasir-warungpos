import { Product } from '@/types/pos';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Package, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const lowStock = product.stock <= 5;
  const outOfStock = product.stock === 0;

  return (
    <button
      onClick={onClick}
      disabled={outOfStock}
      className={cn(
        'w-full text-left bg-card border border-border rounded-lg p-4 transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]',
        outOfStock && 'opacity-50 cursor-not-allowed hover:shadow-none hover:border-border'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.sku}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="font-semibold text-primary">
              {formatCurrency(product.retailPrice)}
            </p>
            <div className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              outOfStock 
                ? 'bg-destructive/10 text-destructive'
                : lowStock 
                  ? 'bg-warning/10 text-warning'
                  : 'bg-accent text-accent-foreground'
            )}>
              {(lowStock || outOfStock) && <AlertCircle className="w-3 h-3" />}
              <span>{product.stock} {product.unit}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
