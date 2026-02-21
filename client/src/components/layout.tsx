import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  Settings, 
  ShieldAlert,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth-context";
import logoImg from "@/assets/images/logo-shield.png";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const isMobile = useIsMobile();
  const { logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "PGR (NR-01)", href: "/pgr", icon: FileText },
    { name: "Empresas", href: "/empresas", icon: Users },
    { name: "Treinamentos", href: "/treinamentos", icon: GraduationCap },
    { name: "Documentos", href: "/documentos", icon: ClipboardCheck },
    { name: "Configurações", href: "/configuracoes", icon: Settings },
  ];

  const pageTitle =
    location.startsWith("/ajuda")
      ? "Ajuda"
      : navigation.find(n => n.href === location || (n.href !== "/" && location.startsWith(n.href)))?.name || "Dashboard";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col z-20",
          sidebarOpen ? "w-64" : "w-16",
          isMobile && !sidebarOpen && "w-0 overflow-hidden"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3 min-w-0">
          {sidebarOpen ? (
            <>
              <img src={logoImg} alt="Escudo SST Logo" className="h-9 w-9 object-contain shrink-0" />
              <span className="font-bold text-base leading-tight">
                <span className="block">Escudo</span>
                <span className="block text-xs font-medium text-sidebar-foreground/80">Consultoria em SST</span>
              </span>
            </>
          ) : (
            <img src={logoImg} alt="Escudo SST Logo" className="h-8 w-8 object-contain mx-auto" />
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                  {sidebarOpen && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="font-medium text-xs">TS</span>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">Tassia dos Santos</span>
                <span className="text-xs text-sidebar-foreground/60 truncate">Téc. Segurança</span>
              </div>
            </div>
          ) : (
             <div className="w-8 h-8 mx-auto rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="font-medium text-xs">TS</span>
              </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground hidden md:block">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden sm:flex"
              onClick={() => setLocation("/ajuda")}
            >
              Ajuda
            </Button>
            <Button size="sm" onClick={() => void logout()}>
              Sair
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

