import { useState, useEffect } from "react";
import { ShoppingArchiveByCategory } from "@/types/shopping-list";
import {
  getArchivedItemsByCategory,
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
  const [archivedByCategory, setArchivedByCategory] = useState<
    ShoppingArchiveByCategory[]
  >([]);
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
    setArchivedByCategory(getArchivedItemsByCategory());
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
        {archivedByCategory.length > 0 && (
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

      {archivedByCategory.length === 0 ? (
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
        <div className="space-y-6">
          {archivedByCategory.map((category) => (
            <Card key={category.categoryId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {category.categoryName}
                  <Badge variant="secondary">{category.totalItems}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Nama Produk
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Merk
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                          Jumlah
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.dateGroups.map((dateGroup, dateIdx) => (
                        <>
                          <tr
                            key={`date-${dateGroup.date}`}
                            className="bg-muted/50"
                          >
                            <td
                              colSpan={3}
                              className="py-2 px-3 font-medium text-sm"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-semibold">
                                  {dateGroup.dayName}
                                </span>
                                <span className="text-muted-foreground font-normal">
                                  {dateGroup.displayDate}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {dateGroup.items.length}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDateToDelete(dateGroup.date);
                                  setDeleteConfirmOpen(true);
                                }}
                                title="Hapus arsip tanggal ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                          {dateGroup.items.map((item, itemIdx) => (
                            <tr
                              key={item.id}
                              className={`border-b last:border-b-0 hover:bg-muted/30 ${
                                itemIdx === dateGroup.items.length - 1 &&
                                dateIdx !== category.dateGroups.length - 1
                                  ? "border-b-2"
                                  : ""
                              }`}
                            >
                              <td className="py-2 px-3 font-medium">
                                {item.productName}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {item.brand || "-"}
                              </td>
                              <td className="py-2 px-3 text-center text-muted-foreground">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-2 px-3"></td>
                            </tr>
                          ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
