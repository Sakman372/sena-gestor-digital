import { FileText, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Request {
  id: string;
  type: string;
  requester: string;
  date: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    className: "badge-warning",
    icon: Clock,
  },
  "in-progress": {
    label: "En proceso",
    className: "badge-info",
    icon: AlertCircle,
  },
  completed: {
    label: "Completado",
    className: "badge-success",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rechazado",
    className: "badge-error",
    icon: AlertCircle,
  },
};

const sampleRequests: Request[] = [
  {
    id: "SOL-001",
    type: "Certificado Académico",
    requester: "Juan Carlos Pérez",
    date: "15/12/2024",
    status: "in-progress",
  },
  {
    id: "SOL-002",
    type: "Constancia de Matrícula",
    requester: "María López García",
    date: "14/12/2024",
    status: "pending",
  },
  {
    id: "SOL-003",
    type: "Certificado de Notas",
    requester: "Carlos Andrés Ruiz",
    date: "13/12/2024",
    status: "completed",
  },
  {
    id: "SOL-004",
    type: "Constancia de Instructor",
    requester: "Ana María Torres",
    date: "12/12/2024",
    status: "completed",
  },
  {
    id: "SOL-005",
    type: "Certificado Académico",
    requester: "Diego Fernando Mora",
    date: "11/12/2024",
    status: "rejected",
  },
];

export function RecentRequests() {
  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Solicitudes Recientes</h2>
          <a href="/certificates" className="text-sm text-primary hover:underline">
            Ver todas
          </a>
        </div>
      </div>

      <div className="divide-y divide-border">
        {sampleRequests.map((request, index) => {
          const status = statusConfig[request.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={request.id}
              className={cn(
                "p-4 hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in",
                `stagger-${index + 1}`
              )}
              style={{ animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">{request.type}</p>
                    <span className="text-xs text-muted-foreground">{request.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{request.requester}</span>
                    <span>•</span>
                    <span>{request.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={status.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </span>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
