import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Save,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"info" | "security" | "notifications">("info");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const tabs = [
    { id: "info" as const, label: "Información Personal", icon: User },
    { id: "security" as const, label: "Seguridad", icon: Shield },
    { id: "notifications" as const, label: "Notificaciones", icon: Bell },
  ];

  const userData = {
    name: "Juan Pablo González",
    identification: "1234567890",
    email: "juan.gonzalez@sena.edu.co",
    phone: "+57 300 123 4567",
    address: "Bogotá, Colombia",
    role: "Funcionario Administrativo",
    joinDate: "15/03/2020",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Administra tu información personal y configuración
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-primary to-sena-green-dark relative">
            <div className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          </div>

          {/* Avatar & Basic Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
              <div className="relative">
                <div className="w-24 h-24 bg-card border-4 border-card rounded-full flex items-center justify-center shadow-elevated">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-card hover:bg-sena-green-dark transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 pt-4 sm:pt-0">
                <h2 className="text-xl font-bold text-foreground">{userData.name}</h2>
                <p className="text-muted-foreground">{userData.role}</p>
              </div>
              <button className="btn-sena flex items-center gap-2 self-start sm:self-auto">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
            <h3 className="text-lg font-medium text-foreground mb-6">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    defaultValue={userData.name}
                    className="input-sena pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Número de Identificación
                </label>
                <input
                  type="text"
                  defaultValue={userData.identification}
                  className="input-sena"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    defaultValue={userData.email}
                    className="input-sena pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    defaultValue={userData.phone}
                    className="input-sena pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ubicación
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    defaultValue={userData.address}
                    className="input-sena pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Fecha de Ingreso
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    defaultValue={userData.joinDate}
                    className="input-sena pl-10"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
            <h3 className="text-lg font-medium text-foreground mb-6">Cambiar Contraseña</h3>
            
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña actual"
                    className="input-sena pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Ingrese su nueva contraseña"
                    className="input-sena pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Confirme su nueva contraseña"
                  className="input-sena"
                />
              </div>

              <button className="btn-sena mt-4">
                Actualizar Contraseña
              </button>
            </div>

            <hr className="my-8 border-border" />

            <h3 className="text-lg font-medium text-foreground mb-4">Sesiones Activas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Este dispositivo</p>
                  <p className="text-sm text-muted-foreground">Chrome en Windows • Bogotá, Colombia</p>
                </div>
                <span className="badge-success">Activa ahora</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
            <h3 className="text-lg font-medium text-foreground mb-6">Preferencias de Notificaciones</h3>
            
            <div className="space-y-6">
              {[
                { title: "Notificaciones por correo", description: "Recibir actualizaciones importantes en tu correo" },
                { title: "Notificaciones push", description: "Recibir alertas en tiempo real en el navegador" },
                { title: "Recordatorios de trámites", description: "Recibir recordatorios de trámites pendientes" },
                { title: "Boletín informativo", description: "Recibir noticias y actualizaciones del SENA" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
