import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Package, Factory, FileDown, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductionEntryForm } from "@/components/ProductionEntryForm";
import {
  deleteOrder,
  deleteProductionEntry,
  updateOrder,
  EMBALAGEM_LABEL,
  EMBALAGEM_UNIT_LABEL,
  STATUS_LABEL,
  type Order,
  type ProductionEntry,
  type Status,
} from "@/lib/orders";
import { generateOrderPdf } from "@/lib/generate-pdf";

const statusStyles: Record<Status, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_producao: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

export function OrderCard({
  order,
  entries,
  onEdit,
}: {
  order: Order;
  entries: ProductionEntry[];
  onEdit: (o: Order) => void;
}) {
  const qc = useQueryClient();

  const setStatus = useMutation({
    mutationFn: (status: Status) => updateOrder(order.id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteOrder(order.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Ordem removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delEntry = useMutation({
    mutationFn: (id: string) => deleteProductionEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-entries"] });
      toast.success("Lançamento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orderEntries = entries
    .filter((e) => e.order_id === order.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const produzido = orderEntries.reduce((sum, e) => sum + e.quantidade, 0);
  const meta = order.quantidade_total ?? null;
  const pct = meta ? Math.min(100, Math.round((produzido / meta) * 100)) : null;
  const unit = order.embalagem_tipo ? EMBALAGEM_UNIT_LABEL[order.embalagem_tipo] : "unidades";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{order.sequence}ª Ordem</span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg leading-tight">{order.cliente}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            OP Nº <span className="font-mono">{order.op_number || "—"}</span>
          </p>
        </div>
        <Badge variant="outline" className={statusStyles[order.status]}>
          {STATUS_LABEL[order.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info icon={<Package className="h-3.5 w-3.5" />} label="Produto" value={order.produto} />
          {order.peneira && <Info label="Peneira" value={order.peneira} />}
          {order.linha_envase && <Info icon={<Factory className="h-3.5 w-3.5" />} label="Linha de envase" value={order.linha_envase} />}
          {order.total_pedido && <Info label="Total" value={order.total_pedido} className="col-span-2" />}
          {order.embalagem_tipo && (
            <Info
              label="Embalagem"
              value={`${EMBALAGEM_LABEL[order.embalagem_tipo]}${order.peso_unitario_kg ? ` de ${order.peso_unitario_kg}kg` : ""}`}
            />
          )}
          {meta && <Info label="Meta" value={`${meta} ${unit}`} />}
        </div>

        {(meta || produzido > 0) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Produzido: {produzido}{meta ? ` / ${meta}` : ""} {unit}
              </span>
              {pct !== null && <span className="font-semibold">{pct}%</span>}
            </div>
            {meta && <Progress value={pct ?? 0} />}
          </div>
        )}

        {order.observacao && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold">Obs.:</span> {order.observacao}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
          <ProductionEntryForm orderId={order.id} embalagemTipo={order.embalagem_tipo} />
          <Button size="sm" variant="outline" onClick={() => generateOrderPdf(order, orderEntries)}>
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>

        {orderEntries.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Histórico de produção</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {orderEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">TURNO {e.turno}</Badge>
                    <span>{e.quantidade} {unit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{new Date(e.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <button
                      onClick={() => delEntry.mutate(e.id)}
                      className="hover:text-destructive"
                      aria-label="Remover lançamento"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Select value={order.status} onValueChange={(v) => setStatus.mutate(v as Status)}>
            <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_producao">Em produção</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" onClick={() => onEdit(order)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover ordem?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => del.mutate()}>Remover</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({
  label,
  value,
  icon,
  className,
}: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
