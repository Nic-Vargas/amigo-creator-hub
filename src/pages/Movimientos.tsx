import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { LEYES } from "@/lib/mock-data";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    label: "Pago",
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

type FilterFormState = {
  id: string;
  fecha: string;
  ley: string;
  periodo: string;
  beneficiario: string;
  tipo: string;
  usuario: string;
  medioPago: string;
};

const initialFilters: FilterFormState = {
  id: "",
  fecha: "",
  ley: "all",
  periodo: "",
  beneficiario: "",
  tipo: "all",
  usuario: "",
  medioPago: "",
};

type BeneficiaryApi = {
  id: string;
  tipoDocumento: string;
  documento: string;
  nombres: string;
  apellidos: string;
};

type RecobroCaseApi = {
  id: string;
  ley: string;
  periodo: string;
};

type UserApi = {
  id: string;
  fullName: string;
  email: string;
};

type MovimientoApi = {
  id: string;
  recobroCaseId: string;
  beneficiaryId: string;
  tipo: "SALDO_INICIAL" | "INCREMENTO" | "REINTEGRO" | "NO_PROCEDE" | "AJUSTE";
  concepto:
    | "SALUD"
    | "PENSION"
    | "CUOTA_MONETARIA"
    | "TRANSFERENCIA_ECONOMICA";
  adjustmentDirection?: "SUMA" | "RESTA" | null;
  valor: string;
  descripcion: string | null;
  saldoAnteriorConcepto: string;
  saldoNuevoConcepto: string;
  caseTotalAnterior: string;
  caseTotalNuevo: string;
  beneficiaryTotalAnterior: string;
  beneficiaryTotalNuevo: string;
  createdAt: string;
  beneficiary?: BeneficiaryApi;
  recobroCase?: RecobroCaseApi;
  user?: UserApi;
};

type MovimientoRow = {
  id: string;
  documento: string;
  fecha: string;
  ley: string;
  periodo: string;
  beneficiario: string;
  tipo: MovimientoApi["tipo"];
  tipoLabel: string;
  concepto: MovimientoApi["concepto"];
  valorSalud: number;
  valorPension: number;
  valorCuotaMonetaria: number;
  valorTransferencia: number;
  valor: number;
  usuario: string;
  medioPago: string;
  descripcion: string;
  fechaModificacion: string;
};

function getMedioPagoFromDescription(description: string) {
  const match = description.match(/Medio:\s*([^|]+)/i);
  return match?.[1]?.trim() ?? "";
}

function getTipoLabel(m: MovimientoApi) {
  if (m.tipo === "REINTEGRO") return "Pago";
  if (m.tipo === "AJUSTE" && m.adjustmentDirection) {
    return `Ajuste ${m.adjustmentDirection === "SUMA" ? "Suma" : "Resta"}`;
  }

  return tipoStyles[m.tipo]?.label ?? m.tipo;
}

function getSignedValue(m: MovimientoApi) {
  const value = Number(m.valor);

  if (m.tipo === "REINTEGRO") return -Math.abs(value);
  if (m.tipo === "NO_PROCEDE") return -Math.abs(value);
  if (m.tipo === "AJUSTE" && m.adjustmentDirection === "RESTA") {
    return -Math.abs(value);
  }

  return Math.abs(value);
}

function mapMovimientoToRow(m: MovimientoApi): MovimientoRow {
  const signedValue = getSignedValue(m);
  const descripcion = m.descripcion ?? "";

  return {
    id: m.id,
    documento: m.beneficiary
      ? `${m.beneficiary.tipoDocumento} ${m.beneficiary.documento}`
      : "",
    fecha: new Date(m.createdAt).toLocaleDateString("es-CO"),
    ley: m.recobroCase?.ley ?? "",
    periodo: m.recobroCase?.periodo ?? "",
    beneficiario: m.beneficiary
      ? `${m.beneficiary.nombres} ${m.beneficiary.apellidos}`
      : "Sin beneficiario",
    tipo: m.tipo,
    tipoLabel: getTipoLabel(m),
    concepto: m.concepto,
    valorSalud: m.concepto === "SALUD" ? signedValue : 0,
    valorPension: m.concepto === "PENSION" ? signedValue : 0,
    valorCuotaMonetaria: m.concepto === "CUOTA_MONETARIA" ? signedValue : 0,
    valorTransferencia:
      m.concepto === "TRANSFERENCIA_ECONOMICA" ? signedValue : 0,
    valor: signedValue,
    usuario: m.user?.fullName ?? "Sin usuario",
    medioPago: getMedioPagoFromDescription(descripcion),
    descripcion,
    fechaModificacion: new Date(m.createdAt).toLocaleString("es-CO"),
  };
}

