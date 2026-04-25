# Arquitectura Backend — Motora (Firebase Cloud Functions)

**Última actualización:** 2026-04-12  
**Versión:** 1.0  
**Lenguaje:** Español

---

## 1. Resumen Ejecutivo

El backend de Motora está implementado como **Firebase Cloud Functions v2** en Node.js 22 con TypeScript. Actúa como API serverless que maneja:

- **Autenticación:** Trigger `onUserCreated` para crear documentos de usuario automáticamente
- **CRUD Vehículos:** Funciones callable para gestión completa de vehículos
- **Mantenimiento & Documentos:** Registro de servicios y certificados
- **Tareas & Diagnósticos:** CRUD para tareas pendientes y resultados OBD2
- **Inteligencia Artificial:** Interpretación de DTCs y sugerencias de mantenimiento (Vercel AI SDK + OpenAI)
- **Validación:** Schemas Zod para todas las entradas

---

## 2. Stack Tecnológico

| Componente | Versión | Propósito |
|---|---|---|
| **Node.js** | 22 | Runtime |
| **TypeScript** | 5.7.3 | Tipado estricto (strict mode) |
| **Firebase Admin SDK** | 13.6.0 | Auth + Firestore + Functions |
| **Firebase Cloud Functions** | 7.0.0 | v2 (HTTP) + v1 (triggers) |
| **Vercel AI SDK** | 6.0.140 | Abstracción LLM |
| **@ai-sdk/openai** | 3.0.48 | Provider OpenAI |
| **Zod** | 4.3.6 | Validación de esquemas |
| **ESLint** | 8.9.0 | Linting |

---

## 3. Estructura de Directorios

```
functions/
├── src/
│   ├── index.ts                        # Export de todas las funciones
│   │
│   ├── controllers/                    # Controladores (capa HTTP)
│   │   ├── auth.controller.ts          # onUserCreated (trigger)
│   │   ├── user.controller.ts          # CRUD usuario + perfil
│   │   ├── vehicles.controller.ts      # CRUD vehículos + mantenimiento
│   │   └── ai.controller.ts            # IA: interpretación y sugerencias
│   │
│   ├── services/                       # Lógica de negocio
│   │   ├── user.service.ts             # Operaciones usuario
│   │   ├── vehicles.service.ts         # CRUD vehículos + subcol
│   │   ├── tasks.service.ts            # CRUD tareas
│   │   ├── ai-tasks.service.ts         # Sugerencias IA (prompt + LLM)
│   │   └── prompt-engine.service.ts    # Interpretación DTC
│   │
│   ├── models/                         # Tipos e interfaces
│   │   ├── user.model.ts               # UserProfile, UserStats, etc.
│   │   ├── vehicle.model.ts            # VehicleData, Maintenance, OBD2, etc.
│   │   ├── business.model.ts           # Business (para futuro)
│   │   ├── appointment.model.ts        # Appointment (para futuro)
│   │   └── index.ts                    # Re-exports
│   │
│   └── lib/                            # Utilidades
│       └── (future: helpers, auth, etc.)
│
├── lib/                                # Salida compilada (TypeScript → JavaScript)
│
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── firebase.json
```

---

## 4. Modelos de Datos (Firestore)

### 4.1 Colección `users`

```typescript
interface UserDocument {
  uid: string;                           // ID de documento = UID de Firebase Auth
  profile: {
    name: string;                        // displayName del Auth
    gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
    age: number;
    activeRole: "CLIENT" | "BUSINESS";   // Rol actual (switcheable)
    country?: string;                    // País de residencia (ISO 3166)
  };
  stats: {
    vehicleCount: number;                // Contador de vehículos agregados
    businessCount: number;               // Contador de negocios (futuro)
    diagnosticCount: number;             // Diagnósticos OBD2 realizados
    aiTaskCount: number;                 // Llamadas a funciones IA
    lastAiUsage?: Timestamp;             // Rate limiting
  };
  subscriptionTier: "FREE" | "PREMIUM";  // Plan del usuario
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Límites por tier
TIER_LIMITS = {
  FREE: { vehicles: 2, businesses: 1 },
  PREMIUM: { vehicles: Infinity, businesses: Infinity },
};
```

### 4.2 Colección `vehicles`

