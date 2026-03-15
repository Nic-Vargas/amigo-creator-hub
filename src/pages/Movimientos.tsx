import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";
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
  const { movimientos } = useAppData();

  const [search, setSearch] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterFormState>(initialFilters);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return movimientos.filter((m) => {
      const tipo = tipoStyles[m.tipo];
      const tipoLabel = m.tipoDetalle || tipo.label;

      const matchesSearch =
        searchText === "" ||
        m.beneficiarioNombre.toLowerCase().includes(searchText) ||
        m.id.toLowerCase().includes(searchText) ||
        m.descripcion.toLowerCase().includes(searchText);

      const matchesId =
        filters.id.trim() === "" ||
        m.id.toLowerCase().includes(filters.id.trim().toLowerCase());

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
    });
  }, [movimientos, search, filters]);

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

  const handleExportarMovimientos = () => {
    const dataToExport = filtered.map((m) => {
      const tipo = tipoStyles[m.tipo];
      const tipoLabel = m.tipoDetalle || tipo.label;
      const ley = LEYES.find((l) => l.id === m.ley);

      return {
        ID: m.id,
        Fecha: m.fecha,
        Ley: ley?.nombre || m.ley,
        Periodo: m.periodo,
        Beneficiario: m.beneficiarioNombre,
        Tipo: tipoLabel,
        Salud: m.valorSalud,
        Pension: m.valorPension,
        CuotaMonetaria: m.valorCuotaMonetaria,
        TransferenciaEconomica: m.valorTransferencia,
        Total: m.valor,
        Usuario: m.usuario,
        Descripcion: m.descripcion,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 28 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
      { wch: 14 },
      { wch: 18 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");

    const fechaExportacion = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `movimientos_${filtered.length}_registros_${fechaExportacion}.xlsx`
    );
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
                ID
              </label>
              <Input
                placeholder="Ej: M001"
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
                  <SelectItem value="Reintegro - Pago">
                    Reintegro - Pago
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