import { listOrders, insertOrder, updateOrder as updateOrderFn, deleteOrder as deleteOrderFn } from "@/lib/api/orders.functions";

export type Sector = "extrusora" | "moagem";
export type Status = "pendente" | "em_producao" | "concluida";

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
  embalagem: string | null;
  observacao: string | null;
  status: Status;
  turno: string | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at" | "sequence" | "status"> & {
  sequence?: number;
  status?: Status;
};

export type OrderUpdate = Partial<OrderInsert>;

export const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  em_producao: "Em produção",
  concluida: "Concluída",
};

export const SECTOR_LABEL: Record<Sector, string> = {
  extrusora: "Extrusora",
  moagem: "Moagem",
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
