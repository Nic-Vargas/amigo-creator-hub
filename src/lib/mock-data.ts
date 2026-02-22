// Mock data for SISREC

export const CONCEPTOS = [
  { id: 'salud', nombre: 'Salud', color: 'chart-1' },
  { id: 'pension', nombre: 'Pensión', color: 'chart-2' },
  { id: 'cuota_monetaria', nombre: 'Cuota Monetaria', color: 'chart-3' },
  { id: 'transferencia_2225', nombre: 'Transferencia Ley 2225', color: 'chart-4' },
  { id: 'emergencia_488', nombre: 'Emergencia Dto. 488/2020', color: 'chart-5' },
  { id: 'bono_alimentacion', nombre: 'Bono Alimentación', color: 'chart-6' },
  { id: 'incentivo_cesantias', nombre: 'Incentivo Cesantías', color: 'chart-7' },
] as const;

export type ConceptoId = typeof CONCEPTOS[number]['id'];

export interface Beneficiario {
  id: string;
  tipoDoc: 'CC' | 'CE' | 'TI' | 'NIT';
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  celular: string;
  municipio: string;
  departamento: string;
  estado: 'activo' | 'bloqueado' | 'inactivo';
  saldoTotal: number;
  fechaRegistro: string;
}

export interface Movimiento {
  id: string;
  beneficiarioId: string;
  beneficiarioNombre: string;
  concepto: ConceptoId;
  tipo: 'DESEMBOLSO' | 'PAGO_BENEFICIARIO' | 'REINTEGRO_ADMINISTRADORA' | 'AJUSTE_NO_PROCEDENCIA' | 'REVERSO';
  valor: number;
  periodo: string;
  fecha: string;
  descripcion: string;
  usuario: string;
}

export interface CasoRecobro {
  id: string;
  beneficiarioId: string;
  beneficiarioNombre: string;
  conceptos: ConceptoId[];
  valorTotal: number;
  estado: 'Abierto' | 'En gestión' | 'Acuerdo' | 'En pago' | 'Cerrado';
  fechaApertura: string;
  responsable: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  ultimaGestion: string;
}

export interface SaldoConcepto {
  concepto: ConceptoId;
  nombreConcepto: string;
  totalDesembolsado: number;
  totalReintegrado: number;
  totalAjustado: number;
  saldo: number;
}

export const beneficiarios: Beneficiario[] = [
  { id: '1', tipoDoc: 'CC', documento: '1.023.456.789', nombres: 'María Fernanda', apellidos: 'García López', email: 'maria.garcia@email.com', celular: '3101234567', municipio: 'Bogotá', departamento: 'Cundinamarca', estado: 'activo', saldoTotal: 4520000, fechaRegistro: '2024-03-15' },
  { id: '2', tipoDoc: 'CC', documento: '79.856.234', nombres: 'Carlos Andrés', apellidos: 'Martínez Ruiz', email: 'carlos.martinez@email.com', celular: '3209876543', municipio: 'Medellín', departamento: 'Antioquia', estado: 'activo', saldoTotal: 2180000, fechaRegistro: '2024-01-22' },
  { id: '3', tipoDoc: 'CC', documento: '52.345.678', nombres: 'Ana Patricia', apellidos: 'Rodríguez Sánchez', email: 'ana.rodriguez@email.com', celular: '3156789012', municipio: 'Cali', departamento: 'Valle del Cauca', estado: 'bloqueado', saldoTotal: 7890000, fechaRegistro: '2023-11-08' },
  { id: '4', tipoDoc: 'CE', documento: '456.789', nombres: 'José Luis', apellidos: 'Hernández Peña', email: 'jose.hernandez@email.com', celular: '3004567890', municipio: 'Barranquilla', departamento: 'Atlántico', estado: 'activo', saldoTotal: 1350000, fechaRegistro: '2024-06-01' },
  { id: '5', tipoDoc: 'CC', documento: '1.098.765.432', nombres: 'Laura Camila', apellidos: 'Vargas Díaz', email: 'laura.vargas@email.com', celular: '3178901234', municipio: 'Bucaramanga', departamento: 'Santander', estado: 'activo', saldoTotal: 3260000, fechaRegistro: '2024-02-14' },
  { id: '6', tipoDoc: 'CC', documento: '80.123.456', nombres: 'Pedro Antonio', apellidos: 'Castillo Mora', email: 'pedro.castillo@email.com', celular: '3112345678', municipio: 'Bogotá', departamento: 'Cundinamarca', estado: 'inactivo', saldoTotal: 0, fechaRegistro: '2023-08-20' },
  { id: '7', tipoDoc: 'CC', documento: '35.678.901', nombres: 'Sandra Milena', apellidos: 'Torres Ríos', email: 'sandra.torres@email.com', celular: '3223456789', municipio: 'Pereira', departamento: 'Risaralda', estado: 'activo', saldoTotal: 5670000, fechaRegistro: '2024-04-10' },
  { id: '8', tipoDoc: 'CC', documento: '1.045.678.901', nombres: 'Diego Alejandro', apellidos: 'Mejía Ortiz', email: 'diego.mejia@email.com', celular: '3054567891', municipio: 'Cartagena', departamento: 'Bolívar', estado: 'activo', saldoTotal: 890000, fechaRegistro: '2024-07-05' },
];

