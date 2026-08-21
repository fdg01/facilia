-- Operations: enums
create type public.service_frequency as enum (
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'special_rule'
);

create type public.work_order_status as enum (
  'created',
  'assigned',
  'accepted',
  'in_progress',
  'completed',
  'validated',
  'with_incidents',
  'cancelled'
);

create type public.evidence_type as enum (
  'photo',
  'video',
  'customer_signature',
  'document'
);

create type public.incident_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

-- Sequences for contract and work order numbers
create sequence public.contract_number_seq start 1;
create sequence public.work_order_number_seq start 1;
