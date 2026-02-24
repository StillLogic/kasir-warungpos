import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShoppingCart,
  Package,
  BarChart3,
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
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl">
        <div className="w-full flex items-center justify-between h-14 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="WarungPOS Logo" className="w-8 h-8 rounded-lg" loading="lazy" />
            <span className="font-bold text-lg">WarungPOS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
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
        {/* Hero — gradient from background to muted */}
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 bg-gradient-to-b from-background via-background to-muted/60">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="relative w-full max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <WifiOff className="w-3.5 h-3.5" />
              Bisa digunakan offline
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Kasir{" "}
              <span className="text-primary">Gratis</span>
              <br className="hidden sm:block" />
              {" "}untuk Warung & Toko
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Kelola produk, stok, transaksi, dan hutang dengan mudah.
              Tanpa biaya, tanpa ribet, langsung pakai.
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <Button size="lg" asChild className="text-base h-12 px-8">
                <Link to="/cashier">
                  Mulai Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
                <Link to="/admin">
                  <Store className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features — gradient from muted to background */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-muted/60 via-muted/30 to-background">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Fitur Lengkap</h2>
              <p className="text-muted-foreground">Semua yang dibutuhkan untuk mengelola toko Anda.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="group bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-5 sm:p-6 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits — gradient from background to primary tinted */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-background to-primary/5">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Kenapa WarungPOS?</h2>
              <p className="text-muted-foreground">Dirancang khusus untuk UMKM Indonesia.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — gradient primary */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-primary to-primary/80">
          <div className="w-full max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary-foreground">Siap Mengelola Toko Anda?</h2>
            <p className="text-primary-foreground/75 mb-8">
              Langsung gunakan tanpa daftar, tanpa login. Data tersimpan aman di perangkat Anda.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8">
              <Link to="/cashier">
                Buka Kasir Sekarang
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer — subtle gradient */}
      <footer className="py-6 px-4 bg-gradient-to-b from-background to-muted/30 border-t border-border/40">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="WarungPOS" className="w-5 h-5 rounded" loading="lazy" />
            <span>© {new Date().getFullYear()} WarungPOS</span>
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