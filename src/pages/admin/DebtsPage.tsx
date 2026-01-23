import { useState, useEffect, useMemo } from 'react';
import { Debt, Customer } from '@/types/debt';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, User, CreditCard, ArrowLeft, Banknote } from 'lucide-react';
import { getCustomersWithDebt, getDebtsByCustomerId, payDebt, getDebtPayments } from '@/database/debts';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerDebtSummary {
  customerId: string;
  customerName: string;
  totalDebt: number;
  debtCount: number;
}

export function DebtsPage() {
  const [customers, setCustomers] = useState<CustomerDebtSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebtSummary | null>(null);
  const [customerDebts, setCustomerDebts] = useState<Debt[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    setCustomers(getCustomersWithDebt());
  };

  const loadCustomerDebts = (customerId: string) => {
    setCustomerDebts(getDebtsByCustomerId(customerId));
  };

  const handleSelectCustomer = (customer: CustomerDebtSummary) => {
    setSelectedCustomer(customer);
    loadCustomerDebts(customer.customerId);
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setCustomerDebts([]);
    loadCustomers();
  };

  const handleOpenPayDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remainingAmount);
    setPayDialogOpen(true);
  };

  const handlePayDebt = () => {
    if (!selectedDebt || paymentAmount <= 0) return;

    const result = payDebt(selectedDebt.id, paymentAmount);
    if (result) {
      toast({
        title: 'Pembayaran Berhasil',
        description: `Pembayaran ${formatCurrency(paymentAmount)} telah dicatat`,
      });
      setPayDialogOpen(false);
      setSelectedDebt(null);
      setPaymentAmount(0);

      if (selectedCustomer) {
        loadCustomerDebts(selectedCustomer.customerId);
        loadCustomers();
        
        // Update selected customer total
        const updatedCustomers = getCustomersWithDebt();
        const updated = updatedCustomers.find(c => c.customerId === selectedCustomer.customerId);
        if (updated) {
          setSelectedCustomer(updated);
        } else {
          // Customer has no more debt, go back
          handleBack();
        }
      }
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const lowerSearch = search.toLowerCase();
    return customers.filter(c => c.customerName.toLowerCase().includes(lowerSearch));
  }, [search, customers]);

  const totalAllDebts = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalDebt, 0);
  }, [customers]);

  const getStatusBadge = (status: Debt['status']) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="destructive">Belum Bayar</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Sebagian</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-500/20 text-green-600">Lunas</Badge>;
    }
  };

  // Customer List View
  if (!selectedCustomer) {
    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Piutang</CardDescription>
              <CardTitle className="text-2xl text-destructive">{formatCurrency(totalAllDebts)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pelanggan Berhutang</CardDescription>
              <CardTitle className="text-2xl">{customers.length} orang</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada hutang</p>
              <p className="text-sm">Semua pelanggan sudah melunasi hutang</p>
            </CardContent>
          </Card>
        ) : isMobile ? (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.customerId}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectCustomer(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.debtCount} transaksi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">{formatCurrency(customer.totalDebt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-center">Jumlah Hutang</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.customerId}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{customer.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{customer.debtCount} transaksi</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {formatCurrency(customer.totalDebt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    );
  }

  // Build combined transaction list (debt items + payments)
  const combinedTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    
    const transactions: Array<{
      type: 'debt' | 'payment';
      date: Date;
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice: number;
      debtId: string;
    }> = [];

    customerDebts.forEach((debt) => {
      // Add debt items
      debt.items.forEach((item) => {
        transactions.push({
          type: 'debt',
          date: new Date(debt.createdAt),
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.subtotal,
          debtId: debt.id,
        });
      });

      // Add payments
      const payments = getDebtPayments(debt.id);
      payments.forEach((payment) => {
        transactions.push({
          type: 'payment',
          date: new Date(payment.createdAt),
          totalPrice: payment.amount,
          debtId: debt.id,
        });
      });
    });

    // Sort by date descending (newest first)
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [customerDebts, selectedCustomer]);

  // Customer Detail View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{selectedCustomer.customerName}</h2>
        </div>
      </div>

      {/* Total Debt Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hutang</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(selectedCustomer.totalDebt)}</p>
            </div>
            {selectedCustomer.totalDebt > 0 && (
              <Button onClick={() => {
                const unpaidDebt = customerDebts.find(d => d.status !== 'paid');
                if (unpaidDebt) handleOpenPayDialog(unpaidDebt);
              }}>
                <Banknote className="w-4 h-4 mr-2" />
                Bayar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            <div className="divide-y">
              {combinedTransactions.map((tx, idx) => (
                <div key={idx} className={`p-4 ${tx.type === 'payment' ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-muted-foreground">
                      {format(tx.date, 'dd/MM/yyyy HH:mm', { locale: localeId })}
                    </span>
                    {tx.type === 'payment' ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        Pembayaran
                      </Badge>
                    ) : (
                      <Badge variant="outline">Hutang</Badge>
                    )}
                  </div>
                  {tx.type === 'debt' ? (
                    <>
                      <p className="font-medium">{tx.productName}</p>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>{tx.quantity} x {formatCurrency(tx.unitPrice || 0)}</span>
                        <span className="font-semibold text-foreground">{formatCurrency(tx.totalPrice)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 dark:text-green-400 font-medium">Pembayaran Diterima</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">-{formatCurrency(tx.totalPrice)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Jam</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinedTransactions.map((tx, idx) => (
                  <TableRow key={idx} className={tx.type === 'payment' ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                    <TableCell className="text-muted-foreground">
                      {format(tx.date, 'dd/MM/yyyy HH:mm', { locale: localeId })}
                    </TableCell>
                    <TableCell>
                      {tx.type === 'debt' ? (
                        <span>{tx.productName}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Pembayaran
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.type === 'debt' ? tx.quantity : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.type === 'debt' ? formatCurrency(tx.unitPrice || 0) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === 'payment' ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {tx.type === 'payment' ? `-${formatCurrency(tx.totalPrice)}` : formatCurrency(tx.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
                {combinedTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Tidak ada transaksi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bayar Hutang</DialogTitle>
          </DialogHeader>

          {selectedDebt && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa Hutang</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(selectedDebt.remainingAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payAmount">Jumlah Bayar</Label>
                <Input
                  id="payAmount"
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="text-xl h-14 font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(selectedDebt.remainingAmount)}
                >
                  Lunas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(Math.round(selectedDebt.remainingAmount / 2))}
                >
                  50%
                </Button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPayDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePayDebt}
                  disabled={paymentAmount <= 0 || paymentAmount > selectedDebt.remainingAmount}
                >
                  Konfirmasi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
