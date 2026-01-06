import { Outlet } from 'react-router-dom';
import { Header } from './header';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 pb-16">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 SentimenPIM — Sistem Analisis Sentimen PT Pupuk Iskandar Muda
          </p>
        </div>
      </footer>
    </div>
  );
}
