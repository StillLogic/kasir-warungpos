import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import Index from "./pages/Index";
import { ProductsPage } from "./pages/ProductsPage";
import { HistoryPage } from "./pages/HistoryPage";
import {
  DashboardPage,
  ReportsPage,
  SettingsPage,
  PricingPage,
  CalculatorPage,
  DebtsPage,
} from "./pages/admin";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/admin";
import { InstallPWA } from "./components/InstallPWA";
import { PWAUpdateNotification } from "./components/PWAUpdateNotification";
import NotFound from "./pages/NotFound";
import { migrateFromLocalStorage } from "./database";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Migrate data from localStorage to IndexedDB on first load
    migrateFromLocalStorage();

    // Prevent pull-to-refresh and overscroll on PWA
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) return;

      const target = e.target as HTMLElement;
      const scrollableParent = target.closest("[data-scrollable]");

      if (!scrollableParent && window.scrollY === 0) {
        e.preventDefault();
      }
    };

    // Lock viewport height for iOS PWA
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("orientationchange", setViewportHeight);
    
    // Handle visual viewport for keyboard appearance
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setViewportHeight);
    }
    
    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      window.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("orientationchange", setViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setViewportHeight);
      }
      document.removeEventListener("touchmove", preventDefault);
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main Cashier */}
              <Route path="/" element={<Index />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <AdminLayout>
                    <ProductsPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/pricing"
                element={
                  <AdminLayout>
                    <PricingPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/calculator"
                element={
                  <AdminLayout>
                    <CalculatorPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/debts"
                element={
                  <AdminLayout>
                    <DebtsPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/history"
                element={
                  <AdminLayout>
                    <HistoryPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminLayout>
                    <ReportsPage />
                  </AdminLayout>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminLayout>
                    <SettingsPage />
                  </AdminLayout>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <InstallPWA />
          <PWAUpdateNotification />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
