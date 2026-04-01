import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter, Download } from "lucide-react";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { LEYES } from "@/lib/mock-data";
import { useAppData } from "@/context/AppDataContext";
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

type FilterFormState = {
  id: string;
  fecha: string;
  ley: string;
  periodo: string;
  beneficiario: string;
  tipo: string;
  usuario: string;
};

const initialFilters: FilterFormState = {
  id: "",
  fecha: "",
  ley: "all",
  periodo: "",
  beneficiario: "",
  tipo: "all",
  usuario: "",
};

export default function Movimientos() {
  const { movimientos, beneficiarios } = useAppData();

  const [search, setSearch] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterFormState>(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const getDocumentoBeneficiario = (beneficiarioId: string) => {
  const beneficiario = beneficiarios.find((b) => b.id === beneficiarioId);

  if (!beneficiario) return "";

  return `${beneficiario.tipoDoc} ${beneficiario.documento}`;
};

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return movimientos
      .filter((m) => {
        const tipo = tipoStyles[m.tipo];
        const tipoLabel = m.tipoDetalle || tipo.label;
        const documentoBeneficiario = getDocumentoBeneficiario(
          m.beneficiarioId
        );

        const matchesSearch =
          searchText === "" ||
          m.beneficiarioNombre.toLowerCase().includes(searchText) ||
          documentoBeneficiario.toLowerCase().includes(searchText) ||
          m.descripcion.toLowerCase().includes(searchText);

        const matchesId =
          filters.id.trim() === "" ||
          documentoBeneficiario
            .toLowerCase()
            .includes(filters.id.trim().toLowerCase());

        const matchesFecha =
          filters.fecha.trim() === "" ||
          m.fecha.toLowerCase().includes(filters.fecha.trim().toLowerCase());

        const matchesLey = filters.ley === "all" || m.ley === filters.ley;

        const matchesPeriodo =
          filters.periodo.trim() === "" ||
          m.periodo.toLowerCase().includes(filters.periodo.trim().toLowerCase());

        const matchesBeneficiario =
          filters.beneficiario.trim() === "" ||
          m.beneficiarioNombre
            .toLowerCase()
            .includes(filters.beneficiario.trim().toLowerCase());

        const matchesTipo =
          filters.tipo === "all" ||
          m.tipo === filters.tipo ||
          tipoLabel.toLowerCase().includes(filters.tipo.toLowerCase());

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
          matchesUsuario
        );
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();

        if (fechaA !== fechaB) {
          return fechaA - fechaB;
        }

        return a.id.localeCompare(b.id);
      });
  }, [movimientos, beneficiarios, search, filters]);

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
      filters.usuario !== ""
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
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();

      if (fechaA !== fechaB) return fechaA - fechaB;
      return a.id.localeCompare(b.id);
    });

    const getDocumentoBeneficiario = (beneficiarioId: string) => {
      const beneficiario = beneficiarios.find((b) => b.id === beneficiarioId);
      if (!beneficiario) return "";
      return `${beneficiario.tipoDoc} ${beneficiario.documento}`;
    };

    const esPagoMovimiento = (m: (typeof movimientosOrdenados)[number]) =>
      m.tipoDetalle === "Pago" || m.tipo === "REINTEGRO";

    const toSignedValue = (
      m: (typeof movimientosOrdenados)[number],
      valor: number
    ) => {
      if (!valor) return 0;
      return esPagoMovimiento(m) ? -Math.abs(valor) : Math.abs(valor);
    };

    const toDisplayTotal = (
      m: (typeof movimientosOrdenados)[number],
      valorSalud: number,
      valorPension: number,
      valorCuotaMonetaria: number,
      valorTransferencia: number
    ) => {
      const sumaConceptos =
        Math.abs(valorSalud) +
        Math.abs(valorPension) +
        Math.abs(valorCuotaMonetaria) +
        Math.abs(valorTransferencia);

      return sumaConceptos;
    };

    const dataRows = movimientosOrdenados.map((m) => {
      const tipo = tipoStyles[m.tipo];
      const tipoLabel = m.tipoDetalle || tipo.label;
      const ley = LEYES.find((l) => l.id === m.ley);

      const valorSalud = toSignedValue(m, m.valorSalud);
      const valorPension = toSignedValue(m, m.valorPension);
      const valorCuotaMonetaria = toSignedValue(m, m.valorCuotaMonetaria);
      const valorTransferencia = toSignedValue(m, m.valorTransferencia);

      const totalFila = toDisplayTotal(
        m,
        valorSalud,
        valorPension,
        valorCuotaMonetaria,
        valorTransferencia
      );

      return {
        documento: getDocumentoBeneficiario(m.beneficiarioId),
        fecha: m.fecha,
        ley: ley?.nombre || m.ley,
        periodo: m.periodo,
        beneficiario: m.beneficiarioNombre,
        tipo: tipoLabel,
        salud: valorSalud,
        pension: valorPension,
        cuotaMonetaria: valorCuotaMonetaria,
        transferenciaEconomica: valorTransferencia,
        total: totalFila,
        usuario: m.usuario,
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

    // Limpiar contenido anterior sin borrar estilos
    for (let rowNumber = startRow; rowNumber <= endTemplateRow; rowNumber++) {
      for (let colNumber = 1; colNumber <= 13; colNumber++) {
        const cell = worksheet.getCell(rowNumber, colNumber);
        cell.value = null;
      }
    }

    // Función para mostrar dash en cero y moneda en otros casos
    const setAccountingCell = (cellRef: string, value: number) => {
      const cell = worksheet.getCell(cellRef);
      cell.value = value === 0 ? "-" : value;
      if (value !== 0) {
        cell.numFmt = '$ #,##0.00;[Red]-$ #,##0.00';
      }
    };

    // Resumen superior
    setAccountingCell("G5", saldoSalud);
    setAccountingCell("H5", saldoPension);
    setAccountingCell("I5", saldoCuotaMonetaria);
    setAccountingCell("J5", saldoTransferencia);

    const cellK5 = worksheet.getCell("K5");
    cellK5.value = saldoTotal;
    cellK5.numFmt = '$ #,##0.00;[Red]-$ #,##0.00';

    // Escribir detalle respetando formato de la plantilla
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
        j.value = row.transferenciaEconomica === 0 ? "-" : row.transferenciaEconomica;
        k.value = row.total === 0 ? "-" : row.total;

        [g, h, i, j, k].forEach((cell) => {
          if (typeof cell.value === "number") {
            cell.numFmt = '$ #,##0.00;[Red]-$ #,##0.00';
          }
        });

        worksheet.getCell(`L${rowNumber}`).value = row.usuario;
        worksheet.getCell(`M${rowNumber}`).value = row.descripcion;
      });

      // Ajustar ancho de columnas
      worksheet.getColumn(1).width = 16;
      worksheet.getColumn(2).width = 14;
      worksheet.getColumn(3).width = 18;
      worksheet.getColumn(4).width = 12;
      worksheet.getColumn(5).width = 24;
      worksheet.getColumn(6).width = 18;
      worksheet.getColumn(7).width = 16;
      worksheet.getColumn(8).width = 16;
      worksheet.getColumn(9).width = 18;
      worksheet.getColumn(10).width = 24;
      worksheet.getColumn(11).width = 16;
      worksheet.getColumn(12).width = 16;
      worksheet.getColumn(13).width = 38;

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
  }
};

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
                Transferencia Economica
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fecha modificación
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((m, i) => {
              const tipo = tipoStyles[m.tipo];
              const tipoLabel = m.tipoDetalle || tipo.label;
              const ley = LEYES.find((l) => l.id === m.ley);

              return (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3 font-mono text-xs font-medium">
                    {getDocumentoBeneficiario(m.beneficiarioId) || "—"}
                  </td>
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
                      {tipoLabel}
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
                  <td className="p-3 text-muted-foreground text-xs">
                    {m.fechaModificacion || m.fecha}
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
                placeholder="Ej: 2024-01-15"
                value={filters.fecha}
                onChange={(e) => updateFilterField("fecha", e.target.value)}
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
                  <SelectItem value="REINTEGRO">Reintegro</SelectItem>
                  <SelectItem value="NO_PROCEDE">No Procede</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste</SelectItem>
                  <SelectItem value="Pago">
                    Pago
                  </SelectItem>
                  <SelectItem value="Normalización">
                    Normalización
                  </SelectItem>
                  <SelectItem value="No procede">No procede</SelectItem>
                  <SelectItem value="Ajuste contable">
                    Ajuste contable
                  </SelectItem>
                  <SelectItem value="No procede - Giro no efectuado">
                    No procede - Giro no efectuado
                  </SelectItem>
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
            <Button onClick={() => setFilterDialogOpen(false)}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}