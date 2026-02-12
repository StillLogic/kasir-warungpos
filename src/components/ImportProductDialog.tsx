import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parseCSV,
  generateCSVTemplate,
  downloadCSV,
  CSVProduct,
} from "@/lib/csv";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportProductDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (products: CSVProduct[]) => void;
}

export function ImportProductDialog({
  open,
  onClose,
  onImport,
}: ImportProductDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    products: CSVProduct[];
    errors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadCSV(template, "template-produk.csv");
    toast({
      title: "Template Diunduh",
      description: "Gunakan template ini untuk mengisi data produk",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Format Tidak Valid",
        description: "Hanya file CSV yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const content = await selectedFile.text();
      const result = parseCSV(content);
      setPreview(result);
    } catch {
      toast({
        title: "Gagal Membaca File",
        description: "Terjadi kesalahan saat membaca file CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!preview || preview.products.length === 0) return;
    onImport(preview.products);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Produk dari CSV</DialogTitle>
          <DialogDescription>
            Upload file CSV untuk menambahkan produk secara massal. Unduh
            template terlebih dahulu untuk format yang benar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
            <FileText className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="font-medium">Template CSV</p>
              <p className="text-sm text-muted-foreground">
                Unduh template dengan format yang benar dan contoh data
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Unduh Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="font-medium">
                {file ? file.name : "Pilih file CSV"}
              </p>
              <p className="text-sm text-muted-foreground">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Atau drag & drop file di sini"}
              </p>
            </label>
          </div>

          {preview && (
            <div className="space-y-3">
              {preview.products.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{preview.products.length} produk siap diimport</span>
                </div>
              )}

              {preview.errors.length > 0 && (
                <div className="bg-destructive/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{preview.errors.length} error ditemukan</span>
                  </div>
                  <ScrollArea className="h-32">
                    <ul className="text-sm text-destructive space-y-1">
                      {preview.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {preview.products.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-48">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Nama</th>
                          <th className="text-left p-2">SKU</th>
                          <th className="text-left p-2">Kategori</th>
                          <th className="text-right p-2">Harga</th>
                          <th className="text-right p-2">Stok</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.products.map((product, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{product.name}</td>
                            <td className="p-2 font-mono text-xs">
                              {product.sku}
                            </td>
                            <td className="p-2">{product.category}</td>
                            <td className="p-2 text-right">
                              {product.retailPrice.toLocaleString("id-ID")}
                            </td>
                            <td className="p-2 text-right">{product.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !preview || preview.products.length === 0}
          >
            Import {preview?.products.length || 0} Produk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
