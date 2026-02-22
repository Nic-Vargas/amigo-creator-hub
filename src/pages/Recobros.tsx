import { useState } from "react";
import { Search, Plus, Filter, Clock, AlertTriangle } from "lucide-react";
import { casosRecobro, CONCEPTOS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

const estadoColors: Record<string, string> = {
  Abierto: "bg-warning/15 text-warning border-warning/30",
  "En gestión": "bg-info/15 text-info border-info/30",
  Acuerdo: "bg-accent/15 text-accent border-accent/30",
  "En pago": "bg-primary/15 text-primary border-primary/30",
  Cerrado: "bg-muted text-muted-foreground border-border",
};

const estadoSteps = ["Abierto", "En gestión", "Acuerdo", "En pago", "Cerrado"];

export default function Recobros() {
  const [search, setSearch] = useState("");

  const filtered = casosRecobro.filter(
    (c) =>
      c.beneficiarioNombre.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Casos de Recobro</h1>
          <p className="text-sm text-muted-foreground mt-1">Expedientes de recobro y seguimiento de gestión</p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Nuevo Caso
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(
          casosRecobro.reduce((acc, c) => {
            acc[c.estado] = (acc[c.estado] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([estado, count]) => (
          <div key={estado} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{estado}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por caso o beneficiario..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Cards view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((caso, i) => {
          const currentStep = estadoSteps.indexOf(caso.estado);
          return (
            <div
              key={caso.id}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{caso.id}</span>
                    {caso.prioridad === "Alta" && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                  <p className="font-semibold mt-1">{caso.beneficiarioNombre}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${estadoColors[caso.estado]}`}>
                  {caso.estado}
                </span>
              </div>

              {/* Progress */}
              <div className="flex gap-1 mb-3">
                {estadoSteps.map((step, idx) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${idx <= currentStep ? "bg-accent" : "bg-muted"}`}
                  />
                ))}
              </div>

              <div className="flex gap-1 flex-wrap mb-3">
                {caso.conceptos.map((c) => {
                  const concepto = CONCEPTOS.find((x) => x.id === c);
                  return (
                    <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {concepto?.nombre}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Valor: <strong className="text-card-foreground font-mono">{formatCurrency(caso.valorTotal)}</strong></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {caso.ultimaGestion}
                  </span>
                </div>
                <span>{caso.responsable}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
