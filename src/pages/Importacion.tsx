import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  importarRecobrosExcel,
  type ImportRecobrosResponse,
} from "@/services/imports.service";

export default function Importacion() {
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportRecobrosResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const isExcel =
      selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls");

    if (!isExcel) {
      toast({
        title: "Archivo inválido",
        description: "Debes seleccionar un archivo Excel .xlsx o .xls.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setProgress(0);
    setProgressMessage("");
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona un archivo Excel antes de importar.",
        variant: "destructive",
      });
      return;
    }

    let progressInterval: number | undefined;

    try {
      setImporting(true);
      setResult(null);
      setProgress(5);
      setProgressMessage("Preparando archivo...");

      progressInterval = window.setInterval(() => {
        setProgress((currentProgress) => {
          if (currentProgress < 25) {
            setProgressMessage("Cargando archivo...");
            return Math.min(currentProgress + 5, 25);
          }

          if (currentProgress < 60) {
            setProgressMessage("Validando beneficiarios y casos...");
            return Math.min(currentProgress + 2, 60);
          }

          if (currentProgress < 80) {
            setProgressMessage("Creando movimientos y conceptos...");
            return Math.min(currentProgress + 1, 80);
          }

          if (currentProgress < 90) {
            setProgressMessage("Actualizando saldos...");
            return Math.min(currentProgress + 1, 90);
          }

          setProgressMessage("Finalizando importación...");
          return currentProgress;
        });
      }, 300);

      const response = await importarRecobrosExcel(file);

      if (progressInterval !== undefined) {
        window.clearInterval(progressInterval);
      }

      setProgress(100);
      setProgressMessage("Importación completada correctamente.");
      setResult(response);

      toast({
        title: "Importación finalizada",
        description: "El archivo fue procesado correctamente.",
      });
    } catch (error) {
      if (progressInterval !== undefined) {
        window.clearInterval(progressInterval);
      }

      setProgress(0);
      setProgressMessage("La importación no pudo completarse.");

      toast({
        title: "Error en la importación",
        description:
          error instanceof Error
            ? error.message
            : "No fue posible importar el archivo.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Importación de cartera
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Carga archivos Excel para crear beneficiarios, casos de recobro y saldos iniciales.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="border border-dashed border-border rounded-xl p-8 text-center bg-background">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-primary" />
          </div>

          <h2 className="font-semibold text-card-foreground">
            Selecciona el archivo de cartera
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Formatos permitidos: .xlsx o .xls
          </p>

          <div className="mt-5">
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="outline"
              onClick={() => document.getElementById("import-file")?.click()}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Seleccionar archivo
            </Button>
          </div>
        </div>

        {file && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />

                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "Importando..." : "Importar archivo"}
              </Button>
            </div>

            {(importing || progress > 0 || progressMessage) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {progressMessage}
                  </p>

                  <span className="text-xs font-semibold text-foreground">
                    {progress}%
                  </span>
                </div>

                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Progreso de importación"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Resultado de importación</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <ResultCard label="Filas procesadas" value={result.totalRows} />
            <ResultCard label="Beneficiarios creados" value={result.beneficiariesCreated} />
            <ResultCard label="Beneficiarios actualizados" value={result.beneficiariesUpdated} />
            <ResultCard label="Casos creados" value={result.casesCreated} />
            <ResultCard label="Movimientos creados" value={result.movementsCreated} />
            <ResultCard label="Conceptos procesados" value={result.movementDetailsCreated} />
          </div>

          <div className="rounded-lg bg-background border border-border p-3 text-sm text-muted-foreground">
            {result.message} · Empresa: {result.company}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Importante</p>
          <p className="text-sm text-muted-foreground">
            El archivo debe respetar la estructura esperada por SISREC. Si contiene casos duplicados
            o campos obligatorios vacíos, la importación será rechazada.
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}