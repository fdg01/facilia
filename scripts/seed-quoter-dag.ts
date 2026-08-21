// scripts/seed-quoter-dag.ts
import { createClient } from '@supabase/supabase-js'

function getEnvOrThrow(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

async function main() {
  const supabase = createClient(
    getEnvOrThrow('SUPABASE_URL'),
    getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // 1. Create parameters
  const { data: param } = await supabase
    .from('parameters')
    .insert({
      operator_hourly_cost: 250,
      margin_percentage: 30,
      margin_mode: 'on_cost',
      active: true,
    })
    .select()
    .single()
  console.log('Created parameter:', param?.id)

  // 2. Create welcome gift
  const { data: gift } = await supabase
    .from('welcome_gift')
    .insert({
      description: 'Botella de vino de bienvenida (sin costo)',
      active: true,
    })
    .select()
    .single()
  console.log('Created welcome gift:', gift?.id)

  // 3. Create variables
  const { data: officeVar } = await supabase
    .from('variables')
    .insert({
      type: 'environment',
      code: 'office',
      label: 'Oficina',
      performance_m2_per_hour: 50,
      supply_cost_per_m2: 10,
      active: true,
    })
    .select()
    .single()
  console.log('Created office variable:', officeVar?.id)

  const { data: dailyFreq } = await supabase
    .from('variables')
    .insert({
      type: 'frequency',
      code: 'daily',
      label: 'Diario',
      visits_per_month: 22,
      active: true,
    })
    .select()
    .single()
  console.log('Created daily frequency:', dailyFreq?.id)

  const { data: weeklyFreq } = await supabase
    .from('variables')
    .insert({
      type: 'frequency',
      code: 'weekly',
      label: 'Semanal',
      visits_per_month: 4,
      active: true,
    })
    .select()
    .single()
  console.log('Created weekly frequency:', weeklyFreq?.id)

  // 4. Create root nodes for three lines
  const { data: cleanRoot } = await supabase
    .from('dag_nodes')
    .insert({ code: 'clean', label: 'FACILIA Clean', type: 'root', line: 'clean', price_type: 'no_price', sort_order: 0 })
    .select().single()
  const { data: careRoot } = await supabase
    .from('dag_nodes')
    .insert({ code: 'care', label: 'FACILIA Care', type: 'root', line: 'care', price_type: 'no_price', sort_order: 1 })
    .select().single()
  const { data: continuityRoot } = await supabase
    .from('dag_nodes')
    .insert({ code: 'continuity', label: 'FACILIA Continuity', type: 'root', line: 'continuity', price_type: 'no_price', sort_order: 2 })
    .select().single()
  console.log('Created root nodes:', cleanRoot?.id, careRoot?.id, continuityRoot?.id)

  // 5. Clean line structure
  const { data: cleanOfficeCat } = await supabase
    .from('dag_nodes')
    .insert({ code: 'clean_office', label: 'Limpieza de Oficina', type: 'category', line: 'clean', price_type: 'no_price', sort_order: 0 })
    .select().single()
  const { data: cleanOfficeInput } = await supabase
    .from('dag_nodes')
    .insert({ code: 'clean_office_m2', label: 'Metros cuadrados', type: 'input', line: 'clean', price_type: 'per_m2', variable_id: officeVar?.id, sort_order: 0 })
    .select().single()
  const { data: cleanFreqCat } = await supabase
    .from('dag_nodes')
    .insert({ code: 'clean_frequency', label: 'Frecuencia', type: 'category', line: 'clean', price_type: 'no_price', sort_order: 1 })
    .select().single()
  const { data: cleanDailyNode } = await supabase
    .from('dag_nodes')
    .insert({ code: 'clean_daily', label: 'Diario', type: 'option', line: 'clean', price_type: 'fixed', base_price: 0, variable_id: dailyFreq?.id, sort_order: 0 })
    .select().single()
  const { data: cleanWeeklyNode } = await supabase
    .from('dag_nodes')
    .insert({ code: 'clean_weekly', label: 'Semanal', type: 'option', line: 'clean', price_type: 'fixed', base_price: 0, variable_id: weeklyFreq?.id, sort_order: 1 })
    .select().single()

  // Edges for clean line
  await supabase.from('dag_edges').insert([
    { source_id: cleanRoot?.id, target_id: cleanOfficeCat?.id, sort_order: 0 },
    { source_id: cleanOfficeCat?.id, target_id: cleanOfficeInput?.id, sort_order: 0 },
    { source_id: cleanRoot?.id, target_id: cleanFreqCat?.id, sort_order: 1 },
    { source_id: cleanFreqCat?.id, target_id: cleanDailyNode?.id, sort_order: 0 },
    { source_id: cleanFreqCat?.id, target_id: cleanWeeklyNode?.id, sort_order: 1 },
  ])
  console.log('Created clean line edges')

  // 6. Care line (basic structure)
  const { data: careCat } = await supabase
    .from('dag_nodes')
    .insert({ code: 'care_plants', label: 'Cuidado de Plantas', type: 'category', line: 'care', price_type: 'no_price', sort_order: 0 })
    .select().single()
  const { data: carePlantsInput } = await supabase
    .from('dag_nodes')
    .insert({ code: 'care_plants_qty', label: 'Cantidad de plantas', type: 'input', line: 'care', price_type: 'per_unit', base_price: 50, sort_order: 0 })
    .select().single()
  await supabase.from('dag_edges').insert([
    { source_id: careRoot?.id, target_id: careCat?.id, sort_order: 0 },
    { source_id: careCat?.id, target_id: carePlantsInput?.id, sort_order: 0 },
  ])
  console.log('Created care line')

  // 7. Continuity line (basic structure)
  const { data: contCat } = await supabase
    .from('dag_nodes')
    .insert({ code: 'continuity_maintenance', label: 'Mantenimiento Continuo', type: 'category', line: 'continuity', price_type: 'no_price', sort_order: 0 })
    .select().single()
  const { data: contMonthlyNode } = await supabase
    .from('dag_nodes')
    .insert({ code: 'continuity_monthly', label: 'Plan mensual', type: 'option', line: 'continuity', price_type: 'fixed', base_price: 5000, sort_order: 0 })
    .select().single()
  await supabase.from('dag_edges').insert([
    { source_id: continuityRoot?.id, target_id: contCat?.id, sort_order: 0 },
    { source_id: contCat?.id, target_id: contMonthlyNode?.id, sort_order: 0 },
  ])
  console.log('Created continuity line')

  console.log('Seed completed successfully!')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
