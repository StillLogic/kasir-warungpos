import { useState, useMemo } from "react";
import { Plus, Search, Trash2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import {
  getEmployees,
  getEmployeeDebts,
  createEmployeeDebt,
  deleteEmployeeDebt,
} from "@/database/employees";
import { Employee, EmployeeDebt } from "@/types/employee";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function EmployeeDebtsPage() {
  const { toast } = useToast();
  const [employees] = useState<Employee[]>(() => getEmployees());
  const [debts, setDebts] = useState<EmployeeDebt[]>(() => getEmployeeDebts());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");

  // Add debt dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<EmployeeDebt | null>(null);

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const matchesSearch =
        d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEmployee =
        filterEmployee === "all" || d.employeeId === filterEmployee;
      return matchesSearch && matchesEmployee;
    });
  }, [debts, searchQuery, filterEmployee]);

  // Group debts by employee
  const debtsByEmployee = useMemo(() => {
    const grouped: Record<
      string,
      {
        employeeName: string;
        debts: EmployeeDebt[];
        total: number;
      }
    > = {};

    filteredDebts.forEach((debt) => {
      if (!grouped[debt.employeeId]) {
        grouped[debt.employeeId] = {
          employeeName: debt.employeeName,
          debts: [],
          total: 0,
        };
      }
      grouped[debt.employeeId].debts.push(debt);
      grouped[debt.employeeId].total += debt.amount;
    });

    // Sort employees by name
    return Object.entries(grouped)
      .sort(([, a], [, b]) => a.employeeName.localeCompare(b.employeeName))
      .map(([employeeId, data]) => ({
        employeeId,
        ...data,
      }));
  }, [filteredDebts]);

  const refreshDebts = () => {
    setDebts(getEmployeeDebts());
  };

  const resetAddForm = () => {
    setFormEmployeeId("");
    setFormDescription("");
    setFormAmount("");
  };

  const handleAddDebt = () => {
    const employee = employees.find((e) => e.id === formEmployeeId);
    if (!employee) {
      toast({
        title: "Error",
        description: "Pilih karyawan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const amount = Number(formAmount) || 0;
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Nominal harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    createEmployeeDebt({
      employeeId: employee.id,
      employeeName: employee.name,
      description: formDescription.trim() || "Hutang",
      amount,
    });

    toast({ title: "Berhasil", description: "Hutang karyawan ditambahkan" });
    setAddDialogOpen(false);
    resetAddForm();
    refreshDebts();
  };

  const handleDelete = () => {
    if (!debtToDelete) return;
    deleteEmployeeDebt(debtToDelete.id);
    toast({ title: "Berhasil", description: "Hutang dihapus" });
    setDeleteDialogOpen(false);
    setDebtToDelete(null);
    refreshDebts();
  };

  const total = filteredDebts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari hutang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              maxLength={50}
            />
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Hutang
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Karyawan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Karyawan</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debts Table by Employee */}
      {debtsByEmployee.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterEmployee !== "all"
              ? "Tidak ada hutang yang cocok"
              : "Belum ada data hutang karyawan"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {debtsByEmployee.map((employeeData) => (
            <Card key={employeeData.employeeId}>
              <CardContent className="pt-4">
                {/* Employee Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="font-semibold text-lg">
                    {employeeData.employeeName}
                  </h3>
                  <span className="font-medium text-destructive">
                    -{formatCurrency(employeeData.total)}
                  </span>
                </div>

                {/* Debts Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                          Tanggal
                        </th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                          Keterangan
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                          Nominal
                        </th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.debts.map((debt) => (
                        <tr key={debt.id} className="border-b last:border-0">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(debt.createdAt), "dd MMM yyyy", {
                                locale: localeId,
                              })}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {debt.description}
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-destructive">
                            -{formatCurrency(debt.amount)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDebtToDelete(debt);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Debt Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Hutang Karyawan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan *</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} - {e.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Keterangan hutang"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal *</Label>
              <PriceInput
                value={formAmount}
                onChange={setFormAmount}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={handleAddDebt}>Tambah</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hutang?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus hutang{" "}
              {formatCurrency(debtToDelete?.amount || 0)} dari{" "}
              {debtToDelete?.employeeName}? Riwayat pembayaran juga akan
              dihapus.
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