```typescript
interface VehicleDocument {
  id: string;                            // ID único del vehículo
  ownerId: string;                       // UID del propietario
  data: {
    brand: string;                       // Marca (Fiat, Toyota, etc.)
    model: string;                       // Modelo
    year: number;                        // Año de fabricación
    licensePlate: string;                // Matrícula (normalizada a mayúscula)
    currentKm: number;                   // Kilómetros actuales
    bodyType?: "sedan" | "hatchback" | "suv" | "pick-up" | "furgon" | "minivan" | "rural";
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcolecciones:
// vehicles/{vehicleId}/maintenanceLog
// vehicles/{vehicleId}/tasks
// vehicles/{vehicleId}/odb2Diagnostics
// vehicles/{vehicleId}/documents
```

### 4.3 Subcolección `maintenanceLog`

```typescript
interface MaintenanceLogEntry {
  id: string;
  type: MaintenanceType;                 // OIL_CHANGE, TIRE_ROTATION, etc.
  description: string;                   // Descripción del servicio
  kmAtService: number;                   // KM cuando se realizó
  cost?: number;                         // Costo (opcional)
  performedAt: Timestamp;                // Fecha del servicio
  businessId?: string;                   // Ref a business si aplica
  notes?: string;                        // Notas adicionales
}

enum MaintenanceType {
  OIL_CHANGE = "OIL_CHANGE",
  TIRE_ROTATION = "TIRE_ROTATION",
  BRAKE_SERVICE = "BRAKE_SERVICE",
  FILTER_REPLACEMENT = "FILTER_REPLACEMENT",
  GENERAL_INSPECTION = "GENERAL_INSPECTION",
  DIAGNOSTIC = "DIAGNOSTIC",
  OTHER = "OTHER",
}
```

### 4.4 Subcolección `odb2Diagnostics`

```typescript
interface Odb2Diagnostic {
  id: string;
  description: string;                   // Título del diagnóstico
  kmAtService: number;                   // KM al momento del diagnóstico
  performedAt: Timestamp;
  notes: string;                         // JSON serializado de DiagnosticNotes
  iaTranslation?: string;                // Interpretación IA (si aplicable)
}

// `notes` es un JSON string que contiene:
// {
//   dtcs: ["P0101", "P0102"],
//   telemetry: {
//     rpm: 2500,
//     speed: 60,
//     coolantTemp: 95,
//     ...
//   },
//   fuelType: "GASOLINE"
// }
```

### 4.5 Subcolección `tasks`

```typescript
interface VehicleTask {
  id: string;
  type: string;                          // Tipo de tarea (string libre)
  description: string;
  scheduledDate?: string;                // ISO 8601 (YYYY-MM-DD)
  status: "PENDING" | "COMPLETED";
  createdAt: Timestamp;
}
```

### 4.6 Subcolección `documents`

```typescript
interface VehicleDocEntry {
  id: string;
  type: DocumentType;                    // DRIVERS_LICENSE, TECHNICAL_INSPECTION, etc.
  expirationDate: string;                // ISO 8601 (YYYY-MM-DD)
  notificationEnabled: boolean;          // Recordar antes de expirar?
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

enum DocumentType {
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  TECHNICAL_INSPECTION = "TECHNICAL_INSPECTION",
  INSURANCE_POLICY = "INSURANCE_POLICY",
  OTHER = "OTHER",
}
```

---

## 5. Cloud Functions - Descripción General

### 5.1 Exportadas en `index.ts`

```typescript
// ── Auth Triggers (v1) ────────────────────────────────────────
export { onUserCreated } from "./controllers/auth.controller";

// ── HTTPS Callable (v2) ───────────────────────────────────────
export {
  interpretDiagnostic,
  suggestMaintenanceTaskHandler,
} from "./controllers/ai.controller";

// ── Users ─────────────────────────────────────────────────────
export {
  getUserProfileHandler,
  updateUserProfileHandler,
  switchActiveRoleHandler,
  deleteAccountHandler,
} from "./controllers/user.controller";

// ── Vehicles ──────────────────────────────────────────────────
export {
  addVehicleHandler,
  getUserVehiclesHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
  addMaintenanceEntryHandler,
  getMaintenanceLogHandler,
  updateMaintenanceEntryHandler,
  deleteMaintenanceEntryHandler,
  addOdb2DiagnosticHandler,
  getOdb2DiagnosticsHandler,
  deleteOdb2DiagnosticHandler,
  addTaskHandler,
  getTasksHandler,
  updateTaskHandler,
  deleteTaskHandler,
  addVehicleDocHandler,
  getVehicleDocsHandler,
  updateVehicleDocHandler,
  deleteVehicleDocHandler,
} from "./controllers/vehicles.controller";
```

