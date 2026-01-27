import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Employee } from "@/types/employee";
import {
  getEmployeesAsync,
  saveEmployeeAsync,
  updateEmployeeAsync,
  deleteEmployeeAsync,
} from "@/database/employees";
import { toast } from "sonner";
import { handleTitleCaseChange, handlePhoneChange, handlePhoneBlur } from "@/lib/text";

export function EmployeeNamesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ name: "", position: "", phone: "" });

  const loadEmployees = async () => {
    setLoading(true);
    const data = await getEmployeesAsync();
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        name: employee.name,
        position: employee.position,
        phone: employee.phone || "",
      });
    } else {
      setSelectedEmployee(null);
      setFormData({ name: "", position: "", phone: "" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.position.trim()) {
      toast.error("Nama dan posisi wajib diisi");
      return;
    }

    try {
      if (selectedEmployee) {
        await updateEmployeeAsync(selectedEmployee.id, {
          name: formData.name.trim(),
          position: formData.position.trim(),
          phone: formData.phone.trim() || undefined,
        });
        toast.success("Pegawai berhasil diperbarui");
      } else {
        await saveEmployeeAsync({
          name: formData.name.trim(),
          position: formData.position.trim(),
          phone: formData.phone.trim() || undefined,
        });
        toast.success("Pegawai berhasil ditambahkan");
      }
      setDialogOpen(false);
      loadEmployees();
    } catch {
      toast.error("Gagal menyimpan pegawai");
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployeeAsync(selectedEmployee.id);
      toast.success("Pegawai berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch {
      toast.error("Gagal menghapus pegawai");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nama Pegawai</h2>
          <p className="text-sm text-muted-foreground">
            Kelola data pegawai dan posisi
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pegawai
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar Pegawai ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada pegawai. Klik "Tambah Pegawai" untuk menambahkan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(emp)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? "Edit Pegawai" : "Tambah Pegawai"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Pegawai *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  handleTitleCaseChange(e, (v) => setFormData({ ...formData, name: v }))
                }
                placeholder="Masukkan nama pegawai"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posisi *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  handleTitleCaseChange(e, (v) => setFormData({ ...formData, position: v }))
                }
                placeholder="Contoh: Kasir, Pelayan, Chef"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  handlePhoneChange(e, (v) => setFormData({ ...formData, phone: v }))
                }
                onBlur={() =>
                  handlePhoneBlur(formData.phone, (v) => setFormData({ ...formData, phone: v }))
                }
                placeholder="Contoh: 081234567890"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Otomatis diformat ke +62</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {selectedEmployee ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pegawai?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus pegawai "{selectedEmployee?.name}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
