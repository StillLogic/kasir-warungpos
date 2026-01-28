import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Calendar, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import {
  getEmployees,
  getEarnings,
  getEmployeeDebts,
  getSettlements,
  createSettlement,
} from "@/database/employees";
import {
  Employee,
  EmployeeEarning,
  EmployeeDebt,
  EmployeeSettlement,
} from "@/types/employee";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type RecordItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "earning" | "debt" | "settlement";
  category: string;
  description: string;
  amount: number;
  createdAt: string;
};

export function EmployeeRecordsPage() {
  const { toast } = useToast();
  const [employees] = useState<Employee[]>(() => getEmployees());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Settlement dialog state
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    balance: number;
  } | null>(null);
  const [settlementAmount, setSettlementAmount] = useState("");

  // Set default amount when dialog opens
  useEffect(() => {
    if (selectedEmployee) {
      setSettlementAmount(Math.abs(selectedEmployee.balance).toString());
    }
  }, [selectedEmployee]);

  // Combine earnings, debts, and settlements into single record list
  const allRecords = useMemo(() => {
    const earnings = getEarnings();
    const debts = getEmployeeDebts();
    const settlements = getSettlements();

    const earningRecords: RecordItem[] = earnings.map((e: EmployeeEarning) => ({
      id: `earning-${e.id}`,
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      type: "earning" as const,
      category: e.type === "salary" ? "Pokok" : "Komisi",
      description: e.description,
      amount: e.amount,
      createdAt: e.createdAt,
    }));

    const debtRecords: RecordItem[] = debts.map((d: EmployeeDebt) => ({
      id: `debt-${d.id}`,
      employeeId: d.employeeId,
      employeeName: d.employeeName,
      type: "debt" as const,
      category: "Hutang",
      description: d.description,
      amount: d.amount,
      createdAt: d.createdAt,
    }));

    const settlementRecords: RecordItem[] = settlements.map(
      (s: EmployeeSettlement) => ({
        id: `settlement-${s.id}`,
        employeeId: s.employeeId,
        employeeName: s.employeeName,
        type: "settlement" as const,
        category:
          s.type === "admin_to_employee" ? "Dibayar Admin" : "Dibayar Pekerja",
        description: s.description,
        amount: s.amount,
        createdAt: s.createdAt,
      }),
    );

    // Combine and sort by date (newest first)
    return [...earningRecords, ...debtRecords, ...settlementRecords].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const matchesSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEmployee =
        filterEmployee === "all" || r.employeeId === filterEmployee;
      const matchesType = filterType === "all" || r.type === filterType;
      return matchesSearch && matchesEmployee && matchesType;
    });
  }, [allRecords, searchQuery, filterEmployee, filterType]);

  // Group records by employee
  const recordsByEmployee = useMemo(() => {
    const grouped: Record<
      string,
      {
        employeeName: string;
        records: RecordItem[];
        totalEarning: number;
        totalDebt: number;
        totalSettlement: number; // positive = admin paid, negative = employee paid
      }
    > = {};

    filteredRecords.forEach((record) => {
      if (!grouped[record.employeeId]) {
        grouped[record.employeeId] = {
          employeeName: record.employeeName,
          records: [],
          totalEarning: 0,
          totalDebt: 0,
          totalSettlement: 0,
        };
      }
      grouped[record.employeeId].records.push(record);
      if (record.type === "earning") {
        grouped[record.employeeId].totalEarning += record.amount;
      } else if (record.type === "debt") {
        grouped[record.employeeId].totalDebt += record.amount;
      } else if (record.type === "settlement") {
        // If admin paid employee (surplus case), it reduces balance
        // If employee paid admin (minus case), it increases balance
        if (record.category === "Dibayar Admin") {
          grouped[record.employeeId].totalSettlement += record.amount; // Admin paid, reduces surplus
        } else {
          grouped[record.employeeId].totalSettlement -= record.amount; // Employee paid, reduces debt
        }
      }
    });

    // Sort employees by name
    return Object.entries(grouped)
      .sort(([, a], [, b]) => a.employeeName.localeCompare(b.employeeName))
      .map(([employeeId, data]) => ({
        employeeId,
        ...data,
      }));
  }, [filteredRecords]);

  const handleSettlement = (
    employeeId: string,
    employeeName: string,
    balance: number,
  ) => {
    setSelectedEmployee({ id: employeeId, name: employeeName, balance });
    setSettlementDialogOpen(true);
  };

  const confirmSettlement = () => {
    if (!selectedEmployee || selectedEmployee.balance === 0) return;

    const amount = Number(settlementAmount) || 0;
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Nominal harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    const balance = selectedEmployee.balance;
    const isAdminPaying = balance > 0; // Surplus = admin pays employee

    createSettlement({
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      type: isAdminPaying ? "admin_to_employee" : "employee_to_admin",
      amount,
      description: isAdminPaying
        ? "Pembayaran gaji ke karyawan"
        : "Pelunasan hutang dari karyawan",
    });

    toast({
      title: "Berhasil",
      description: isAdminPaying
        ? `Pembayaran ${formatCurrency(amount)} ke ${selectedEmployee.name} dicatat`
        : `Pelunasan ${formatCurrency(amount)} dari ${selectedEmployee.name} dicatat`,
    });

    setSettlementDialogOpen(false);
    setSelectedEmployee(null);
    setSettlementAmount("");
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pencatatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              maxLength={50}
            />
          </div>
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
              <SelectItem value="earning">Pendapatan</SelectItem>
              <SelectItem value="debt">Hutang</SelectItem>
              <SelectItem value="settlement">Pembayaran</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Records List by Employee */}
      {recordsByEmployee.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery || filterEmployee !== "all" || filterType !== "all"
              ? "Tidak ada pencatatan yang cocok"
              : "Belum ada data pencatatan"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {recordsByEmployee.map((employeeData) => (
            <Card key={employeeData.employeeId}>
              <CardContent className="pt-4">
                {/* Employee Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="font-semibold text-lg">
                    {employeeData.employeeName}
                  </h3>
                  {(() => {
                    // Balance = earnings - debts - settlements
                    const balance =
                      employeeData.totalEarning -
                      employeeData.totalDebt -
                      employeeData.totalSettlement;
                    const isPositive = balance >= 0;
                    return (
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-medium ${isPositive ? "text-primary" : "text-destructive"}`}
                        >
                          {isPositive ? "+" : ""}
                          {formatCurrency(balance)}
                        </span>
                        {balance !== 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSettlement(
                                employeeData.employeeId,
                                employeeData.employeeName,
                                balance,
                              )
                            }
                          >
                            <Banknote className="h-4 w-4 mr-1" />
                            Bayar
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Records Table */}
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
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.records.map((record) => {
                        // Determine badge and text colors
                        let badgeClass = "";
                        let textClass = "";
                        let prefix = "";

                        if (record.type === "earning") {
                          badgeClass = "bg-primary/10 text-primary";
                          textClass = "text-primary";
                          prefix = "+";
                        } else if (record.type === "debt") {
                          badgeClass = "bg-destructive/10 text-destructive";
                          textClass = "text-destructive";
                          prefix = "-";
                        } else if (record.type === "settlement") {
                          badgeClass = "bg-yellow-500/10 text-yellow-600";
                          textClass = "text-yellow-600";
                          // Admin paid employee = deduction from balance (-)
                          // Employee paid admin = addition to balance (+)
                          prefix =
                            record.category === "Dibayar Admin" ? "-" : "+";
                        }

                        return (
                          <tr
                            key={record.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(record.createdAt),
                                  "dd MMM yyyy",
                                  { locale: localeId },
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <Badge className={badgeClass}>
                                {record.category}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {record.description}
                            </td>
                            <td
                              className={`py-2 px-2 text-right font-medium ${textClass}`}
                            >
                              {prefix}
                              {formatCurrency(record.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Settlement Confirmation Dialog */}
      <Dialog
        open={settlementDialogOpen}
        onOpenChange={setSettlementDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Karyawan
                  </span>
                  <span className="font-medium">{selectedEmployee.name}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    Saldo saat ini
                  </span>
                  <span
                    className={`font-medium ${
                      selectedEmployee.balance >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {selectedEmployee.balance >= 0 ? "+" : ""}
                    {formatCurrency(selectedEmployee.balance)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedEmployee.balance > 0
                  ? "Admin membayar ke karyawan (surplus)"
                  : "Karyawan membayar ke admin (hutang)"}
              </p>

              <div className="space-y-2">
                <Label>Nominal Pembayaran *</Label>
                <PriceInput
                  value={settlementAmount}
                  onChange={setSettlementAmount}
                  placeholder="0"
                />
              </div>

              {(() => {
                const amount = Number(settlementAmount) || 0;
                const newBalance =
                  selectedEmployee.balance > 0
                    ? selectedEmployee.balance - amount
                    : selectedEmployee.balance + amount;
                return (
                  <div className="p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Saldo setelah pembayaran
                      </span>
                      <span
                        className={`font-semibold ${
                          newBalance >= 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {newBalance >= 0 ? "+" : ""}
                        {formatCurrency(newBalance)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettlementDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={confirmSettlement}>Konfirmasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
