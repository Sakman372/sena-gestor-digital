import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRequests } from "@/components/dashboard/RecentRequests";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FileText, Clock, CheckCircle, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  pendientes: number;
  completados: number;
  total: number;
  documentos: number;
}

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff = role === 'admin' || role === 'funcionario';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch certificates stats
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('estado');

      if (certError) {
        console.error('Error fetching certificates:', certError);
      }

      // Fetch documents count
      const { count: docsCount, error: docsError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
      }

      const pendientes = certificates?.filter(c => c.estado === 'pendiente' || c.estado === 'en_proceso').length || 0;
      const completados = certificates?.filter(c => c.estado === 'completado').length || 0;

      setStats({
        pendientes,
        completados,
        total: certificates?.length || 0,
        documentos: docsCount || 0,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const userName = profile?.nombres || 'Usuario';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenido, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStaff 
              ? "Aquí tienes un resumen de la actividad del sistema"
              : "Aquí tienes un resumen de tu actividad"
            }
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="animate-fade-in stagger-1" style={{ animationFillMode: "backwards" }}>
              <StatCard
                title="Solicitudes Pendientes"
                value={stats?.pendientes || 0}
                icon={Clock}
                variant="accent"
              />
            </div>
            <div className="animate-fade-in stagger-2" style={{ animationFillMode: "backwards" }}>
              <StatCard
                title="Certificados Completados"
                value={stats?.completados || 0}
                icon={CheckCircle}
                variant="success"
              />
            </div>
            <div className="animate-fade-in stagger-3" style={{ animationFillMode: "backwards" }}>
              <StatCard
                title="Total Certificados"
                value={stats?.total || 0}
                icon={FileText}
                variant="primary"
              />
            </div>
            <div className="animate-fade-in stagger-4" style={{ animationFillMode: "backwards" }}>
              <StatCard
                title="Mis Documentos"
                value={stats?.documentos || 0}
                icon={Users}
                variant="default"
              />
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests - Takes 2 columns */}
          <div className="lg:col-span-2 animate-fade-in stagger-5" style={{ animationFillMode: "backwards" }}>
            <RecentRequests />
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in stagger-5" style={{ animationFillMode: "backwards" }}>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
