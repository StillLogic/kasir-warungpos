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
import { Layout } from "./components/Layout";
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
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
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
