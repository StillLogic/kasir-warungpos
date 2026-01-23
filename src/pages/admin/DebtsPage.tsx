import { useState, useEffect, useMemo } from 'react';
import { Debt, DebtPayment } from '@/types/debt';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Search, User, CreditCard, ArrowLeft, Banknote, Plus } from 'lucide-react';
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

interface DebtTableRow {
  id: string;
  timestamp: string;
  type: 'debt' | 'payment';
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  debtId?: string;
}

export function DebtsPage() {
  const [customers, setCustomers] = useState<CustomerDebtSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebtSummary | null>(null);
  const [customerDebts, setCustomerDebts] = useState<Debt[]>([]);
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

  const handleOpenPayDialog = () => {
    setPaymentAmount(selectedCustomer?.totalDebt || 0);
    setPayDialogOpen(true);
  };

  const handlePayDebt = () => {
    if (!selectedCustomer || paymentAmount <= 0) return;

    // Get unpaid debts sorted by oldest first
    const unpaidDebts = customerDebts
      .filter(d => d.status !== 'paid')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let remainingPayment = paymentAmount;

    for (const debt of unpaidDebts) {
      if (remainingPayment <= 0) break;

      const payAmount = Math.min(remainingPayment, debt.remainingAmount);
      payDebt(debt.id, payAmount);
      remainingPayment -= payAmount;
    }

    toast({
      title: 'Pembayaran Berhasil',
      description: `Pembayaran ${formatCurrency(paymentAmount)} telah dicatat`,
    });

    setPayDialogOpen(false);
    setPaymentAmount(0);

    // Refresh data
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
  };

  // Build table rows from debts and payments
  const tableRows = useMemo((): DebtTableRow[] => {
    const rows: DebtTableRow[] = [];

    for (const debt of customerDebts) {
      // Add debt items
      for (const item of debt.items) {
        rows.push({
          id: `${debt.id}-${item.productId}`,
          timestamp: debt.createdAt,
          type: 'debt',
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.subtotal,
          debtId: debt.id,
        });
      }

      // Add payments for this debt
      const payments = getDebtPayments(debt.id);
      for (const payment of payments) {
        rows.push({
          id: payment.id,
          timestamp: payment.createdAt,
          type: 'payment',
          totalPrice: -payment.amount,
        });
      }
    }

    // Sort by timestamp descending
    return rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [customerDebts]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const lowerSearch = search.toLowerCase();
    return customers.filter(c => c.customerName.toLowerCase().includes(lowerSearch));
  }, [search, customers]);

  const totalAllDebts = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalDebt, 0);
  }, [customers]);

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

  // Customer Detail View - Simple Table
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{selectedCustomer.customerName}</h2>
          <p className="text-sm text-muted-foreground">Rincian Hutang</p>
        </div>
        {selectedCustomer.totalDebt > 0 && (
          <Button onClick={handleOpenPayDialog}>
            <Banknote className="w-4 h-4 mr-2" />
            Bayar
          </Button>
        )}
      </div>

      {/* Debt Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Harga Satuan</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(row.timestamp), 'dd/MM/yy HH:mm', { locale: localeId })}
                  </TableCell>
                  <TableCell>
                    {row.type === 'debt' ? (
                      <span>{row.productName}</span>
                    ) : (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Pembayaran
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.type === 'debt' ? row.quantity : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.type === 'debt' ? formatCurrency(row.unitPrice || 0) : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${row.type === 'payment' ? 'text-green-600' : ''}`}>
                    {row.type === 'payment' ? formatCurrency(Math.abs(row.totalPrice)) : formatCurrency(row.totalPrice)}
                    {row.type === 'payment' && <span className="ml-1">(-)</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Total Summary */}
        <div className="border-t p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Hutang</span>
            <span className="text-2xl font-bold text-destructive">
              {formatCurrency(selectedCustomer.totalDebt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bayar Hutang</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Hutang</span>
                <span className="font-semibold text-destructive">
                  {formatCurrency(selectedCustomer.totalDebt)}
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
                onClick={() => setPaymentAmount(selectedCustomer.totalDebt)}
              >
                Lunas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentAmount(Math.round(selectedCustomer.totalDebt / 2))}
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
                disabled={paymentAmount <= 0 || paymentAmount > selectedCustomer.totalDebt}
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
