import { useState, useEffect, useMemo } from 'react';
import { Product, Transaction } from '@/types/pos';
import { DebtPayment } from '@/types/debt';
import { waitForProducts, waitForTransactions } from '@/database';
import { getAllPayments } from '@/database/debts';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const [productsData, transactionsData, payments] = await Promise.all([
          waitForProducts(),
          waitForTransactions(),
          Promise.resolve(getAllPayments())
        ]);
        if (mounted) {
          setProducts(productsData);
          setTransactions(transactionsData);
          setDebtPayments(payments);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => { mounted = false; };
  }, []);

  // Calculate actual revenue: cash transactions + debt payments (money actually received)
  const calculateDayRevenue = (dateStr: string) => {
    // Cash transactions only
    const cashRevenue = transactions
      .filter(t => new Date(t.createdAt).toDateString() === dateStr && t.paymentType !== 'debt')
      .reduce((sum, t) => sum + t.total, 0);
    
    // Debt payments received on this day
    const paymentRevenue = debtPayments
      .filter(p => new Date(p.createdAt).toDateString() === dateStr)
      .reduce((sum, p) => sum + p.amount, 0);
    
    return cashRevenue + paymentRevenue;
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const todayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === today);
    const yesterdayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === yesterday);

    const todayRevenue = calculateDayRevenue(today);
    const yesterdayRevenue = calculateDayRevenue(yesterday);

    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : todayRevenue > 0 ? 100 : 0;

    const txChange = yesterdayTx.length > 0
      ? ((todayTx.length - yesterdayTx.length) / yesterdayTx.length) * 100
      : todayTx.length > 0 ? 100 : 0;

    const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock === 0);

    return {
      todayRevenue,
      todayTxCount: todayTx.length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      revenueChange,
      txChange,
      lowStockProducts,
      outOfStockProducts,
    };
  }, [products, transactions, debtPayments]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};

    transactions.forEach(tx => {
      tx.items.forEach(item => {
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { name: item.product.name, sold: 0, revenue: 0 };
        }
        productSales[item.product.id].sold += item.quantity;
        productSales[item.product.id].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [transactions]);

  const chartData = useMemo(() => {
    const last7Days: { date: string; revenue: number; transactions: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toDateString();
      const dayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === dateStr);
      
      last7Days.push({
        date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        revenue: calculateDayRevenue(dateStr),
        transactions: dayTx.length,
      });
    }

    return last7Days;
  }, [transactions, debtPayments]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Pendapatan Hari Ini
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {formatCurrency(stats.todayRevenue)}
            </p>
            <div className={`flex items-center text-xs mt-1 ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(stats.revenueChange).toFixed(0)}% dari kemarin</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Transaksi Hari Ini
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold">{stats.todayTxCount}</p>
            <div className={`flex items-center text-xs mt-1 ${stats.txChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.txChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(stats.txChange).toFixed(0)}% dari kemarin</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Produk
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground mt-1">produk terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Stok Menipis
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold text-warning">{stats.lowStockCount + stats.outOfStockCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.outOfStockCount} habis, {stats.lowStockCount} menipis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendapatan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                    name="Pendapatan"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Belum ada data penjualan
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sold} terjual</p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {(stats.lowStockProducts.length > 0 || stats.outOfStockProducts.length > 0) && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Peringatan Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.outOfStockProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-destructive">Stok Habis</p>
                  </div>
                </div>
              ))}
              {stats.lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-warning">Sisa {product.stock} {product.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
