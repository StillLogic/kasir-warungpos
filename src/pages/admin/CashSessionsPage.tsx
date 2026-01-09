import { useState, useEffect, useMemo } from 'react';
import { CashSession } from '@/types/business';
import { 
  getCashSessionsAsync, 
  getActiveCashSessionAsync, 
  openCashSessionAsync, 
  closeCashSessionAsync 
} from '@/database';
import { getTodayTransactionsAsync, getTodayRevenueAsync } from '@/database';
import { getTodayExpensesAsync } from '@/database/expenses';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Wallet,
  DoorOpen,
  DoorClosed,
  TrendingUp,
  TrendingDown,
  Calculator,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function CashSessionsPage() {
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sessionsData, active, txData, expData] = await Promise.all([
      getCashSessionsAsync(),
      getActiveCashSessionAsync(),
      getTodayTransactionsAsync(),
      getTodayExpensesAsync()
    ]);
    
    setSessions(sessionsData);
    setActiveSession(active);
    setTodayRevenue(txData.reduce((sum, t) => sum + t.total, 0));
    setTodayTransactions(txData.length);
    setTodayExpenses(expData.reduce((sum, e) => sum + e.amount, 0));
    setLoading(false);
  };

  const expectedCash = useMemo(() => {
    if (!activeSession) return 0;
    return activeSession.openingAmount + todayRevenue - todayExpenses;
  }, [activeSession, todayRevenue, todayExpenses]);

  const handleOpenSession = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Error', description: 'Jumlah modal awal tidak valid', variant: 'destructive' });
      return;
    }

    try {
      await openCashSessionAsync(amount);
      toast({ title: 'Berhasil', description: 'Sesi kasir dibuka' });
      await loadData();
      setOpenDialogOpen(false);
      setOpeningAmount('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Error', description: 'Jumlah kas akhir tidak valid', variant: 'destructive' });
      return;
    }

    try {
      await closeCashSessionAsync(activeSession.id, amount, expectedCash, closeNotes || undefined);
      toast({ title: 'Berhasil', description: 'Sesi kasir ditutup' });
      await loadData();
      setCloseDialogOpen(false);
      setClosingAmount('');
      setCloseNotes('');
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menutup sesi', variant: 'destructive' });
    }
  };

  const difference = useMemo(() => {
    const closing = parseFloat(closingAmount) || 0;
    return closing - expectedCash;
  }, [closingAmount, expectedCash]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Rekonsiliasi Kas</h1>
          <p className="text-sm text-muted-foreground">Buka dan tutup sesi kasir harian</p>
        </div>
        {!activeSession ? (
          <Button onClick={() => setOpenDialogOpen(true)}>
            <DoorOpen className="w-4 h-4 mr-2" />
            Buka Kasir
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => setCloseDialogOpen(true)}>
            <DoorClosed className="w-4 h-4 mr-2" />
            Tutup Kasir
          </Button>
        )}
      </div>

      {/* Active Session */}
      {activeSession && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Sesi Aktif
                </CardTitle>
                <CardDescription>
                  Dibuka: {new Date(activeSession.openedAt).toLocaleString('id-ID')}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-green-500">AKTIF</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Modal Awal</p>
                <p className="text-xl font-bold">{formatCurrency(activeSession.openingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  Pendapatan Hari Ini
                </p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(todayRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  Pengeluaran Hari Ini
                </p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(todayExpenses)}</p>
              </div>
              <div className="bg-card p-3 rounded-lg">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Kas Seharusnya
                </p>
                <p className="text-xl font-bold text-primary">{formatCurrency(expectedCash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Active Session */}
      {!activeSession && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Sesi Aktif</h3>
            <p className="text-muted-foreground mb-4">Buka kasir untuk memulai sesi baru</p>
            <Button onClick={() => setOpenDialogOpen(true)}>
              <DoorOpen className="w-4 h-4 mr-2" />
              Buka Kasir
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transaksi Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayTransactions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(todayRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pengeluaran Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(todayExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Sesi Kasir</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Modal Awal</TableHead>
              <TableHead className="text-right">Kas Akhir</TableHead>
              <TableHead className="text-right">Seharusnya</TableHead>
              <TableHead className="text-right">Selisih</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Belum ada riwayat sesi
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {new Date(session.openedAt).toLocaleDateString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {session.closedAt && ` - ${new Date(session.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(session.openingAmount)}</TableCell>
                  <TableCell className="text-right">
                    {session.status === 'closed' ? formatCurrency(session.closingAmount) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.status === 'closed' ? formatCurrency(session.expectedAmount) : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    session.difference > 0 ? 'text-green-600' : 
                    session.difference < 0 ? 'text-red-500' : ''
                  }`}>
                    {session.status === 'closed' ? (
                      <>
                        {session.difference > 0 && '+'}
                        {formatCurrency(session.difference)}
                      </>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {session.status === 'open' ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : session.difference === 0 ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sesuai
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <XCircle className="w-3 h-3 mr-1" />
                        Selisih
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Open Session Dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Kasir</DialogTitle>
            <DialogDescription>
              Masukkan jumlah uang tunai di laci kasir saat memulai shift
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Modal Awal (Rp)</Label>
              <Input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>Batal</Button>
            <Button onClick={handleOpenSession}>Buka Kasir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Kasir</DialogTitle>
            <DialogDescription>
              Hitung uang di laci kasir dan masukkan jumlahnya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Modal Awal</span>
                <span>{formatCurrency(activeSession?.openingAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>+ Pendapatan</span>
                <span>{formatCurrency(todayRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>- Pengeluaran</span>
                <span>{formatCurrency(todayExpenses)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Seharusnya</span>
                <span className="text-primary">{formatCurrency(expectedCash)}</span>
              </div>
            </div>

            <div>
              <Label>Jumlah Kas Aktual (Rp)</Label>
              <Input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="Hitung uang di laci kasir"
                autoFocus
              />
            </div>

            {closingAmount && (
              <div className={`p-3 rounded-lg ${
                difference === 0 ? 'bg-green-500/10 text-green-600' :
                difference > 0 ? 'bg-blue-500/10 text-blue-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                <p className="text-sm font-medium">
                  Selisih: {difference > 0 && '+'}{formatCurrency(difference)}
                </p>
                <p className="text-xs">
                  {difference === 0 ? 'Kas sesuai!' :
                   difference > 0 ? 'Kelebihan kas' : 'Kekurangan kas'}
                </p>
              </div>
            )}

            <div>
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Catatan penutupan kasir..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleCloseSession}>Tutup Kasir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
