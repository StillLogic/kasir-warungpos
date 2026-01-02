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
import { DashboardPage, ReportsPage, SettingsPage } from "./pages/admin";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/admin";
import { InstallPWA } from "./components/InstallPWA";
import NotFound from "./pages/NotFound";
import { migrateFromLocalStorage } from "./database";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Migrate data from localStorage to IndexedDB on first load
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
              {/* Main Cashier */}
              <Route path="/" element={<Index />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
              <Route path="/admin/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
              <Route path="/admin/history" element={<AdminLayout><HistoryPage /></AdminLayout>} />
              <Route path="/admin/reports" element={<AdminLayout><ReportsPage /></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><SettingsPage /></AdminLayout>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <InstallPWA />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
