import { useState } from "react";
import { Search, Plus, Filter, Download } from "lucide-react";
import { LEYES } from "@/lib/mock-data";
import { useAppData } from "@/context/AppDataContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v);

const tipoStyles: Record<string, { label: string; color: string }> = {
  SALDO_INICIAL: {
    label: "Saldo Inicial",
    color: "bg-primary/15 text-primary border-primary/30",
  },
  INCREMENTO: {
    label: "Incremento",
    color: "bg-info/15 text-info border-info/30",
  },
  REINTEGRO: {
    label: "Reintegro",
    color: "bg-accent/15 text-accent border-accent/30",
  },
  NO_PROCEDE: {
    label: "No Procede",
    color: "bg-warning/15 text-warning border-warning/30",
  },
  AJUSTE: {
    label: "Ajuste",
    color: "bg-muted text-muted-foreground border-border",
  },
};

export default function Movimientos() {
  const { movimientos } = useAppData();
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
          <p className="text-sm text-muted-foreground mt-1">
            Registro de saldos iniciales, incrementos, reintegros y ajustes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> Exportar Movimiento
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Registrar Movimiento
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por beneficiario, ID o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ley
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Periodo
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Beneficiario
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Salud
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pensión
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                C. Monetaria
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transf. Econ.
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usuario
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const tipo = tipoStyles[m.tipo];
              const ley = LEYES.find((l) => l.id === m.ley);

              return (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3 font-mono text-xs font-medium">{m.id}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.fecha}
                  </td>
                  <td className="p-3 text-xs">{ley?.nombre || m.ley}</td>
                  <td className="p-3 font-mono text-xs">{m.periodo}</td>
                  <td className="p-3 font-medium">{m.beneficiarioNombre}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tipo.color}`}
                    >
                      {tipo.label}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorSalud > 0 ? formatCurrency(m.valorSalud) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorPension > 0 ? formatCurrency(m.valorPension) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorCuotaMonetaria > 0
                      ? formatCurrency(m.valorCuotaMonetaria)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorTransferencia > 0
                      ? formatCurrency(m.valorTransferencia)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {formatCurrency(m.valor)}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.usuario}
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