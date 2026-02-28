import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Cloud, Upload, Download, Trash2, Clock, LogOut, RefreshCw, CheckCircle, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { exportBackup, importBackup } from "@/lib/backup";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CloudBackupEntry {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  is_auto: boolean;
  created_at: string;
}

interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_interval: string;
}

const INTERVAL_LABELS: Record<string, string> = {
  "1h": "Setiap 1 Jam",
  "6h": "Setiap 6 Jam",
  "12h": "Setiap 12 Jam",
  daily: "Setiap Hari",
  weekly: "Setiap Minggu",
};

export function CloudBackup() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [backups, setBackups] = useState<CloudBackupEntry[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    auto_backup_enabled: false,
    backup_interval: "daily",
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CloudBackupEntry | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<CloudBackupEntry | null>(null);

  const loadBackups = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBackups(data as CloudBackupEntry[]);
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("backup_settings")
      .select("*")
      .single();
    if (data) {
      setSettings({
        auto_backup_enabled: data.auto_backup_enabled,
        backup_interval: data.backup_interval,
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([loadBackups(), loadSettings()]).finally(() => setLoading(false));
    }
  }, [user, loadBackups, loadSettings]);

  // Auto backup check on mount
  useEffect(() => {
    if (!user || !settings.auto_backup_enabled) return;

    const checkAutoBackup = async () => {
      const { data } = await supabase
        .from("backup_settings")
        .select("last_auto_backup_at")
        .single();

      if (!data) return;

      const lastBackup = data.last_auto_backup_at
        ? new Date(data.last_auto_backup_at).getTime()
        : 0;
      const now = Date.now();
      const intervalMs = getIntervalMs(settings.backup_interval);

      if (now - lastBackup >= intervalMs) {
        await handleUpload(true);
      }
    };

    checkAutoBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, settings.auto_backup_enabled, settings.backup_interval]);

  const getIntervalMs = (interval: string): number => {
    switch (interval) {
      case "1h": return 3600000;
      case "6h": return 21600000;
      case "12h": return 43200000;
      case "daily": return 86400000;
      case "weekly": return 604800000;
      default: return 86400000;
    }
  };

  const handleUpload = async (isAuto = false) => {
    if (!user) return;
    setUploading(true);

    try {
      const blob = await exportBackup();
      const date = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${isAuto ? "auto" : "manual"}-backup-${date}.wbak`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("backups")
        .upload(filePath, blob, { contentType: "application/octet-stream" });

      if (uploadError) throw uploadError;

      await supabase.from("backups").insert({
        user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        file_size: blob.size,
        is_auto: isAuto,
      });

      if (isAuto) {
        await supabase
          .from("backup_settings")
          .update({ last_auto_backup_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      await loadBackups();

      if (!isAuto) {
        toast({ title: "Upload Berhasil", description: "Backup berhasil disimpan ke cloud" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload Gagal", description: "Terjadi kesalahan saat upload backup", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRestore = async (backup: CloudBackupEntry) => {
    try {
      const { data, error } = await supabase.storage
        .from("backups")
        .download(backup.file_path);

      if (error || !data) throw error;

      const file = new File([data], backup.file_name, { type: "application/octet-stream" });
      const result = await importBackup(file);

      if (result.success) {
        toast({
          title: "Restore Berhasil",
          description: `${result.itemCounts?.products || 0} produk, ${result.itemCounts?.transactions || 0} transaksi dipulihkan`,
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({ title: "Restore Gagal", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast({ title: "Restore Gagal", description: "Gagal mengunduh backup dari cloud", variant: "destructive" });
    }
    setRestoreTarget(null);
  };

  const handleDelete = async (backup: CloudBackupEntry) => {
    try {
      await supabase.storage.from("backups").remove([backup.file_path]);
      await supabase.from("backups").delete().eq("id", backup.id);
      await loadBackups();
      toast({ title: "Dihapus", description: "Backup berhasil dihapus dari cloud" });
    } catch {
      toast({ title: "Gagal", description: "Gagal menghapus backup", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const updateAutoBackup = async (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, auto_backup_enabled: enabled }));
    await upsertSettings({ ...settings, auto_backup_enabled: enabled });
  };

  const updateInterval = async (interval: string) => {
    setSettings((prev) => ({ ...prev, backup_interval: interval }));
    await upsertSettings({ ...settings, backup_interval: interval });
  };

  const upsertSettings = async (s: BackupSettings) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("backup_settings")
      .select("id")
      .single();

    if (existing) {
      await supabase
        .from("backup_settings")
        .update({
          auto_backup_enabled: s.auto_backup_enabled,
          backup_interval: s.backup_interval,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await supabase.from("backup_settings").insert({
        user_id: user.id,
        auto_backup_enabled: s.auto_backup_enabled,
        backup_interval: s.backup_interval,
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Logout", description: "Berhasil keluar dari akun cloud" });
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Backup
          </CardTitle>
          <CardDescription>
            Simpan backup data Anda di cloud agar aman dan bisa dipulihkan kapan saja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/auth")} className="w-full">
            <Cloud className="w-4 h-4 mr-2" />
            Masuk / Daftar untuk Cloud Backup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                Cloud Backup
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  {user.email}
                </span>
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload button */}
          <Button onClick={() => handleUpload(false)} disabled={uploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Mengupload..." : "Backup ke Cloud"}
          </Button>

          {/* Auto backup settings */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Auto Backup
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Backup otomatis saat membuka aplikasi
                </p>
              </div>
              <Switch
                checked={settings.auto_backup_enabled}
                onCheckedChange={updateAutoBackup}
              />
            </div>

            {settings.auto_backup_enabled && (
              <div className="space-y-1">
                <Label className="text-xs">Interval</Label>
                <Select value={settings.backup_interval} onValueChange={updateInterval}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTERVAL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Backup list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Riwayat Backup</Label>
              <Button variant="ghost" size="sm" onClick={loadBackups}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
            ) : backups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada backup di cloud</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-2.5 border rounded-lg text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {backup.is_auto && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Auto
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(backup.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatSize(backup.file_size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRestoreTarget(backup)}
                        title="Restore"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(backup)}
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Backup "{deleteTarget?.file_name}" akan dihapus permanen dari cloud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Restore dari Cloud?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Data saat ini akan diganti dengan backup dari:</p>
              <p className="font-medium text-foreground">{restoreTarget && formatDate(restoreTarget.created_at)}</p>
              <p className="text-amber-600 font-medium">⚠️ Pastikan Anda sudah backup data saat ini.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreTarget && handleRestore(restoreTarget)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Ya, Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
