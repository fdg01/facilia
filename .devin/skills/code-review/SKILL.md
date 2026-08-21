---
name: code-review
description: Revisar código recién escrito o modificado antes de considerarlo listo. Enfocarse en calidad, mantenibilidad, edge cases y consistencia con la arquitectura hexagonal del proyecto. Usar inmediatamente después de escribir o modificar código.
---

# Code Review

Revisión de calidad después de codear. Se hace con contexto fresco, antes de cerrar la tarea.

## Cuándo usar

- Inmediatamente después de escribir o modificar código.
- Antes de un commit o PR.
- Después de un refactor.
- Cuando se revisa el trabajo de otro agente o sesión.

## Niveles de severidad

| Nivel | Acción |
|-------|--------|
| CRITICAL | Frenar. No avanzar hasta fixear. (seguridad, data loss, bug en flujo crítico) |
| HIGH | Fixear antes de cerrar la tarea. (error handling faltante, edge case importante) |
| MEDIUM | Fixear cuando sea posible. (naming, duplicación menor, performance) |
| LOW | Notar, no bloquea. (estilo, comentarios opcionales) |

## Qué revisar

### 1. Arquitectura hexagonal
- ¿La lógica de negocio está en `domain/`, no en `infrastructure/` o `presentation/`?
- ¿El dominio depende de interfaces, no de implementaciones concretas?
- ¿Los casos de uso (`application/`) orquestan sin acoplarse a Supabase o Next.js?
- ¿Las rutas de API (`presentation/`) son thin controllers que delegan al application?

### 2. Correctitud
- ¿Edge cases cubiertos? (empty, null, undefined, límites, concurrencia)
- ¿Errores manejados en cada nivel?
- ¿Validación de input en los boundaries del sistema?
- ¿Estados y transiciones correctos? (ej: lead no puede pasar de "perdido" a "aceptado")

### 3. Seguridad (ver skill `security-review` para detalle)
- ¿Permisos verificados antes de operaciones sensibles?
- ¿RLS de Supabase activo en tablas nuevas?
- ¿Multi-tenant respeta el aislamiento por organización?
- ¿No hay secrets hardcodeados?

### 4. Calidad de código (ver skill `coding-standards`)
- ¿Funciones < 50 líneas?
- ¿Archivos < 800 líneas?
- ¿Anidamiento < 4 niveles?
- ¿Naming descriptivo?
- ¿Inmutabilidad (spread, no mutation)?
- ¿DRY sin over-engineering?

### 5. Tests
- ¿Hay tests para el código nuevo?
- ¿Cobertura 80%+?
- ¿Tests cubren happy path + errores + edge cases?
- ¿Tests son independientes entre sí?

### 6. Consistencia con FACILIA
- ¿Sigue las convenciones del proyecto (naming, estructura de carpetas)?
- ¿Usa las abstracciones existentes (componentes UI, helpers, repos)?
- ¿No reintroduce patrones que ya se decidieron evitar?

## Flujo de revisión

### 1. Diff review
```bash
git diff --stat
git diff HEAD~1 --name-only
```
Revisar cada archivo cambiado por cambios no intencionales, error handling faltante, edge cases.

### 2. Revisión por archivo
Por cada archivo cambiado:
- Leer el cambio completo
- Verificar contra el checklist de arriba
- Anotar issues con severidad

### 3. Reporte

```text
CODE REVIEW REPORT
==================
Archivos revisados: X

CRITICAL: X
HIGH: X
MEDIUM: X
LOW: X

Issues:
1. [CRITICAL] auth/route.ts:42 — No verifica rol antes de crear usuario
2. [HIGH] cotizador/engine.ts:88 — No maneja frecuencia null
3. [MEDIUM] Button.tsx:15 — Nombre de prop "v" poco claro

Veredicto: [APROBADO / APROBADO CON NOTAS / RECHAZADO]
```

## Anti-patrones al revisar

- **Revisar solo el happy path** — buscar qué rompe, no qué funciona.
- **Ignorar tests** — si no hay tests, es HIGH mínimo.
- **Ser complaciente con seguridad** — security issues son siempre CRITICAL o HIGH.
- **Pedir perfección** — MEDIUM y LOW no bloquean. No convertir review en bikeshedding.
- **No revisar la arquitectura** — código en la capa wrong es HIGH (genera deuda técnica estructural).

## Buen outcome

- Issues CRITICAL y HIGH fixeados antes de cerrar.
- El código sigue la arquitectura hexagonal del proyecto.
- Hay tests que cubren lo nuevo.
- El diff no tiene cambios no intencionales.
