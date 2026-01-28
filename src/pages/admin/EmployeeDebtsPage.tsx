import { useState, useMemo } from "react";
import { Plus, Search, CreditCard, Trash2, Calendar, Filter, Scissors, ChevronDown } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import {
  getEmployees,
  getEmployeeDebts,
  createEmployeeDebt,
  payEmployeeDebt,
  deleteEmployeeDebt,
  getEmployeeDebtPayments,
} from "@/database/employees";
import { Employee, EmployeeDebt, EmployeeDebtPayment } from "@/types/employee";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function EmployeeDebtsPage() {
  const { toast } = useToast();
  const [employees] = useState<Employee[]>(() => getEmployees());
  const [debts, setDebts] = useState<EmployeeDebt[]>(() => getEmployeeDebts());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Add debt dialog - using string for PriceInput
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  
  // Pay debt dialog - using string for PriceInput
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [debtToPay, setDebtToPay] = useState<EmployeeDebt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "salary_deduction">("cash");
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<EmployeeDebt | null>(null);
  
  // Payment history
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, EmployeeDebtPayment[]>>({});

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const matchesSearch =
        d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEmployee = filterEmployee === "all" || d.employeeId === filterEmployee;
      const matchesStatus = filterStatus === "all" || d.status === filterStatus;
      return matchesSearch && matchesEmployee && matchesStatus;
    });
  }, [debts, searchQuery, filterEmployee, filterStatus]);

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

  const openPayDialog = (debt: EmployeeDebt) => {
    setDebtToPay(debt);
    setPayAmount(String(debt.remainingAmount));
    setPayMethod("cash");
    setPayDialogOpen(true);
  };

  const handlePayDebt = () => {
    if (!debtToPay) return;

    const amount = Number(payAmount) || 0;
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Nominal pembayaran harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    if (amount > debtToPay.remainingAmount) {
      toast({
        title: "Error",
        description: "Nominal melebihi sisa hutang",
        variant: "destructive",
      });
      return;
    }

    payEmployeeDebt(debtToPay.id, amount, payMethod);
    toast({
      title: "Berhasil",
      description: `Pembayaran ${formatCurrency(amount)} berhasil dicatat`,
    });
    setPayDialogOpen(false);
    setDebtToPay(null);
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

  const togglePaymentHistory = (debtId: string) => {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
    } else {
      if (!paymentHistory[debtId]) {
        const payments = getEmployeeDebtPayments(debtId);
        setPaymentHistory((prev) => ({ ...prev, [debtId]: payments }));
      }
      setExpandedDebtId(debtId);
    }
  };

  const getStatusBadge = (status: EmployeeDebt["status"]) => {
    const variants: Record<EmployeeDebt["status"], { label: string; className: string }> = {
      unpaid: { label: "Belum Dibayar", className: "bg-red-500/10 text-red-500" },
      partial: { label: "Sebagian", className: "bg-orange-500/10 text-orange-500" },
      paid: { label: "Lunas", className: "bg-green-500/10 text-green-500" },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const totalUnpaid = filteredDebts
    .filter((d) => d.status !== "paid")
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Hutang Belum Lunas</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalUnpaid)}</p>
        </CardContent>
      </Card>

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

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="unpaid">Belum Dibayar</SelectItem>
              <SelectItem value="partial">Sebagian</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterEmployee !== "all" || filterStatus !== "all"
              ? "Tidak ada hutang yang cocok"
              : "Belum ada data hutang karyawan"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDebts.map((debt) => (
            <Collapsible
              key={debt.id}
              open={expandedDebtId === debt.id}
              onOpenChange={() => togglePaymentHistory(debt.id)}
            >
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{debt.employeeName}</span>
                        {getStatusBadge(debt.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{debt.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(debt.createdAt), "dd MMM yyyy", { locale: localeId })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-muted-foreground">Total: {formatCurrency(debt.amount)}</p>
                      <p className="font-semibold text-lg text-destructive">
                        Sisa: {formatCurrency(debt.remainingAmount)}
                      </p>
                      <div className="flex gap-1 mt-2 justify-end">
                        {debt.status !== "paid" && (
                          <Button variant="outline" size="sm" onClick={() => openPayDialog(debt)}>
                            <CreditCard className="h-4 w-4 mr-1" />
                            Bayar
                          </Button>
                        )}
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedDebtId === debt.id ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
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
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-sm font-medium">Riwayat Pembayaran</p>
                      {paymentHistory[debt.id]?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada pembayaran</p>
                      ) : (
                        <div className="space-y-2">
                          {paymentHistory[debt.id]?.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2"
                            >
                              <div className="flex items-center gap-2">
                                {payment.method === "salary_deduction" ? (
                                  <Scissors className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <CreditCard className="h-4 w-4 text-green-500" />
                                )}
                                <span>
                                  {payment.method === "salary_deduction" ? "Potong Gaji" : "Tunai"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                <span className="text-muted-foreground ml-2">
                                  {format(new Date(payment.createdAt), "dd/MM/yy", { locale: localeId })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
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
              <PriceInput value={formAmount} onChange={setFormAmount} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddDebt}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Debt Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bayar Hutang</DialogTitle>
          </DialogHeader>
          {debtToPay && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{debtToPay.employeeName}</p>
                <p className="text-sm text-muted-foreground">{debtToPay.description}</p>
                <p className="text-sm mt-2">
                  Sisa hutang: <span className="font-semibold">{formatCurrency(debtToPay.remainingAmount)}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <RadioGroup
                  value={payMethod}
                  onValueChange={(v) => setPayMethod(v as "cash" | "salary_deduction")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer">
                      Tunai
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="salary_deduction" id="salary_deduction" />
                    <Label htmlFor="salary_deduction" className="cursor-pointer">
                      Potong Gaji
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Nominal Pembayaran</Label>
                <PriceInput value={payAmount} onChange={setPayAmount} placeholder="0" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handlePayDebt}>Bayar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hutang?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus hutang {formatCurrency(debtToDelete?.amount || 0)} dari{" "}
              {debtToDelete?.employeeName}? Riwayat pembayaran juga akan dihapus.
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
