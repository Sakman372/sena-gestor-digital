import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  numero_identificacion: z.string().min(5, "Número de identificación requerido"),
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  telefono: z.string().optional(),
  role: z.enum(["aprendiz", "instructor"]).default("aprendiz"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    numero_identificacion: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    role: "aprendiz",
  });

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({});

    try {
      registerSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof RegisterFormData] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);

    const { error: signUpError } = await signUp({
      email: formData.email,
      password: formData.password,
      numero_identificacion: formData.numero_identificacion,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      telefono: formData.telefono,
      role: formData.role,
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Este email ya está registrado. Por favor inicie sesión.");
      } else {
        setError(signUpError.message);
      }
    } else {
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-sena-green-dark to-primary opacity-90"></div>
        
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="w-20 h-20 bg-primary-foreground/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-4xl font-bold text-primary-foreground">S</span>
          </div>
          
          <h1 className="text-3xl font-bold text-primary-foreground text-center mb-3">
            SENA
          </h1>
          <p className="text-lg text-primary-foreground/90 text-center mb-2">
            Sistema de Gestión Administrativa
          </p>
          <p className="text-primary-foreground/70 text-center max-w-sm text-sm">
            Crea tu cuenta para acceder a todos los servicios administrativos del SENA
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Back to Login */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a iniciar sesión
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">S</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Crear Cuenta</h2>
            <p className="text-muted-foreground text-sm">
              Complete el formulario para registrarse en el sistema
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Nombres y Apellidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  placeholder="Juan Carlos"
                  className={cn("input-sena", errors.nombres && "border-destructive")}
                  required
                />
                {errors.nombres && (
                  <p className="text-xs text-destructive mt-1">{errors.nombres}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Pérez García"
                  className={cn("input-sena", errors.apellidos && "border-destructive")}
                  required
                />
                {errors.apellidos && (
                  <p className="text-xs text-destructive mt-1">{errors.apellidos}</p>
                )}
              </div>
            </div>

            {/* Row 2: Identificación y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Número de Identificación *
                </label>
                <input
                  type="text"
                  name="numero_identificacion"
                  value={formData.numero_identificacion}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className={cn("input-sena", errors.numero_identificacion && "border-destructive")}
                  required
                />
                {errors.numero_identificacion && (
                  <p className="text-xs text-destructive mt-1">{errors.numero_identificacion}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="3001234567"
                  className="input-sena"
                />
              </div>
            </div>

            {/* Row 3: Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className={cn("input-sena", errors.email && "border-destructive")}
                required
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Row 4: Rol */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tipo de Usuario *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-sena"
                required
              >
                <option value="aprendiz">Aprendiz</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            {/* Row 5: Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className={cn("input-sena pr-10", errors.password && "border-destructive")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirme su contraseña"
                    className={cn("input-sena pr-10", errors.confirmPassword && "border-destructive")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "btn-sena w-full flex items-center justify-center gap-2 mt-6",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Registrarse</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Ya tiene cuenta?{" "}
            <Link to="/" className="text-primary hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 SENA - Servicio Nacional de Aprendizaje
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
