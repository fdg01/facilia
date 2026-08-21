---
name: coding-standards
description: Convenciones base de código para FACILIA: naming, inmutabilidad, organización de archivos, arquitectura hexagonal y estilo. Usar al empezar un módulo nuevo, revisar calidad, o refactorizar.
---

# Coding Standards

Convenciones base del proyecto. Es el piso compartido, no el playbook detallado de cada framework.

## Cuándo usar

- Empezar un módulo o proyecto nuevo.
- Revisar código por calidad y mantenibilidad.
- Refactorizar código existente.
- Hacer cumplir consistencia de naming, formato o estructura.

## Principios

### 1. Readability first
- El código se lee más que se escribe.
- Nombres claros de variables y funciones.
- Código auto-documentado preferido sobre comentarios.
- Formato consistente.

### 2. KISS
- La solución más simple que funcione.
- Sin over-engineering.
- Sin optimización prematura.
- Fácil de entender > código clever.

### 3. DRY
- Extraer lógica común en funciones.
- Crear componentes reutilizables.
- Compartir utilities entre módulos.
- Sin copy-paste.

### 4. YAGNI
- No construir features antes de que se necesiten.
- Sin generalidad especulativa.
- Agregar complejidad solo cuando se requiera.
- Empezar simple, refactorizar cuando haga falta.

## Arquitectura hexagonal (FACILIA)

Cada área de negocio se organiza en 4 capas:

```
modules/<area>/
├── domain/              # Lógica de negocio pura, sin dependencias externas
│   ├── entities.ts      # Entidades y value objects
│   ├── repositories.ts  # Interfaces de repositorios (abstractas)
│   └── services.ts      # Servicios del dominio
├── application/         # Casos de uso que orquestan el dominio
│   └── use-cases/       # Un archivo por caso de uso
├── infrastructure/      # Implementaciones concretas (Supabase, email, PDF)
│   └── repositories/    # Implementaciones de repositorios
└── presentation/        # Controllers / routes / componentes UI
    └── routes/          # Next.js API routes (thin, delegan a application)
```

### Reglas de dependencia
- `domain` **no depende de nada** externo. No importa Supabase, Next.js, ni librerías de infra.
- `application` depende de `domain` (interfaces). No de infraestructura concreta.
- `infrastructure` implementa las interfaces de `domain`.
- `presentation` es thin: valida input, llama a `application`, formatea output.

### Inversión de dependencias
La lógica de negocio define interfaces. La infraestructura las implementa. El application layer usa las interfaces, no las implementaciones.

```typescript
// domain/repositories.ts — interface
export interface LeadRepository {
  findById(id: string): Promise<Lead | null>
  save(lead: Lead): Promise<Lead>
}

// infrastructure/repositories/supabase-lead-repository.ts — implementación
export class SupabaseLeadRepository implements LeadRepository {
  async findById(id: string): Promise<Lead | null> { /* supabase query */ }
  async save(lead: Lead): Promise<Lead> { /* supabase insert */ }
}

// application/use-cases/confirmar-lead.ts — usa la interface
export class ConfirmarLead {
  constructor(private leadRepo: LeadRepository) {}
  async execute(id: string): Promise<Lead> { /* lógica de dominio */ }
}
```

## TypeScript

### Naming
```typescript
// PASS: descriptivo
const presupuestoMensual = 1500
const isClienteActivo = true
async function fetchLeadById(id: string) {}

// FAIL: críptico
const pm = 1500
const flag = true
async function lead(id) {}
```

### Inmutabilidad (CRÍTICO)
```typescript
// PASS: siempre crear objetos nuevos
const leadActualizado = { ...lead, estado: 'confirmado' }
const ambientes = [...ambientesPrevios, nuevoAmbiente]

// FAIL: nunca mutar
lead.estado = 'confirmado'        // BAD
ambientes.push(nuevoAmbiente)     // BAD
```

### Tipos
```typescript
// PASS: tipos explícitos
interface Lead {
  id: string
  numero: string
  estado: 'borrador' | 'enviado' | 'aceptado' | 'perdido' | 'confirmado'
  totalMensual: number
}

// FAIL: any
function getLead(id: any): Promise<any> {}
```

### Async/await
```typescript
// PASS: paralelo cuando es posible
const [lead, cliente, organizacion] = await Promise.all([
  fetchLead(id),
  fetchCliente(leadId),
  fetchOrganizacion(orgId),
])

// FAIL: secuencial innecesario
const lead = await fetchLead(id)
const cliente = await fetchCliente(lead.id)
const organizacion = await fetchOrganizacion(cliente.orgId)
```

## Organización de archivos

### Estructura del monorepo
```
apps/
├── web-publica/          # Landing + Cotizador
├── panel-admin/          # Panel de Admin
├── panel-operaciones/    # Panel de Operaciones
├── app-campo/            # App móvil del empleado
└── portal-cliente/       # Portal del Cliente
modules/
├── identidad/            # Núcleo de Identidad (compartido)
├── cotizador/            # Lógica del cotizador
├── operaciones/          # Lógica de operaciones
└── ...
lib/                      # Utilities compartidos
supabase/                 # Migrations y schema
```

### Reglas de archivos
- Muchos archivos chicos > pocos archivos grandes.
- 200-400 líneas típico, 800 máximo.
- Alta cohesión, bajo acoplamiento.
- Organizar por feature/dominio, no por tipo.
- Extraer utilities de módulos grandes.

### Naming de archivos
```
components/Button.tsx              # PascalCase para componentes
hooks/useAuth.ts                   # camelCase con prefijo 'use'
lib/formatCurrency.ts              # camelCase para utilities
types/lead.types.ts                # camelCase con sufijo .types
modules/cotizador/domain/lead.ts   # singular para entidades
```

## Error handling

- Manejar errores explícitamente en cada nivel.
- Mensajes user-friendly en UI.
- Log detallado en server.
- Nunca silenciar errores (swallow).

```typescript
// PASS
async function fetchLead(id: string): Promise<Lead> {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
  if (error) throw new Error(`Lead ${id} no encontrado`)
  return data
}

// FAIL
async function fetchLead(id: string) {
  const { data } = await supabase.from('leads').select('*').eq('id', id).single()
  return data
}
```

## Validación de input

Validar siempre en los boundaries del sistema:
- Validar todo input de usuario antes de procesar.
- Usar validación por schema (Zod).
- Fail fast con mensajes claros.
- Nunca confiar en data externa.

## Code smells a evitar

- **Funciones largas** (> 50 líneas) → split.
- **Anidamiento profundo** (> 4 niveles) → early returns.
- **Magic numbers** → constantes con nombre.
- **Comentarios que dicen el qué** → comentarios que dicen el porqué.

## Checklist antes de marcar completo

- [ ] Código legible y bien nombrado
- [ ] Funciones < 50 líneas
- [ ] Archivos < 800 líneas
- [ ] Sin anidamiento > 4 niveles
- [ ] Error handling proper
- [ ] Sin valores hardcodeados (usar constantes o config)
- [ ] Sin mutación (patrones inmutables)
- [ ] Sigue arquitectura hexagonal (domain no depende de infra)
