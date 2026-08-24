import { Link } from "@tanstack/react-router";
import { Package, Factory } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  EMBALAGEM_LABEL,
  EMBALAGEM_UNIT_LABEL,
  STATUS_LABEL,
  type Order,
  type ProductionEntry,
  type Status,
} from "@/lib/orders";

const statusStyles: Record<Status, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_producao: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

export function OrderCard({ order, entries }: { order: Order; entries: ProductionEntry[] }) {
  const orderEntries = entries.filter((e) => e.order_id === order.id);
  const produzido = orderEntries
    .filter((e) => !e.bloqueado)
    .reduce((sum, e) => sum + e.quantidade, 0);
  const meta = order.quantidade_total ?? null;
  const pct = meta ? Math.min(100, Math.round((produzido / meta) * 100)) : null;
  const unit = order.embalagem_tipo ? EMBALAGEM_UNIT_LABEL[order.embalagem_tipo] : "unidades";

  return (
    <Link to="/ordens/$id" params={{ id: order.id }} className="block">
      <Card className="overflow-hidden h-full transition-colors hover:border-primary/50 hover:bg-accent/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {order.sequence}ª Ordem
            </span>
            <h3 className="font-semibold text-lg leading-tight">{order.cliente}</h3>
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
            <Info
              icon={<Package className="h-3.5 w-3.5" />}
              label="Produto"
              value={order.produto}
            />
            {order.linha_envase && (
              <Info
                icon={<Factory className="h-3.5 w-3.5" />}
                label="Linha de envase"
                value={order.linha_envase}
              />
            )}
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
                  Produzido: {produzido}
                  {meta ? ` / ${meta}` : ""} {unit}
                </span>
                {pct !== null && <span className="font-semibold">{pct}%</span>}
              </div>
              {meta && <Progress value={pct ?? 0} />}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
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