---

## 6. Controllers (HTTP Layer)

### 6.1 auth.controller.ts

```typescript
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const db = getFirestore();
  
  const newUserDoc: UserDocument = {
    uid: user.uid,
    profile: {
      name: user.displayName || "",
      gender: "PREFER_NOT_TO_SAY",
      age: 0,
      activeRole: "CLIENT",
    },
    stats: DEFAULT_USER_STATS,
    subscriptionTier: "FREE",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await db.collection("users").doc(user.uid).set(newUserDoc);
});
```

**Trigger:** Automático cuando un usuario se registra en Firebase Auth.

### 6.2 user.controller.ts

| Función | Método | Autenticación | Propósito |
|---|---|---|---|
| `getUserProfileHandler` | Callable (v2) | Requerida | Obtiene perfil completo |
| `updateUserProfileHandler` | Callable (v2) | Requerida | Actualiza profile + displayName |
| `switchActiveRoleHandler` | Callable (v2) | Requerida | Cambia activeRole (CLIENT → BUSINESS) |
| `deleteAccountHandler` | Callable (v2) | Requerida | Elimina usuario + todos sus datos |

**Ejemplo:**
```typescript
export const updateUserProfileHandler = onCall(
  { region: "us-central1" },
  async (request: CallableRequest<Partial<UserProfile>>) => {
    assertAuth(request);
    const uid = request.auth!.uid;
    
    // Validar con Zod
    const validated = UserProfileSchema.partial().parse(request.data);
    
    // Actualizar + sincronizar displayName en Auth
    await updateUserProfile(uid, validated);
    
    return { success: true };
  }
);
```

### 6.3 vehicles.controller.ts

**CRUD Vehículos:**
- `addVehicleHandler`: Valida límite tier, verifica patente única
- `getUserVehiclesHandler`: Lista todos los vehículos del usuario
- `updateVehicleHandler`: Actualiza datos del vehículo
- `deleteVehicleHandler`: Elimina vehículo + todas las subcolecciones

**Mantenimiento:**
- `addMaintenanceEntryHandler`: Agrega entrada al log
- `getMaintenanceLogHandler`: Lista histórico
- `updateMaintenanceEntryHandler`: Edita entrada
- `deleteMaintenanceEntryHandler`: Elimina entrada

**OBD2 Diagnósticos:**
- `addOdb2DiagnosticHandler`: Guarda resultado de sesión OBD2
- `getOdb2DiagnosticsHandler`: Lista diagnósticos
- `deleteOdb2DiagnosticHandler`: Elimina diagnóstico

**Tareas:**
- `addTaskHandler`: Crea tarea (sugerida por IA o manual)
- `getTasksHandler`: Lista tareas del vehículo
- `updateTaskHandler`: Marca como completa, etc.
- `deleteTaskHandler`: Elimina tarea

**Documentos (Certificados):**
- `addVehicleDocHandler`: Agrega documento (VTV, seguro, etc.)
- `getVehicleDocsHandler`: Lista documentos
- `updateVehicleDocHandler`: Actualiza (incluye notificaciones)
- `deleteVehicleDocHandler`: Elimina documento

---

## 7. Services (Business Logic Layer)

### 7.1 vehicles.service.ts

**Funciones principales:**

```typescript
// CRUD Vehículos
export async function addVehicle(uid: string, data: VehicleData): Promise<VehicleDocument>
export async function getUserVehicles(uid: string): Promise<VehicleDocument[]>
export async function updateVehicle(uid: string, vehicleId: string, patch: Partial<VehicleData>): Promise<void>
export async function deleteVehicle(uid: string, vehicleId: string): Promise<void>

// Mantenimiento
export async function addMaintenanceEntry(uid: string, vehicleId: string, entry: MaintenanceLogEntry): Promise<MaintenanceLogEntry>
export async function getMaintenanceLog(uid: string, vehicleId: string): Promise<MaintenanceLogEntry[]>
export async function updateMaintenanceEntry(uid: string, vehicleId: string, entryId: string, patch: Partial<MaintenanceLogEntry>): Promise<void>
export async function deleteMaintenanceEntry(uid: string, vehicleId: string, entryId: string): Promise<void>

// OBD2 Diagnostics
export async function addOdb2Diagnostic(uid: string, vehicleId: string, diagnostic: Odb2Diagnostic): Promise<Odb2Diagnostic>
export async function getOdb2Diagnostics(uid: string, vehicleId: string): Promise<Odb2Diagnostic[]>
export async function deleteOdb2Diagnostic(uid: string, vehicleId: string, diagnosticId: string): Promise<void>
```

