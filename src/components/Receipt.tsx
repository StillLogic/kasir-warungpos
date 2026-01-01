import { Transaction } from '@/types/pos';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';

interface ReceiptProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function Receipt({ transaction, open, onClose }: ReceiptProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    // Create print content
    const printContent = `
      <div style="font-family: 'Courier New', monospace; max-width: 80mm; margin: 0 auto; padding: 10px;">
        <div style="text-align: center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px;">WarungPOS</h2>
          <p style="margin: 5px 0 0; font-size: 12px;">Struk Pembayaran</p>
          <p style="margin: 5px 0 0; font-size: 10px;">${formatDate(transaction.createdAt)}</p>
          <p style="margin: 2px 0 0; font-size: 10px;">No: ${transaction.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div style="margin-bottom: 10px;">
          ${transaction.items.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
              <div>
                <p style="margin: 0; font-weight: bold;">${item.product.name}</p>
                <p style="margin: 2px 0 0; font-size: 10px;">
                  ${item.quantity} x ${formatCurrency(item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice)}
                </p>
              </div>
              <p style="margin: 0; font-weight: bold;">${formatCurrency(item.subtotal)}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 1px dashed #333; padding-top: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 5px;">
            <span>Total</span>
            <span>${formatCurrency(transaction.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
            <span>Bayar</span>
            <span>${formatCurrency(transaction.payment)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span>Kembali</span>
            <span style="font-weight: bold;">${formatCurrency(transaction.change)}</span>
          </div>
        </div>
        
        <div style="text-align: center; border-top: 1px dashed #333; padding-top: 10px;">
          <p style="margin: 0; font-size: 12px;">Terima kasih!</p>
          <p style="margin: 5px 0 0; font-size: 10px;">Simpan struk ini sebagai bukti pembayaran</p>
        </div>
      </div>
    `;

    // Open new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk - ${transaction.id.slice(0, 8).toUpperCase()}</title>
            <style>
              @page { size: auto; margin: 5mm; }
              body { margin: 0; padding: 0; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nota Transaksi</DialogTitle>
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
  );
}
