-- Adds packaging/target fields to production_orders and a per-shift
-- production ledger (production_entries) used to compute progress and
-- auto-complete an order once its target quantity is reached.
-- Additive only: existing columns/data are untouched.

CREATE TYPE production_embalagem_tipo AS ENUM ('bigbag', 'saco');
CREATE TYPE production_turno AS ENUM ('A', 'B', 'C');

ALTER TABLE production_orders
  ADD COLUMN embalagem_tipo production_embalagem_tipo,
  ADD COLUMN peso_unitario_kg NUMERIC,
  ADD COLUMN quantidade_total INTEGER;

CREATE TABLE production_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  turno production_turno NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entries_order ON production_entries(order_id);
