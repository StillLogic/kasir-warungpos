# WarungPOS - Aplikasi Kasir Modern untuk UMKM

![WarungPOS](public/favicon.png)

**Aplikasi Point of Sale (POS) gratis, offline, dan modern** berbasis web yang dirancang khusus untuk warung, toko retail, dan UMKM di Indonesia. Dibangun sebagai Progressive Web App (PWA) sehingga bisa diinstall di HP maupun laptop tanpa perlu koneksi internet.

🔗 **Demo**: [warungpos.stilllogic.my.id](https://warungpos.stilllogic.my.id)

## ✨ Keunggulan

- 🆓 **100% Gratis** — Tanpa biaya langganan, tanpa iklan
- 📴 **Offline-First** — Bekerja penuh tanpa koneksi internet
- 📱 **PWA** — Install di HP & laptop seperti aplikasi native
- 🔒 **Privasi Terjamin** — Data tersimpan lokal di perangkat, bukan di server
- ⚡ **Ringan & Cepat** — Code-splitting & lazy loading untuk performa optimal
- 🎨 **Dark/Light Mode** — Tema gelap dan terang sesuai preferensi

## 🌟 Fitur Lengkap

### 💰 Kasir & Transaksi

- Interface kasir responsif (mobile & desktop)
- Keranjang belanja dengan tambah, edit, hapus item
- Harga eceran dan grosir otomatis
- Pencarian produk berdasarkan nama atau SKU
- Filter produk berdasarkan kategori
- Cetak struk digital (print/download gambar)
- Pembayaran tunai dan hutang

### 📦 Manajemen Produk

- CRUD produk lengkap
- Import produk massal via CSV dengan template
- SKU otomatis dengan prefix kategori
- Tracking stok real-time
- Kategori produk dengan prefix SKU custom
- Dukungan berbagai satuan (pcs, kg, liter, dll)
- Indikator visual stok habis dan menipis (≤5 item)
- Hapus multiple produk sekaligus

### 💵 Sistem Harga & Markup

- Dual pricing: harga eceran & grosir
- Aturan markup otomatis per kategori atau global
- Tier harga bertingkat berdasarkan range modal
- Kalkulator harga jual (modal + markup)
- Preview hasil markup real-time

### 📊 Hutang Pelanggan

- Database pelanggan dengan nomor telepon
- Tracking hutang per pelanggan
- Pembayaran cicilan bertahap
- Riwayat hutang dan pembayaran lengkap
- Arsip hutang lunas
- Export laporan hutang ke gambar

### 👥 Manajemen Karyawan

- CRUD data karyawan
- Pencatatan pendapatan karyawan
- Kelola pinjaman/hutang karyawan
- Pencatatan pemasukan/pengeluaran custom
- Ringkasan laporan per karyawan

### 🛒 Daftar Belanja

- Daftar belanja dengan kategori
- Checklist item yang sudah dibeli
- Detail item: brand, satuan, jumlah
- Export daftar belanja ke PDF
- Arsip daftar belanja
- Auto-clear item yang sudah dibeli

### 📈 Laporan & Dashboard

- Dashboard analytics: overview penjualan & stok
- Grafik pendapatan 7 hari terakhir
- Produk terlaris
- Riwayat transaksi dengan filter tanggal
- Laporan keuangan: pendapatan & profit
- Filter periode: harian, mingguan, bulanan

### 🛠️ Master Data & Pengaturan

- Kelola kategori produk
- Custom satuan/unit
- Backup & restore data (export/import JSON terenkripsi)
- Pengaturan toko: nama, alamat, telepon, pajak
- Konfigurasi struk: ukuran kertas 58mm/80mm, logo, footer

## 📱 Cara Penggunaan

### Akses Langsung

Buka [warungpos.stilllogic.my.id](https://warungpos.stilllogic.my.id) di browser. Tidak perlu daftar atau login.

### Install sebagai Aplikasi (PWA)

1. Buka aplikasi di browser (Chrome/Edge disarankan)
2. Klik ikon install di address bar, atau Menu ⋮ → "Install WarungPOS"
3. Aplikasi akan terpasang dan bisa dibuka langsung ke halaman kasir

### Alur Penggunaan

1. **Tambah Produk** — Buka Admin → Produk → Tambah produk satu per satu atau import CSV
2. **Atur Kategori & Satuan** — Admin → Master Data untuk mengelola kategori dan satuan
3. **Set Markup** (opsional) — Admin → Harga Jual untuk aturan markup otomatis
4. **Mulai Transaksi** — Buka halaman Kasir, cari produk, tambah ke keranjang, checkout
5. **Catat Hutang** — Saat checkout, pilih pembayaran hutang dan pilih pelanggan
6. **Lihat Laporan** — Admin → Dashboard/Laporan untuk memantau performa toko
7. **Backup Rutin** — Admin → Pengaturan → Backup Data untuk mengamankan data

### Navigasi

| Halaman      | Akses                  | Fungsi                     |
| ------------ | ---------------------- | -------------------------- |
| Landing Page | `/`                    | Halaman utama publik (SEO) |
| Kasir        | `/cashier`             | Transaksi penjualan        |
| Dashboard    | `/admin`               | Overview penjualan & stok  |
| Produk       | `/admin/products`      | Kelola produk & stok       |
| Harga Jual   | `/admin/pricing`       | Aturan markup              |
| Kalkulator   | `/admin/calculator`    | Hitung harga jual          |
| Hutang       | `/admin/debts`         | Hutang pelanggan           |
| Belanja      | `/admin/shopping-list` | Daftar belanja             |
| Karyawan     | `/admin/employees`     | Data karyawan              |
| Riwayat      | `/admin/history`       | Riwayat transaksi          |
| Laporan      | `/admin/reports`       | Laporan keuangan           |
| Master Data  | `/admin/master-data`   | Kategori & satuan          |
| Pengaturan   | `/admin/settings`      | Konfigurasi toko & backup  |

## 💾 Backup & Restore Data

> **Penting**: Data disimpan di browser (IndexedDB). Lakukan backup berkala!

### Backup

1. Buka **Admin** → **Pengaturan**
2. Scroll ke **Backup & Restore Data**
3. Klik **Backup Data** (opsional: set password enkripsi)
4. File JSON akan terdownload

### Restore

1. Buka **Admin** → **Pengaturan**
2. Klik **Restore Data**
3. Pilih file backup JSON
4. Masukkan password jika backup terenkripsi
5. Konfirmasi restore

## 🚀 Teknologi

| Kategori     | Teknologi               |
| ------------ | ----------------------- |
| UI Framework | React 18, TypeScript    |
| Build Tool   | Vite + PWA Plugin       |
| Styling      | Tailwind CSS, shadcn/ui |
| Database     | IndexedDB (idb)         |
| Routing      | React Router v6         |
| Charts       | Recharts                |
| Icons        | Lucide React            |
| Export       | html2canvas             |
| Kompresi     | fflate                  |
| Enkripsi     | crypto-js               |

## 📐 Struktur Project

```
kasir-warungpos/
├── public/                  # Static assets & PWA icons
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   └── admin/           # Admin-specific components
│   ├── database/            # IndexedDB operations
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components
│   │   └── admin/           # Admin pages
│   │       ├── employee/    # Halaman karyawan
│   │       └── shopping/    # Halaman belanja
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component & routing
│   └── main.tsx             # Entry point
├── index.html               # HTML template dengan SEO metadata
├── vite.config.ts           # Vite & PWA configuration
└── tailwind.config.ts       # Tailwind CSS configuration
```

## ⚡ Optimasi Performa

- **Code Splitting** — Setiap halaman di-lazy load, hanya halaman yang dibuka yang dimuat
- **PWA Caching** — Asset di-cache oleh service worker untuk akses instan
- **Database Timeout** — Proteksi 5 detik pada panggilan IndexedDB agar UI tidak hang
- **Responsive Images** — Lazy loading pada gambar
- **Minimal Bundle** — Tidak ada dependency yang tidak terpakai

## 🔍 SEO

- Meta tags lengkap (title, description, keywords)
- Open Graph & Twitter Card untuk social sharing
- JSON-LD structured data (SoftwareApplication)
- Sitemap XML & robots.txt
- Semantic HTML (`header`, `main`, `section`, `footer`)
- Landing page publik yang SEO-friendly

## 🔒 Keamanan & Privasi

- Data tersimpan 100% lokal di browser (tidak dikirim ke server)
- Tidak ada tracking, analytics, atau cookies pihak ketiga
- Backup terenkripsi dengan password (AES via crypto-js)
- Offline-first: tidak bergantung pada koneksi internet

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b fitur-baru`)
3. Commit changes (`git commit -m 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📄 Lisensi

MIT License — bebas digunakan untuk personal maupun komersial.

---

**WarungPOS** — Solusi Kasir Modern untuk UMKM Indonesia 🇮🇩
