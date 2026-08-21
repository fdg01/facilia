-- Seed DAG with example data from docs/plans/02-panel-admin-cotizador.md
-- Three root lines (Clean, Care, Continuity) with sub-nodes, options, edges,
-- variables, consumables, parameters, rules and welcome gift.

BEGIN;

-- ─── Variables (environments + frequencies) ────────────────────────────────
INSERT INTO public.variables (type, code, label, performance_m2_per_hour, supply_cost_per_m2, visits_per_month, active) VALUES
  ('environment', 'office',        'Oficina',          80.00, 15.00, NULL, true),
  ('environment', 'commercial',    'Local comercial',  100.00, 12.00, NULL, true),
  ('environment', 'bathroom',      'Baño',             50.00, 20.00, NULL, true),
  ('environment', 'kitchen',       'Cocina',           60.00, 25.00, NULL, true),
  ('environment', 'outdoor',       'Exterior',         120.00, 8.00, NULL, true),
  ('frequency',   'daily',         'Diaria',           NULL, NULL, 30, true),
  ('frequency',   'monday_friday', 'Lunes a Viernes',  NULL, NULL, 22, true),
  ('frequency',   'weekly',        'Semanal',          NULL, NULL, 4, true),
  ('frequency',   'biweekly',      'Quincenal',        NULL, NULL, 2, true),
  ('frequency',   'monthly',       'Mensual',          NULL, NULL, 1, true);

-- ─── Parameters (pricing engine) ────────────────────────────────────────────
-- Temporarily disable audit trigger (auth.uid() is NULL in seed context)
ALTER TABLE public.parameters DISABLE TRIGGER trg_audit_parameter;
INSERT INTO public.parameters (operator_hourly_cost, margin_percentage, margin_mode, active_from, active) VALUES
  (350.00, 30.00, 'on_cost', now(), true);
-- Insert audit record manually with admin user
INSERT INTO public.parameter_audit (parameter_id, user_id, action, previous_value, new_value)
SELECT p.id, u.id, 'created', NULL, to_jsonb(p)
FROM public.parameters p, public.users u
WHERE u.role = 'admin' AND u.status = 'active'
  AND p.active = true
  AND NOT EXISTS (SELECT 1 FROM public.parameter_audit pa WHERE pa.parameter_id = p.id);
ALTER TABLE public.parameters ENABLE TRIGGER trg_audit_parameter;

-- ─── Welcome gift ───────────────────────────────────────────────────────────
INSERT INTO public.welcome_gift (description, active) VALUES
  ('6 tazas sublimadas FACILIA', true);

-- ─── Rules ──────────────────────────────────────────────────────────────────
INSERT INTO public.rules (code, label, description, type, expression, active) VALUES
  ('dispensers_per_room', 'Dispensadores por ambiente',
   '1 dispensador por cada baño + cocina + parrilla',
   'quantity',
   '{"type":"quantity_by_selection","base":"count(selections where type in [bathroom,kitchen,bbq])","formula":"count_bathrooms + count_kitchens + count_bbq"}'::jsonb,
   true);

-- ─── Consumables ────────────────────────────────────────────────────────────
INSERT INTO public.consumables (code, label, description, quantity_mode, fixed_quantity, rule_id, unit_price, category, levels, active) VALUES
  ('premium_cutlery', 'Vajilla Premium', 'Vajilla premium para oficinas y eventos',
   'customer', NULL, NULL, 50.00, 'cutlery',
   '[{"label":"Basic","price":0},{"label":"Premium","price":50},{"label":"Premium Plus","price":120}]'::jsonb,
   true),
  ('coffee_maker', 'Cafetera', 'Cafetera profesional para oficina',
   'fixed', 1, NULL, 1200.00, 'appliance', NULL, true),
  ('towel_dispenser', 'Dispensador de toallas', 'Dispensador de toallas de papel',
   'calculated', NULL, (SELECT id FROM public.rules WHERE code = 'dispensers_per_room'), 80.00, 'supply', NULL, true),
  ('air_freshener', 'Ambientador', 'Ambientador para espacios comunes',
   'customer', NULL, NULL, 35.00, 'supply', NULL, true),
  ('dishwasher', 'Lavavajillas', 'Lavavajillas industrial',
   'fixed', 1, NULL, 2500.00, 'appliance', NULL, true);

