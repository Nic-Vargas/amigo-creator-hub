// Mock data for SISREC

export const CONCEPTOS = [
  { id: 'salud', nombre: 'Salud', color: 'chart-1' },
  { id: 'pension', nombre: 'Pensión', color: 'chart-2' },
  { id: 'cuota_monetaria', nombre: 'Cuota Monetaria', color: 'chart-3' },
  { id: 'transferencia_economica', nombre: 'Transferencia Económica', color: 'chart-4' },
] as const;

export type ConceptoId = typeof CONCEPTOS[number]['id'];

export const LEYES = [
  { id: 'ley_100', nombre: 'Ley 100/1993' },
  { id: 'ley_797', nombre: 'Ley 797/2003' },
  { id: 'ley_2225', nombre: 'Ley 2225/2022' },
] as const;

export type LeyId = typeof LEYES[number]['id'];

export interface Beneficiario {
  id: string;
  tipoDoc: 'CC' | 'CE' | 'TI' | 'NIT';
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
  estado: 'activo' | 'bloqueado' | 'inactivo';
  saldoTotal: number;
  fechaRegistro: string;
}

export interface Movimiento {
  id: string;
  beneficiarioId: string;
  beneficiarioNombre: string;
  concepto: ConceptoId;
  tipo: 'SALDO_INICIAL' | 'INCREMENTO' | 'REINTEGRO' | 'NO_PROCEDE' | 'AJUSTE';
  ley: LeyId;
  valor: number;
  valorSalud: number;
  valorPension: number;
  valorCuotaMonetaria: number;
  valorTransferencia: number;
  periodo: string;
  fecha: string;
  descripcion: string;
  usuario: string;
}

export interface CasoRecobro {
  id: string;
  beneficiarioId: string;
  beneficiarioNombre: string;
  ley: LeyId;
  periodo: string;
  valorSalud: number;
  valorPension: number;
  valorCuotaMonetaria: number;
  valorTransferencia: number;
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
  { id: '1', tipoDoc: 'CC', documento: '1.023.456.789', nombres: 'María Fernanda', apellidos: 'García López', email: 'maria.garcia@email.com', celular: '3101234567', telefono: '6011234567', direccion: 'Calle 45 #12-34', ciudad: 'Bogotá', municipio: 'Bogotá', departamento: 'Cundinamarca', estado: 'activo', saldoTotal: 4520000, fechaRegistro: '2024-03-15' },
  { id: '2', tipoDoc: 'CC', documento: '79.856.234', nombres: 'Carlos Andrés', apellidos: 'Martínez Ruiz', email: 'carlos.martinez@email.com', celular: '3209876543', telefono: '6042345678', direccion: 'Carrera 70 #48-22', ciudad: 'Medellín', municipio: 'Medellín', departamento: 'Antioquia', estado: 'activo', saldoTotal: 2180000, fechaRegistro: '2024-01-22' },
  { id: '3', tipoDoc: 'CC', documento: '52.345.678', nombres: 'Ana Patricia', apellidos: 'Rodríguez Sánchez', email: 'ana.rodriguez@email.com', celular: '3156789012', telefono: '6023456789', direccion: 'Av. 5N #23-10', ciudad: 'Cali', municipio: 'Cali', departamento: 'Valle del Cauca', estado: 'bloqueado', saldoTotal: 7890000, fechaRegistro: '2023-11-08' },
  { id: '4', tipoDoc: 'CE', documento: '456.789', nombres: 'José Luis', apellidos: 'Hernández Peña', email: 'jose.hernandez@email.com', celular: '3004567890', telefono: '6054567890', direccion: 'Calle 84 #51-30', ciudad: 'Barranquilla', municipio: 'Barranquilla', departamento: 'Atlántico', estado: 'activo', saldoTotal: 1350000, fechaRegistro: '2024-06-01' },
  { id: '5', tipoDoc: 'CC', documento: '1.098.765.432', nombres: 'Laura Camila', apellidos: 'Vargas Díaz', email: 'laura.vargas@email.com', celular: '3178901234', telefono: '6075678901', direccion: 'Carrera 27 #36-15', ciudad: 'Bucaramanga', municipio: 'Bucaramanga', departamento: 'Santander', estado: 'activo', saldoTotal: 3260000, fechaRegistro: '2024-02-14' },
  { id: '6', tipoDoc: 'CC', documento: '80.123.456', nombres: 'Pedro Antonio', apellidos: 'Castillo Mora', email: 'pedro.castillo@email.com', celular: '3112345678', telefono: '6016789012', direccion: 'Calle 100 #15-20', ciudad: 'Bogotá', municipio: 'Bogotá', departamento: 'Cundinamarca', estado: 'inactivo', saldoTotal: 0, fechaRegistro: '2023-08-20' },
  { id: '7', tipoDoc: 'CC', documento: '35.678.901', nombres: 'Sandra Milena', apellidos: 'Torres Ríos', email: 'sandra.torres@email.com', celular: '3223456789', telefono: '6067890123', direccion: 'Av. 30 de Agosto #42-55', ciudad: 'Pereira', municipio: 'Pereira', departamento: 'Risaralda', estado: 'activo', saldoTotal: 5670000, fechaRegistro: '2024-04-10' },
  { id: '8', tipoDoc: 'CC', documento: '1.045.678.901', nombres: 'Diego Alejandro', apellidos: 'Mejía Ortiz', email: 'diego.mejia@email.com', celular: '3054567891', telefono: '6058901234', direccion: 'Calle del Arsenal #28-14', ciudad: 'Cartagena', municipio: 'Cartagena', departamento: 'Bolívar', estado: 'activo', saldoTotal: 890000, fechaRegistro: '2024-07-05' },
];

