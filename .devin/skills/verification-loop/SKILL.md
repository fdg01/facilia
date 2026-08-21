---
name: verification-loop
description: Sistema de verificación comprehensivo antes de declarar una tarea completa. Build, tipos, lint, tests, seguridad y diff review. Usar después de completar una feature o cambio significativo, y antes de un PR.
---

# Verification Loop

Verificación comprehensiva antes de cerrar. Ninguna tarea se declara completa sin pasar por este loop.

## Cuándo usar

- Después de completar una feature o cambio significativo.
- Antes de crear un PR.
- Después de un refactor.
- Antes de decir "está listo".

## Fases

### Fase 1: Build
```bash
npm run build
```
Si el build falla, frenar y fixear antes de continuar.

### Fase 2: Type check
```bash
npx tsc --noEmit
```
Reportar todos los errores de tipos. Fixear los críticos antes de continuar.

### Fase 3: Lint
```bash
npm run lint
```
Reportar warnings y errores. Fixear errores antes de continuar.

### Fase 4: Tests con cobertura
```bash
npm run test -- --coverage
```
Reportar:
- Total tests: X
- Pasaron: X
- Fallaron: X
- Cobertura: X% (mínimo 80%)

### Fase 5: Security scan
- Buscar secrets hardcodeados (API keys, tokens, passwords).
- Buscar `console.log` que puedan filtrar data sensible.
- Verificar que no haya secrets en el diff.

```bash
# Secrets
grep -rn "sk-\|api_key\|password\|secret" --include="*.ts" --include="*.tsx" src/ | head -20
# Console.log en src
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ | head -10
```

### Fase 6: Diff review
```bash
git diff --stat
git diff HEAD~1 --name-only
```
Revisar cada archivo cambiado por:
- Cambios no intencionales
- Error handling faltante
- Edge cases potenciales
- Secrets o data sensible

## Reporte de verificación

Después de correr todas las fases, producir:

```text
VERIFICATION REPORT
==================
Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errores)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y pasaron, Z% cobertura)
Security:  [PASS/FAIL] (X issues)
Diff:      [X archivos cambiados]

Overall:   [READY / NOT READY] para PR

Issues a fixear:
1. ...
2. ...
```

## Modo continuo

Para sesiones largas, correr verificación cada 15 minutos o después de cambios mayores:
- Después de completar cada función
- Después de terminar un componente
- Antes de pasar a la siguiente tarea

## Integración con code-review

Este skill complementa al skill `code-review`:
- `code-review` revisa calidad y arquitectura del código.
- `verification-loop` verifica que las gates automáticas pasen.
- Ambos deben pasar antes de cerrar.

## Regla de oro

**Si el reporte overall es NOT READY, la tarea NO está completa.** No declarar éxito con verificación pendiente.
