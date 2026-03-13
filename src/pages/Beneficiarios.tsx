import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";
import { beneficiarios } from "@/lib/mock-data";
import { useAppData } from "@/context/AppDataContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const estadoStyles: Record<string, string> = {
  activo: "bg-accent/15 text-accent border-accent/30",
  bloqueado: "bg-destructive/15 text-destructive border-destructive/30",
  inactivo: "bg-muted text-muted-foreground border-border",
};

type FilterFormState = {
  documento: string;
  nombre: string;
  ciudad: string;
  estado: string;
};

const initialFilters: FilterFormState = {
  documento: "",
  nombre: "",
  ciudad: "",
  estado: "all",
};

export default function Beneficiarios() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterFormState>(initialFilters);

  const { casos } = useAppData();

  const getBeneficiarioSaldos = (beneficiarioId: string) => {
    const casosBeneficiario = casos.filter(
      (c) => c.beneficiarioId === beneficiarioId
    );

    const valorSalud = casosBeneficiario.reduce(
      (acc, c) => acc + c.valorSalud,
      0
    );
    const valorPension = casosBeneficiario.reduce(
      (acc, c) => acc + c.valorPension,
      0
    );
    const valorCuotaMonetaria = casosBeneficiario.reduce(
      (acc, c) => acc + c.valorCuotaMonetaria,
      0
    );
    const valorTransferencia = casosBeneficiario.reduce(
      (acc, c) => acc + c.valorTransferencia,
      0
    );

    const saldoTotal =
      valorSalud +
      valorPension +
      valorCuotaMonetaria +
      valorTransferencia;

    return {
      valorSalud,
      valorPension,
      valorCuotaMonetaria,
      valorTransferencia,
      saldoTotal,
    };
  };

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return beneficiarios.filter((b) => {
      const nombreCompleto = `${b.nombres} ${b.apellidos}`.toLowerCase();

      const matchesSearch =
        searchText === "" ||
        b.nombres.toLowerCase().includes(searchText) ||
        b.apellidos.toLowerCase().includes(searchText) ||
        b.documento.includes(searchText);

      const matchesDocumento =
        filters.documento.trim() === "" ||
        b.documento.includes(filters.documento.trim());

      const matchesNombre =
        filters.nombre.trim() === "" ||
        nombreCompleto.includes(filters.nombre.trim().toLowerCase());

      const matchesCiudad =
        filters.ciudad.trim() === "" ||
        b.ciudad.toLowerCase().includes(filters.ciudad.trim().toLowerCase());

      const matchesEstado =
        filters.estado === "all" || b.estado === filters.estado;

      return (
        matchesSearch &&
        matchesDocumento &&
        matchesNombre &&
        matchesCiudad &&
        matchesEstado
      );
    });
  }, [search, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.documento !== "" ||
      filters.nombre !== "" ||
      filters.ciudad !== "" ||
      filters.estado !== "all"
    );
  }, [filters]);

  const selected = useMemo(
    () => beneficiarios.find((b) => b.id === selectedId),
    [selectedId]
  );

  const selectedSaldos = selected ? getBeneficiarioSaldos(selected.id) : null;

  const updateFilterField = (field: keyof FilterFormState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beneficiarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de beneficiarios registrados
          </p>
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
                Nombre
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ciudad
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Teléfono
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Saldo Total
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => {
              const saldos = getBeneficiarioSaldos(b.id);

              return (
                <tr
                  key={b.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3">
                    <span className="font-mono text-xs">
                      {b.tipoDoc} {b.documento}
                    </span>
                  </td>
                  <td className="p-3 font-medium">
                    {b.nombres} {b.apellidos}
                  </td>
                  <td className="p-3 text-muted-foreground">{b.ciudad}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {b.celular}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {formatCurrency(saldos.saldoTotal)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${estadoStyles[b.estado]}`}
                    >
                      {b.estado}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedId(b.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Estado de Cuenta</DialogTitle>
                        </DialogHeader>

                        {selected && selectedSaldos && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                                {selected.nombres[0]}
                                {selected.apellidos[0]}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {selected.nombres} {selected.apellidos}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {selected.tipoDoc} {selected.documento}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {selected.direccion}, {selected.ciudad}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {selected.telefono} / {selected.celular}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span>{selected.email}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">
                                  Salud
                                </span>
                                <span className="text-sm font-mono font-semibold">
                                  {formatCurrency(selectedSaldos.valorSalud)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">
                                  Pensión
                                </span>
                                <span className="text-sm font-mono font-semibold">
                                  {formatCurrency(selectedSaldos.valorPension)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">
                                  Cuota Monetaria
                                </span>
                                <span className="text-sm font-mono font-semibold">
                                  {formatCurrency(
                                    selectedSaldos.valorCuotaMonetaria
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <span className="text-sm text-muted-foreground">
                                  Transferencia Económica
                                </span>
                                <span className="text-sm font-mono font-semibold">
                                  {formatCurrency(
                                    selectedSaldos.valorTransferencia
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-border">
                              <span className="font-semibold">Saldo Total</span>
                              <span className="font-bold font-mono text-lg">
                                {formatCurrency(selectedSaldos.saldoTotal)}
                              </span>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filtros de Beneficiarios</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Documento
              </label>
              <Input
                placeholder="Número de documento"
                value={filters.documento}
                onChange={(e) => updateFilterField("documento", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Nombre
              </label>
              <Input
                placeholder="Nombre o apellido"
                value={filters.nombre}
                onChange={(e) => updateFilterField("nombre", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Ciudad
              </label>
              <Input
                placeholder="Ciudad"
                value={filters.ciudad}
                onChange={(e) => updateFilterField("ciudad", e.target.value)}
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
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
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