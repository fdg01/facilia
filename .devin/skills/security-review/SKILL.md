---
name: security-review
description: Checklist de seguridad para FACILIA. Secretos, validación de input, RLS de Supabase, multi-tenant por organización, auth, autorización por rol. Usar al tocar auth, manejar input de usuario, crear endpoints, o implementar features sensibles.
---

# Security Review

Seguridad no es opcional. Una vulnerabilidad puede comprometer toda la plataforma y los datos de todos los clientes.

## Cuándo usar

- Implementar autenticación o autorización.
- Manejar input de usuario o file uploads.
- Crear endpoints de API nuevos.
- Trabajar con secrets o credenciales.
- Tocar tablas de Supabase (especialmente RLS).
- Implementar features multi-tenant (datos por organización).

## Checklist de FACILIA

### 1. Secretos

- [ ] No hay API keys, tokens ni passwords hardcodeados.
- [ ] Todos los secrets en variables de entorno.
- [ ] `.env.local` en `.gitignore`.
- [ ] No hay secrets en el historial de git.
- [ ] Secrets de producción en variables de entorno del Docker (no en código, no en git).

```typescript
// FAIL
const supabaseKey = "eyJhbGciOi..."  // hardcodeado

// PASS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
```

### 2. Validación de input

- [ ] Todo input de usuario validado con schema (Zod).
- [ ] File uploads restringidos (tamaño, tipo, extensión).
- [ ] No usar input de usuario directo en queries.
- [ ] Validación whitelist (no blacklist).
- [ ] Mensajes de error no filtran info sensible.

```typescript
import { z } from 'zod'

const CrearLeadSchema = z.object({
  celular: z.string().min(8),
  email: z.string().email(),
  ambientes: z.array(z.object({
    tipo: z.enum(['oficina', 'banio', 'cocina', 'sala_reuniones', 'auditorio', 'barbacoa']),
    m2: z.number().positive(),
  })).min(1),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CrearLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validación falló', details: parsed.error.issues }, { status: 400 })
  }
  // usar parsed.data
}
```

### 3. Row Level Security (Supabase)

**CRÍTICO para FACILIA:** toda tabla con datos de cliente debe tener RLS activo.

- [ ] RLS activado en todas las tablas con datos sensibles.
- [ ] Políticas que aseguren que un cliente solo ve sus propios datos.
- [ ] Políticas que aseguren que un empleado solo ve lo asignado.
- [ ] Políticas que aseguren que un admin ve todo de su organización.

```sql
-- Un cliente solo ve leads de su organización
CREATE POLICY "cliente ve sus leads"
  ON leads FOR SELECT
  USING (
    auth.uid() IN (
      SELECT profile_id FROM personas
      WHERE organizacion_id = leads.organizacion_id
    )
  );

-- Un empleado solo ve órdenes asignadas a él
CREATE POLICY "empleado ve sus ordenes"
  ON ordenes_trabajo FOR SELECT
  USING (
    auth.uid() IN (
      SELECT asignado_a FROM ordenes_trabajo WHERE id = ordenes_trabajo.id
    )
  );
```

### 4. Multi-tenant por organización

FACILIA tiene clientes agrupados por organización. El aislamiento es crítico:

- [ ] Un cliente NUNCA puede ver datos de otra organización.
- [ ] Las queries filtran por `organizacion_id` del usuario autenticado.
- [ ] Los endpoints verifican que el recurso pertenezca a la organización del usuario.
- [ ] No hay forma de pasar un `organizacion_id` arbitrario desde el cliente.

```typescript
// FAIL: el cliente puede pasar cualquier organizacion_id
const { data } = await supabase.from('leads').select('*').eq('organizacion_id', body.orgId)

// PASS: usar la organización del usuario autenticado
const user = await getSession()
const { data } = await supabase.from('leads').select('*').eq('organizacion_id', user.organizacionId)
```

### 5. Autenticación y autorización por rol

Roles de FACILIA: `admin`, `empleado`, `cliente`.

- [ ] Tokens en cookies httpOnly (no localStorage).
- [ ] Verificación de auth antes de operaciones sensibles.
- [ ] Verificación de rol antes de operaciones admin.
- [ ] Un admin no puede tocarse a sí mismo de forma que se quede sin acceso.
- [ ] Admin puede asignar cualquier rol (`admin`, `empleado`, `cliente`).

```typescript
// Verificar rol antes de operación admin
export async function crearUsuario(input: unknown, requester: Session) {
  if (requester.rol !== 'admin') {
    throw new ApiError(403, 'No autorizado')
  }
  // proceder
}
```

### 6. Prevención de inyección SQL

- [ ] Todas las queries usan parameterized queries o el query builder de Supabase.
- [ ] Sin concatenación de strings en SQL.

```typescript
// FAIL
const query = `SELECT * FROM leads WHERE id = '${leadId}'`

// PASS
const { data } = await supabase.from('leads').select('*').eq('id', leadId)
```

### 7. XSS

- [ ] HTML proporcionado por usuario sanitizado (DOMPurify).
- [ ] CSP headers configurados.
- [ ] Sin `dangerouslySetInnerHTML` sin sanitizar.

### 8. CSRF

- [ ] Tokens CSRF en operaciones que cambian estado.
- [ ] Cookies SameSite=Strict.

### 9. Rate limiting

- [ ] Rate limiting en endpoints de API.
- [ ] Límites más estrictos en operaciones costosas (cotizar, generar PDF).
- [ ] Límite por IP (anónimo) y por usuario (autenticado).

### 10. Exposición de data sensible

- [ ] No loguear passwords, tokens ni secrets.
- [ ] Mensajes de error genéricos al usuario.
- [ ] Errores detallados solo en logs del server.
- [ ] Sin stack traces expuestos al usuario.

```typescript
// FAIL
catch (error) {
  return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
}

// PASS
catch (error) {
  console.error('Error interno:', error)
  return NextResponse.json({ error: 'Ocurrió un error. Intentá de nuevo.' }, { status: 500 })
}
```

## Protocolo de respuesta a incidentes

Si se encuentra un issue de seguridad:
1. **Frenar** inmediatamente.
2. Fixear issues CRITICAL antes de continuar.
3. Rotar cualquier secret que pueda haber sido expuesto.
4. Revisar todo el codebase por issues similares.

## Checklist pre-deploy

- [ ] Secrets: no hardcodeados, todos en env vars
- [ ] Input: todo validado con schema
- [ ] SQL: todas las queries parameterized
- [ ] XSS: contenido de usuario sanitizado
- [ ] CSRF: protección activa
- [ ] Auth: tokens en httpOnly cookies
- [ ] Authz: checks de rol en su lugar
- [ ] RLS: activo en todas las tablas sensibles
- [ ] Multi-tenant: aislamiento por organización verificado
- [ ] Rate limiting: activo en endpoints
- [ ] HTTPS: forzado en producción
- [ ] Errors: sin data sensible en mensajes al usuario
- [ ] Logs: sin data sensible logueada
