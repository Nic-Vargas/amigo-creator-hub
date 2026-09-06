import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, Loader2, } from "lucide-react";
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

type MovementType =
  | "SALDO_INICIAL"
  | "INCREMENTO"
  | "REINTEGRO"
  | "NO_PROCEDE"
  | "AJUSTE";

type MovementConcept =
  | "SALUD"
  | "PENSION"
  | "CUOTA_MONETARIA"
  | "TRANSFERENCIA_ECONOMICA"
  | "BONO_ALIMENTACION"
  | "BENEFICIOS_ECONOMICOS_488";

type AdjustmentDirection = "SUMA" | "RESTA";

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

type MovimientoDetailApi = {
  id: string;
  movementId: string;
  tipo: MovementType;
  concepto: MovementConcept;
  adjustmentDirection?: AdjustmentDirection | null;
  valor: string;
  saldoAnteriorConcepto: string;
  saldoNuevoConcepto: string;
  createdAt: string;
};

type MovimientoApi = {
  id: string;
  recobroCaseId: string;
  beneficiaryId: string;
  userId: string;
  descripcion: string | null;
  caseTotalAnterior: string;
  caseTotalNuevo: string;
  beneficiaryTotalAnterior: string;
  beneficiaryTotalNuevo: string;
  createdAt: string;
  details: MovimientoDetailApi[];
  beneficiary?: BeneficiaryApi;
  recobroCase?: RecobroCaseApi;
  user?: UserApi;
};

