import { useState, useMemo } from 'react';
import { CartItem } from '@/types/pos';
import { Customer } from '@/types/debt';
import { formatCurrency } from '@/lib/format';
import { toTitleCase, handlePhoneChange, handlePhoneBlur } from '@/lib/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, User, Check } from 'lucide-react';
import { getCustomers, addCustomer, searchCustomers } from '@/database/customers';
import { cn } from '@/lib/utils';

interface DebtDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (customer: Customer) => void;
  total: number;
  items: CartItem[];
}

export function DebtDialog({ open, onClose, onConfirm, total, items }: DebtDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    return searchCustomers(search);
  }, [search, customers]);

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;

    const newCustomer = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || undefined,
    });

    setCustomers(prev => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    setShowAddForm(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const handleConfirm = () => {
    if (selectedCustomer) {
      onConfirm(selectedCustomer);
      setSelectedCustomer(null);
      setSearch('');
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setSearch('');
    setShowAddForm(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Hutang - Pilih Pelanggan</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jumlah Item</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} item</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Hutang</span>
              <span className="text-destructive">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Search & Add Customer */}
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

              {/* Customer List */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-2">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada pelanggan</p>
                      <p className="text-sm">Tambah pelanggan baru untuk memulai</p>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3',
                          selectedCustomer?.id === customer.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        )}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
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
            /* Add Customer Form */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nama Pelanggan *</Label>
                <Input
                  id="customerName"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(toTitleCase(e.target.value))}
                  placeholder="Masukkan nama pelanggan"
                  autoFocus
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">No. Telepon (opsional)</Label>
                <Input
                  id="customerPhone"
                  value={newCustomerPhone}
                  onChange={(e) => handlePhoneChange(e, setNewCustomerPhone)}
                  onBlur={() => handlePhoneBlur(newCustomerPhone, setNewCustomerPhone)}
                  placeholder="08xxxxxxxxxx"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">Otomatis diformat ke +62</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCustomerName('');
                    setNewCustomerPhone('');
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

          {/* Actions */}
          {!showAddForm && (
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={!selectedCustomer}
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
