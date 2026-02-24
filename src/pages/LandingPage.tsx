import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Wifi,
  WifiOff,
  CreditCard,
  ClipboardList,
  Users,
  ArrowRight,
  CheckCircle2,
  Store,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Kasir Cepat",
    desc: "Transaksi instan dengan pencarian produk, harga grosir otomatis, dan struk digital.",
  },
  {
    icon: Package,
    title: "Manajemen Stok",
    desc: "Pantau stok real-time, peringatan stok menipis, dan import produk via CSV.",
  },
  {
    icon: BarChart3,
    title: "Laporan Penjualan",
    desc: "Dashboard & laporan harian, mingguan, bulanan untuk memantau performa toko.",
  },
  {
    icon: CreditCard,
    title: "Pencatatan Hutang",
    desc: "Catat hutang pelanggan & karyawan dengan riwayat pembayaran lengkap.",
  },
  {
    icon: ClipboardList,
    title: "Daftar Belanja",
    desc: "Buat daftar belanja per kategori, arsipkan, dan ekspor ke PDF.",
  },
  {
    icon: Users,
    title: "Multi Karyawan",
    desc: "Kelola data karyawan, pencatatan penghasilan, dan hutang karyawan.",
  },
];

const benefits = [
  "100% Gratis tanpa biaya langganan",
  "Bisa digunakan offline (PWA)",
  "Data tersimpan aman di perangkat",
  "Tidak perlu koneksi internet",
  "Bisa diinstall di HP & laptop",
  "Ringan dan cepat",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="WarungPOS Logo" className="w-8 h-8 rounded-lg" loading="lazy" />
            <span className="font-bold text-lg">WarungPOS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link to="/cashier">
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Buka Kasir</span>
                <span className="sm:hidden">Kasir</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <WifiOff className="w-3.5 h-3.5" />
              Bisa digunakan offline
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Aplikasi Kasir{" "}
              <span className="text-primary">Gratis</span> untuk Warung & Toko
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Kelola produk, stok, transaksi, dan hutang warung Anda dengan mudah.
              Tanpa biaya, tanpa ribet, langsung pakai.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link to="/cashier">
                  Mulai Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/admin">
                  <Store className="w-4 h-4 mr-2" />
                  Lihat Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Fitur Lengkap untuk Toko Anda</h2>
              <p className="text-muted-foreground text-lg">Semua yang Anda butuhkan untuk mengelola warung atau toko kecil.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <article key={f.title} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Kenapa WarungPOS?</h2>
              <p className="text-muted-foreground text-lg">Dirancang khusus untuk UMKM Indonesia.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 p-4 rounded-lg bg-accent/50">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Siap Mengelola Toko Anda?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Langsung gunakan tanpa daftar, tanpa login. Data tersimpan aman di perangkat Anda.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-base">
              <Link to="/cashier">
                Buka Kasir Sekarang
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="WarungPOS" className="w-5 h-5 rounded" loading="lazy" />
            <span>© {new Date().getFullYear()} WarungPOS. Aplikasi kasir gratis untuk UMKM Indonesia.</span>
          </div>
          <nav className="flex gap-4">
            <Link to="/cashier" className="hover:text-foreground transition-colors">Kasir</Link>
            <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}