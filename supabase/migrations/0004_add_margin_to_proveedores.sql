-- 0004_add_margin_to_proveedores.sql
-- Adds the margin column to the proveedores table

alter table public.proveedores
add column if not exists margin numeric(5, 2) default 0;