**Validaciones clave:**
- Verificar que el vehículo pertenece al usuario (por `ownerId`)
- Verificar límites de tier
- Normalizar patentes
- Evitar duplicados (patente por usuario)

### 7.2 ai-tasks.service.ts

```typescript
export async function suggestMaintenanceTask(
  uid: string,
  vehicleId: string
): Promise<TaskSuggestion>
```

**Flujo:**
1. Verificar que el usuario es PREMIUM (sino lanzar error)
2. Leer el documento del vehículo
3. Leer el historial completo de mantenimiento
4. Leer tareas pendientes
5. Leer diagnósticos OBD2 recientes
6. Llamar a `generateObject` con schema Zod
   - Sistema: "Mecánico de Córdoba, Argentina con 20+ años"
   - Contexto: Marca, modelo, KM, historial, diagnósticos
   - Output: `{ suggestedType, description, recommendedDate, explanation }`
7. Escribir `stats.lastAiUsage` para rate limiting
8. Retornar sugerencia

**Rate Limit:**
```typescript
const lastUsage = userData.stats?.lastAiUsage;
if (lastUsage && Date.now() - lastUsage.toMillis() < RATE_LIMIT_SECONDS * 1000) {
  throw new HttpsError("resource-exhausted", "Espera antes de solicitar otra sugerencia");
}
```

### 7.3 prompt-engine.service.ts

```typescript
export async function interpretDtcCode(
  context: DiagnosticContext
): Promise<DiagnosticResult>
```

**Propósito:** Interpretar códigos DTC (P0101, P0102, etc.) con contexto enriquecido.

**Entrada:**
```typescript
interface DiagnosticContext {
  brand: string;
  model: string;
  year: number;
  currentKm?: number;
  dtcCodes: string[];                    // ["P0101", "P0102"]
  freezeFrame?: Record<string, any>;     // Datos del motor en el error
}
```

**Salida:**
```typescript
interface DiagnosticResult {
  interpretation: string;                // Explicación del problema
  severity: "low" | "medium" | "high";
  recommendations: string[];
}
```

### 7.4 tasks.service.ts

```typescript
export async function addTask(uid: string, vehicleId: string, task: VehicleTask): Promise<VehicleTask>
export async function getTasks(uid: string, vehicleId: string): Promise<VehicleTask[]>
export async function updateTask(uid: string, vehicleId: string, taskId: string, patch: Partial<VehicleTask>): Promise<void>
export async function deleteTask(uid: string, vehicleId: string, taskId: string): Promise<void>
```

---

## 8. Validación (Zod Schemas)

### 8.1 Ejemplo: UserProfileSchema

```typescript
import { z } from "zod";

const UserGenderEnum = z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);
const UserRoleEnum = z.enum(["CLIENT", "BUSINESS"]);

const UserProfileSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  gender: UserGenderEnum,
  age: z.number().int().min(0).max(150),
  activeRole: UserRoleEnum,
  country: z.string().optional(),
});

// En controlador:
const validated = UserProfileSchema.parse(request.data);
// Si hay error, Zod lanza automáticamente
```

### 8.2 Validación en Controllers

```typescript
export const addVehicleHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<VehicleData>) => {
    assertAuth(request);
    
    // Validación básica manual (sin Zod para este ejemplo)
    const { brand, model, year, licensePlate, currentKm } = request.data;
    if (!brand || !model || !year || !licensePlate || currentKm == null) {
      throw new HttpsError("invalid-argument", "Campos requeridos: ...");
    }
    
    // Lógica delegada al service
    return addVehicle(request.auth!.uid, request.data);
  }
);
```

---

## 9. Manejo de Errores

### 9.1 Usar HttpsError siempre

```typescript
// ❌ MAL
throw new Error("Usuario no encontrado");

// ✅ BIEN
throw new HttpsError("not-found", "Usuario no encontrado");
```

### 9.2 Códigos de error HTTP mapping

| Código | Uso |
|---|---|
| `invalid-argument` | Validación fallida (entrada inválida) |
| `not-found` | Recurso no existe |
| `already-exists` | Duplicado (patente, documento, etc.) |
| `unauthenticated` | Falta autenticación |
| `permission-denied` | No tiene permisos (ej. no es PREMIUM) |
| `resource-exhausted` | Límite alcanzado (vehículos, rate limit) |
| `internal` | Error inesperado |

