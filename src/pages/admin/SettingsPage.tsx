import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Store, Receipt, Settings2, Save } from 'lucide-react';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  showLogo: boolean;
  taxEnabled: boolean;
  taxRate: number;
}

const defaultSettings: StoreSettings = {
  storeName: 'WarungPOS',
  storeAddress: '',
  storePhone: '',
  receiptFooter: 'Terima kasih atas kunjungan Anda!',
  showLogo: true,
  taxEnabled: false,
  taxRate: 11,
};

export function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('store-settings');
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('store-settings', JSON.stringify(settings));
    
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Pengaturan Disimpan',
        description: 'Perubahan pengaturan berhasil disimpan',
      });
    }, 500);
  };

  const updateSettings = (key: keyof StoreSettings, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-5 h-5" />
            Informasi Toko
          </CardTitle>
          <CardDescription>
            Informasi dasar toko yang ditampilkan di nota
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Nama Toko</Label>
            <Input
              id="storeName"
              value={settings.storeName}
              onChange={(e) => updateSettings('storeName', e.target.value)}
              placeholder="Nama toko Anda"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storeAddress">Alamat</Label>
            <Textarea
              id="storeAddress"
              value={settings.storeAddress}
              onChange={(e) => updateSettings('storeAddress', e.target.value)}
              placeholder="Alamat lengkap toko"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storePhone">Nomor Telepon</Label>
            <Input
              id="storePhone"
              value={settings.storePhone}
              onChange={(e) => updateSettings('storePhone', e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Pengaturan Nota
          </CardTitle>
          <CardDescription>
            Kustomisasi tampilan nota transaksi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showLogo">Tampilkan Logo</Label>
              <p className="text-xs text-muted-foreground">Tampilkan logo di nota</p>
            </div>
            <Switch
              id="showLogo"
              checked={settings.showLogo}
              onCheckedChange={(checked) => updateSettings('showLogo', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Pesan Footer Nota</Label>
            <Textarea
              id="receiptFooter"
              value={settings.receiptFooter}
              onChange={(e) => updateSettings('receiptFooter', e.target.value)}
              placeholder="Pesan yang ditampilkan di bawah nota"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Pengaturan Pajak
          </CardTitle>
          <CardDescription>
            Konfigurasi pajak untuk transaksi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="taxEnabled">Aktifkan Pajak</Label>
              <p className="text-xs text-muted-foreground">Tambahkan pajak ke setiap transaksi</p>
            </div>
            <Switch
              id="taxEnabled"
              checked={settings.taxEnabled}
              onCheckedChange={(checked) => updateSettings('taxEnabled', checked)}
            />
          </div>
          {settings.taxEnabled && (
            <div className="space-y-2">
              <Label htmlFor="taxRate">Persentase Pajak (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={settings.taxRate}
                onChange={(e) => updateSettings('taxRate', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </Button>
    </div>
  );
}
