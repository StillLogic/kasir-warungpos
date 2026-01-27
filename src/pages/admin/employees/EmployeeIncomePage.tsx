import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Check,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Employee, EmployeeIncome, IncomeType, INCOME_TYPE_LABELS, EmployeeSummary } from "@/types/employee";
import {
  getEmployeesAsync,
  getEmployeeIncomesByEmployeeAsync,
  saveEmployeeIncomeAsync,
  deleteEmployeeIncomeAsync,
  markIncomeAsPaidAsync,
  getEmployeeSummaryAsync,
} from "@/database/employees";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { PriceInput } from "@/components/ui/price-input";
import { handleTitleCaseChange } from "@/lib/text";
import { Input } from "@/components/ui/input";

export function EmployeeIncomePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [incomesByEmployee, setIncomesByEmployee] = useState<Record<string, EmployeeIncome[]>>({});
  const [summaries, setSummaries] = useState<Record<string, EmployeeSummary>>({});
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<EmployeeIncome | null>(null);
  const [viewMode, setViewMode] = useState<"full" | "after_debt">("full");
  const [formData, setFormData] = useState({
    date: new Date(),
    type: "gaji_pokok" as IncomeType,
    description: "",
    amount: "",
  });

  const loadData = async () => {
    setLoading(true);
    const emps = await getEmployeesAsync();
    setEmployees(emps);

    const incomesMap: Record<string, EmployeeIncome[]> = {};
    const summariesMap: Record<string, EmployeeSummary> = {};

    for (const emp of emps) {
      incomesMap[emp.id] = await getEmployeeIncomesByEmployeeAsync(emp.id);
      const summary = await getEmployeeSummaryAsync(emp.id);
      if (summary) {
        summariesMap[emp.id] = summary;
      }
    }

    setIncomesByEmployee(incomesMap);
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
      type: "gaji_pokok",
      description: "",
      amount: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !formData.amount) {
      toast.error("Nominal wajib diisi");
      return;
    }

    const amount = parseFloat(formData.amount.replace(/[^\d]/g, ""));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }

    try {
      await saveEmployeeIncomeAsync({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        date: formData.date.toISOString(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        amount,
        isPaid: false,
      });
      toast.success("Pendapatan berhasil ditambahkan");
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Gagal menyimpan pendapatan");
    }
  };

  const handleMarkAsPaid = async (income: EmployeeIncome) => {
    try {
      await markIncomeAsPaidAsync(income.id);
      toast.success("Status pembayaran diperbarui");
      loadData();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleDelete = async () => {
    if (!selectedIncome) return;
    try {
      await deleteEmployeeIncomeAsync(selectedIncome.id);
      toast.success("Pendapatan berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedIncome(null);
      loadData();
    } catch {
      toast.error("Gagal menghapus pendapatan");
    }
  };

  const getDisplayedIncome = (empId: string) => {
    const summary = summaries[empId];
    if (!summary) return 0;
    return viewMode === "full" ? summary.totalIncome : summary.netIncome;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pendapatan Pegawai</h2>
          <p className="text-sm text-muted-foreground">
            Kelola pendapatan pegawai per periode
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Tampilkan:</Label>
          <RadioGroup
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "full" | "after_debt")}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="text-sm cursor-pointer">
                Full (Tanpa Potong)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="after_debt" id="after_debt" />
              <Label htmlFor="after_debt" className="text-sm cursor-pointer">
                Setelah Potong Hutang
              </Label>
            </div>
          </RadioGroup>
        </div>
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
            const incomes = incomesByEmployee[emp.id] || [];
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
                          <p className="text-lg font-semibold text-primary">
                            {formatCurrency(getDisplayedIncome(emp.id))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {viewMode === "full" ? "Total Pendapatan" : "Setelah Potong Hutang"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Summary Cards */}
                      {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Wallet className="w-4 h-4" />
                              Total Pendapatan
                            </div>
                            <p className="text-lg font-semibold">
                              {formatCurrency(summary.totalIncome)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <TrendingDown className="w-4 h-4" />
                              Total Hutang
                            </div>
                            <p className="text-lg font-semibold text-destructive">
                              {formatCurrency(summary.totalDebt)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <TrendingUp className="w-4 h-4" />
                              Pendapatan Bersih
                            </div>
                            <p className="text-lg font-semibold text-primary">
                              {formatCurrency(summary.netIncome)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Check className="w-4 h-4" />
                              Sudah Dibayar
                            </div>
                            <p className="text-lg font-semibold">
                              {formatCurrency(summary.totalPaidIncome)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Add Button */}
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => handleOpenDialog(emp)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Tambah Pendapatan
                        </Button>
                      </div>

                      {/* Income Table */}
                      {incomes.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">
                          Belum ada pendapatan tercatat
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Jenis</TableHead>
                              <TableHead>Keterangan</TableHead>
                              <TableHead className="text-right">Nominal</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[80px]">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {incomes.map((inc) => (
                              <TableRow key={inc.id}>
                                <TableCell>
                                  {format(new Date(inc.date), "dd MMM yyyy", { locale: idLocale })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {INCOME_TYPE_LABELS[inc.type]}
                                  </Badge>
                                </TableCell>
                                <TableCell>{inc.description || "-"}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(inc.amount)}
                                </TableCell>
                                <TableCell>
                                  {inc.isPaid ? (
                                    <Badge variant="default" className="bg-green-600">
                                      Dibayar {inc.paidAt && format(new Date(inc.paidAt), "dd/MM/yy")}
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkAsPaid(inc)}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Bayar
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedIncome(inc);
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

      {/* Add Income Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pendapatan - {selectedEmployee?.name}</DialogTitle>
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
              <Label>Jenis Pendapatan</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as IncomeType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INCOME_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  handleTitleCaseChange(e, (v) => setFormData({ ...formData, description: v }))
                }
                placeholder="Keterangan tambahan (opsional)"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal *</Label>
              <PriceInput
                value={formData.amount}
                onChange={(v) => setFormData({ ...formData, amount: v })}
                placeholder="Masukkan nominal"
              />
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pendapatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus pendapatan ini? Tindakan ini tidak dapat
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