-- ─── DAG Nodes ──────────────────────────────────────────────────────────────
-- Root nodes (the three lines)
INSERT INTO public.dag_nodes (code, label, description, type, line, price_type, base_price, sort_order, active) VALUES
  ('clean',       'Clean',       'Limpieza profesional para espacios comerciales',
   'root', 'clean',       'no_price', NULL, 0, true),
  ('care',        'Care',        'Mantenimiento preventivo y correctivo',
   'root', 'care',        'no_price', NULL, 1, true),
  ('continuity',  'Continuity',  'Insumos críticos y continuidad operativa',
   'root', 'continuity',  'no_price', NULL, 2, true);

-- Clean → category: spaces
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('clean.spaces', '¿Qué espacios?', 'Seleccioná los espacios a limpiar',
   'category', 'no_price', NULL, 0, true);

-- Clean → input: office m2
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, variable_id, sort_order, active) VALUES
  ('clean.office_m2', 'Oficinas', 'Ingresá los m² de oficinas a limpiar',
   'input', 'per_m2', NULL, (SELECT id FROM public.variables WHERE code = 'office'), 0, true),
  ('clean.commercial_m2', 'Local comercial', 'Ingresá los m² del local comercial',
   'input', 'per_m2', NULL, (SELECT id FROM public.variables WHERE code = 'commercial'), 1, true),
  ('clean.bathroom_count', 'Baños', '¿Cuántos baños?',
   'input', 'fixed', 200.00, NULL, 2, true),
  ('clean.kitchen_m2', 'Cocina', 'Ingresá los m² de cocina',
   'input', 'per_m2', NULL, (SELECT id FROM public.variables WHERE code = 'kitchen'), 3, true);

-- Clean → category: frequency
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('clean.frequency', 'Frecuencia', '¿Con qué frecuencia necesitás limpieza?',
   'category', 'no_price', NULL, 1, true);

-- Clean → option: frequency options (as dag_options on the frequency node)
-- (will be added as dag_options below)

-- Clean → consumable: premium cutlery (shared node — reachable from Clean and Continuity)
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, consumable_id, sort_order, active) VALUES
  ('clean.consumables', 'Consumibles opcionales', 'Sumá insumos y consumibles',
   'consumable', 'no_price', NULL, NULL, 2, true);

-- Clean → closing
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('clean.closing', 'Cierre', 'Datos de contacto y confirmación',
   'closing', 'no_price', NULL, 99, true);

-- Care → category: service type
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('care.type', 'Tipo de mantenimiento', '¿Qué tipo de mantenimiento necesitás?',
   'category', 'no_price', NULL, 0, true);

-- Care → options: preventive, corrective
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('care.preventive', 'Preventivo', 'Mantenimiento programado para evitar fallas',
   'option', 'fixed', 500.00, 0, true),
  ('care.corrective', 'Correctivo', 'Reparación de fallas existentes',
   'option', 'fixed', 800.00, 1, true);

-- Care → closing
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('care.closing', 'Cierre', 'Datos de contacto y confirmación',
   'closing', 'no_price', NULL, 99, true);

-- Continuity → category: supply type
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('continuity.supplies', 'Insumos críticos', '¿Qué insumos de continuidad necesitás?',
   'category', 'no_price', NULL, 0, true);

-- Continuity → consumable: premium cutlery (shared — same node reachable from Clean)
-- We reuse 'clean.consumables' node via edge from continuity.supplies

-- Continuity → extra: air freshener
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, consumable_id, sort_order, active) VALUES
  ('continuity.extras', 'Extras', 'Productos opcionales para tu espacio',
   'extra', 'no_price', NULL, NULL, 1, true);

-- Continuity → closing
INSERT INTO public.dag_nodes (code, label, description, type, price_type, base_price, sort_order, active) VALUES
  ('continuity.closing', 'Cierre', 'Datos de contacto y confirmación',
   'closing', 'no_price', NULL, 99, true);

-- ─── DAG Options ────────────────────────────────────────────────────────────
-- Options for clean.spaces (which spaces to clean)
INSERT INTO public.dag_options (node_id, code, label, description, price_type, base_price, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), 'office',     'Oficinas',        'Limpiar áreas de oficina',         'no_price', NULL, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), 'commercial', 'Local comercial', 'Limpiar local comercial',          'no_price', NULL, 1, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), 'bathroom',   'Baños',           'Limpiar baños',                    'no_price', NULL, 2, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), 'kitchen',    'Cocina',          'Limpiar cocina',                   'no_price', NULL, 3, true);

