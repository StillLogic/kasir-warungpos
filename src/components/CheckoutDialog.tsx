import { useState, useEffect } from "react";
import { CartItem } from "@/types/pos";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (payment: number) => void;
  total: number;
  items: CartItem[];
}

const quickAmounts = [5000, 10000, 20000, 50000, 100000];

export function CheckoutDialog({
  open,
  onClose,
  onConfirm,
  total,
  items,
}: CheckoutDialogProps) {
  const [paymentStr, setPaymentStr] = useState<string>("");
  const payment = parseInt(paymentStr) || 0;
  const change = payment - total;

  useEffect(() => {
    if (open) {
      setPaymentStr(total > 0 ? String(total) : "");
    }
  }, [open, total]);

  const handleConfirm = () => {
    if (payment >= total) {
      onConfirm(payment);
      setPaymentStr("");
    }
  };

  const handleQuickAmount = (amount: number) => {
    setPaymentStr((prev) => String((parseInt(prev) || 0) + amount));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jumlah Item</span>
              <span>
                {items.reduce((sum, item) => sum + item.quantity, 0)} item
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Belanja</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment">Jumlah Bayar</Label>
            <PriceInput
              id="payment"
              value={paymentStr}
              onChange={setPaymentStr}
              placeholder="Masukkan jumlah pembayaran"
              className="text-xl h-14 font-semibold"
              autoFocus
            />
          </div>

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
              onClick={() => setPaymentStr(String(total))}
            >
              Uang Pas
            </Button>
          </div>

          <div className="bg-accent rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-accent-foreground">Kembalian</span>
              <span
                className={`text-2xl font-bold ${change >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {formatCurrency(Math.max(0, change))}
              </span>
            </div>
            {change < 0 && (
              <p className="text-sm text-destructive mt-1">
                Kurang {formatCurrency(Math.abs(change))}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={change < 0}
            >
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
