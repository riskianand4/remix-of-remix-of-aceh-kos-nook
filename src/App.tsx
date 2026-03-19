import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Dashboard from "./pages/Dashboard";
import DocumentEditor from "./pages/DocumentEditor";
import Arsip from "./pages/Arsip";
import VerifyDocument from "./pages/VerifyDocument";
import CompanyProfile from "./pages/CompanyProfile";
import ReviewPage from "./pages/ReviewPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage, { ResetPasswordPage } from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import { Loader2, LogOut, User, ChevronDown, UserCircle } from "lucide-react";

const queryClient = new QueryClient();

// Pages that should NOT show the sidebar layout
const NO_SIDEBAR_ROUTES = ['/editor/', '/review/'];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, token } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <span className="text-xs max-w-[100px] truncate hidden sm:block">
            {user?.name || user?.email || 'Akun'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-foreground truncate">{user?.name || 'Pengguna'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2">
          <UserCircle className="h-3.5 w-3.5" /> Profil Saya
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
          <LogOut className="h-3.5 w-3.5" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  const location = useLocation();
  const hideSidebar = NO_SIDEBAR_ROUTES.some(r => location.pathname.startsWith(r));

  if (hideSidebar) {
    return (
      <Routes>
        <Route path="/editor/:id" element={<ProtectedRoute><DocumentEditor /></ProtectedRoute>} />
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
              <UserMenu />
            </div>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/arsip" element={<ProtectedRoute><Arsip /></ProtectedRoute>} />
              <Route path="/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
          <AuthProvider>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {/* All other routes go through AppLayout */}
              <Route path="*" element={<AppLayout />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
