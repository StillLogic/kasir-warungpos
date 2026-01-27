import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Category,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  isCategoryInUse,
} from '@/database/categories';
import { handleTitleCaseChange, handleUpperCaseChange } from '@/lib/text';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
}

export function CategoryManager({ open, onClose, onCategoriesChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = () => {
    setCategories(getCategories());
  };

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setPrefix(category.prefix);
    } else {
      setEditingCategory(null);
      setName('');
      setPrefix('');
    }
    setError('');
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setName('');
    setPrefix('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    if (!prefix.trim() || prefix.length < 2) {
      setError('Prefix minimal 2 karakter');
      return;
    }

    if (prefix.length > 3) {
      setError('Prefix maksimal 3 karakter');
      return;
    }

    let result: Category | null;

    if (editingCategory) {
      result = updateCategory(editingCategory.id, name.trim(), prefix.trim());
      if (result) {
        toast({
          title: 'Kategori Diperbarui',
          description: `Kategori "${result.name}" berhasil diperbarui`,
        });
      }
    } else {
      result = addCategory(name.trim(), prefix.trim());
      if (result) {
        toast({
          title: 'Kategori Ditambahkan',
          description: `Kategori "${result.name}" berhasil ditambahkan`,
        });
      }
    }

    if (!result) {
      setError('Nama atau prefix kategori sudah digunakan');
      return;
    }

    loadCategories();
    handleCloseForm();
    onCategoriesChange?.();
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;

    if (isCategoryInUse(deletingCategory.name)) {
      toast({
        title: 'Tidak Dapat Menghapus',
        description: 'Kategori masih digunakan oleh produk',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
      return;
    }

    const success = deleteCategory(deletingCategory.id);
    if (success) {
      toast({
        title: 'Kategori Dihapus',
        description: `Kategori "${deletingCategory.name}" berhasil dihapus`,
      });
      loadCategories();
      onCategoriesChange?.();
    } else {
      toast({
        title: 'Gagal Menghapus',
        description: 'Minimal harus ada satu kategori',
        variant: 'destructive',
      });
    }

    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Kelola Kategori
            </DialogTitle>
            <DialogDescription>
              Tambah, edit, atau hapus kategori produk
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={() => handleOpenForm()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead className="w-24">Prefix SKU</TableHead>
                    <TableHead className="w-24 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const inUse = isCategoryInUse(category.name);
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                          {inUse && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Digunakan
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {category.prefix}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenForm(category)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(category)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={inUse}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Prefix digunakan untuk generate SKU otomatis (contoh: MKN0001)
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nama Kategori</Label>
              <Input
                id="categoryName"
                value={name}
                onChange={(e) => handleTitleCaseChange(e, setName)}
                placeholder="Contoh: Elektronik"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryPrefix">Prefix SKU (2-3 huruf)</Label>
              <Input
                id="categoryPrefix"
                value={prefix}
                onChange={(e) => handleUpperCaseChange(e, setPrefix)}
                placeholder="Contoh: ELK"
                maxLength={3}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCloseForm}>
                Batal
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori "{deletingCategory?.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
