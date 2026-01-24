import { useState, useMemo } from 'react';
import { Transaction } from '@/types/pos';
import { getTransactions, getTodayRevenue, getTodayTransactions } from '@/database';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/format';
import { Receipt } from '@/components/Receipt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Receipt as ReceiptIcon, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function HistoryPage() {
  const [transactions] = useState<Transaction[]>(() => getTransactions());
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const todayTransactions = getTodayTransactions();
  const todayRevenue = getTodayRevenue();

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;
    const searchLower = search.toLowerCase();
    return transactions.filter(t => 
      t.id.toLowerCase().includes(searchLower) ||
      t.items.some(item => item.product.name.toLowerCase().includes(searchLower))
    );
  }, [transactions, search]);

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + t.total, 0);
    const avgTransaction = transactions.length > 0 ? total / transactions.length : 0;
    return { total, avgTransaction };
  }, [transactions]);

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">Lihat semua transaksi penjualan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan Hari Ini
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(todayRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transaksi Hari Ini
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayTransactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Transaksi
            </CardTitle>
            <ReceiptIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.avgTransaction)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari transaksi atau produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Bayar</TableHead>
              <TableHead className="text-right">Kembali</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {transactions.length === 0 
                    ? 'Belum ada transaksi.'
                    : 'Tidak ditemukan transaksi yang sesuai.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm truncate">
                        {transaction.items.map(i => i.product.name).join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.items.reduce((sum, i) => sum + i.quantity, 0)} item
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.paymentType === 'debt' ? (
                      <Badge variant="destructive" className="text-xs">
                        Hutang
                        {transaction.customerName && (
                          <span className="ml-1 opacity-80">({transaction.customerName})</span>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Tunai</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.total)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {transaction.paymentType === 'debt' ? '-' : formatCurrency(transaction.payment)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-primary">
                    {transaction.paymentType === 'debt' ? '-' : formatCurrency(transaction.change)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewReceipt(transaction)}
                    >
                      <ReceiptIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receipt Dialog */}
      <Receipt
        transaction={selectedTransaction}
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
}
