import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRequests } from "@/components/dashboard/RecentRequests";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FileText, Clock, CheckCircle, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenido, Juan Pablo
          </h1>
          <p className="text-muted-foreground mt-1">
            Aquí tienes un resumen de la actividad del sistema
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-fade-in stagger-1" style={{ animationFillMode: "backwards" }}>
            <StatCard
              title="Solicitudes Pendientes"
              value={15}
              icon={Clock}
              variant="accent"
              trend={{ value: 12, isPositive: false }}
            />
          </div>
          <div className="animate-fade-in stagger-2" style={{ animationFillMode: "backwards" }}>
            <StatCard
              title="Certificados Generados"
              value={245}
              icon={FileText}
              variant="primary"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in stagger-3" style={{ animationFillMode: "backwards" }}>
            <StatCard
              title="Completados Hoy"
              value={12}
              icon={CheckCircle}
              variant="success"
            />
          </div>
          <div className="animate-fade-in stagger-4" style={{ animationFillMode: "backwards" }}>
            <StatCard
              title="Usuarios Activos"
              value="1,234"
              icon={Users}
              variant="default"
            />
          </div>
        </div>

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

        {/* Activity Chart Placeholder */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Actividad del Sistema
          </h2>
          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Gráfico de actividad mensual
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Próximamente disponible
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
