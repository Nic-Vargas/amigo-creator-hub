import { DollarSign, Users, FileText, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import KpiCard from "@/components/KpiCard";
import { kpis, saldosPorConcepto, casosRecobro, CONCEPTOS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

const chartData = saldosPorConcepto.map((s) => ({
  name: s.nombreConcepto.length > 14 ? s.nombreConcepto.slice(0, 14) + "…" : s.nombreConcepto,
  saldo: s.saldo,
  reintegrado: s.totalReintegrado,
}));

const pieData = [
  { name: "En gestión", value: 2, fill: "hsl(210, 80%, 55%)" },
  { name: "Abierto", value: 1, fill: "hsl(38, 92%, 50%)" },
  { name: "Acuerdo", value: 1, fill: "hsl(160, 60%, 40%)" },
  { name: "En pago", value: 1, fill: "hsl(215, 60%, 22%)" },
];

const estadoColors: Record<string, string> = {
  Abierto: "bg-warning/15 text-warning border-warning/30",
  "En gestión": "bg-info/15 text-info border-info/30",
  Acuerdo: "bg-accent/15 text-accent border-accent/30",
  "En pago": "bg-primary/15 text-primary border-primary/30",
  Cerrado: "bg-muted text-muted-foreground border-border",
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de cartera y recobros — FOSFEC
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Cartera Total"
          value={formatCurrency(kpis.carteraTotal)}
          icon={DollarSign}
          variant="default"
          delay={0}
        />
        <KpiCard
          title="Beneficiarios"
          value={kpis.beneficiariosActivos.toString()}
          subtitle="Activos"
          icon={Users}
          variant="default"
          delay={50}
        />
        <KpiCard
          title="Casos Abiertos"
          value={kpis.casosAbiertos.toString()}
          icon={FileText}
          variant="accent"
          delay={100}
        />
        <KpiCard
          title="Recaudo Mes"
          value={formatCurrency(kpis.recaudoMes)}
          icon={TrendingUp}
          trend={{ value: "12.4%", positive: true }}
          variant="accent"
          delay={150}
        />
        <KpiCard
          title="Tasa Recuperación"
          value={`${kpis.tasaRecuperacion}%`}
          icon={CheckCircle}
          variant="default"
          delay={200}
        />
        <KpiCard
          title="Casos Críticos"
          value={kpis.casosCriticos.toString()}
          subtitle="Prioridad alta"
          icon={AlertTriangle}
          variant="destructive"
          delay={250}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Saldo por Concepto</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 14%, 46%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 14%, 46%)" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(214, 20%, 90%)" }}
                />
                <Bar dataKey="saldo" name="Saldo" fill="hsl(215, 60%, 22%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reintegrado" name="Reintegrado" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Estado de Casos</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-card-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent cases table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">Casos de Recobro Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Caso</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficiario</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Conceptos</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridad</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {casosRecobro.map((caso) => (
                <tr key={caso.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-mono text-xs font-medium">{caso.id}</td>
                  <td className="p-3 font-medium">{caso.beneficiarioNombre}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {caso.conceptos.map((c) => {
                        const concepto = CONCEPTOS.find((x) => x.id === c);
                        return (
                          <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {concepto?.nombre || c}
                          </Badge>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-medium">{formatCurrency(caso.valorTotal)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${estadoColors[caso.estado]}`}>
                      {caso.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={caso.prioridad === "Alta" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {caso.prioridad}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{caso.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
