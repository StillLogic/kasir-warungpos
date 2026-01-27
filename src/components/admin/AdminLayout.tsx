import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  ChevronLeft,
  Percent,
  Calculator,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Produk', icon: Package },
  { path: '/admin/pricing', label: 'Harga Jual', icon: Percent },
  { path: '/admin/calculator', label: 'Kalkulator', icon: Calculator },
  { path: '/admin/debts', label: 'Hutang', icon: CreditCard },
  { path: '/admin/history', label: 'Riwayat', icon: History },
  { path: '/admin/reports', label: 'Laporan', icon: BarChart3 },
  { path: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/favicon.png" 
            alt="WarungPOS Logo" 
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-semibold">Admin Panel</span>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to Cashier */}
      <div className="p-3 border-t border-border">
        <Link
          to="/"
          onClick={() => isMobile && setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Kembali ke Kasir</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="h-dvh bg-background flex overflow-hidden animate-fade-in">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border shrink-0 animate-slide-in-left">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>
          <div 
            className={cn(
              "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setSidebarOpen(false)}
          />
          <aside 
            className={cn(
              "fixed left-0 top-0 bottom-0 w-64 bg-card z-50 shadow-xl transition-transform duration-300 ease-out",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border shrink-0 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className="font-semibold text-lg truncate">
              {navItems.find(item => isActive(item.path))?.label || 'Admin'}
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in" data-scrollable>
          {children}
        </main>
      </div>
    </div>
  );
}
