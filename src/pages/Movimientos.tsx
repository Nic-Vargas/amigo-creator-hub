import { useState } from "react";
import { Search, Plus, Filter, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { movimientos, CONCEPTOS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

const tipoStyles: Record<string, { label: string; color: string; icon: "up" | "down" }> = {
  DESEMBOLSO: { label: "Desembolso", color: "bg-destructive/15 text-destructive border-destructive/30", icon: "up" },
  PAGO_BENEFICIARIO: { label: "Pago", color: "bg-accent/15 text-accent border-accent/30", icon: "down" },
  REINTEGRO_ADMINISTRADORA: { label: "Reintegro Adm.", color: "bg-accent/15 text-accent border-accent/30", icon: "down" },
  AJUSTE_NO_PROCEDENCIA: { label: "Ajuste N/P", color: "bg-warning/15 text-warning border-warning/30", icon: "down" },
  REVERSO: { label: "Reverso", color: "bg-muted text-muted-foreground border-border", icon: "down" },
};

export default function Movimientos() {
  const [search, setSearch] = useState("");

  const filtered = movimientos.filter(
    (m) =>
      m.beneficiarioNombre.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimientos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de desembolsos, pagos y ajustes</p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Registrar Movimiento
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por beneficiario, ID o descripción..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficiario</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Concepto</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Periodo</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const tipo = tipoStyles[m.tipo];
              const concepto = CONCEPTOS.find((c) => c.id === m.concepto);
              return (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="p-3 font-mono text-xs font-medium">{m.id}</td>
                  <td className="p-3 text-muted-foreground text-xs">{m.fecha}</td>
                  <td className="p-3 font-medium">{m.beneficiarioNombre}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-[10px]">{concepto?.nombre}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {tipo.icon === "up" ? (
                        <ArrowUpCircle className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <ArrowDownCircle className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tipo.color}`}>
                        {tipo.label}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    <span className={m.tipo === "DESEMBOLSO" ? "text-destructive" : "text-accent"}>
                      {m.tipo === "DESEMBOLSO" ? "+" : "-"}{formatCurrency(m.valor)}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{m.periodo}</td>
                  <td className="p-3 text-muted-foreground text-xs">{m.usuario}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
