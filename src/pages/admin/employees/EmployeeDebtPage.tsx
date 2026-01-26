import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  Wallet,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Employee, EmployeeDebt, DebtPaymentMethod, EmployeeSummary } from "@/types/employee";
import {
  getEmployeesAsync,
  getEmployeeDebtsByEmployeeAsync,
  saveEmployeeDebtAsync,
  deleteEmployeeDebtAsync,
  markDebtAsPaidAsync,
  getEmployeeSummaryAsync,
} from "@/database/employees";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export function EmployeeDebtPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [debtsByEmployee, setDebtsByEmployee] = useState<Record<string, EmployeeDebt[]>>({});
  const [summaries, setSummaries] = useState<Record<string, EmployeeSummary>>({});
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<EmployeeDebt | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DebtPaymentMethod>("terpisah");
  const [formData, setFormData] = useState({
    date: new Date(),
    description: "",
    amount: "",
  });

  const loadData = async () => {
    setLoading(true);
    const emps = await getEmployeesAsync();
    setEmployees(emps);

    const debtsMap: Record<string, EmployeeDebt[]> = {};
    const summariesMap: Record<string, EmployeeSummary> = {};

    for (const emp of emps) {
      debtsMap[emp.id] = await getEmployeeDebtsByEmployeeAsync(emp.id);
      const summary = await getEmployeeSummaryAsync(emp.id);
      if (summary) {
        summariesMap[emp.id] = summary;
      }
    }

    setDebtsByEmployee(debtsMap);
    setSummaries(summariesMap);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpanded = (empId: string) => {
    const newSet = new Set(expandedEmployees);
    if (newSet.has(empId)) {
      newSet.delete(empId);
    } else {
      newSet.add(empId);
    }
    setExpandedEmployees(newSet);
  };

  const handleOpenDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      date: new Date(),
      description: "",
      amount: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !formData.amount || !formData.description.trim()) {
      toast.error("Keterangan dan nominal wajib diisi");
      return;
    }

    const amount = parseFloat(formData.amount.replace(/[^\d]/g, ""));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }

    try {
      await saveEmployeeDebtAsync({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        date: formData.date.toISOString(),
        description: formData.description.trim(),
        amount,
        isPaid: false,
      });
      toast.success("Hutang berhasil ditambahkan");
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Gagal menyimpan hutang");
    }
  };

  const handleOpenPayDialog = (debt: EmployeeDebt) => {
    setSelectedDebt(debt);
    setPaymentMethod("terpisah");
    setPayDialogOpen(true);
  };

  const handlePay = async () => {
    if (!selectedDebt) return;
    try {
      await markDebtAsPaidAsync(selectedDebt.id, paymentMethod);
      toast.success(
        paymentMethod === "terpisah"
          ? "Hutang lunas (pembayaran terpisah)"
          : "Hutang lunas (potong gaji)"
      );
      setPayDialogOpen(false);
      setSelectedDebt(null);
      loadData();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleDelete = async () => {
    if (!selectedDebt) return;
    try {
      await deleteEmployeeDebtAsync(selectedDebt.id);
      toast.success("Hutang berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedDebt(null);
      loadData();
    } catch {
      toast.error("Gagal menghapus hutang");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Hutang Pegawai</h2>
        <p className="text-sm text-muted-foreground">
          Kelola hutang pegawai dan pembayaran
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Memuat data...
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada pegawai. Tambahkan pegawai terlebih dahulu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {employees.map((emp) => {
            const debts = debtsByEmployee[emp.id] || [];
            const summary = summaries[emp.id];
            const isExpanded = expandedEmployees.has(emp.id);

            return (
              <Card key={emp.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(emp.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{emp.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{emp.position}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-destructive">
                            {formatCurrency(summary?.totalUnpaidDebt || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Hutang Belum Lunas</p>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Summary Cards */}
                      {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <CreditCard className="w-4 h-4" />
                              Total Hutang
                            </div>
                            <p className="text-lg font-semibold">
                              {formatCurrency(summary.totalDebt)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Wallet className="w-4 h-4" />
                              Sudah Lunas
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(summary.totalPaidDebt)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <CreditCard className="w-4 h-4" />
                              Belum Lunas
                            </div>
                            <p className="text-lg font-semibold text-destructive">
                              {formatCurrency(summary.totalUnpaidDebt)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Add Button */}
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => handleOpenDialog(emp)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Tambah Hutang
                        </Button>
                      </div>

                      {/* Debt Table */}
                      {debts.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">
                          Tidak ada hutang tercatat
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Keterangan</TableHead>
                              <TableHead className="text-right">Nominal</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[80px]">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debts.map((debt) => (
                              <TableRow key={debt.id}>
                                <TableCell>
                                  {format(new Date(debt.date), "dd MMM yyyy", { locale: idLocale })}
                                </TableCell>
                                <TableCell>{debt.description}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(debt.amount)}
                                </TableCell>
                                <TableCell>
                                  {debt.isPaid ? (
                                    <div className="space-y-1">
                                      <Badge variant="default" className="bg-green-600">
                                        Lunas
                                      </Badge>
                                      <p className="text-xs text-muted-foreground">
                                        {debt.paymentMethod === "potong_gaji"
                                          ? "Potong Gaji"
                                          : "Terpisah"}
                                        {debt.paidAt &&
                                          ` - ${format(new Date(debt.paidAt), "dd/MM/yy")}`}
                                      </p>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenPayDialog(debt)}
                                    >
                                      Bayar
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedDebt(debt);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Debt Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Hutang - {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(formData.date, "dd MMMM yyyy", { locale: idLocale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(d) => d && setFormData({ ...formData, date: d })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Keterangan *</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Contoh: Pinjaman darurat"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal *</Label>
              <Input
                type="text"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setFormData({ ...formData, amount: value });
                }}
                placeholder="Masukkan nominal"
              />
              {formData.amount && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(parseInt(formData.amount) || 0)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Debt Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bayar Hutang</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground">
              Hutang: <span className="font-semibold text-foreground">
                {formatCurrency(selectedDebt?.amount || 0)}
              </span>
            </p>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as DebtPaymentMethod)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="terpisah" id="terpisah" />
                  <Label htmlFor="terpisah" className="flex-1 cursor-pointer">
                    <span className="font-medium">Pembayaran Terpisah</span>
                    <p className="text-sm text-muted-foreground">
                      Pegawai membayar langsung secara terpisah
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="potong_gaji" id="potong_gaji" />
                  <Label htmlFor="potong_gaji" className="flex-1 cursor-pointer">
                    <span className="font-medium">Potong Gaji</span>
                    <p className="text-sm text-muted-foreground">
                      Hutang dipotong dari gaji pegawai
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handlePay}>Konfirmasi Pembayaran</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hutang?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus hutang ini? Tindakan ini tidak dapat
              dibatalkan.
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