export const movimientos: Movimiento[] = [
  { id: 'M001', beneficiarioId: '1', beneficiarioNombre: 'María F. García', concepto: 'salud', tipo: 'SALDO_INICIAL', ley: 'ley_100', valor: 1200000, valorSalud: 1200000, valorPension: 0, valorCuotaMonetaria: 0, valorTransferencia: 0, periodo: '2024-01', fecha: '2024-01-15', descripcion: 'Saldo inicial salud Ene 2024', usuario: 'admin.cartera' },
  { id: 'M002', beneficiarioId: '1', beneficiarioNombre: 'María F. García', concepto: 'pension', tipo: 'SALDO_INICIAL', ley: 'ley_100', valor: 800000, valorSalud: 0, valorPension: 800000, valorCuotaMonetaria: 0, valorTransferencia: 0, periodo: '2024-01', fecha: '2024-01-15', descripcion: 'Saldo inicial pensión Ene 2024', usuario: 'admin.cartera' },
  { id: 'M003', beneficiarioId: '2', beneficiarioNombre: 'Carlos A. Martínez', concepto: 'cuota_monetaria', tipo: 'INCREMENTO', ley: 'ley_797', valor: 950000, valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 950000, valorTransferencia: 0, periodo: '2024-02', fecha: '2024-02-10', descripcion: 'Incremento cuota monetaria Feb 2024', usuario: 'admin.cartera' },
  { id: 'M004', beneficiarioId: '1', beneficiarioNombre: 'María F. García', concepto: 'salud', tipo: 'REINTEGRO', ley: 'ley_100', valor: 300000, valorSalud: 300000, valorPension: 0, valorCuotaMonetaria: 0, valorTransferencia: 0, periodo: '2024-03', fecha: '2024-03-20', descripcion: 'Reintegro salud administradora', usuario: 'admin.cartera' },
  { id: 'M005', beneficiarioId: '3', beneficiarioNombre: 'Ana P. Rodríguez', concepto: 'transferencia_economica', tipo: 'SALDO_INICIAL', ley: 'ley_2225', valor: 2500000, valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 0, valorTransferencia: 2500000, periodo: '2024-01', fecha: '2024-01-25', descripcion: 'Saldo inicial transferencia Ley 2225', usuario: 'admin.fosfec' },
  { id: 'M006', beneficiarioId: '5', beneficiarioNombre: 'Laura C. Vargas', concepto: 'cuota_monetaria', tipo: 'INCREMENTO', ley: 'ley_797', valor: 680000, valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 680000, valorTransferencia: 0, periodo: '2024-04', fecha: '2024-04-05', descripcion: 'Incremento cuota monetaria Abr 2024', usuario: 'admin.cartera' },
  { id: 'M007', beneficiarioId: '3', beneficiarioNombre: 'Ana P. Rodríguez', concepto: 'salud', tipo: 'NO_PROCEDE', ley: 'ley_100', valor: 3200000, valorSalud: 3200000, valorPension: 0, valorCuotaMonetaria: 0, valorTransferencia: 0, periodo: '2024-02', fecha: '2024-02-15', descripcion: 'No procede salud - beneficiario sin derecho', usuario: 'admin.fosfec' },
  { id: 'M008', beneficiarioId: '7', beneficiarioNombre: 'Sandra M. Torres', concepto: 'pension', tipo: 'SALDO_INICIAL', ley: 'ley_100', valor: 1500000, valorSalud: 0, valorPension: 1500000, valorCuotaMonetaria: 0, valorTransferencia: 0, periodo: '2024-03', fecha: '2024-03-10', descripcion: 'Saldo inicial pensión', usuario: 'admin.cartera' },
  { id: 'M009', beneficiarioId: '2', beneficiarioNombre: 'Carlos A. Martínez', concepto: 'cuota_monetaria', tipo: 'REINTEGRO', ley: 'ley_797', valor: 200000, valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 200000, valorTransferencia: 0, periodo: '2024-04', fecha: '2024-04-18', descripcion: 'Reintegro cuota monetaria', usuario: 'admin.cartera' },
  { id: 'M010', beneficiarioId: '4', beneficiarioNombre: 'José L. Hernández', concepto: 'salud', tipo: 'AJUSTE', ley: 'ley_100', valor: 450000, valorSalud: 450000, valorPension: 0, valorCuotaMonetaria: 0, valorTransferencia: 0, periodo: '2024-05', fecha: '2024-05-08', descripcion: 'Ajuste saldo salud May 2024', usuario: 'admin.cartera' },
];

