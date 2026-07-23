import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const turnoSchema = z.enum(["A", "B", "C"]);

const entryInsertSchema = z.object({
  order_id: z.string().uuid(),
  turno: turnoSchema,
  quantidade: z.number().int().positive(),
});

export const listProductionEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { pool } = await import("../db.server");
  const { rows } = await pool.query(`SELECT * FROM production_entries ORDER BY created_at ASC`);
  return rows;
});

export const insertProductionEntry = createServerFn({ method: "POST" })
  .validator(entryInsertSchema)
  .handler(async ({ data }) => {
    const { pool } = await import("../db.server");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO production_entries (order_id, turno, quantidade) VALUES ($1, $2, $3)`,
        [data.order_id, data.turno, data.quantidade],
      );
      const { rows } = await client.query(
        `SELECT
           o.quantidade_total,
           o.status,
           COALESCE(SUM(e.quantidade), 0) AS produced
         FROM production_orders o
         LEFT JOIN production_entries e ON e.order_id = o.id
         WHERE o.id = $1
         GROUP BY o.id`,
        [data.order_id],
      );
      const order = rows[0];
      if (
        order &&
        order.quantidade_total != null &&
        order.status !== "concluida" &&
        Number(order.produced) >= Number(order.quantidade_total)
      ) {
        await client.query(`UPDATE production_orders SET status = 'concluida' WHERE id = $1`, [data.order_id]);
      }
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
