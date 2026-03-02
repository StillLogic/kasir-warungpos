import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  Package,
  Users,
  ShoppingCart,
  Tag,
  CreditCard,
  Scale,
  ClipboardList,
  Lock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { downloadBackup, importBackup, getStorageStats } from "@/lib/backup";

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState<"export" | "import" | null>(null);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<{
    products: number;
    transactions: number;
    categories: number;
    units: number;
    customers: number;
    debts: number;
    employees: number;
    shoppingItems: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getStorageStats();
    setStats(data);
  };

  const handleExportClick = () => {
    setPassword("");
    setShowPasswordDialog("export");
  };

  const handleExportConfirm = async () => {
    if (!password.trim()) {
      toast({
        title: "Password Diperlukan",
        description: "Masukkan password untuk mengenkripsi backup",
        variant: "destructive",
      });
      return;
    }
    setShowPasswordDialog(null);
    setIsExporting(true);
    try {
      await downloadBackup(password.trim());
      toast({
        title: "Backup Berhasil",
        description: "File backup telah diunduh. Simpan di tempat yang aman.",
      });
    } catch {
      toast({
        title: "Backup Gagal",
        description: "Terjadi kesalahan saat membuat backup",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setPassword("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".wbak") && !file.name.endsWith(".json")) {
        toast({
          title: "Format File Salah",
          description: "Pilih file backup dengan format .wbak atau .json",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (file.name.endsWith(".wbak")) {
        setPassword("");
        setShowPasswordDialog("import");
      } else {
        setConfirmImport(true);
      }
    }
    e.target.value = "";
  };

  const handleImportWithPassword = () => {
    setShowPasswordDialog(null);
    setConfirmImport(true);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setConfirmImport(false);

    try {
      const result = await importBackup(
        selectedFile,
        selectedFile.name.endsWith(".wbak") ? password.trim() || undefined : undefined,
      );

      if (result.success) {
        toast({
          title: "Data Dipulihkan",
          description: `${result.itemCounts?.products || 0} produk, ${result.itemCounts?.transactions || 0} transaksi berhasil dipulihkan`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Pemulihan Gagal",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Pemulihan Gagal",
        description: "Terjadi kesalahan saat memulihkan data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      setPassword("");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup & Restore Data
          </CardTitle>
          <CardDescription>
            Backup data secara rutin untuk mencegah kehilangan data. File backup
            dilindungi password dan terkompresi untuk keamanan dan efisiensi penyimpanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.products}</span>
                <span className="text-muted-foreground">produk</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.transactions}</span>
                <span className="text-muted-foreground">transaksi</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.categories}</span>
                <span className="text-muted-foreground">kategori</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.units}</span>
                <span className="text-muted-foreground">satuan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.customers}</span>
                <span className="text-muted-foreground">pelanggan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.debts}</span>
                <span className="text-muted-foreground">hutang</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.employees}</span>
                <span className="text-muted-foreground">karyawan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.shoppingItems}</span>
                <span className="text-muted-foreground">item belanja</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportClick}
              disabled={isExporting}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Mengunduh..." : "Backup Data"}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Memulihkan..." : "Restore Data"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".wbak,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Tips Penting:
                </p>
                <ul className="text-amber-700 dark:text-amber-300 list-disc list-inside mt-1 space-y-1">
                  <li>
                    Backup data secara rutin ke Google Drive atau lokasi aman
                  </li>
                  <li>Jangan hapus cache browser jika belum backup data</li>
                  <li>Simpan file backup di beberapa tempat berbeda</li>
                  <li>Ingat password backup Anda, data tidak bisa dipulihkan tanpa password</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showPasswordDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowPasswordDialog(null);
            setPassword("");
            if (showPasswordDialog === "import") setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {showPasswordDialog === "export"
                ? "Password Backup"
                : "Password Restore"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {showPasswordDialog === "export"
                ? "Masukkan password untuk melindungi file backup Anda."
                : "Masukkan password yang digunakan saat membuat backup. Kosongkan jika backup versi lama."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="backup-password">Password</Label>
              <Input
                id="backup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  showPasswordDialog === "export"
                    ? "Masukkan password"
                    : "Masukkan password (opsional)"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (showPasswordDialog === "export") handleExportConfirm();
                    else handleImportWithPassword();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(null);
                setPassword("");
                if (showPasswordDialog === "import") setSelectedFile(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={
                showPasswordDialog === "export"
                  ? handleExportConfirm
                  : handleImportWithPassword
              }
            >
              {showPasswordDialog === "export" ? "Backup" : "Lanjutkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmImport} onOpenChange={setConfirmImport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Konfirmasi Restore Data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Anda akan memulihkan data dari file backup:</p>
              <p className="font-medium text-foreground">
                {selectedFile?.name}
              </p>
              <p className="text-amber-600 font-medium">
                ⚠️ Semua data saat ini akan diganti dengan data dari backup.
              </p>
              <p>
                Pastikan Anda sudah backup data saat ini sebelum melanjutkan.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFile(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Ya, Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
