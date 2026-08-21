# AGENTS.md — FACILIA

Fuente de verdad de convenciones del proyecto. Todo agente (Devin, Claude, Cursor, etc.) que trabaje en este repo debe leer esto primero.

## Visión general

FACILIA es la unidad de Facility Services de CORE. Plataforma web que cubre el ciclo completo: cotizador self-service, panel de admin parametrizable, operaciones de campo y portal de cliente.

**Roadmap de producto:** <ref_file file="E:\Desktop\core.com.uy\Roadmap.md" />

## Stack

- **Framework:** Next.js 14+ (App Router, basePath `/facilia`)
- **Lenguaje:** TypeScript estricto
- **Base de datos + Auth:** Supabase self-hosted (Docker, red interna — ver ADR-003)
- **Estilos:** Tailwind CSS
- **PDF:** @react-pdf/renderer
- **Deploy:** Docker (un solo deploy, dominio `com.core.uy/facilia/` — ver ADR-004)
- **Tests:** Vitest (unit + integration) + Playwright (E2E)
- **Validación:** Zod

## Arquitectura

### Monorepo hexagonal

Un solo repositorio. Arquitectura hexagonal por área de negocio. Una sola base de datos (Supabase). Un solo deploy Next.js con `basePath: '/facilia'`.

Las 5 apps del Roadmap son **route groups** dentro del mismo app Next.js, no apps separadas. Dominio: `com.core.uy/facilia/` (ver ADR-004).

```
apps/
└── web/                    # Un solo Next.js app (basePath /facilia)
    ├── (public)/           # Web Pública + Cotizador → /facilia/
    ├── (admin)/            # Panel de Admin → /facilia/admin/
    ├── (operations)/       # Panel de Operaciones → /facilia/operations/
    ├── (field)/            # App de Campo → /facilia/field/
    └── (portal)/           # Portal del Cliente → /facilia/portal/
modules/
├── identity/              # Núcleo de Identidad (compartido)
├── quoter/                # Lógica del cotizador
├── operations/            # Lógica de operaciones
└── ...
lib/                      # Utilities compartidos
supabase/                 # Migrations y schema (Docker, red interna)
docs/                     # Decisiones, patrones, lecciones
```

### Capas hexagonales (por módulo)

```
modules/<area>/
├── domain/              # Lógica de negocio pura, sin dependencias externas
├── application/         # Casos de uso que orquestan el dominio
├── infrastructure/      # Implementaciones concretas (Supabase, email, PDF)
└── presentation/        # Controllers / routes / componentes UI (thin)
```

### Regla de dependencias (crítica)

- `domain` **no depende de nada externo**. No importa Supabase, Next.js, ni libs de infra.
- `application` depende de interfaces de `domain`. No de infraestructura concreta.
- `infrastructure` implementa las interfaces de `domain`.
- `presentation` es thin: valida input, llama a `application`, formatea output.

**Inversión de dependencias:** el dominio define interfaces, la infra las implementa.

## Apps del Roadmap

Todas son route groups de un solo app Next.js bajo `com.core.uy/facilia/`:

| # | App | Route group | Path | Público | Dispositivo |
|---|---|---|---|---|---|
| 1 | Núcleo de Identidad | (shared) | — | Todos (compartido) | — |
| 2 | Web Pública + Cotizador | (public) | `/facilia/` | Visitante / Cliente | Web |
| 3 | Panel de Admin | (admin) | `/facilia/admin/` | Admin | Web |
| 4 | Panel de Operaciones | (operations) | `/facilia/operations/` | Admin / Planificador | Web |
| 5 | App de Campo | (field) | `/facilia/field/` | Empleado | Web (mobile-first) |
| 6 | Portal del Cliente | (portal) | `/facilia/portal/` | Cliente | Web |

API unificada: `/facilia/api/` (todos los módulos).

Orden de construcción: Identidad → Admin + Cotizador → Portal Cliente mínimo → Operaciones + Campo → Portal Cliente completo.

## Roles

`admin`, `employee`, `client`. Definidos en el Núcleo de Identidad (valores del enum `user_role` en inglés).

- `admin`: gestión del directorio, configuración, operaciones, gestión de roles.
- `employee`: panel operativo con lo asignado a él.
- `client`: cotizar + su portal (cotizaciones, servicios, evidencias, solicitudes).

No existe `super_admin`. El admin es el rol máximo.

Contraseñas temporales: todo usuario creado por admin tiene `must_change_password = true` y debe cambiarla en el primer login (ADR-002).

## Multi-tenant

Los clientes se agrupan por **organización**. El aislamiento entre organizaciones es crítico:
- RLS en Supabase en toda tabla con datos de cliente.
- Las queries filtran por `organization_id` del usuario autenticado.
- Nunca aceptar `organization_id` desde el cliente.

## Skills del proyecto

Usar estos skills en el momento indicado del ciclo de desarrollo:

```text
plan → test → implement → review → verify → remember
```

