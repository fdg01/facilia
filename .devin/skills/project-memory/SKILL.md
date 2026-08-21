---
name: project-memory
description: Memoria durable del proyecto FACILIA entre sesiones. Decisiones de arquitectura, patrones adoptados, lecciones aprendidas y estado del Roadmap. Usar al iniciar una sesión nueva, al tomar una decisión de arquitectura, o al aprender algo que hay que recordar.
---

# Project Memory

Memoria durable del proyecto. Lo que importa sobrevive entre sesiones en archivos, no en contexto del modelo.

## Cuándo usar

- Al iniciar una sesión nueva: leer la memoria para recuperar contexto.
- Al tomar una decisión de arquitectura: registrarla.
- Al aprender algo (un patrón que funcionó, un bug que costó): registrarlo.
- Al cerrar una feature: actualizar el estado del Roadmap.

## Dónde vive la memoria

```
docs/
├── decisions/            # Decisiones de arquitectura (ADR)
│   ├── 001-monorepo-hexagonal.md
│   ├── 002-supabase-rls-multi-tenant.md
│   └── ...
├── patterns/             # Patrones adoptados
│   ├── hexagonal-module-structure.md
│   └── ...
└── lessons/              # Lecciones aprendidas
    ├── 2026-08-19-rls-trap.md
    └── ...
```

`Roadmap.md` es la fuente de verdad del estado del producto.
`AGENTS.md` es la fuente de verdad de convenciones del repo.

## Qué registrar

### Decisiones de arquitectura (ADR)
Cada decisión significativa de arquitectura se registra con:
- **Contexto:** qué problema se estaba resolviendo.
- **Decisión:** qué se decidió.
- **Alternativas:** qué más se consideró y por qué se descartó.
- **Consecuencias:** qué trade-offs aceptamos.

```markdown
# ADR-001: Monorepo hexagonal

## Contexto
FACILIA tiene 6 apps con público y dispositivo distintos pero un mismo núcleo de negocio.

## Decisión
Monorepo con arquitectura hexagonal por área de negocio. Una sola base de datos, un solo deploy.

## Alternativas
- Microservicios: descartado por overhead operativo con carga baja.
- Polyrepo por app: descartado por duplicación de lógica compartida.

## Consecuencias
- Pros: código compartido fácil, consistencia, deploy simple.
- Contras: acoplamiento entre apps si no se respetan las capas hexagonales.
```

### Patrones adoptados
Cuando un patrón funciona bien, documentarlo para que se repita:
- Estructura de un módulo hexagonal.
- Cómo se hace un caso de uso.
- Cómo se mockea Supabase en tests.
- Cómo se estructura una API route.

### Lecciones aprendidas
Cuando algo sale mal o costó, registrar la lección:
- Qué pasó.
- Por qué pasó.
- Cómo evitarlo la próxima vez.

### Estado del Roadmap
Al cerrar una feature, marcarla en `Roadmap.md` y notar qué sigue.

## Qué NO registrar acá

- **Notas temporales de debugging** → van en el contexto de la sesión, no en archivos.
- **Preferencias personales** → van en AGENTS.md si son del proyecto, o se descartan.
- **Duplicación** → si el código o los docs ya dicen algo, no repetirlo en memoria.

## Reglas

- **Persistir todo lo demás.** El contexto del modelo se pierde; los archivos no.
- **Una fuente de verdad.** Si algo ya está en el Roadmap o AGENTS.md, no duplicarlo.
- **Marcar lo abierto.** Si una decisión no se tomó, dejarla como pregunta abierta, no inventar.
- **Actualizar al cerrar.** Al terminar una feature, actualizar el estado antes de declarar completo.

## Flujo al iniciar sesión

1. Leer `Roadmap.md` para saber dónde está el proyecto.
2. Leer `AGENTS.md` para convenciones del repo.
3. Leer `docs/decisions/` más recientes para decisiones vigentes.
4. Leer `docs/lessons/` más recientes para no repetir errores.

## Flujo al cerrar sesión

1. Si se tomó una decisión de arquitectura → escribir ADR.
2. Si se aprendió algo → escribir lesson.
3. Si se cerró una feature → actualizar Roadmap.
4. Si se adoptó un patrón → documentarlo en `docs/patterns/`.