---

## 10. Integración de IA (Vercel AI SDK)

### 10.1 Setup

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const taskSuggestionSchema = z.object({
  suggestedType: z.string(),
  description: z.string(),
  recommendedDate: z.string(),
  explanation: z.string(),
});

export type TaskSuggestion = z.infer<typeof taskSuggestionSchema>;
```

### 10.2 Llamada a OpenAI

```typescript
const result = await generateObject({
  model: openai("gpt-4o-mini"),
  system: SYSTEM_PROMPT,  // "Sos un mecánico de Córdoba..."
  prompt: `
    Vehículo: ${brand} ${model} (${year})
    KM Actuales: ${currentKm}
    Último Mantenimiento: ${lastMaintenance}
    Tareas Pendientes: ${pendingTasks.join(", ")}
    Diagnósticos Recientes: ${recentDiagnostics.join(", ")}
    
    Sugiere la próxima tarea de mantenimiento más importante.
  `,
  schema: taskSuggestionSchema,
});

return result.object as TaskSuggestion;
```

### 10.3 Restricciones

- **Autenticación requerida:** Siempre
- **Tier requerido:** PREMIUM
- **Rate limit:** 1 llamada cada 60 segundos por usuario
- **Costo:** Registrar `stats.lastAiUsage` para auditoría

---

## 11. Ciclos de Transacciones Atómicas

### 11.1 Patrón: Batch Write

```typescript
// Al agregar vehículo: actualizar vehículo + stats en una transacción
const batch = db.batch();

batch.set(vehicleRef, newVehicle);
batch.update(userRef, {
  "stats.vehicleCount": FieldValue.increment(1),
  "updatedAt": Timestamp.now(),
});

await batch.commit();  // Atómico: ambas operaciones o ninguna
```

### 11.2 Race Condition Safety

```typescript
// ❌ INSEGURO: Leer, modificar, escribir sin control
const doc = await ref.get();
const data = doc.data();
data.count += 1;
await ref.set(data);  // ¿Qué pasó entre get y set?

// ✅ SEGURO: Usar FieldValue.increment() o transacciones
await ref.update({
  count: FieldValue.increment(1),
});
```

---

## 12. Configuración y Variables de Entorno

### 12.1 firebase.json (emulador local)

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 }
  }
}
```

### 12.2 Ejecutar localmente

```bash
cd functions
npm install
npm run build
npm run serve  # Inicia emulador + watchers
```

### 12.3 Desplegar a producción

```bash
firebase deploy --only functions
```

---

## 13. Testing

### 13.1 Firebase Functions Test SDK

```typescript
import * as functionsTest from "firebase-functions-test";

const wrapped = functionsTest.wrap(require("./index").onUserCreated);

it("should create user document on signup", async () => {
  const user = { uid: "test123", displayName: "Test User" };
  await wrapped(user);
  
  const userDoc = await admin.firestore().collection("users").doc("test123").get();
  expect(userDoc.exists).toBe(true);
});
```

---

## 14. Monitoreo & Logs

### 14.1 Ver logs en consola

```bash
firebase functions:log
```

### 14.2 Loggear dentro de funciones

```typescript
import * as functions from "firebase-functions";

functions.logger.info("Usuario creado", { uid, name });
functions.logger.error("Error al agregar vehículo", error);
```

### 14.2 Métricas importantes a monitorear

- Cantidad de llamadas a IA (costo)
- Tasa de errores por tipo
- Tiempo de respuesta (p95, p99)
- Uso de almacenamiento Firestore

---

## 15. Próximos Pasos y Mejoras Futuras

1. **Businesses & Appointments:** Implementar modelo de negocios (talleres) y sistema de turnos
2. **Push Notifications:** FCM para recordatorios de mantenimiento
3. **Auditoría:** Logging detallado de cambios para cumplimiento
4. **Escalabilidad:** Considerar Firestore partitioning para collections grandes
5. **Machine Learning:** Predicción de mantenimiento basada en historial del usuario

---

## 16. Referencias y Documentos Relacionados

- [`project-context.md`](./project-context.md) — Reglas críticas de desarrollo
- [`mobile-architecture.md`](./mobile-architecture.md) — Cliente móvil
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Vercel AI SDK Docs](https://sdk.vercel.ai)
- Memoria: `MEMORY.md`
