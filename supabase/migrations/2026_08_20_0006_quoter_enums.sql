-- Quoter enums
create type public.service_line as enum ('clean', 'care', 'continuity');
create type public.node_type as enum (
  'root', 'category', 'option', 'input', 'consumable', 'extra', 'closing'
);
create type public.node_price_type as enum (
  'fixed', 'per_m2', 'per_unit', 'calculated', 'no_price'
);
create type public.lead_status as enum (
  'draft', 'sent', 'accepted', 'lost', 'confirmed'
);
create type public.margin_mode as enum ('on_cost', 'on_final_price');
create type public.quantity_mode as enum ('customer', 'fixed', 'calculated');
create type public.variable_type as enum ('environment', 'frequency');
