import { useState } from "react";
import { Bell, Search, Menu, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  userRole?: string;
}

export function Header({ onMenuClick, userName = "Juan Pablo", userRole = "Funcionario" }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Nueva solicitud recibida", time: "Hace 5 min", unread: true },
    { id: 2, title: "Certificado aprobado", time: "Hace 1 hora", unread: true },
    { id: 3, title: "Documento actualizado", time: "Hace 2 horas", unread: false },
  ];

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar trámites, documentos..."
            className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-lg shadow-elevated animate-fade-in z-50">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">Notificaciones</h3>
                  <span className="text-xs text-primary cursor-pointer hover:underline">
                    Marcar todas como leídas
                  </span>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors",
                      notification.unread && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          notification.unread ? "bg-primary" : "bg-muted"
                        )}
                      ></div>
                      <div>
                        <p className="text-sm text-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <button className="text-sm text-primary hover:underline w-full text-center">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-lg shadow-elevated animate-fade-in z-50">
              <div className="p-2">
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Mi Perfil
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Configuración
                </a>
                <hr className="my-2 border-border" />
                <a
                  href="/"
                  className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  Cerrar Sesión
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
