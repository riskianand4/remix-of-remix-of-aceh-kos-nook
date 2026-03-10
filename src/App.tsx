import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Dashboard from "./pages/Dashboard";
import DocumentEditor from "./pages/DocumentEditor";
import Arsip from "./pages/Arsip";
import VerifyDocument from "./pages/VerifyDocument";
import CompanyProfile from "./pages/CompanyProfile";
import ReviewPage from "./pages/ReviewPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Pages that should NOT show the sidebar layout
const NO_SIDEBAR_ROUTES = ['/editor/', '/review/'];

function AppLayout() {
  const location = useLocation();
  const hideSidebar = NO_SIDEBAR_ROUTES.some(r => location.pathname.startsWith(r));

  if (hideSidebar) {
    return (
      <Routes>
        <Route path="/editor/:id" element={<DocumentEditor />} />
        <Route path="/review/:code" element={<ReviewPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar onAction={(action) => window.dispatchEvent(new CustomEvent('sidebar-action', { detail: action }))} />
        <div className="flex-1 flex flex-col min-w-0 -z-0 ">
          <header className="h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 sticky top-0 z-50">
            Project Dokumentation Generator
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/arsip" element={<Arsip />} />
              <Route path="/company-profile" element={<CompanyProfile />} />
              <Route path="/verify" element={<VerifyDocument />} />
              <Route path="/verify/:code" element={<VerifyDocument />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
