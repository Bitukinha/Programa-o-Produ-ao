-- Each production entry now records the actual weight and seal (lacre) of
-- what was produced: one bigbag per entry, or one pallet of sacos per entry.
-- Additive only: existing columns/data are untouched.

ALTER TABLE production_entries
  ADD COLUMN peso_kg NUMERIC,
  ADD COLUMN lacre TEXT;
