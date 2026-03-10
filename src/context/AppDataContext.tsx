import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  casosRecobro as initialCasosRecobro,
  movimientos as initialMovimientos,
} from "@/lib/mock-data";

type CasoRecobro = (typeof initialCasosRecobro)[number];
type Movimiento = (typeof initialMovimientos)[number];

type TipoMovimientoUI =
  | "Saldo Inicial"
  | "Reintegro"
  | "Incremento"
  | "No procede"
  | "Ajustes";

type ConceptoId =
  | "salud"
  | "pension"
  | "cuota_monetaria"
  | "transferencia_economica";

type GuardarMovimientoPayload = {
  caseId: string;
  user: string;
  valores: Record<
    string,
    {
      valor: string;
      tipo: string;
    }
  >;
};

type AppDataContextType = {
  casos: CasoRecobro[];
  movimientos: Movimiento[];
  usuarioActual: string;
  guardarMovimientoDesdeRecobro: (payload: GuardarMovimientoPayload) => void;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const CASOS_STORAGE_KEY = "sisrec_casos";
const MOVIMIENTOS_STORAGE_KEY = "sisrec_movimientos";
const USUARIO_STORAGE_KEY = "sisrec_usuario_actual";

const mapTipoToMovimiento = (
  tipo: TipoMovimientoUI
): Movimiento["tipo"] => {
  switch (tipo) {
    case "Saldo Inicial":
      return "SALDO_INICIAL";
    case "Reintegro":
      return "REINTEGRO";
    case "Incremento":
      return "INCREMENTO";
    case "No procede":
      return "NO_PROCEDE";
    case "Ajustes":
      return "AJUSTE";
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
    case "Saldo Inicial":
      return inputValue;
    case "Incremento":
      return currentValue + inputValue;
    case "Reintegro":
      return Math.max(0, currentValue - inputValue);
    case "No procede":
      return 0;
    case "Ajustes":
      return currentValue + inputValue;
    default:
      return currentValue;
  }
};

const getToday = () => new Date().toISOString().slice(0, 10);

const generateMovimientoId = (currentMovimientos: Movimiento[]) => {
  const maxId = currentMovimientos.reduce((max, mov) => {
    const numeric = Number(mov.id.replace("M", ""));
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 0);

  return `M${String(maxId + 1).padStart(3, "0")}`;
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
    localStorage.setItem(USUARIO_STORAGE_KEY, usuarioActual);
  }, [usuarioActual]);

  const guardarMovimientoDesdeRecobro = ({
    caseId,
    user,
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
      if (tipo !== "No procede" && valorNumerico <= 0) return;

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

      const movimientoId = generateMovimientoId([
        ...movimientos,
        ...nuevosMovimientos,
      ]);

      nuevosMovimientos.push({
        id: movimientoId,
        beneficiarioId: caso.beneficiarioId,
        beneficiarioNombre: caso.beneficiarioNombre,
        concepto: conceptoId as Movimiento["concepto"],
        tipo: mapTipoToMovimiento(tipo),
        ley: caso.ley,
        valor:
          tipo === "No procede"
            ? valorAnterior
            : valorNumerico,
        valorSalud: conceptoId === "salud" ? (tipo === "No procede" ? valorAnterior : valorNumerico) : 0,
        valorPension: conceptoId === "pension" ? (tipo === "No procede" ? valorAnterior : valorNumerico) : 0,
        valorCuotaMonetaria:
          conceptoId === "cuota_monetaria"
            ? tipo === "No procede"
              ? valorAnterior
              : valorNumerico
            : 0,
        valorTransferencia:
          conceptoId === "transferencia_economica"
            ? tipo === "No procede"
              ? valorAnterior
              : valorNumerico
            : 0,
        periodo: caso.periodo,
        fecha: getToday(),
        descripcion: `${tipo} aplicado a ${conceptoId.replace("_", " ")}`,
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

  const value = useMemo(
    () => ({
      casos,
      movimientos,
      usuarioActual,
      guardarMovimientoDesdeRecobro,
    }),
    [casos, movimientos, usuarioActual]
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