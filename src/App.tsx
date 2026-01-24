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
import { AdminLayout } from "./components/admin";
import { InstallPWA } from "./components/InstallPWA";
import { PWAUpdateNotification } from "./components/PWAUpdateNotification";
import NotFound from "./pages/NotFound";
import { migrateFromLocalStorage } from "./database";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
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
