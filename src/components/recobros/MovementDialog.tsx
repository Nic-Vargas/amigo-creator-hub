import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Concepto = {
  key: "SALUD" | "PENSION" | "CUOTA_MONETARIA" | "TRANSFERENCIA_ECONOMICA";
  label: string;
  saldo: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recobroCaseId: string | null;
  conceptos: Concepto[];
  onSuccess: () => Promise<void>;
};

export default function MovementDialog({
  open,
  onOpenChange,
  recobroCaseId,
  conceptos,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (concepto: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [concepto]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!recobroCaseId) return;

    const movimientos = conceptos
      .map((concepto) => ({
        concepto: concepto.key,
        valor: Number(values[concepto.key] || 0),
      }))
      .filter((m) => m.valor > 0);

    if (movimientos.length === 0) {
      toast({
        title: "Sin valores",
        description: "Debes ingresar al menos un valor mayor a cero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      for (const movimiento of movimientos) {
        await apiFetch("/movimientos", {
          method: "POST",
          body: JSON.stringify({
            recobroCaseId,
            tipo: "REINTEGRO",
            concepto: movimiento.concepto,
            valor: movimiento.valor,
            descripcion: "Pago registrado desde Recobros",
          }),
        });
      }

      toast({
        title: "Movimiento registrado",
        description: "El pago fue registrado correctamente.",
      });

      setValues({});
      onOpenChange(false);
      await onSuccess();
    } catch (error) {
      toast({
        title: "Error registrando movimiento",
        description:
          error instanceof Error
            ? error.message
            : "No fue posible registrar el movimiento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {conceptos.map((concepto) => (
            <div key={concepto.key} className="grid grid-cols-2 gap-3 items-center">
              <div>
                <p className="text-sm font-medium">{concepto.label}</p>
                <p className="text-xs text-muted-foreground">
                  Saldo actual: {concepto.saldo.toLocaleString("es-CO")}
                </p>
              </div>

              <Input
                type="number"
                min={0}
                max={concepto.saldo}
                value={values[concepto.key] ?? ""}
                onChange={(e) => handleChange(concepto.key, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar movimiento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}