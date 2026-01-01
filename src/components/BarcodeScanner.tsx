import { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, Flashlight, FlashlightOff } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function BarcodeScanner({ open, onClose, onScan, title = 'Scan Barcode' }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScanned, setLastScanned] = useState<string>('');

  const {
    ref,
    torch: { on, off, isOn, isAvailable },
  } = useZxing({
    onResult(result) {
      const code = result.getText();
      if (code && code !== lastScanned) {
        setLastScanned(code);
        onScan(code);
        onClose();
      }
    },
    paused: !open,
  });

  useEffect(() => {
    if (open) {
      setLastScanned('');
      // Check camera permission
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => setHasPermission(true))
        .catch(() => setHasPermission(false));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square bg-black">
          {hasPermission === false ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
              <Camera className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">Akses Kamera Ditolak</p>
              <p className="text-sm opacity-75 mt-2">
                Izinkan akses kamera di pengaturan browser untuk menggunakan fitur scan
              </p>
            </div>
          ) : (
            <>
              <video ref={ref} className="w-full h-full object-cover" />
              
              {/* Scan overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                  <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Scan line animation */}
                  <div className="absolute top-0 left-4 right-4 h-0.5 bg-primary animate-pulse" style={{ animation: 'scanline 2s ease-in-out infinite' }} />
                </div>
              </div>

              {/* Torch toggle */}
              {isAvailable && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => (isOn ? off() : on())}
                >
                  {isOn ? (
                    <FlashlightOff className="w-5 h-5" />
                  ) : (
                    <Flashlight className="w-5 h-5" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="p-4 pt-2">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Arahkan kamera ke barcode produk
          </p>
          <Button variant="outline" className="w-full" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
