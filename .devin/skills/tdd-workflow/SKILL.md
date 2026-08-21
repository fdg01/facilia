---
name: tdd-workflow
description: Desarrollo guiado por tests. Escribir el test primero, implementar lo mínimo para que pase, refactorizar. Cobertura mínima 80% con unit, integration y E2E. Usar al escribir features nuevas, fixear bugs o refactorizar.
---

# TDD Workflow

Todo código nuevo se desarrolla con tests primero. Los tests son la red de seguridad que habilita refactoring seguro y desarrollo rápido.

## Cuándo usar

- Escribir features nuevas (cualquier app del Roadmap)
- Fixear bugs
- Refactorizar código existente
- Agregar endpoints de API
- Crear componentes nuevos

## Principios

### 1. Tests ANTES que código
SIEMPRE escribir el test primero, después implementar lo mínimo para que pase.

### 2. Cobertura mínima 80%
Unit + integration + E2E. Cubrir edge cases, errores y boundary conditions.

### 3. Tipos de test

#### Unit tests
- Funciones puras (ej: motor de cálculo del cotizador)
- Lógica de componentes
- Helpers y utilities
- Value objects y entidades del dominio

#### Integration tests
- Endpoints de API (Next.js API routes)
- Operaciones de Supabase (queries, RLS)
- Interacción entre módulos hexagonales
- Llamadas a servicios externos (email, PDF)

#### E2E tests (Playwright)
- Flujos críticos de usuario
- Cotizar de punta a punta
- Login + crear usuario + invitar
- Confirmar cotización → crear plan operativo

## Flujo TDD

### Step 0: Detectar el test runner
No asumir `npm test`. Revisar `package.json` `scripts.test` y los archivos de test:
- Si invoca `jest` o `vitest` → correr con el package manager del proyecto
- Si es `bun test` o importa de `bun:test` → usar el runner nativo de Bun

### Step 1: Escribir user journeys
```
Como [rol], quiero [acción], para que [beneficio]

Ej:
Como cliente, quiero cotizar limpieza de oficina,
para que reciba un presupuesto al instante.
```

### Step 2: Generar casos de test
Para cada journey, crear tests comprehensivos: happy path, edge cases, errores, fallbacks.

### Step 3: Correr los tests (deben fallar — RED)
```bash
<test>
```

### Step 4: Implementar lo mínimo (GREEN)
Escribir el código mínimo para que los tests pasen.

### Step 5: Correr los tests de nuevo
```bash
<test>
# Deben pasar
```

### Step 6: Refactorizar (IMPROVE)
Mejorar calidad manteniendo tests verdes:
- Eliminar duplicación
- Mejorar naming
- Optimizar performance
- Mejorar legibilidad

### Step 7: Verificar cobertura
```bash
<coverage>
# Verificar 80%+
```

## Patrones para FACILIA

### Test del motor de cálculo (unit)
```typescript
import { describe, it, expect } from 'vitest'
import { calcularPresupuesto } from '@/lib/cotizador/engine'

describe('calcularPresupuesto', () => {
  it('calcula costo mensual de oficina con frecuencia diaria', () => {
    const resultado = calcularPresupuesto({
      ambientes: [{ tipo: 'oficina', m2: 100 }],
      frecuencia: 'diario',
    })
    expect(resultado.totalMensual).toBeGreaterThan(0)
    expect(resultado.totalPorVisita).toBeGreaterThan(0)
  })

  it('devuelve 0 si no hay ambientes', () => {
    const resultado = calcularPresupuesto({ ambientes: [], frecuencia: 'diario' })
    expect(resultado.totalMensual).toBe(0)
  })
})
```

### Test de API route (integration)
```typescript
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('POST /api/leads', () => {
  it('guarda un lead y devuelve 201 con número de presupuesto', async () => {
    const req = new NextRequest('http://localhost/api/leads', {
      method: 'POST',
      body: JSON.stringify({ /* datos válidos */ }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.data.numero).toMatch(/^FAC-\d{4}-\d{6}$/)
  })

  it('rechaza payload inválido con 400', async () => {
    const req = new NextRequest('http://localhost/api/leads', {
      method: 'POST',
      body: JSON.stringify({ celular: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

### Test de flujo E2E (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('cliente cotiza y recibe número de presupuesto', async ({ page }) => {
  await page.goto('/cotizador')
  // Step 1: espacio
  await page.selectOption('[name=tipoEspacio]', 'oficina')
  await page.fill('[name=m2]', '100')
  // ... completar pasos
  // Confirmación
  await expect(page.locator('[data-testid=numero-presupuesto]')).toBeVisible()
})
```

### Mock de Supabase
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: { id: 'test' }, error: null })),
    })),
  }),
}))
```

## Errores comunes a evitar

- **Testear detalles de implementación** → testear comportamiento visible al usuario.
- **Selectores frágiles** (`.css-class-xyz`) → usar semánticos (`button:has-text("Cotizar")`, `[data-testid]`).
- **Tests dependientes entre sí** → cada test arma su propio data.
- **No aislar** → mockear dependencias externas (Supabase, email, PDF).

## Métricas de éxito

- 80%+ cobertura
- Todos los tests pasando
- Tests rápidos (unit < 50ms cada uno)
- E2E cubre flujos críticos de cada app del Roadmap
- Tests pescan bugs antes de producción
