import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Package, Factory } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { deleteOrder, updateOrder, STATUS_LABEL, type Order, type Status } from "@/lib/orders";

const statusStyles: Record<Status, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_producao: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

export function OrderCard({ order, onEdit }: { order: Order; onEdit: (o: Order) => void }) {
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{order.sequence}ª Ordem</span>
            {order.turno && <Badge variant="outline" className="text-[10px]">TURNO {order.turno}</Badge>}
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
          {order.total_pedido && <Info label="Total" value={order.total_pedido} />}
          {order.embalagem && <Info label="Embalagem" value={order.embalagem} className="col-span-2" />}
        </div>
        {order.observacao && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold">Obs.:</span> {order.observacao}
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