type MovimientoRow = {
  id: string;
  documento: string;
  fecha: string;
  fechaIso: string;
  ley: string;
  periodo: string;
  beneficiario: string;
  tipos: MovementType[];
  tipoLabel: string;
  tipoPrincipal: MovementType;
  valorSalud: number;
  valorPension: number;
  valorCuotaMonetaria: number;
  valorTransferencia: number;
  valorBonoAlimentacion: number;
  valorBeneficiosEconomicos488: number;
  valorTotal: number;
  usuario: string;
  medioPago: string;
  descripcion: string;
  fechaModificacion: string;
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

const tipoStyles: Record<
  MovementType,
  {
    label: string;
    color: string;
  }
> = {
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

function getMedioPagoFromDescription(description: string) {
  const match = description.match(/Medio:\s*([^|]+)/i);
  return match?.[1]?.trim() ?? "";
}

function getSignedDetailValue(detail: MovimientoDetailApi) {
  const value = Math.abs(Number(detail.valor));

  if (detail.tipo === "REINTEGRO") {
    return -value;
  }

  if (detail.tipo === "NO_PROCEDE") {
    return -value;
  }

  if (
    detail.tipo === "AJUSTE" &&
    detail.adjustmentDirection === "RESTA"
  ) {
    return -value;
  }

  return value;
}

function getDetailValueByConcept(
  details: MovimientoDetailApi[],
  concept: MovementConcept
) {
  return details
    .filter((detail) => detail.concepto === concept)
    .reduce((total, detail) => total + getSignedDetailValue(detail), 0);
}

function getUniqueTypes(details: MovimientoDetailApi[]) {
  return Array.from(new Set(details.map((detail) => detail.tipo)));
}

function getTipoPrincipal(details: MovimientoDetailApi[]): MovementType {
  return details[0]?.tipo ?? "AJUSTE";
}

function getTipoLabel(details: MovimientoDetailApi[]) {
  if (!details.length) {
    return "Sin tipo";
  }

  const labels = details.map((detail) => {
    if (
      detail.tipo === "AJUSTE" &&
      detail.adjustmentDirection
    ) {
      return `Ajuste ${
        detail.adjustmentDirection === "SUMA" ? "Suma" : "Resta"
      }`;
    }

    return tipoStyles[detail.tipo]?.label ?? detail.tipo;
  });

  return Array.from(new Set(labels)).join(", ");
}

function mapMovimientoToRow(movement: MovimientoApi): MovimientoRow {
  const details = movement.details ?? [];
  const descripcion = movement.descripcion ?? "";

  const valorSalud = getDetailValueByConcept(details, "SALUD");

  const valorPension = getDetailValueByConcept(
    details,
    "PENSION"
  );

  const valorCuotaMonetaria = getDetailValueByConcept(
    details,
    "CUOTA_MONETARIA"
  );

  const valorTransferencia = getDetailValueByConcept(
    details,
    "TRANSFERENCIA_ECONOMICA"
  );

    const valorBonoAlimentacion = getDetailValueByConcept(
    details,
    "BONO_ALIMENTACION"
  );

  const valorBeneficiosEconomicos488 = getDetailValueByConcept(
    details,
    "BENEFICIOS_ECONOMICOS_488"
  );

  const valorTotal =
    valorSalud +
    valorPension +
    valorCuotaMonetaria +
    valorTransferencia +
    valorBonoAlimentacion +
    valorBeneficiosEconomicos488;

  return {
    id: movement.id,

    documento: movement.beneficiary
      ? `${movement.beneficiary.tipoDocumento} ${movement.beneficiary.documento}`
      : "",

    fecha: new Date(movement.createdAt).toLocaleDateString(
      "es-CO"
    ),

    fechaIso: movement.createdAt,

    ley: movement.recobroCase?.ley ?? "",

    periodo: movement.recobroCase?.periodo ?? "",

    beneficiario: movement.beneficiary
      ? `${movement.beneficiary.nombres} ${movement.beneficiary.apellidos}`.trim()
      : "Sin beneficiario",

    tipos: getUniqueTypes(details),

    tipoLabel: getTipoLabel(details),

    tipoPrincipal: getTipoPrincipal(details),

    valorSalud,

    valorPension,

    valorCuotaMonetaria,

    valorTransferencia,

    valorBonoAlimentacion,

    valorBeneficiosEconomicos488,

    valorTotal,

    usuario: movement.user?.fullName ?? "Sin usuario",

    medioPago: getMedioPagoFromDescription(descripcion),

    descripcion,

    fechaModificacion: new Date(
      movement.createdAt
    ).toLocaleString("es-CO"),
  };
}

export default function Movimientos() {
  const { toast } = useToast();

  const [movimientos, setMovimientos] = useState<
    MovimientoApi[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filterDialogOpen, setFilterDialogOpen] =
    useState(false);

  const [filters, setFilters] =
    useState<FilterFormState>(initialFilters);

  const [pageSize, setPageSize] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const [isExporting, setIsExporting] = useState(false);

  const [exportProgress, setExportProgress] = useState(0);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<MovimientoApi[]>(
        "/movimientos"
      );

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
      .filter((movement) => {
        const matchesSearch =
          searchText === "" ||
          movement.beneficiario
            .toLowerCase()
            .includes(searchText) ||
          movement.documento
            .toLowerCase()
            .includes(searchText) ||
          movement.descripcion
            .toLowerCase()
            .includes(searchText);

        const matchesId =
          filters.id.trim() === "" ||
          movement.documento
            .toLowerCase()
            .includes(filters.id.trim().toLowerCase());

        const matchesFecha =
          filters.fecha.trim() === "" ||
          movement.fecha
            .toLowerCase()
            .includes(filters.fecha.trim().toLowerCase()) ||
          movement.fechaModificacion
            .toLowerCase()
            .includes(filters.fecha.trim().toLowerCase());

        const matchesLey =
          filters.ley === "all" ||
          movement.ley === filters.ley;

        const matchesPeriodo =
          filters.periodo.trim() === "" ||
          movement.periodo
            .toLowerCase()
            .includes(filters.periodo.trim().toLowerCase());

        const matchesBeneficiario =
          filters.beneficiario.trim() === "" ||
          movement.beneficiario
            .toLowerCase()
            .includes(
              filters.beneficiario.trim().toLowerCase()
            );

        const matchesTipo =
          filters.tipo === "all" ||
          movement.tipos.includes(
            filters.tipo as MovementType
          ) ||
          movement.tipoLabel
            .toLowerCase()
            .includes(filters.tipo.toLowerCase());

        const matchesUsuario =
          filters.usuario.trim() === "" ||
          movement.usuario
            .toLowerCase()
            .includes(filters.usuario.trim().toLowerCase());

        const matchesMedioPago =
          filters.medioPago.trim() === "" ||
          movement.medioPago
            .toLowerCase()
            .includes(
              filters.medioPago.trim().toLowerCase()
            );

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
      .sort(
        (a, b) =>
          new Date(a.fechaIso).getTime() -
          new Date(b.fechaIso).getTime()
      );
  }, [movimientosRows, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

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

  const updateFilterField = (
    field: keyof FilterFormState,
    value: string
  ) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleExportarMovimientos = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(5);

    let progressInterval: ReturnType<typeof setInterval> | undefined;

    try {
      progressInterval = setInterval(() => {
        setExportProgress((currentProgress) => {
          if (currentProgress >= 90) {
            return currentProgress;
          }

          return Math.min(currentProgress + 5, 90);
        });
      }, 250);

      const response = await fetch(
        "/templates/plantilla-exportacion-movimientos.xlsx"
      );

      setExportProgress(15);

      if (!response.ok) {
        throw new Error(
          "No se encontró la plantilla en /public/templates/plantilla-exportacion-movimientos.xlsx"
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      setExportProgress(25);

      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(arrayBuffer);

      setExportProgress(35);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error(
          "La plantilla no contiene una hoja de trabajo."
        );
      }

      const movimientosOrdenados = [...filtered].sort(
        (a, b) =>
          new Date(a.fechaIso).getTime() -
          new Date(b.fechaIso).getTime()
      );

      const dataRows = movimientosOrdenados.map(
        (movement) => {
          const ley = LEYES.find(
            (item) => item.id === movement.ley
          );

          return {
            documento: movement.documento,
            fecha: movement.fecha,
            ley: ley?.nombre || movement.ley,
            periodo: movement.periodo,
            beneficiario: movement.beneficiario,
            tipo: movement.tipoLabel,
            salud: movement.valorSalud,
            pension: movement.valorPension,
            cuotaMonetaria:
              movement.valorCuotaMonetaria,
            transferenciaEconomica:
              movement.valorTransferencia,
            bonoAlimentacion:
              movement.valorBonoAlimentacion,
            beneficiosEconomicos488:
              movement.valorBeneficiosEconomicos488,
            total: movement.valorTotal,
            usuario: movement.usuario,
            medioPago: movement.medioPago,
          };
        }
      );

      setExportProgress(45);

      const saldoSalud = dataRows.reduce(
        (total, row) => total + row.salud,
        0
      );

      const saldoPension = dataRows.reduce(
        (total, row) => total + row.pension,
        0
      );

      const saldoCuotaMonetaria = dataRows.reduce(
        (total, row) => total + row.cuotaMonetaria,
        0
      );

      const saldoTransferencia = dataRows.reduce(
        (total, row) =>
          total + row.transferenciaEconomica,
        0
      );

      const saldoBonoAlimentacion = dataRows.reduce(
        (total, row) =>
          total + row.bonoAlimentacion,
        0
      );

      const saldoBeneficiosEconomicos488 = dataRows.reduce(
        (total, row) =>
          total + row.beneficiosEconomicos488,
        0
      );

      const saldoTotal =
        saldoSalud +
        saldoPension +
        saldoCuotaMonetaria +
        saldoTransferencia +
        saldoBonoAlimentacion +
        saldoBeneficiosEconomicos488;

      const startRow = 8;
      const endTemplateRow = 300;

      const maximumRows =
        endTemplateRow - startRow + 1;

      if (dataRows.length > maximumRows) {
        throw new Error(
          `La plantilla solo soporta ${maximumRows} registros.`
        );
      }

      setExportProgress(55);

      for (
        let rowNumber = startRow;
        rowNumber <= endTemplateRow;
        rowNumber++
      ) {
        for (
          let columnNumber = 1;
          columnNumber <= 14;
          columnNumber++
        ) {
          worksheet.getCell(
            rowNumber,
            columnNumber
          ).value = null;
        }
      }

      const setAccountingCell = (
        cellReference: string,
        value: number
      ) => {
        const cell = worksheet.getCell(cellReference);

        cell.value = value === 0 ? "-" : value;

        if (value !== 0) {
          cell.numFmt =
            "$ #,##0.00;[Red]-$ #,##0.00";
        }
      };

      setAccountingCell("G5", saldoSalud);
      setAccountingCell("H5", saldoPension);
      setAccountingCell("I5", saldoCuotaMonetaria);
      setAccountingCell("J5", saldoTransferencia);
      setAccountingCell("K5", saldoBonoAlimentacion);
      setAccountingCell("L5", saldoBeneficiosEconomicos488);
      setAccountingCell("M5", saldoTotal);

      setExportProgress(65);

      dataRows.forEach((row, index) => {
        const rowNumber = startRow + index;

        worksheet.getCell(`A${rowNumber}`).value =
          row.documento;

        worksheet.getCell(`B${rowNumber}`).value =
          row.fecha;

        worksheet.getCell(`C${rowNumber}`).value =
          row.ley;

        worksheet.getCell(`D${rowNumber}`).value =
          row.periodo;

        worksheet.getCell(`E${rowNumber}`).value =
          row.beneficiario;

        worksheet.getCell(`F${rowNumber}`).value =
          row.tipo;

        const healthCell =
          worksheet.getCell(`G${rowNumber}`);

        const pensionCell =
          worksheet.getCell(`H${rowNumber}`);

        const monetaryQuotaCell =
          worksheet.getCell(`I${rowNumber}`);

        const transferCell =
          worksheet.getCell(`J${rowNumber}`);

        const foodBonusCell =
          worksheet.getCell(`K${rowNumber}`);

        const economicBenefitsCell =
          worksheet.getCell(`L${rowNumber}`);

        const totalCell =
          worksheet.getCell(`M${rowNumber}`);

        healthCell.value =
          row.salud === 0 ? "-" : row.salud;

        pensionCell.value =
          row.pension === 0 ? "-" : row.pension;

        monetaryQuotaCell.value =
          row.cuotaMonetaria === 0
            ? "-"
            : row.cuotaMonetaria;

        transferCell.value =
          row.transferenciaEconomica === 0
            ? "-"
            : row.transferenciaEconomica;

        foodBonusCell.value =
          row.bonoAlimentacion === 0
            ? "-"
            : row.bonoAlimentacion;

        economicBenefitsCell.value =
          row.beneficiosEconomicos488 === 0
            ? "-"
            : row.beneficiosEconomicos488;

        totalCell.value =
          row.total === 0 ? "-" : row.total;

        [
          healthCell,
          pensionCell,
          monetaryQuotaCell,
          transferCell,
          foodBonusCell,
          economicBenefitsCell,
          totalCell,
        ].forEach((cell) => {
          if (typeof cell.value === "number") {
            cell.numFmt =
              "$ #,##0.00;[Red]-$ #,##0.00";
          }
        });

        worksheet.getCell(`N${rowNumber}`).value =
          row.usuario;
      });

      setExportProgress(80);

      const buffer = await workbook.xlsx.writeBuffer();

      setExportProgress(95);

      const fechaExportacion = new Date()
        .toISOString()
        .slice(0, 10);

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),

        `movimientos_plantilla_${dataRows.length}_registros_${fechaExportacion}.xlsx`
      );

      setExportProgress(100);

      toast({
        title: "Exportación completada",
        description: `Se exportaron ${dataRows.length} movimientos correctamente.`,
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );
    } catch (error) {
      console.error(
        "Error exportando movimientos:",
        error
      );

      toast({
        title: "Error exportando movimientos",

        description:
          error instanceof Error
            ? error.message
            : "No fue posible exportar la información.",

        variant: "destructive",
      });
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 300);
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Movimientos
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Registro de saldos iniciales, incrementos,
              reintegros y ajustes
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarMovimientos}
            disabled={isExporting || filtered.length === 0}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}

            {isExporting
              ? "Exportando..."
              : "Exportar Movimientos"}
          </Button>
        </div>

        {isExporting && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />

                <span className="text-sm font-medium text-foreground">
                  Generando archivo de movimientos...
                </span>
              </div>

              <span className="text-sm font-semibold text-primary">
                {exportProgress}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{
                  width: `${exportProgress}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              No cierres esta ventana mientras se prepara el archivo.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <Input
            placeholder="Buscar por beneficiario, documento o descripción..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setFilterDialogOpen(true)
          }
          className={
            hasActiveFilters
              ? "border-primary text-primary"
              : ""
          }
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
                Bono Alimentación
              </th>

              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Beneficios
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
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={16}
                  className="p-8 text-center text-sm text-muted-foreground"
                >
                  No se encontraron movimientos.
                </td>
              </tr>
            ) : (
              paginatedData.map((movement, index) => {
                const tipoStyle =
                  tipoStyles[movement.tipoPrincipal];

                const ley = LEYES.find(
                  (item) => item.id === movement.ley
                );

                return (
                  <tr
                    key={movement.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    <td className="p-3 font-mono text-xs font-medium">
                      {movement.documento || "—"}
                    </td>

                    <td className="p-3 text-muted-foreground text-xs">
                      {movement.fecha}
                    </td>

                    <td className="p-3 text-xs">
                      {ley?.nombre || movement.ley}
                    </td>

                    <td className="p-3 font-mono text-xs">
                      {movement.periodo}
                    </td>

                    <td className="p-3 font-medium">
                      {movement.beneficiario}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tipoStyle?.color ?? ""
                        }`}
                      >
                        {movement.tipoLabel}
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono text-xs">
                      {movement.valorSalud !== 0
                        ? formatCurrency(
                            movement.valorSalud
                          )
                        : "—"}
                    </td>

                    <td className="p-3 text-right font-mono text-xs">
                      {movement.valorPension !== 0
                        ? formatCurrency(
                            movement.valorPension
                          )
                        : "—"}
                    </td>

                    <td className="p-3 text-right font-mono text-xs">
                      {movement.valorCuotaMonetaria !== 0
                        ? formatCurrency(
                            movement.valorCuotaMonetaria
                          )
                        : "—"}
                    </td>

                    <td className="p-3 text-right font-mono text-xs">
                      {movement.valorTransferencia !== 0
                        ? formatCurrency(
                            movement.valorTransferencia
                          )
                        : "—"}
                    </td>

                    <td className="p-3 text-right font-mono text-xs">
                      {movement.valorBonoAlimentacion !== 0
                        ? formatCurrency(
                            movement.valorBonoAlimentacion
                          )
                        : "—"}
                    </td>

                    <td className="p-3 text-right font-mono text-xs">
                      {movement.valorBeneficiosEconomicos488 !== 0
                        ? formatCurrency(
                            movement.valorBeneficiosEconomicos488
                          )
                        : "—"}
                    </td>

                    <td className="p-3 text-right font-mono font-semibold">
                      {formatCurrency(
                        movement.valorTotal
                      )}
                    </td>

                    <td className="p-3 text-muted-foreground text-xs">
                      {movement.usuario}
                    </td>

                    <td className="p-3 text-muted-foreground text-xs">
                      {movement.medioPago || "—"}
                    </td>

                    <td className="p-3 text-muted-foreground text-xs">
                      {movement.fechaModificacion}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {filtered.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          a{" "}
          <span className="font-medium text-foreground">
            {Math.min(
              currentPage * pageSize,
              filtered.length
            )}
          </span>{" "}
          de{" "}
          <span className="font-medium text-foreground">
            {filtered.length}
          </span>{" "}
          registros
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrar
            </span>

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
              onClick={() =>
                setCurrentPage((previous) =>
                  Math.max(previous - 1, 1)
                )
              }
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
                setCurrentPage((previous) =>
                  Math.min(
                    previous + 1,
                    totalPages
                  )
                )
              }
              disabled={
                currentPage === totalPages
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Filtros de Movimientos
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Documento
              </label>

              <Input
                placeholder="Ej: 1023456789"
                value={filters.id}
                onChange={(event) =>
                  updateFilterField(
                    "id",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Fecha
              </label>

              <Input
                placeholder="Ej: 2026-07-14"
                value={filters.fecha}
                onChange={(event) =>
                  updateFilterField(
                    "fecha",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Medio de pago
              </label>

              <Input
                placeholder="Ej: Nequi"
                value={filters.medioPago}
                onChange={(event) =>
                  updateFilterField(
                    "medioPago",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Ley
              </label>

              <Select
                value={filters.ley}
                onValueChange={(value) =>
                  updateFilterField("ley", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione ley" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Todas
                  </SelectItem>

                  {LEYES.map((ley) => (
                    <SelectItem
                      key={ley.id}
                      value={ley.id}
                    >
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
                onChange={(event) =>
                  updateFilterField(
                    "periodo",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Beneficiario
              </label>

              <Input
                placeholder="Nombre del beneficiario"
                value={filters.beneficiario}
                onChange={(event) =>
                  updateFilterField(
                    "beneficiario",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Tipo
              </label>

              <Select
                value={filters.tipo}
                onValueChange={(value) =>
                  updateFilterField("tipo", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Todos
                  </SelectItem>

                  <SelectItem value="SALDO_INICIAL">
                    Saldo Inicial
                  </SelectItem>

                  <SelectItem value="INCREMENTO">
                    Incremento
                  </SelectItem>

                  <SelectItem value="REINTEGRO">
                    Pago
                  </SelectItem>

                  <SelectItem value="NO_PROCEDE">
                    No Procede
                  </SelectItem>

                  <SelectItem value="AJUSTE">
                    Ajuste
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Usuario
              </label>

              <Input
                placeholder="Nombre del usuario"
                value={filters.usuario}
                onChange={(event) =>
                  updateFilterField(
                    "usuario",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={handleClearFilters}
            >
              Limpiar filtros
            </Button>

            <Button
              onClick={() =>
                setFilterDialogOpen(false)
              }
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}