import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sectorSchema = z.enum(["extrusora", "moagem"]);
const statusSchema = z.enum(["pendente", "em_producao", "concluida"]);
const embalagemTipoSchema = z.enum(["bigbag", "saco"]);

const orderInsertSchema = z.object({
  cliente: z.string().min(1),
  produto: z.string().min(1),
  sector: sectorSchema,
  sequence: z.number().int().optional(),
  op_number: z.string().nullable().optional(),
  peneira: z.string().nullable().optional(),
  linha_envase: z.string().nullable().optional(),
  total_pedido: z.string().nullable().optional(),
  embalagem_tipo: embalagemTipoSchema.nullable().optional(),
  peso_unitario_kg: z.number().nullable().optional(),
  quantidade_total: z.number().int().nullable().optional(),
  observacao: z.string().nullable().optional(),
  status: statusSchema.optional(),
});

const orderUpdateSchema = orderInsertSchema.partial();

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { pool } = await import("../db.server");
  const { rows } = await pool.query(
    `SELECT * FROM production_orders ORDER BY sector ASC, sequence ASC`,
  );
  return rows;
});

export const insertOrder = createServerFn({ method: "POST" })
  .validator(orderInsertSchema)
  .handler(async ({ data }) => {
    const { pool } = await import("../db.server");
    const columns = Object.keys(data) as Array<keyof typeof data>;
    const values = columns.map((key) => data[key]);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    await pool.query(
      `INSERT INTO production_orders (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
      values,
    );
  });

export const updateOrder = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), patch: orderUpdateSchema }))
  .handler(async ({ data }) => {
    const { pool } = await import("../db.server");
    const columns = Object.keys(data.patch) as Array<keyof typeof data.patch>;
    if (columns.length === 0) return;
    const assignments = columns.map((key, i) => `${key} = $${i + 1}`);
    const values = columns.map((key) => data.patch[key]);
    await pool.query(
      `UPDATE production_orders SET ${assignments.join(", ")} WHERE id = $${columns.length + 1}`,
      [...values, data.id],
    );
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { pool } = await import("../db.server");
    await pool.query(`DELETE FROM production_orders WHERE id = $1`, [data.id]);
  });
