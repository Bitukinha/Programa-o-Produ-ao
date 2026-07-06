import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Factory, Wheat, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { OrderCard } from "@/components/OrderCard";
import { OrderFormDialog } from "@/components/OrderFormDialog";
import { fetchOrders, SECTOR_LABEL, type Order, type Sector } from "@/lib/orders";
import { generateProductionPdf } from "@/lib/generate-pdf";
import logoAsset from "@/assets/nutrimilho-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Programação de Produção" },
      { name: "description", content: "Gerenciamento de Ordens de Produção - Extrusora e Moagem." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: orders, isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [defaultSector, setDefaultSector] = useState<Sector>("extrusora");

  const openNew = (sector: Sector) => {
    setEditing(null);
    setDefaultSector(sector);
    setDialogOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    setDefaultSector(order.sector);
    setDialogOpen(true);
  };

  const bySector = (s: Sector) => (orders ?? []).filter((o) => o.sector === s);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src={logoAsset.url} alt="Nutrimilho" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Programação de Produção</h1>
              <p className="text-sm text-muted-foreground mt-1">Gerencie as ordens de Extrusora e Moagem.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                if (!orders || orders.length === 0) {
                  toast.error("Nenhuma ordem para exportar");
                  return;
                }
                try {
                  await generateProductionPdf(orders);
                  toast.success("PDF gerado com sucesso");
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <FileDown className="h-4 w-4 mr-2" /> Gerar PDF
            </Button>
            <Button onClick={() => openNew("extrusora")} size="lg">
              <Plus className="h-4 w-4 mr-2" /> Nova Ordem
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          (["extrusora", "moagem"] as Sector[]).map((sector) => {
            const list = bySector(sector);
            const Icon = sector === "extrusora" ? Factory : Wheat;
            return (
              <section key={sector}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{SECTOR_LABEL[sector]} — Produção</h2>
                      <p className="text-xs text-muted-foreground">{list.length} ordem(ns)</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openNew(sector)}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                    Nenhuma ordem cadastrada.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((o) => <OrderCard key={o.id} order={o} onEdit={openEdit} />)}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      <OrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editing}
        defaultSector={defaultSector}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
}
