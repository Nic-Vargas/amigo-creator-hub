import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { LEYES } from "@/lib/mock-data";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
  Abierto: "bg-info/15 text-info border-info/30",
  "En gestión": "bg-info/15 text-info border-info/30",
  Acuerdo: "bg-accent/15 text-accent border-accent/30",
  "En pago": "bg-warning/15 text-warning border-warning/30",
  Cerrado: "bg-muted text-muted-foreground border-border",
};

const estadosCaso = ["Abierto", "En gestión", "Acuerdo", "En pago", "Cerrado"] as const;

const tiposMovimiento = [
  "Pago",
  "Nuevo Desembolso",
  "No procede",
  "Ajuste contable",
  "No procede - Giro no efectuado",
] as const;

const mediosPago = ["Nequi", "NU Bank", "Bancolombia", "AV Villas", "BBVA", "Bre-B"] as const;

const estadoApiToUi: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_GESTION: "En gestión",
  ACUERDO: "Acuerdo",
  EN_PAGO: "En pago",
  CERRADO: "Cerrado",
};

const estadoUiToApi: Record<string, string> = {
  Abierto: "ABIERTO",
  "En gestión": "EN_GESTION",
  Acuerdo: "ACUERDO",
  "En pago": "EN_PAGO",
  Cerrado: "CERRADO",
};

const prioridadApiToUi: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const prioridadUiToApi: Record<string, string> = {
  Alta: "ALTA",
  Media: "MEDIA",
  Baja: "BAJA",
};

const tipoMovimientoUiToApi: Record<string, string> = {
  Pago: "REINTEGRO",
  "Nuevo Desembolso": "INCREMENTO",
  "No procede": "NO_PROCEDE",
  "Ajuste contable": "AJUSTE",
  "No procede - Giro no efectuado": "NO_PROCEDE",
};

type BeneficiarioApi = {
  id: string;
  tipoDocumento: string;
  documento: string;
  nombres: string;
  apellidos: string;
};

type RecobroApi = {
  id: string;
  beneficiaryId: string;
  ley: string;
  periodo: string;
  valorSalud: string;
  valorPension: string;
  valorCuotaMonetaria: string;
  valorTransferenciaEconomica: string;
  valorBonoAlimentacion: string;
  valorBeneficiosEconomicos488: string;
  valorTotal: string;
  estado: "ABIERTO" | "EN_GESTION" | "ACUERDO" | "EN_PAGO" | "CERRADO";
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  responsable?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  beneficiary?: BeneficiarioApi;
  fechaApertura: string;
  ultimaGestionAt: string | null;
  createdAt: string;
};

type MovementConceptApi =
  | "SALUD"
  | "PENSION"
  | "CUOTA_MONETARIA"
  | "TRANSFERENCIA_ECONOMICA"
  | "BONO_ALIMENTACION"
  | "BENEFICIOS_ECONOMICOS_488";

type MovementFormItem = {
  valor: string;
  tipo: string;
  medioPago: string;
  soportePagoNombre: string;
  adjustmentDirection: "SUMA" | "RESTA" | "";
};

type MovementFormState = Record<MovementConceptApi, MovementFormItem>;

type FilterFormState = {
  caso: string;
  documento: string;
  ley: string;
  periodo: string;
  beneficiario: string;
  estado: string;
  prioridad: string;
  responsable: string;
};

type NuevoCasoFormState = {
  beneficiarioId: string;
  ley: string;
  periodo: string;
  valorSalud: string;
  valorPension: string;
  valorCuotaMonetaria: string;
  valorTransferencia: string;
  valorBonoAlimentacion: string;
  valorBeneficiosEconomicos488: string;
  prioridad: string;
  responsable: string;
  fechaPago: string;
  estado: string;
};

const initialFilters: FilterFormState = {
  caso: "",
  documento: "",
  ley: "all",
  periodo: "",
  beneficiario: "",
  estado: "all",
  prioridad: "all",
  responsable: "",
};

