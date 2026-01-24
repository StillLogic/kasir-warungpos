import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Transaction } from '@/types/pos';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReceiptProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  showLogo: boolean;
  taxEnabled: boolean;
  taxRate: number;
  paperWidth: '58' | '80';
}

const defaultSettings: StoreSettings = {
  storeName: 'WarungPOS',
  storeAddress: '',
  storePhone: '',
  receiptFooter: 'Terima kasih atas kunjungan Anda!',
  showLogo: true,
  taxEnabled: false,
  taxRate: 11,
  paperWidth: '58',
};

function getSettings(): StoreSettings {
  try {
    const saved = localStorage.getItem('store-settings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch {
    
  }
  return defaultSettings;
}

export function Receipt({ transaction, open, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  if (!transaction) return null;

  const settings = getSettings();
  const paperWidth = settings.paperWidth === '80' ? '80mm' : '58mm';
  const fontSize = settings.paperWidth === '80' ? { base: 12, small: 10, title: 16 } : { base: 10, small: 8, title: 14 };

  const handlePrint = () => {
    const printContent = `
      <div style="font-family: 'Courier New', monospace; width: ${paperWidth}; margin: 0; padding: 3mm;">
        <div style="text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: ${fontSize.title}px; font-weight: bold;">${settings.storeName}</h2>
          ${settings.storeAddress ? `<p style="margin: 3px 0 0; font-size: ${fontSize.small}px;">${settings.storeAddress}</p>` : ''}
          ${settings.storePhone ? `<p style="margin: 2px 0 0; font-size: ${fontSize.small}px;">Telp: ${settings.storePhone}</p>` : ''}
          <p style="margin: 5px 0 0; font-size: ${fontSize.small}px;">${formatDate(transaction.createdAt)}</p>
          <p style="margin: 2px 0 0; font-size: ${fontSize.small}px;">No: ${transaction.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div style="margin-bottom: 8px;">
          ${transaction.items.map(item => `
            <div style="margin-bottom: 5px;">
              <p style="margin: 0; font-size: ${fontSize.base}px; font-weight: bold;">${item.product.name}</p>
              <div style="display: flex; justify-content: space-between; font-size: ${fontSize.small}px;">
                <span>${item.quantity} x ${formatCurrency(item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice)}</span>
                <span style="font-weight: bold;">${formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 1px dashed #333; padding-top: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize.base + 2}px; font-weight: bold; margin-bottom: 4px;">
            <span>TOTAL</span>
            <span>${formatCurrency(transaction.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize.base}px; margin-bottom: 2px;">
            <span>Bayar</span>
            <span>${formatCurrency(transaction.payment)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize.base}px;">
            <span>Kembali</span>
            <span style="font-weight: bold;">${formatCurrency(transaction.change)}</span>
          </div>
        </div>
        
        <div style="text-align: center; border-top: 1px dashed #333; padding-top: 8px;">
          <p style="margin: 0; font-size: ${fontSize.small}px;">${settings.receiptFooter}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Struk - ${transaction.id.slice(0, 8).toUpperCase()}</title>
            <style>
              @page {
                size: ${paperWidth} auto;
                margin: 0;
              }
              @media print {
                html, body {
                  width: ${paperWidth};
                  margin: 0;
                  padding: 0;
                }
              }
              body {
                margin: 0;
                padding: 0;
                width: ${paperWidth};
              }
              * {
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleSaveAsPng = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `struk-${transaction.id.slice(0, 8).toUpperCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: 'Struk Disimpan',
        description: 'Struk berhasil disimpan sebagai gambar PNG',
      });
    } catch (error) {
      toast({
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan struk',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nota Transaksi</DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="bg-white p-4 space-y-4">
          
          <div className="text-center border-b border-dashed border-gray-300 pb-4">
            <h2 className="text-xl font-bold text-black">{settings.storeName}</h2>
            {settings.storeAddress && (
              <p className="text-xs text-gray-600 mt-1">{settings.storeAddress}</p>
            )}
            {settings.storePhone && (
              <p className="text-xs text-gray-600">Telp: {settings.storePhone}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              {formatDate(transaction.createdAt)}
            </p>
            <p className="text-xs text-gray-600">
              No: {transaction.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          
          <div className="space-y-2">
            {transaction.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm text-black">
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-gray-600">
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

          
          <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between font-bold text-lg text-black">
              <span>Total</span>
              <span>{formatCurrency(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span className="text-gray-600">Bayar</span>
              <span>{formatCurrency(transaction.payment)}</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span className="text-gray-600">Kembali</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(transaction.change)}
              </span>
            </div>
          </div>

          
          <div className="text-center border-t border-dashed border-gray-300 pt-4">
            <p className="text-sm text-gray-600">{settings.receiptFooter}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleSaveAsPng}>
            <Download className="w-4 h-4 mr-2" />
            Simpan PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
