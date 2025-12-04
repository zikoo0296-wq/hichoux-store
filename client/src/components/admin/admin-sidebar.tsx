import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  ShoppingBag,
  CheckSquare,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@shared/schema";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: "Tableau de bord",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Confirmation",
    url: "/admin/confirmation",
    icon: CheckSquare,
    roles: ["super_admin", "admin", "operator"],
  },
  {
    title: "Commandes",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Produits",
    url: "/admin/products",
    icon: Package,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Catégories",
    url: "/admin/categories",
    icon: FolderTree,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Étiquettes",
    url: "/admin/shipping-labels",
    icon: Truck,
    roles: ["super_admin", "admin", "operator"],
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Utilisateurs",
    url: "/admin/users",
    icon: Users,
    roles: ["super_admin"],
  },
  {
    title: "Paramètres",
    url: "/admin/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
];

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  operator: "Opérateur",
  support: "Support",
};

export function AdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const userRole = (user?.role as UserRole) || "support";

  const isActive = (url: string) => {
    if (url === "/admin") {
      return location === "/admin";
    }
    return location.startsWith(url);
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-lg">E-Shop</span>
            <p className="text-xs text-muted-foreground">Administration</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link href={item.url} data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Accès rapide</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/" target="_blank" data-testid="link-view-store">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Voir la boutique</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {roleLabels[userRole]}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
