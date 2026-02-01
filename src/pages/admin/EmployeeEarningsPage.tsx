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
import { Badge } from "@/components/ui/badge";
import { PriceInput } from "@/components/ui/price-input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import {
  getEmployees,
  getEarnings,
  createEarning,
  deleteEarning,
} from "@/database/employees";
import { Employee, EmployeeEarning } from "@/types/employee";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function EmployeeEarningsPage() {
  const { toast } = useToast();
  const [employees] = useState<Employee[]>(() => getEmployees());
  const [earnings, setEarnings] = useState<EmployeeEarning[]>(() =>
    getEarnings(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [earningToDelete, setEarningToDelete] =
    useState<EmployeeEarning | null>(null);

  // Form state - using string for PriceInput
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formType, setFormType] = useState<EmployeeEarning["type"]>("salary");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const filteredEarnings = useMemo(() => {
    return earnings.filter((e) => {
      const matchesSearch =
        e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEmployee =
        filterEmployee === "all" || e.employeeId === filterEmployee;
      const matchesType = filterType === "all" || e.type === filterType;
      return matchesSearch && matchesEmployee && matchesType;
    });
  }, [earnings, searchQuery, filterEmployee, filterType]);

  // Group earnings by employee
  const earningsByEmployee = useMemo(() => {
    const grouped: Record<
      string,
      {
        employeeName: string;
        earnings: EmployeeEarning[];
        total: number;
      }
    > = {};

    filteredEarnings.forEach((earning) => {
      if (!grouped[earning.employeeId]) {
        grouped[earning.employeeId] = {
          employeeName: earning.employeeName,
          earnings: [],
          total: 0,
        };
      }
      grouped[earning.employeeId].earnings.push(earning);
      grouped[earning.employeeId].total += earning.amount;
    });

    // Sort employees by name
    return Object.entries(grouped)
      .sort(([, a], [, b]) => a.employeeName.localeCompare(b.employeeName))
      .map(([employeeId, data]) => ({
        employeeId,
        ...data,
      }));
  }, [filteredEarnings]);

  const refreshEarnings = () => {
    setEarnings(getEarnings());
  };

  const resetForm = () => {
    setFormEmployeeId("");
    setFormType("salary");
    setFormDescription("");
    setFormAmount("");
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = () => {
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

    createEarning({
      employeeId: employee.id,
      employeeName: employee.name,
      type: formType,
      description: formDescription.trim() || getDefaultDescription(formType),
      amount,
    });

    toast({ title: "Berhasil", description: "Pendapatan ditambahkan" });
    setDialogOpen(false);
    resetForm();
    refreshEarnings();
  };

  const getDefaultDescription = (type: EmployeeEarning["type"]): string => {
    switch (type) {
      case "salary":
        return "Gaji Pokok";
      case "commission":
        return "Komisi";
    }
  };

  const handleDelete = () => {
    if (!earningToDelete) return;
    deleteEarning(earningToDelete.id);
    toast({ title: "Berhasil", description: "Pendapatan dihapus" });
    setDeleteDialogOpen(false);
    setEarningToDelete(null);
    refreshEarnings();
  };

  const getTypeBadge = (type: EmployeeEarning["type"]) => {
    const variants: Record<
      EmployeeEarning["type"],
      { label: string; className: string }
    > = {
      salary: { label: "Pokok", className: "bg-blue-500/10 text-blue-500" },
      commission: {
        label: "Komisi",
        className: "bg-green-500/10 text-green-500",
      },
      bonus: { label: "Bonus", className: "bg-purple-500/10 text-purple-500" },
      other: { label: "Lainnya", className: "bg-gray-500/10 text-gray-500" },
    };
    const variant = variants[type];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const total = filteredEarnings.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pendapatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              maxLength={50}
            />
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pendapatan
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

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="salary">Pokok</SelectItem>
              <SelectItem value="commission">Komisi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Earnings Table by Employee */}
      {earningsByEmployee.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterEmployee !== "all" || filterType !== "all"
              ? "Tidak ada pendapatan yang cocok"
              : "Belum ada data pendapatan"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {earningsByEmployee.map((employeeData) => (
            <Card key={employeeData.employeeId}>
              <CardContent className="pt-4">
                {/* Employee Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="font-semibold text-lg">
                    {employeeData.employeeName}
                  </h3>
                  <span className="font-medium text-primary">
                    +{formatCurrency(employeeData.total)}
                  </span>
                </div>

                {/* Earnings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                          Tanggal
                        </th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                          Tipe
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
                      {employeeData.earnings.map((earning) => (
                        <tr key={earning.id} className="border-b last:border-0">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(
                                new Date(earning.createdAt),
                                "dd MMM yyyy",
                                { locale: localeId },
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            {getTypeBadge(earning.type)}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {earning.description}
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-primary">
                            +{formatCurrency(earning.amount)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setEarningToDelete(earning);
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

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pendapatan</DialogTitle>
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
              <Label>Tipe *</Label>
              <Select
                value={formType}
                onValueChange={(v) => setFormType(v as EmployeeEarning["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Pokok</SelectItem>
                  <SelectItem value="commission">Komisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi (opsional)"
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
            <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>Tambah</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pendapatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pendapatan{" "}
              {formatCurrency(earningToDelete?.amount || 0)} untuk{" "}
              {earningToDelete?.employeeName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 pt-4">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
