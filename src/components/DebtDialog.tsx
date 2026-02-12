import { useState, useMemo } from "react";
import { CartItem } from "@/types/pos";
import { Customer } from "@/types/debt";
import { Employee } from "@/types/employee";
import { formatCurrency } from "@/lib/format";
import { toTitleCase, handlePhoneChange, handlePhoneBlur } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, User, Check, Briefcase } from "lucide-react";
import {
  getCustomers,
  addCustomer,
  searchCustomers,
} from "@/database/customers";
import { getEmployees } from "@/database/employees";
import { cn } from "@/lib/utils";

interface DebtDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (customer: Customer) => void;
  onConfirmEmployee?: (employee: Employee) => void;
  total: number;
  items: CartItem[];
}

export function DebtDialog({
  open,
  onClose,
  onConfirm,
  onConfirmEmployee,
  total,
  items,
}: DebtDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [employees] = useState<Employee[]>(() => getEmployees());
  const [activeTab, setActiveTab] = useState<"customer" | "employee">(
    "customer",
  );

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    return searchCustomers(search);
  }, [search, customers]);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, employees]);

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;

    const newCustomer = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || undefined,
    });

    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    setShowAddForm(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
  };

  const handleConfirm = () => {
    if (activeTab === "customer" && selectedCustomer) {
      onConfirm(selectedCustomer);
      setSelectedCustomer(null);
      setSearch("");
    } else if (
      activeTab === "employee" &&
      selectedEmployee &&
      onConfirmEmployee
    ) {
      onConfirmEmployee(selectedEmployee);
      setSelectedEmployee(null);
      setSearch("");
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setSelectedEmployee(null);
    setSearch("");
    setShowAddForm(false);
    setActiveTab("customer");
    onClose();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "customer" | "employee");
    setSelectedCustomer(null);
    setSelectedEmployee(null);
    setSearch("");
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Hutang</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jumlah Item</span>
              <span>
                {items.reduce((sum, item) => sum + item.quantity, 0)} item
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Hutang</span>
              <span className="text-destructive">{formatCurrency(total)}</span>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" className="gap-2">
                <User className="w-4 h-4" />
                Pelanggan
              </TabsTrigger>
              <TabsTrigger value="employee" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Karyawan
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="customer"
              className="flex-1 flex flex-col min-h-0 mt-4 space-y-4"
            >
              {!showAddForm ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari pelanggan..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Pelanggan Baru
                  </Button>

                  <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-2">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Tidak ada pelanggan</p>
                          <p className="text-sm">
                            Tambah pelanggan baru untuk memulai
                          </p>
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            className={cn(
                              "w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3",
                              selectedCustomer?.id === customer.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-accent",
                            )}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {customer.name}
                              </p>
                              {customer.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {customer.phone}
                                </p>
                              )}
                            </div>
                            {selectedCustomer?.id === customer.id && (
                              <Check className="w-5 h-5 text-primary shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nama Pelanggan *</Label>
                    <Input
                      id="customerName"
                      value={newCustomerName}
                      onChange={(e) =>
                        setNewCustomerName(toTitleCase(e.target.value))
                      }
                      placeholder="Masukkan nama pelanggan"
                      autoFocus
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">
                      No. Telepon (opsional)
                    </Label>
                    <Input
                      id="customerPhone"
                      value={newCustomerPhone}
                      onChange={(e) =>
                        handlePhoneChange(e, setNewCustomerPhone)
                      }
                      onBlur={() =>
                        handlePhoneBlur(newCustomerPhone, setNewCustomerPhone)
                      }
                      placeholder="08xxxxxxxxxx"
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Otomatis diformat ke +62
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCustomerName("");
                        setNewCustomerPhone("");
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleAddCustomer}
                      disabled={!newCustomerName.trim()}
                    >
                      Simpan Pelanggan
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="employee"
              className="flex-1 flex flex-col min-h-0 mt-4 space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari karyawan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-2">
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada karyawan</p>
                      <p className="text-sm">Tambah karyawan di menu Admin</p>
                    </div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <button
                        key={employee.id}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3",
                          selectedEmployee?.id === employee.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent",
                        )}
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Briefcase className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {employee.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.position}
                          </p>
                        </div>
                        {selectedEmployee?.id === employee.id && (
                          <Check className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {!showAddForm && (
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={
                  (activeTab === "customer" && !selectedCustomer) ||
                  (activeTab === "employee" && !selectedEmployee)
                }
              >
                Konfirmasi Hutang
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
