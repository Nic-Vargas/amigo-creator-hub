import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "accent" | "warning" | "destructive";
  delay?: number;
}

const variantStyles = {
  default: "border-border",
  accent: "border-accent/30 bg-accent/5",
  warning: "border-warning/30 bg-warning/5",
  destructive: "border-destructive/30 bg-destructive/5",
};

const iconVariants = {
  default: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, variant = "default", delay = 0 }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 animate-fade-in",
        variantStyles[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-card-foreground animate-count-up">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-accent" : "text-destructive")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconVariants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
