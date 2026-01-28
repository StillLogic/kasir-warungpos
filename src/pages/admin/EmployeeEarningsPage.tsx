import { useState, useMemo } from "react";
import { Plus, Search, Check, Trash2, Calendar, Filter } from "lucide-react";
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
  markEarningAsPaid,
  deleteEarning,
} from "@/database/employees";
import { Employee, EmployeeEarning } from "@/types/employee";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function EmployeeEarningsPage() {
  const { toast } = useToast();
  const [employees] = useState<Employee[]>(() => getEmployees());
  const [earnings, setEarnings] = useState<EmployeeEarning[]>(() => getEarnings());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [earningToDelete, setEarningToDelete] = useState<EmployeeEarning | null>(null);

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
      const matchesEmployee = filterEmployee === "all" || e.employeeId === filterEmployee;
      const matchesType = filterType === "all" || e.type === filterType;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "paid" && e.isPaid) ||
        (filterStatus === "unpaid" && !e.isPaid);
      return matchesSearch && matchesEmployee && matchesType && matchesStatus;
    });
  }, [earnings, searchQuery, filterEmployee, filterType, filterStatus]);

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
        return "Gaji Bulanan";
      case "commission":
        return "Komisi Transaksi";
      case "bonus":
        return "Bonus";
      case "other":
        return "Pendapatan Lain";
    }
  };

  const handleMarkAsPaid = (id: string) => {
    markEarningAsPaid(id);
    toast({ title: "Berhasil", description: "Pendapatan ditandai sudah dibayar" });
    refreshEarnings();
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
    const variants: Record<EmployeeEarning["type"], { label: string; className: string }> = {
      salary: { label: "Gaji", className: "bg-blue-500/10 text-blue-500" },
      commission: { label: "Komisi", className: "bg-green-500/10 text-green-500" },
      bonus: { label: "Bonus", className: "bg-yellow-500/10 text-yellow-500" },
      other: { label: "Lainnya", className: "bg-gray-500/10 text-gray-500" },
    };
    const variant = variants[type];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const totalUnpaid = filteredEarnings.filter((e) => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = filteredEarnings.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Belum Dibayar</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalUnpaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

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
              <SelectItem value="salary">Gaji</SelectItem>
              <SelectItem value="commission">Komisi</SelectItem>
              <SelectItem value="bonus">Bonus</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="unpaid">Belum Dibayar</SelectItem>
              <SelectItem value="paid">Sudah Dibayar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Earnings List */}
      {filteredEarnings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterEmployee !== "all" || filterType !== "all" || filterStatus !== "all"
              ? "Tidak ada pendapatan yang cocok"
              : "Belum ada data pendapatan"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEarnings.map((earning) => (
            <Card key={earning.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{earning.employeeName}</span>
                      {getTypeBadge(earning.type)}
                      {earning.isPaid ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Dibayar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          Belum Dibayar
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{earning.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(earning.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                      {earning.isPaid && earning.paidAt && (
                        <span className="text-green-600">
                          • Dibayar {format(new Date(earning.paidAt), "dd MMM yyyy", { locale: localeId })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-lg">{formatCurrency(earning.amount)}</p>
                    <div className="flex gap-1 mt-2 justify-end">
                      {!earning.isPaid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(earning.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Bayar
                        </Button>
                      )}
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
                    </div>
                  </div>
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
              <Select value={formType} onValueChange={(v) => setFormType(v as EmployeeEarning["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Gaji</SelectItem>
                  <SelectItem value="commission">Komisi</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
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
              <PriceInput value={formAmount} onChange={setFormAmount} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pendapatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pendapatan {formatCurrency(earningToDelete?.amount || 0)} untuk{" "}
              {earningToDelete?.employeeName}?
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
