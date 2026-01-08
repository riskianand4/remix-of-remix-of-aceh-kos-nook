import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { FloatingDock } from "../ui/floating-dock";
import {
  IconAnalyzeFilled,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";
import { CheckCircle, Database, Info } from "lucide-react";

export function Layout() {
  const links = [
    {
      title: "Dashboard",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      to: "/",
    },
    {
      title: "Analisis",
      icon: (
        <IconAnalyzeFilled className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      to: "/analisis",
    },
    {
      title: "Dataset",
      icon: (
        <Database className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      to: "/dataset",
    },
    {
      title: "Evaluasi",
      icon: (
        <CheckCircle className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      to: "/evaluasi",
    },
    {
      title: "Tentang",
      icon: (
        <Info className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      to: "/tentang",
    },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 pb-16">
        <Outlet />
        <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-max ">
          <FloatingDock items={links} />
        </div>
      </main>
      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container py-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SentimenPIM — Sistem Analisis Sentimen
            PT Pupuk Iskandar Muda
          </p>
        </div>
      </footer>
    </div>
  );
}
