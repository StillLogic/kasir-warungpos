import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Search, User, CreditCard, ArrowLeft, Banknote, Plus, Printer, Download, CalendarIcon, X } from 'lucide-react';
import { getCustomersWithDebt, getDebtsByCustomerId, payCustomerDebt, getCustomerPayments } from '@/database/debts';
import { toast } from '@/hooks/use-toast';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import html2canvas from 'html2canvas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  const printRef = useRef<HTMLDivElement>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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
    setDateFrom(undefined);
    setDateTo(undefined);
    loadCustomers();
  };

  const handleOpenPayDialog = () => {
    setPaymentAmount(selectedCustomer?.totalDebt || 0);
    setPayDialogOpen(true);
  };

  const handlePayDebt = () => {
    if (!selectedCustomer || paymentAmount <= 0) return;

    // Use new consolidated payment function
    const result = payCustomerDebt(selectedCustomer.customerId, paymentAmount);
    
    if (!result) {
      toast({
        title: 'Pembayaran Gagal',
        description: 'Tidak ada hutang yang dapat dibayar',
        variant: 'destructive',
      });
      return;
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

  const handlePrint = () => {
    if (!selectedCustomer) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rincian Hutang - ${selectedCustomer.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          .total-box { background: #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .total-label { font-weight: 600; }
          .total-amount { font-size: 24px; font-weight: bold; color: #dc2626; float: right; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .payment { color: #16a34a; font-weight: 500; }
          .footer { margin-top: 20px; font-size: 11px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${selectedCustomer.customerName}</h1>
        <div class="subtitle">Rincian Hutang - Dicetak: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: localeId })}</div>
        
        <div class="total-box">
          <span class="total-label">Total Hutang</span>
          <span class="total-amount">${formatCurrency(selectedCustomer.totalDebt)}</span>
          <div style="clear: both;"></div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Keterangan</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Harga Satuan</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.map(row => `
              <tr>
                <td>${format(new Date(row.timestamp), 'dd/MM/yy HH:mm', { locale: localeId })}</td>
                <td${row.type === 'payment' ? ' class="payment"' : ''}>${row.type === 'debt' ? row.productName : '+ Pembayaran'}</td>
                <td class="text-center">${row.type === 'debt' ? row.quantity : '-'}</td>
                <td class="text-right">${row.type === 'debt' ? formatCurrency(row.unitPrice || 0) : '-'}</td>
                <td class="text-right${row.type === 'payment' ? ' payment' : ''}">${row.type === 'payment' ? formatCurrency(Math.abs(row.totalPrice)) + ' (-)' : formatCurrency(row.totalPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">Warung POS - Sistem Kasir Digital</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleSaveImage = async () => {
    if (!printRef.current || !selectedCustomer) return;
    
    try {
      const canvas = await html2canvas(printRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `hutang-${selectedCustomer.customerName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: 'Berhasil',
        description: 'Rincian hutang berhasil disimpan sebagai gambar',
      });
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal menyimpan gambar',
        variant: 'destructive',
      });
    }
  };

  // Build table rows from debts and customer payments (consolidated)
  const tableRows = useMemo((): DebtTableRow[] => {
    if (!selectedCustomer) return [];
    
    const rows: DebtTableRow[] = [];

    // Add all debt items
    for (const debt of customerDebts) {
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
    }

    // Add customer payments (consolidated - one entry per payment)
    const customerPayments = getCustomerPayments(selectedCustomer.customerId);
    for (const payment of customerPayments) {
      rows.push({
        id: payment.id,
        timestamp: payment.createdAt,
        type: 'payment',
        totalPrice: -payment.amount,
      });
    }

    // Sort by timestamp descending
    const sortedRows = rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply date filter
    if (dateFrom || dateTo) {
      return sortedRows.filter(row => {
        const rowDate = new Date(row.timestamp);
        if (dateFrom && dateTo) {
          return isWithinInterval(rowDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
        } else if (dateFrom) {
          return rowDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          return rowDate <= endOfDay(dateTo);
        }
        return true;
      });
    }
    
    return sortedRows;
  }, [customerDebts, selectedCustomer, dateFrom, dateTo]);

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
      <div className="space-y-6 pb-16">
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
    <div className="space-y-6 pb-16">
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
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrint} title="Cetak">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSaveImage} title="Simpan Gambar">
              <Download className="w-4 h-4" />
            </Button>
            <Button onClick={handleOpenPayDialog}>
              <Banknote className="w-4 h-4 mr-2" />
              Bayar
            </Button>
          </div>
        )}
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Dari tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">-</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Sampai tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Total Summary - Top */}
      <div ref={printRef} className="space-y-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{selectedCustomer.customerName}</p>
                <span className="text-lg font-semibold">Total Hutang</span>
              </div>
              <span className="text-2xl font-bold text-destructive">
                {formatCurrency(selectedCustomer.totalDebt)}
              </span>
            </div>
          </CardContent>
        </Card>

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
      </Card>
      </div>

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
