import { useState } from "react";
import { Search, Plus, Filter, Download, Eye } from "lucide-react";
import { beneficiarios } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saldosPorConcepto, CONCEPTOS } from "@/lib/mock-data";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

const estadoStyles: Record<string, string> = {
  activo: "bg-accent/15 text-accent border-accent/30",
  bloqueado: "bg-destructive/15 text-destructive border-destructive/30",
  inactivo: "bg-muted text-muted-foreground border-border",
};

export default function Beneficiarios() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = beneficiarios.filter(
    (b) =>
      b.nombres.toLowerCase().includes(search.toLowerCase()) ||
      b.apellidos.toLowerCase().includes(search.toLowerCase()) ||
      b.documento.includes(search)
  );

  const selected = beneficiarios.find((b) => b.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beneficiarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de beneficiarios registrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> Exportar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Beneficiario
          </Button>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Documento</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Municipio</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Total</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Registro</th>
              <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="p-3">
                  <span className="font-mono text-xs">{b.tipoDoc} {b.documento}</span>
                </td>
                <td className="p-3 font-medium">{b.nombres} {b.apellidos}</td>
                <td className="p-3 text-muted-foreground">{b.municipio}, {b.departamento}</td>
                <td className="p-3 text-right font-mono font-semibold">{formatCurrency(b.saldoTotal)}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${estadoStyles[b.estado]}`}>
                    {b.estado}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{b.fechaRegistro}</td>
                <td className="p-3 text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedId(b.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Estado de Cuenta</DialogTitle>
                      </DialogHeader>
                      {selected && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                              {selected.nombres[0]}{selected.apellidos[0]}
                            </div>
                            <div>
                              <p className="font-semibold">{selected.nombres} {selected.apellidos}</p>
                              <p className="text-xs text-muted-foreground">{selected.tipoDoc} {selected.documento}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {saldosPorConcepto.map((s) => (
                              <div key={s.concepto} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <span className="text-sm text-muted-foreground">{s.nombreConcepto}</span>
                                <span className="text-sm font-mono font-semibold">{formatCurrency(s.saldo)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border">
                            <span className="font-semibold">Saldo Total</span>
                            <span className="font-bold font-mono text-lg">{formatCurrency(selected.saldoTotal)}</span>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
