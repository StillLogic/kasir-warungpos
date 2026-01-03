import { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Transaction } from '@/types/pos';
import { saveTransaction, waitForProducts } from '@/database';
import { ProductCard } from '@/components/ProductCard';
import { Cart } from '@/components/Cart';
import { CheckoutDialog } from '@/components/CheckoutDialog';
import { Receipt } from '@/components/Receipt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

export function CashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const data = await waitForProducts();
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, []);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast({
        title: 'Stok Habis',
        description: `${product.name} tidak tersedia`,
        variant: 'destructive',
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => {
          if (item.product.id === product.id) {
            const newQty = item.quantity + 1;
            const isWholesale = newQty >= product.wholesaleMinQty && product.wholesalePrice > 0;
            const price = isWholesale ? product.wholesalePrice : product.retailPrice;
            return {
              ...item,
              quantity: newQty,
              priceType: isWholesale ? 'wholesale' : 'retail',
              subtotal: newQty * price,
            };
          }
          return item;
        });
      }
      return [...prev, {
        product,
        quantity: 1,
        priceType: 'retail' as const,
        subtotal: product.retailPrice,
      }];
    });

    toast({
      title: 'Ditambahkan',
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const isWholesale = quantity >= item.product.wholesaleMinQty && item.product.wholesalePrice > 0;
        const price = isWholesale ? item.product.wholesalePrice : item.product.retailPrice;
        return {
          ...item,
          quantity,
          priceType: isWholesale ? 'wholesale' : 'retail',
          subtotal: quantity * price,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutOpen(true);
  };

  const handleConfirmPayment = (payment: number) => {
    const transaction = saveTransaction({
      items: cart,
      total: cartTotal,
      payment,
      change: payment - cartTotal,
    });

    setLastTransaction(transaction);
    setCart([]);
    setCheckoutOpen(false);
    setReceiptOpen(true);

    toast({
      title: 'Transaksi Berhasil',
      description: `Pembayaran sebesar ${payment.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} diterima`,
    });

    // Refresh products to update stock
    waitForProducts().then(setProducts);
  };

  const CartContent = () => (
    <Cart
      items={cart}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeFromCart}
      onCheckout={() => {
        handleCheckout();
        if (isMobile) setCartOpen(false);
      }}
      total={cartTotal}
    />
  );

  return (
    <div className="h-full flex gap-4 lg:gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search and Filter */}
        <div className="flex gap-2 sm:gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-28 sm:w-40">
              <Filter className="w-4 h-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'Semua' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Mobile Cart Button */}
          {isMobile && (
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="default" size="icon" className="shrink-0 relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle>Keranjang Belanja</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <CartContent />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Products */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-lg font-medium">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg font-medium">Tidak ada produk</p>
              <p className="text-sm">Tambahkan produk di menu Produk</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar - Desktop Only */}
      {!isMobile && (
        <div className="w-80 lg:w-96 bg-card border border-border rounded-lg flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Keranjang Belanja</h2>
          </div>
          <CartContent />
        </div>
      )}

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmPayment}
        total={cartTotal}
        items={cart}
      />

      {/* Receipt */}
      <Receipt
        transaction={lastTransaction}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
