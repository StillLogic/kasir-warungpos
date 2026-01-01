import { Transaction } from '@/types/pos';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';

interface ReceiptProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function Receipt({ transaction, open, onClose }: ReceiptProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Hidden print area - only this will be printed */}
      <div id="receipt-print-area" className="hidden print:block">
        <div className="text-center border-b border-dashed pb-4 mb-4">
          <h2 className="text-xl font-bold">WarungPOS</h2>
          <p className="text-sm">Struk Pembayaran</p>
          <p className="text-xs mt-1">{formatDate(transaction.createdAt)}</p>
          <p className="text-xs">No: {transaction.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="space-y-2 mb-4">
          {transaction.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs">
                  {item.quantity} x {formatCurrency(
                    item.priceType === 'wholesale' 
                      ? item.product.wholesalePrice 
                      : item.product.retailPrice
                  )}
                </p>
              </div>
              <p className="font-medium">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-4 space-y-2 mb-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Bayar</span>
            <span>{formatCurrency(transaction.payment)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Kembali</span>
            <span className="font-medium">{formatCurrency(transaction.change)}</span>
          </div>
        </div>

        <div className="text-center border-t border-dashed pt-4">
          <p className="text-sm">Terima kasih!</p>
          <p className="text-xs">Simpan struk ini sebagai bukti pembayaran</p>
        </div>
      </div>

      {/* Dialog for screen display */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-sm print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Nota Transaksi</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-border pb-4">
              <h2 className="text-xl font-bold">WarungPOS</h2>
              <p className="text-sm text-muted-foreground">Struk Pembayaran</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(transaction.createdAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                No: {transaction.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {transaction.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x {formatCurrency(
                        item.priceType === 'wholesale' 
                          ? item.product.wholesalePrice 
                          : item.product.retailPrice
                      )}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-border pt-4 space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bayar</span>
                <span>{formatCurrency(transaction.payment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kembali</span>
                <span className="text-primary font-medium">
                  {formatCurrency(transaction.change)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-border pt-4">
              <p className="text-sm text-muted-foreground">Terima kasih!</p>
              <p className="text-xs text-muted-foreground">Simpan struk ini sebagai bukti pembayaran</p>
            </div>
          </div>

          <Button className="w-full" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Struk
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
