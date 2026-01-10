import { useState, useEffect, useMemo } from 'react';
import { Customer } from '@/types/business';
import { getCustomersAsync, saveCustomerAsync, updateCustomerAsync, deleteCustomerAsync, updateCustomerDebtAsync } from '@/database';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Loader2, 
  Users, 
  Edit, 
  Trash2, 
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState<'add' | 'pay'>('add');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await getCustomersAsync();
    setCustomers(data);
    setLoading(false);
  };

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.debt, 0);
  }, [customers]);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } else {
      setSelectedCustomer(null);
      setFormData({ name: '', phone: '', address: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Nama pelanggan harus diisi', variant: 'destructive' });
      return;
    }

    try {
      if (selectedCustomer) {
        await updateCustomerAsync(selectedCustomer.id, formData);
        toast({ title: 'Berhasil', description: 'Pelanggan diperbarui' });
      } else {
        await saveCustomerAsync({ ...formData, debt: 0 });
        toast({ title: 'Berhasil', description: 'Pelanggan ditambahkan' });
      }
      await loadCustomers();
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan pelanggan', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    await deleteCustomerAsync(selectedCustomer.id);
    toast({ title: 'Berhasil', description: 'Pelanggan dihapus' });
    await loadCustomers();
    setDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleDebtDialog = (customer: Customer, type: 'add' | 'pay') => {
    setSelectedCustomer(customer);
    setDebtType(type);
    setDebtAmount('');
    setDebtDialogOpen(true);
  };

  const handleDebtUpdate = async () => {
    if (!selectedCustomer || !debtAmount) return;

    const amount = parseFloat(debtAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Jumlah tidak valid', variant: 'destructive' });
      return;
    }

    const change = debtType === 'add' ? amount : -amount;
    await updateCustomerDebtAsync(selectedCustomer.id, change);
    
    toast({ 
      title: 'Berhasil', 
      description: debtType === 'add' 
        ? `Hutang ditambah ${formatCurrency(amount)}` 
        : `Pembayaran ${formatCurrency(amount)} dicatat`
    });
    
    await loadCustomers();
    setDebtDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Pelanggan</h1>
          <p className="text-sm text-muted-foreground">Kelola data pelanggan dan hutang</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>

        <Card className={totalDebt > 0 ? 'bg-red-500/10 border-red-500/20' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Total Piutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalDebt > 0 ? 'text-red-500' : ''}`}>
              {formatCurrency(totalDebt)}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pelanggan dengan Hutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.filter(c => c.debt > 0).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="text-right">Hutang</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {customers.length === 0 ? 'Belum ada pelanggan' : 'Tidak ditemukan'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{customer.address || '-'}</TableCell>
                  <TableCell className={`text-right font-medium ${customer.debt > 0 ? 'text-red-500' : ''}`}>
                    {formatCurrency(customer.debt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDebtDialog(customer, 'add')}
                        title="Tambah Hutang"
                      >
                        <ArrowUpCircle className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDebtDialog(customer, 'pay')}
                        title="Bayar Hutang"
                        disabled={customer.debt <= 0}
                      >
                        <ArrowDownCircle className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(customer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama pelanggan"
              />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <Label>Alamat</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {debtType === 'add' ? 'Tambah Hutang' : 'Bayar Hutang'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pelanggan: <strong>{selectedCustomer?.name}</strong>
            </p>
            <p className="text-sm">
              Hutang saat ini: <strong className="text-red-500">{formatCurrency(selectedCustomer?.debt || 0)}</strong>
            </p>
            <div>
              <Label>Jumlah Pembayaran</Label>
              <Input
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="0"
                max={debtType === 'pay' ? selectedCustomer?.debt : undefined}
              />
              {debtType === 'pay' && selectedCustomer && parseFloat(debtAmount) > selectedCustomer.debt && (
                <p className="text-xs text-destructive mt-1">
                  Pembayaran melebihi hutang ({formatCurrency(selectedCustomer.debt)})
                </p>
              )}
            </div>
            {debtType === 'pay' && selectedCustomer && selectedCustomer.debt > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setDebtAmount(selectedCustomer.debt.toString())}
              >
                Bayar Penuh ({formatCurrency(selectedCustomer.debt)})
              </Button>
            )}
            {debtType === 'pay' && debtAmount && parseFloat(debtAmount) > 0 && selectedCustomer && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Hutang saat ini:</span>
                  <span className="text-red-500">{formatCurrency(selectedCustomer.debt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pembayaran:</span>
                  <span className="text-green-500">- {formatCurrency(Math.min(parseFloat(debtAmount), selectedCustomer.debt))}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-medium">
                  <span>Sisa hutang:</span>
                  <span className={selectedCustomer.debt - Math.min(parseFloat(debtAmount), selectedCustomer.debt) > 0 ? 'text-red-500' : 'text-green-500'}>
                    {formatCurrency(Math.max(0, selectedCustomer.debt - parseFloat(debtAmount)))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDebtDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleDebtUpdate} 
              variant={debtType === 'add' ? 'destructive' : 'default'}
              disabled={debtType === 'pay' && selectedCustomer && parseFloat(debtAmount) > selectedCustomer.debt}
            >
              {debtType === 'add' ? 'Tambah Hutang' : 'Catat Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pelanggan "{selectedCustomer?.name}" akan dihapus. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
