import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { toTitleCase, formatPhoneNumber } from '@/lib/text';
import { Store, Receipt, Settings2, Save, Printer, Eye } from 'lucide-react';
import { ReceiptPreview } from '@/components/admin/ReceiptPreview';
import { BackupRestore } from '@/components/BackupRestore';
interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  showLogo: boolean;
  taxEnabled: boolean;
  taxRate: number;
  paperWidth: '58' | '80';
}

const defaultSettings: StoreSettings = {
  storeName: 'WarungPOS',
  storeAddress: '',
  storePhone: '',
  receiptFooter: 'Terima kasih atas kunjungan Anda!',
  showLogo: true,
  taxEnabled: false,
  taxRate: 11,
  paperWidth: '58',
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

  const handleTestPrint = () => {
    const paperWidth = settings.paperWidth === '80' ? '80mm' : '58mm';
    const fontSize = settings.paperWidth === '80' ? { base: 12, small: 10, title: 16 } : { base: 10, small: 8, title: 14 };

    const testContent = `
      <div style="font-family: 'Courier New', monospace; width: ${paperWidth}; margin: 0; padding: 3mm;">
        <div style="text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: ${fontSize.title}px; font-weight: bold;">${settings.storeName}</h2>
          ${settings.storeAddress ? `<p style="margin: 3px 0 0; font-size: ${fontSize.small}px;">${settings.storeAddress}</p>` : ''}
          ${settings.storePhone ? `<p style="margin: 2px 0 0; font-size: ${fontSize.small}px;">Telp: ${settings.storePhone}</p>` : ''}
          <p style="margin: 5px 0 0; font-size: ${fontSize.small}px;">--- TEST PRINT ---</p>
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="margin-bottom: 5px;">
            <p style="margin: 0; font-size: ${fontSize.base}px; font-weight: bold;">Contoh Produk 1</p>
            <div style="display: flex; justify-content: space-between; font-size: ${fontSize.small}px;">
              <span>2 x Rp 10.000</span>
              <span style="font-weight: bold;">Rp 20.000</span>
            </div>
          </div>
          <div style="margin-bottom: 5px;">
            <p style="margin: 0; font-size: ${fontSize.base}px; font-weight: bold;">Contoh Produk 2</p>
            <div style="display: flex; justify-content: space-between; font-size: ${fontSize.small}px;">
              <span>1 x Rp 15.000</span>
              <span style="font-weight: bold;">Rp 15.000</span>
            </div>
          </div>
        </div>
        
        <div style="border-top: 1px dashed #333; padding-top: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize.base + 2}px; font-weight: bold; margin-bottom: 4px;">
            <span>TOTAL</span>
            <span>Rp 35.000</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize.base}px; margin-bottom: 2px;">
            <span>Bayar</span>
            <span>Rp 50.000</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize.base}px;">
            <span>Kembali</span>
            <span style="font-weight: bold;">Rp 15.000</span>
          </div>
        </div>
        
        <div style="text-align: center; border-top: 1px dashed #333; padding-top: 8px;">
          <p style="margin: 0; font-size: ${fontSize.small}px;">${settings.receiptFooter}</p>
          <p style="margin: 5px 0 0; font-size: ${fontSize.small}px;">Ukuran kertas: ${paperWidth}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Print - ${settings.storeName}</title>
            <style>
              @page {
                size: ${paperWidth} auto;
                margin: 0;
              }
              @media print {
                html, body {
                  width: ${paperWidth};
                  margin: 0;
                  padding: 0;
                }
              }
              body {
                margin: 0;
                padding: 0;
                width: ${paperWidth};
              }
              * {
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>${testContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

return (
    <div className="grid gap-6 lg:grid-cols-[1fr,auto] pb-16">
      <div className="space-y-6 max-w-2xl">
      {/* Backup & Restore - Top Priority */}
      <BackupRestore />
      
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
              onChange={(e) => updateSettings('storeName', toTitleCase(e.target.value))}
              placeholder="Nama toko Anda"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storeAddress">Alamat</Label>
            <Textarea
              id="storeAddress"
              value={settings.storeAddress}
              onChange={(e) => updateSettings('storeAddress', toTitleCase(e.target.value))}
              placeholder="Alamat lengkap toko"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storePhone">Nomor Telepon</Label>
            <Input
              id="storePhone"
              value={settings.storePhone}
              onChange={(e) => updateSettings('storePhone', e.target.value.replace(/[^\d+\-\s]/g, ''))}
              onBlur={() => {
                if (settings.storePhone.trim()) {
                  updateSettings('storePhone', formatPhoneNumber(settings.storePhone));
                }
              }}
              placeholder="08xxxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">Otomatis diformat ke +62</p>
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
          <div className="space-y-3">
            <Label>Ukuran Kertas Thermal</Label>
            <RadioGroup
              value={settings.paperWidth}
              onValueChange={(value) => updateSettings('paperWidth', value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="58" id="paper-58" />
                <Label htmlFor="paper-58" className="font-normal cursor-pointer">
                  58mm (kecil)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="80" id="paper-80" />
                <Label htmlFor="paper-80" className="font-normal cursor-pointer">
                  80mm (standar)
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Pilih sesuai lebar kertas printer thermal Anda
            </p>
          </div>

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

          <Button variant="outline" onClick={handleTestPrint} className="w-full">
            <Printer className="w-4 h-4 mr-2" />
            Test Print
          </Button>
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

      {/* Receipt Preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Struk
            </CardTitle>
            <CardDescription>
              Tampilan struk sesuai pengaturan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReceiptPreview settings={settings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
