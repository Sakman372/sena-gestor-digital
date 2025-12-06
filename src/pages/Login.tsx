import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    identification: "",
    password: "",
    remember: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (formData.identification && formData.password) {
      navigate("/dashboard");
    } else {
      setError("Por favor ingrese sus credenciales");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-sena-green-dark to-primary opacity-90"></div>
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="w-24 h-24 bg-primary-foreground/20 backdrop-blur rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <span className="text-5xl font-bold text-primary-foreground">S</span>
          </div>
          
          <h1 className="text-4xl font-bold text-primary-foreground text-center mb-4">
            SENA
          </h1>
          <p className="text-xl text-primary-foreground/90 text-center mb-2">
            Sistema de Gestión Administrativa
          </p>
          <p className="text-primary-foreground/70 text-center max-w-md">
            Optimizando procesos administrativos para una gestión más eficiente y transparente
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">15K+</p>
              <p className="text-sm text-primary-foreground/70">Usuarios activos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">50K+</p>
              <p className="text-sm text-primary-foreground/70">Certificados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">99%</p>
              <p className="text-sm text-primary-foreground/70">Satisfacción</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">S</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Bienvenido</h2>
            <p className="text-muted-foreground">
              Ingrese sus credenciales para acceder al sistema
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Número de Identificación
              </label>
              <input
                type="text"
                value={formData.identification}
                onChange={(e) =>
                  setFormData({ ...formData, identification: e.target.value })
                }
                placeholder="Ingrese su número de identificación"
                className="input-sena"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Ingrese su contraseña"
                  className="input-sena pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) =>
                    setFormData({ ...formData, remember: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Recordarme</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "btn-sena w-full flex items-center justify-center gap-2",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿No tiene cuenta?{" "}
            <a href="/register" className="text-primary hover:underline font-medium">
              Solicitar acceso
            </a>
          </p>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 SENA - Servicio Nacional de Aprendizaje
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
