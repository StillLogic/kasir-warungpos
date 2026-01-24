import { useRef } from "react";
import html2canvas from "html2canvas";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  showLogo: boolean;
  taxEnabled: boolean;
  taxRate: number;
  paperWidth: "58" | "80";
}

interface ReceiptPreviewProps {
  settings: StoreSettings;
}

export function ReceiptPreview({ settings }: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const is80mm = settings.paperWidth === "80";

  const sampleItems = [
    { name: "Indomie Goreng", qty: 2, price: 3500 },
    { name: "Teh Botol", qty: 1, price: 5000 },
    { name: "Roti Tawar", qty: 1, price: 15000 },
  ];

  const subtotal = sampleItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );
  const tax = settings.taxEnabled
    ? Math.round((subtotal * settings.taxRate) / 100)
    : 0;
  const total = subtotal + tax;
  const payment = 50000;
  const change = payment - total;

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSaveAsPng = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `struk-preview-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Struk Disimpan",
        description: "Preview struk berhasil disimpan sebagai gambar PNG",
      });
    } catch (error) {
      toast({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan struk",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-4 flex justify-center">
        <div
          ref={receiptRef}
          className={`bg-white text-black shadow-lg ${is80mm ? "w-[280px]" : "w-[200px]"}`}
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <div className={`p-3 ${is80mm ? "text-sm" : "text-xs"}`}>
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
              <h3 className={`font-bold ${is80mm ? "text-base" : "text-sm"}`}>
                {settings.storeName || "Nama Toko"}
              </h3>
              {settings.storeAddress && (
                <p className={`mt-1 ${is80mm ? "text-xs" : "text-[10px]"}`}>
                  {settings.storeAddress}
                </p>
              )}
              {settings.storePhone && (
                <p className={is80mm ? "text-xs" : "text-[10px]"}>
                  Telp: {settings.storePhone}
                </p>
              )}
              <p className={`mt-2 ${is80mm ? "text-xs" : "text-[10px]"}`}>
                {currentDate}
              </p>
              <p className={is80mm ? "text-xs" : "text-[10px]"}>No: TRX12345</p>
            </div>

            {/* Items */}
            <div className="mb-2">
              {sampleItems.map((item, index) => (
                <div key={index} className="mb-1">
                  <p className="font-bold truncate">{item.name}</p>
                  <div className="flex justify-between">
                    <span>
                      {item.qty} x {formatCurrency(item.price)}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(item.qty * item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
              {settings.taxEnabled && (
                <>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak ({settings.taxRate}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                </>
              )}
              <div
                className={`flex justify-between font-bold ${is80mm ? "text-sm" : "text-xs"} mt-1`}
              >
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Bayar</span>
                <span>{formatCurrency(payment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembali</span>
                <span className="font-bold">{formatCurrency(change)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-gray-400 pt-2">
              <p className={is80mm ? "text-xs" : "text-[10px]"}>
                {settings.receiptFooter || "Terima kasih!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleSaveAsPng}
      >
        <Download className="w-4 h-4 mr-2" />
        Simpan sebagai PNG
      </Button>
    </div>
  );
}
