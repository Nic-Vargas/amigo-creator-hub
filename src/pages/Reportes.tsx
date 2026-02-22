import { FileSpreadsheet, FileText, Download, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reportes = [
  { id: 1, nombre: "Cartera General por Concepto", tipo: "Operativo", formato: "Excel", frecuencia: "Mensual", ultimoGenerado: "2024-07-15" },
  { id: 2, nombre: "Estado de Cuenta por Beneficiario", tipo: "Operativo", formato: "PDF", frecuencia: "Bajo demanda", ultimoGenerado: "2024-07-20" },
  { id: 3, nombre: "Reporte MICRODATO - SSF", tipo: "Entes de Control", formato: "CSV", frecuencia: "Trimestral", ultimoGenerado: "2024-06-30" },
  { id: 4, nombre: "Antigüedad de Cartera", tipo: "Gerencial", formato: "Excel", frecuencia: "Mensual", ultimoGenerado: "2024-07-01" },
  { id: 5, nombre: "Efectividad de Gestión de Recobro", tipo: "Gerencial", formato: "PDF", frecuencia: "Mensual", ultimoGenerado: "2024-07-10" },
  { id: 6, nombre: "Movimientos por Periodo", tipo: "Operativo", formato: "Excel", frecuencia: "Mensual", ultimoGenerado: "2024-07-15" },
  { id: 7, nombre: "Acuerdos de Pago y Cumplimiento", tipo: "Operativo", formato: "Excel", frecuencia: "Semanal", ultimoGenerado: "2024-07-22" },
  { id: 8, nombre: "Reporte MICRODATO - MinTrabajo", tipo: "Entes de Control", formato: "TXT", frecuencia: "Semestral", ultimoGenerado: "2024-06-30" },
];

const tipoColors: Record<string, string> = {
  Operativo: "bg-info/15 text-info border-info/30",
  Gerencial: "bg-primary/15 text-primary border-primary/30",
  "Entes de Control": "bg-warning/15 text-warning border-warning/30",
};

export default function Reportes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">Generación de reportes operativos, gerenciales y para entes de control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportes.map((r, i) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow animate-fade-in flex flex-col justify-between"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {r.formato === "Excel" ? (
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                  ) : r.formato === "PDF" ? (
                    <FileText className="w-4 h-4 text-primary" />
                  ) : (
                    <BarChart3 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tipoColors[r.tipo]}`}>
                  {r.tipo}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-card-foreground mb-1">{r.nombre}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {r.frecuencia}
                </span>
                <span>Formato: <strong>{r.formato}</strong></span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">Último: {r.ultimoGenerado}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="w-3 h-3 mr-1" /> Generar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
