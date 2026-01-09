import { useState, useEffect, useMemo } from 'react';
import { Expense, EXPENSE_CATEGORIES } from '@/types/business';
import { getExpensesAsync, saveExpenseAsync, deleteExpenseAsync } from '@/database';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Loader2, 
  Receipt,
  Trash2,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    const data = await getExpensesAsync();
    setExpenses(data);
    setLoading(false);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const date = new Date(e.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return month === filterMonth;
    });
  }, [expenses, filterMonth]);

  const totalThisMonth = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const todayExpenses = useMemo(() => {
    const today = new Date().toDateString();
    return expenses.filter(e => new Date(e.createdAt).toDateString() === today);
  }, [expenses]);

  const totalToday = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(142 76% 36%)',
    'hsl(24 95% 53%)',
    'hsl(262 83% 58%)',
    'hsl(346 77% 50%)',
  ];

  const handleOpenDialog = () => {
    setFormData({ category: '', description: '', amount: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.category || !formData.amount) {
      toast({ title: 'Error', description: 'Kategori dan jumlah harus diisi', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Jumlah tidak valid', variant: 'destructive' });
      return;
    }

    try {
      await saveExpenseAsync({
        category: formData.category,
        description: formData.description,
        amount,
      });
      toast({ title: 'Berhasil', description: 'Pengeluaran dicatat' });
      await loadExpenses();
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan pengeluaran', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    
    await deleteExpenseAsync(selectedExpense.id);
    toast({ title: 'Berhasil', description: 'Pengeluaran dihapus' });
    await loadExpenses();
    setDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Pengeluaran</h1>
          <p className="text-sm text-muted-foreground">Catat biaya operasional warung</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalToday)}</p>
            <p className="text-xs text-muted-foreground">{todayExpenses.length} pengeluaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalThisMonth)}</p>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} pengeluaran</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kategori Terbanyak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <>
                <p className="text-xl font-bold">{categoryData.sort((a, b) => b.value - a.value)[0]?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(categoryData.sort((a, b) => b.value - a.value)[0]?.value || 0)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Pengeluaran per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>Bulan:</Label>
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
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
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Belum ada pengeluaran bulan ini
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedExpense(expense);
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

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategori *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Keterangan pengeluaran (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengeluaran {formatCurrency(selectedExpense?.amount || 0)} untuk "{selectedExpense?.category}" akan dihapus.
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
