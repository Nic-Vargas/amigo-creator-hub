import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
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
import * as XLSX from "xlsx";

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
type BeneficiarioApi = {
  id: string;
  tipoDocumento: string;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  celular: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  municipio: string | null;
  departamento: string | null;
  estado: string | null;
  saldoTotal: string;
  createdAt: string;
};

type RecobroApi = {
  id: string;
  beneficiaryId: string;
  valorSalud: string;
  valorPension: string;
  valorCuotaMonetaria: string;
  valorTransferenciaEconomica: string;
  valorBonoAlimentacion: string;
  valorBeneficiosEconomicos488: string;
};

export default function Beneficiarios() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterFormState>(initialFilters);
  const [newBeneficiaryDialogOpen, setNewBeneficiaryDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [nuevoBeneficiarioForm, setNuevoBeneficiarioForm] = useState({
    tipoDoc: "CC",
    documento: "",
    nombres: "",
    apellidos: "",
    email: "",
    celular: "",
    direccion: "",
    telefono: "",
    ciudad: "",
    municipio: "",
    departamento: "",
    estado: "activo",
  });

 const [beneficiarios, setBeneficiarios] = useState<BeneficiarioApi[]>([]);
const [casos, setCasos] = useState<RecobroApi[]>([]);
const [loading, setLoading] = useState(true);
  const { toast } = useToast();
    const cargarDatos = async () => {
    try {
      setLoading(true);

      const [beneficiariosData, casosData] = await Promise.all([
        apiFetch<BeneficiarioApi[]>("/beneficiaries"),
        apiFetch<RecobroApi[]>("/recobros"),
      ]);

      setBeneficiarios(beneficiariosData);
      setCasos(casosData);
    } catch (error) {
      toast({
        title: "Error cargando beneficiarios",
        description:
          error instanceof Error
            ? error.message
            : "No fue posible consultar la información.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

const getBeneficiarioSaldos = (beneficiarioId: string) => {
  const casosBeneficiario = casos.filter(
    (c) => c.beneficiaryId === beneficiarioId
  );

  const valorSalud = casosBeneficiario.reduce(
    (acc, c) => acc + Number(c.valorSalud),
    0
  );

  const valorPension = casosBeneficiario.reduce(
    (acc, c) => acc + Number(c.valorPension),
    0
  );

  const valorCuotaMonetaria = casosBeneficiario.reduce(
    (acc, c) => acc + Number(c.valorCuotaMonetaria),
    0
  );

  const valorTransferencia = casosBeneficiario.reduce(
    (acc, c) => acc + Number(c.valorTransferenciaEconomica),
    0
  );
  const valorBonoAlimentacion = casosBeneficiario.reduce(
    (acc, c) => acc + Number(c.valorBonoAlimentacion),
    0
  );

  const valorBeneficiosEconomicos488 = casosBeneficiario.reduce(
    (acc, c) => acc + Number(c.valorBeneficiosEconomicos488),
    0
  );

  return {
    valorSalud,
    valorPension,
    valorCuotaMonetaria,
    valorTransferencia,
    valorBonoAlimentacion,
    valorBeneficiosEconomicos488,
    saldoTotal:
      valorSalud +
      valorPension +
      valorCuotaMonetaria +
      valorTransferencia +
      valorBonoAlimentacion +
      valorBeneficiosEconomicos488,
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
        (b.ciudad ?? "").toLowerCase().includes(filters.ciudad.trim().toLowerCase());

      const matchesEstado =
        filters.estado === "all" || (b.estado ?? "ACTIVO").toLowerCase() === filters.estado;

      return (
        matchesSearch &&
        matchesDocumento &&
        matchesNombre &&
        matchesCiudad &&
        matchesEstado
      );
    });
  }, [beneficiarios, search, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, currentPage, pageSize]);

  const handleExportarBeneficiarios = () => {
    const dataToExport = filtered.map((b) => {
      const saldos = getBeneficiarioSaldos(b.id);

      return {
        Documento: `${b.tipoDocumento} ${b.documento}`,
        Nombres: b.nombres,
        Apellidos: b.apellidos,
        Ciudad: b.ciudad,
        Municipio: b.municipio,
        Departamento: b.departamento,
        Celular: b.celular,
        Telefono: b.telefono,
        Email: b.email,
        Direccion: b.direccion,
        Estado: b.estado,
        Salud: saldos.valorSalud,
        Pension: saldos.valorPension,
        CuotaMonetaria: saldos.valorCuotaMonetaria,
        TransferenciaEconomica: saldos.valorTransferencia,
        BonoAlimentacion: saldos.valorBonoAlimentacion,
        BeneficiosEconomicos488: saldos.valorBeneficiosEconomicos488,
        SaldoTotal: saldos.saldoTotal,
        FechaRegistro: new Date(b.createdAt).toLocaleDateString("es-CO"),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiarios");

    const fechaExportacion = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(
      workbook,
      `beneficiarios_${filtered.length}_registros_${fechaExportacion}.xlsx`
    );
  };

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
    [beneficiarios, selectedId]
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

  const updateNuevoBeneficiarioField = (
    field: keyof typeof nuevoBeneficiarioForm,
    value: string
  ) => {
    setNuevoBeneficiarioForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCrearNuevoBeneficiario = async () => {
    if (
      !nuevoBeneficiarioForm.documento.trim() ||
      !nuevoBeneficiarioForm.nombres.trim() ||
      !nuevoBeneficiarioForm.apellidos.trim()
    ) {
      toast({
        title: "Campos incompletos",
        description: "Debes ingresar al menos documento, nombres y apellidos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiFetch<BeneficiarioApi>("/beneficiaries", {
        method: "POST",
        body: JSON.stringify({
          tipoDocumento: nuevoBeneficiarioForm.tipoDoc,
          documento: nuevoBeneficiarioForm.documento,
          nombres: nuevoBeneficiarioForm.nombres,
          apellidos: nuevoBeneficiarioForm.apellidos,
          email: nuevoBeneficiarioForm.email || undefined,
          celular: nuevoBeneficiarioForm.celular || undefined,
          direccion: nuevoBeneficiarioForm.direccion || undefined,
          telefono: nuevoBeneficiarioForm.telefono || undefined,
          ciudad: nuevoBeneficiarioForm.ciudad || undefined,
          municipio: nuevoBeneficiarioForm.municipio || undefined,
          departamento: nuevoBeneficiarioForm.departamento || undefined,
        }),
      });

      toast({
        title: "Beneficiario creado",
        description: "El beneficiario fue registrado correctamente.",
      });

      setNuevoBeneficiarioForm({
        tipoDoc: "CC",
        documento: "",
        nombres: "",
        apellidos: "",
        email: "",
        celular: "",
        direccion: "",
        telefono: "",
        ciudad: "",
        municipio: "",
        departamento: "",
        estado: "activo",
      });

      setNewBeneficiaryDialogOpen(false);
      await cargarDatos();
    } catch (error) {
      toast({
        title: "No fue posible crear el beneficiario",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando beneficiarios...
      </div>
    );
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarBeneficiarios}
          >
            <Download className="w-4 h-4 mr-1.5" /> Exportar
          </Button>
          <Button
            size="sm"
            onClick={() => setNewBeneficiaryDialogOpen(true)}
          >
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
                VER DETALLE
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((b, i) => {
              const saldos = getBeneficiarioSaldos(b.id);

              return (
                <tr
                  key={b.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3">
                    <span className="font-mono text-xs">
                      {b.tipoDocumento} {b.documento}
                    </span>
                  </td>
                  <td className="p-3 font-medium">
                    {b.nombres} {b.apellidos}
                  </td>
                  <td className="p-3 text-muted-foreground">{b.ciudad ?? ""}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {b.telefono || b.celular || ""}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {formatCurrency(saldos.saldoTotal)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${estadoStyles[(b.estado ?? "ACTIVO").toLowerCase()]}`}
                    >
                      {(b.estado ?? "ACTIVO").toLowerCase()}
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
                      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
                                  {selected.tipoDocumento} {selected.documento}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {selected.direccion ?? "Sin dirección"}, {selected.ciudad}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {selected.telefono || selected.celular || "Sin teléfono"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span className="break-all">
                                  {selected.email ?? "Sin correo"}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-sm font-semibold text-foreground">
                                    Resumen de saldos por concepto
                                  </h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Valores actuales registrados en COP
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-lg border border-border overflow-hidden">
                                <div className="grid grid-cols-[1fr_auto] gap-4 bg-muted/40 px-4 py-2.5 border-b border-border">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Concepto
                                  </span>

                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">
                                    Saldo
                                  </span>
                                </div>

                                {[
                                  {
                                    label: "Salud",
                                    value: selectedSaldos.valorSalud,
                                    badgeClass: "bg-blue-500/10 text-blue-600",
                                    abbreviation: "S",
                                  },
                                  {
                                    label: "Pensión",
                                    value: selectedSaldos.valorPension,
                                    badgeClass: "bg-emerald-500/10 text-emerald-600",
                                    abbreviation: "P",
                                  },
                                  {
                                    label: "Cuota Monetaria",
                                    value: selectedSaldos.valorCuotaMonetaria,
                                    badgeClass: "bg-amber-500/10 text-amber-600",
                                    abbreviation: "CM",
                                  },
                                  {
                                    label: "Transferencia Económica",
                                    value: selectedSaldos.valorTransferencia,
                                    badgeClass: "bg-violet-500/10 text-violet-600",
                                    abbreviation: "TE",
                                  },
                                  {
                                    label: "Bono de Alimentación",
                                    value: selectedSaldos.valorBonoAlimentacion,
                                    badgeClass: "bg-rose-500/10 text-rose-600",
                                    abbreviation: "BA",
                                  },
                                  {
                                    label: "Beneficios Económicos",
                                    value: selectedSaldos.valorBeneficiosEconomicos488,
                                    badgeClass: "bg-cyan-500/10 text-cyan-600",
                                    abbreviation: "BE",
                                  },
                                ].map((concepto) => (
                                  <div
                                    key={concepto.label}
                                    className="grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div
                                        className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${concepto.badgeClass}`}
                                      >
                                        {concepto.abbreviation}
                                      </div>

                                      <span className="text-sm text-foreground">
                                        {concepto.label}
                                      </span>
                                    </div>

                                    <span className="text-sm font-mono font-semibold text-right whitespace-nowrap">
                                      {formatCurrency(concepto.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    Saldo Total
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Suma de todos los conceptos
                                  </p>
                                </div>

                                <span className="font-bold font-mono text-xl text-primary whitespace-nowrap">
                                  {formatCurrency(selectedSaldos.saldoTotal)}
                                </span>
                              </div>
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

      <Dialog
        open={newBeneficiaryDialogOpen}
        onOpenChange={setNewBeneficiaryDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Beneficiario</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Tipo de documento
              </label>
              <Select
                value={nuevoBeneficiarioForm.tipoDoc}
                onValueChange={(value) =>
                  updateNuevoBeneficiarioField("tipoDoc", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">CC</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="TI">TI</SelectItem>
                  <SelectItem value="NIT">NIT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Documento
              </label>
              <Input
                value={nuevoBeneficiarioForm.documento}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("documento", e.target.value)
                }
                placeholder="Número de documento"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Nombres
              </label>
              <Input
                value={nuevoBeneficiarioForm.nombres}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("nombres", e.target.value)
                }
                placeholder="Nombres"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Apellidos
              </label>
              <Input
                value={nuevoBeneficiarioForm.apellidos}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("apellidos", e.target.value)
                }
                placeholder="Apellidos"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Correo
              </label>
              <Input
                value={nuevoBeneficiarioForm.email}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("email", e.target.value)
                }
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Celular
              </label>
              <Input
                value={nuevoBeneficiarioForm.celular}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("celular", e.target.value)
                }
                placeholder="3001234567"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Teléfono
              </label>
              <Input
                value={nuevoBeneficiarioForm.telefono}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("telefono", e.target.value)
                }
                placeholder="6011234567"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Dirección
              </label>
              <Input
                value={nuevoBeneficiarioForm.direccion}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("direccion", e.target.value)
                }
                placeholder="Dirección"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Ciudad
              </label>
              <Input
                value={nuevoBeneficiarioForm.ciudad}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("ciudad", e.target.value)
                }
                placeholder="Ciudad"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Municipio
              </label>
              <Input
                value={nuevoBeneficiarioForm.municipio}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("municipio", e.target.value)
                }
                placeholder="Municipio"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Departamento
              </label>
              <Input
                value={nuevoBeneficiarioForm.departamento}
                onChange={(e) =>
                  updateNuevoBeneficiarioField("departamento", e.target.value)
                }
                placeholder="Departamento"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Estado
              </label>
              <Select
                value={nuevoBeneficiarioForm.estado}
                onValueChange={(value) =>
                  updateNuevoBeneficiarioField("estado", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setNewBeneficiaryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCrearNuevoBeneficiario}>
              Guardar Beneficiario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}