import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addProductionEntry, EMBALAGEM_UNIT_LABEL, type EmbalagemTipo, type Turno } from "@/lib/orders";

export function ProductionEntryForm({
  orderId,
  embalagemTipo,
}: {
  orderId: string;
  embalagemTipo: EmbalagemTipo | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [turno, setTurno] = useState<Turno>("A");
  const [quantidade, setQuantidade] = useState("");

  const mutation = useMutation({
    mutationFn: () => addProductionEntry({ order_id: orderId, turno, quantidade: Number(quantidade) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-entries"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Produção lançada");
      setQuantidade("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unit = embalagemTipo ? EMBALAGEM_UNIT_LABEL[embalagemTipo] : "unidades";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-4 w-4 mr-1" /> Lançar produção
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3">
        <div className="space-y-2">
          <Label>Turno</Label>
          <Select value={turno} onValueChange={(v) => setTurno(v as Turno)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Turno A</SelectItem>
              <SelectItem value="B">Turno B</SelectItem>
              <SelectItem value="C">Turno C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantidade produzida ({unit})</Label>
          <Input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex: 10"
          />
        </div>
        <Button
          className="w-full"
          size="sm"
          disabled={!quantidade || Number(quantidade) <= 0 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Salvando..." : "Confirmar"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
