import { Shield, Users, Database, Bell, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { icon: Users, title: "Gestión de Usuarios", description: "Administrar roles, permisos y accesos al sistema", action: "Gestionar" },
  { icon: Database, title: "Catálogos y Parámetros", description: "Conceptos, causales de recobro, municipios, departamentos", action: "Configurar" },
  { icon: Shield, title: "Seguridad y Auditoría", description: "Logs de auditoría, políticas de contraseñas, sesiones", action: "Ver logs" },
  { icon: Bell, title: "Notificaciones", description: "Plantillas de email, SMS y alertas del sistema", action: "Configurar" },
  { icon: Lock, title: "Bloqueos y Cierres", description: "Gestión de locks de transacciones y cierres mensuales", action: "Gestionar" },
  { icon: FileText, title: "Plantillas MICRODATO", description: "Configurar plantillas de reporte para entes de control", action: "Editar" },
];

export default function Configuracion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Parámetros del sistema y administración</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((s, i) => (
          <div
            key={s.title}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">{s.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{s.description}</p>
            <Button variant="outline" size="sm" className="w-full">
              {s.action}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
