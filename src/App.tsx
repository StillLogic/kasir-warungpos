import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, lazy, Suspense } from "react";
import { InstallPWA } from "./components/InstallPWA";
import { PWAUpdateNotification } from "./components/PWAUpdateNotification";
import { migrateFromLocalStorage } from "./database";


const LandingPage = lazy(() => import("./pages/LandingPage"));
const CashierIndex = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage").then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then(m => ({ default: m.ProductsPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then(m => ({ default: m.HistoryPage })));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage").then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage").then(m => ({ default: m.SettingsPage })));
const PricingPage = lazy(() => import("./pages/admin/PricingPage").then(m => ({ default: m.PricingPage })));
const CalculatorPage = lazy(() => import("./pages/admin/CalculatorPage").then(m => ({ default: m.CalculatorPage })));
const DebtsPage = lazy(() => import("./pages/admin/DebtsPage").then(m => ({ default: m.DebtsPage })));
const EmployeesPage = lazy(() => import("./pages/admin/employee/EmployeesPage").then(m => ({ default: m.EmployeesPage })));
const EmployeeEarningsPage = lazy(() => import("./pages/admin/employee/EmployeeEarningsPage").then(m => ({ default: m.EmployeeEarningsPage })));
const EmployeeDebtsPage = lazy(() => import("./pages/admin/employee/EmployeeDebtsPage").then(m => ({ default: m.EmployeeDebtsPage })));
const EmployeeRecordsPage = lazy(() => import("./pages/admin/employee/EmployeeRecordsPage").then(m => ({ default: m.EmployeeRecordsPage })));
const ShoppingListPage = lazy(() => import("./pages/admin/shopping/ShoppingListPage").then(m => ({ default: m.ShoppingListPage })));
const ShoppingArchivePage = lazy(() => import("./pages/admin/shopping/ShoppingArchivePage").then(m => ({ default: m.ShoppingArchivePage })));
const MasterDataPage = lazy(() => import("./pages/admin/MasterDataPage").then(m => ({ default: m.MasterDataPage })));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">Memuat...</span>
      </div>
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/cashier" element={<CashierIndex />} />
                <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
                <Route path="/admin/pricing" element={<AdminRoute><PricingPage /></AdminRoute>} />
                <Route path="/admin/calculator" element={<AdminRoute><CalculatorPage /></AdminRoute>} />
                <Route path="/admin/debts" element={<AdminRoute><DebtsPage /></AdminRoute>} />
                <Route path="/admin/history" element={<AdminRoute><HistoryPage /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
                <Route path="/admin/employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
                <Route path="/admin/employees/earnings" element={<AdminRoute><EmployeeEarningsPage /></AdminRoute>} />
                <Route path="/admin/employees/debts" element={<AdminRoute><EmployeeDebtsPage /></AdminRoute>} />
                <Route path="/admin/employees/records" element={<AdminRoute><EmployeeRecordsPage /></AdminRoute>} />
                <Route path="/admin/shopping-list" element={<AdminRoute><ShoppingListPage /></AdminRoute>} />
                <Route path="/admin/shopping-archive" element={<AdminRoute><ShoppingArchivePage /></AdminRoute>} />
                <Route path="/admin/master-data" element={<AdminRoute><MasterDataPage /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <InstallPWA />
            </Suspense>
          </BrowserRouter>
          <PWAUpdateNotification />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;