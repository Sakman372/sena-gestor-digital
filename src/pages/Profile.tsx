import { useState, useRef, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10MB

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<"info" | "security" | "notifications">("info");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        nombres: profile.nombres || "",
        apellidos: profile.apellidos || "",
        email: profile.email || "",
        telefono: profile.telefono || "",
      });
    }
  }, [profile]);

  const tabs = [
    { id: "info" as const, label: "Información Personal", icon: User },
    { id: "security" as const, label: "Seguridad", icon: Shield },
    { id: "notifications" as const, label: "Notificaciones", icon: Bell },
  ];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no puede superar los 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        await supabase.storage.from('avatars').remove([profile.avatar_url]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: "Error al subir imagen",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('user_id', user.id);

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada",
      });

      refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      toast({
        title: "Error",
        description: "Nombres y apellidos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
          telefono: formData.telefono.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados exitosamente",
      });

      refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
    return data.publicUrl;
  };

  const avatarUrl = getAvatarUrl();

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
                <div className="w-24 h-24 bg-card border-4 border-card rounded-full flex items-center justify-center shadow-elevated overflow-hidden">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-card hover:bg-sena-green-dark transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="flex-1 pt-4 sm:pt-0">
                <h2 className="text-xl font-bold text-foreground">
                  {profile ? `${profile.nombres} ${profile.apellidos}` : 'Usuario'}
                </h2>
                <p className="text-muted-foreground capitalize">{role || 'Usuario'}</p>
              </div>
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-sena flex items-center gap-2 self-start sm:self-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
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
                  Nombres
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                    className="input-sena pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  className="input-sena"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Número de Identificación
                </label>
                <input
                  type="text"
                  value={profile?.numero_identificacion || ''}
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
                    value={formData.email}
                    className="input-sena pl-10"
                    disabled
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
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="input-sena pl-10"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Rol
                </label>
                <input
                  type="text"
                  value={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Usuario'}
                  className="input-sena capitalize"
                  disabled
                />
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
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
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
                <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme su nueva contraseña"
                  className="input-sena"
                />
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="btn-sena mt-4 flex items-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </button>
            </div>

            <hr className="my-8 border-border" />

            <h3 className="text-lg font-medium text-foreground mb-4">Información de la Cuenta</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Correo electrónico</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Último acceso</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleString('es-CO')
                      : 'N/A'
                    }
                  </p>
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
