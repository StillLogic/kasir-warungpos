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
        'w-full text-left bg-card border border-border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]',
        outOfStock && 'opacity-50 cursor-not-allowed hover:shadow-none hover:border-border'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm sm:text-base truncate">{product.name}</h3>
          <p className="text-xs text-muted-foreground hidden sm:block">{product.sku}</p>
          <div className="flex items-center justify-between mt-1 sm:mt-2 gap-2">
            <p className="font-semibold text-sm sm:text-base text-primary">
              {formatCurrency(product.retailPrice)}
            </p>
            <div className={cn(
              'flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 rounded-full shrink-0',
              outOfStock 
                ? 'bg-destructive/10 text-destructive'
                : lowStock 
                  ? 'bg-warning/10 text-warning'
                  : 'bg-accent text-accent-foreground'
            )}>
              {(lowStock || outOfStock) && <AlertCircle className="w-3 h-3" />}
              <span>{product.stock}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
