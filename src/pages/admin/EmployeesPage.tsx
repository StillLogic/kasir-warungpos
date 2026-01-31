import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { toTitleCase, formatPhoneNumber } from "@/lib/text";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/database/employees";
import { Employee } from "@/types/employee";

export function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );

  // Form state
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.position.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const refreshEmployees = () => {
    setEmployees(getEmployees());
  };

  const resetForm = () => {
    setFormName("");
    setFormPosition("");
    setFormPhone("");
    setEditingEmployee(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormName(employee.name);
    setFormPosition(employee.position);
    setFormPhone(employee.phone || "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formPosition.trim()) {
      toast({
        title: "Error",
        description: "Nama dan posisi harus diisi",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: toTitleCase(formName.trim()),
      position: toTitleCase(formPosition.trim()),
      phone: formPhone.trim() ? formatPhoneNumber(formPhone.trim()) : undefined,
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, data);
      toast({ title: "Berhasil", description: "Data karyawan diperbarui" });
    } else {
      createEmployee(data);
      toast({ title: "Berhasil", description: "Karyawan baru ditambahkan" });
    }

    setDialogOpen(false);
    resetForm();
    refreshEmployees();
  };

  const handleDelete = () => {
    if (!employeeToDelete) return;
    deleteEmployee(employeeToDelete.id);
    toast({ title: "Berhasil", description: "Karyawan dihapus" });
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
    refreshEmployees();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            maxLength={50}
          />
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Karyawan
        </Button>
      </div>

      {/* Employee List */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery
              ? "Tidak ada karyawan yang cocok"
              : "Belum ada data karyawan"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {employee.position}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setEmployeeToDelete(employee);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {employee.phone && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {employee.phone}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama karyawan"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posisi *</Label>
              <Input
                id="position"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="Posisi/jabatan"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                maxLength={15}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {editingEmployee ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus karyawan "
              {employeeToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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
