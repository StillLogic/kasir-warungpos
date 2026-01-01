import { useState, useEffect, useCallback, useRef } from 'react';
import { useZxing } from 'react-zxing';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, Flashlight, FlashlightOff, Check, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  continuous?: boolean;
}

export function BarcodeScanner({ open, onClose, onScan, title = 'Scan Barcode', continuous = false }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleScan = useCallback((code: string) => {
    if (cooldown) return;
    
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000);

    setLastScanned(code);
    onScan(code);
    
    if (continuous) {
      setScannedItems(prev => [code, ...prev].slice(0, 5));
    } else {
      onClose();
    }
  }, [continuous, cooldown, onClose, onScan]);

  const {
    ref,
    torch: { on, off, isOn, isAvailable },
  } = useZxing({
    onResult(result) {
      const code = result.getText();
      if (code && code !== lastScanned) {
        setIsLoading(false);
        setHasPermission(true);
        handleScan(code);
      }
    },
    onError(error) {
      console.log('Scanner error:', error);
      if (error && (error as Error).name === 'NotAllowedError') {
        setHasPermission(false);
        setErrorMessage('Izin kamera ditolak. Buka pengaturan browser dan izinkan akses kamera.');
        setIsLoading(false);
      }
    },
    paused: !open || !cameraReady,
    timeBetweenDecodingAttempts: 200,
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  });

  // Request camera permission explicitly
  const requestCameraPermission = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setHasPermission(null);
    setCameraReady(false);

    // Check HTTPS
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setHasPermission(false);
      setErrorMessage('Kamera membutuhkan koneksi HTTPS. Publish aplikasi terlebih dahulu.');
      setIsLoading(false);
      return;
    }

    try {
      // Explicitly request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Store stream reference
      streamRef.current = stream;
      
      // Permission granted - let useZxing take over
      setHasPermission(true);
      setCameraReady(true);
      setIsLoading(false);
      
      // Stop this test stream - useZxing will create its own
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      setIsLoading(false);
      
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMessage('Izin kamera ditolak. Klik ikon gembok/kamera di address bar untuk mengizinkan, lalu refresh halaman.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMessage('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setErrorMessage('Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.');
      } else if (error.name === 'OverconstrainedError') {
        setErrorMessage('Kamera tidak mendukung konfigurasi yang diminta.');
      } else {
        setErrorMessage(`Tidak dapat mengakses kamera: ${error.message || 'Error tidak diketahui'}`);
      }
    }
  }, []);

  // Initialize camera when dialog opens
  useEffect(() => {
    if (open) {
      setLastScanned('');
      setScannedItems([]);
      requestCameraPermission();
    } else {
      // Cleanup when dialog closes
      setCameraReady(false);
      setIsLoading(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [open, requestCameraPermission]);

  // Reset lastScanned after cooldown
  useEffect(() => {
    if (!cooldown && continuous) {
      const timer = setTimeout(() => setLastScanned(''), 500);
      return () => clearTimeout(timer);
    }
  }, [cooldown, continuous]);

  const handleRetry = () => {
    requestCameraPermission();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
            {continuous && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">
                Mode Beruntun
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square bg-black overflow-hidden">
          {/* Video element - only render when camera is ready */}
          {cameraReady && (
            <video ref={ref} className="w-full h-full object-cover" autoPlay playsInline muted />
          )}
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-4 text-center z-10">
              <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
              <p className="font-medium">Meminta Izin Kamera...</p>
              <p className="text-sm opacity-75 mt-2">
                Jika muncul popup, pilih "Izinkan" untuk mengakses kamera
              </p>
            </div>
          )}

          {/* Permission error overlay */}
          {hasPermission === false && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-4 text-center z-10">
              <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
              <p className="font-medium">Tidak Dapat Mengakses Kamera</p>
              <p className="text-sm opacity-75 mt-2 mb-4">
                {errorMessage}
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Scan overlay - only show when camera is active */}
          {cameraReady && !isLoading && hasPermission === true && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Scan line animation */}
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-primary animate-pulse" />
              </div>
            </div>
          )}

          {/* Success flash indicator */}
          {cooldown && (
            <div className="absolute inset-0 bg-primary/20 animate-pulse flex items-center justify-center z-20">
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <Check className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Torch toggle */}
          {isAvailable && cameraReady && !isLoading && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-20"
              onClick={() => (isOn ? off() : on())}
            >
              {isOn ? (
                <FlashlightOff className="w-5 h-5" />
              ) : (
                <Flashlight className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Scanned items list (continuous mode) */}
          {continuous && scannedItems.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8 z-20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/70">Terakhir discan:</p>
                <span className="text-sm font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Total: {scannedItems.length} item
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {scannedItems.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className={`text-xs px-2 py-1 rounded ${
                      index === 0 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 pt-2">
          <p className="text-sm text-muted-foreground text-center mb-3">
            {continuous 
              ? 'Scan produk secara beruntun - scanner tetap aktif'
              : 'Arahkan kamera ke barcode produk'
            }
          </p>
          <Button variant="outline" className="w-full" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
