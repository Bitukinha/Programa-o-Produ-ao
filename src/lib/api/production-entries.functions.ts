import { createServerFn } from "@tanstack/react-start";
import type { PoolClient } from "pg";
import { z } from "zod";

const turnoSchema = z.enum(["A", "B", "C"]);

const entryInsertSchema = z.object({
  order_id: z.string().uuid(),
  turno: turnoSchema,
  quantidade: z.number().int().positive(),
  peso_kg: z.number().positive().nullable().optional(),
  lacre: z.string().trim().min(1).nullable().optional(),
});

// Blocked entries don't count toward the produced total, so an order can
// cross the goal (or drop back below it) as entries are blocked/unblocked.
async function recalcOrderStatus(client: PoolClient, orderId: string) {
  const { rows } = await client.query(
    `SELECT
       o.quantidade_total,
       o.status,
       COALESCE(SUM(e.quantidade) FILTER (WHERE NOT e.bloqueado), 0) AS produced
     FROM production_orders o
     LEFT JOIN production_entries e ON e.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id`,
    [orderId],
  );
  const order = rows[0];
  if (!order || order.quantidade_total == null) return;
  const reachedGoal = Number(order.produced) >= Number(order.quantidade_total);
  if (reachedGoal && order.status !== "concluida") {
    await client.query(`UPDATE production_orders SET status = 'concluida' WHERE id = $1`, [
      orderId,
    ]);
  } else if (!reachedGoal && order.status === "concluida") {
    await client.query(`UPDATE production_orders SET status = 'em_producao' WHERE id = $1`, [
      orderId,
    ]);
  }
}

export const listProductionEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { pool } = await import("../db.server");
  const { rows } = await pool.query(`SELECT * FROM production_entries ORDER BY created_at ASC`);
  return rows.map((r) => ({
    ...r,
    peso_kg: r.peso_kg === null ? null : Number(r.peso_kg),
  }));
});

export const insertProductionEntry = createServerFn({ method: "POST" })
  .validator(entryInsertSchema)
  .handler(async ({ data }) => {
    const { pool } = await import("../db.server");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO production_entries (order_id, turno, quantidade, peso_kg, lacre) VALUES ($1, $2, $3, $4, $5)`,
        [data.order_id, data.turno, data.quantidade, data.peso_kg ?? null, data.lacre ?? null],
      );
      await recalcOrderStatus(client, data.order_id);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

export const deleteProductionEntry = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { pool } = await import("../db.server");
    await pool.query(`DELETE FROM production_entries WHERE id = $1`, [data.id]);
  });

export const blockProductionEntry = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), motivo: z.string().trim().min(1) }))
  .handler(async ({ data }) => {
    const { requireQualidade } = await import("../auth.server");
    await requireQualidade();
    const { pool } = await import("../db.server");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `UPDATE production_entries SET bloqueado = true, motivo_bloqueio = $2 WHERE id = $1 RETURNING order_id`,
        [data.id, data.motivo],
      );
      if (rows[0]) await recalcOrderStatus(client, rows[0].order_id);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

export const unblockProductionEntry = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireQualidade } = await import("../auth.server");
    await requireQualidade();
    const { pool } = await import("../db.server");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `UPDATE production_entries SET bloqueado = false, motivo_bloqueio = NULL WHERE id = $1 RETURNING order_id`,
        [data.id],
      );
      if (rows[0]) await recalcOrderStatus(client, rows[0].order_id);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });
