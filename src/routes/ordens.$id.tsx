import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileDown,
  Package,
  Factory,
  Loader2,
  X,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { OrderFormDialog } from "@/components/OrderFormDialog";
import { ProductionEntryForm } from "@/components/ProductionEntryForm";
import {
  fetchOrders,
  fetchProductionEntries,
  deleteOrder,
  deleteProductionEntry,
  blockProductionEntry,
  unblockProductionEntry,
  updateOrder,
  EMBALAGEM_LABEL,
  EMBALAGEM_UNIT_LABEL,
  STATUS_LABEL,
  SECTOR_LABEL,
  type Status,
} from "@/lib/orders";
import { fetchAuthStatus } from "@/lib/auth";
import { generateOrderPdf } from "@/lib/generate-pdf";

const statusStyles: Record<Status, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_producao: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

export const Route = createFileRoute("/ordens/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const { data: orders, isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
  const { data: entries } = useQuery({
    queryKey: ["production-entries"],
    queryFn: fetchProductionEntries,
  });
  const { data: auth } = useQuery({ queryKey: ["auth"], queryFn: fetchAuthStatus });
  const isPcp = auth?.isPcp ?? false;
  const isQualidade = auth?.isQualidade ?? false;

  const order = orders?.find((o) => o.id === id) ?? null;
  const orderEntries = (entries ?? [])
    .filter((e) => e.order_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const setStatus = useMutation({
    mutationFn: (status: Status) => updateOrder(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Ordem removida");
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delEntry = useMutation({
    mutationFn: (entryId: string) => deleteProductionEntry(entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-entries"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Lançamento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const block = useMutation({
    mutationFn: () => blockProductionEntry(blockTarget as string, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-entries"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Lançamento bloqueado");
      setBlockTarget(null);
      setMotivo("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unblock = useMutation({
    mutationFn: (entryId: string) => unblockProductionEntry(entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-entries"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Lançamento desbloqueado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">Ordem não encontrada.</p>
        <Button asChild>
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    );
  }

  const produzido = orderEntries
    .filter((e) => !e.bloqueado)
    .reduce((sum, e) => sum + e.quantidade, 0);
  const meta = order.quantidade_total ?? null;
  const pct = meta ? Math.min(100, Math.round((produzido / meta) * 100)) : null;
  const unit = order.embalagem_tipo ? EMBALAGEM_UNIT_LABEL[order.embalagem_tipo] : "unidades";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {SECTOR_LABEL[order.sector]} · {order.sequence}ª Ordem
            </p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary truncate">
              {order.cliente}
            </h1>
          </div>
          <Badge variant="outline" className={statusStyles[order.status]}>
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da OP</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Info label="OP Nº" value={order.op_number || "—"} />
              <Info label="Peneira" value={order.peneira || "—"} />
              <Info
                icon={<Package className="h-3.5 w-3.5" />}
                label="Produto"
                value={order.produto}
              />
              <Info
                icon={<Factory className="h-3.5 w-3.5" />}
                label="Linha de envase"
                value={order.linha_envase || "—"}
              />
              <Info
                className="col-span-2"
                label="Total do pedido"
                value={order.total_pedido || "—"}
              />
              <Info
                label="Embalagem"
                value={
                  order.embalagem_tipo
                    ? `${EMBALAGEM_LABEL[order.embalagem_tipo]}${order.peso_unitario_kg ? ` de ${order.peso_unitario_kg}kg` : ""}`
                    : "—"
                }
              />
              {meta && <Info label="Meta" value={`${meta} ${unit}`} />}
              {order.observacao && (
                <div className="col-span-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold">Obs.:</span> {order.observacao}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de produção</CardTitle>
            </CardHeader>
            <CardContent>
              {orderEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento registrado ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {orderEntries.map((e) => (
                    <div
                      key={e.id}
                      className={
                        e.bloqueado
                          ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
                          : "rounded-md bg-muted/40 px-3 py-2 text-sm"
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            TURNO {e.turno}
                          </Badge>
                          <span className="font-medium">
                            {e.quantidade} {unit}
                          </span>
                          {e.peso_kg != null && (
                            <span className="text-muted-foreground">· {e.peso_kg} kg</span>
                          )}
                          {e.lacre && (
                            <span className="text-muted-foreground">· Lacre {e.lacre}</span>
                          )}
                          {e.bloqueado && (
                            <Badge variant="destructive" className="text-[10px]">
                              BLOQUEADO
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                          <span className="text-xs">
                            {new Date(e.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isQualidade &&
                            (e.bloqueado ? (
                              <button
                                onClick={() => unblock.mutate(e.id)}
                                className="hover:text-primary"
                                aria-label="Desbloquear lançamento"
                                title="Desbloquear"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setBlockTarget(e.id)}
                                className="hover:text-destructive"
                                aria-label="Bloquear lançamento"
                                title="Bloquear"
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          <button
                            onClick={() => delEntry.mutate(e.id)}
                            className="hover:text-destructive"
                            aria-label="Remover lançamento"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {e.bloqueado && e.motivo_bloqueio && (
                        <p className="mt-1 text-xs text-destructive">Motivo: {e.motivo_bloqueio}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(meta || produzido > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Produzido: {produzido}
                    {meta ? ` / ${meta}` : ""} {unit}
                  </span>
                  {pct !== null && <span className="font-semibold">{pct}%</span>}
                </div>
                {meta && <Progress value={pct ?? 0} />}
              </CardContent>
            </Card>
          )}

          <ProductionEntryForm
            orderId={order.id}
            embalagemTipo={order.embalagem_tipo}
            pesoUnitarioKg={order.peso_unitario_kg}
          />

          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => generateOrderPdf(order, orderEntries)}
              >
                <FileDown className="h-4 w-4 mr-2" /> Gerar PDF
              </Button>

              {isPcp && (
                <>
                  <div className="space-y-1.5">
                    <Select
                      value={order.status}
                      onValueChange={(v) => setStatus.mutate(v as Status)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_producao">Em produção</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover ordem?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate()}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {isPcp && (
        <OrderFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          order={order}
          defaultSector={order.sector}
        />
      )}

      <Dialog
        open={blockTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBlockTarget(null);
            setMotivo("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear lançamento</DialogTitle>
            <DialogDescription>
              Informe o motivo do bloqueio. Ele deixará de contar na meta da OP até ser
              desbloqueado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: peso fora do padrão, lacre violado, etc."
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!motivo.trim() || block.isPending}
              onClick={() => block.mutate()}
            >
              {block.isPending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}) {
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
