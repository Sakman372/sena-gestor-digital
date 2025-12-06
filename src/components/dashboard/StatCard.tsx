import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "success";
  className?: string;
}

const variants = {
  default: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  accent: {
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = variants[variant];

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-sm mt-2 flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs mes anterior</span>
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", variantStyles.iconBg)}>
          <Icon className={cn("w-6 h-6", variantStyles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
