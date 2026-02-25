import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  History,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  ChevronDown,
  Percent,
  Calculator,
  CreditCard,
  Users,
  Wallet,
  HandCoins,
  ClipboardList,
  ShoppingCart,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Produk", icon: Package },
  { path: "/admin/pricing", label: "Harga Jual", icon: Percent },
  { path: "/admin/calculator", label: "Kalkulator", icon: Calculator },
  { path: "/admin/debts", label: "Hutang Pelanggan", icon: CreditCard },
  {
    path: "/admin/master-data",
    label: "Master Data",
    icon: Database,
  },
  { path: "/admin/history", label: "Riwayat", icon: History },
  { path: "/admin/reports", label: "Laporan", icon: BarChart3 },
  { path: "/admin/settings", label: "Pengaturan", icon: Settings },
];

const shoppingSubItems = [
  {
    path: "/admin/shopping-list",
    label: "Daftar Belanja",
    icon: ClipboardList,
  },
  { path: "/admin/shopping-archive", label: "Arsip Belanja", icon: Database },
];

const employeeSubItems = [
  { path: "/admin/employees", label: "Data Karyawan", icon: Users },
  { path: "/admin/employees/earnings", label: "Pendapatan", icon: Wallet },
  { path: "/admin/employees/debts", label: "Hutang Karyawan", icon: HandCoins },
  {
    path: "/admin/employees/records",
    label: "Pencatatan",
    icon: ClipboardList,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(() =>
    location.pathname.startsWith("/admin/employees"),
  );
  const [shoppingMenuOpen, setShoppingMenuOpen] = useState(() =>
    location.pathname.startsWith("/admin/shopping"),
  );

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const isEmployeeActive = employeeSubItems.some(
    (item) => location.pathname === item.path,
  );

  const isShoppingActive = shoppingSubItems.some(
    (item) => location.pathname === item.path,
  );

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button, a, input, select, textarea, [role="button"]')
      ) {
        return;
      }

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current > 0) {
        touchEndX.current = e.touches[0].clientX;
      }
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === 0) {
        return;
      }

      const diffX = touchStartX.current - touchEndX.current;
      const diffY = Math.abs(
        touchStartY.current - (touchEndX.current ? touchStartY.current : 0),
      );
      const minSwipeDistance = 50;
      const edgeThreshold = 100;

      if (
        !sidebarOpen &&
        touchStartX.current > window.innerWidth - edgeThreshold &&
        diffX > minSwipeDistance &&
        diffY < 100
      ) {
        setSidebarOpen(true);
      }

      if (sidebarOpen && diffX < -minSwipeDistance && diffY < 100) {
        setSidebarOpen(false);
      }

      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, sidebarOpen]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="WarungPOS Logo"
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-semibold">Admin Panel</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Collapsible open={shoppingMenuOpen} onOpenChange={setShoppingMenuOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isShoppingActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span>Belanja</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  shoppingMenuOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {shoppingSubItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={employeeMenuOpen} onOpenChange={setEmployeeMenuOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isEmployeeActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>Karyawan</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  employeeMenuOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {employeeSubItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {navItems.slice(5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

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
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border shrink-0 animate-slide-in-left">
          <SidebarContent />
        </aside>
      )}

      {isMobile && (
        <>
          <div
            className={cn(
              "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className={cn(
              "fixed right-0 top-0 bottom-0 w-64 bg-card z-50 shadow-xl transition-transform duration-300 ease-out",
              sidebarOpen ? "translate-x-0" : "translate-x-full",
            )}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-card border-b border-border shrink-0 h-14 flex items-center justify-between px-4">
          <h1 className="font-semibold text-lg truncate">
            {employeeSubItems.find((item) => location.pathname === item.path)
              ?.label ||
              navItems.find((item) => isActive(item.path))?.label ||
              "Admin"}
          </h1>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </header>

        <main
          className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in"
          data-scrollable
        >
          {children}
        </main>
      </div>
    </div>
  );
}
