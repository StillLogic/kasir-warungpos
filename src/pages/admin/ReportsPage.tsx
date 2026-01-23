import { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types/pos';
import { waitForTransactions } from '@/database';
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
  Percent
} from 'lucide-react';
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
type ReportType = 'sales' | 'profit';

export function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');
  const [reportType, setReportType] = useState<ReportType>('sales');

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const data = await waitForTransactions();
        if (mounted) {
          setTransactions(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load reports data:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => { mounted = false; };
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

  const handleExportCSV = () => {
    const headers = reportType === 'sales' 
      ? ['Tanggal', 'Pendapatan', 'Transaksi']
      : ['Tanggal', 'Pendapatan', 'Modal', 'Profit', 'Margin (%)'];
    
    const rows = reportData.map(d => 
      reportType === 'sales'
        ? [d.date, d.revenue, d.transactions]
        : [d.date, d.revenue, d.cost, d.profit, d.margin.toFixed(1)]
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-${reportType}-${period}-${new Date().toISOString().split('T')[0]}.csv`;
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
        </TabsList>

        {/* Period Tabs */}
        <div className="mt-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="daily">Harian</TabsTrigger>
              <TabsTrigger value="weekly">Mingguan</TabsTrigger>
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
      </Tabs>
    </div>
  );
}
