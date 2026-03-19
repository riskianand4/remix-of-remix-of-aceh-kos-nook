import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Building2, ShieldCheck, Archive, Plus, BookTemplate,
  Download, FileUp, Shield
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import BackendStatus from '@/components/BackendStatus';

const ACTION_ITEMS = [
  { id: 'create', title: 'Buat Dokumen', icon: Plus },
  { id: 'import', title: 'Import', icon: FileUp },
  { id: 'template', title: 'Template', icon: BookTemplate },
  { id: 'export', title: 'Export', icon: Download },
];

const NAV_ITEMS = [
  { title: 'Dokumen', url: '/', icon: FileText },
  { title: 'Arsip', url: '/arsip', icon: Archive },
  { title: 'Profil Perusahaan', url: '/company-profile', icon: Building2 },
  { title: 'Verifikasi', url: '/verify', icon: ShieldCheck },
];

interface AppSidebarProps {
  onAction?: (action: string) => void;
}

export function AppSidebar({ onAction }: AppSidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Actions first */}
        <SidebarGroup>
          <SidebarGroupLabel>Aksi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ACTION_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => onAction?.(item.id)}
                        className="hover:bg-muted/50 cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/'}
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/admin"
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <Shield className="h-4 w-4" />
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">Admin Panel</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