export const movimientos: Movimiento[] = [
  { id: 'M001', beneficiarioId: '1', beneficiarioNombre: 'María F. García', concepto: 'salud', tipo: 'DESEMBOLSO', valor: 1200000, periodo: '2024-01', fecha: '2024-01-15', descripcion: 'Desembolso subsidio salud Ene 2024', usuario: 'admin.cartera' },
  { id: 'M002', beneficiarioId: '1', beneficiarioNombre: 'María F. García', concepto: 'pension', tipo: 'DESEMBOLSO', valor: 800000, periodo: '2024-01', fecha: '2024-01-15', descripcion: 'Desembolso pensión Ene 2024', usuario: 'admin.cartera' },
  { id: 'M003', beneficiarioId: '2', beneficiarioNombre: 'Carlos A. Martínez', concepto: 'cuota_monetaria', tipo: 'DESEMBOLSO', valor: 950000, periodo: '2024-02', fecha: '2024-02-10', descripcion: 'Desembolso cuota monetaria Feb 2024', usuario: 'admin.cartera' },
  { id: 'M004', beneficiarioId: '1', beneficiarioNombre: 'María F. García', concepto: 'salud', tipo: 'PAGO_BENEFICIARIO', valor: 300000, periodo: '2024-03', fecha: '2024-03-20', descripcion: 'Pago parcial salud', usuario: 'admin.cartera' },
  { id: 'M005', beneficiarioId: '3', beneficiarioNombre: 'Ana P. Rodríguez', concepto: 'transferencia_2225', tipo: 'DESEMBOLSO', valor: 2500000, periodo: '2024-01', fecha: '2024-01-25', descripcion: 'Transferencia Ley 2225 FOSFEC', usuario: 'admin.fosfec' },
  { id: 'M006', beneficiarioId: '5', beneficiarioNombre: 'Laura C. Vargas', concepto: 'bono_alimentacion', tipo: 'DESEMBOLSO', valor: 680000, periodo: '2024-04', fecha: '2024-04-05', descripcion: 'Bono alimentación Abr 2024', usuario: 'admin.cartera' },
  { id: 'M007', beneficiarioId: '3', beneficiarioNombre: 'Ana P. Rodríguez', concepto: 'emergencia_488', tipo: 'DESEMBOLSO', valor: 3200000, periodo: '2024-02', fecha: '2024-02-15', descripcion: 'Beneficio emergencia Dto 488', usuario: 'admin.fosfec' },
  { id: 'M008', beneficiarioId: '7', beneficiarioNombre: 'Sandra M. Torres', concepto: 'incentivo_cesantias', tipo: 'DESEMBOLSO', valor: 1500000, periodo: '2024-03', fecha: '2024-03-10', descripcion: 'Incentivo cesantías MPC', usuario: 'admin.cartera' },
  { id: 'M009', beneficiarioId: '2', beneficiarioNombre: 'Carlos A. Martínez', concepto: 'cuota_monetaria', tipo: 'REINTEGRO_ADMINISTRADORA', valor: 200000, periodo: '2024-04', fecha: '2024-04-18', descripcion: 'Reintegro EPS concepto cuota', usuario: 'admin.cartera' },
  { id: 'M010', beneficiarioId: '4', beneficiarioNombre: 'José L. Hernández', concepto: 'salud', tipo: 'DESEMBOLSO', valor: 450000, periodo: '2024-05', fecha: '2024-05-08', descripcion: 'Desembolso salud May 2024', usuario: 'admin.cartera' },
];