-- Options for clean.frequency
INSERT INTO public.dag_options (node_id, code, label, description, price_type, base_price, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), 'daily',         'Diaria',          'Limpieza todos los días',         'no_price', NULL, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), 'monday_friday', 'Lunes a Viernes', 'Limpieza de lunes a viernes',     'no_price', NULL, 1, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), 'weekly',        'Semanal',         'Limpieza una vez por semana',     'no_price', NULL, 2, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), 'biweekly',      'Quincenal',       'Limpieza cada dos semanas',       'no_price', NULL, 3, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), 'monthly',       'Mensual',         'Limpieza una vez al mes',         'no_price', NULL, 4, true);

-- Options for care.type
INSERT INTO public.dag_options (node_id, code, label, description, price_type, base_price, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'care.type'), 'preventive', 'Preventivo', 'Mantenimiento programado', 'no_price', NULL, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'care.type'), 'corrective', 'Correctivo', 'Reparación de fallas',     'no_price', NULL, 1, true);

-- Options for clean.consumables (consumable levels)
INSERT INTO public.dag_options (node_id, code, label, description, price_type, base_price, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), 'cutlery_basic',    'Vajilla Basic',     'Vajilla estándar',              'no_price', NULL, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), 'cutlery_premium',  'Vajilla Premium',   'Vajilla premium',               'fixed', 50.00, 1, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), 'coffee_maker',     'Cafetera',          'Cafetera profesional',          'fixed', 1200.00, 2, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), 'towel_dispenser',  'Dispensador',       'Dispensador de toallas',        'fixed', 80.00, 3, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), 'air_freshener',    'Ambientador',       'Ambientador para espacios',     'fixed', 35.00, 4, true);

-- Options for continuity.extras
INSERT INTO public.dag_options (node_id, code, label, description, price_type, base_price, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity.extras'), 'cutlery_premium', 'Vajilla Premium',  'Vajilla premium (compartido)',  'fixed', 50.00, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity.extras'), 'dishwasher',      'Lavavajillas',     'Lavavajillas industrial',       'fixed', 2500.00, 1, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity.extras'), 'air_freshener',   'Ambientador',      'Ambientador para espacios',     'fixed', 35.00, 2, true);

-- ─── DAG Edges ──────────────────────────────────────────────────────────────
-- Clean → spaces
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), NULL, 0, true);

-- Clean.spaces → office_m2 (conditional on option 'office')
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.office_m2'),
   '{"option":"office"}'::jsonb, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.commercial_m2'),
   '{"option":"commercial"}'::jsonb, 1, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.bathroom_count'),
   '{"option":"bathroom"}'::jsonb, 2, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.kitchen_m2'),
   '{"option":"kitchen"}'::jsonb, 3, true);

-- Clean.spaces → frequency (after selecting spaces)
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.spaces'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), NULL, 4, true);

-- Clean.frequency → consumables
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.frequency'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), NULL, 0, true);

-- Clean.consumables → closing
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.closing'), NULL, 0, true);

-- Care → type
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'care'), (SELECT id FROM public.dag_nodes WHERE code = 'care.type'), NULL, 0, true);

-- Care.type → preventive
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'care.type'), (SELECT id FROM public.dag_nodes WHERE code = 'care.preventive'),
   '{"option":"preventive"}'::jsonb, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'care.type'), (SELECT id FROM public.dag_nodes WHERE code = 'care.corrective'),
   '{"option":"corrective"}'::jsonb, 1, true);

-- Care → closing
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'care.preventive'), (SELECT id FROM public.dag_nodes WHERE code = 'care.closing'), NULL, 0, true),
  ((SELECT id FROM public.dag_nodes WHERE code = 'care.corrective'), (SELECT id FROM public.dag_nodes WHERE code = 'care.closing'), NULL, 0, true);

-- Continuity → supplies
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity'), (SELECT id FROM public.dag_nodes WHERE code = 'continuity.supplies'), NULL, 0, true);

-- Continuity.supplies → consumables (shared node — DAG feature: same node reachable from two paths)
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity.supplies'), (SELECT id FROM public.dag_nodes WHERE code = 'clean.consumables'), NULL, 0, true);

-- Continuity.supplies → extras
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity.supplies'), (SELECT id FROM public.dag_nodes WHERE code = 'continuity.extras'), NULL, 1, true);

-- Continuity → closing
INSERT INTO public.dag_edges (source_id, target_id, condition, sort_order, active) VALUES
  ((SELECT id FROM public.dag_nodes WHERE code = 'continuity.extras'), (SELECT id FROM public.dag_nodes WHERE code = 'continuity.closing'), NULL, 0, true);

COMMIT;