export const casosRecobro: CasoRecobro[] = [
  { id: 'CR-001', beneficiarioId: '1', beneficiarioNombre: 'María F. García López', ley: 'ley_100', periodo: '2024-01', valorSalud: 1200000, valorPension: 800000, valorCuotaMonetaria: 0, valorTransferencia: 0, valorTotal: 2000000, estado: 'En gestión', fechaApertura: '2024-04-01', responsable: 'Juan Pérez', prioridad: 'Alta', ultimaGestion: '2024-07-15' },
  { id: 'CR-002', beneficiarioId: '3', beneficiarioNombre: 'Ana P. Rodríguez Sánchez', ley: 'ley_2225', periodo: '2024-01', valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 0, valorTransferencia: 2500000, valorTotal: 2500000, estado: 'Abierto', fechaApertura: '2024-05-10', responsable: 'Laura Gómez', prioridad: 'Alta', ultimaGestion: '2024-07-20' },
  { id: 'CR-003', beneficiarioId: '5', beneficiarioNombre: 'Laura C. Vargas Díaz', ley: 'ley_797', periodo: '2024-04', valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 680000, valorTransferencia: 0, valorTotal: 680000, estado: 'Acuerdo', fechaApertura: '2024-03-15', responsable: 'Juan Pérez', prioridad: 'Media', ultimaGestion: '2024-06-28' },
  { id: 'CR-004', beneficiarioId: '7', beneficiarioNombre: 'Sandra M. Torres Ríos', ley: 'ley_100', periodo: '2024-03', valorSalud: 0, valorPension: 1500000, valorCuotaMonetaria: 0, valorTransferencia: 0, valorTotal: 1500000, estado: 'En pago', fechaApertura: '2024-02-20', responsable: 'Carlos Ruiz', prioridad: 'Media', ultimaGestion: '2024-07-10' },
  { id: 'CR-005', beneficiarioId: '2', beneficiarioNombre: 'Carlos A. Martínez Ruiz', ley: 'ley_797', periodo: '2024-02', valorSalud: 0, valorPension: 0, valorCuotaMonetaria: 950000, valorTransferencia: 0, valorTotal: 950000, estado: 'En gestión', fechaApertura: '2024-06-01', responsable: 'Laura Gómez', prioridad: 'Baja', ultimaGestion: '2024-07-22' },
];

export const kpis = {
  carteraTotal: 7630000,
  beneficiariosActivos: 7,
  casosAbiertos: 5,
  recaudoMes: 500000,
  tasaRecuperacion: 12.4,
  casosCriticos: 2,
};

export const saldosPorConcepto: SaldoConcepto[] = [
  { concepto: 'salud', nombreConcepto: 'Salud', totalDesembolsado: 4850000, totalReintegrado: 300000, totalAjustado: 450000, saldo: 4100000 },
  { concepto: 'pension', nombreConcepto: 'Pensión', totalDesembolsado: 2300000, totalReintegrado: 0, totalAjustado: 0, saldo: 2300000 },
  { concepto: 'cuota_monetaria', nombreConcepto: 'Cuota Monetaria', totalDesembolsado: 1630000, totalReintegrado: 200000, totalAjustado: 0, saldo: 1430000 },
  { concepto: 'transferencia_economica', nombreConcepto: 'Transferencia Económica', totalDesembolsado: 2500000, totalReintegrado: 0, totalAjustado: 0, saldo: 2500000 },
];