export const casosRecobro: CasoRecobro[] = [
  { id: 'CR-001', beneficiarioId: '1', beneficiarioNombre: 'María F. García López', conceptos: ['salud', 'pension'], valorTotal: 4520000, estado: 'En gestión', fechaApertura: '2024-04-01', responsable: 'Juan Pérez', prioridad: 'Alta', ultimaGestion: '2024-07-15' },
  { id: 'CR-002', beneficiarioId: '3', beneficiarioNombre: 'Ana P. Rodríguez Sánchez', conceptos: ['transferencia_2225', 'emergencia_488'], valorTotal: 7890000, estado: 'Abierto', fechaApertura: '2024-05-10', responsable: 'Laura Gómez', prioridad: 'Alta', ultimaGestion: '2024-07-20' },
  { id: 'CR-003', beneficiarioId: '5', beneficiarioNombre: 'Laura C. Vargas Díaz', conceptos: ['bono_alimentacion'], valorTotal: 3260000, estado: 'Acuerdo', fechaApertura: '2024-03-15', responsable: 'Juan Pérez', prioridad: 'Media', ultimaGestion: '2024-06-28' },
  { id: 'CR-004', beneficiarioId: '7', beneficiarioNombre: 'Sandra M. Torres Ríos', conceptos: ['incentivo_cesantias'], valorTotal: 5670000, estado: 'En pago', fechaApertura: '2024-02-20', responsable: 'Carlos Ruiz', prioridad: 'Media', ultimaGestion: '2024-07-10' },
  { id: 'CR-005', beneficiarioId: '2', beneficiarioNombre: 'Carlos A. Martínez Ruiz', conceptos: ['cuota_monetaria'], valorTotal: 2180000, estado: 'En gestión', fechaApertura: '2024-06-01', responsable: 'Laura Gómez', prioridad: 'Baja', ultimaGestion: '2024-07-22' },
];

export const kpis = {
  carteraTotal: 24770000,
  beneficiariosActivos: 7,
  casosAbiertos: 5,
  recaudoMes: 500000,
  tasaRecuperacion: 12.4,
  casosCriticos: 2,
};

export const saldosPorConcepto: SaldoConcepto[] = [
  { concepto: 'salud', nombreConcepto: 'Salud', totalDesembolsado: 1650000, totalReintegrado: 300000, totalAjustado: 0, saldo: 1350000 },
  { concepto: 'pension', nombreConcepto: 'Pensión', totalDesembolsado: 800000, totalReintegrado: 0, totalAjustado: 0, saldo: 800000 },
  { concepto: 'cuota_monetaria', nombreConcepto: 'Cuota Monetaria', totalDesembolsado: 950000, totalReintegrado: 200000, totalAjustado: 0, saldo: 750000 },
  { concepto: 'transferencia_2225', nombreConcepto: 'Transferencia Ley 2225', totalDesembolsado: 2500000, totalReintegrado: 0, totalAjustado: 0, saldo: 2500000 },
  { concepto: 'emergencia_488', nombreConcepto: 'Emergencia Dto. 488', totalDesembolsado: 3200000, totalReintegrado: 0, totalAjustado: 0, saldo: 3200000 },
  { concepto: 'bono_alimentacion', nombreConcepto: 'Bono Alimentación', totalDesembolsado: 680000, totalReintegrado: 0, totalAjustado: 0, saldo: 680000 },
  { concepto: 'incentivo_cesantias', nombreConcepto: 'Incentivo Cesantías', totalDesembolsado: 1500000, totalReintegrado: 0, totalAjustado: 0, saldo: 1500000 },
];