const initialMovementForm: MovementFormState = {
  SALUD: {
    valor: "",
    tipo: "",
    medioPago: "",
    soportePagoNombre: "",
    adjustmentDirection: "",
  },
  PENSION: {
    valor: "",
    tipo: "",
    medioPago: "",
    soportePagoNombre: "",
    adjustmentDirection: "",
  },
  CUOTA_MONETARIA: {
    valor: "",
    tipo: "",
    medioPago: "",
    soportePagoNombre: "",
    adjustmentDirection: "",
  },
  TRANSFERENCIA_ECONOMICA: {
    valor: "",
    tipo: "",
    medioPago: "",
    soportePagoNombre: "",
    adjustmentDirection: "",
  },
  BONO_ALIMENTACION: {
    valor: "",
    tipo: "",
    medioPago: "",
    soportePagoNombre: "",
    adjustmentDirection: "",
  },
  BENEFICIOS_ECONOMICOS_488: {
    valor: "",
    tipo: "",
    medioPago: "",
    soportePagoNombre: "",
    adjustmentDirection: "",
  },
};

export default function Recobros() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioApi[]>([]);
  const [casos, setCasos] = useState<RecobroApi[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [newCaseDialogOpen, setNewCaseDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterFormState>(initialFilters);

  const [movementPeriodo, setMovementPeriodo] = useState("");
  const [movementFechaPago, setMovementFechaPago] = useState("");
  const [movementForm, setMovementForm] = useState<MovementFormState>(initialMovementForm);

  const usuarioActual = user?.fullName ?? "Usuario";

  const [nuevoCasoForm, setNuevoCasoForm] = useState<NuevoCasoFormState>({
    beneficiarioId: "",
    ley: "ley_100",
    periodo: "",
    valorSalud: "",
    valorPension: "",
    valorCuotaMonetaria: "",
    valorTransferencia: "",
    valorBonoAlimentacion: "",
    valorBeneficiosEconomicos488: "",
    prioridad: "Media",
    responsable: usuarioActual,
    fechaPago: "",
    estado: "Abierto",
  });

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
        title: "Error cargando recobros",
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

  const selectedCase = useMemo(
    () => casos.find((c) => c.id === selectedCaseId) ?? null,
    [casos, selectedCaseId]
  );

  const selectedBeneficiary = useMemo(() => {
    if (!selectedCase) return null;

    if (selectedCase.beneficiary) return selectedCase.beneficiary;

    return beneficiarios.find((b) => b.id === selectedCase.beneficiaryId) ?? null;
  }, [selectedCase, beneficiarios]);

  const getDocumentoBeneficiario = (beneficiarioId: string) => {
    const beneficiario = beneficiarios.find((b) => b.id === beneficiarioId);

    if (!beneficiario) return "";

    return `${beneficiario.tipoDocumento} ${beneficiario.documento}`;
  };

  const getNombreBeneficiario = (caso: RecobroApi) => {
    if (caso.beneficiary) {
      return `${caso.beneficiary.nombres} ${caso.beneficiary.apellidos}`;
    }

    const beneficiario = beneficiarios.find((b) => b.id === caso.beneficiaryId);

    return beneficiario
      ? `${beneficiario.nombres} ${beneficiario.apellidos}`
      : "Sin beneficiario";
  };

  const getConceptosCaso = (caso: RecobroApi) => [
    {
      key: "SALUD" as const,
      label: "Salud",
      saldo: Number(caso.valorSalud),
    },
    {
      key: "PENSION" as const,
      label: "Pensión",
      saldo: Number(caso.valorPension),
    },
    {
      key: "CUOTA_MONETARIA" as const,
      label: "Cuota Monetaria",
      saldo: Number(caso.valorCuotaMonetaria),
    },
    {
      key: "TRANSFERENCIA_ECONOMICA" as const,
      label: "Transferencia Económica",
      saldo: Number(caso.valorTransferenciaEconomica),
    },
    {
      key: "BONO_ALIMENTACION" as const,
      label: "Bono de Alimentación",
      saldo: Number(caso.valorBonoAlimentacion),
    },
    {
      key: "BENEFICIOS_ECONOMICOS_488" as const,
      label: "Beneficios Económicos 488",
      saldo: Number(caso.valorBeneficiosEconomicos488),
    },
  ];

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return casos.filter((c) => {
      const documentoBeneficiario = getDocumentoBeneficiario(c.beneficiaryId).toLowerCase();
      const nombreBeneficiario = getNombreBeneficiario(c).toLowerCase();
      const estadoUi = estadoApiToUi[c.estado] ?? c.estado;
      const prioridadUi = prioridadApiToUi[c.prioridad] ?? c.prioridad;
      const responsableNombre = c.responsable?.fullName ?? "";

      const matchesSearch =
        searchText === "" ||
        c.id.toLowerCase().includes(searchText) ||
        nombreBeneficiario.includes(searchText) ||
        documentoBeneficiario.includes(searchText);

      const matchesCaso =
        filters.caso.trim() === "" ||
        c.id.toLowerCase().includes(filters.caso.trim().toLowerCase());

      const matchesDocumento =
        filters.documento.trim() === "" ||
        documentoBeneficiario.includes(filters.documento.trim().toLowerCase());

      const matchesLey = filters.ley === "all" || c.ley === filters.ley;

      const matchesPeriodo =
        filters.periodo.trim() === "" ||
        c.periodo.toLowerCase().includes(filters.periodo.trim().toLowerCase());

      const matchesBeneficiario =
        filters.beneficiario.trim() === "" ||
        nombreBeneficiario.includes(filters.beneficiario.trim().toLowerCase());

      const matchesEstado = filters.estado === "all" || estadoUi === filters.estado;

      const matchesPrioridad =
        filters.prioridad === "all" || prioridadUi === filters.prioridad;

      const matchesResponsable =
        filters.responsable.trim() === "" ||
        responsableNombre
          .toLowerCase()
          .includes(filters.responsable.trim().toLowerCase());

      return (
        matchesSearch &&
        matchesCaso &&
        matchesDocumento &&
        matchesLey &&
        matchesPeriodo &&
        matchesBeneficiario &&
        matchesEstado &&
        matchesPrioridad &&
        matchesResponsable
      );
    });
  }, [casos, beneficiarios, search, filters]);

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
      filters.documento !== "" ||
      filters.ley !== "all" ||
      filters.periodo !== "" ||
      filters.beneficiario !== "" ||
      filters.estado !== "all" ||
      filters.prioridad !== "all" ||
      filters.responsable !== ""
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

  const updateNuevoCasoField = (field: keyof NuevoCasoFormState, value: string) => {
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
      | "valorTransferencia"
      | "valorBonoAlimentacion"
      | "valorBeneficiosEconomicos488",
    value: string
  ) => {
    const onlyNumbers = value.replace(/[^\d]/g, "");

    setNuevoCasoForm((prev) => ({
      ...prev,
      [field]: onlyNumbers,
    }));
  };

  const updateMovementField = (
    concepto: MovementConceptApi,
    field: keyof MovementFormItem,
    value: string
  ) => {
    setMovementForm((prev) => ({
      ...prev,
      [concepto]: {
        ...prev[concepto],
        [field]: value,
      },
    }));
  };

  const handleCrearNuevoCaso = async () => {
    if (!nuevoCasoForm.beneficiarioId || !nuevoCasoForm.periodo.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Debes seleccionar beneficiario y periodo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiFetch<RecobroApi>("/recobros", {
        method: "POST",
        body: JSON.stringify({
          beneficiaryId: nuevoCasoForm.beneficiarioId,
          ley: nuevoCasoForm.ley,
          periodo: nuevoCasoForm.periodo,
          valorSalud: Number(nuevoCasoForm.valorSalud || 0),
          valorPension: Number(nuevoCasoForm.valorPension || 0),
          valorCuotaMonetaria: Number(nuevoCasoForm.valorCuotaMonetaria || 0),
          valorTransferenciaEconomica: Number(
            nuevoCasoForm.valorTransferencia || 0
          ),
          valorBonoAlimentacion: Number(
            nuevoCasoForm.valorBonoAlimentacion || 0
          ),
          valorBeneficiosEconomicos488: Number(
            nuevoCasoForm.valorBeneficiosEconomicos488 || 0
          ),
          prioridad: prioridadUiToApi[nuevoCasoForm.prioridad] ?? "MEDIA",
        }),
      });

      toast({
        title: "Caso creado",
        description: "El caso de recobro fue registrado correctamente.",
      });

      setNuevoCasoForm({
        beneficiarioId: "",
        ley: "ley_100",
        periodo: "",
        valorSalud: "",
        valorPension: "",
        valorCuotaMonetaria: "",
        valorTransferencia: "",
        valorBonoAlimentacion: "",
        valorBeneficiosEconomicos488: "",
        prioridad: "Media",
        responsable: usuarioActual,
        fechaPago: "",
        estado: "Abierto",
      });

      setNewCaseDialogOpen(false);
      await cargarDatos();
    } catch (error) {
      toast({
        title: "No fue posible crear el caso",
        description:
          error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleActualizarEstadoCaso = async (caseId: string, estadoUi: string) => {
    try {
      await apiFetch<RecobroApi>(`/recobros/${caseId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({
          estado: estadoUiToApi[estadoUi],
        }),
      });

      toast({
        title: "Estado actualizado",
        description: "El estado del caso fue actualizado correctamente.",
      });

      await cargarDatos();
    } catch (error) {
      toast({
        title: "No fue posible cambiar el estado",
        description:
          error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleOpenMovimiento = (caseId: string) => {
    const caso = casos.find((c) => c.id === caseId);

    if (!caso) return;

    setSelectedCaseId(caseId);
    setMovementPeriodo(caso.periodo);
    setMovementFechaPago(new Date().toISOString().slice(0, 10));
    setMovementForm(initialMovementForm);
    setMovementDialogOpen(true);
  };

  const handleGuardarMovimiento = async () => {
    if (!selectedCase) {
      toast({
        title: "Caso no seleccionado",
        description: "Debes seleccionar un caso antes de registrar movimientos.",
        variant: "destructive",
      });
      return;
    }

    const conceptos = getConceptosCaso(selectedCase);

    const movimientos = conceptos
      .map((concepto) => {
        const form = movementForm[concepto.key];

        return {
          concepto: concepto.key,
          label: concepto.label,
          saldo: concepto.saldo,
          tipoUi: form.tipo,
          tipoApi: tipoMovimientoUiToApi[form.tipo],
          valor: Number(form.valor || 0),
          medioPago: form.medioPago,
          soportePagoNombre: form.soportePagoNombre,
          adjustmentDirection: form.adjustmentDirection,
        };
      })
      .filter((movimiento) => movimiento.tipoUi);

    if (movimientos.length === 0) {
      toast({
        title: "Sin movimientos",
        description: "Debes seleccionar al menos un tipo de movimiento.",
        variant: "destructive",
      });
      return;
    }

    for (const movimiento of movimientos) {
      const requiereValor =
        movimiento.tipoApi === "REINTEGRO" ||
        movimiento.tipoApi === "INCREMENTO" ||
        movimiento.tipoApi === "AJUSTE";

      const requiereMedioYSoporte = movimiento.tipoApi === "REINTEGRO";

      if (!movimiento.tipoApi) {
        toast({
          title: "Tipo inválido",
          description: `El tipo seleccionado para ${movimiento.label} no es válido.`,
          variant: "destructive",
        });
        return;
      }

      if (requiereValor && movimiento.valor <= 0) {
        toast({
          title: "Valor inválido",
          description: `Debes ingresar un valor mayor a cero para ${movimiento.label}.`,
          variant: "destructive",
        });
        return;
      }

      if (
        (movimiento.tipoApi === "REINTEGRO" ||
          (movimiento.tipoApi === "AJUSTE" && movimiento.adjustmentDirection === "RESTA")) &&
        movimiento.valor > movimiento.saldo
      ) {
        toast({
          title: "Valor excedido",
          description: `El valor de ${movimiento.label} supera el saldo actual.`,
          variant: "destructive",
        });
        return;
      }

      if (movimiento.tipoApi === "NO_PROCEDE" && movimiento.saldo <= 0) {
        toast({
          title: "Movimiento no permitido",
          description: `No puedes aplicar No procede sobre ${movimiento.label} porque el saldo ya es cero.`,
          variant: "destructive",
        });
        return;
      }

      if (movimiento.tipoApi === "AJUSTE" && !movimiento.adjustmentDirection) {
        toast({
          title: "Dirección de ajuste requerida",
          description: `Debes seleccionar si el ajuste de ${movimiento.label} suma o resta.`,
          variant: "destructive",
        });
        return;
      }

      if (requiereMedioYSoporte && !movimiento.medioPago) {
        toast({
          title: "Medio de pago requerido",
          description: `Debes seleccionar el medio de pago para ${movimiento.label}.`,
          variant: "destructive",
        });
        return;
      }

      if (requiereMedioYSoporte && !movimiento.soportePagoNombre) {
        toast({
          title: "Soporte requerido",
          description: `Debes cargar el soporte para ${movimiento.label}.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const tiposDescripcion = Array.from(
        new Set(movimientos.map((movimiento) => movimiento.tipoUi))
      ).join(", ");

      const mediosDescripcion = movimientos
        .filter((movimiento) => movimiento.medioPago)
        .map(
          (movimiento) =>
            `${movimiento.label}: ${movimiento.medioPago}`
        )
        .join(", ");

      const soportesDescripcion = movimientos
        .filter((movimiento) => movimiento.soportePagoNombre)
        .map(
          (movimiento) =>
            `${movimiento.label}: ${movimiento.soportePagoNombre}`
        )
        .join(", ");

      await apiFetch("/movimientos", {
        method: "POST",
        body: JSON.stringify({
          recobroCaseId: selectedCase.id,

          detalles: movimientos.map((movimiento) => ({
            tipo: movimiento.tipoApi,
            concepto: movimiento.concepto,
            valor:
              movimiento.tipoApi === "NO_PROCEDE"
                ? 0
                : movimiento.valor,

            adjustmentDirection:
              movimiento.tipoApi === "AJUSTE"
                ? movimiento.adjustmentDirection
                : undefined,
          })),

          descripcion: [
            `${tiposDescripcion} registrado desde Recobros`,
            movementPeriodo
              ? `Periodo: ${movementPeriodo}`
              : null,
            movementFechaPago
              ? `Fecha pago: ${movementFechaPago}`
              : null,
            mediosDescripcion
              ? `Medio: ${mediosDescripcion}`
              : null,
            soportesDescripcion
              ? `Soporte: ${soportesDescripcion}`
              : null,
          ]
            .filter(Boolean)
            .join(" | "),
        }),
      });

      toast({
        title: "Movimiento registrado",
        description: "Los saldos fueron actualizados correctamente.",
      });

      setMovementDialogOpen(false);
      setSelectedCaseId(null);
      setMovementPeriodo("");
      setMovementFechaPago("");
      setMovementForm(initialMovementForm);

      await cargarDatos();
    } catch (error) {
      toast({
        title: "No fue posible registrar el movimiento",
        description:
          error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleExportarRecobros = () => {
    const dataToExport = filtered.map((caso) => {
      const ley = LEYES.find((l) => l.id === caso.ley);
      const totalCaso = Number(caso.valorTotal);
      const estadoUi = estadoApiToUi[caso.estado] ?? caso.estado;
      const prioridadUi = prioridadApiToUi[caso.prioridad] ?? caso.prioridad;

      return {
        Caso: caso.id,
        Ley: ley?.nombre || caso.ley,
        Periodo: caso.periodo,
        Documento: getDocumentoBeneficiario(caso.beneficiaryId),
        Beneficiario: getNombreBeneficiario(caso),
        Salud: Number(caso.valorSalud),
        Pension: Number(caso.valorPension),
        CuotaMonetaria: Number(caso.valorCuotaMonetaria),
        TransferenciaEconomica: Number(caso.valorTransferenciaEconomica),
        BonoAlimentacion: Number(caso.valorBonoAlimentacion),
        BeneficiosEconomicos488: Number(
          caso.valorBeneficiosEconomicos488
        ),
        Total: totalCaso,
        Estado: estadoUi,
        Prioridad: prioridadUi,
        Responsable: caso.responsable?.fullName ?? "Sin responsable",
        FechaApertura: new Date(caso.fechaApertura).toLocaleDateString("es-CO"),
        UltimaGestion: caso.ultimaGestionAt
          ? new Date(caso.ultimaGestionAt).toLocaleDateString("es-CO")
          : "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Recobros");

    const fechaExportacion = new Date().toISOString().slice(0, 10);

    XLSX.writeFile(
      workbook,
      `recobros_${filtered.length}_registros_${fechaExportacion}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando casos de recobro...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Casos de Recobro</h1>
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
            const estadoUi = estadoApiToUi[c.estado] ?? c.estado;
            acc[estadoUi] = (acc[estadoUi] || 0) + 1;
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
            placeholder="Buscar por caso, beneficiario o documento..."
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
                Bono Alimentación
              </th>

              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Beneficios
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
              const totalCaso = Number(caso.valorTotal);
              const estadoUi = estadoApiToUi[caso.estado] ?? caso.estado;
              const prioridadUi =
                prioridadApiToUi[caso.prioridad] ?? caso.prioridad;

              return (
                <tr
                  key={caso.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="p-3 font-mono text-xs font-medium">
                    {getDocumentoBeneficiario(caso.beneficiaryId) || "—"}
                  </td>
                  <td className="p-3 text-xs">{ley?.nombre || caso.ley}</td>
                  <td className="p-3 font-mono text-xs">{caso.periodo}</td>
                  <td className="p-3 font-medium">{getNombreBeneficiario(caso)}</td>
                  <td className="p-3 text-right font-mono text-xs">
                    {Number(caso.valorSalud) > 0
                      ? formatCurrency(Number(caso.valorSalud))
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {Number(caso.valorPension) > 0
                      ? formatCurrency(Number(caso.valorPension))
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {Number(caso.valorCuotaMonetaria) > 0
                      ? formatCurrency(Number(caso.valorCuotaMonetaria))
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {Number(caso.valorTransferenciaEconomica) > 0
                      ? formatCurrency(Number(caso.valorTransferenciaEconomica))
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {Number(caso.valorBonoAlimentacion) > 0
                      ? formatCurrency(Number(caso.valorBonoAlimentacion))
                      : "—"}
                  </td>

                  <td className="p-3 text-right font-mono text-xs">
                    {Number(caso.valorBeneficiosEconomicos488) > 0
                      ? formatCurrency(Number(caso.valorBeneficiosEconomicos488))
                      : "—"}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    {formatCurrency(totalCaso)}
                  </td>
                  <td className="p-3">
                    <Select
                      value={estadoUi}
                      onValueChange={(value) =>
                        handleActualizarEstadoCaso(caso.id, value)
                      }
                    >
                      <SelectTrigger
                        className={`h-7 min-w-[130px] px-2 py-0 border rounded-full text-[10px] font-semibold ${estadoColors[estadoUi]}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosCaso.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={prioridadUi === "Alta" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {prioridadUi}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {caso.responsable?.fullName ?? usuarioActual}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleOpenMovimiento(caso.id)}
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

      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Estado de cuenta</DialogTitle>
          </DialogHeader>

          {selectedCase && selectedBeneficiary && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {selectedBeneficiary.nombres[0]}
                  {selectedBeneficiary.apellidos[0]}
                </div>

                <div>
                  <p className="font-semibold">
                    {selectedBeneficiary.nombres} {selectedBeneficiary.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBeneficiary.tipoDocumento} {selectedBeneficiary.documento}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Período
                  </label>
                  <Input
                    value={movementPeriodo}
                    onChange={(e) => setMovementPeriodo(e.target.value)}
                    placeholder="Ej: 2026-05"
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Fecha de pago
                  </label>
                  <Input
                    type="date"
                    value={movementFechaPago}
                    onChange={(e) => setMovementFechaPago(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {getConceptosCaso(selectedCase).map((concepto) => {
                  const form = movementForm[concepto.key];
                  const requierePago = form.tipo === "Pago";
                  const esAjuste = form.tipo === "Ajuste contable";

                  return (
                    <div
                      key={concepto.key}
                      className="grid grid-cols-1 md:grid-cols-[1.2fr_0.9fr_1fr_1fr] gap-3 items-start py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{concepto.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Saldo actual: {formatCurrency(concepto.saldo)}
                        </p>
                      </div>

                      <Input
                        placeholder="Ingrese valor"
                        value={form.valor}
                        onChange={(e) => {
                          const onlyNumbers = e.target.value.replace(/[^\d]/g, "");
                          updateMovementField(concepto.key, "valor", onlyNumbers);
                        }}
                        className="font-mono"
                      />

                      <Select
                        value={form.tipo}
                        onValueChange={(value) =>
                          updateMovementField(concepto.key, "tipo", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione concepto" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposMovimiento.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="space-y-2">
                        {esAjuste && (
                          <Select
                            value={form.adjustmentDirection}
                            onValueChange={(value) =>
                              updateMovementField(
                                concepto.key,
                                "adjustmentDirection",
                                value
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Suma / Resta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SUMA">Suma</SelectItem>
                              <SelectItem value="RESTA">Resta</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {requierePago && (
                          <>
                            <Select
                              value={form.medioPago}
                              onValueChange={(value) =>
                                updateMovementField(concepto.key, "medioPago", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Medio de pago" />
                              </SelectTrigger>
                              <SelectContent>
                                {mediosPago.map((medio) => (
                                  <SelectItem key={medio} value={medio}>
                                    {medio}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <input
                              id={`soporte-${concepto.key}`}
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  updateMovementField(
                                    concepto.key,
                                    "soportePagoNombre",
                                    file.name
                                  );
                                }
                              }}
                            />

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  document
                                    .getElementById(`soporte-${concepto.key}`)
                                    ?.click()
                                }
                              >
                                Cargar soporte
                              </Button>

                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {form.soportePagoNombre || "Sin archivo"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMovementDialogOpen(false);
                    setSelectedCaseId(null);
                    setMovementForm(initialMovementForm);
                  }}
                >
                  Cancelar
                </Button>

                <Button onClick={handleGuardarMovimiento}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                placeholder="ID del caso"
                value={filters.caso}
                onChange={(e) => updateFilterField("caso", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Documento
              </label>
              <Input
                placeholder="Documento"
                value={filters.documento}
                onChange={(e) => updateFilterField("documento", e.target.value)}
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
                  {estadosCaso.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
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
            <Button onClick={() => setFilterDialogOpen(false)}>Aplicar</Button>
          </div>
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
                    <SelectValue placeholder="Seleccionar beneficiario" />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiarios.map((beneficiario) => (
                      <SelectItem key={beneficiario.id} value={beneficiario.id}>
                        {beneficiario.nombres} {beneficiario.apellidos}
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
                  Período
                </label>
                <Input
                  value={nuevoCasoForm.periodo}
                  onChange={(e) =>
                    updateNuevoCasoField("periodo", e.target.value)
                  }
                  placeholder="Ej: 2026-05"
                  className="font-mono"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Fecha de pago
                </label>
                <Input
                  type="date"
                  value={nuevoCasoForm.fechaPago}
                  onChange={(e) =>
                    updateNuevoCasoField("fechaPago", e.target.value)
                  }
                  className="font-mono"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Responsable
                </label>
                <Input value={nuevoCasoForm.responsable} disabled />
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
                    {estadosCaso.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-sm text-muted-foreground">
                  Bono de Alimentación
                </span>

                <Input
                  placeholder="Ingrese valor"
                  value={nuevoCasoForm.valorBonoAlimentacion}
                  onChange={(e) =>
                    updateNuevoCasoNumberField(
                      "valorBonoAlimentacion",
                      e.target.value
                    )
                  }
                  className="font-mono md:col-span-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-sm text-muted-foreground">
                  Beneficios Económicos 488
                </span>

                <Input
                  placeholder="Ingrese valor"
                  value={nuevoCasoForm.valorBeneficiosEconomicos488}
                  onChange={(e) =>
                    updateNuevoCasoNumberField(
                      "valorBeneficiosEconomicos488",
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