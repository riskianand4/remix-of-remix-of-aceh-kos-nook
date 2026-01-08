import { NavLink } from "react-router-dom";
import { BarChart3, FileText, Search, Info, Menu, X, FlaskConical } from "lucide-react";
import { ThemeToggle } from "../../components/theme/theme-toggle";
import { cn } from "../../lib/utils";
import { useState } from "react";
import { FloatingDock } from "../../components/ui/floating-dock";
import logo from "../../assets/logo.png";
import { IconBrandX, IconExchange, IconHome, IconNewSection, IconTerminal2 } from "@tabler/icons-react";
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg ">
            <img src={logo} alt="" />
          </div>
          <span className="sm:text-lg font-semibold text-xs">
            Sentimen Pupuk Iskandar Muda
          </span>
        </NavLink>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile menu button */}
          
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && <nav className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({
          isActive
        }) => cn("flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg", isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>)}
          </div>
        </nav>}
    </header>;
}