import { useState } from "react";
import { FileSpreadsheet, FileText, Download, Calendar, BarChart3, Search, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const reportes = [
  { id: 1, nombre: "Cartera General por Concepto", tipo: "Operativo", formato: "Excel", frecuencia: "Mensual", ultimoGenerado: "2024-07-15" },
  { id: 2, nombre: "Estado de Cuenta por Beneficiario", tipo: "Operativo", formato: "PDF", frecuencia: "Bajo demanda", ultimoGenerado: "2024-07-20" },
  { id: 3, nombre: "Reporte MICRODATO - SSF", tipo: "Entes de Control", formato: "CSV", frecuencia: "Trimestral", ultimoGenerado: "2024-06-30" },
  { id: 4, nombre: "Antigüedad de Cartera", tipo: "Gerencial", formato: "Excel", frecuencia: "Mensual", ultimoGenerado: "2024-07-01" },
  { id: 5, nombre: "Efectividad de Gestión de Recobro", tipo: "Gerencial", formato: "PDF", frecuencia: "Mensual", ultimoGenerado: "2024-07-10" },
  { id: 6, nombre: "Movimientos por Periodo", tipo: "Operativo", formato: "Excel", frecuencia: "Mensual", ultimoGenerado: "2024-07-15" },
  { id: 7, nombre: "Acuerdos de Pago y Cumplimiento", tipo: "Operativo", formato: "Excel", frecuencia: "Semanal", ultimoGenerado: "2024-07-22" },
  { id: 8, nombre: "Reporte MICRODATO - MinTrabajo", tipo: "Entes de Control", formato: "TXT", frecuencia: "Semestral", ultimoGenerado: "2024-06-30" },
];

const tipoColors: Record<string, string> = {
  Operativo: "bg-info/15 text-info border-info/30",
  Gerencial: "bg-primary/15 text-primary border-primary/30",
  "Entes de Control": "bg-warning/15 text-warning border-warning/30",
};

const conceptos = [
  ["SALUD", "Salud"],
  ["PENSION", "Pensión"],
  ["CUOTA_MONETARIA", "Cuota Monetaria"],
  ["TRANSFERENCIA_ECONOMICA", "Transferencia Económica"],
  ["BONO_ALIMENTACION", "Bono de Alimentación"],
  ["BENEFICIOS_ECONOMICOS_488", "Beneficios Económicos 488"],
] as const;

const motivos = [
  ["NO_PROCEDE_SALDO_NEGATIVO", "Saldo negativo"],
  ["NO_PROCEDE_TRANSFERENCIA_NI_SS", "Transferencia Ni SS"],
  ["NO_PROCEDE_CANCELACION_BENEFICIO", "Cancelación de beneficio"],
  ["NO_PROCEDE_80_CESANTE", "80% cesante"],
  ["NO_PROCEDE_CERO_DIAS_APORTES", "Cero días de aportes"],
  ["NO_PROCEDE_GIRO_NO_EFECTUADO", "Giro no efectuado"],
] as const;

type Exclusion = {
  id: string;
  concepto: string;
  motivo: string;
  montoOriginal: string | number | null;
  saldoInicialImportado: string | number | null;
  saldoAntes: string | number;
  valorExcluido: string | number;
  saldoDespues: string | number;
  fechaExclusion: string;
  recobroCaseId: string;
  recobroCase: {
    ley: string;
    periodo: string;
    beneficiary: {
      tipoDocumento: string;
      documento: string;
      nombres: string;
      apellidos: string;
    };
  };
};

type ReporteExclusiones = {
  resumen: { totalExclusiones: number; valorTotalExcluido: number };
  data: Exclusion[];
};

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 2 }).format(valor);

const mesActual = new Date().toISOString().slice(0, 7);

