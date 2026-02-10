import { useState, useEffect } from "react";
import { ShoppingArchiveGroup } from "@/types/shopping-list";
import {
  getArchivedItemsGrouped,
  deleteArchivedItemsByDate,
  clearAllArchived,
  checkAndAutoArchive,
} from "@/database/shopping-list";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ShoppingArchivePage() {
  const { toast } = useToast();
  const [archivedGroups, setArchivedGroups] = useState<ShoppingArchiveGroup[]>(
    [],
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);

  useEffect(() => {
    const archivedCount = checkAndAutoArchive();
    if (archivedCount > 0) {
      toast({
        title: "Arsip Otomatis",
        description: `${archivedCount} item yang sudah dibeli telah diarsipkan`,
      });
    }
    refreshData();
  }, []);

  const refreshData = () => {
    setArchivedGroups(getArchivedItemsGrouped());
  };

  const handleDeleteArchivedGroup = () => {
    if (!dateToDelete) return;
    deleteArchivedItemsByDate(dateToDelete);
    setDateToDelete(null);
    setDeleteConfirmOpen(false);
    refreshData();
    toast({ title: "Berhasil", description: "Arsip dihapus" });
  };

  const handleClearAllArchived = () => {
    clearAllArchived();
    setClearAllConfirmOpen(false);
    refreshData();
    toast({ title: "Berhasil", description: "Semua arsip dihapus" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Arsip Belanjaan
          </h1>
          <p className="text-muted-foreground mt-1">
            Riwayat belanjaan yang sudah selesai
          </p>
        </div>
        {archivedGroups.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setClearAllConfirmOpen(true)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Semua Arsip
          </Button>
        )}
      </div>

      {/* Archive List */}
      {archivedGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Archive className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Belum ada arsip</p>
            <p className="text-sm mt-2">
              Item yang sudah dibeli akan otomatis diarsipkan setiap hari
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {archivedGroups.map((group) => (
            <Card key={group.date}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="font-semibold">{group.dayName}</span>
                    <span className="text-muted-foreground font-normal">
                      {group.displayDate}
                    </span>
                    <Badge variant="secondary">{group.items.length}</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDateToDelete(group.date);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        {item.brand && (
                          <div className="text-sm text-muted-foreground">
                            {item.brand}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mr-4">
                        {item.quantity} {item.unit}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.categoryName}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arsip?</AlertDialogTitle>
            <AlertDialogDescription>
              Arsip tanggal ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel
              className="flex-1"
              onClick={() => setDateToDelete(null)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteArchivedGroup}
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog
        open={clearAllConfirmOpen}
        onOpenChange={setClearAllConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Arsip?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua arsip belanjaan akan dihapus permanen. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAllArchived}
            >
              Hapus Semua
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
