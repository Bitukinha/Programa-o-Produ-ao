CREATE TYPE production_sector AS ENUM ('extrusora', 'moagem');
CREATE TYPE production_status AS ENUM ('pendente', 'em_producao', 'concluida');

CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector production_sector NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 1,
  op_number TEXT,
  peneira TEXT,
  cliente TEXT NOT NULL,
  produto TEXT NOT NULL,
  linha_envase TEXT,
  total_pedido TEXT,
  embalagem TEXT,
  observacao TEXT,
  status production_status NOT NULL DEFAULT 'pendente',
  turno TEXT,
  scheduled_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_production_orders_updated
BEFORE UPDATE ON production_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_orders_sector_seq ON production_orders(sector, sequence);