export default function Reportes() {
  const { toast } = useToast();
  const [desde, setDesde] = useState(`${mesActual}-01`);
  const [hasta, setHasta] = useState(`${mesActual}-${String(new Date(Number(mesActual.slice(0, 4)), Number(mesActual.slice(5, 7)), 0).getDate()).padStart(2, "0")}`);
  const [concepto, setConcepto] = useState("all");
  const [motivo, setMotivo] = useState("all");
  const [reporte, setReporte] = useState<ReporteExclusiones | null>(null);
  const [consultando, setConsultando] = useState(false);

  const consultar = async () => {
    if (desde && hasta && desde > hasta) {
      toast({ title: "Rango inválido", description: "La fecha inicial no puede ser posterior a la final.", variant: "destructive" });
      return;
    }
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (concepto !== "all") params.set("concepto", concepto);
    if (motivo !== "all") params.set("motivo", motivo);
    try {
      setConsultando(true);
      setReporte(null);
      const resultado = await apiFetch<ReporteExclusiones>(`/reportes/exclusiones?${params.toString()}`);
      setReporte(resultado);
    } catch (error) {
      toast({ title: "No se pudo consultar el informe", description: error instanceof Error ? error.message : "Error inesperado", variant: "destructive" });
    } finally {
      setConsultando(false);
    }
  };

  const descargar = () => {
    if (!reporte) return;
    const filas = reporte.data.map((item) => ({
      "Fecha Exclusión": item.fechaExclusion.slice(0, 10),
      Caso: item.recobroCaseId,
      "Tipo Documento": item.recobroCase.beneficiary.tipoDocumento,
      Documento: item.recobroCase.beneficiary.documento,
      Beneficiario: `${item.recobroCase.beneficiary.nombres} ${item.recobroCase.beneficiary.apellidos}`.trim(),
      Ley: item.recobroCase.ley,
      Periodo: item.recobroCase.periodo,
      Concepto: item.concepto,
      Motivo: item.motivo,
      "Total Recobro Original": item.montoOriginal == null ? null : Number(item.montoOriginal),
      "Saldo Inicial Importado": item.saldoInicialImportado == null ? null : Number(item.saldoInicialImportado),
      "Saldo Antes": Number(item.saldoAntes),
      "Valor Excluido": Number(item.valorExcluido),
      "Saldo Después": Number(item.saldoDespues),
    }));
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(filas, { header: [
      "Fecha Exclusión", "Caso", "Tipo Documento", "Documento", "Beneficiario", "Ley", "Periodo", "Concepto", "Motivo",
      "Total Recobro Original", "Saldo Inicial Importado", "Saldo Antes", "Valor Excluido", "Saldo Después",
    ] });
    hoja["!cols"] = [18, 29, 18, 18, 32, 18, 15, 32, 42, 25, 25, 19, 19, 19].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(libro, hoja, "Exclusiones");
    XLSX.writeFile(libro, `exclusiones_${desde || "inicio"}_${hasta || "fin"}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">Generación de reportes operativos, gerenciales y para entes de control</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileSpreadsheet className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-card-foreground">Informe mensual de exclusiones NO_PROCEDE</h2>
            <p className="text-xs text-muted-foreground mt-1">Consulta los conceptos excluidos del cobro según la fecha real de exclusión. Los datos se limitan a tu empresa.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="space-y-1"><label htmlFor="ex-desde" className="text-xs text-muted-foreground">Desde</label><Input id="ex-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div className="space-y-1"><label htmlFor="ex-hasta" className="text-xs text-muted-foreground">Hasta</label><Input id="ex-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Concepto</label><Select value={concepto} onValueChange={setConcepto}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{conceptos.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Motivo</label><Select value={motivo} onValueChange={setMotivo}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{motivos.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={consultar} disabled={consultando}>{consultando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Consultar</Button>
          <Button variant="outline" onClick={descargar} disabled={!reporte || reporte.data.length === 0}><Download className="w-4 h-4 mr-2" />Descargar Excel</Button>
        </div>
        {reporte && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex flex-wrap gap-4 text-sm"><span>Exclusiones: <strong>{reporte.resumen.totalExclusiones}</strong></span><span>Valor total excluido: <strong>{moneda(reporte.resumen.valorTotalExcluido)}</strong></span></div>
            {reporte.data.length === 0 ? <p className="text-sm text-muted-foreground">No hay exclusiones para los filtros seleccionados.</p> : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40"><tr>{["Fecha", "Beneficiario", "Ley", "Período", "Concepto", "Motivo", "Valor excluido", "Saldo después"].map((t) => <th key={t} className="p-3 text-left whitespace-nowrap">{t}</th>)}</tr></thead>
                  <tbody>{reporte.data.map((item) => <tr key={item.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{item.fechaExclusion.slice(0, 10)}</td>
                    <td className="p-3 whitespace-nowrap">{item.recobroCase.beneficiary.nombres} {item.recobroCase.beneficiary.apellidos}</td>
                    <td className="p-3 whitespace-nowrap">{item.recobroCase.ley}</td>
                    <td className="p-3">{item.recobroCase.periodo}</td>
                    <td className="p-3">{conceptos.find(([key]) => key === item.concepto)?.[1] ?? item.concepto}</td>
                    <td className="p-3">{motivos.find(([key]) => key === item.motivo)?.[1] ?? item.motivo}</td>
                    <td className="p-3 whitespace-nowrap">{moneda(Number(item.valorExcluido))}</td>
                    <td className="p-3 whitespace-nowrap">{moneda(Number(item.saldoDespues))}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportes.map((r, i) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow animate-fade-in flex flex-col justify-between" style={{ animationDelay: `${i * 40}ms` }}>
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {r.formato === "Excel" ? <FileSpreadsheet className="w-4 h-4 text-primary" /> : r.formato === "PDF" ? <FileText className="w-4 h-4 text-primary" /> : <BarChart3 className="w-4 h-4 text-primary" />}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tipoColors[r.tipo]}`}>{r.tipo}</span>
              </div>
              <h3 className="font-semibold text-sm text-card-foreground mb-1">{r.nombre}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.frecuencia}</span><span>Formato: <strong>{r.formato}</strong></span></div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">Referencia: {r.ultimoGenerado}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled title="Pendiente de integración con el backend"><Download className="w-3 h-3 mr-1" />Próximamente</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
