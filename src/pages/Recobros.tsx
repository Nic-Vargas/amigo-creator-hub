import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { LEYES } from "@/lib/mock-data";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/hooks/use-toast";
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
] as const;

type MovimientoFormState = Record<
  string,
  {
    valor: string;
    tipo: string;
  }
>;

type NuevoCasoFormState = {
  beneficiarioId: string;
  ley: string;
  periodo: string;
  valorSalud: string;
  valorPension: string;
  valorCuotaMonetaria: string;
  valorTransferencia: string;
  estado: string;
  prioridad: string;
  responsable: string;
};

type FilterFormState = {
  caso: string;
  ley: string;
  periodo: string;
  beneficiario: string;
  estado: string;
  prioridad: string;
  responsable: string;
};

const initialFilters: FilterFormState = {
  caso: "",
  ley: "all",
  periodo: "",
  beneficiario: "",
  estado: "all",
  prioridad: "all",
  responsable: "",
};

export default function Recobros() {
  const {
    beneficiarios,
    casos,
    usuarioActual,
    guardarMovimientoDesdeRecobro,
    crearNuevoCaso,
  } = useAppData();

  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCaseDialogOpen, setNewCaseDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [movimientosForm, setMovimientosForm] = useState<MovimientoFormState>(
    {}
  );
  const [editPeriodo, setEditPeriodo] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<FilterFormState>(initialFilters);

  const [nuevoCasoForm, setNuevoCasoForm] = useState<NuevoCasoFormState>({
    beneficiarioId: "",
    ley: "ley_100",
    periodo: "",
    valorSalud: "",
    valorPension: "",
    valorCuotaMonetaria: "",
    valorTransferencia: "",
    estado: "Abierto",
    prioridad: "Media",
    responsable: usuarioActual,
  });

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return casos.filter((c) => {
      const matchesSearch =
        searchText === "" ||
        c.id.toLowerCase().includes(searchText) ||
        c.beneficiarioNombre.toLowerCase().includes(searchText);

      const matchesCaso =
        filters.caso.trim() === "" ||
        c.id.toLowerCase().includes(filters.caso.trim().toLowerCase());

      const matchesLey = filters.ley === "all" || c.ley === filters.ley;

      const matchesPeriodo =
        filters.periodo.trim() === "" ||
        c.periodo.toLowerCase().includes(filters.periodo.trim().toLowerCase());

      const matchesBeneficiario =
        filters.beneficiario.trim() === "" ||
        c.beneficiarioNombre
          .toLowerCase()
          .includes(filters.beneficiario.trim().toLowerCase());

      const matchesEstado =
        filters.estado === "all" || c.estado === filters.estado;

      const matchesPrioridad =
        filters.prioridad === "all" || c.prioridad === filters.prioridad;

      const matchesResponsable =
        filters.responsable.trim() === "" ||
        c.responsable
          .toLowerCase()
          .includes(filters.responsable.trim().toLowerCase());

      return (
        matchesSearch &&
        matchesCaso &&
        matchesLey &&
        matchesPeriodo &&
        matchesBeneficiario &&
        matchesEstado &&
        matchesPrioridad &&
        matchesResponsable
      );
    });
  }, [casos, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, currentPage, pageSize]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.caso !== "" ||
      filters.ley !== "all" ||
      filters.periodo !== "" ||
      filters.beneficiario !== "" ||
      filters.estado !== "all" ||
      filters.prioridad !== "all" ||
      filters.responsable !== ""
    );
  }, [filters]);

  const selectedCase = useMemo(
    () => casos.find((c) => c.id === selectedCaseId),
    [casos, selectedCaseId]
  );

  const selectedBeneficiary = useMemo(
    () =>
      selectedCase
        ? beneficiarios.find((b) => b.id === selectedCase.beneficiarioId)
        : null,
    [beneficiarios, selectedCase]
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
    setEditPeriodo(caso.periodo);

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
    if (!selectedCaseId || !selectedCase) return;

    const conceptosActuales = getCaseConcepts(selectedCase);

    for (const concepto of conceptosActuales) {
      const movimiento = movimientosForm[concepto.id];
      if (!movimiento || !movimiento.tipo) continue;

      const valorIngresado = Number(movimiento.valor || 0);
      const saldoActual = concepto.valor;

      const esPago = movimiento.tipo === "Reintegro - Pago";
      const esNoProcede =
        movimiento.tipo === "No procede" ||
        movimiento.tipo === "No procede - Giro no efectuado";

      if (esPago) {
        if (saldoActual <= 0) {
          toast({
            title: "Movimiento no permitido",
            description: `No puedes aplicar "${movimiento.tipo}" sobre ${concepto.nombre} porque el saldo actual es 0.`,
            variant: "destructive",
          });
          return;
        }

        if (valorIngresado <= 0) {
          toast({
            title: "Valor inválido",
            description: `Debes ingresar un valor mayor a 0 para ${concepto.nombre}.`,
            variant: "destructive",
          });
          return;
        }

        if (valorIngresado > saldoActual) {
          toast({
            title: "Valor excedido",
            description: `No puedes aplicar un pago de ${formatCurrency(
              valorIngresado
            )} en ${concepto.nombre} porque supera el saldo actual de ${formatCurrency(
              saldoActual
            )}.`,
            variant: "destructive",
          });
          return;
        }
      }

      if (esNoProcede && saldoActual <= 0) {
        toast({
          title: "Movimiento no permitido",
          description: `No puedes aplicar "${movimiento.tipo}" sobre ${concepto.nombre} porque el saldo actual ya es 0.`,
          variant: "destructive",
        });
        return;
      }
    }

    guardarMovimientoDesdeRecobro({
      caseId: selectedCaseId,
      user: usuarioActual,
      periodo: editPeriodo,
      valores: movimientosForm,
    });

    toast({
      title: "Movimiento guardado",
      description: "Los cambios se aplicaron correctamente.",
    });

    setDialogOpen(false);
    setSelectedCaseId(null);
    setEditPeriodo("");
    setMovimientosForm({});
  };

  const updateNuevoCasoField = (
    field: keyof NuevoCasoFormState,
    value: string
  ) => {
    setNuevoCasoForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNuevoCasoNumberField = (
    field:
      | "valorSalud"
      | "valorPension"
      | "valorCuotaMonetaria"
      | "valorTransferencia",
    value: string
  ) => {
    const onlyNumbers = value.replace(/[^\d]/g, "");

    setNuevoCasoForm((prev) => ({
      ...prev,
      [field]: onlyNumbers,
    }));
  };

  const handleCrearNuevoCaso = () => {
    if (!nuevoCasoForm.beneficiarioId || !nuevoCasoForm.periodo.trim()) return;

    crearNuevoCaso({
      beneficiarioId: nuevoCasoForm.beneficiarioId,
      ley: nuevoCasoForm.ley as
        | "ley_100"
        | "ley_797"
        | "ley_2225"
        | "ley_1636",
      periodo: nuevoCasoForm.periodo,
      valorSalud: Number(nuevoCasoForm.valorSalud || 0),
      valorPension: Number(nuevoCasoForm.valorPension || 0),
      valorCuotaMonetaria: Number(nuevoCasoForm.valorCuotaMonetaria || 0),
      valorTransferencia: Number(nuevoCasoForm.valorTransferencia || 0),
      estado: nuevoCasoForm.estado as
        | "Abierto"
        | "En gestión"
        | "Acuerdo"
        | "En pago"
        | "Cerrado",
      prioridad: nuevoCasoForm.prioridad as "Alta" | "Media" | "Baja",
      responsable: nuevoCasoForm.responsable || usuarioActual,
    });

    setNuevoCasoForm({
      beneficiarioId: "",
      ley: "ley_100",
      periodo: "",
      valorSalud: "",
      valorPension: "",
      valorCuotaMonetaria: "",
      valorTransferencia: "",
      estado: "Abierto",
      prioridad: "Media",
      responsable: usuarioActual,
    });

    setNewCaseDialogOpen(false);
  };

  const updateFilterField = (field: keyof FilterFormState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleExportarRecobros = () => {
    const dataToExport = filtered.map((caso) => {
      const ley = LEYES.find((l) => l.id === caso.ley);

      const totalCaso =
        caso.valorSalud +
        caso.valorPension +
        caso.valorCuotaMonetaria +
        caso.valorTransferencia;

      return {
        Caso: caso.id,
        Ley: ley?.nombre || caso.ley,
        Periodo: caso.periodo,
        Beneficiario: caso.beneficiarioNombre,
        Salud: caso.valorSalud,
        Pension: caso.valorPension,
        CuotaMonetaria: caso.valorCuotaMonetaria,
        TransferenciaEconomica: caso.valorTransferencia,
        Total: totalCaso,
        Estado: caso.estado,
        Prioridad: caso.prioridad,
        Responsable: caso.responsable,
        FechaApertura: caso.fechaApertura,
        UltimaGestion: caso.ultimaGestion,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recobros");

    const fechaExportacion = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `recobros_${filtered.length}_registros_${fechaExportacion}.xlsx`
    );
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
          <Button variant="outline" size="sm" onClick={handleExportarRecobros}>
            <Download className="w-4 h-4 mr-1.5" /> Exportar
          </Button>

          <Button size="sm" onClick={() => setNewCaseDialogOpen(true)}>
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

        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilterDialogOpen(true)}
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
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
            {paginatedData.map((caso, i) => {
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          a{" "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * pageSize, filtered.length)}
          </span>{" "}
          de{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          registros
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtros de Recobros</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Caso
              </label>
              <Input
                placeholder="Ej: CR-001"
                value={filters.caso}
                onChange={(e) => updateFilterField("caso", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Ley
              </label>
              <Select
                value={filters.ley}
                onValueChange={(value) => updateFilterField("ley", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione ley" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {LEYES.map((ley) => (
                    <SelectItem key={ley.id} value={ley.id}>
                      {ley.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Periodo
              </label>
              <Input
                placeholder="Ej: 2024-01"
                value={filters.periodo}
                onChange={(e) => updateFilterField("periodo", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Beneficiario
              </label>
              <Input
                placeholder="Nombre del beneficiario"
                value={filters.beneficiario}
                onChange={(e) =>
                  updateFilterField("beneficiario", e.target.value)
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Estado
              </label>
              <Select
                value={filters.estado}
                onValueChange={(value) => updateFilterField("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="En gestión">En gestión</SelectItem>
                  <SelectItem value="Acuerdo">Acuerdo</SelectItem>
                  <SelectItem value="En pago">En pago</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Prioridad
              </label>
              <Select
                value={filters.prioridad}
                onValueChange={(value) => updateFilterField("prioridad", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block">
                Responsable
              </label>
              <Input
                placeholder="Nombre del responsable"
                value={filters.responsable}
                onChange={(e) =>
                  updateFilterField("responsable", e.target.value)
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Período
                  </label>
                  <Input
                    value={editPeriodo}
                    onChange={(e) => setEditPeriodo(e.target.value)}
                    placeholder="Ej: 2024-08"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {getCaseConcepts(selectedCase).map((concepto) => (
                  <div
                    key={concepto.id}
                    className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-3 items-center py-2 border-b border-border last:border-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        {concepto.nombre}
                      </span>
                      <span className="text-xs font-mono text-foreground">
                        Saldo actual: {formatCurrency(concepto.valor)}
                      </span>
                    </div>

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
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedCaseId(null);
                    setEditPeriodo("");
                    setMovimientosForm({});
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleGuardarMovimientos}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newCaseDialogOpen} onOpenChange={setNewCaseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Caso</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Beneficiario
                </label>
                <Select
                  value={nuevoCasoForm.beneficiarioId}
                  onValueChange={(value) =>
                    updateNuevoCasoField("beneficiarioId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione beneficiario" />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiarios.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombres} {b.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Ley
                </label>
                <Select
                  value={nuevoCasoForm.ley}
                  onValueChange={(value) => updateNuevoCasoField("ley", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione ley" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEYES.map((ley) => (
                      <SelectItem key={ley.id} value={ley.id}>
                        {ley.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Periodo
                </label>
                <Input
                  placeholder="Ej: 2024-08"
                  value={nuevoCasoForm.periodo}
                  onChange={(e) =>
                    updateNuevoCasoField("periodo", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Responsable
                </label>
                <Input
                  value={nuevoCasoForm.responsable}
                  onChange={(e) =>
                    updateNuevoCasoField("responsable", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Estado
                </label>
                <Select
                  value={nuevoCasoForm.estado}
                  onValueChange={(value) =>
                    updateNuevoCasoField("estado", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Abierto">Abierto</SelectItem>
                    <SelectItem value="En gestión">En gestión</SelectItem>
                    <SelectItem value="Acuerdo">Acuerdo</SelectItem>
                    <SelectItem value="En pago">En pago</SelectItem>
                    <SelectItem value="Cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Prioridad
                </label>
                <Select
                  value={nuevoCasoForm.prioridad}
                  onValueChange={(value) =>
                    updateNuevoCasoField("prioridad", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-sm text-muted-foreground">Salud</span>
                <Input
                  placeholder="Ingrese valor"
                  value={nuevoCasoForm.valorSalud}
                  onChange={(e) =>
                    updateNuevoCasoNumberField("valorSalud", e.target.value)
                  }
                  className="font-mono md:col-span-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-sm text-muted-foreground">Pensión</span>
                <Input
                  placeholder="Ingrese valor"
                  value={nuevoCasoForm.valorPension}
                  onChange={(e) =>
                    updateNuevoCasoNumberField("valorPension", e.target.value)
                  }
                  className="font-mono md:col-span-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-sm text-muted-foreground">
                  Cuota Monetaria
                </span>
                <Input
                  placeholder="Ingrese valor"
                  value={nuevoCasoForm.valorCuotaMonetaria}
                  onChange={(e) =>
                    updateNuevoCasoNumberField(
                      "valorCuotaMonetaria",
                      e.target.value
                    )
                  }
                  className="font-mono md:col-span-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-sm text-muted-foreground">
                  Transferencia Económica
                </span>
                <Input
                  placeholder="Ingrese valor"
                  value={nuevoCasoForm.valorTransferencia}
                  onChange={(e) =>
                    updateNuevoCasoNumberField(
                      "valorTransferencia",
                      e.target.value
                    )
                  }
                  className="font-mono md:col-span-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setNewCaseDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCrearNuevoCaso}>Guardar Caso</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}