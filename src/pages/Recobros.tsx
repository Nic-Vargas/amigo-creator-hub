import { useState } from "react";
import { Search, Plus, Filter, Download, Clock, AlertTriangle } from "lucide-react";
import { casosRecobro, LEYES } from "@/lib/mock-data";
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
          <p className="text-sm text-muted-foreground mt-1">Expedientes de recobro por ley y periodo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> Exportar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Caso
          </Button>
        </div>
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

      {/* Table view */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Caso</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ley</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Periodo</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficiario</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Salud</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pensión</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">C. Monetaria</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Transf. Econ.</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridad</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsable</th>
              <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((caso, i) => {
              const ley = LEYES.find((l) => l.id === caso.ley);
              return (
                <tr
                  key={caso.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold">{caso.id}</span>
                      {caso.prioridad === "Alta" && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                    </div>
                  </td>
                  <td className="p-3 text-xs">{ley?.nombre || caso.ley}</td>
                  <td className="p-3 font-mono text-xs">{caso.periodo}</td>
                  <td className="p-3 font-medium">{caso.beneficiarioNombre}</td>
                  <td className="p-3 text-right font-mono text-xs">{caso.valorSalud > 0 ? formatCurrency(caso.valorSalud) : '—'}</td>
                  <td className="p-3 text-right font-mono text-xs">{caso.valorPension > 0 ? formatCurrency(caso.valorPension) : '—'}</td>
                  <td className="p-3 text-right font-mono text-xs">{caso.valorCuotaMonetaria > 0 ? formatCurrency(caso.valorCuotaMonetaria) : '—'}</td>
                  <td className="p-3 text-right font-mono text-xs">{caso.valorTransferencia > 0 ? formatCurrency(caso.valorTransferencia) : '—'}</td>
                  <td className="p-3 text-right font-mono font-semibold">{formatCurrency(caso.valorTotal)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${estadoColors[caso.estado]}`}>
                      {caso.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant={caso.prioridad === "Alta" ? "destructive" : "secondary"} className="text-[10px]">
                      {caso.prioridad}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{caso.responsable}</td>
                  <td className="p-3 text-center">
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Grabar Mov.
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
