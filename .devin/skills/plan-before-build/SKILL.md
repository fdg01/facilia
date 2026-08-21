---
name: plan-before-build
description: Planificar una feature o cambio antes de escribir código. Convierte una intención del Roadmap en un plan de implementación con constraints, interfaces y decisiones abiertas explícitas. Usar antes de cualquier feature que cruce múltiples archivos, módulos o apps.
---

# Plan Before Build

Convierte la intención de producto en un plan de implementación concreto. El plan existe para que no se descubran constraints escondidos a mitad del PR.

## Cuándo usar

- Antes de implementar cualquier feature del Roadmap de FACILIA.
- Antes de un refactor que toque múltiples archivos o módulos.
- Cuando una feature cruza más de una app (ej: Cotizador + Panel de Admin + Portal del Cliente).
- Cuando el Roadmap dice qué construir pero no cómo.

## Reglas no negociables

- **No inventar verdad de producto.** Si algo no está claro, marcarlo como pregunta abierta.
- **Separar promesas al usuario de detalles de implementación.**
- **Distinguir** qué es política fija, qué es preferencia de arquitectura, y qué sigue abierto.
- **Si el pedido choca con constraints existentes del repo, decirlo** en vez de suavizarlo.

## Flujo

### 1. Restatear la capability

Comprimir el pedido en una declaración precisa:
- quién es el usuario u operador
- qué capability nueva existe después de que esto salga
- qué outcome cambia por eso

Si esta declaración es débil, la implementación va a derivar.

### 2. Resolver constraints de la capability

Extraer lo que tiene que ser verdad antes de implementar:
- reglas de negocio
- límites de scope
- invariantes
- boundaries de confianza (qué rol ve qué)
- ownership de datos (qué app es dueña de qué tabla)
- transiciones de estado (ej: lead → confirmado → contrato → plan operativo)
- requisitos de rollout / migración
- expectativas de fallo y recuperación

### 3. Definir el contrato de implementación

Producir un plan con:
- resumen de la capability
- non-goals explícitos
- actores y surfaces (qué app, qué pantalla, qué API)
- estados y transiciones
- interfaces / inputs / outputs
- implicaciones de modelo de datos (tablas, campos, relaciones)
- constraints de seguridad / permisos / multi-tenant
- preguntas abiertas que bloquean implementación

### 4. Traducir a ejecución

Cerrar con el handoff exacto:
- listo para implementación directa
- necesita revisión de arquitectura primero
- necesita aclaración de producto primero

## Formato de salida

```text
CAPABILITY
- una declaración precisa de qué se construye

CONSTRAINTS
- reglas fijas, invariantes y boundaries

IMPLEMENTATION CONTRACT
- actores
- surfaces (apps del Roadmap involucradas)
- estados y transiciones
- interfaces / implicaciones de datos

NON-GOALS
- qué esta lane explícitamente no owna

OPEN QUESTIONS
- blockers o decisiones de producto pendientes

HANDOFF
- qué debería pasar ahora
```

## Contexto de FACILIA

Las apps del Roadmap son:
1. Núcleo de Identidad (compartido)
2. Web Pública + Cotizador
3. Panel de Admin
4. Panel de Operaciones
5. App de Campo (móvil)
6. Portal del Cliente

Arquitectura: monorepo, hexagonal por área de negocio, una sola base de datos (Supabase), un solo deploy.

Cuando planees, identificá qué apps se ven afectadas y qué módulos hexagonales (domain / application / infrastructure / presentation) se tocan.

## Buen outcome

- La intención de producto queda concreta enough para implementar sin redescubrir constraints escondidos a mitad del PR.
- El plan es un artefacto durable que sobrevive entre sesiones.
