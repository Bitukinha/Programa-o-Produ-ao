-- Lets a Qualidade user block a specific production entry (a bigbag or a
-- pallet of sacos) with a reason, excluding it from the produced total
-- until it's unblocked. Additive only: existing columns/data are untouched.

ALTER TABLE production_entries
  ADD COLUMN bloqueado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN motivo_bloqueio TEXT;
