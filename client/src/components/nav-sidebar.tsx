import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Truck,
  Wheat,
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import logoProgresso from "/favicon.svg";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  roles?: string[];
}

export function NavSidebar() {
  const [location, setLocation] = useLocation();
  const { logout, user, selectedRole, clearCacheAndReload } = useAuth();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleClearCache = async () => {
    toast({
      variant: "info",
      title: "Limpando cache...",
      description: "Todos os dados em cache serão removidos.",
    });
    
    setTimeout(() => {
      clearCacheAndReload();
    }, 1000);
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Campo",
      href: "/campo",
      icon: Wheat,
    },
    {
      title: "Transporte",
      href: "/transporte",
      icon: Truck,
    },
    {
      title: "Algodoeira",
      href: "/algodoeira",
      icon: FileBarChart,
    },
    {
      title: "Estatísticas",
      href: "/talhao-stats",
      icon: BarChart3,
      roles: ["admin", "superadmin"],
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: FileText,
      roles: ["admin", "superadmin"],
    },
    {
      title: "Usuários",
      href: "/users",
      icon: Users,
      roles: ["superadmin"],
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
      roles: ["superadmin"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (selectedRole && item.roles.includes(selectedRole))
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-gradient-to-b from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 border-r border-green-100 dark:border-gray-700 shadow-lg",
          collapsed ? "w-16" : "w-64"
        )}
      >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-green-100 dark:border-gray-700 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          {!collapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
              <img 
                src={logoProgresso} 
                alt="Progresso" 
                className="h-8 w-auto transition-transform hover:scale-110 duration-300"
              />
              <div className="flex flex-col">
                <span className="font-bold text-green-700 dark:text-green-400 text-sm">
                  Cotton ID
                </span>
                <span className="text-xs text-muted-foreground">
                  Grupo Progresso
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <img 
              src={logoProgresso} 
              alt="Progresso" 
              className="h-8 w-auto mx-auto transition-transform hover:scale-110 duration-300"
            />
          )}
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div className="p-4 border-b border-green-100 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                  {user.username}
                </p>
                {selectedRole && (
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                      {selectedRole}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-300 animate-fade-in-up hover:scale-105",
                  isActive && "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:from-green-600 hover:to-emerald-700",
                  !isActive && "hover:bg-green-100 dark:hover:bg-gray-800",
                  collapsed && "justify-center px-2"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setLocation(item.href)}
              >
                <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.title}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-green-100 dark:border-gray-700 p-3 space-y-2 bg-white/30 dark:bg-gray-800/30">
          {selectedRole === "superadmin" && (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start transition-all duration-300 hover:bg-green-100 dark:hover:bg-gray-800 hover:scale-105",
                collapsed && "lg:justify-center lg:px-2"
              )}
              onClick={handleClearCache}
              title="Limpar Cache"
            >
              <RefreshCw className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && "Limpar Cache"}
            </Button>
          )}
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 hover:scale-105",
              collapsed && "lg:justify-center lg:px-2"
            )}
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && "Sair"}
          </Button>
          
          {/* Botão de recolher apenas em desktop */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full hover:bg-green-100 dark:hover:bg-gray-800"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Recolher</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>

      {/* Mobile Bottom Navigation - Estilo Instagram */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Apenas os itens administrativos/gerenciais */}
          {[
            { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { title: "Estatísticas", href: "/talhao-stats", icon: BarChart3, roles: ["admin", "superadmin"] },
            { title: "Relatórios", href: "/reports", icon: FileText, roles: ["admin", "superadmin"] },
            { title: "Usuários", href: "/users", icon: Users, roles: ["superadmin"] },
            { title: "Configurações", href: "/settings", icon: Settings, roles: ["superadmin"] },
          ]
            .filter((item) => !item.roles || (selectedRole && item.roles.includes(selectedRole)))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-gray-600 dark:text-gray-400 active:scale-95"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all",
                      isActive && "scale-110"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive && "font-semibold"
                  )}>
                    {item.title}
                  </span>
                </button>
              );
            })}
        </div>
      </nav>
    </>
  );
}
