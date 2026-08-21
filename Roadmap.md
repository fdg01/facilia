# FACILIA — Roadmap de producto

## Cómo está organizado este plan

- **Un solo repositorio** con todo el código junto (monorepo).
- **Arquitectura hexagonal por área de negocio**: cada área separa su lógica de negocio de su presentación y de su infraestructura, para poder crecer y cambiar sin romper lo que ya anda.
- **Infraestructura simple**: una sola base de datos y un solo deploy. La carga de usuarios es baja y no justifica separar servidores ni microservicios.
- **Se separa en "apps"** (frentes de uso distintos) cuando el público o el momento de uso son diferentes. Cada app es un frente web que se conecta al mismo núcleo. Todas son web, mobile-first y responsive para desktop.

## Stack técnico

- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript estricto
- **Base de datos + Auth:** Supabase self-hosted (Docker, mismo ecosistema on-premise)
- **Estilos:** Tailwind CSS
- **PDF:** @react-pdf/renderer
- **Deploy:** Docker (un solo deploy, mismo ecosistema)
- **Tests:** Vitest (unit + integration) + Playwright (E2E)
- **Validación:** Zod

## Apps del sistema

| # | App | Público | Dispositivo | Momento de uso |
|---|---|---|---|---|
| 1 | Núcleo de Identidad | Todos (compartido) | — | Base de todo |
| 2 | Web Pública + Cotizador | Visitante / Cliente | Web | Comercial |
| 3 | Panel de Admin | Admin de FACILIA | Web | Configuración y gestión |
| 4 | Panel de Operaciones | Admin / Planificador | Web | Planificación |
| 5 | App de Campo | Empleado | Web (mobile-first, responsive desktop) | Ejecución del servicio |
| 6 | Portal del Cliente | Cliente | Web | Autoservicio |

---

## 1. Núcleo de Identidad (compartido)

Base común a todas las apps. Sin esto no funciona nada.

### Usuarios y roles
- Al arrancar el sistema por primera vez, se crea automáticamente un usuario **Admin** inicial (seed).
- El Admin puede crear:
  - **Empleados** (rol empleado)
  - **Otros Admin** (rol admin)
  - **Clientes** (rol cliente)

### Reglas de acceso
- Cualquier usuario puede cambiar su propia contraseña.
- Un Admin puede cambiar la contraseña de cualquier usuario.
- Un Admin puede **inactivar** usuarios: siguen siendo visibles en el sistema pero no pueden entrar.
- Los **clientes** tienen definida una organización y se agrupan en el panel de admin por organización.

### Organizaciones
- Cada cliente pertenece a una organización (la empresa cliente de FACILIA).
- El panel de admin muestra los clientes agrupados por su organización.

---

## 2. Web Pública + Cotizador

### Landing
Página de presentación de FACILIA, sus tres líneas (Clean, Care, Continuity) y llamado a cotizar.

### Cotizador (DAG parametrizable, una sola pantalla)
- **No es un wizard lineal de pasos.** Es un árbol de decisiones que se va abriendo en una sola pantalla, sin cambiar de página.
- El cliente parte de un punto, elige, y según lo que eligió se le abren nuevas opciones abajo. Todo fluye.
- La información va apareciendo de forma **opcional y progresiva**: según lo que el cliente va pidiendo, aparecen o no opciones.
- El precio se calcula **en vivo** mientras completa.
- Es un **DAG (grafo dirigido acíclico)**, no un árbol puro: una misma opción puede alcanzarse por caminos distintos. Por ejemplo, "vajilla premium" puede aparecer tanto si el cliente llegó por Clean → Oficina como si llegó por Continuity → Insumos críticos. Una opción se configura una sola vez y se conecta a los nodos que correspondan. No se duplica.

**Las tres líneas son los nodos raíz del DAG:**

```
Cliente entra al cotizador
  → "¿Qué necesitás?"
     ├── Limpieza (Clean)
     │     → ¿Qué espacios?
     │        ├── Oficinas → metros², frecuencia, opcionales...
     │        ├── Local comercial → ...
     │        └── ...
     ├── Mantenimiento (Care)
     │     → ¿Qué tipo?
     │        ├── Preventivo → qué mantener, frecuencia...
     │        └── Correctivo → qué reparar, urgencia...
     └── Continuidad operativa (Continuity)
           → ¿Qué recursos?
              ├── Insumos críticos → ...
              ├── Reposición planificada → ...
              └── Monitoreo → ...
```

El cliente no ve "Paso 1, Paso 2, Paso 3". Ve una pantalla que va creciendo según lo que pide. Si elige Clean, nunca ve las opciones de Care. Si elige oficina, no ve las de local comercial.

**Cierre del recorrido (común a todas las líneas):**
- **Datos de contacto:** celular y email.
- **Revisión:** resumen de todo lo elegido con el precio calculándose en vivo.
- **Confirmación:** al enviar, recibe un número de presupuesto y el detalle final (costo mensual, costo por visita y regalo de bienvenida de 6 tazas sublimadas FACILIA). El presupuesto le llega por email en PDF.

### Panel comercial (interno)
- El equipo comercial ve cada presupuesto en su panel interno.
- Puede reenviarlo, marcarlo como aceptado o perdido, y ver el detalle completo.

---

## 3. Panel de Admin

Es la "oficina de atrás" del cotizador: lo que el admin configura una vez para que el cliente después vea todo armado.

