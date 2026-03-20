import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import seedData from "@/data/sisrec_seed_from_excel.json";

const initialBeneficiarios = seedData.beneficiarios;
const initialCasosRecobro = seedData.casosRecobro;
const initialMovimientos = seedData.movimientos;

type CasoRecobro = (typeof initialCasosRecobro)[number];
type Movimiento = (typeof initialMovimientos)[number];
type Beneficiario = (typeof initialBeneficiarios)[number];

type TipoMovimientoUI =
  | "Pago"
  | "Nuevo Desembolso"
  | "No procede"
  | "Ajuste contable"
  | "No procede - Giro no efectuado";

type GuardarMovimientoPayload = {
  caseId: string;
  user: string;
  periodo?: string;
  valores: Record<
    string,
    {
      valor: string;
      tipo: string;
    }
  >;
};

type CrearCasoPayload = {
  beneficiarioId: string;
  ley: CasoRecobro["ley"];
  periodo: string;
  valorSalud: number;
  valorPension: number;
  valorCuotaMonetaria: number;
  valorTransferencia: number;
  estado: CasoRecobro["estado"];
  prioridad: CasoRecobro["prioridad"];
  responsable: string;
};

type CrearBeneficiarioPayload = {
  tipoDoc: Beneficiario["tipoDoc"];
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  municipio: string;
  departamento: string;
  estado: Beneficiario["estado"];
};

