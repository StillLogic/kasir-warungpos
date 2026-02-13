import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Tags, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleTitleCaseChange } from "@/lib/text";

import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  isCategoryInUse,
  Category,
} from "@/database/categories";

import {
  getUnits,
  addUnit,
  updateUnit,
  deleteUnit,
  isUnitInUse,
} from "@/database/units";
import { Unit } from "@/types/unit";
import { sortAlpha } from "@/lib/sorting";

export function MasterDataPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState<Category[]>(() => sortAlpha(getCategories(), "name"));
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPrefix, setCategoryPrefix] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const [units, setUnits] = useState<Unit[]>(() => sortAlpha(getUnits(), "name"));
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState("");
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  const handleOpenCategoryForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryPrefix(category.prefix);
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryPrefix("");
    }
    setCategoryFormOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim() || !categoryPrefix.trim()) {
      toast({
        title: "Error",
        description: "Nama dan prefix kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    let result;
    if (editingCategory) {
      result = updateCategory(editingCategory.id, categoryName, categoryPrefix);
    } else {
      result = addCategory(categoryName, categoryPrefix);
    }

    if (!result) {
      toast({
        title: "Error",
        description: "Nama atau prefix kategori sudah digunakan",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: editingCategory
        ? "Kategori diperbarui"
        : "Kategori ditambahkan",
    });
    setCategoryFormOpen(false);
    setCategories(sortAlpha(getCategories(), "name"));
  };

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;

    if (isCategoryInUse(categoryToDelete.name)) {
      toast({
        title: "Error",
        description:
          "Kategori sedang digunakan oleh produk dan tidak dapat dihapus",
        variant: "destructive",
      });
      setCategoryToDelete(null);
      return;
    }

    const success = deleteCategory(categoryToDelete.id);
    if (success) {
      toast({ title: "Berhasil", description: "Kategori dihapus" });
      setCategories(sortAlpha(getCategories(), "name"));
    } else {
      toast({
        title: "Error",
        description: "Minimal harus ada satu kategori",
        variant: "destructive",
      });
    }
    setCategoryToDelete(null);
  };

  const handleOpenUnitForm = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitName(unit.name);
    } else {
      setEditingUnit(null);
      setUnitName("");
    }
    setUnitFormOpen(true);
  };

  const handleSaveUnit = () => {
    if (!unitName.trim()) {
      toast({
        title: "Error",
        description: "Nama satuan harus diisi",
        variant: "destructive",
      });
      return;
    }

    let result;
    if (editingUnit) {
      result = updateUnit(editingUnit.id, unitName);
    } else {
      result = addUnit(unitName);
    }

    if (!result) {
      toast({
        title: "Error",
        description: "Nama satuan sudah digunakan",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: editingUnit ? "Satuan diperbarui" : "Satuan ditambahkan",
    });
    setUnitFormOpen(false);
    setUnits(sortAlpha(getUnits(), "name"));
  };

  const handleDeleteUnit = () => {
    if (!unitToDelete) return;

    if (isUnitInUse(unitToDelete.name)) {
      toast({
        title: "Error",
        description:
          "Satuan sedang digunakan oleh produk/item dan tidak dapat dihapus",
        variant: "destructive",
      });
      setUnitToDelete(null);
      return;
    }

    const success = deleteUnit(unitToDelete.id);
    if (success) {
      toast({ title: "Berhasil", description: "Satuan dihapus" });
      setUnits(sortAlpha(getUnits(), "name"));
    } else {
      toast({
        title: "Error",
        description: "Minimal harus ada satu satuan",
        variant: "destructive",
      });
    }
    setUnitToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="gap-2">
            <Tags className="h-4 w-4" />
            Kategori Produk
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Scale className="h-4 w-4" />
            Satuan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Daftar Kategori Produk</CardTitle>
              <Button onClick={() => handleOpenCategoryForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Kategori</TableHead>
                      <TableHead>Prefix SKU</TableHead>
                      <TableHead className="w-24 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {category.prefix}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenCategoryForm(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setCategoryToDelete(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Daftar Satuan</CardTitle>
              <Button onClick={() => handleOpenUnitForm()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Satuan</TableHead>
                      <TableHead className="w-24 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenUnitForm(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setUnitToDelete(unit)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input
                placeholder="Contoh: Makanan, Minuman"
                value={categoryName}
                onChange={(e) => handleTitleCaseChange(e, setCategoryName)}
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Prefix SKU *</Label>
              <Input
                placeholder="Contoh: MKN, MNM (3 karakter)"
                value={categoryPrefix}
                onChange={(e) =>
                  setCategoryPrefix(e.target.value.toUpperCase().slice(0, 3))
                }
                maxLength={3}
              />
              <p className="text-xs text-muted-foreground">
                Prefix digunakan untuk generate SKU otomatis
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCategoryFormOpen(false)}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleSaveCategory}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={unitFormOpen} onOpenChange={setUnitFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Satuan" : "Tambah Satuan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Satuan *</Label>
              <Input
                placeholder="Contoh: Pcs, Kg, Lusin"
                value={unitName}
                onChange={(e) => handleTitleCaseChange(e, setUnitName)}
                maxLength={20}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setUnitFormOpen(false)}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleSaveUnit}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori "
              {categoryToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!unitToDelete}
        onOpenChange={() => setUnitToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Satuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus satuan "{unitToDelete?.name}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
