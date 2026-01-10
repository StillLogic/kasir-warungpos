import { useState, useEffect } from 'react';
import { CartItem } from '@/types/pos';
import { Customer } from '@/types/business';
import { formatCurrency } from '@/lib/format';
import { getCustomersAsync } from '@/database/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, AlertCircle } from 'lucide-react';

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (payment: number, customerId?: string, customerName?: string, debt?: number) => void;
  total: number;
  items: CartItem[];
}

const quickAmounts = [5000, 10000, 20000, 50000, 100000];

export function CheckoutDialog({ open, onClose, onConfirm, total, items }: CheckoutDialogProps) {
  const [payment, setPayment] = useState<number>(total);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [allowDebt, setAllowDebt] = useState(false);
  
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const change = payment - total;
  const debt = allowDebt && selectedCustomerId && change < 0 ? Math.abs(change) : 0;
  const isPaymentValid = payment >= total || (allowDebt && selectedCustomerId && payment > 0);

  useEffect(() => {
    if (open) {
      setPayment(total);
      setSelectedCustomerId('');
      setAllowDebt(false);
      getCustomersAsync().then(setCustomers);
    }
  }, [open, total]);

  const handleConfirm = () => {
    if (isPaymentValid) {
      onConfirm(
        payment,
        selectedCustomerId || undefined,
        selectedCustomer?.name,
        debt
      );
      setPayment(0);
      setSelectedCustomerId('');
      setAllowDebt(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setPayment(prev => prev + amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Pelanggan (Opsional)
            </Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pelanggan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tanpa Pelanggan</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{customer.name}</span>
                      {customer.debt > 0 && (
                        <span className="text-xs text-destructive">
                          Hutang: {formatCurrency(customer.debt)}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer && selectedCustomer.debt > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pelanggan ini memiliki hutang {formatCurrency(selectedCustomer.debt)}
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jumlah Item</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} item</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Belanja</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Allow Debt Toggle - Only show if customer selected */}
          {selectedCustomerId && (
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div>
                <Label htmlFor="allow-debt" className="text-sm font-medium">
                  Izinkan Hutang
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pembayaran kurang akan dicatat sebagai hutang
                </p>
              </div>
              <Switch
                id="allow-debt"
                checked={allowDebt}
                onCheckedChange={setAllowDebt}
              />
            </div>
          )}

          {/* Payment Input */}
          <div className="space-y-2">
            <Label htmlFor="payment">Jumlah Bayar</Label>
            <Input
              id="payment"
              type="number"
              value={payment || ''}
              onChange={(e) => setPayment(Number(e.target.value))}
              placeholder="Masukkan jumlah pembayaran"
              className="text-xl h-14 font-semibold"
              autoFocus
            />
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(amount)}
              >
                +{formatCurrency(amount)}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPayment(total)}
            >
              Uang Pas
            </Button>
          </div>

          {/* Change / Debt Info */}
          <div className="bg-accent rounded-lg p-4 space-y-2">
            {change >= 0 ? (
              <div className="flex justify-between items-center">
                <span className="text-accent-foreground">Kembalian</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(change)}
                </span>
              </div>
            ) : allowDebt && selectedCustomerId ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-accent-foreground">Hutang Baru</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {formatCurrency(debt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Akan ditambahkan ke hutang {selectedCustomer?.name}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-accent-foreground">Kembalian</span>
                  <span className="text-2xl font-bold text-destructive">
                    {formatCurrency(0)}
                  </span>
                </div>
                <p className="text-sm text-destructive mt-1">
                  Kurang {formatCurrency(Math.abs(change))}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleConfirm}
              disabled={!isPaymentValid}
            >
              {debt > 0 ? 'Konfirmasi dengan Hutang' : 'Konfirmasi Pembayaran'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