type AppDataContextType = {
  beneficiarios: Beneficiario[];
  casos: CasoRecobro[];
  movimientos: Movimiento[];
  usuarioActual: string;
  guardarMovimientoDesdeRecobro: (payload: GuardarMovimientoPayload) => void;
  crearNuevoCaso: (payload: CrearCasoPayload) => void;
  crearNuevoBeneficiario: (payload: CrearBeneficiarioPayload) => void;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const CASOS_STORAGE_KEY = "sisrec_casos";
const MOVIMIENTOS_STORAGE_KEY = "sisrec_movimientos";
const USUARIO_STORAGE_KEY = "sisrec_usuario_actual";
const BENEFICIARIOS_STORAGE_KEY = "sisrec_beneficiarios";

const mapTipoToMovimiento = (
  tipo: TipoMovimientoUI
): Movimiento["tipo"] => {
  switch (tipo) {
    case "Pago":
      return "REINTEGRO";
    case "Nuevo Desembolso":
      return "INCREMENTO";
    case "No procede":
      return "NO_PROCEDE";
    case "Ajuste contable":
      return "AJUSTE";
    case "No procede - Giro no efectuado":
      return "NO_PROCEDE";
    default:
      return "AJUSTE";
  }
};

const applyMovimiento = (
  currentValue: number,
  tipo: TipoMovimientoUI,
  inputValue: number
) => {
  switch (tipo) {
    case "Pago":
      return Math.max(0, currentValue - inputValue);
    case "Nuevo Desembolso":
      return currentValue + inputValue;
    case "No procede":
      return 0;
    case "Ajuste contable":
      return currentValue + inputValue;
    case "No procede - Giro no efectuado":
      return 0;
    default:
      return currentValue;
  }
};

const getToday = () => new Date().toISOString().slice(0, 10);

const generateMovimientoId = (
  currentMovimientos: Movimiento[],
  offset = 1
) => {
  const maxId = currentMovimientos.reduce((max, mov) => {
    const numeric = Number(String(mov.id).replace("M", ""));
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 0);

  return `M${String(maxId + offset).padStart(3, "0")}`;
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [casos, setCasos] = useState<CasoRecobro[]>(() => {
    const saved = localStorage.getItem(CASOS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialCasosRecobro;
  });

  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => {
    const saved = localStorage.getItem(MOVIMIENTOS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialMovimientos;
  });

  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>(() => {
    const saved = localStorage.getItem(BENEFICIARIOS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialBeneficiarios;
  });

  const [usuarioActual] = useState<string>(() => {
    const saved = localStorage.getItem(USUARIO_STORAGE_KEY);
    return saved || "admin.cartera";
  });

  useEffect(() => {
    localStorage.setItem(CASOS_STORAGE_KEY, JSON.stringify(casos));
  }, [casos]);

  useEffect(() => {
    localStorage.setItem(MOVIMIENTOS_STORAGE_KEY, JSON.stringify(movimientos));
  }, [movimientos]);

  useEffect(() => {
    localStorage.setItem(BENEFICIARIOS_STORAGE_KEY, JSON.stringify(beneficiarios));
  }, [beneficiarios]);

  useEffect(() => {
    localStorage.setItem(USUARIO_STORAGE_KEY, usuarioActual);
  }, [usuarioActual]);

  const guardarMovimientoDesdeRecobro = ({
    caseId,
    user,
    periodo,
    valores,
  }: GuardarMovimientoPayload) => {
    const caso = casos.find((c) => c.id === caseId);
    if (!caso) return;

    let nuevoValorSalud = caso.valorSalud;
    let nuevoValorPension = caso.valorPension;
    let nuevoValorCuotaMonetaria = caso.valorCuotaMonetaria;
    let nuevoValorTransferencia = caso.valorTransferencia;

    const nuevosMovimientos: Movimiento[] = [];

    Object.entries(valores).forEach(([conceptoId, data]) => {
      const tipo = data.tipo as TipoMovimientoUI;
      const valorNumerico = Number(data.valor || 0);

      if (!tipo) return;
      if (
        tipo !== "No procede" &&
        tipo !== "No procede - Giro no efectuado" &&
        valorNumerico <= 0
      ) {
        return;
      }

      let valorAnterior = 0;
      let valorNuevo = 0;

      if (conceptoId === "salud") {
        valorAnterior = nuevoValorSalud;
        valorNuevo = applyMovimiento(nuevoValorSalud, tipo, valorNumerico);
        nuevoValorSalud = valorNuevo;
      }

      if (conceptoId === "pension") {
        valorAnterior = nuevoValorPension;
        valorNuevo = applyMovimiento(nuevoValorPension, tipo, valorNumerico);
        nuevoValorPension = valorNuevo;
      }

      if (conceptoId === "cuota_monetaria") {
        valorAnterior = nuevoValorCuotaMonetaria;
        valorNuevo = applyMovimiento(
          nuevoValorCuotaMonetaria,
          tipo,
          valorNumerico
        );
        nuevoValorCuotaMonetaria = valorNuevo;
      }

      if (conceptoId === "transferencia_economica") {
        valorAnterior = nuevoValorTransferencia;
        valorNuevo = applyMovimiento(
          nuevoValorTransferencia,
          tipo,
          valorNumerico
        );
        nuevoValorTransferencia = valorNuevo;
      }

      const movimientoId = generateMovimientoId(
        [...movimientos, ...nuevosMovimientos],
        1
      );

      nuevosMovimientos.push({
        id: movimientoId,
        beneficiarioId: caso.beneficiarioId,
        beneficiarioNombre: caso.beneficiarioNombre,
        concepto: conceptoId as Movimiento["concepto"],
        tipo: mapTipoToMovimiento(tipo),
        tipoDetalle: tipo,
        ley: caso.ley,
        valor:
          tipo === "No procede" || tipo === "No procede - Giro no efectuado"
            ? valorAnterior
            : valorNumerico,
        valorSalud:
          conceptoId === "salud"
            ? tipo === "No procede" || tipo === "No procede - Giro no efectuado"
              ? valorAnterior
              : valorNumerico
            : 0,
        valorPension:
          conceptoId === "pension"
            ? tipo === "No procede" || tipo === "No procede - Giro no efectuado"
              ? valorAnterior
              : valorNumerico
            : 0,
        valorCuotaMonetaria:
          conceptoId === "cuota_monetaria"
            ? tipo === "No procede" || tipo === "No procede - Giro no efectuado"
              ? valorAnterior
              : valorNumerico
            : 0,
        valorTransferencia:
          conceptoId === "transferencia_economica"
            ? tipo === "No procede" || tipo === "No procede - Giro no efectuado"
              ? valorAnterior
              : valorNumerico
            : 0,
        periodo: periodo?.trim() ? periodo : caso.periodo,
        fecha: getToday(),
        descripcion: `${tipo} aplicado a ${conceptoId.replace(/_/g, " ")}`,
        usuario: user,
      });
    });

    const nuevoTotal =
      nuevoValorSalud +
      nuevoValorPension +
      nuevoValorCuotaMonetaria +
      nuevoValorTransferencia;

    setCasos((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? {
              ...item,
              periodo: periodo?.trim() ? periodo : item.periodo,
              valorSalud: nuevoValorSalud,
              valorPension: nuevoValorPension,
              valorCuotaMonetaria: nuevoValorCuotaMonetaria,
              valorTransferencia: nuevoValorTransferencia,
              valorTotal: nuevoTotal,
              ultimaGestion: getToday(),
            }
          : item
      )
    );

    if (nuevosMovimientos.length > 0) {
      setMovimientos((prev) => [...nuevosMovimientos, ...prev]);
    }
  };

  const crearNuevoCaso = ({
    beneficiarioId,
    ley,
    periodo,
    valorSalud,
    valorPension,
    valorCuotaMonetaria,
    valorTransferencia,
    estado,
    prioridad,
    responsable,
  }: CrearCasoPayload) => {
    const beneficiario = beneficiarios.find((b) => b.id === beneficiarioId);
    if (!beneficiario) return;

    const maxId = casos.reduce((max, caso) => {
      const numeric = Number(String(caso.id).replace("CR-", ""));
      return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 0);

    const nuevoCasoId = `CR-${String(maxId + 1).padStart(3, "0")}`;

    const valorTotal =
      valorSalud +
      valorPension +
      valorCuotaMonetaria +
      valorTransferencia;

    const beneficiarioNombre = `${beneficiario.nombres} ${beneficiario.apellidos}`;

    const nuevoCaso: CasoRecobro = {
      id: nuevoCasoId,
      beneficiarioId,
      beneficiarioNombre,
      ley,
      periodo,
      valorSalud,
      valorPension,
      valorCuotaMonetaria,
      valorTransferencia,
      valorTotal,
      estado,
      fechaApertura: getToday(),
      responsable,
      prioridad,
      ultimaGestion: getToday(),
    };

    const movimientosInicialesData = [
      {
        concepto: "salud" as const,
        valor: valorSalud,
        valorSalud,
        valorPension: 0,
        valorCuotaMonetaria: 0,
        valorTransferencia: 0,
        descripcion: "Saldo inicial salud",
      },
      {
        concepto: "pension" as const,
        valor: valorPension,
        valorSalud: 0,
        valorPension,
        valorCuotaMonetaria: 0,
        valorTransferencia: 0,
        descripcion: "Saldo inicial pensión",
      },
      {
        concepto: "cuota_monetaria" as const,
        valor: valorCuotaMonetaria,
        valorSalud: 0,
        valorPension: 0,
        valorCuotaMonetaria,
        valorTransferencia: 0,
        descripcion: "Saldo inicial cuota monetaria",
      },
      {
        concepto: "transferencia_economica" as const,
        valor: valorTransferencia,
        valorSalud: 0,
        valorPension: 0,
        valorCuotaMonetaria: 0,
        valorTransferencia,
        descripcion: "Saldo inicial transferencia económica",
      },
    ].filter((item) => item.valor > 0);

    const nuevosMovimientos: Movimiento[] = movimientosInicialesData.map(
      (item, index) => {
        const movimientoId = generateMovimientoId(movimientos, index + 1);

        return {
          id: movimientoId,
          beneficiarioId,
          beneficiarioNombre,
          concepto: item.concepto,
          tipo: "SALDO_INICIAL",
          tipoDetalle: "Saldo Inicial",
          ley,
          valor: item.valor,
          valorSalud: item.valorSalud,
          valorPension: item.valorPension,
          valorCuotaMonetaria: item.valorCuotaMonetaria,
          valorTransferencia: item.valorTransferencia,
          periodo,
          fecha: getToday(),
          descripcion: item.descripcion,
          usuario: responsable || usuarioActual,
        };
      }
    );

    setCasos((prev) => [nuevoCaso, ...prev]);

    if (nuevosMovimientos.length > 0) {
      setMovimientos((prev) => [...nuevosMovimientos, ...prev]);
    }
  };

  const crearNuevoBeneficiario = ({
    tipoDoc,
    documento,
    nombres,
    apellidos,
    email,
    celular,
    direccion,
    telefono,
    ciudad,
    municipio,
    departamento,
    estado,
  }: CrearBeneficiarioPayload) => {
    const documentoNormalizado = documento.trim();

    const yaExiste = beneficiarios.some(
      (b) => b.documento.trim() === documentoNormalizado
    );

    if (yaExiste) {
      throw new Error("Ya existe un beneficiario con ese documento.");
    }

    const maxId = beneficiarios.reduce((max, item) => {
      const numeric = Number(item.id);
      return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 0);

    const nuevoBeneficiario: Beneficiario = {
      id: String(maxId + 1),
      tipoDoc,
      documento: documentoNormalizado,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email.trim(),
      celular: celular.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      ciudad: ciudad.trim(),
      municipio: municipio.trim(),
      departamento: departamento.trim(),
      estado,
      saldoTotal: 0,
      fechaRegistro: getToday(),
    };

    setBeneficiarios((prev) => [nuevoBeneficiario, ...prev]);
  };

  const value = useMemo(
    () => ({
      beneficiarios,
      casos,
      movimientos,
      usuarioActual,
      guardarMovimientoDesdeRecobro,
      crearNuevoCaso,
      crearNuevoBeneficiario,
    }),
    [beneficiarios, casos, movimientos, usuarioActual]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData debe usarse dentro de AppDataProvider");
  }

  return context;
}