# Motora — Documentación del Backend

> Firebase Cloud Functions v2 · Node.js · TypeScript · Firestore (NoSQL)

---

## Índice

1. [Arquitectura general](#arquitectura-general)
2. [Colecciones Firestore](#colecciones-firestore)
3. [Modelos](#modelos)
4. [Servicios](#servicios)
5. [Controladores (Callable Handlers)](#controladores)
6. [Reglas de negocio](#reglas-de-negocio)
7. [Patrones transversales](#patrones-transversales)
8. [Estado de implementación](#estado-de-implementación)

---

## Arquitectura general

```
functions/src/
├── index.ts                   # Entry point — registra todas las funciones exportadas
├── models/                    # Interfaces, enums y tipos compartidos
│   ├── user.model.ts
│   ├── vehicle.model.ts
│   ├── business.model.ts
│   └── appointment.model.ts
├── services/                  # Lógica de negocio (sin acceso directo a HTTP)
│   ├── user.service.ts
│   ├── vehicles.service.ts
│   ├── tasks.service.ts
│   ├── ai-tasks.service.ts
│   └── prompt-engine.service.ts
└── controllers/               # Callable handlers (capa HTTP)
    ├── auth.controller.ts
    ├── user.controller.ts
    ├── vehicles.controller.ts
    └── ai.controller.ts
```

Todas las funciones callable corren en la región **us-central1** con `maxInstances: 10`.
El trigger de Auth (`onUserCreated`) corre en v1 y se activa automáticamente al registrarse un usuario.

---

## Colecciones Firestore

### `users/{uid}`
| Campo | Tipo | Descripción |
|---|---|---|
| uid | string | UID de Firebase Auth |
| profile | UserProfile | Datos del perfil |
| stats | UserStats | Contadores y timestamps de uso |
| subscriptionTier | FREE \| PREMIUM | Nivel de suscripción |
| createdAt | Timestamp | Creación |
| updatedAt | Timestamp | Última modificación |

### `vehicles/{vehicleId}`
| Campo | Tipo | Descripción |
|---|---|---|
| id | string | ID autogenerado |
| ownerId | string | UID del dueño |
| data | VehicleData | Datos técnicos del vehículo |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

### `vehicles/{vehicleId}/maintenanceLog/{entryId}` *(subcolección)*
### `vehicles/{vehicleId}/tasks/{taskId}` *(subcolección)*
### `vehicles/{vehicleId}/odb2Diagnostics/{entryId}` *(subcolección)*
### `vehicles/{vehicleId}/documents/{docId}` *(subcolección)*

> **Nota:** Firestore no elimina subcolecciones automáticamente. Cada función de borrado aplica un batch delete manual sobre todas las subcolecciones del vehículo.

### `businesses/{businessId}` *(modelado, no implementado aún)*
### `appointments/{appointmentId}` *(modelado, no implementado aún)*

---

## Modelos

### UserProfile
```typescript
{
  name: string
  gender: UserGender          // MALE | FEMALE | OTHER | PREFER_NOT_TO_SAY
  age: number
  activeRole: UserRole        // CLIENT | BUSINESS
  country?: string
}
```

### UserStats
```typescript
{
  vehicleCount: number
  businessCount: number
  diagnosticCount: number
  aiTaskCount: number
  lastAiUsage?: Timestamp     // Para rate limiting de IA
}
```

### VehicleData
```typescript
{
  brand: string
  model: string
  year: number
  licensePlate: string
  currentKm: number
}
```

### MaintenanceLogEntry
```typescript
{
  id: string
  type: MaintenanceType       // Ver enum abajo
  description: string
  kmAtService: number
  performedAt: Timestamp      // Inmutable después de creación
  cost?: number
  businessId?: string
  notes?: string
}
```

**Enum `MaintenanceType`:**
`OIL_CHANGE` · `TIRE_ROTATION` · `BRAKE_SERVICE` · `FILTER_REPLACEMENT` · `GENERAL_INSPECTION` · `DIAGNOSTIC` · `OTHER`

### VehicleTask
```typescript
{
  id: string
  type: string                // Texto libre
  description: string
  scheduledDate?: string      // ISO 8601, opcional
  status: TaskStatus          // PENDING | COMPLETED
  createdAt: Timestamp        // Inmutable
}
```

### Odb2Diagnostic
```typescript
{
  id: string
  description: string
  kmAtService: number
  performedAt: Timestamp
  notes: string               // JSON stringificado con DiagnosticNotes
  iaTranslation?: string      // Resultado de la interpretación IA
}
```

### VehicleDocEntry
```typescript
{
  id: string
  type: DocumentType           // DRIVERS_LICENSE | TECHNICAL_INSPECTION | INSURANCE_POLICY | OTHER
  expirationDate: string       // ISO 8601 YYYY-MM-DD
  notificationEnabled: boolean // Solo modificable por usuarios PREMIUM
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Enum `DocumentType`:**
`DRIVERS_LICENSE` · `TECHNICAL_INSPECTION` · `INSURANCE_POLICY` · `OTHER`

---

### BusinessDocument *(modelado)*
```typescript
{
  id: string
  ownerId: string
  info: BusinessInfo          // name, description, address, location, phone, email, categories, logoUrl?
  subscriptionTier: DEFAULT | PLUS
  createdAt, updatedAt: Timestamp
}
```

### AppointmentDocument *(modelado)*
```typescript
{
  id: string
  clientId: string
  businessId: string
  vehicleId: string
  scheduledAt: Timestamp
  status: PENDING | CONFIRMED | CANCELLED | COMPLETED
  notes?: string
  createdAt, updatedAt: Timestamp
}
```

---

## Servicios

### `user.service.ts`

| Función | Descripción | Reglas |
|---|---|---|
| `getUserDocument(uid)` | Recupera el documento completo del usuario | Lanza `not-found` si no existe |
| `updateUserProfile(uid, data)` | Actualiza campos del perfil (sin `activeRole`) | Si el doc no existe lo crea (manejo de race condition con trigger de Auth) |
| `switchActiveRole(uid, role)` | Cambia entre rol CLIENT/BUSINESS | Lanza `not-found` si el usuario no existe |
| `deleteUserAccount(uid)` | Eliminación en cascada completa | Borra maintenanceLogs → vehicles → user doc → Auth record |

**Eliminación en cascada de cuenta:**
1. Por cada vehículo: elimina batch de `maintenanceLog`, `tasks`, `odb2Diagnostics`, `documents`
2. Elimina todos los documentos de vehículos
3. Elimina el documento del usuario en Firestore
4. Elimina el registro en Firebase Auth (sesión termina por `onAuthStateChanged`)

---

### `vehicles.service.ts`

| Función | Descripción | Reglas |
|---|---|---|
| `addVehicle(uid, data)` | Crea vehículo y actualiza contador | Verifica límite de tier; batch atómico vehículo + `stats.vehicleCount++` |
| `getUserVehicles(uid)` | Lista todos los vehículos del usuario | Ordenados por `createdAt desc` |
| `updateVehicle(uid, vehicleId, data)` | Actualiza campos parciales | Verifica existencia + ownership; usa prefijos `data.*` para no sobrescribir campos no enviados |
| `deleteVehicle(uid, vehicleId)` | Borra vehículo + subcolecciones | Batch atómico: borra vehicle + `stats.vehicleCount--` + cascada de subcolecciones |
| `addMaintenanceEntry(uid, vehicleId, entry)` | Agrega entrada al historial | Verifica existencia + ownership |
| `getMaintenanceLog(uid, vehicleId)` | Lista historial de mantenimiento | Ordenado por `performedAt desc` |
| `updateMaintenanceEntry(uid, vehicleId, entryId, data)` | Actualiza entrada (sin tocar `performedAt`) | `performedAt` es inmutable por diseño |
| `deleteMaintenanceEntry(uid, vehicleId, entryId)` | Borra entrada individual | |
| `addOdb2Diagnostic(uid, vehicleId, entry)` | Agrega diagnóstico OBD2 | |
| `getOdb2Diagnostics(uid, vehicleId)` | Lista diagnósticos OBD2 | Ordenados por `performedAt desc` |
| `deleteOdb2Diagnostic(uid, vehicleId, entryId)` | Borra diagnóstico individual | |
| `addVehicleDoc(uid, vehicleId, entry)` | Agrega documento al vehículo | Verifica existencia + ownership; valida DocumentType enum |
| `getVehicleDocs(uid, vehicleId)` | Lista documentos del vehículo | Ordenados por `createdAt desc` |
| `updateVehicleDoc(uid, vehicleId, docId, data)` | Actualiza documento | Verifica existencia + ownership; valida DocumentType si se envía |
| `deleteVehicleDoc(uid, vehicleId, docId)` | Borra documento individual | |

**Patrón de actualización parcial con prefijos:**
```typescript
// Evita sobreescribir campos no enviados dentro de objetos anidados
const updates: Record<string, unknown> = {};
for (const [key, value] of Object.entries(data)) {
  updates[`data.${key}`] = value;
}
await vehicleRef.update(updates);
```

---

### `tasks.service.ts`

| Función | Descripción | Reglas |
|---|---|---|
| `addTask(uid, vehicleId, task)` | Crea tarea en subcolección | Verifica existencia + ownership; asigna `createdAt` automático |
| `getTasks(uid, vehicleId)` | Lista todas las tareas | Ordenadas por `createdAt desc` |
| `updateTask(uid, vehicleId, taskId, data)` | Actualiza campos de la tarea | `scheduledDate: null` usa `FieldValue.delete()` para eliminar el campo opcional |
| `deleteTask(uid, vehicleId, taskId)` | Borra tarea individual | |
| `deleteTasksForVehicle(vehicleId)` | Batch delete de todas las tareas | Función interna para cascada al borrar vehículo |

---

### `ai-tasks.service.ts`

#### `suggestMaintenanceTask(uid, vehicleId)`

Genera una sugerencia de tarea de mantenimiento usando **gpt-4o-mini** vía Vercel AI SDK (`generateObject` con esquema Zod).

**Validaciones (en orden):**
1. Usuario existe (`not-found`)
2. Tier PREMIUM (`permission-denied`)
3. Rate limit: mínimo 60s desde `lastAiUsage` (`resource-exhausted`)
4. Vehículo existe + ownership (`not-found` / `permission-denied`)

**Contexto enviado al LLM:**
- Últimas 15 entradas de mantenimiento
- Todas las tareas PENDING
- Último diagnóstico OBD2 (tipo DIAGNOSTIC)
- Datos del vehículo (marca, modelo, año, KM, patente)
- Fecha actual en español argentino

**Sistema persona del LLM:**
> Mecánico experto con 20+ años en Córdoba, Argentina. Lenguaje coloquial ("vos", "ché"). Prioriza seguridad. Evita duplicar tareas pendientes. Sugiere fecha realista futura.

**Output (validado por Zod):**
```typescript
{
  suggestedType: string       // Ej: "Cambio de aceite"
  description: string         // Concreto y accionable
  recommendedDate: string     // ISO 8601 YYYY-MM-DD
  explanation: string         // Justificación en español coloquial
}
```

**Side effects:** Incrementa `stats.aiTaskCount`, actualiza `stats.lastAiUsage`.

---

### `prompt-engine.service.ts`

| Función | Estado | Descripción |
|---|---|---|
| `buildDiagnosticPrompt(ctx)` | Implementado | Construye el prompt de usuario a partir del contexto del vehículo y códigos DTC |
| `interpretDtcCode(context)` | **Mocked** | Interpreta códigos OBD2. Actualmente devuelve respuestas simuladas. Pendiente integración real con LLM (OpenAI/Anthropic). |

**Output esperado de `interpretDtcCode`:**
```typescript
{
  summary: string
  urgencyLevel: LOW | MEDIUM | HIGH | CRITICAL
  actionRequired: string
  technicalDetail: string
  dtcInterpretations: Array<{ code, description, possibleCauses[] }>
}
```

---

## Controladores

Todos los handlers son **callable functions** (invocados desde el cliente con el SDK de Firebase, no son endpoints REST públicos). Todos requieren autenticación salvo `onUserCreated`.

### Auth Controller

| Handler | Tipo | Descripción |
|---|---|---|
| `onUserCreated` | Auth Trigger (v1) | Se dispara al crear un usuario. Inicializa el documento `users/{uid}` con perfil vacío, stats en 0, tier FREE y rol CLIENT. |

---

### User Controller

| Handler | Input | Output | Validaciones |
|---|---|---|---|
| `getUserProfileHandler` | `void` | `UserDocument` | Auth |
| `updateUserProfileHandler` | `Partial<UserProfile>` (sin `activeRole`) | `{ success: true }` | Auth · al menos un campo |
| `switchActiveRoleHandler` | `{ role: UserRole }` | `{ success: true, activeRole }` | Auth · role enum válido |
| `deleteAccountHandler` | `void` | `{ success: true }` | Auth |

---

### Vehicles Controller

**Vehículos:**

| Handler | Input | Output | Validaciones |
|---|---|---|---|
| `addVehicleHandler` | `VehicleData` | `VehicleDocument` | Auth · todos los campos requeridos |
| `getUserVehiclesHandler` | `void` | `VehicleDocument[]` | Auth |
| `updateVehicleHandler` | `{ vehicleId, data }` | `{ success: true }` | Auth · vehicleId · data no vacío |
| `deleteVehicleHandler` | `{ vehicleId }` | `{ success: true }` | Auth · vehicleId |

**Mantenimiento:**

| Handler | Input | Output | Validaciones |
|---|---|---|---|
| `addMaintenanceEntryHandler` | `{ vehicleId, entry }` | `MaintenanceLogEntry` | Auth · vehicleId · type · description · kmAtService ≠ null · type en enum |
| `getMaintenanceLogHandler` | `{ vehicleId }` | `MaintenanceLogEntry[]` | Auth · vehicleId |
| `updateMaintenanceEntryHandler` | `{ vehicleId, entryId, data }` | `{ success: true }` | Auth · vehicleId · entryId · data no vacío · type enum si presente |
| `deleteMaintenanceEntryHandler` | `{ vehicleId, entryId }` | `{ success: true }` | Auth · ambos campos |

**OBD2:**

| Handler | Input | Output | Validaciones |
|---|---|---|---|
| `addOdb2DiagnosticHandler` | `{ vehicleId, entry }` | `Odb2Diagnostic` | Auth · vehicleId · entry.notes · entry.kmAtService |
| `getOdb2DiagnosticsHandler` | `{ vehicleId }` | `Odb2Diagnostic[]` | Auth · vehicleId |
| `deleteOdb2DiagnosticHandler` | `{ vehicleId, entryId }` | `{ success: true }` | Auth · ambos campos |

**Tareas:**

| Handler | Input | Output | Validaciones |
|---|---|---|---|
| `addTaskHandler` | `{ vehicleId, task }` | `VehicleTask` | Auth · vehicleId · task.type (trimmed) · task.description (trimmed) · status enum |
| `getTasksHandler` | `{ vehicleId }` | `VehicleTask[]` | Auth · vehicleId |
| `updateTaskHandler` | `{ vehicleId, taskId, data }` | `{ success: true }` | Auth · vehicleId · taskId · data no vacío · status enum si presente |
| `deleteTaskHandler` | `{ vehicleId, taskId }` | `{ success: true }` | Auth · ambos campos |

**Documentos:**

| Handler | Input | Output | Validaciones |
|---|---|---|---|
| `addVehicleDocHandler` | `{ vehicleId, entry }` | `VehicleDocEntry` | Auth · vehicleId · entry.type · entry.expirationDate · type en enum |
| `getVehicleDocsHandler` | `{ vehicleId }` | `VehicleDocEntry[]` | Auth · vehicleId |
| `updateVehicleDocHandler` | `{ vehicleId, docId, data }` | `{ success: true }` | Auth · vehicleId · docId · data no vacío · type enum si presente |
| `deleteVehicleDocHandler` | `{ vehicleId, docId }` | `{ success: true }` | Auth · ambos campos |

---

### AI Controller

| Handler | Input | Output | Tier | Rate Limit |
|---|---|---|---|---|
| `interpretDiagnostic` | `DiagnosticContext` | `DiagnosticResult` | — | — |
| `suggestMaintenanceTaskHandler` | `{ vehicleId }` | `TaskSuggestion` | PREMIUM | 60s por usuario |

---

## Reglas de negocio

### Límites por tier

| Recurso | FREE | PREMIUM |
|---|---|---|
| Vehículos | 2 | ∞ |
| Negocios | 1 | ∞ |
| Sugerencias IA | No | Sí (rate limit 60s) |

Enforcement: verificado en `addVehicle` antes de escribir. Error: `resource-exhausted`.

### Ownership (autorización de recursos)

Toda operación sobre vehículos, mantenimiento, tareas y diagnósticos verifica:
1. El documento existe (`not-found`)
2. `document.ownerId === uid` (`permission-denied`)

### Inmutabilidad de campos

- `performedAt` (fecha de servicio): no se puede modificar después de crear la entrada.
- `createdAt` en tareas: asignado al crear, no expuesto para update.

### Eliminación de `scheduledDate` en tareas

Enviar `scheduledDate: null` en el update de una tarea activa `FieldValue.delete()` para eliminar el campo opcional del documento.

### Race condition en creación de perfil

Si `updateUserProfile` se llama antes de que el trigger `onUserCreated` haya creado el documento (posible en dispositivos lentos), el servicio crea el documento con valores por defecto antes de aplicar el update.

---

## Patrones transversales

### `assertAuth(request)`
Función utilitaria usada en todos los handlers. Lanza `HttpsError("unauthenticated")` si `request.auth` es falsy.

### Errores estándar

| Código | Escenario |
|---|---|
| `unauthenticated` | Token ausente o inválido |
| `not-found` | Documento no existe en Firestore |
| `permission-denied` | El usuario no es dueño del recurso, o feature requiere PREMIUM |
| `resource-exhausted` | Límite de vehículos alcanzado, o rate limit de IA |
| `invalid-argument` | Campos requeridos ausentes, o valor fuera de enum |

### Batch writes para atomicidad

Operaciones que afectan múltiples documentos usan `WriteBatch`:
- `addVehicle`: vehículo + `vehicleCount++` en stats
- `deleteVehicle`: vehículo + `vehicleCount--` + cleanup de subcolecciones

### Tipado estricto

Todo el código usa TypeScript con tipos explícitos. No se usa `any`. Los inputs de los handlers están tipados con `CallableRequest<T>`.

---

## Estado de implementación

| Módulo | Estado |
|---|---|
| Auth (registro, login, trigger) | ✅ Completo |
| CRUD Usuarios (perfil, rol, borrado) | ✅ Completo |
| CRUD Vehículos | ✅ Completo |
| Historial de Mantenimiento | ✅ Completo |
| Tareas de Mantenimiento | ✅ Completo |
| Diagnósticos OBD2 (almacenamiento) | ✅ Completo |
| CRUD Documentos del vehículo (carnet, VTV, seguro) | ✅ Completo |
| Interpretación DTC con IA | ⚠️ Mocked (pendiente integración LLM real) |
| Sugerencia de Tareas con IA (PREMIUM) | ✅ Completo (gpt-4o-mini, Vercel AI SDK) |
| CRUD Negocios (`businesses`) | 🔲 Modelado, no implementado |
| CRUD Turnos (`appointments`) | 🔲 Modelado, no implementado |
| Búsqueda de negocios por ubicación | 🔲 No iniciado |
| Switch de perfil CLIENT ↔ BUSINESS | ✅ Handler completo (UI pendiente) |