| Skill | Cuándo | Qué hace |
|---|---|---|
| `plan-before-build` | Antes de codear una feature | Convierte intención del Roadmap en plan con constraints e interfaces |
| `tdd-workflow` | Al escribir features o fixear bugs | Test-first: RED → GREEN → REFACTOR, 80%+ cobertura |
| `coding-standards` | Al escribir o revisar código | Convenciones base + estructura hexagonal |
| `code-review` | Después de codear | Revisión con niveles de severidad, foco en arquitectura |
| `security-review` | Al tocar auth, input, endpoints, RLS | Checklist de seguridad adaptado a FACILIA |
| `verification-loop` | Antes de declarar completo o PR | Gates: build, types, lint, tests, security scan |
| `project-memory` | Al iniciar/cerrar sesión o decidir arquitectura | ADRs, patrones y lecciones que sobreviven entre sesiones |

Los skills viven en `.devin/skills/<nombre>/SKILL.md`.

## Flujo de desarrollo

1. **Plan** — Usar `plan-before-build` para features que cruzan archivos, módulos o apps.
2. **Test** — Usar `tdd-workflow`: escribir test primero, implementar lo mínimo, refactorizar.
3. **Implement** — Seguir `coding-standards` y la arquitectura hexagonal.
4. **Review** — Usar `code-review` inmediatamente después de codear.
5. **Verify** — Usar `verification-loop` antes de declarar completo. Security issues son CRITICAL.
6. **Remember** — Usar `project-memory` al cerrar: ADR si hubo decisión, lesson si se aprendió algo, actualizar Roadmap si se cerró feature.

## Convenciones clave

### Código
- **Idioma:** todo código y base de datos en **inglés**. La web (UI, labels, mensajes al usuario) en **español**.
  - Tablas: `organizations`, `users`, `leads`, `contracts`, `work_orders`, etc.
  - Columnas: `first_name`, `last_name`, `phone`, `organization_id`, etc.
  - Enums: `user_role`, `work_order_status`, etc. con valores en inglés: `admin`, `employee`, `client`, `active`, `inactive`, etc.
  - Funciones/métodos/variables: `canDeactivate`, `isClient`, `createUser`, etc.
  - Módulos: `identity`, `quoter`, `operations`, etc.
  - UI: "Empleado", "Cliente", "Inactivo", "Crear usuario", etc.
- **Inmutabilidad:** siempre crear objetos nuevos, nunca mutar.
- **Funciones:** < 50 líneas.
- **Archivos:** < 800 líneas.
- **Anidamiento:** < 4 niveles (usar early returns).
- **Naming:** descriptivo, verb-noun para funciones, sin abreviaturas crípticas.
- **Tipos:** sin `any`. Interfaces explícitas.
- **Errores:** manejar en cada nivel, mensajes user-friendly en UI, log detallado en server.
- **Validación:** en los boundaries del sistema, con schema (Zod).

### API
- URLs: plural, kebab-case, sin verbos (`/api/leads`, no `/api/getLeads`).
- Respuesta: envelope consistente (`{ data, meta? }` o `{ error: { code, message, details? } }`).
- Status codes semánticos (201 para create, 400 para validación, 401/403 para auth, 429 para rate limit).
- Validación con Zod en todo endpoint.
- Auth verificada antes de operaciones sensibles.
- Rate limiting en todos los endpoints.

### Base de datos
- RLS activo en toda tabla con datos sensibles.
- Migrations en `supabase/migrations/` con fecha (`YYYY_MM_DD_descripcion.sql`).
- `schema.sql` idempotente para setup inicial.
- Sin concatenación de strings en SQL. Siempre parameterized queries o el query builder de Supabase.

### Git
- Commits conventional: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci).
- Un commit por cambio lógico.
- No commitear secrets ni `.env.local`.
- No push sin permiso explícito.

## Comandos

```bash
# Desarrollo
cd apps/web && npm run dev          # desarrollo (Next.js 16, Turbopack)

# Build
cd apps/web && npm run build        # build de producción

# Tests
cd apps/web && npm run test         # tests (Vitest)
cd apps/web && npm run test:coverage # tests con cobertura (mínimo 80%)
# o desde la raíz: npm run test

# Seed
npm run seed                        # crea el admin inicial (scripts/seed-admin.ts)

# Lint
cd apps/web && npm run lint         # ESLint
```

## Seguridad

**Antes de cualquier commit:**
- No hardcoded secrets.
- Input validado.
- Queries parameterized.
- RLS activo.
- Multi-tenant respeta aislamiento por organización.
- Auth y autorización verificadas.

**Si se encuentra un issue de seguridad:** frenar, fixear CRITICAL, rotar secrets expuestos, revisar codebase por issues similares.

## Memoria del proyecto

- `Roadmap.md` — estado del producto.
- `AGENTS.md` (este archivo) — convenciones del repo.
- `docs/decisions/` — ADRs de arquitectura.
- `docs/patterns/` — patrones adoptados.
- `docs/lessons/` — lecciones aprendidas.

Al iniciar sesión: leer Roadmap + AGENTS.md + ADRs recientes.
Al cerrar sesión: actualizar lo que cambió.
