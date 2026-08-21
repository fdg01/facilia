-- Enums for the Identity module
-- Plan 01 · ADR-002 (simplified roles: no super_admin)

create type public.user_role as enum ('admin', 'employee', 'client');
create type public.user_status as enum ('active', 'inactive');
