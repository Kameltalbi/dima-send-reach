import { 
  LayoutDashboard, 
  Users, 
  ListChecks, 
  Mail, 
  Settings, 
  LogOut,
  BarChart3,
  FileText,
  HelpCircle,
  Shield,
  Crown,
  UsersRound,
  Filter,
  Zap
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Logo } from "@/components/Logo";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Campagnes", url: "/campagnes", icon: Mail },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Listes", url: "/listes", icon: ListChecks },
  { title: "Segmentation", url: "/segmentation", icon: Filter },
  { title: "Automatisations", url: "/automatisations", icon: Zap },
  { title: "Statistiques", url: "/statistiques", icon: BarChart3 },
  { title: "Templates", url: "/templates", icon: FileText },
];

const settingsItems = [
  { title: "Paramètres", url: "/parametres", icon: Settings },
  { title: "Équipe", url: "/team", icon: UsersRound },
  { title: "Support", url: "/support", icon: HelpCircle },
];

const superAdminItems = [
  { title: "Dashboard Admin", url: "/superadmin", icon: Crown },
  { title: "Config. SES", url: "/config-ses", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const isCollapsed = state === "collapsed";
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center justify-center px-2">
            <img 
              src="/DymaMail blanc.png" 
              alt="DymaMail Logo" 
              className={`${isCollapsed ? "h-8 w-8" : "h-12 w-auto"} object-contain`}
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-primary">
              Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3"
                        onClick={(e) => {
                          // Forcer la navigation vers SuperAdmin avec replace pour éviter les redirections
                          if (item.url === "/superadmin") {
                            e.preventDefault();
                            navigate("/superadmin", { replace: true });
                          }
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
