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
import { Search, User, CreditCard, ArrowLeft, Receipt, Calendar, Banknote } from 'lucide-react';
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
          <p className="text-sm text-muted-foreground">
            Total Hutang: <span className="font-semibold text-destructive">{formatCurrency(selectedCustomer.totalDebt)}</span>
          </p>
        </div>
      </div>

      {/* Debt List */}
      <div className="space-y-3">
        {customerDebts.map((debt) => (
          <Card key={debt.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(debt.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                </div>
                {getStatusBadge(debt.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-1">
                {debt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.productName} x{item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatCurrency(debt.total)}</span>
                </div>
                {debt.paidAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Sudah Dibayar</span>
                    <span>-{formatCurrency(debt.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Sisa Hutang</span>
                  <span className="text-destructive">{formatCurrency(debt.remainingAmount)}</span>
                </div>
              </div>

              {/* Pay Button */}
              {debt.status !== 'paid' && (
                <Button
                  className="w-full"
                  onClick={() => handleOpenPayDialog(debt)}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Bayar Hutang
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
