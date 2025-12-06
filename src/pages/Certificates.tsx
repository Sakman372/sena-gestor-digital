import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending" | "in-progress" | "completed" | "rejected";

interface Certificate {
  id: string;
  type: string;
  requester: string;
  date: string;
  status: Status;
  program?: string;
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
    icon: XCircle,
  },
};

const certificates: Certificate[] = [
  { id: "SOL-001", type: "Certificado Académico", requester: "Juan Carlos Pérez", date: "15/12/2024", status: "in-progress", program: "Tecnología en Desarrollo de Software" },
  { id: "SOL-002", type: "Constancia de Matrícula", requester: "María López García", date: "14/12/2024", status: "pending", program: "Técnico en Sistemas" },
  { id: "SOL-003", type: "Certificado de Notas", requester: "Carlos Andrés Ruiz", date: "13/12/2024", status: "completed", program: "Tecnología en Análisis de Datos" },
  { id: "SOL-004", type: "Constancia de Instructor", requester: "Ana María Torres", date: "12/12/2024", status: "completed", program: "Instructor SENA" },
  { id: "SOL-005", type: "Certificado Académico", requester: "Diego Fernando Mora", date: "11/12/2024", status: "rejected", program: "Tecnología en Desarrollo de Software" },
  { id: "SOL-006", type: "Certificado de Notas", requester: "Laura Camila Gómez", date: "10/12/2024", status: "pending", program: "Técnico en Redes" },
  { id: "SOL-007", type: "Constancia de Matrícula", requester: "Pedro José Martínez", date: "09/12/2024", status: "completed", program: "Tecnología en Desarrollo Web" },
];

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificaciones</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las solicitudes de certificados
            </p>
          </div>
          <button className="btn-sena flex items-center gap-2 self-start">
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border shadow-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por tipo, solicitante o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-sena pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
                className="input-sena w-auto"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="in-progress">En proceso</option>
                <option value="completed">Completado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    ID
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Tipo de Certificado
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Solicitante
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Fecha
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCertificates.map((cert, index) => {
                  const status = statusConfig[cert.status];
                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-primary">{cert.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{cert.type}</p>
                            <p className="text-xs text-muted-foreground">{cert.program}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{cert.requester}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{cert.date}</td>
                      <td className="px-6 py-4">
                        <span className={status.className}>
                          <status.icon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Ver detalles">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {cert.status === "completed" && (
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Descargar">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Más opciones">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredCertificates.map((cert, index) => {
              const status = statusConfig[cert.status];
              return (
                <div
                  key={cert.id}
                  className="p-4 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{cert.type}</p>
                        <p className="text-xs text-primary">{cert.id}</p>
                      </div>
                    </div>
                    <span className={status.className}>
                      <status.icon className="w-3 h-3 mr-1" />
                      {status.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p><span className="font-medium text-foreground">Solicitante:</span> {cert.requester}</p>
                    <p><span className="font-medium text-foreground">Programa:</span> {cert.program}</p>
                    <p><span className="font-medium text-foreground">Fecha:</span> {cert.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-sena-outline flex-1 py-2 text-sm flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                    {cert.status === "completed" && (
                      <button className="btn-sena flex-1 py-2 text-sm flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{filteredCertificates.length}</span> de{" "}
              <span className="font-medium">{certificates.length}</span> resultados
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50" disabled>
                Anterior
              </button>
              <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
                1
              </button>
              <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
