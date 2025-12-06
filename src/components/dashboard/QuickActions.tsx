import { Plus, Search, Upload, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    icon: Plus,
    label: "Nueva Solicitud",
    description: "Crear solicitud de certificado",
    path: "/certificates/new",
    variant: "primary" as const,
  },
  {
    icon: Search,
    label: "Buscar Documento",
    description: "Buscar en el sistema",
    path: "/documents",
    variant: "default" as const,
  },
  {
    icon: Upload,
    label: "Cargar Documento",
    description: "Subir nuevo archivo",
    path: "/documents/upload",
    variant: "default" as const,
  },
  {
    icon: FileCheck,
    label: "Validar Certificado",
    description: "Verificar autenticidad",
    path: "/certificates/validate",
    variant: "default" as const,
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">Accesos Rápidos</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`p-4 rounded-lg border transition-all duration-200 text-left group ${
              action.variant === "primary"
                ? "bg-primary text-primary-foreground border-primary hover:bg-sena-green-dark"
                : "bg-card border-border hover:border-primary hover:bg-primary/5"
            }`}
          >
            <action.icon
              className={`w-6 h-6 mb-2 ${
                action.variant === "primary"
                  ? "text-primary-foreground"
                  : "text-primary group-hover:text-primary"
              }`}
            />
            <p
              className={`font-medium text-sm ${
                action.variant === "primary" ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {action.label}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                action.variant === "primary"
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
