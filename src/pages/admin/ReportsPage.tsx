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
  Loader2
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
} from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';

export function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getTransactionsAsync();
      setTransactions(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const reportData = useMemo(() => {
    if (period === 'daily') {
      const last30Days: { date: string; revenue: number; transactions: number }[] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const dateStr = date.toDateString();
        const dayTx = transactions.filter(t => new Date(t.createdAt).toDateString() === dateStr);
        
        last30Days.push({
          date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          revenue: dayTx.reduce((sum, t) => sum + t.total, 0),
          transactions: dayTx.length,
        });
      }

      return last30Days;
    } else if (period === 'weekly') {
      const weeks: { date: string; revenue: number; transactions: number }[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i * 7 + 6) * 86400000);
        const weekEnd = new Date(Date.now() - i * 7 * 86400000);
        
        const weekTx = transactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate >= weekStart && txDate <= weekEnd;
        });
        
        weeks.push({
          date: `${weekStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`,
          revenue: weekTx.reduce((sum, t) => sum + t.total, 0),
          transactions: weekTx.length,
        });
      }

      return weeks;
    } else {
      const months: { date: string; revenue: number; transactions: number }[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthTx = transactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate.getMonth() === month && txDate.getFullYear() === year;
        });
        
        months.push({
          date: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          revenue: monthTx.reduce((sum, t) => sum + t.total, 0),
          transactions: monthTx.length,
        });
      }

      return months;
    }
  }, [transactions, period]);

  const summary = useMemo(() => {
    const totalRevenue = reportData.reduce((sum, d) => sum + d.revenue, 0);
    const totalTransactions = reportData.reduce((sum, d) => sum + d.transactions, 0);
    const avgRevenue = reportData.length > 0 ? totalRevenue / reportData.length : 0;
    const avgTransactions = reportData.length > 0 ? totalTransactions / reportData.length : 0;

    return {
      totalRevenue,
      totalTransactions,
      avgRevenue,
      avgTransactions,
    };
  }, [reportData]);

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Pendapatan', 'Transaksi'];
    const rows = reportData.map(d => [d.date, d.revenue, d.transactions]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-${period}-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-xl sm:text-2xl font-bold">Laporan Penjualan</h1>
          <p className="text-sm text-muted-foreground">Analisis performa penjualan warung</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="weekly">Mingguan</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-6 space-y-6">
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
      </Tabs>
    </div>
  );
}
