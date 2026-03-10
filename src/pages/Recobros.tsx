import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
} from "lucide-react";
import { LEYES, beneficiarios } from "@/lib/mock-data";
import { useAppData } from "@/context/AppDataContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v);

const estadoColors: Record<string, string> = {
  Abierto: "bg-warning/15 text-warning border-warning/30",
  "En gestión": "bg-info/15 text-info border-info/30",
  Acuerdo: "bg-accent/15 text-accent border-accent/30",
  "En pago": "bg-primary/15 text-primary border-primary/30",
  Cerrado: "bg-muted text-muted-foreground border-border",
};

const conceptosMovimiento = [
  "Reintegro - Pago",
  "Normalización",
  "No procede",
  "Ajuste contable",
  "No procede - Giro no efectuado",
];

type MovimientoFormState = Record<
  string,
  {
    valor: string;
    tipo: string;
  }
>;

export default function Recobros() {
  const { casos, usuarioActual, guardarMovimientoDesdeRecobro } = useAppData();

  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movimientosForm, setMovimientosForm] = useState<MovimientoFormState>(
    {}
  );

  const filtered = casos.filter(
    (c) =>
      c.beneficiarioNombre.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCase = useMemo(
    () => casos.find((c) => c.id === selectedCaseId),
    [casos, selectedCaseId]
  );

  const selectedBeneficiary = useMemo(
    () =>
      selectedCase
        ? beneficiarios.find((b) => b.id === selectedCase.beneficiarioId)
        : null,
    [selectedCase]
  );

  const getCaseConcepts = (caso: (typeof casos)[number]) => [
    { id: "salud", nombre: "Salud", valor: caso.valorSalud },
    { id: "pension", nombre: "Pensión", valor: caso.valorPension },
    {
      id: "cuota_monetaria",
      nombre: "Cuota Monetaria",
      valor: caso.valorCuotaMonetaria,
    },
    {
      id: "transferencia_economica",
      nombre: "Transferencia Económica",
      valor: caso.valorTransferencia,
    },
  ];

  const handleOpenDialog = (caseId: string) => {
    const caso = casos.find((c) => c.id === caseId);
    if (!caso) return;

    const conceptos = getCaseConcepts(caso);

    setSelectedCaseId(caseId);

    setMovimientosForm(() => {
      const nextState: MovimientoFormState = {};

      conceptos.forEach((concepto) => {
        nextState[concepto.id] = {
          valor: "",
          tipo: "",
        };
      });

      return nextState;
    });

    setDialogOpen(true);
  };

  const updateMovimientoValor = (conceptoId: string, value: string) => {
    const onlyNumbers = value.replace(/[^\d]/g, "");

    setMovimientosForm((prev) => ({
      ...prev,
      [conceptoId]: {
        ...prev[conceptoId],
        valor: onlyNumbers,
      },
    }));
  };

  const updateMovimientoTipo = (conceptoId: string, value: string) => {
    setMovimientosForm((prev) => ({
      ...prev,
      [conceptoId]: {
        ...prev[conceptoId],
        tipo: value,
      },
    }));
  };

  const handleGuardarMovimientos = () => {
    if (!selectedCaseId) return;

    guardarMovimientoDesdeRecobro({
      caseId: selectedCaseId,
      user: usuarioActual,
      valores: movimientosForm,
    });

    setDialogOpen(false);
    setSelectedCaseId(null);
    setMovimientosForm({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Casos de Recobro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Expedientes de recobro por ley y periodo
          </p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(
          casos.reduce((acc, c) => {
            acc[c.estado] = (acc[c.estado] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([estado, count]) => (
          <div
            key={estado}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <p className="text-2xl font-bold text-card-foreground">{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{estado}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por caso o beneficiario..."
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
                Caso
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
                Estado
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prioridad
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Responsable
              </th>
              <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((caso, i) => {
              const ley = LEYES.find((l) => l.id === caso.ley);
              const totalCaso =
                caso.valorSalud +
                caso.valorPension +
                caso.valorCuotaMonetaria +
                caso.valorTransferencia;

              return (
                <tr
                  key={caso.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold">
                        {caso.id}
                      </span>
                      {caso.prioridad === "Alta" && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-xs">{ley?.nombre || caso.ley}</td>
                  <td className="p-3 font-mono text-xs">{caso.periodo}</td>
                  <td className="p-3 font-medium">{caso.beneficiarioNombre}</td>
                  <td className="p-3 text-right font-mono text-xs">
                    {caso.valorSalud > 0 ? formatCurrency(caso.valorSalud) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {caso.valorPension > 0
                      ? formatCurrency(caso.valorPension)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {caso.valorCuotaMonetaria > 0
                      ? formatCurrency(caso.valorCuotaMonetaria)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {caso.valorTransferencia > 0
                      ? formatCurrency(caso.valorTransferencia)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {formatCurrency(totalCaso)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${estadoColors[caso.estado]}`}
                    >
                      {caso.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        caso.prioridad === "Alta" ? "destructive" : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {caso.prioridad}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {caso.responsable}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleOpenDialog(caso.id)}
                    >
                      Grabar Mov.
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estado de Cuenta</DialogTitle>
          </DialogHeader>

          {selectedCase && selectedBeneficiary && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {selectedBeneficiary.nombres[0]}
                  {selectedBeneficiary.apellidos[0]}
                </div>

                <div>
                  <p className="font-semibold">
                    {selectedBeneficiary.nombres}{" "}
                    {selectedBeneficiary.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBeneficiary.tipoDoc}{" "}
                    {selectedBeneficiary.documento}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {getCaseConcepts(selectedCase).map((concepto) => (
                  <div
                    key={concepto.id}
                    className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr_1fr] gap-3 items-center py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {concepto.nombre}
                    </span>

                    <Input
                      placeholder="Ingrese valor"
                      value={movimientosForm[concepto.id]?.valor ?? ""}
                      onChange={(e) =>
                        updateMovimientoValor(concepto.id, e.target.value)
                      }
                      className="font-mono"
                    />

                    <Select
                      value={movimientosForm[concepto.id]?.tipo ?? ""}
                      onValueChange={(value) =>
                        updateMovimientoTipo(concepto.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione concepto" />
                      </SelectTrigger>
                      <SelectContent>
                        {conceptosMovimiento.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarMovimientos}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}