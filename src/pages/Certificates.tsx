import { useState, useEffect } from "react";
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
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = "pendiente" | "en_proceso" | "completado" | "rechazado";

interface Certificate {
  id: string;
  certificate_type_id: string;
  user_id: string;
  estado: string;
  fecha_solicitud: string;
  fecha_procesamiento: string | null;
  fecha_entrega: string | null;
  observaciones: string | null;
  archivo_url: string | null;
  certificate_type?: {
    nombre: string;
    descripcion: string | null;
  };
  profile?: {
    nombres: string;
    apellidos: string;
  };
}

interface CertificateType {
  id: string;
  nombre: string;
  descripcion: string | null;
  tiempo_procesamiento_dias: number | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pendiente: {
    label: "Pendiente",
    className: "badge-warning",
    icon: Clock,
  },
  en_proceso: {
    label: "En proceso",
    className: "badge-info",
    icon: AlertCircle,
  },
  completado: {
    label: "Completado",
    className: "badge-success",
    icon: CheckCircle,
  },
  rechazado: {
    label: "Rechazado",
    className: "badge-error",
    icon: XCircle,
  },
};

export default function Certificates() {
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const isStaff = role === 'admin' || role === 'funcionario';

  useEffect(() => {
    fetchCertificates();
    fetchCertificateTypes();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('certificates')
        .select(`
          *,
          certificate_types (nombre, descripcion)
        `)
        .order('fecha_solicitud', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching certificates:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los certificados",
          variant: "destructive",
        });
        return;
      }

      // Fetch profile info for each certificate if staff
      if (isStaff && data) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nombres, apellidos')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const certificatesWithProfiles = data.map(cert => ({
          ...cert,
          certificate_type: cert.certificate_types,
          profile: profileMap.get(cert.user_id),
        }));
        
        setCertificates(certificatesWithProfiles);
      } else {
        setCertificates(data?.map(cert => ({
          ...cert,
          certificate_type: cert.certificate_types,
        })) || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateTypes = async () => {
    const { data, error } = await supabase
      .from('certificate_types')
      .select('*')
      .eq('activo', true);

    if (!error && data) {
      setCertificateTypes(data);
    }
  };

  const handleCreateCertificate = async () => {
    if (!selectedTypeId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un tipo de certificado",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para solicitar un certificado",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('certificates')
        .insert({
          certificate_type_id: selectedTypeId,
          user_id: user.id,
          estado: 'pendiente',
          observaciones: observaciones || null,
        });

      if (error) {
        console.error('Error creating certificate:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo crear la solicitud",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Solicitud creada",
        description: "Tu solicitud de certificado ha sido registrada exitosamente",
      });

      setIsDialogOpen(false);
      setSelectedTypeId("");
      setObservaciones("");
      fetchCertificates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const typeName = cert.certificate_type?.nombre || '';
    const requesterName = cert.profile ? `${cert.profile.nombres} ${cert.profile.apellidos}` : '';
    
    const matchesSearch =
      typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDownload = async (cert: Certificate) => {
    if (cert.archivo_url) {
      const { data } = supabase.storage.from('certificates').getPublicUrl(cert.archivo_url);
      window.open(data.publicUrl, '_blank');
    } else {
      toast({
        title: "No disponible",
        description: "El archivo del certificado aún no está disponible",
        variant: "destructive",
      });
    }
  };

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
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="btn-sena flex items-center gap-2 self-start"
          >
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-sena w-auto"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
                      {isStaff && (
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                          Solicitante
                        </th>
                      )}
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
                    {filteredCertificates.length === 0 ? (
                      <tr>
                        <td colSpan={isStaff ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">
                          No se encontraron certificados
                        </td>
                      </tr>
                    ) : (
                      filteredCertificates.map((cert, index) => {
                        const status = statusConfig[cert.estado] || statusConfig.pendiente;
                        return (
                          <tr
                            key={cert.id}
                            className="hover:bg-muted/30 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-primary">
                                {cert.id.substring(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {cert.certificate_type?.nombre || 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {cert.certificate_type?.descripcion || ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {isStaff && (
                              <td className="px-6 py-4 text-sm text-foreground">
                                {cert.profile ? `${cert.profile.nombres} ${cert.profile.apellidos}` : 'N/A'}
                              </td>
                            )}
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {formatDate(cert.fecha_solicitud)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={status.className}>
                                <status.icon className="w-3 h-3 mr-1" />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => {
                                    setSelectedCertificate(cert);
                                    setIsViewDialogOpen(true);
                                  }}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors" 
                                  title="Ver detalles"
                                >
                                  <Eye className="w-4 h-4 text-muted-foreground" />
                                </button>
                                {cert.estado === "completado" && (
                                  <button 
                                    onClick={() => handleDownload(cert)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors" 
                                    title="Descargar"
                                  >
                                    <Download className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border">
                {filteredCertificates.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No se encontraron certificados
                  </div>
                ) : (
                  filteredCertificates.map((cert, index) => {
                    const status = statusConfig[cert.estado] || statusConfig.pendiente;
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
                              <p className="font-medium text-foreground">
                                {cert.certificate_type?.nombre || 'N/A'}
                              </p>
                              <p className="text-xs text-primary">
                                {cert.id.substring(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <span className={status.className}>
                            <status.icon className="w-3 h-3 mr-1" />
                            {status.label}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          {isStaff && cert.profile && (
                            <p>
                              <span className="font-medium text-foreground">Solicitante:</span>{" "}
                              {cert.profile.nombres} {cert.profile.apellidos}
                            </p>
                          )}
                          <p>
                            <span className="font-medium text-foreground">Fecha:</span>{" "}
                            {formatDate(cert.fecha_solicitud)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSelectedCertificate(cert);
                              setIsViewDialogOpen(true);
                            }}
                            className="btn-sena-outline flex-1 py-2 text-sm flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          {cert.estado === "completado" && (
                            <button 
                              onClick={() => handleDownload(cert)}
                              className="btn-sena flex-1 py-2 text-sm flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Descargar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium">{filteredCertificates.length}</span> de{" "}
                  <span className="font-medium">{certificates.length}</span> resultados
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Certificate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tipo de Certificado *
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="input-sena"
              >
                <option value="">Selecciona un tipo</option>
                {certificateTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="input-sena min-h-[100px] resize-none"
                placeholder="Añade cualquier información adicional..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="btn-sena-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCertificate}
                disabled={submitting}
                className="btn-sena flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Solicitud"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Certificado</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{selectedCertificate.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <span className={statusConfig[selectedCertificate.estado]?.className || 'badge-warning'}>
                    {statusConfig[selectedCertificate.estado]?.label || selectedCertificate.estado}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedCertificate.certificate_type?.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Solicitud</p>
                  <p className="font-medium">{formatDate(selectedCertificate.fecha_solicitud)}</p>
                </div>
                {selectedCertificate.fecha_procesamiento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Procesamiento</p>
                    <p className="font-medium">{formatDate(selectedCertificate.fecha_procesamiento)}</p>
                  </div>
                )}
                {selectedCertificate.observaciones && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Observaciones</p>
                    <p className="font-medium">{selectedCertificate.observaciones}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsViewDialogOpen(false)}
                  className="btn-sena-outline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
