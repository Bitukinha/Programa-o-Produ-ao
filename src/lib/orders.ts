import {
  listOrders,
  insertOrder,
  updateOrder as updateOrderFn,
  deleteOrder as deleteOrderFn,
} from "@/lib/api/orders.functions";
import {
  listProductionEntries,
  insertProductionEntry,
  deleteProductionEntry as deleteProductionEntryFn,
} from "@/lib/api/production-entries.functions";

export type Sector = "extrusora" | "moagem";
export type Status = "pendente" | "em_producao" | "concluida";
export type EmbalagemTipo = "bigbag" | "saco";
export type Turno = "A" | "B" | "C";

export type Order = {
  id: string;
  sector: Sector;
  sequence: number;
  op_number: string | null;
  peneira: string | null;
  cliente: string;
  produto: string;
  linha_envase: string | null;
  total_pedido: string | null;
  embalagem_tipo: EmbalagemTipo | null;
  peso_unitario_kg: number | null;
  quantidade_total: number | null;
  observacao: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
};

export type OrderInsert = Omit<
  Order,
  "id" | "created_at" | "updated_at" | "sequence" | "status"
> & {
  sequence?: number;
  status?: Status;
};

export type OrderUpdate = Partial<OrderInsert>;

export type ProductionEntry = {
  id: string;
  order_id: string;
  turno: Turno;
  quantidade: number;
  peso_kg: number | null;
  lacre: string | null;
  created_at: string;
};

export const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  em_producao: "Em produção",
  concluida: "Concluída",
};

export const SECTOR_LABEL: Record<Sector, string> = {
  extrusora: "Extrusora",
  moagem: "Moagem",
};

export const EMBALAGEM_LABEL: Record<EmbalagemTipo, string> = {
  bigbag: "Big Bag",
  saco: "Saco",
};

export const EMBALAGEM_UNIT_LABEL: Record<EmbalagemTipo, string> = {
  bigbag: "big bags",
  saco: "sacos",
};

export const PESO_PRESETS: Record<EmbalagemTipo, number[]> = {
  bigbag: [800, 1000],
  saco: [20, 25],
};

export async function fetchOrders(): Promise<Order[]> {
  return listOrders();
}

export async function createOrder(input: OrderInsert) {
  await insertOrder({ data: input });
}

export async function updateOrder(id: string, patch: OrderUpdate) {
  await updateOrderFn({ data: { id, patch } });
}

export async function deleteOrder(id: string) {
  await deleteOrderFn({ data: { id } });
}

export async function fetchProductionEntries(): Promise<ProductionEntry[]> {
  return listProductionEntries();
}

export async function addProductionEntry(input: {
  order_id: string;
  turno: Turno;
  quantidade: number;
  peso_kg?: number | null;
  lacre?: string | null;
}) {
  await insertProductionEntry({ data: input });
}

export async function deleteProductionEntry(id: string) {
  await deleteProductionEntryFn({ data: { id } });
}