export default function Movimientos() {
  const { toast } = useToast();

  const [movimientos, setMovimientos] = useState<MovimientoApi[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterFormState>(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<MovimientoApi[]>("/movimientos");
      setMovimientos(data);
    } catch (error) {
      toast({
        title: "Error cargando movimientos",
        description:
          error instanceof Error
            ? error.message
            : "No fue posible consultar los movimientos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const movimientosRows = useMemo(
    () => movimientos.map(mapMovimientoToRow),
    [movimientos]
  );

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return movimientosRows
      .filter((m) => {
        const matchesMedioPago =
          filters.medioPago.trim() === "" ||
          m.medioPago
            .toLowerCase()
            .includes(filters.medioPago.trim().toLowerCase());

        const matchesSearch =
          searchText === "" ||
          m.beneficiario.toLowerCase().includes(searchText) ||
          m.documento.toLowerCase().includes(searchText) ||
          m.descripcion.toLowerCase().includes(searchText);

        const matchesId =
          filters.id.trim() === "" ||
          m.documento.toLowerCase().includes(filters.id.trim().toLowerCase());

        const matchesFecha =
          filters.fecha.trim() === "" ||
          m.fecha.toLowerCase().includes(filters.fecha.trim().toLowerCase()) ||
          m.fechaModificacion
            .toLowerCase()
            .includes(filters.fecha.trim().toLowerCase());

        const matchesLey = filters.ley === "all" || m.ley === filters.ley;

        const matchesPeriodo =
          filters.periodo.trim() === "" ||
          m.periodo.toLowerCase().includes(filters.periodo.trim().toLowerCase());

        const matchesBeneficiario =
          filters.beneficiario.trim() === "" ||
          m.beneficiario
            .toLowerCase()
            .includes(filters.beneficiario.trim().toLowerCase());

        const matchesTipo =
          filters.tipo === "all" ||
          m.tipo === filters.tipo ||
          m.tipoLabel.toLowerCase().includes(filters.tipo.toLowerCase());

        const matchesUsuario =
          filters.usuario.trim() === "" ||
          m.usuario.toLowerCase().includes(filters.usuario.trim().toLowerCase());

        return (
          matchesSearch &&
          matchesId &&
          matchesFecha &&
          matchesLey &&
          matchesPeriodo &&
          matchesBeneficiario &&
          matchesTipo &&
          matchesUsuario &&
          matchesMedioPago
        );
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fechaModificacion).getTime();
        const fechaB = new Date(b.fechaModificacion).getTime();
        return fechaA - fechaB;
      });
  }, [movimientosRows, search, filters]);

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
      filters.id !== "" ||
      filters.fecha !== "" ||
      filters.ley !== "all" ||
      filters.periodo !== "" ||
      filters.beneficiario !== "" ||
      filters.tipo !== "all" ||
      filters.usuario !== "" ||
      filters.medioPago !== ""
    );
  }, [filters]);

  const updateFilterField = (field: keyof FilterFormState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleExportarMovimientos = async () => {
    try {
      const response = await fetch(
        "/templates/plantilla-exportacion-movimientos.xlsx"
      );

      if (!response.ok) {
        throw new Error(
          "No se encontró la plantilla en /public/templates/plantilla-exportacion-movimientos.xlsx"
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];

      const movimientosOrdenados = [...filtered].sort((a, b) => {
        const fechaA = new Date(a.fechaModificacion).getTime();
        const fechaB = new Date(b.fechaModificacion).getTime();
        return fechaA - fechaB;
      });

      const dataRows = movimientosOrdenados.map((m) => {
        const ley = LEYES.find((l) => l.id === m.ley);

        return {
          documento: m.documento,
          fecha: m.fecha,
          ley: ley?.nombre || m.ley,
          periodo: m.periodo,
          beneficiario: m.beneficiario,
          tipo: m.tipoLabel,
          salud: m.valorSalud,
          pension: m.valorPension,
          cuotaMonetaria: m.valorCuotaMonetaria,
          transferenciaEconomica: m.valorTransferencia,
          total:
            Math.abs(m.valorSalud) +
            Math.abs(m.valorPension) +
            Math.abs(m.valorCuotaMonetaria) +
            Math.abs(m.valorTransferencia),
          usuario: m.usuario,
          medioPago: m.medioPago,
          descripcion: m.descripcion,
        };
      });

      const saldoSalud = dataRows.reduce((acc, row) => acc + row.salud, 0);
      const saldoPension = dataRows.reduce((acc, row) => acc + row.pension, 0);
      const saldoCuotaMonetaria = dataRows.reduce(
        (acc, row) => acc + row.cuotaMonetaria,
        0
      );
      const saldoTransferencia = dataRows.reduce(
        (acc, row) => acc + row.transferenciaEconomica,
        0
      );
      const saldoTotal =
        saldoSalud + saldoPension + saldoCuotaMonetaria + saldoTransferencia;

      const startRow = 8;
      const endTemplateRow = 300;

      if (dataRows.length > endTemplateRow - startRow + 1) {
        throw new Error(
          `La plantilla solo soporta ${endTemplateRow - startRow + 1} registros.`
        );
      }

      for (let rowNumber = startRow; rowNumber <= endTemplateRow; rowNumber++) {
        for (let colNumber = 1; colNumber <= 13; colNumber++) {
          const cell = worksheet.getCell(rowNumber, colNumber);
          cell.value = null;
        }
      }

      const setAccountingCell = (cellRef: string, value: number) => {
        const cell = worksheet.getCell(cellRef);
        cell.value = value === 0 ? "-" : value;

        if (value !== 0) {
          cell.numFmt = "$ #,##0.00;[Red]-$ #,##0.00";
        }
      };

      setAccountingCell("G5", saldoSalud);
      setAccountingCell("H5", saldoPension);
      setAccountingCell("I5", saldoCuotaMonetaria);
      setAccountingCell("J5", saldoTransferencia);

      const cellK5 = worksheet.getCell("K5");
      cellK5.value = saldoTotal;
      cellK5.numFmt = "$ #,##0.00;[Red]-$ #,##0.00";

      dataRows.forEach((row, index) => {
        const rowNumber = startRow + index;

        worksheet.getCell(`A${rowNumber}`).value = row.documento;
        worksheet.getCell(`B${rowNumber}`).value = row.fecha;
        worksheet.getCell(`C${rowNumber}`).value = row.ley;
        worksheet.getCell(`D${rowNumber}`).value = row.periodo;
        worksheet.getCell(`E${rowNumber}`).value = row.beneficiario;
        worksheet.getCell(`F${rowNumber}`).value = row.tipo;

        const g = worksheet.getCell(`G${rowNumber}`);
        const h = worksheet.getCell(`H${rowNumber}`);
        const i = worksheet.getCell(`I${rowNumber}`);
        const j = worksheet.getCell(`J${rowNumber}`);
        const k = worksheet.getCell(`K${rowNumber}`);

        g.value = row.salud === 0 ? "-" : row.salud;
        h.value = row.pension === 0 ? "-" : row.pension;
        i.value = row.cuotaMonetaria === 0 ? "-" : row.cuotaMonetaria;
        j.value =
          row.transferenciaEconomica === 0 ? "-" : row.transferenciaEconomica;
        k.value = row.total === 0 ? "-" : row.total;

        [g, h, i, j, k].forEach((cell) => {
          if (typeof cell.value === "number") {
            cell.numFmt = "$ #,##0.00;[Red]-$ #,##0.00";
          }
        });

        worksheet.getCell(`L${rowNumber}`).value = row.usuario;
        worksheet.getCell(`M${rowNumber}`).value = row.descripcion;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fechaExportacion = new Date().toISOString().slice(0, 10);

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `movimientos_plantilla_${dataRows.length}_registros_${fechaExportacion}.xlsx`
      );
    } catch (error) {
      console.error("Error exportando plantilla:", error);
      toast({
        title: "Error exportando movimientos",
        description:
          error instanceof Error
            ? error.message
            : "No fue posible exportar la información.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando movimientos...
      </div>
    );
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarMovimientos}
          >
            <Download className="w-4 h-4 mr-1.5" /> Exportar Movimiento
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por beneficiario, documento o descripción..."
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
                Documento
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
                Cuota Monetaria
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transferencia Económica
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Medio de pago
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fecha modificación
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((m, i) => {
              const tipo = tipoStyles[m.tipo];
              const ley = LEYES.find((l) => l.id === m.ley);
              const totalFila =
                Math.abs(m.valorSalud) +
                Math.abs(m.valorPension) +
                Math.abs(m.valorCuotaMonetaria) +
                Math.abs(m.valorTransferencia);

              return (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3 font-mono text-xs font-medium">
                    {m.documento || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.fecha}
                  </td>
                  <td className="p-3 text-xs">{ley?.nombre || m.ley}</td>
                  <td className="p-3 font-mono text-xs">{m.periodo}</td>
                  <td className="p-3 font-medium">{m.beneficiario}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tipo?.color}`}
                    >
                      {m.tipoLabel}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorSalud !== 0 ? formatCurrency(m.valorSalud) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorPension !== 0 ? formatCurrency(m.valorPension) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorCuotaMonetaria !== 0
                      ? formatCurrency(m.valorCuotaMonetaria)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {m.valorTransferencia !== 0
                      ? formatCurrency(m.valorTransferencia)
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {formatCurrency(totalFila)}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.usuario}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.medioPago || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.fechaModificacion}
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
            <DialogTitle>Filtros de Movimientos</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Documento
              </label>
              <Input
                placeholder="Ej: 1023456789"
                value={filters.id}
                onChange={(e) => updateFilterField("id", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Fecha
              </label>
              <Input
                placeholder="Ej: 2026-06-23"
                value={filters.fecha}
                onChange={(e) => updateFilterField("fecha", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Medio de pago
              </label>
              <Input
                placeholder="Ej: Nequi"
                value={filters.medioPago}
                onChange={(e) => updateFilterField("medioPago", e.target.value)}
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
                placeholder="Ej: 2026-05"
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
                Tipo
              </label>
              <Select
                value={filters.tipo}
                onValueChange={(value) => updateFilterField("tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SALDO_INICIAL">Saldo Inicial</SelectItem>
                  <SelectItem value="INCREMENTO">Incremento</SelectItem>
                  <SelectItem value="REINTEGRO">Pago</SelectItem>
                  <SelectItem value="NO_PROCEDE">No Procede</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block">
                Usuario
              </label>
              <Input
                placeholder="Nombre del usuario"
                value={filters.usuario}
                onChange={(e) => updateFilterField("usuario", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}