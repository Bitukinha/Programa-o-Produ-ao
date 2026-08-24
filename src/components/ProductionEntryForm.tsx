import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addProductionEntry, type EmbalagemTipo, type Turno } from "@/lib/orders";

export function ProductionEntryForm({
  orderId,
  embalagemTipo,
  pesoUnitarioKg,
}: {
  orderId: string;
  embalagemTipo: EmbalagemTipo | null;
  pesoUnitarioKg: number | null;
}) {
  const qc = useQueryClient();
  const [turno, setTurno] = useState<Turno>("A");
  const [quantidade, setQuantidade] = useState(""); // sacos por palete (só usado para "saco")
  const [peso, setPeso] = useState("");
  const [lacre, setLacre] = useState("");

  const isSaco = embalagemTipo === "saco";
  const isBigbag = embalagemTipo === "bigbag";

  // Sugere o peso do palete com base no peso unitário do saco x quantidade informada.
  useEffect(() => {
    if (isBigbag) {
      setPeso(pesoUnitarioKg != null ? String(pesoUnitarioKg) : "");
    }
  }, [isBigbag, pesoUnitarioKg]);

  useEffect(() => {
    if (isSaco && pesoUnitarioKg != null && quantidade && Number(quantidade) > 0) {
      setPeso(String(Number(quantidade) * pesoUnitarioKg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantidade]);

  const reset = () => {
    setQuantidade("");
    setPeso(isBigbag && pesoUnitarioKg != null ? String(pesoUnitarioKg) : "");
    setLacre("");
  };

  const mutation = useMutation({
    mutationFn: () =>
      addProductionEntry({
        order_id: orderId,
        turno,
        quantidade: isSaco ? Number(quantidade) : 1,
        peso_kg: peso ? Number(peso) : null,
        lacre: lacre.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-entries"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Produção lançada");
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = isSaco
    ? Number(quantidade) > 0 && peso !== "" && Number(peso) > 0
    : peso !== "" && Number(peso) > 0 && lacre.trim() !== "";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <ClipboardList className="h-4 w-4" /> Apontar produção
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Turno</Label>
          <Select value={turno} onValueChange={(v) => setTurno(v as Turno)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Turno A</SelectItem>
              <SelectItem value="B">Turno B</SelectItem>
              <SelectItem value="C">Turno C</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSaco && (
          <div className="space-y-1.5">
            <Label>Sacos no palete</Label>
            <Input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 50"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{isSaco ? "Peso do palete (kg)" : "Peso do bag (kg)"}</Label>
          <Input
            type="number"
            min={0}
            step="0.1"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Ex: 1000"
          />
        </div>

        {!isSaco && (
          <div className="col-span-2 space-y-1.5">
            <Label>Lacre</Label>
            <Input
              value={lacre}
              onChange={(e) => setLacre(e.target.value)}
              placeholder="Nº do lacre"
            />
          </div>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!canSubmit || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Salvando..." : isSaco ? "Confirmar palete" : "Confirmar bag"}
      </Button>
    </div>
  );
}
