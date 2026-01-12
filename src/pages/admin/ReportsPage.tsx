import { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types/pos';
import { getTransactionsAsync } from '@/database';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Calendar,
  Loader2,
  Wallet,
  PiggyBank,
  Percent,
  Package,
  ArrowUpDown,
  CalendarDays,
  X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';
type ReportType = 'sales' | 'profit' | 'product';
type SortKey = 'profit' | 'revenue' | 'quantity' | 'margin';

interface ProductProfitData {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [productSortKey, setProductSortKey] = useState<SortKey>('profit');
  const [productSortDesc, setProductSortDesc] = useState(true);
  const [productDateFrom, setProductDateFrom] = useState<Date | undefined>(undefined);
  const [productDateTo, setProductDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getTransactionsAsync();
      setTransactions(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // Calculate profit from a transaction
  const calculateProfit = (tx: Transaction) => {
    return tx.items.reduce((sum, item) => {
      const costPrice = item.product.costPrice || 0;
      const sellingPrice = item.priceType === 'wholesale' 
        ? item.product.wholesalePrice 
        : item.product.retailPrice;
      const profit = (sellingPrice - costPrice) * item.quantity;
      return sum + profit;
    }, 0);
  };

  const reportData = useMemo(() => {
    const processTransactions = (txList: Transaction[]) => {
      const revenue = txList.reduce((sum, t) => sum + t.total, 0);
      const profit = txList.reduce((sum, t) => sum + calculateProfit(t), 0);
      const cost = revenue - profit;
      return { revenue, profit, cost, transactions: txList.length };
    };

    if (period === 'daily') {
      const last30Days: { date: string; revenue: number; profit: number; cost: number; transactions: number; margin: number }[] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const dateStr = date.toDateString();
        const dayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === dateStr);
        const data = processTransactions(dayTx);
        
        last30Days.push({
          date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          ...data,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        });
      }

      return last30Days;
    } else if (period === 'weekly') {
      const weeks: { date: string; revenue: number; profit: number; cost: number; transactions: number; margin: number }[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i * 7 + 6) * 86400000);
        const weekEnd = new Date(Date.now() - i * 7 * 86400000);
        
        const weekTx = transactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate >= weekStart && txDate <= weekEnd;
        });
        
        const data = processTransactions(weekTx);
        weeks.push({
          date: `${weekStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`,
          ...data,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        });
      }

      return weeks;
    } else {
      const months: { date: string; revenue: number; profit: number; cost: number; transactions: number; margin: number }[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthTx = transactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate.getMonth() === month && txDate.getFullYear() === year;
        });
        
        const data = processTransactions(monthTx);
        months.push({
          date: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          ...data,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        });
      }

      return months;
    }
  }, [transactions, period]);

  const summary = useMemo(() => {
    const totalRevenue = reportData.reduce((sum, d) => sum + d.revenue, 0);
    const totalProfit = reportData.reduce((sum, d) => sum + d.profit, 0);
    const totalCost = reportData.reduce((sum, d) => sum + d.cost, 0);
    const totalTransactions = reportData.reduce((sum, d) => sum + d.transactions, 0);
    const avgRevenue = reportData.length > 0 ? totalRevenue / reportData.length : 0;
    const avgProfit = reportData.length > 0 ? totalProfit / reportData.length : 0;
    const avgTransactions = reportData.length > 0 ? totalTransactions / reportData.length : 0;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalProfit,
      totalCost,
      totalTransactions,
      avgRevenue,
      avgProfit,
      avgTransactions,
      overallMargin,
    };
  }, [reportData]);

  // Filter transactions by date range for product report
  const filteredProductTransactions = useMemo(() => {
    if (!productDateFrom && !productDateTo) return transactions;
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      txDate.setHours(0, 0, 0, 0);
      
      if (productDateFrom && productDateTo) {
        const from = new Date(productDateFrom);
        from.setHours(0, 0, 0, 0);
        const to = new Date(productDateTo);
        to.setHours(23, 59, 59, 999);
        return txDate >= from && txDate <= to;
      } else if (productDateFrom) {
        const from = new Date(productDateFrom);
        from.setHours(0, 0, 0, 0);
        return txDate >= from;
      } else if (productDateTo) {
        const to = new Date(productDateTo);
        to.setHours(23, 59, 59, 999);
        return txDate <= to;
      }
      return true;
    });
  }, [transactions, productDateFrom, productDateTo]);

  // Product profit data
  const productProfitData = useMemo(() => {
    const productMap = new Map<string, ProductProfitData>();

    filteredProductTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const productId = item.product.id;
        const costPrice = item.product.costPrice || 0;
        const sellingPrice = item.priceType === 'wholesale' 
          ? item.product.wholesalePrice 
          : item.product.retailPrice;
        const itemRevenue = sellingPrice * item.quantity;
        const itemCost = costPrice * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.quantity += item.quantity;
          existing.revenue += itemRevenue;
          existing.cost += itemCost;
          existing.profit += itemProfit;
        } else {
          productMap.set(productId, {
            productId,
            productName: item.product.name,
            quantity: item.quantity,
            revenue: itemRevenue,
            cost: itemCost,
            profit: itemProfit,
            margin: 0,
          });
        }
      });
    });

    // Calculate margin for each product
    productMap.forEach(product => {
      product.margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
    });

    // Sort products
    const products = Array.from(productMap.values());
    products.sort((a, b) => {
      const multiplier = productSortDesc ? -1 : 1;
      return multiplier * (a[productSortKey] - b[productSortKey]);
    });

    return products;
  }, [filteredProductTransactions, productSortKey, productSortDesc]);

  const clearProductDateFilter = () => {
    setProductDateFrom(undefined);
    setProductDateTo(undefined);
  };

  const handleProductSort = (key: SortKey) => {
    if (productSortKey === key) {
      setProductSortDesc(!productSortDesc);
    } else {
      setProductSortKey(key);
      setProductSortDesc(true);
    }
  };

  const handleExportCSV = () => {
    let headers: string[];
    let rows: (string | number)[][];

    if (reportType === 'sales') {
      headers = ['Tanggal', 'Pendapatan', 'Transaksi'];
      rows = reportData.map(d => [d.date, d.revenue, d.transactions]);
    } else if (reportType === 'profit') {
      headers = ['Tanggal', 'Pendapatan', 'Modal', 'Profit', 'Margin (%)'];
      rows = reportData.map(d => [d.date, d.revenue, d.cost, d.profit, d.margin.toFixed(1)]);
    } else {
      headers = ['Nama Produk', 'Qty Terjual', 'Pendapatan', 'Modal', 'Profit', 'Margin (%)'];
      rows = productProfitData.map(p => [
        p.productName,
        p.quantity,
        p.revenue,
        p.cost,
        p.profit,
        p.margin.toFixed(1)
      ]);
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-${reportType}-${reportType === 'product' ? '' : period + '-'}${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground">Analisis penjualan dan profit warung</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
        <TabsList>
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Penjualan
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-2">
            <PiggyBank className="w-4 h-4" />
            Profit
          </TabsTrigger>
          <TabsTrigger value="product" className="gap-2">
            <Package className="w-4 h-4" />
            Per Produk
          </TabsTrigger>
        </TabsList>

        {/* Period Tabs - only show for sales and profit */}
        {reportType !== 'product' && (
          <div className="mt-4">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList>
                <TabsTrigger value="daily">Harian</TabsTrigger>
                <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Sales Report */}
        <TabsContent value="sales" className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Pendapatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold text-primary">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">{summary.totalTransactions}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Rata-rata Pendapatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">{formatCurrency(summary.avgRevenue)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Rata-rata Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">{summary.avgTransactions.toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Grafik Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={period === 'daily' ? 4 : 0}
                    />
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
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Pendapatan"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Grafik Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={period === 'daily' ? 4 : 0}
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="transactions" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Transaksi"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Report */}
        <TabsContent value="profit" className="mt-6 space-y-6">
          {/* Profit Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Wallet className="w-4 h-4" />
                  Total Pendapatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Total Modal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold text-muted-foreground">
                  {formatCurrency(summary.totalCost)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                  <PiggyBank className="w-4 h-4" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.totalProfit)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Percent className="w-4 h-4" />
                  Margin Rata-rata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">{summary.overallMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Profit vs Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                Grafik Profit & Modal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={period === 'daily' ? 4 : 0}
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'profit' ? 'Profit' : name === 'cost' ? 'Modal' : name
                      ]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone"
                      dataKey="cost" 
                      stackId="1"
                      fill="hsl(var(--muted))" 
                      stroke="hsl(var(--muted-foreground))"
                      name="Modal"
                    />
                    <Area 
                      type="monotone"
                      dataKey="profit" 
                      stackId="1"
                      fill="hsl(142 76% 36%)" 
                      stroke="hsl(142 76% 36%)"
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Margin Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Tren Margin Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={period === 'daily' ? 4 : 0}
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="margin" 
                      stroke="hsl(142 76% 36%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142 76% 36%)' }}
                      name="Margin"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Profit Report */}
        <TabsContent value="product" className="mt-6 space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  Filter Tanggal:
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-[140px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {productDateFrom ? format(productDateFrom, 'dd MMM yyyy', { locale: idLocale }) : 'Dari'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={productDateFrom}
                        onSelect={setProductDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">-</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-[140px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {productDateTo ? format(productDateTo, 'dd MMM yyyy', { locale: idLocale }) : 'Sampai'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={productDateTo}
                        onSelect={setProductDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {(productDateFrom || productDateTo) && (
                    <Button variant="ghost" size="sm" onClick={clearProductDateFilter}>
                      <X className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
                {(productDateFrom || productDateTo) && (
                  <div className="text-xs text-muted-foreground">
                    ({filteredProductTransactions.length} transaksi)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Profit Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Produk Terjual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">{productProfitData.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Pendapatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(productProfitData.reduce((sum, p) => sum + p.revenue, 0))}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(productProfitData.reduce((sum, p) => sum + p.profit, 0))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Produk Teruntung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {productProfitData[0]?.productName || '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Profit Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5" />
                Profit Per Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleProductSort('quantity')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          Qty
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleProductSort('revenue')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          Pendapatan
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Modal</TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleProductSort('profit')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          Profit
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50 hidden sm:table-cell"
                        onClick={() => handleProductSort('margin')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          Margin
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productProfitData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Belum ada data transaksi
                        </TableCell>
                      </TableRow>
                    ) : (
                      productProfitData.map((product, index) => (
                        <TableRow key={product.productId}>
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                            {formatCurrency(product.cost)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(product.profit)}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {product.margin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Products Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 10 Produk Paling Menguntungkan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={productProfitData.slice(0, 10)} 
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="productName" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      width={100}
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
                    <Bar 
                      dataKey="profit" 
                      fill="hsl(142 76% 36%)" 
                      radius={[0, 4, 4, 0]}
                      name="Profit"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
