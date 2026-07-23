import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createOrder,
  updateOrder,
  EMBALAGEM_LABEL,
  PESO_PRESETS,
  type EmbalagemTipo,
  type Order,
  type OrderInsert,
  type Sector,
  type Status,
} from "@/lib/orders";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  defaultSector?: Sector;
}

const empty = (sector: Sector): OrderInsert => ({
  sector,
  sequence: 1,
  cliente: "",
  produto: "",
  op_number: "",
  peneira: "",
  linha_envase: "",
  total_pedido: "",
  embalagem_tipo: null,
  peso_unitario_kg: null,
  quantidade_total: null,
  observacao: "",
  status: "pendente",
});

export function OrderFormDialog({ open, onOpenChange, order, defaultSector = "extrusora" }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<OrderInsert>(empty(defaultSector));
  const [pesoCustom, setPesoCustom] = useState(false);

  useEffect(() => {
    if (order) {
      setForm({
        sector: order.sector,
        sequence: order.sequence,
        cliente: order.cliente,
        produto: order.produto,
        op_number: order.op_number ?? "",
        peneira: order.peneira ?? "",
        linha_envase: order.linha_envase ?? "",
        total_pedido: order.total_pedido ?? "",
        embalagem_tipo: order.embalagem_tipo ?? null,
        peso_unitario_kg: order.peso_unitario_kg ?? null,
        quantidade_total: order.quantidade_total ?? null,
        observacao: order.observacao ?? "",
        status: order.status,
      });
      setPesoCustom(
        order.embalagem_tipo != null &&
          order.peso_unitario_kg != null &&
          !PESO_PRESETS[order.embalagem_tipo].includes(order.peso_unitario_kg),
      );
    } else {
      setForm(empty(defaultSector));
      setPesoCustom(false);
    }
  }, [order, defaultSector, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (order) await updateOrder(order.id, form);
      else await createOrder(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(order ? "Ordem atualizada" : "Ordem criada");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof OrderInsert>(k: K, v: OrderInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const pesoOptions = form.embalagem_tipo ? PESO_PRESETS[form.embalagem_tipo] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Editar Ordem" : "Nova Ordem de Produção"}</DialogTitle>
          <DialogDescription>Preencha os dados da OP.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={form.sector} onValueChange={(v) => set("sector", v as Sector)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="extrusora">Extrusora</SelectItem>
                <SelectItem value="moagem">Moagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sequência (Nº da Ordem)</Label>
            <Input
              type="number"
              min={1}
              value={form.sequence ?? 1}
              onChange={(e) => set("sequence", Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>OP Nº</Label>
            <Input value={form.op_number ?? ""} onChange={(e) => set("op_number", e.target.value)} placeholder="14889 ou SN" />
          </div>
          <div className="space-y-2">
            <Label>Peneira</Label>
            <Input value={form.peneira ?? ""} onChange={(e) => set("peneira", e.target.value)} placeholder="0.3" />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Cliente *</Label>
            <Input required value={form.cliente} onChange={(e) => set("cliente", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Produto *</Label>
            <Input required value={form.produto} onChange={(e) => set("produto", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Linha de envase</Label>
            <Input value={form.linha_envase ?? ""} onChange={(e) => set("linha_envase", e.target.value)} />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Total do Pedido (descrição)</Label>
            <Input value={form.total_pedido ?? ""} onChange={(e) => set("total_pedido", e.target.value)} placeholder="40 BIG BAGS DE 800KG" />
          </div>

          <div className="space-y-2">
            <Label>Embalagem</Label>
            <Select
              value={form.embalagem_tipo ?? ""}
              onValueChange={(v) => {
                const tipo = v as EmbalagemTipo;
                set("embalagem_tipo", tipo);
                setPesoCustom(false);
                set("peso_unitario_kg", PESO_PRESETS[tipo][0]);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bigbag">{EMBALAGEM_LABEL.bigbag}</SelectItem>
                <SelectItem value="saco">{EMBALAGEM_LABEL.saco}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Peso unitário (kg)</Label>
            {!pesoCustom ? (
              <Select
                value={form.peso_unitario_kg != null ? String(form.peso_unitario_kg) : ""}
                onValueChange={(v) => {
                  if (v === "outro") {
                    setPesoCustom(true);
                    set("peso_unitario_kg", null);
                  } else {
                    set("peso_unitario_kg", Number(v));
                  }
                }}
                disabled={!form.embalagem_tipo}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {pesoOptions.map((p) => (
                    <SelectItem key={p} value={String(p)}>{p} kg</SelectItem>
                  ))}
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                min={1}
                autoFocus
                value={form.peso_unitario_kg ?? ""}
                onChange={(e) => set("peso_unitario_kg", e.target.value ? Number(e.target.value) : null)}
                placeholder="Peso em kg"
              />
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Quantidade total ({form.embalagem_tipo === "saco" ? "sacos" : "big bags"})</Label>
            <Input
              type="number"
              min={1}
              value={form.quantidade_total ?? ""}
              onChange={(e) => set("quantidade_total", e.target.value ? Number(e.target.value) : null)}
              placeholder="Meta a ser produzida"
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Status</Label>
            <Select value={form.status ?? "pendente"} onValueChange={(v) => set("status", v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_producao">Em produção</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao ?? ""} onChange={(e) => set("observacao", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.cliente || !form.produto}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