**Principio de negocio:** para cambiar un precio o agregar un servicio nuevo, FACILIA no toca código; lo hace desde este panel y se refleja de inmediato en el cotizador.

**Principio de arquitectura:** la parametrización sigue un molde **reproducible y escalable**. Lo que se construye para configurar el cotizador sirve de patrón para configurar otras áreas del sistema después.

### a) Variables (lo estructural del servicio)
- Tipos de ambientes que se ofrecen y a qué ritmo los limpia un operario (rendimiento en m²/hora), más el costo de insumos por m².
- Frecuencias de visita y cuántas visitas al mes implica cada una.

### b) Consumibles (los opcionales que el cliente puede sumar)
- Vajilla, cafetera, dispensador, lavavajillas, ambientadores y los cuatro insumos, cada uno con sus niveles y precios.
- Para cada uno se define si la cantidad la pone el cliente (ej. "12 ambientadores"), si es fija (ej. "una cafetera") o si se calcula sola según los baños que eligió (ej. insumos de baño).

### c) Parámetros (el motor de precios)
- Costo de referencia por hora de operario.
- Margen comercial que FACILIA aplica encima del costo.
- Cómo se aplica ese margen (sobre el costo o sobre el precio final).
- Todo queda auditado: se registra quién y cuándo tocó cada parámetro.

### d) Editor del DAG (el recorrido del cliente)
- El admin arma los **nodos** (opciones que se le presentan al cliente) y las **aristas** (qué se muestra después de elegir qué).
- Cada nodo define: qué pregunta u opción presenta, si afecta el precio (y cómo), y a qué nodos habilita según la elección.
- Las tres líneas (Clean, Care, Continuity) son los nodos raíz. Desde ahí el admin conecta el resto.
- Una opción se configura una sola vez y se conecta a los nodos que correspondan (gracias al DAG, no se duplica).
- Esto reemplaza al wizard lineal de pasos: el cotizador se arma como un grafo, no como una secuencia fija.

### e) Extras y reglas avanzadas
- Servicios adicionales (sanitización semanal de vajilla, dispensadores extra).
- Presentaciones específicas (ej. "Salus 20lts" para el dispensador de agua).
- Reglas de cantidad complejas: por ejemplo, "1 dispensador de toallas por cada baño + cocina + barbacoa", o "1 jabón por cada dispensador de toallas contratado".
- Vajilla itemizada: cubiertos, platos, tazas y vasos se configuran por separado, cada uno con sus niveles.

---

## 4. Panel de Operaciones

Cuando un cliente pide una cotización y nos confirma por teléfono, el admin entra a la plataforma y confirma ese presupuesto. A partir de ahí arranca el frente operativo: convertir ese presupuesto en trabajo concreto.

### Flujo operativo
1. **Nace del contrato, no del presupuesto suelto.** Cuando una cotización se confirma y se firma el contrato, Operaciones toma ese contrato y arma un **Plan Operativo**: traduce lo que se vendió en actividades concretas.
2. **Programa las visitas.** Según la frecuencia contratada (diaria, semanal, mensual, reglas especiales tipo "primer viernes del mes"), genera el calendario de servicios, teniendo en cuenta feriados y excepciones.
3. **Crea órdenes de trabajo.** Cada visita o servicio puntual se convierte en una orden de trabajo: qué hay que hacer, dónde, cuándo, en qué ventana horaria.
4. **Asigna el personal.** Define qué operario o cuadrilla va a cada orden, registra quién aceptó, permite reasignar.
5. **Registra la ejecución en el campo.** El operario, desde el celular, marca la orden como hecha, completa checklists de calidad, sube fotos/videos como evidencia, hace firmar al cliente y registra incidencias si las hubo.
6. **Mide.** Compara tiempos reales vs. estimados, calcula cumplimiento del SLA y genera indicadores de desempeño.

### App de Campo (empleado)
- El empleado ve un panel operativo con las cotizaciones confirmadas que el admin le haya asignado.
- Desde el celular (web mobile-first) ejecuta cada orden de trabajo: checklists, evidencias, firma del cliente, registro de incidencias. También usable desde desktop.

---

## 5. Portal del Cliente

El cliente entra y ve **todo su historial de relación con FACILIA** (solo lo que le corresponde a él):

- **Resumen** de sus servicios activos y su próxima visita.
- **Servicios contratados:** frecuencia, alcance, horario.
- **Calendario operativo:** próximas visitas y servicios ya realizados.
- **Historial de servicios** con sus estados.
- **Evidencias:** fotos, reportes y documentos que FACILIA le autoriza a ver.
- **Contratos vigentes:** fechas, alcance.
- **Cotizaciones anteriores.**
- **Pagos.**
- **Iteraciones de cada servicio:** por ejemplo, "tal día se envió tal producto".
- **Crear solicitudes:** pedir un servicio extra, hacer una consulta o abrir un reclamo.
- **Recibir comunicaciones** de FACILIA.

---

## Orden de construcción sugerido

1. **Núcleo de Identidad** — sin esto no funciona nada.
2. **Panel de Admin + Cotizador** — el corazón comercial.
3. **Portal del Cliente (mínimo: mis cotizaciones)** — cierra el loop comercial.
4. **Panel de Operaciones + App de Campo** — el frente operativo.
5. **Portal del Cliente (completo: servicios, evidencias, solicitudes)** — el autoservicio total.
